import { useEffect, useMemo, useState } from "react";
import { createIdempotencyKey, fetchApi } from "@/lib/api";
import HugeiconsIcon from "@/components/ui/HugeiconsIcon";
import creditCoin from "@/assets/credit-coin.png";

type AdminUser = {
  _id: string;
  fullName: string;
  email: string;
  role: "admin" | "etudiant";
  hasCompletedOnboarding: boolean;
  createdAt: string;
  credits?: { promotional: number; purchased: number; total: number };
};

const formatDate = (value: string) => new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));

export default function AdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [roleFilter, setRoleFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<AdminUser | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [wallet, setWallet] = useState<any>(null);
  const [amount, setAmount] = useState(10);
  const [bucket, setBucket] = useState<"promotional" | "purchased">("promotional");
  const [reason, setReason] = useState("");
  const [reference, setReference] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadUsers = async () => {
    setIsLoading(true);
    setError("");
    try { setUsers(await fetchApi("/admin/users")); }
    catch (err) { setError(err instanceof Error ? err.message : "Failed to load users."); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { loadUsers(); }, []);

  const openWallet = async (user: AdminUser) => {
    setSelected(user);
    setHistory([]);
    setWallet(user.credits || null);
    setError("");
    try {
      const data = await fetchApi(`/admin/users/${user._id}/credits?limit=20`);
      setWallet(data.wallet);
      setHistory(data.items || []);
      setUsers((items) => items.map((item) => item._id === user._id ? { ...item, credits: data.wallet } : item));
    } catch (err) { setError(err instanceof Error ? err.message : "Could not load the wallet."); }
  };

  const adjust = async () => {
    if (!selected || !Number.isInteger(Number(amount)) || Number(amount) === 0 || !reason.trim()) {
      setError("Enter a non-zero whole amount and a reason.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const data = await fetchApi(`/admin/users/${selected._id}/credits/adjust`, {
        method: "POST",
        headers: { "X-Idempotency-Key": createIdempotencyKey() },
        body: JSON.stringify({ amount: Number(amount), bucket, reason: reason.trim(), reference: reference.trim() }),
      });
      setWallet(data.wallet);
      setUsers((items) => items.map((item) => item._id === selected._id ? { ...item, credits: data.wallet } : item));
      setHistory((items) => [data.transaction, ...items]);
      setReason("");
      setReference("");
      setAmount(10);
    } catch (err) { setError(err instanceof Error ? err.message : "Credit adjustment failed."); }
    finally { setSaving(false); }
  };

  const filteredUsers = useMemo(() => users.filter((user) => {
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    const needle = query.trim().toLowerCase();
    return matchesRole && (!needle || user.fullName.toLowerCase().includes(needle) || user.email.toLowerCase().includes(needle));
  }), [users, roleFilter, query]);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 pb-16">
      <header>
        <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-primary">Administration</p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-on-surface sm:text-3xl">Users & wallets</h1>
        <p className="mt-1 text-sm text-on-surface-variant">Find accounts, inspect balances, and make traceable credit adjustments.</p>
      </header>

      <section className="flex flex-col gap-3 rounded-2xl border border-outline-variant/80 bg-surface p-3 shadow-2xs sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <HugeiconsIcon icon="search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name or email" className="h-10 w-full rounded-xl border border-outline-variant bg-surface pl-9 pr-3 text-sm text-on-surface outline-none focus:border-primary" />
        </div>
        <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)} className="h-10 rounded-xl border border-outline-variant bg-surface px-3 text-xs font-bold text-on-surface outline-none focus:border-primary">
          <option value="all">All roles</option><option value="admin">Admins</option><option value="etudiant">Students</option>
        </select>
      </section>

      {error && <div className="rounded-xl border border-error/30 bg-error/10 px-4 py-3 text-xs font-semibold text-error">{error}</div>}

      <section className="overflow-hidden rounded-2xl border border-outline-variant/80 bg-surface shadow-2xs">
        <div className="flex items-center justify-between border-b border-outline-variant/60 bg-surface-container-low px-4 py-2.5 text-xs text-on-surface-variant">
          <span>{filteredUsers.length} account{filteredUsers.length === 1 ? "" : "s"}</span>
          <button type="button" onClick={loadUsers} className="inline-flex items-center gap-1.5 font-bold hover:text-primary"><HugeiconsIcon icon="sync-alt" size={13} /> Refresh</button>
        </div>
        {isLoading ? <div className="p-10 text-center text-sm text-on-surface-variant">Loading accounts…</div> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">
              <thead className="border-b border-outline-variant/60 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant"><tr><th className="px-4 py-3">Account</th><th className="px-4 py-3">Role</th><th className="px-4 py-3">Onboarding</th><th className="px-4 py-3">Credits</th><th className="px-4 py-3">Joined</th><th className="px-4 py-3"></th></tr></thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user._id} className="border-b border-outline-variant/40 last:border-0 hover:bg-surface-container-low/70">
                    <td className="px-4 py-3"><p className="text-xs font-bold text-on-surface">{user.fullName}</p><p className="mt-0.5 text-[11px] text-on-surface-variant">{user.email}</p></td>
                    <td className="px-4 py-3"><span className="rounded-full bg-primary/10 px-2 py-1 text-[10px] font-bold uppercase text-primary">{user.role === "etudiant" ? "Student" : "Admin"}</span></td>
                    <td className="px-4 py-3 text-xs text-on-surface-variant">{user.hasCompletedOnboarding ? "Completed" : "Pending"}</td>
                    <td className="px-4 py-3"><span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-on-surface"><img src={creditCoin} alt="" className="h-5 w-5" />{user.credits?.total ?? 0}</span></td>
                    <td className="px-4 py-3 text-xs text-on-surface-variant">{formatDate(user.createdAt)}</td>
                    <td className="px-4 py-3 text-right"><button type="button" onClick={() => openWallet(user)} className="h-8 rounded-lg border border-outline-variant bg-surface px-3 text-[11px] font-bold text-on-surface hover:border-primary/40 hover:text-primary">Manage wallet</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!filteredUsers.length && <p className="p-10 text-center text-sm text-on-surface-variant">No matching users.</p>}
          </div>
        )}
      </section>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-end justify-end bg-black/30 backdrop-blur-[1px] sm:p-4" onMouseDown={(event) => { if (event.currentTarget === event.target) setSelected(null); }}>
          <aside className="flex h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-outline-variant bg-surface shadow-2xl sm:h-full sm:rounded-2xl">
            <header className="flex items-start justify-between border-b border-outline-variant/60 p-4">
              <div><p className="text-sm font-extrabold text-on-surface">{selected.fullName}</p><p className="text-xs text-on-surface-variant">{selected.email}</p></div>
              <button type="button" onClick={() => setSelected(null)} className="grid h-8 w-8 place-items-center rounded-lg text-on-surface-variant hover:bg-surface-container"><HugeiconsIcon icon="close" size={16} /></button>
            </header>
            <div className="flex-1 space-y-5 overflow-y-auto p-4">
              {error && <div className="rounded-xl border border-error/30 bg-error/10 px-3 py-2.5 text-xs font-semibold text-error">{error}</div>}
              <div className="rounded-2xl border border-amber-400/25 bg-gradient-to-br from-amber-400/15 to-primary/5 p-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Current balance</p>
                <div className="mt-1 flex items-center gap-2"><img src={creditCoin} alt="" className="h-9 w-9" /><span className="text-3xl font-extrabold text-on-surface">{wallet?.total ?? 0}</span></div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs"><div className="rounded-lg bg-surface/70 p-2"><span className="text-on-surface-variant">Promotional</span><strong className="float-right text-on-surface">{wallet?.promotional ?? 0}</strong></div><div className="rounded-lg bg-surface/70 p-2"><span className="text-on-surface-variant">Purchased</span><strong className="float-right text-on-surface">{wallet?.purchased ?? 0}</strong></div></div>
              </div>

              <section>
                <h2 className="text-xs font-extrabold text-on-surface">Adjust balance</h2>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <label className="text-[10px] font-bold uppercase text-on-surface-variant">Amount
                    <input type="number" step="1" value={amount} onChange={(event) => setAmount(Number(event.target.value))} className="mt-1 h-10 w-full rounded-lg border border-outline-variant bg-surface px-3 text-sm font-bold text-on-surface outline-none focus:border-primary" />
                  </label>
                  <label className="text-[10px] font-bold uppercase text-on-surface-variant">Bucket
                    <select value={bucket} onChange={(event) => setBucket(event.target.value as typeof bucket)} className="mt-1 h-10 w-full rounded-lg border border-outline-variant bg-surface px-3 text-sm text-on-surface outline-none focus:border-primary"><option value="promotional">Promotional</option><option value="purchased">Purchased</option></select>
                  </label>
                </div>
                <input value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Reason (required)" maxLength={500} className="mt-2 h-10 w-full rounded-lg border border-outline-variant bg-surface px-3 text-sm text-on-surface outline-none focus:border-primary" />
                <input value={reference} onChange={(event) => setReference(event.target.value)} placeholder="Reference (optional)" maxLength={200} className="mt-2 h-10 w-full rounded-lg border border-outline-variant bg-surface px-3 text-sm text-on-surface outline-none focus:border-primary" />
                <button type="button" onClick={adjust} disabled={saving} className="mt-3 h-10 w-full rounded-xl bg-primary text-xs font-extrabold text-on-primary hover:bg-primary/90 disabled:opacity-50">{saving ? "Applying…" : "Apply adjustment"}</button>
                <p className="mt-1.5 text-[10px] text-on-surface-variant">Use a negative amount to remove credits. Balances can never go below zero.</p>
              </section>

              <section>
                <h2 className="text-xs font-extrabold text-on-surface">Recent activity</h2>
                <div className="mt-2 divide-y divide-outline-variant/50 rounded-xl border border-outline-variant/70 px-3">
                  {history.length ? history.map((item) => {
                    const delta = ["refunded", "cancelled"].includes(item.status)
                      ? 0
                      : (item.promotionalDelta || 0) + (item.purchasedDelta || 0) - (item.chargedCost || 0);
                    return <div key={item._id} className="flex items-center justify-between gap-3 py-2.5"><div className="min-w-0"><p className="truncate text-xs font-bold capitalize text-on-surface">{item.reason || item.actionKey?.replaceAll("_", " ") || item.kind}</p><p className="text-[10px] text-on-surface-variant">{formatDate(item.createdAt)}</p></div><span className={`text-xs font-extrabold ${delta > 0 ? "text-secondary" : "text-on-surface"}`}>{delta > 0 ? "+" : ""}{delta}</span></div>;
                  }) : <p className="py-4 text-xs text-on-surface-variant">No wallet activity yet.</p>}
                </div>
              </section>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
