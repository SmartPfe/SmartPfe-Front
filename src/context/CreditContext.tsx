import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  CREDITS_UPDATED_EVENT,
  CREDIT_ERROR_EVENT,
  fetchApi,
  registerCreditPolicies,
} from "@/lib/api";

export type CreditWallet = {
  promotional: number;
  purchased: number;
  total: number;
  dailyRefillTarget: number;
  dailyRefillClaimed: boolean;
  timezone: string;
  freeUsage?: Record<string, number>;
};

export type CreditPolicy = {
  key: string;
  label: string;
  group: string;
  cost: number;
  freeUsesPerDay: number;
  enabled: boolean;
  version: number;
};

type CreditTransaction = {
  _id: string;
  kind: string;
  actionKey: string;
  chargedCost: number;
  promotionalDelta: number;
  purchasedDelta: number;
  status: string;
  reason?: string;
  createdAt: string;
};

type CreditContextValue = {
  wallet: CreditWallet | null;
  policies: CreditPolicy[];
  transactions: CreditTransaction[];
  loading: boolean;
  walletOpenRequest: number;
  refresh: () => Promise<void>;
  loadTransactions: () => Promise<void>;
  getPolicy: (key?: string) => CreditPolicy | undefined;
};

const CreditContext = createContext<CreditContextValue | null>(null);

export function CreditProvider({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [wallet, setWallet] = useState<CreditWallet | null>(null);
  const [policies, setPolicies] = useState<CreditPolicy[]>([]);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [walletOpenRequest, setWalletOpenRequest] = useState(0);

  const refresh = useCallback(async () => {
    if (!localStorage.getItem("token") || !location.pathname.startsWith("/workspace")) return;
    setLoading(true);
    try {
      const [walletResult, catalogResult] = await Promise.all([
        fetchApi("/credits/me"),
        fetchApi("/credits/catalog"),
      ]);
      setWallet(walletResult.wallet);
      setPolicies(catalogResult.policies || []);
      registerCreditPolicies(catalogResult.policies || []);
    } finally {
      setLoading(false);
    }
  }, [location.pathname]);

  const loadTransactions = useCallback(async () => {
    if (!localStorage.getItem("token")) return;
    const result = await fetchApi("/credits/transactions?limit=12");
    setTransactions(result.items || []);
  }, []);

  useEffect(() => {
    if (location.pathname.startsWith("/workspace")) refresh().catch(() => undefined);
  }, [location.pathname, refresh]);

  useEffect(() => {
    const handleUpdate = (event: Event) => {
      const detail = (event as CustomEvent)?.detail;
      const balance = detail?.balance;
      if (detail?.freeQuotaUsed) refresh().catch(() => undefined);
      else if (balance) setWallet((current) => current ? { ...current, ...balance } : balance);
      else refresh().catch(() => undefined);
    };
    const handleError = () => {
      setWalletOpenRequest((value) => value + 1);
      refresh().catch(() => undefined);
    };
    window.addEventListener(CREDITS_UPDATED_EVENT, handleUpdate);
    window.addEventListener(CREDIT_ERROR_EVENT, handleError);
    return () => {
      window.removeEventListener(CREDITS_UPDATED_EVENT, handleUpdate);
      window.removeEventListener(CREDIT_ERROR_EVENT, handleError);
    };
  }, [refresh]);

  const getPolicy = useCallback((key?: string) => policies.find((policy) => policy.key === key), [policies]);
  const value = useMemo(() => ({
    wallet,
    policies,
    transactions,
    loading,
    walletOpenRequest,
    refresh,
    loadTransactions,
    getPolicy,
  }), [wallet, policies, transactions, loading, walletOpenRequest, refresh, loadTransactions, getPolicy]);

  return <CreditContext.Provider value={value}>{children}</CreditContext.Provider>;
}

export const useCredits = () => {
  const value = useContext(CreditContext);
  if (!value) throw new Error("useCredits must be used inside CreditProvider");
  return value;
};
