import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import HugeiconsIcon from "@/components/ui/HugeiconsIcon";
import CreditDialog from "@/components/credits/CreditDialog";
import creditCoin from "@/assets/credit-coin.png";
import { fetchApi } from "@/lib/api";
import { useCredits } from "@/context/CreditContext";
import { cn } from "@/lib/utils";
import { creditDate, creditMoney, requestStatusDescription, requestStatusTone, transactionDelta, transactionLabel, type CreditRequest, type CreditTransaction } from "@/lib/creditHistory";

type HistoryPage = { items: (CreditRequest | CreditTransaction)[]; total: number; page: number; pages: number; limit: number };
const controlClass = "mt-1 h-10 w-full rounded-xl border border-outline-variant bg-surface px-3 text-sm text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";
const labelClass = "text-[10px] font-bold uppercase tracking-wider text-on-surface-variant";
const buttonClass = "inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-outline-variant bg-surface px-4 text-xs font-bold text-on-surface transition hover:bg-surface-container disabled:opacity-40";
const statuses = { requests: ["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"], transactions: ["settled", "reserved", "refunded", "cancelled", "pending"] };
const kinds = { welcome: "Welcome credits", daily_refill: "Daily refill", usage: "AI usage", purchase: "Purchase", admin_adjustment: "Wallet adjustment / purchase", refund: "Refund" };

