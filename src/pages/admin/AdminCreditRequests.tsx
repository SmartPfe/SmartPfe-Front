import { useEffect, useMemo, useState } from "react";
import { fetchApi } from "@/lib/api";
import HugeiconsIcon from "@/components/ui/HugeiconsIcon";
import creditCoin from "@/assets/credit-coin.png";
import { cn } from "@/lib/utils";

type CreditRequest = {
  _id: string;
  user?: { _id: string; fullName?: string; email?: string } | string;
  studentName: string;
  email: string;
  phone: string;
  requestedCredits: number;
  packageLabel: string;
  price: number;
  currency: string;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
  adminNote?: string;
  cancellationReason?: string;
  createdAt: string;
  updatedAt: string;
  creditedAt?: string;
  creditTransaction?: any;
};

type PendingAdminAction =
  | {
      kind: "status";
      request: CreditRequest;
      nextStatus: "CONFIRMED" | "CANCELLED";
      note: string;
    }
  | {
      kind: "addCredits";
      request: CreditRequest;
    };

const statusTone: Record<string, string> = {
  PENDING: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20",
  CONFIRMED: "bg-primary/10 text-primary border-primary/20",
  COMPLETED: "bg-secondary/10 text-secondary border-secondary/20",
  CANCELLED: "bg-error/10 text-error border-error/20",
};

const formatDateTime = (value?: string) =>
  value
    ? new Intl.DateTimeFormat("en", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(value))
    : "-";

