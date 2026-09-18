import { useEffect, useRef, useState } from "react";
import creditCoin from "@/assets/credit-coin.png";
import { useCredits } from "@/context/CreditContext";
import HugeiconsIcon from "@/components/ui/HugeiconsIcon";

const transactionLabel = (item: any) => {
  if (item.kind === "welcome") return "Welcome credits";
  if (item.kind === "daily_refill") return "Daily refill";
  if (item.kind === "admin_adjustment") return item.reason || "Admin adjustment";
  return item.actionKey?.replaceAll("_", " ") || "AI action";
};

export default function CreditWalletButton() {
  const { wallet, transactions, loading, walletOpenRequest, refresh, loadTransactions } = useCredits();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (walletOpenRequest > 0) setOpen(true);
  }, [walletOpenRequest]);

  useEffect(() => {
    if (!open) return;
    refresh().catch(() => undefined);
    loadTransactions().catch(() => undefined);
    const close = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open, loadTransactions, refresh]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex h-8 items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 text-xs font-bold text-on-surface shadow-2xs transition hover:bg-amber-400/15"
        title="Credit wallet"
      >
        <img src={creditCoin} alt="Credits" className="h-5 w-5" />
        <span>{loading && !wallet ? "—" : wallet?.total ?? 0}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-[min(22rem,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border border-outline-variant/80 bg-surface shadow-2xl">
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
          <div className="border-t border-outline-variant/60 px-3 py-2">
            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Recent activity</p>
            <div className="max-h-48 overflow-y-auto">
              {transactions.length ? transactions.slice(0, 6).map((item: any) => {
                const delta = ["refunded", "cancelled"].includes(item.status)
                  ? 0
                  : (item.promotionalDelta || 0) + (item.purchasedDelta || 0) - (item.chargedCost || 0);
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
          <p className="border-t border-outline-variant/60 px-4 py-2.5 text-[10px] leading-relaxed text-on-surface-variant">
            Promotional credits refill up to {wallet?.dailyRefillTarget ?? 20} each day and are used first.
          </p>
        </div>
      )}
    </div>
  );
}
