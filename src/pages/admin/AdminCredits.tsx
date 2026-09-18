import { useEffect, useMemo, useState } from "react";
import { fetchApi } from "@/lib/api";
import creditCoin from "@/assets/credit-coin.png";
import HugeiconsIcon from "@/components/ui/HugeiconsIcon";

type Policy = {
  key: string;
  label: string;
  group: string;
  cost: number;
  freeUsesPerDay: number;
  perMinuteLimit: number;
  dailyLimit: number;
  enabled: boolean;
  editable: boolean;
  version: number;
};

type Settings = {
  welcomeCredits: number;
  dailyPromotionalRefill: number;
  timezone: string;
  enforcementMode: "off" | "shadow" | "enforce";
  version: number;
};

const asNumber = (value: unknown) => Math.max(0, Math.trunc(Number(value) || 0));

export default function AdminCredits() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [drafts, setDrafts] = useState<Record<string, Policy>>({});
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState("");
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchApi("/admin/credits/economy");
      setSettings(data.settings);
      setPolicies(data.policies || []);
      setDrafts(Object.fromEntries((data.policies || []).map((item: Policy) => [item.key, { ...item }])));
      setHistory(data.history || []);
    } catch (error) {
      setMessage({ tone: "error", text: error instanceof Error ? error.message : "Could not load the credit economy." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const grouped = useMemo(() => policies.reduce<Record<string, Policy[]>>((result, policy) => {
    (result[policy.group] ||= []).push(policy);
    return result;
  }, {}), [policies]);

  const updateDraft = (key: string, updates: Partial<Policy>) => {
    setDrafts((current) => ({ ...current, [key]: { ...current[key], ...updates } }));
    setMessage(null);
  };

  const savePolicy = async (policy: Policy) => {
    if (!reason.trim()) {
      setMessage({ tone: "error", text: "Add a short change reason first." });
      return;
    }
    const draft = drafts[policy.key];
    setSaving(policy.key);
    try {
      const result = await fetchApi(`/admin/credits/policies/${policy.key}`, {
        method: "PATCH",
        body: JSON.stringify({
          cost: asNumber(draft.cost),
          freeUsesPerDay: asNumber(draft.freeUsesPerDay),
          enabled: draft.enabled,
          reason: reason.trim(),
        }),
      });
      setPolicies((items) => items.map((item) => item.key === policy.key ? result.policy : item));
      setDrafts((items) => ({ ...items, [policy.key]: result.policy }));
      setReason("");
      setMessage({ tone: "success", text: `${policy.label} pricing updated.` });
    } catch (error) {
      setMessage({ tone: "error", text: error instanceof Error ? error.message : "Could not save this price." });
    } finally {
      setSaving("");
    }
  };

  const saveSettings = async () => {
    if (!settings || !reason.trim()) {
      setMessage({ tone: "error", text: "Add a short change reason first." });
      return;
    }
    setSaving("settings");
    try {
      const result = await fetchApi("/admin/credits/settings", {
        method: "PATCH",
        body: JSON.stringify({
          welcomeCredits: asNumber(settings.welcomeCredits),
          dailyPromotionalRefill: asNumber(settings.dailyPromotionalRefill),
          timezone: settings.timezone.trim(),
          enforcementMode: settings.enforcementMode,
          reason: reason.trim(),
        }),
      });
      setSettings(result.settings);
      setReason("");
      setMessage({ tone: "success", text: "Wallet settings updated." });
    } catch (error) {
      setMessage({ tone: "error", text: error instanceof Error ? error.message : "Could not save wallet settings." });
    } finally {
      setSaving("");
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 pb-16">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">
            <img src={creditCoin} alt="" className="h-4 w-4" /> Credit economy
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-on-surface sm:text-3xl">Pricing & allowances</h1>
          <p className="mt-1 max-w-2xl text-sm text-on-surface-variant">Change costs without a deployment. Every edit is versioned and recorded.</p>
        </div>
        <button type="button" onClick={load} className="inline-flex h-9 items-center gap-2 self-start rounded-lg border border-outline-variant bg-surface px-3 text-xs font-bold text-on-surface hover:bg-surface-container">
          <HugeiconsIcon icon="refresh" size={15} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </header>

      {message && (
        <div className={`rounded-xl border px-4 py-3 text-xs font-semibold ${message.tone === "success" ? "border-secondary/30 bg-secondary/10 text-secondary" : "border-error/30 bg-error/10 text-error"}`}>
          {message.text}
        </div>
      )}

      <section className="rounded-2xl border border-outline-variant/80 bg-surface p-4 shadow-2xs sm:p-5">
        <label className="block text-xs font-bold text-on-surface">Change reason
          <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Initial production pricing" maxLength={500} className="mt-1.5 h-10 w-full rounded-lg border border-outline-variant bg-surface px-3 text-sm text-on-surface outline-none focus:border-primary" />
        </label>
        <p className="mt-1.5 text-[10px] text-on-surface-variant">Required for every saved change and stored in the audit trail.</p>
      </section>

      <section className="rounded-2xl border border-outline-variant/80 bg-surface p-4 shadow-2xs sm:p-5">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-sm font-extrabold text-on-surface">Wallet defaults</h2>
            <p className="mt-0.5 text-xs text-on-surface-variant">Applied lazily when an eligible student opens SmartPFE.</p>
          </div>
          <span className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase ${settings?.enforcementMode === "enforce" ? "bg-secondary/10 text-secondary" : "bg-amber-400/10 text-amber-700"}`}>
            {settings?.enforcementMode || "loading"}
          </span>
        </div>
        {settings && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <label className="text-xs font-semibold text-on-surface-variant">Welcome credits
              <input type="number" min="0" value={settings.welcomeCredits} onChange={(e) => setSettings({ ...settings, welcomeCredits: asNumber(e.target.value) })} className="mt-1.5 h-10 w-full rounded-lg border border-outline-variant bg-surface px-3 text-sm font-bold text-on-surface outline-none focus:border-primary" />
            </label>
            <label className="text-xs font-semibold text-on-surface-variant">Daily refill target
              <input type="number" min="0" value={settings.dailyPromotionalRefill} onChange={(e) => setSettings({ ...settings, dailyPromotionalRefill: asNumber(e.target.value) })} className="mt-1.5 h-10 w-full rounded-lg border border-outline-variant bg-surface px-3 text-sm font-bold text-on-surface outline-none focus:border-primary" />
            </label>
            <label className="text-xs font-semibold text-on-surface-variant">Refill timezone
              <input value={settings.timezone} onChange={(e) => setSettings({ ...settings, timezone: e.target.value })} className="mt-1.5 h-10 w-full rounded-lg border border-outline-variant bg-surface px-3 text-sm text-on-surface outline-none focus:border-primary" />
            </label>
            <label className="text-xs font-semibold text-on-surface-variant">Enforcement
              <select value={settings.enforcementMode} onChange={(e) => setSettings({ ...settings, enforcementMode: e.target.value as Settings["enforcementMode"] })} className="mt-1.5 h-10 w-full rounded-lg border border-outline-variant bg-surface px-3 text-sm text-on-surface outline-none focus:border-primary">
                <option value="enforce">Enforce</option><option value="shadow">Shadow</option><option value="off">Off</option>
              </select>
            </label>
          </div>
        )}
        <div className="mt-4 flex justify-end">
          <button type="button" onClick={saveSettings} disabled={!settings || saving === "settings"} className="h-9 rounded-lg bg-primary px-4 text-xs font-bold text-on-primary transition hover:bg-primary/90 disabled:opacity-50">
            {saving === "settings" ? "Saving…" : "Save wallet defaults"}
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-outline-variant/80 bg-surface shadow-2xs">
        <div className="border-b border-outline-variant/60 p-4 sm:p-5">
          <h2 className="text-sm font-extrabold text-on-surface">AI action prices</h2>
          <p className="mt-0.5 text-xs text-on-surface-variant">A zero price stays free. Built-in abuse ceilings remain enforced server-side.</p>
        </div>
        {loading ? <div className="p-8 text-sm text-on-surface-variant">Loading prices…</div> : Object.entries(grouped).map(([group, items]) => (
          <div key={group} className="border-b border-outline-variant/50 last:border-0">
            <div className="bg-surface-container-low px-4 py-2 text-[10px] font-extrabold uppercase tracking-widest text-on-surface-variant sm:px-5">{group}</div>
            {items.map((policy) => {
              const draft = drafts[policy.key] || policy;
              const dirty = draft.cost !== policy.cost || draft.freeUsesPerDay !== policy.freeUsesPerDay || draft.enabled !== policy.enabled;
              return (
                <div key={policy.key} className="grid grid-cols-1 gap-3 border-t border-outline-variant/40 px-4 py-3 first:border-0 sm:grid-cols-[minmax(14rem,1fr)_7rem_7rem_6rem_5rem] sm:items-center sm:px-5">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-on-surface">{policy.label}</p>
                    <p className="mt-0.5 truncate font-mono text-[10px] text-on-surface-variant">{policy.key} · v{policy.version}</p>
                  </div>
                  <label className="text-[10px] font-bold uppercase text-on-surface-variant">Cost
                    <div className="mt-1 flex h-9 items-center rounded-lg border border-outline-variant bg-surface px-2">
                      <img src={creditCoin} alt="" className="mr-1.5 h-4 w-4" />
                      <input type="number" min="0" disabled={!policy.editable} value={draft.cost} onChange={(e) => updateDraft(policy.key, { cost: asNumber(e.target.value) })} className="w-full bg-transparent text-sm font-bold text-on-surface outline-none disabled:opacity-50" />
                    </div>
                  </label>
                  <label className="text-[10px] font-bold uppercase text-on-surface-variant">Free / day
                    <input type="number" min="0" disabled={!policy.editable} value={draft.freeUsesPerDay} onChange={(e) => updateDraft(policy.key, { freeUsesPerDay: asNumber(e.target.value) })} className="mt-1 h-9 w-full rounded-lg border border-outline-variant bg-surface px-2 text-sm font-bold text-on-surface outline-none disabled:opacity-50" />
                  </label>
                  <label className="flex items-center gap-2 text-xs font-semibold text-on-surface">
                    <input type="checkbox" checked={draft.enabled} disabled={!policy.editable} onChange={(e) => updateDraft(policy.key, { enabled: e.target.checked })} className="h-4 w-4 accent-primary" /> Active
                  </label>
                  <button type="button" disabled={!dirty || !policy.editable || saving === policy.key} onClick={() => savePolicy(policy)} className="h-9 rounded-lg border border-primary/30 bg-primary/10 px-3 text-xs font-bold text-primary hover:bg-primary/15 disabled:border-outline-variant disabled:bg-surface-container disabled:text-on-surface-variant disabled:opacity-50">
                    {saving === policy.key ? "Saving" : "Save"}
                  </button>
                </div>
              );
            })}
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-outline-variant/80 bg-surface p-4 shadow-2xs sm:p-5">
        <h2 className="text-sm font-extrabold text-on-surface">Recent economy changes</h2>
        <div className="mt-3 divide-y divide-outline-variant/50">
          {history.length ? history.slice(0, 10).map((item) => (
            <div key={item._id} className="flex flex-col gap-1 py-2.5 sm:flex-row sm:items-center sm:justify-between">
              <div><p className="text-xs font-bold text-on-surface">{item.targetKey}</p><p className="text-xs text-on-surface-variant">{item.reason}</p></div>
              <p className="text-[10px] text-on-surface-variant">{new Date(item.createdAt).toLocaleString()}</p>
            </div>
          )) : <p className="py-4 text-xs text-on-surface-variant">No pricing changes yet.</p>}
        </div>
      </section>
    </div>
  );
}