export default function CreditHistory() {
  const [params, setParams] = useSearchParams();
  const section = params.get("view") === "transactions" ? "transactions" : "requests";
  const requestId = params.get("request");
  const { wallet, refresh } = useCredits();
  const [status, setStatus] = useState("ALL");
  const [kind, setKind] = useState("ALL");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [history, setHistory] = useState<HistoryPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const [selectedRequest, setSelectedRequest] = useState<CreditRequest | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<CreditTransaction | null>(null);
  const [requestError, setRequestError] = useState("");
  const [requestLoading, setRequestLoading] = useState(false);

  useEffect(() => { setStatus("ALL"); setKind("ALL"); setPage(1); }, [section]);

  useEffect(() => {
    const timer = window.setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    let active = true;
    const query = new URLSearchParams({ section, page: String(page), limit: "10" });
    if (status !== "ALL" && statuses[section].includes(status)) query.set("status", status);
    if (kind !== "ALL" && section === "transactions") query.set("kind", kind);
    if (debouncedSearch.trim()) query.set("search", debouncedSearch.trim());
    if (dateFrom) query.set("dateFrom", dateFrom);
    if (dateTo) query.set("dateTo", dateTo);
    setLoading(true); setError("");
    fetchApi(`/credits/history?${query}`).then((data) => {
      if (active) setHistory(data);
    }).catch((err) => {
      if (active) { setHistory(null); setError(err instanceof Error ? err.message : "Could not load credit history."); }
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [section, status, kind, debouncedSearch, dateFrom, dateTo, page, revision]);

  useEffect(() => {
    const reload = () => { setRevision((value) => value + 1); refresh().catch(() => undefined); };
    window.addEventListener("credit-requests-updated", reload);
    window.addEventListener("focus", reload);
    return () => { window.removeEventListener("credit-requests-updated", reload); window.removeEventListener("focus", reload); };
  }, [refresh]);

  useEffect(() => {
    let active = true;
    setSelectedRequest(null); setRequestError(""); setRequestLoading(Boolean(requestId));
    if (requestId) fetchApi(`/credits/requests/${encodeURIComponent(requestId)}`).then((data) => {
      if (active) setSelectedRequest(data.request);
    }).catch((err) => { if (active) setRequestError(err instanceof Error ? err.message : "Could not load this request."); })
      .finally(() => { if (active) setRequestLoading(false); });
    return () => { active = false; };
  }, [requestId, revision]);

  const resetFilters = () => { setStatus("ALL"); setKind("ALL"); setSearch(""); setDebouncedSearch(""); setDateFrom(""); setDateTo(""); setPage(1); };
  const changeSection = (view: string) => {
    resetFilters(); setHistory(null); setSelectedTransaction(null);
    setParams(view === "transactions" ? { view } : {});
  };
  const closeRequest = () => { const next = new URLSearchParams(params); next.delete("request"); setParams(next, { replace: true }); };
  const hasFilters = status !== "ALL" || kind !== "ALL" || Boolean(search || dateFrom || dateTo);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-5 pb-24 pt-2">
      <Link to="/workspace/settings" className="inline-flex w-fit items-center gap-1.5 text-xs font-semibold text-on-surface-variant hover:text-primary"><HugeiconsIcon icon="arrow-left" size={15} />Back to Settings</Link>
      <header className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div><p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-primary">Your wallet</p><h1 className="mt-1 text-2xl font-extrabold text-on-surface">Credit History</h1><p className="mt-1 text-sm text-on-surface-variant">Track your requests, deposits and credit usage in one place.</p></div>
        <div className="flex shrink-0 gap-2">
          <button className={buttonClass} onClick={() => { setRevision((value) => value + 1); refresh().catch(() => undefined); }} disabled={loading} aria-label="Refresh credit history"><HugeiconsIcon icon="refresh" size={16} />Refresh</button>
          <button className="inline-flex h-10 items-center gap-2 whitespace-nowrap rounded-xl bg-primary px-4 text-xs font-bold text-on-primary hover:bg-primary/90" onClick={() => window.dispatchEvent(new Event("open-credit-request"))}><HugeiconsIcon icon="coin" size={16} />Request credits</button>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[["Available credits", wallet?.total], ["Daily & welcome", wallet?.promotional], ["Purchased credits", wallet?.purchased]].map(([label, value], index) => (
          <div key={String(label)} className={cn("rounded-2xl border p-4", index === 0 ? "border-amber-400/30 bg-amber-400/10" : "border-outline-variant/80 bg-surface-container-lowest")}>
            <p className={labelClass}>{label}</p><div className="mt-2 flex items-center gap-2"><img src={creditCoin} alt="" className="h-7 w-7" /><span className="text-2xl font-extrabold tabular-nums text-on-surface">{typeof value === "number" ? value.toLocaleString() : "—"}</span></div>
          </div>
        ))}
      </div>

      <div className="flex items-start gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-4">
        <HugeiconsIcon icon="information-circle" size={20} className="mt-0.5 shrink-0 text-primary" />
        <p className="text-xs leading-relaxed text-on-surface-variant"><strong className="text-on-surface">How credit requests work</strong><br />A team member will contact you with payment instructions. Once your payment is verified, the administrator adds the credits to your wallet. Follow each step in your request details below.</p>
      </div>

      <section className="overflow-hidden rounded-2xl border border-outline-variant/80 bg-surface-container-lowest shadow-2xs">
        <div className="flex gap-1 border-b border-outline-variant/60 p-2" role="tablist" aria-label="Credit history">
          {[['requests', 'Purchase requests', 'coin'], ['transactions', 'Wallet activity', 'history']].map(([value, label, icon]) => (
            <button key={value} id={`credit-tab-${value}`} role="tab" aria-selected={section === value} aria-controls="credit-history-panel" className={cn("inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-3 text-xs font-bold transition sm:flex-none sm:px-5", section === value ? "bg-primary/10 text-primary" : "text-on-surface-variant hover:bg-surface-container")} onClick={() => changeSection(value)}><HugeiconsIcon icon={icon} size={16} />{label}</button>
          ))}
        </div>
        <div className="border-b border-outline-variant/60 bg-surface-container-low/30 p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className={cn(labelClass, "lg:col-span-2")}>Search<input className={controlClass} value={search} onChange={(event) => setSearch(event.target.value)} placeholder={section === "requests" ? "Request ID, package or credit amount" : "Activity, reason or reference"} type="search" /></label>
            <label className={labelClass}>Status<select className={controlClass} value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}><option value="ALL">All statuses</option>{statuses[section].map((value) => <option key={value} value={value}>{value.charAt(0).toUpperCase() + value.slice(1).toLowerCase()}</option>)}</select></label>
            {section === "transactions" ? <label className={labelClass}>Activity type<select className={controlClass} value={kind} onChange={(event) => { setKind(event.target.value); setPage(1); }}><option value="ALL">All activity</option>{Object.entries(kinds).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label> : <div className="flex items-end"><button className={cn(buttonClass, "w-full")} disabled={!hasFilters} onClick={resetFilters}>Clear filters</button></div>}
            <label className={labelClass}>From (UTC)<input type="date" className={controlClass} value={dateFrom} onChange={(event) => { setDateFrom(event.target.value); setPage(1); }} /></label>
            <label className={labelClass}>To (UTC)<input type="date" className={controlClass} value={dateTo} min={dateFrom || undefined} onChange={(event) => { setDateTo(event.target.value); setPage(1); }} /></label>
            <p className="self-end pb-2 text-[11px] leading-relaxed text-on-surface-variant">All dates are shown in UTC. Select a row to see its details.</p>
            {section === "transactions" && <div className="flex items-end"><button className={cn(buttonClass, "w-full")} disabled={!hasFilters} onClick={resetFilters}>Clear filters</button></div>}
          </div>
        </div>
        <div id="credit-history-panel" role="tabpanel" aria-labelledby={`credit-tab-${section}`} aria-busy={loading}>
          {error ? <div role="alert" className="p-8 text-center"><p className="text-sm text-error">{error}</p><button className={cn(buttonClass, "mt-4")} onClick={() => setRevision((value) => value + 1)}>Try again</button></div>
            : loading ? <div role="status" className="p-12 text-center text-sm text-on-surface-variant">Loading your history…</div>
            : !history?.items.length ? <div className="p-10 text-center"><HugeiconsIcon icon={hasFilters ? "search" : "wallet-02"} size={30} className="mx-auto mb-3 text-on-surface-variant" /><p className="text-sm font-bold text-on-surface">{hasFilters ? "No matching records" : section === "requests" ? "No credit requests yet" : "No wallet activity yet"}</p><p className="mt-2 text-xs text-on-surface-variant">{hasFilters ? "Try a different date range or clear your filters." : section === "requests" ? "Your credit purchase requests and their progress will appear here." : "Credits received and used will appear here."}</p>{hasFilters && <button className={cn(buttonClass, "mt-4")} onClick={resetFilters}>Clear filters</button>}</div>
            : <>
              <div className="hidden grid-cols-[minmax(0,1fr)_8rem_9rem_7rem_2rem] gap-3 border-b border-outline-variant/60 px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant xl:grid"><span>{section === "requests" ? "Request" : "Activity"}</span><span>{section === "requests" ? "Amount" : "Credits"}</span><span>Date (UTC)</span><span>Status</span><span /></div>
              {history.items.map((item) => {
                const request = item as CreditRequest; const transaction = item as CreditTransaction;
                const delta = section === "transactions" ? transactionDelta(transaction) : 0;
                return <button key={item._id} onClick={() => section === "requests" ? setParams({ request: item._id }) : setSelectedTransaction(transaction)} className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-outline-variant/50 px-4 py-4 text-left transition hover:bg-primary/5 last:border-0 xl:grid-cols-[minmax(0,1fr)_8rem_9rem_7rem_2rem] xl:px-5">
                  <div className="min-w-0"><p className="truncate text-sm font-bold capitalize text-on-surface">{section === "requests" ? `${request.requestedCredits.toLocaleString()} credits` : transactionLabel(transaction)}</p><p className="mt-1 truncate text-[11px] text-on-surface-variant">{section === "requests" ? `${request.packageLabel} · #${item._id.slice(-8)}` : transaction.freeQuotaUsed ? "Daily free use" : transaction.enforcementMode === "shadow" ? "Recorded usage · no credits charged" : transaction.status === "reserved" ? "Credits reserved while your action runs" : `#${item._id.slice(-8)}`}</p></div>
                  <span className={cn("text-sm font-bold tabular-nums", section === "transactions" && delta > 0 ? "text-secondary" : "text-on-surface")}>{section === "requests" ? creditMoney(request.price, request.currency) : `${delta > 0 ? "+" : ""}${delta} credits`}</span>
                  <span className="text-[11px] text-on-surface-variant">{creditDate(item.createdAt)}</span>
                  <span className={cn("w-fit rounded-lg border px-2 py-1 text-[10px] font-extrabold capitalize", section === "requests" ? requestStatusTone[item.status] : "border-outline-variant bg-surface-container text-on-surface-variant")}>{item.status.toLowerCase()}</span>
                  <HugeiconsIcon icon="arrow-right" size={16} className="hidden justify-self-end text-on-surface-variant xl:block" />
                </button>;
              })}
            </>}
        </div>
        {!loading && !error && history && history.total > 0 && <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-outline-variant/60 px-4 py-3"><p className="text-xs text-on-surface-variant">{(page - 1) * history.limit + 1}–{Math.min(page * history.limit, history.total)} of {history.total} {section === "requests" ? "requests" : "transactions"}</p><div className="flex items-center gap-2"><button className={buttonClass} disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Previous</button><span className="text-xs text-on-surface-variant">{page} / {history.pages}</span><button className={buttonClass} disabled={page >= history.pages} onClick={() => setPage((value) => value + 1)}>Next</button></div></footer>}
      </section>

      {requestId && <CreditDialog titleId="credit-request-detail-title" onClose={closeRequest}>
        <div className="flex items-center justify-between border-b border-outline-variant/60 p-5"><h2 id="credit-request-detail-title" className="text-lg font-extrabold text-on-surface">Request details</h2><button className="rounded-lg p-2 text-on-surface-variant hover:bg-surface-container" onClick={closeRequest} aria-label="Close request details"><HugeiconsIcon icon="close" size={18} /></button></div>
        <div className="overflow-y-auto p-5">
          {requestLoading ? <p role="status" className="text-sm text-on-surface-variant">Loading request…</p> : requestError ? <p role="alert" className="text-sm text-error">{requestError}</p> : selectedRequest && <RequestDetails request={selectedRequest} />}
        </div>
      </CreditDialog>}
      {selectedTransaction && <CreditDialog titleId="credit-activity-title" onClose={() => setSelectedTransaction(null)}>
        <div className="flex items-center justify-between border-b border-outline-variant/60 p-5"><h2 id="credit-activity-title" className="text-lg font-extrabold text-on-surface">Activity details</h2><button className="rounded-lg p-2 text-on-surface-variant hover:bg-surface-container" onClick={() => setSelectedTransaction(null)} aria-label="Close activity details"><HugeiconsIcon icon="close" size={18} /></button></div>
        <div className="overflow-y-auto p-5"><p className="text-lg font-bold capitalize text-on-surface">{transactionLabel(selectedTransaction)}</p><dl className="mt-4 space-y-3 text-xs">
          <Detail label="Transaction ID" value={selectedTransaction._id} /><Detail label="Date (UTC)" value={creditDate(selectedTransaction.createdAt)} /><Detail label="Status" value={selectedTransaction.status} /><Detail label="Balance change" value={`${transactionDelta(selectedTransaction)} credits`} />
          {selectedTransaction.status === "settled" && selectedTransaction.balanceAfter && <Detail label="Balance after this activity" value={`${selectedTransaction.balanceAfter.total} credits`} />}
          {selectedTransaction.freeQuotaUsed && <Detail label="Pricing" value="Daily free use — no credits charged" />}
          {selectedTransaction.enforcementMode === "shadow" && <Detail label="Pricing" value="Recorded usage — no credits charged" />}
          {selectedTransaction.reason && <Detail label="Note" value={selectedTransaction.reason} />}
        </dl>
          {selectedTransaction.reference?.startsWith("credit-request:") && <button className={cn(buttonClass, "mt-5 w-full")} onClick={() => { setParams({ request: selectedTransaction.reference!.slice("credit-request:".length) }); setSelectedTransaction(null); }}>View purchase request<HugeiconsIcon icon="arrow-right" size={15} /></button>}
          {["refunded", "cancelled"].includes(selectedTransaction.status) && <p className="mt-4 text-xs leading-relaxed text-on-surface-variant">This activity has no final charge. Any credits reserved for it were released.</p>}
        </div>
      </CreditDialog>}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between gap-5 border-b border-outline-variant/40 pb-3"><dt className="shrink-0 text-on-surface-variant">{label}</dt><dd className="min-w-0 break-words text-right font-semibold text-on-surface">{value}</dd></div>;
}

function RequestDetails({ request }: { request: CreditRequest }) {
  const timeline = [["Request submitted", request.createdAt], ["Request confirmed", request.confirmedAt], ["Credits added", request.creditedAt], ["Request cancelled", request.cancelledAt]].filter(([, date]) => date);
  const receiptLabel = request.receiptEmailStatus === "sent" ? `Sent to ${request.email}${request.receiptEmailSentAt ? ` · ${creditDate(request.receiptEmailSentAt)} UTC` : ""}` : request.receiptEmailStatus === "pending" ? "Preparing your receipt" : request.receiptEmailStatus ? "Email could not be sent — your request is saved here" : "Email delivery was not recorded for this earlier request";
  return <>
    <div className="flex items-center justify-between gap-3"><div><p className="text-xl font-extrabold text-on-surface">{request.requestedCredits.toLocaleString()} credits</p><p className="mt-1 text-sm text-on-surface-variant">{creditMoney(request.price, request.currency)} · {request.packageLabel}</p></div><span className={cn("rounded-lg border px-2.5 py-1 text-[10px] font-extrabold capitalize", requestStatusTone[request.status])}>{request.status.toLowerCase()}</span></div>
    <p className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs leading-relaxed text-on-surface-variant">{requestStatusDescription[request.status]}</p>
    <dl className="mt-5 space-y-3 text-xs"><Detail label="Request ID" value={request._id} /><Detail label="Student email" value={request.email || "—"} /><Detail label="Contact phone" value={request.phone || "—"} /><Detail label="Receipt email" value={receiptLabel} />{request.creditTransaction && <Detail label="Deposit transaction" value={request.creditTransaction} />}</dl>
    <h3 className="mb-3 mt-6 text-[10px] font-extrabold uppercase tracking-wider text-on-surface-variant">Request timeline (UTC)</h3>
    <ol className="space-y-3">{timeline.map(([label, date]) => <li key={label} className="flex items-center gap-3"><div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-secondary/10 text-secondary"><HugeiconsIcon icon="checkmark-circle-02" size={15} /></div><div><p className="text-xs font-bold text-on-surface">{label}</p><p className="text-[11px] text-on-surface-variant">{creditDate(date)}</p></div></li>)}</ol>
    {(request.cancellationReason || request.adminNote) && <div className="mt-5 rounded-xl border border-outline-variant bg-surface-container-low p-3"><p className={labelClass}>Note from the team</p><p className="mt-1 whitespace-pre-wrap break-words text-xs leading-relaxed text-on-surface">{request.cancellationReason || request.adminNote}</p></div>}
  </>;
}
