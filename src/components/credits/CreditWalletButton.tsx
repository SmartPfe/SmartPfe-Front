import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import CreditDialog from "./CreditDialog";
import { CREDIT_HISTORY_PATH, creditMoney, transactionLabel, transactionDelta, type CreditRequest } from "@/lib/creditHistory";
import creditCoin from "@/assets/credit-coin.png";
import { useCredits } from "@/context/CreditContext";
import HugeiconsIcon from "@/components/ui/HugeiconsIcon";
import { fetchApi } from "@/lib/api";
import { cn } from "@/lib/utils";

type PurchasePackage = {
  key: string;
  label: string;
  credits: number;
  price: number;
  currency: string;
};

const statusTone: Record<string, string> = {
  PENDING: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  CONFIRMED: "bg-primary/10 text-primary",
  COMPLETED: "bg-secondary/10 text-secondary",
  CANCELLED: "bg-error/10 text-error",
};

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value));

const readCurrentUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    return {};
  }
};

const readCurrentUserId = () => {
  const user = readCurrentUser();
  return String(user._id || user.id || "");
};

export default function CreditWalletButton() {
  const { wallet, transactions, loading, walletOpenRequest, refresh, loadTransactions } = useCredits();
  const [open, setOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [requests, setRequests] = useState<CreditRequest[]>([]);
  const [options, setOptions] = useState<{ pricePerCredit: number; currency: string; packages: PurchasePackage[] } | null>(null);
  const [requestLoading, setRequestLoading] = useState(false);
  const [confirmation, setConfirmation] = useState<{ request: CreditRequest; studentEmailSent: boolean } | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const loadRequests = async () => {
    const userIdAtRequestStart = readCurrentUserId();
    setRequests([]);
    const data = await fetchApi("/credits/requests/my?limit=3");
    if (userIdAtRequestStart !== readCurrentUserId()) return;
    setRequests(data.requests || []);
  };

  const loadPurchaseOptions = async () => {
    const data = await fetchApi("/credits/purchase-options");
    setOptions(data);
  };

  const openRequestModal = () => {
    setOpen(false);
    setModalOpen(true);
    if (!options) loadPurchaseOptions().catch(() => undefined);
  };

  useEffect(() => {
    const openModal = () => { setOpen(false); setModalOpen(true); loadPurchaseOptions().catch(() => undefined); };
    window.addEventListener("open-credit-request", openModal);
    return () => window.removeEventListener("open-credit-request", openModal);
  }, []);

  useEffect(() => {
    if (walletOpenRequest > 0) setOpen(true);
  }, [walletOpenRequest]);

  useEffect(() => {
    if (!open) return;
    refresh().catch(() => undefined);
    loadTransactions().catch(() => undefined);
    loadRequests().catch(() => undefined);
    loadPurchaseOptions().catch(() => undefined);
    const close = (event: MouseEvent) => {
      if (modalOpen) return;
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open, modalOpen, loadTransactions, refresh]);

  const handleSubmitted = (result: { request: CreditRequest; studentEmailSent: boolean }) => {
    setConfirmation(result);
    setModalOpen(false);
    setOpen(false);
    window.dispatchEvent(new Event("credit-requests-updated"));
    loadRequests().catch(() => undefined);
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex h-8 items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 text-xs font-bold text-on-surface shadow-2xs transition hover:bg-amber-400/15"
        title="Credit wallet"
      >
        <img src={creditCoin} alt="Credits" className="h-5 w-5" />
        <span>{loading && !wallet ? "-" : wallet?.total ?? 0}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-[min(24rem,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border border-outline-variant/80 bg-surface shadow-2xl">
          <div className="flex items-center justify-between border-b border-outline-variant/60 bg-gradient-to-br from-amber-400/15 to-primary/5 p-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">Available credits</p>
              <div className="mt-1 flex items-center gap-2">
                <img src={creditCoin} alt="" className="h-8 w-8" />
                <span className="text-2xl font-extrabold text-on-surface">{wallet?.total ?? 0}</span>
              </div>
            </div>
            <button type="button" onClick={() => setOpen(false)} className="grid h-8 w-8 place-items-center rounded-lg text-on-surface-variant hover:bg-surface/70" aria-label="Close wallet">
              <HugeiconsIcon icon="close" size={16} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 p-3">
            <div className="rounded-xl bg-surface-container-low p-3">
              <p className="text-[10px] font-bold uppercase text-on-surface-variant">Daily & welcome</p>
              <p className="mt-1 text-lg font-bold text-on-surface">{wallet?.promotional ?? 0}</p>
            </div>
            <div className="rounded-xl bg-surface-container-low p-3">
              <p className="text-[10px] font-bold uppercase text-on-surface-variant">Purchased</p>
              <p className="mt-1 text-lg font-bold text-on-surface">{wallet?.purchased ?? 0}</p>
            </div>
          </div>

          <div className="px-3 pb-3">
            <button
              type="button"
              onClick={openRequestModal}
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-primary text-xs font-extrabold text-on-primary shadow-xs transition hover:bg-primary/90"
            >
              <HugeiconsIcon icon="coin" size={16} />
              <span>Add More Credits</span>
            </button>
          </div>

          <div className="border-t border-outline-variant/60 px-3 py-2">
            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Latest requests</p>
            <div className="max-h-40 overflow-y-auto">
              {requests.length ? requests.slice(0, 3).map((item) => (
                <Link key={item._id} to={`${CREDIT_HISTORY_PATH}?request=${item._id}`} onClick={() => setOpen(false)} className="flex items-center justify-between gap-3 rounded-lg border-b border-outline-variant/40 px-1 py-2 transition hover:bg-primary/5 last:border-0">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-on-surface">{item.requestedCredits} credits · {item.price} {item.currency}</p>
                    <p className="text-[10px] text-on-surface-variant">{formatDate(item.createdAt)}</p>
                  </div>
                  <span className={cn("shrink-0 rounded-md px-2 py-0.5 text-[9px] font-extrabold", statusTone[item.status])}>
                    {item.status.toLowerCase()}
                  </span>
                </Link>
              )) : <p className="py-3 text-xs text-on-surface-variant">No credit requests yet.</p>}
            </div>
          </div>

          <div className="border-t border-outline-variant/60 px-3 py-2">
            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Recent activity</p>
            <div className="max-h-44 overflow-y-auto">
              {transactions.length ? transactions.slice(0, 3).map((item: any) => {
                const delta = transactionDelta(item);
                return (
                  <div key={item._id} className="flex items-center justify-between gap-3 border-b border-outline-variant/40 py-2 last:border-0">
                    <span className="truncate text-xs font-medium capitalize text-on-surface">{transactionLabel(item)}</span>
                    <span className={`text-xs font-bold ${delta > 0 ? "text-secondary" : delta < 0 ? "text-on-surface" : "text-on-surface-variant"}`}>
                      {delta > 0 ? "+" : ""}{delta}
                    </span>
                  </div>
                );
              }) : <p className="py-3 text-xs text-on-surface-variant">No credit activity yet.</p>}
            </div>
          </div>

          <Link to={CREDIT_HISTORY_PATH} onClick={() => setOpen(false)} className="flex items-center justify-between border-t border-outline-variant/60 px-4 py-3 text-xs font-bold text-primary hover:bg-primary/5">
            View full credit history <HugeiconsIcon icon="arrow-right" size={15} />
          </Link>
          <p className="border-t border-outline-variant/60 px-4 py-2.5 text-[10px] leading-relaxed text-on-surface-variant">
            Promotional credits refill up to {wallet?.dailyRefillTarget ?? 20} each day and are used first.
          </p>
        </div>
      )}

      {modalOpen && (
        <CreditRequestModal
          options={options}
          submitting={requestLoading}
          setSubmitting={setRequestLoading}
          onClose={() => setModalOpen(false)}
          onSubmitted={handleSubmitted}
        />
      )}
      {confirmation && (
        <CreditDialog titleId="credit-success-title" onClose={() => setConfirmation(null)}>
          <div className="overflow-y-auto p-6 text-center sm:p-8">
            <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-full border border-secondary/25 bg-secondary/10 text-secondary">
              <HugeiconsIcon icon="checkmark-circle-02" size={34} />
            </div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-secondary">Request received</p>
            <h2 id="credit-success-title" className="mt-2 text-2xl font-extrabold text-on-surface">You're all set!</h2>
            <p className="mt-3 text-sm leading-relaxed text-on-surface-variant">Your credit request has been submitted successfully. A team member will contact you as soon as possible to explain the payment steps.</p>
            <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">Your credits will be added to your wallet after your payment is verified.</p>
            <div className="mt-5 flex items-center justify-between gap-3 rounded-2xl border border-outline-variant bg-surface-container-low p-4 text-left">
              <span className="flex items-center gap-2 text-sm font-bold text-on-surface"><img src={creditCoin} alt="" className="h-6 w-6" />{confirmation.request.requestedCredits} credits</span>
              <span className="text-sm font-bold text-on-surface">{creditMoney(confirmation.request.price, confirmation.request.currency)}</span>
            </div>
            <p className={cn("mt-4 text-xs leading-relaxed", confirmation.studentEmailSent ? "text-on-surface-variant" : "text-amber-700 dark:text-amber-300")}>
              {confirmation.studentEmailSent ? "A receipt with your request details has been sent to your email. You can also track your request in Credit History." : "Your request is saved, but we couldn't send your receipt email. All your request details are available in Credit History."}
            </p>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row">
              <button type="button" onClick={() => setConfirmation(null)} className="h-11 flex-1 rounded-xl border border-outline-variant text-sm font-bold text-on-surface hover:bg-surface-container">Got it</button>
              <Link to={`${CREDIT_HISTORY_PATH}?request=${confirmation.request._id}`} onClick={() => setConfirmation(null)} className="flex h-11 flex-1 items-center justify-center rounded-xl bg-primary text-sm font-bold text-on-primary hover:bg-primary/90">Track my request</Link>
            </div>
          </div>
        </CreditDialog>
      )}
    </div>
  );
}

function CreditRequestModal({
  options,
  submitting,
  setSubmitting,
  onClose,
  onSubmitted,
}: {
  options: { pricePerCredit: number; currency: string; packages: PurchasePackage[] } | null;
  submitting: boolean;
  setSubmitting: (value: boolean) => void;
  onClose: () => void;
  onSubmitted: (result: { request: CreditRequest; studentEmailSent: boolean }) => void;
}) {
  const user = readCurrentUser();
  const packages = options?.packages || [];
  const [mode, setMode] = useState(packages[0]?.key || "custom");
  const [customCredits, setCustomCredits] = useState(100);
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (packages.length && mode === "custom") setMode(packages[0].key);
  }, [packages.length]);

  const selectedPackage = packages.find((item) => item.key === mode);
  const isCustom = mode === "custom";
  const requestedCredits = selectedPackage?.credits || Math.max(0, Math.trunc(Number(customCredits) || 0));
  const price = useMemo(() => {
    if (selectedPackage) return selectedPackage.price;
    return Math.round(requestedCredits * (options?.pricePerCredit || 0) * 100) / 100;
  }, [options?.pricePerCredit, requestedCredits, selectedPackage]);
  const currency = selectedPackage?.currency || options?.currency || "TND";

  const submit = async () => {
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 6 || digits.length > 15) {
      setError("Enter a valid phone number so the admin can contact you.");
      return;
    }
    if (!options) { setError("Purchase options are still loading. Please try again in a moment."); return; }
    if (!requestedCredits || requestedCredits <= 0 || requestedCredits > 100000) {
      setError("Choose between 1 and 100,000 credits.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const data = await fetchApi("/credits/requests", {
        method: "POST",
        body: JSON.stringify({
          phone,
          packageKey: isCustom ? "" : mode,
          credits: isCustom ? requestedCredits : undefined,
        }),
      });
      onSubmitted({ request: data.request, studentEmailSent: data.studentEmailSent === true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit your credit request.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <CreditDialog titleId="credit-request-title" onClose={onClose} busy={submitting}>
        <header className="flex items-start justify-between gap-3 border-b border-outline-variant/60 bg-surface-container-low/50 p-4">
          <div className="min-w-0">
            <p id="credit-request-title" className="text-sm font-extrabold text-on-surface">Add More Credits</p>
            <p className="text-xs leading-relaxed text-on-surface-variant">Our team will contact you with payment instructions. Credits are added after payment is verified.</p>
          </div>
          <button type="button" onClick={onClose} disabled={submitting} className="grid h-8 w-8 place-items-center rounded-lg text-on-surface-variant hover:bg-surface-container disabled:opacity-50" aria-label="Close">
            <HugeiconsIcon icon="close" size={16} />
          </button>
        </header>

        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-error/30 bg-error/10 px-3 py-2 text-xs font-semibold text-error">
              <HugeiconsIcon icon="alert-circle" size={15} />
              <span>{error}</span>
            </div>
          )}

          <label className="block text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
            Student email
            <input
              value={user.email || ""}
              readOnly
              className="mt-1 h-10 w-full rounded-xl border border-outline-variant bg-surface-container-low px-3 text-sm font-semibold text-on-surface outline-none"
            />
          </label>

          <label className="block text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
            Phone number <span className="text-error">*</span>
            <input
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="+216 00 000 000"
              className="mt-1 h-10 w-full rounded-xl border border-outline-variant bg-surface px-3 text-sm text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </label>

          <section>
            <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Credit purchase mode</p>
            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {packages.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setMode(item.key)}
                  className={cn(
                    "rounded-xl border p-3 text-left transition",
                    mode === item.key ? "border-primary bg-primary/10 text-primary" : "border-outline-variant bg-surface-container-lowest text-on-surface hover:border-primary/40"
                  )}
                >
                  <span className="block text-sm font-extrabold">{item.credits} credits</span>
                  <span className="mt-1 block text-xs font-semibold text-on-surface-variant">{item.price} {item.currency}</span>
                </button>
              ))}
              <button
                type="button"
                onClick={() => setMode("custom")}
                className={cn(
                  "rounded-xl border p-3 text-left transition",
                  isCustom ? "border-primary bg-primary/10 text-primary" : "border-outline-variant bg-surface-container-lowest text-on-surface hover:border-primary/40"
                )}
              >
                <span className="block text-sm font-extrabold">Custom amount</span>
                <span className="mt-1 block text-xs font-semibold text-on-surface-variant">{options?.pricePerCredit ?? 0.05} {currency} / credit</span>
              </button>
            </div>
          </section>

          {isCustom && (
            <label className="block text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
              Desired credits
              <input
                type="number"
                min="1"
                max="100000"
                step="1"
                value={customCredits}
                onChange={(event) => setCustomCredits(Math.max(0, Math.trunc(Number(event.target.value) || 0)))}
                className="mt-1 h-10 w-full rounded-xl border border-outline-variant bg-surface px-3 font-mono text-sm font-bold text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </label>
          )}

          <div className="rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-bold text-on-surface-variant">Credits requested</span>
              <span className="font-mono text-lg font-extrabold text-on-surface">{requestedCredits.toLocaleString()}</span>
            </div>
            <div className="mt-2 flex items-center justify-between gap-3">
              <span className="text-xs font-bold text-on-surface-variant">Estimated price</span>
              <span className="font-mono text-lg font-extrabold text-on-surface">{price.toLocaleString()} {currency}</span>
            </div>
          </div>
        </div>

        <footer className="flex flex-col-reverse gap-2 border-t border-outline-variant/60 bg-surface-container-low/40 p-4 sm:flex-row sm:items-center sm:justify-end">
          <button type="button" onClick={onClose} disabled={submitting} className="h-10 w-full rounded-xl border border-outline-variant bg-surface px-4 text-xs font-bold text-on-surface hover:bg-surface-container disabled:opacity-50 sm:w-auto">
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={submitting || !options}
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-xs font-extrabold text-on-primary shadow-xs hover:bg-primary/90 disabled:opacity-50 sm:w-auto"
          >
            {submitting && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}
            <span>{submitting ? "Submitting..." : "Submit Request"}</span>
          </button>
        </footer>
    </CreditDialog>
  );
}