export default function AdminCreditRequests() {
  const [requests, setRequests] = useState<CreditRequest[]>([]);
  const [selected, setSelected] = useState<CreditRequest | null>(null);
  const [status, setStatus] = useState("ALL");
  const [student, setStudent] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState("");
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAdminAction | null>(null);

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (status !== "ALL") params.set("status", status);
    if (student.trim()) params.set("student", student.trim());
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    return params.toString();
  }, [status, student, dateFrom, dateTo]);

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchApi(`/admin/credit-requests${query ? `?${query}` : ""}`);
      setRequests(data.requests || []);
    } catch (err) {
      setMessage({ tone: "error", text: err instanceof Error ? err.message : "Could not load credit requests." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [query]);

  const replaceRequest = (request: CreditRequest) => {
    setRequests((items) => items.map((item) => (item._id === request._id ? request : item)));
    setSelected(request);
  };

  const openStatusDialog = (request: CreditRequest, nextStatus: "CONFIRMED" | "CANCELLED") => {
    setPendingAction({
      kind: "status",
      request,
      nextStatus,
      note: nextStatus === "CANCELLED" ? request.cancellationReason || "" : request.adminNote || "",
    });
  };

  const openAddCreditsDialog = (request: CreditRequest) => {
    setPendingAction({ kind: "addCredits", request });
  };

  const patchStatus = async (request: CreditRequest, nextStatus: "CONFIRMED" | "CANCELLED", note: string) => {
    setSaving(`${request._id}:${nextStatus}`);
    setMessage(null);
    try {
      const data = await fetchApi(`/admin/credit-requests/${request._id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus, note }),
      });
      replaceRequest(data.request);
      setPendingAction(null);
      setMessage({ tone: "success", text: nextStatus === "CONFIRMED" ? "Request confirmed." : "Request cancelled." });
    } catch (err) {
      setMessage({ tone: "error", text: err instanceof Error ? err.message : "Could not update the request." });
    } finally {
      setSaving("");
    }
  };

  const addCredits = async (request: CreditRequest) => {
    setSaving(`${request._id}:credits`);
    setMessage(null);
    try {
      const data = await fetchApi(`/admin/credit-requests/${request._id}/add-credits`, { method: "POST" });
      replaceRequest(data.request);
      setPendingAction(null);
      setMessage({
        tone: "success",
        text: data.emailSent ? "Credits added and confirmation email sent." : "Credits added. SMTP must be configured to send the confirmation email.",
      });
    } catch (err) {
      setMessage({ tone: "error", text: err instanceof Error ? err.message : "Could not add credits to the wallet." });
    } finally {
      setSaving("");
    }
  };

  const executePendingAction = async () => {
    if (!pendingAction) return;
    if (pendingAction.kind === "status") {
      await patchStatus(pendingAction.request, pendingAction.nextStatus, pendingAction.note);
      return;
    }
    await addCredits(pendingAction.request);
  };

  const counts = useMemo(() => ({
    total: requests.length,
    pending: requests.filter((item) => item.status === "PENDING").length,
    confirmed: requests.filter((item) => item.status === "CONFIRMED").length,
    completed: requests.filter((item) => item.status === "COMPLETED").length,
  }), [requests]);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 pb-16">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-primary">Administration</span>
            <span className="h-1 w-1 rounded-full bg-outline-variant" />
            <span className="text-[11px] font-semibold text-on-surface-variant">Wallet Requests</span>
          </div>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-on-surface sm:text-3xl">Credit Requests</h1>
          <p className="mt-1 max-w-2xl text-sm text-on-surface-variant">
            Review manual credit purchase requests, confirm external payment, and fulfill wallets through the existing ledger.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {[
            ["Total", counts.total],
            ["Pending", counts.pending],
            ["Confirmed", counts.confirmed],
            ["Completed", counts.completed],
          ].map(([label, value]) => (
            <div key={label} className="flex items-center gap-2 rounded-xl border border-outline-variant/80 bg-surface-container-lowest px-3 py-1.5 shadow-2xs">
              <img src={creditCoin} alt="" className="h-4 w-4" />
              <span className="text-xs font-bold text-on-surface">{value}</span>
              <span className="text-[11px] text-on-surface-variant">{label}</span>
            </div>
          ))}
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-outline-variant bg-surface px-3 text-xs font-bold text-on-surface shadow-2xs hover:bg-surface-container disabled:opacity-50"
          >
            <HugeiconsIcon icon="refresh" size={14} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </header>

      {message && (
        <div className={cn("flex items-center gap-2 rounded-xl border px-4 py-3 text-xs font-semibold", message.tone === "success" ? "border-secondary/30 bg-secondary/10 text-secondary" : "border-error/30 bg-error/10 text-error")}>
          <HugeiconsIcon icon={message.tone === "success" ? "checkmark-circle-02" : "alert-circle"} size={16} />
          <span>{message.text}</span>
        </div>
      )}

      <section className="rounded-2xl border border-outline-variant/80 bg-surface-container-lowest shadow-2xs">
        <div className="grid gap-3 border-b border-outline-variant/60 bg-surface-container-low/40 p-4 md:grid-cols-[10rem_1fr_10rem_10rem]">
          <select value={status} onChange={(event) => setStatus(event.target.value)} className="h-10 rounded-xl border border-outline-variant bg-surface px-3 text-xs font-semibold text-on-surface outline-none focus:border-primary">
            <option value="ALL">All statuses</option>
            <option value="PENDING">Pending</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          <input
            value={student}
            onChange={(event) => setStudent(event.target.value)}
            placeholder="Filter by student, email, or phone..."
            className="h-10 rounded-xl border border-outline-variant bg-surface px-3 text-sm text-on-surface outline-none focus:border-primary"
          />
          <input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} className="h-10 rounded-xl border border-outline-variant bg-surface px-3 text-xs font-semibold text-on-surface outline-none focus:border-primary" />
          <input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} className="h-10 rounded-xl border border-outline-variant bg-surface px-3 text-xs font-semibold text-on-surface outline-none focus:border-primary" />
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="border-b border-outline-variant/60 bg-surface-container-low/30 text-[10px] font-extrabold uppercase tracking-wider text-on-surface-variant">
              <tr>
                <th className="px-4 py-3">Student</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Credits</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Request date</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/50">
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-sm text-on-surface-variant">Loading credit requests...</td></tr>
              ) : requests.length ? requests.map((item) => (
                <tr key={item._id} className="hover:bg-surface-container-low/50">
                  <td className="px-4 py-3">
                    <p className="text-xs font-extrabold text-on-surface">{item.studentName}</p>
                    <p className="text-[11px] text-on-surface-variant">{item.email}</p>
                  </td>
                  <td className="px-4 py-3 text-xs font-semibold text-on-surface">{item.phone}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-on-surface">
                      <img src={creditCoin} alt="" className="h-4 w-4" />
                      {item.requestedCredits.toLocaleString()}
                    </span>
                    <p className="text-[10px] text-on-surface-variant">{item.packageLabel}</p>
                  </td>
                  <td className="px-4 py-3 text-xs font-bold text-on-surface">{item.price} {item.currency}</td>
                  <td className="px-4 py-3">
                    <span className={cn("inline-flex rounded-md border px-2 py-0.5 text-[10px] font-extrabold", statusTone[item.status])}>
                      {item.status.toLowerCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-on-surface-variant">{formatDateTime(item.createdAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <button type="button" onClick={() => setSelected(item)} className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-outline-variant bg-surface px-2.5 text-[11px] font-bold text-on-surface hover:border-primary/50 hover:text-primary">
                      <HugeiconsIcon icon="view" size={13} />
                      Details
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center">
                    <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-surface-container-high text-on-surface-variant">
                      <HugeiconsIcon icon="coin" size={23} />
                    </div>
                    <p className="mt-3 text-sm font-bold text-on-surface">No credit requests found</p>
                    <p className="mt-1 text-xs text-on-surface-variant">New student requests will appear here.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {selected && (
        <RequestDrawer
          request={selected}
          saving={saving}
          onClose={() => setSelected(null)}
          onConfirm={() => openStatusDialog(selected, "CONFIRMED")}
          onCancel={() => openStatusDialog(selected, "CANCELLED")}
          onAddCredits={() => openAddCreditsDialog(selected)}
        />
      )}

      {pendingAction && (
        <AdminActionDialog
          action={pendingAction}
          saving={saving}
          onClose={() => {
            if (!saving) setPendingAction(null);
          }}
          onNoteChange={(note) => {
            setPendingAction((current) => current && current.kind === "status" ? { ...current, note } : current);
          }}
          onSubmit={executePendingAction}
        />
      )}
    </div>
  );
}

function RequestDrawer({
  request,
  saving,
  onClose,
  onConfirm,
  onCancel,
  onAddCredits,
}: {
  request: CreditRequest;
  saving: string;
  onClose: () => void;
  onConfirm: () => void;
  onCancel: () => void;
  onAddCredits: () => void;
}) {
  const busy = saving.startsWith(request._id);
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-end bg-black/40 backdrop-blur-[2px] sm:p-4" onMouseDown={(event) => { if (event.currentTarget === event.target) onClose(); }}>
      <aside className="flex h-[94dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-outline-variant bg-surface shadow-2xl sm:h-full sm:rounded-2xl">
        <header className="flex items-center justify-between border-b border-outline-variant/60 bg-surface-container-low/40 p-4">
          <div>
            <p className="text-sm font-extrabold text-on-surface">Credit request details</p>
            <p className="font-mono text-[10px] text-on-surface-variant">{request._id}</p>
          </div>
          <button type="button" onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg text-on-surface-variant hover:bg-surface-container" aria-label="Close">
            <HugeiconsIcon icon="close" size={16} />
          </button>
        </header>

        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          <div className="rounded-2xl border border-outline-variant/80 bg-surface-container-lowest p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-lg font-extrabold text-on-surface">{request.studentName}</p>
                <p className="text-xs text-on-surface-variant">{request.email}</p>
              </div>
              <span className={cn("rounded-md border px-2 py-0.5 text-[10px] font-extrabold", statusTone[request.status])}>{request.status.toLowerCase()}</span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Info label="Phone" value={request.phone} />
              <Info label="Package" value={request.packageLabel} />
              <Info label="Credits" value={request.requestedCredits.toLocaleString()} />
              <Info label="Price" value={`${request.price} ${request.currency}`} />
              <Info label="Created" value={formatDateTime(request.createdAt)} />
              <Info label="Updated" value={formatDateTime(request.updatedAt)} />
            </div>
          </div>

          {(request.adminNote || request.cancellationReason || request.creditedAt) && (
            <div className="rounded-2xl border border-outline-variant/80 bg-surface-container-lowest p-4 text-xs">
              {request.adminNote && <p><span className="font-bold text-on-surface">Admin note:</span> <span className="text-on-surface-variant">{request.adminNote}</span></p>}
              {request.cancellationReason && <p className="mt-2"><span className="font-bold text-on-surface">Cancellation:</span> <span className="text-on-surface-variant">{request.cancellationReason}</span></p>}
              {request.creditedAt && <p className="mt-2"><span className="font-bold text-on-surface">Wallet credited:</span> <span className="text-on-surface-variant">{formatDateTime(request.creditedAt)}</span></p>}
            </div>
          )}
        </div>

        <footer className="space-y-2 border-t border-outline-variant/60 bg-surface-container-low/40 p-4">
          {request.status === "PENDING" && (
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={onCancel} disabled={busy} className="h-10 rounded-xl border border-error/30 bg-error/10 text-xs font-extrabold text-error hover:bg-error/15 disabled:opacity-50">Cancel</button>
              <button type="button" onClick={onConfirm} disabled={busy} className="h-10 rounded-xl bg-primary text-xs font-extrabold text-on-primary hover:bg-primary/90 disabled:opacity-50">Confirm</button>
            </div>
          )}
          {request.status === "CONFIRMED" && (
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={onCancel} disabled={busy} className="h-10 rounded-xl border border-error/30 bg-error/10 text-xs font-extrabold text-error hover:bg-error/15 disabled:opacity-50">Cancel</button>
              <button type="button" onClick={onAddCredits} disabled={busy} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-secondary text-xs font-extrabold text-on-secondary hover:bg-secondary/90 disabled:opacity-50">
                <HugeiconsIcon icon="wallet-02" size={15} />
                Add Credits to Wallet
              </button>
            </div>
          )}
          {request.status === "COMPLETED" && <p className="text-center text-xs font-semibold text-secondary">This request has been completed and credited.</p>}
          {request.status === "CANCELLED" && <p className="text-center text-xs font-semibold text-error">This request was cancelled.</p>}
        </footer>
      </aside>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-surface-container-low p-3">
      <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">{label}</p>
      <p className="mt-1 break-words text-xs font-bold text-on-surface">{value}</p>
    </div>
  );
}

function AdminActionDialog({
  action,
  saving,
  onClose,
  onNoteChange,
  onSubmit,
}: {
  action: PendingAdminAction;
  saving: string;
  onClose: () => void;
  onNoteChange: (note: string) => void;
  onSubmit: () => void;
}) {
  const request = action.request;
  const busy = saving.startsWith(request._id);
  const isCancel = action.kind === "status" && action.nextStatus === "CANCELLED";
  const isConfirm = action.kind === "status" && action.nextStatus === "CONFIRMED";
  const isAddCredits = action.kind === "addCredits";

  const title = isCancel ? "Cancel credit request" : isConfirm ? "Confirm credit request" : "Add credits to wallet";
  const description = isCancel
    ? "No credits will be added and the student request will be marked as cancelled."
    : isConfirm
      ? "This marks the payment request as confirmed. Credits will still wait until you add them to the wallet."
      : `This will add exactly ${request.requestedCredits.toLocaleString()} purchased credits to ${request.studentName}'s wallet.`;
  const submitLabel = isCancel ? "Cancel Request" : isConfirm ? "Confirm Request" : "Add Credits";
  const submitTone = isCancel
    ? "bg-error text-on-error hover:bg-error/90"
    : isAddCredits
      ? "bg-secondary text-on-secondary hover:bg-secondary/90"
      : "bg-primary text-on-primary hover:bg-primary/90";

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/45 p-4 backdrop-blur-[2px]">
      <button type="button" className="absolute inset-0 cursor-default" onClick={onClose} aria-label="Close action dialog" />
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-outline-variant bg-surface shadow-2xl">
        <header className="border-b border-outline-variant/60 bg-surface-container-low/50 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-extrabold text-on-surface">{title}</p>
              <p className="mt-1 text-xs leading-relaxed text-on-surface-variant">{description}</p>
            </div>
            <button type="button" onClick={onClose} disabled={busy} className="grid h-8 w-8 place-items-center rounded-lg text-on-surface-variant hover:bg-surface-container disabled:opacity-50" aria-label="Close">
              <HugeiconsIcon icon="close" size={16} />
            </button>
          </div>
        </header>

        <div className="space-y-4 p-5">
          <div className="rounded-2xl border border-outline-variant/80 bg-surface-container-lowest p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-extrabold text-on-surface">{request.studentName}</p>
                <p className="truncate text-xs text-on-surface-variant">{request.email}</p>
              </div>
              <span className={cn("shrink-0 rounded-md border px-2 py-0.5 text-[10px] font-extrabold", statusTone[request.status])}>
                {request.status.toLowerCase()}
              </span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <Info label="Credits" value={request.requestedCredits.toLocaleString()} />
              <Info label="Price" value={`${request.price} ${request.currency}`} />
            </div>
          </div>

          {action.kind === "status" && (
            <label className="block text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
              {isCancel ? "Cancellation reason" : "Admin note"}
              <textarea
                value={action.note}
                onChange={(event) => onNoteChange(event.target.value)}
                placeholder={isCancel ? "Optional reason shown in admin history..." : "Optional note for this confirmation..."}
                className="mt-2 min-h-24 w-full resize-none rounded-xl border border-outline-variant bg-surface px-3 py-2 text-sm normal-case tracking-normal text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </label>
          )}
        </div>

        <footer className="flex flex-col-reverse gap-2 border-t border-outline-variant/60 bg-surface-container-low/40 p-4 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} disabled={busy} className="h-10 rounded-xl border border-outline-variant bg-surface px-4 text-xs font-bold text-on-surface hover:bg-surface-container disabled:opacity-50">
            Keep Open
          </button>
          <button type="button" onClick={onSubmit} disabled={busy} className={cn("inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-xs font-extrabold shadow-xs disabled:opacity-50", submitTone)}>
            {busy && <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />}
            <span>{busy ? "Processing..." : submitLabel}</span>
          </button>
        </footer>
      </div>
    </div>
  );
}
