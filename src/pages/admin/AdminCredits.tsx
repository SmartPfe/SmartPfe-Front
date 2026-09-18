import { useEffect, useMemo, useState } from "react";
import { fetchApi } from "@/lib/api";
import creditCoin from "@/assets/credit-coin.png";
import HugeiconsIcon from "@/components/ui/HugeiconsIcon";
import { cn } from "@/lib/utils";

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

type HistoryItem = {
  _id: string;
  targetType: string;
  targetKey: string;
  actor?: { fullName?: string; email?: string } | null;
  reason: string;
  version: number;
  createdAt: string;
};

const asNumber = (value: unknown) => Math.max(0, Math.trunc(Number(value) || 0));

// Curated standard timezones grouped by region for high reliability
const TIMEZONE_GROUPS = [
  {
    region: "North Africa & Middle East",
    options: [
      { value: "Africa/Tunis", label: "Tunis, Tunisia (UTC+1)", offset: "+01:00" },
      { value: "Africa/Algiers", label: "Algiers, Algeria (UTC+1)", offset: "+01:00" },
      { value: "Africa/Casablanca", label: "Casablanca, Morocco (UTC+1)", offset: "+01:00" },
      { value: "Africa/Cairo", label: "Cairo, Egypt (UTC+2)", offset: "+02:00" },
      { value: "Asia/Dubai", label: "Dubai, UAE (UTC+4)", offset: "+04:00" },
      { value: "Asia/Riyadh", label: "Riyadh, Saudi Arabia (UTC+3)", offset: "+03:00" },
    ],
  },
  {
    region: "Europe",
    options: [
      { value: "Europe/Paris", label: "Paris, France (UTC+1)", offset: "+01:00" },
      { value: "Europe/London", label: "London, UK (UTC+0)", offset: "+00:00" },
      { value: "Europe/Berlin", label: "Berlin, Germany (UTC+1)", offset: "+01:00" },
      { value: "Europe/Rome", label: "Rome, Italy (UTC+1)", offset: "+01:00" },
      { value: "Europe/Madrid", label: "Madrid, Spain (UTC+1)", offset: "+01:00" },
      { value: "Europe/Brussels", label: "Brussels, Belgium (UTC+1)", offset: "+01:00" },
    ],
  },
  {
    region: "Americas & Universal",
    options: [
      { value: "America/New_York", label: "New York, USA (UTC-5)", offset: "-05:00" },
      { value: "America/Chicago", label: "Chicago, USA (UTC-6)", offset: "-06:00" },
      { value: "America/Los_Angeles", label: "Los Angeles, USA (UTC-8)", offset: "-08:00" },
      { value: "America/Montreal", label: "Montreal, Canada (UTC-5)", offset: "-05:00" },
      { value: "UTC", label: "UTC (Coordinated Universal Time)", offset: "+00:00" },
    ],
  },
];

const ENFORCEMENT_CARDS = [
  {
    id: "enforce" as const,
    title: "Enforce (Production)",
    badge: "Recommended",
    badgeTone: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20",
    icon: "shield",
    subtitle: "Strict Real-Time Balance Gating",
    description:
      "Blocks students with HTTP 402 if their credit wallet is depleted. Checks daily free quota first, then deducts from promotional and purchased balance.",
    financialImpact: "Protects your LLM API bill from runaway costs and drives credit top-up sales.",
    colorClasses: {
      activeBorder: "border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-500/5",
      badge: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40",
    },
  },
  {
    id: "shadow" as const,
    title: "Shadow (Evaluation)",
    badge: "Trial & Metrics",
    badgeTone: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20",
    icon: "view",
    subtitle: "Silent Telemetry (No Blocking)",
    description:
      "Students are never blocked, even with 0 credits. Quoted credit costs are silently recorded in the database to observe student demand.",
    financialImpact: "Zero user friction, but the platform absorbs 100% of LLM costs without receiving payments.",
    colorClasses: {
      activeBorder: "border-amber-500 ring-2 ring-amber-500/20 bg-amber-500/5",
      badge: "text-amber-600 bg-amber-50 dark:bg-amber-950/40",
    },
  },
  {
    id: "off" as const,
    title: "Off (Free Tier)",
    badge: "Full Subsidy",
    badgeTone: "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20",
    icon: "alert-circle",
    subtitle: "Credit Engine Bypassed",
    description:
      "Credit deduction and checks are completely disabled. All AI actions execute freely for all students at 0 credits.",
    financialImpact: "High cost exposure: Uncapped consumption with no wallet or quota restrictions.",
    colorClasses: {
      activeBorder: "border-rose-500 ring-2 ring-rose-500/20 bg-rose-500/5",
      badge: "text-rose-600 bg-rose-50 dark:bg-rose-950/40",
    },
  },
];

export default function AdminCredits() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [initialSettings, setInitialSettings] = useState<Settings | null>(null);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [drafts, setDrafts] = useState<Record<string, Policy>>({});
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string>("");
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  // Search & Filter controls
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<string>("All");

  // Audit trail reasons
  const [policyReason, setPolicyReason] = useState("");
  const [settingsReason, setSettingsReason] = useState("");

  // Live clock ticker for the timezone preview
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 10000);
    return () => clearInterval(timer);
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchApi("/admin/credits/economy");
      setSettings(data.settings);
      setInitialSettings(data.settings);
      setPolicies(data.policies || []);
      setDrafts(Object.fromEntries((data.policies || []).map((item: Policy) => [item.key, { ...item }])));
      setHistory(data.history || []);
    } catch (error) {
      setMessage({ tone: "error", text: error instanceof Error ? error.message : "Could not load the credit economy." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Compute modified policies
  const dirtyPolicies = useMemo(() => {
    return policies.filter((policy) => {
      const draft = drafts[policy.key];
      if (!draft) return false;
      return (
        draft.cost !== policy.cost ||
        draft.freeUsesPerDay !== policy.freeUsesPerDay ||
        draft.enabled !== policy.enabled
      );
    });
  }, [policies, drafts]);

  // Compute modified settings
  const isSettingsDirty = useMemo(() => {
    if (!settings || !initialSettings) return false;
    return (
      settings.welcomeCredits !== initialSettings.welcomeCredits ||
      settings.dailyPromotionalRefill !== initialSettings.dailyPromotionalRefill ||
      settings.timezone !== initialSettings.timezone ||
      settings.enforcementMode !== initialSettings.enforcementMode
    );
  }, [settings, initialSettings]);

  // Timezone display calculations
  const timezoneInfo = useMemo(() => {
    const tz = settings?.timezone || "Africa/Tunis";
    try {
      const timeStr = new Intl.DateTimeFormat("en-US", {
        timeZone: tz,
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }).format(now);

      const parts = new Intl.DateTimeFormat("en-US", {
        timeZone: tz,
        hour: "numeric",
        minute: "numeric",
        hour12: false,
      }).formatToParts(now);

      const hour = parseInt(parts.find((p) => p.type === "hour")?.value || "0", 10);
      const minute = parseInt(parts.find((p) => p.type === "minute")?.value || "0", 10);

      const minutesUntilMidnight = 24 * 60 - (hour * 60 + minute);
      const h = Math.floor(minutesUntilMidnight / 60) % 24;
      const m = minutesUntilMidnight % 60;

      return {
        timeStr,
        countdown: `${h}h ${m}m`,
        isValid: true,
      };
    } catch {
      return { timeStr: "Invalid timezone", countdown: "", isValid: false };
    }
  }, [settings?.timezone, now]);

  // Groups and filtered policies
  const availableGroups = useMemo(() => {
    const set = new Set<string>();
    policies.forEach((p) => set.add(p.group));
    return Array.from(set);
  }, [policies]);

  const filteredPolicies = useMemo(() => {
    return policies.filter((policy) => {
      const matchesGroup = selectedGroup === "All" || policy.group === selectedGroup;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        policy.label.toLowerCase().includes(q) ||
        policy.key.toLowerCase().includes(q) ||
        policy.group.toLowerCase().includes(q);
      return matchesGroup && matchesSearch;
    });
  }, [policies, selectedGroup, searchQuery]);

  const updateDraft = (key: string, updates: Partial<Policy>) => {
    setDrafts((current) => ({
      ...current,
      [key]: { ...current[key], ...updates },
    }));
    setMessage(null);
  };

  const resetAllDrafts = () => {
    setDrafts(Object.fromEntries(policies.map((p) => [p.key, { ...p }])));
    setPolicyReason("");
    setMessage(null);
  };

  const resetSettings = () => {
    if (initialSettings) {
      setSettings({ ...initialSettings });
      setSettingsReason("");
    }
  };

  // Save all modified policies in one batch action
  const saveAllDirtyPolicies = async () => {
    if (!dirtyPolicies.length) return;
    if (!policyReason.trim()) {
      setMessage({
        tone: "error",
        text: "Please provide a short change reason for the audit log before saving pricing.",
      });
      return;
    }

    setSaving("policies-batch");
    setMessage(null);
    try {
      const updatedList = await Promise.all(
        dirtyPolicies.map(async (policy) => {
          const draft = drafts[policy.key];
          const result = await fetchApi(`/admin/credits/policies/${policy.key}`, {
            method: "PATCH",
            body: JSON.stringify({
              cost: asNumber(draft.cost),
              freeUsesPerDay: asNumber(draft.freeUsesPerDay),
              enabled: draft.enabled,
              reason: policyReason.trim(),
            }),
          });
          return result.policy as Policy;
        })
      );

      const map = new Map(updatedList.map((p) => [p.key, p]));
      setPolicies((current) => current.map((p) => map.get(p.key) || p));
      setDrafts((current) => {
        const next = { ...current };
        updatedList.forEach((p) => {
          next[p.key] = { ...p };
        });
        return next;
      });

      const count = updatedList.length;
      setMessage({
        tone: "success",
        text: `Successfully saved ${count} policy ${count === 1 ? "change" : "changes"}.`,
      });
      setPolicyReason("");

      // Refresh audit history
      const freshData = await fetchApi("/admin/credits/economy");
      if (freshData.history) setHistory(freshData.history);
    } catch (error) {
      setMessage({
        tone: "error",
        text: error instanceof Error ? error.message : "Failed to save policy updates.",
      });
    } finally {
      setSaving("");
    }
  };

  // Save single policy
  const saveSinglePolicy = async (policy: Policy) => {
    const draft = drafts[policy.key];
    if (!policyReason.trim()) {
      setMessage({
        tone: "error",
        text: `Please enter a change reason below before saving "${policy.label}".`,
      });
      return;
    }

    setSaving(policy.key);
    setMessage(null);
    try {
      const result = await fetchApi(`/admin/credits/policies/${policy.key}`, {
        method: "PATCH",
        body: JSON.stringify({
          cost: asNumber(draft.cost),
          freeUsesPerDay: asNumber(draft.freeUsesPerDay),
          enabled: draft.enabled,
          reason: policyReason.trim(),
        }),
      });

      setPolicies((current) => current.map((item) => (item.key === policy.key ? result.policy : item)));
      setDrafts((current) => ({ ...current, [policy.key]: result.policy }));
      setMessage({ tone: "success", text: `${policy.label} pricing updated.` });
      setPolicyReason("");

      const freshData = await fetchApi("/admin/credits/economy");
      if (freshData.history) setHistory(freshData.history);
    } catch (error) {
      setMessage({ tone: "error", text: error instanceof Error ? error.message : "Could not save this policy." });
    } finally {
      setSaving("");
    }
  };

  // Save wallet settings & enforcement mode
  const saveSettings = async () => {
    if (!settings) return;
    if (!settingsReason.trim()) {
      setMessage({
        tone: "error",
        text: "Please enter a change reason for the audit log before updating wallet defaults.",
      });
      return;
    }

    setSaving("settings");
    setMessage(null);
    try {
      const result = await fetchApi("/admin/credits/settings", {
        method: "PATCH",
        body: JSON.stringify({
          welcomeCredits: asNumber(settings.welcomeCredits),
          dailyPromotionalRefill: asNumber(settings.dailyPromotionalRefill),
          timezone: settings.timezone.trim(),
          enforcementMode: settings.enforcementMode,
          reason: settingsReason.trim(),
        }),
      });

      setSettings(result.settings);
      setInitialSettings(result.settings);
      setSettingsReason("");
      setMessage({ tone: "success", text: "Wallet defaults and enforcement rules updated." });

      const freshData = await fetchApi("/admin/credits/economy");
      if (freshData.history) setHistory(freshData.history);
    } catch (error) {
      setMessage({ tone: "error", text: error instanceof Error ? error.message : "Could not save settings." });
    } finally {
      setSaving("");
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 pb-24">
      {/* =========================================================================
          PAGE HEADER & EXECUTIVE TELEMETRY
         ========================================================================= */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-amber-700 dark:text-amber-300">
            <img src={creditCoin} alt="" className="h-4 w-4" /> Credit Economy & Monetization
          </div>
          <h1 className="text-2xl font-black tracking-tight text-on-surface sm:text-3xl">
            Pricing, Refills & Enforcement
          </h1>
          <p className="mt-1 max-w-2xl text-xs sm:text-sm text-on-surface-variant">
            Adjust live AI feature pricing, configure student promotional refills, and set credit gating rules without deployments.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="inline-flex h-9 items-center gap-2 rounded-xl border border-outline-variant bg-surface px-3 text-xs font-bold text-on-surface shadow-2xs transition hover:bg-surface-container disabled:opacity-50"
          >
            <HugeiconsIcon icon="refresh" size={15} className={loading ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>
        </div>
      </header>

      {/* Telemetry Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-outline-variant/80 bg-surface-container-lowest p-4 shadow-2xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Enforcement Mode</p>
          <div className="mt-1.5 flex items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-extrabold uppercase tracking-wider",
                settings?.enforcementMode === "enforce"
                  ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                  : settings?.enforcementMode === "shadow"
                  ? "bg-amber-500/10 text-amber-700 dark:text-amber-300"
                  : "bg-rose-500/10 text-rose-700 dark:text-rose-300"
              )}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              {settings?.enforcementMode || "..."}
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-outline-variant/80 bg-surface-container-lowest p-4 shadow-2xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Welcome Bonus</p>
          <div className="mt-1.5 flex items-center gap-1.5">
            <img src={creditCoin} alt="" className="h-4 w-4" />
            <span className="font-mono text-lg font-extrabold text-on-surface">
              {settings?.welcomeCredits ?? "..."}
            </span>
            <span className="text-[11px] text-on-surface-variant">credits</span>
          </div>
        </div>

        <div className="rounded-2xl border border-outline-variant/80 bg-surface-container-lowest p-4 shadow-2xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Daily Midnight Refill</p>
          <div className="mt-1.5 flex items-center gap-1.5">
            <img src={creditCoin} alt="" className="h-4 w-4" />
            <span className="font-mono text-lg font-extrabold text-on-surface">
              {settings?.dailyPromotionalRefill ?? "..."}
            </span>
            <span className="text-[11px] text-on-surface-variant">/ day</span>
          </div>
        </div>

        <div className="rounded-2xl border border-outline-variant/80 bg-surface-container-lowest p-4 shadow-2xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Priced AI Actions</p>
          <div className="mt-1.5 flex items-center gap-1.5">
            <span className="font-mono text-lg font-extrabold text-on-surface">{policies.length}</span>
            <span className="text-[11px] text-on-surface-variant">configured</span>
          </div>
        </div>
      </div>

      {/* Global Notification Banner */}
      {message && (
        <div
          className={cn(
            "flex items-center justify-between rounded-xl border px-4 py-3 text-xs font-semibold shadow-xs animate-in fade-in slide-in-from-top-2",
            message.tone === "success"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200"
              : "border-error/30 bg-error/10 text-error"
          )}
        >
          <div className="flex items-center gap-2">
            <HugeiconsIcon icon={message.tone === "success" ? "check" : "alert-circle"} size={16} strokeWidth={2} />
            <span>{message.text}</span>
          </div>
          <button type="button" onClick={() => setMessage(null)} className="text-current opacity-70 hover:opacity-100">
            ✕
          </button>
        </div>
      )}

      {/* =========================================================================
          SECTION 1: ENFORCEMENT ENGINE SELECTION (CRUCIAL EXPLANATION)
         ========================================================================= */}
      <section className="overflow-hidden rounded-2xl border border-outline-variant/80 bg-surface shadow-2xs">
        <div className="border-b border-outline-variant/60 bg-surface-container-low/40 p-5">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                  System Gating Policy
                </span>
                <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-extrabold text-primary">
                  Core Engine
                </span>
              </div>
              <h2 className="mt-1 text-base font-extrabold text-on-surface">AI Engine Enforcement Mode</h2>
              <p className="mt-0.5 text-xs text-on-surface-variant">
                Controls whether the system strictly bills students, runs in trial monitoring, or allows unrestricted free access.
              </p>
            </div>

            {isSettingsDirty && (
              <span className="self-start rounded-full border border-amber-400/40 bg-amber-400/15 px-2.5 py-1 text-[11px] font-bold text-amber-700 dark:text-amber-300">
                Unsaved Settings
              </span>
            )}
          </div>
        </div>

        <div className="p-5">
          {/* 3 Interactive Cards */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {ENFORCEMENT_CARDS.map((card) => {
              const isSelected = settings?.enforcementMode === card.id;

              return (
                <div
                  key={card.id}
                  onClick={() => settings && setSettings({ ...settings, enforcementMode: card.id })}
                  className={cn(
                    "group relative flex cursor-pointer flex-col justify-between rounded-2xl border p-5 transition-all",
                    isSelected
                      ? cn("shadow-md", card.colorClasses.activeBorder)
                      : "border-outline-variant/70 bg-surface hover:border-outline-variant hover:bg-surface-container-low/30"
                  )}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div
                          className={cn(
                            "grid h-8 w-8 place-items-center rounded-xl",
                            isSelected ? "bg-primary text-on-primary" : "bg-surface-container-high text-on-surface-variant"
                          )}
                        >
                          <HugeiconsIcon icon={card.icon} size={16} strokeWidth={2} />
                        </div>
                        <div>
                          <h3 className="text-sm font-black text-on-surface">{card.title}</h3>
                          <span className="text-[10px] font-medium text-on-surface-variant">{card.subtitle}</span>
                        </div>
                      </div>

                      <div
                        className={cn(
                          "grid h-5 w-5 place-items-center rounded-full border transition-all",
                          isSelected
                            ? "border-primary bg-primary text-on-primary"
                            : "border-outline-variant bg-surface"
                        )}
                      >
                        {isSelected && <span className="h-2 w-2 rounded-full bg-on-primary" />}
                      </div>
                    </div>

                    <p className="mt-3 text-xs leading-relaxed text-on-surface-variant">{card.description}</p>
                  </div>

                  <div className="mt-4 border-t border-outline-variant/60 pt-3">
                    <div className="flex items-start gap-1.5 text-[11px]">
                      <span className="font-bold text-on-surface shrink-0">Financial Impact:</span>
                      <span className="text-on-surface-variant leading-snug">{card.financialImpact}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Warning Banner when NOT in Enforce mode */}
          {settings?.enforcementMode !== "enforce" && (
            <div className="mt-4 flex items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-800 dark:text-amber-200">
              <HugeiconsIcon icon="alert-circle" size={18} className="shrink-0 text-amber-600" />
              <div>
                <p className="font-extrabold">Notice: Monetization is currently bypassed.</p>
                <p className="opacity-90">
                  Students will not be prompted to pay or refill credits. Your organization absorbs all LLM API token costs.
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* =========================================================================
          SECTION 2: WALLET DEFAULTS & REFILL TIMEZONE
         ========================================================================= */}
      <section className="overflow-hidden rounded-2xl border border-outline-variant/80 bg-surface shadow-2xs">
        <div className="border-b border-outline-variant/60 bg-surface-container-low/40 p-5">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                Student Allowances
              </span>
              <h2 className="mt-1 text-base font-extrabold text-on-surface">Wallet Balances & Daily Refill Cadence</h2>
              <p className="mt-0.5 text-xs text-on-surface-variant">
                Define the initial credits granted to new students and the daily midnight replenishment amount.
              </p>
            </div>
          </div>
        </div>

        <div className="p-5">
          {settings && (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              {/* 1. Welcome Credits */}
              <div className="rounded-xl border border-outline-variant/70 bg-surface-container-lowest p-4">
                <label className="block text-xs font-bold text-on-surface">
                  Welcome Bonus
                  <span className="ml-1 text-[10px] font-normal text-on-surface-variant">(Granted once on registration)</span>
                </label>
                <div className="mt-2 flex h-10 items-center rounded-lg border border-outline-variant bg-surface px-3 focus-within:border-primary">
                  <img src={creditCoin} alt="" className="mr-2 h-4 w-4 shrink-0" />
                  <input
                    type="number"
                    min="0"
                    value={settings.welcomeCredits}
                    onChange={(e) => setSettings({ ...settings, welcomeCredits: asNumber(e.target.value) })}
                    className="w-full bg-transparent font-mono text-sm font-extrabold text-on-surface outline-none"
                  />
                  <span className="text-xs text-on-surface-variant">credits</span>
                </div>
                <p className="mt-1.5 text-[11px] text-on-surface-variant">
                  Initial budget for students to try AI generation immediately upon signup.
                </p>
              </div>

              {/* 2. Daily Promotional Refill */}
              <div className="rounded-xl border border-outline-variant/70 bg-surface-container-lowest p-4">
                <label className="block text-xs font-bold text-on-surface">
                  Daily Promotional Refill
                  <span className="ml-1 text-[10px] font-normal text-on-surface-variant">(Top-up ceiling each midnight)</span>
                </label>
                <div className="mt-2 flex h-10 items-center rounded-lg border border-outline-variant bg-surface px-3 focus-within:border-primary">
                  <img src={creditCoin} alt="" className="mr-2 h-4 w-4 shrink-0" />
                  <input
                    type="number"
                    min="0"
                    value={settings.dailyPromotionalRefill}
                    onChange={(e) => setSettings({ ...settings, dailyPromotionalRefill: asNumber(e.target.value) })}
                    className="w-full bg-transparent font-mono text-sm font-extrabold text-on-surface outline-none"
                  />
                  <span className="text-xs text-on-surface-variant">/ day</span>
                </div>
                <p className="mt-1.5 text-[11px] text-on-surface-variant">
                  If student promotional balance is below this amount, it refills up to this target.
                </p>
              </div>

              {/* 3. Refill Timezone (Midnight Cutoff) with Live Ticker */}
              <div className="rounded-xl border border-outline-variant/70 bg-surface-container-lowest p-4">
                <label className="block text-xs font-bold text-on-surface">
                  Refill Timezone (Midnight Cutoff)
                  <span className="ml-1 text-[10px] font-normal text-on-surface-variant">(When 00:00 resets occur)</span>
                </label>
                <div className="mt-2">
                  <select
                    value={settings.timezone}
                    onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                    className="h-10 w-full rounded-lg border border-outline-variant bg-surface px-3 text-xs font-semibold text-on-surface outline-none focus:border-primary"
                  >
                    {TIMEZONE_GROUPS.map((group) => (
                      <optgroup key={group.region} label={group.region}>
                        {group.options.map((tz) => (
                          <option key={tz.value} value={tz.value}>
                            {tz.label}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                    {/* Fallback option if current setting is outside the curated list */}
                    {!TIMEZONE_GROUPS.some((g) => g.options.some((o) => o.value === settings.timezone)) && (
                      <option value={settings.timezone}>{settings.timezone} (Custom)</option>
                    )}
                  </select>
                </div>

                {/* Live Ticker Information */}
                <div className="mt-2.5 flex items-center justify-between rounded-lg bg-surface-container px-2.5 py-1.5 text-[11px]">
                  <div className="flex items-center gap-1.5 text-on-surface font-semibold">
                    <HugeiconsIcon icon="clock" size={13} className="text-primary" />
                    <span>Local Time: {timezoneInfo.timeStr}</span>
                  </div>
                  {timezoneInfo.countdown && (
                    <span className="text-[10px] font-bold text-secondary">
                      Refill in {timezoneInfo.countdown}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-[10px] text-on-surface-variant">
                  At 00:00:00 in this timezone, all daily free quotas and promotional refills reset.
                </p>
              </div>
            </div>
          )}

          {/* Audit Reason & Save Bar for Wallet Settings */}
          {isSettingsDirty && (
            <div className="mt-5 rounded-xl border border-primary/20 bg-primary/5 p-4 animate-in fade-in">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-on-surface">
                    Audit Change Reason <span className="text-error">*</span>
                  </label>
                  <input
                    value={settingsReason}
                    onChange={(e) => setSettingsReason(e.target.value)}
                    placeholder="e.g. Switched to production enforcement and updated welcome allowance"
                    maxLength={300}
                    className="mt-1 h-9 w-full rounded-lg border border-outline-variant bg-surface px-3 text-xs text-on-surface outline-none focus:border-primary"
                  />
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto sm:pt-4">
                  <button
                    type="button"
                    onClick={resetSettings}
                    className="h-9 rounded-lg border border-outline-variant bg-surface px-3 text-xs font-bold text-on-surface-variant hover:text-on-surface"
                  >
                    Discard
                  </button>
                  <button
                    type="button"
                    onClick={saveSettings}
                    disabled={saving === "settings"}
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-4 text-xs font-extrabold text-on-primary shadow-xs transition hover:bg-primary/90 disabled:opacity-50"
                  >
                    {saving === "settings" ? "Saving..." : "Save Settings & Enforcement"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* =========================================================================
          SECTION 3: AI ACTION PRICING & TARIFFS
         ========================================================================= */}
      <section className="overflow-hidden rounded-2xl border border-outline-variant/80 bg-surface shadow-2xs">
        {/* Table Controls Header */}
        <div className="border-b border-outline-variant/60 bg-surface-container-low/40 p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                  Tariff Catalog
                </span>
                <span className="rounded-md bg-secondary/10 px-2 py-0.5 text-[10px] font-bold text-secondary">
                  {policies.length} Actions
                </span>
              </div>
              <h2 className="mt-1 text-base font-extrabold text-on-surface">AI Action Pricing & Allowances</h2>
              <p className="mt-0.5 text-xs text-on-surface-variant">
                Set the credit cost and daily free uses for each AI action. Setting cost to 0 keeps the action free.
              </p>
            </div>

            {/* Search & Filter Bar */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative min-w-[200px] flex-1 sm:flex-initial">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter actions or keys..."
                  className="h-9 w-full rounded-xl border border-outline-variant bg-surface pl-8 pr-3 text-xs text-on-surface outline-none focus:border-primary"
                />
                <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant">
                  <HugeiconsIcon icon="search-01" size={14} />
                </span>
              </div>
            </div>
          </div>

          {/* Category Group Tabs */}
          <div className="mt-4 flex flex-wrap gap-1.5 border-t border-outline-variant/40 pt-3">
            <button
              type="button"
              onClick={() => setSelectedGroup("All")}
              className={cn(
                "rounded-lg px-2.5 py-1 text-xs font-bold transition-all",
                selectedGroup === "All"
                  ? "bg-primary text-on-primary shadow-xs"
                  : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
              )}
            >
              All ({policies.length})
            </button>
            {availableGroups.map((group) => {
              const count = policies.filter((p) => p.group === group).length;
              return (
                <button
                  key={group}
                  type="button"
                  onClick={() => setSelectedGroup(group)}
                  className={cn(
                    "rounded-lg px-2.5 py-1 text-xs font-bold transition-all",
                    selectedGroup === group
                      ? "bg-primary text-on-primary shadow-xs"
                      : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
                  )}
                >
                  {group} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Policy Rows */}
        <div className="divide-y divide-outline-variant/40">
          {loading ? (
            <div className="py-16 text-center text-xs text-on-surface-variant">Loading credit policies...</div>
          ) : filteredPolicies.length === 0 ? (
            <div className="py-16 text-center text-xs text-on-surface-variant">
              No actions match &ldquo;{searchQuery}&rdquo; in category &ldquo;{selectedGroup}&rdquo;.
            </div>
          ) : (
            filteredPolicies.map((policy) => {
              const draft = drafts[policy.key] || policy;
              const isDirty =
                draft.cost !== policy.cost ||
                draft.freeUsesPerDay !== policy.freeUsesPerDay ||
                draft.enabled !== policy.enabled;

              return (
                <div
                  key={policy.key}
                  className={cn(
                    "grid grid-cols-1 gap-3 p-4 transition-colors sm:grid-cols-[minmax(14rem,1.8fr)_7rem_7rem_5rem_auto] sm:items-center sm:px-6",
                    isDirty ? "bg-amber-400/5 dark:bg-amber-400/10" : "hover:bg-surface-container-lowest"
                  )}
                >
                  {/* Action Identification */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-xs font-extrabold text-on-surface">{policy.label}</p>
                      {policy.cost === 0 && (
                        <span className="rounded bg-secondary/10 px-1.5 py-0.5 text-[9px] font-extrabold text-secondary">
                          Free
                        </span>
                      )}
                      {isDirty && (
                        <span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-extrabold text-amber-700 dark:text-amber-300">
                          Modified
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 font-mono text-[10px] text-on-surface-variant/80">
                      <span>{policy.key}</span>
                      <span>·</span>
                      <span className="rounded bg-surface-container px-1 py-0.2">{policy.group}</span>
                      <span>·</span>
                      <span>v{policy.version}</span>
                    </div>
                  </div>

                  {/* Cost Input */}
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                      Cost
                    </label>
                    <div className="mt-1 flex h-9 items-center rounded-lg border border-outline-variant bg-surface px-2.5 focus-within:border-primary">
                      <img src={creditCoin} alt="" className="mr-1.5 h-3.5 w-3.5 shrink-0" />
                      <input
                        type="number"
                        min="0"
                        disabled={!policy.editable}
                        value={draft.cost}
                        onChange={(e) => updateDraft(policy.key, { cost: asNumber(e.target.value) })}
                        className="w-full bg-transparent font-mono text-xs font-extrabold text-on-surface outline-none disabled:opacity-50"
                      />
                    </div>
                  </div>

                  {/* Free Daily Uses */}
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                      Free / Day
                    </label>
                    <div className="mt-1 flex h-9 items-center rounded-lg border border-outline-variant bg-surface px-2.5 focus-within:border-primary">
                      <input
                        type="number"
                        min="0"
                        disabled={!policy.editable}
                        value={draft.freeUsesPerDay}
                        onChange={(e) => updateDraft(policy.key, { freeUsesPerDay: asNumber(e.target.value) })}
                        className="w-full bg-transparent font-mono text-xs font-bold text-on-surface outline-none disabled:opacity-50"
                      />
                    </div>
                  </div>

                  {/* Status Toggle */}
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                      Active
                    </span>
                    <label className="mt-2 inline-flex cursor-pointer items-center">
                      <input
                        type="checkbox"
                        checked={draft.enabled}
                        disabled={!policy.editable}
                        onChange={(e) => updateDraft(policy.key, { enabled: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="relative h-5 w-9 rounded-full bg-surface-container-high transition-colors peer-checked:bg-primary peer-disabled:opacity-50 after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all peer-checked:after:translate-x-full" />
                    </label>
                  </div>

                  {/* Row Quick Action */}
                  <div className="flex items-center justify-end">
                    {isDirty ? (
                      <button
                        type="button"
                        disabled={saving === policy.key}
                        onClick={() => saveSinglePolicy(policy)}
                        title="Save this price individually"
                        className="inline-flex h-8 items-center gap-1 rounded-lg bg-primary/10 px-2.5 text-[11px] font-bold text-primary transition hover:bg-primary/20 disabled:opacity-50"
                      >
                        <HugeiconsIcon icon="check" size={13} strokeWidth={2} />
                        <span>{saving === policy.key ? "Saving..." : "Save Row"}</span>
                      </button>
                    ) : (
                      <span className="text-[11px] font-semibold text-on-surface-variant/60">
                        {policy.editable ? "Saved" : "Locked"}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* =========================================================================
          FLOATING BATCH SAVE BAR (When policies are modified)
         ========================================================================= */}
      {dirtyPolicies.length > 0 && (
        <aside aria-label="Unsaved pricing changes" className="fixed bottom-4 left-1/2 z-40 w-[95%] max-w-4xl -translate-x-1/2 rounded-2xl border border-primary/30 bg-surface/95 p-4 shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                <p className="text-xs font-extrabold text-on-surface">
                  {dirtyPolicies.length} {dirtyPolicies.length === 1 ? "Price Policy" : "Price Policies"} Modified
                </p>
              </div>
              <input
                value={policyReason}
                onChange={(e) => setPolicyReason(e.target.value)}
                placeholder="Required audit reason (e.g. Adjusted defense simulation and report builder pricing)"
                maxLength={300}
                className="mt-1.5 h-9 w-full rounded-lg border border-outline-variant bg-surface px-3 text-xs text-on-surface outline-none focus:border-primary"
              />
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto sm:pt-4 shrink-0">
              <button
                type="button"
                onClick={resetAllDrafts}
                className="h-9 rounded-lg border border-outline-variant bg-surface px-3 text-xs font-bold text-on-surface-variant hover:text-on-surface transition"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={saveAllDirtyPolicies}
                disabled={saving === "policies-batch"}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-4 text-xs font-extrabold text-on-primary shadow-md transition hover:bg-primary/90 disabled:opacity-50"
              >
                {saving === "policies-batch" ? "Saving..." : `Save All (${dirtyPolicies.length}) Changes`}
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* =========================================================================
          SECTION 4: AUDIT TRAIL (RECENT ECONOMY CHANGES)
         ========================================================================= */}
      <section className="overflow-hidden rounded-2xl border border-outline-variant/80 bg-surface shadow-2xs">
        <div className="border-b border-outline-variant/60 bg-surface-container-low/40 p-5">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                Governance & Audit Trail
              </span>
              <h2 className="mt-1 text-base font-extrabold text-on-surface">Recent Pricing & Settings Updates</h2>
              <p className="mt-0.5 text-xs text-on-surface-variant">
                Permanent cryptographic audit log of all economic changes, reasons, and version increments.
              </p>
            </div>
            <span className="rounded-md bg-surface-container-high px-2 py-1 font-mono text-[10px] font-bold text-on-surface-variant">
              Immutable Log
            </span>
          </div>
        </div>

        <div className="divide-y divide-outline-variant/40">
          {history.length ? (
            history.slice(0, 8).map((item) => (
              <div key={item._id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-primary/10 px-2 py-0.5 font-mono text-[10px] font-bold text-primary">
                      {item.targetKey}
                    </span>
                    <span className="text-xs font-bold text-on-surface">v{item.version}</span>
                    {item.actor?.fullName && (
                      <span className="text-[11px] text-on-surface-variant">by {item.actor.fullName}</span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-on-surface-variant/90 italic">&ldquo;{item.reason}&rdquo;</p>
                </div>

                <div className="shrink-0 text-[11px] font-medium text-on-surface-variant/75">
                  {new Date(item.createdAt).toLocaleString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            ))
          ) : (
            <p className="py-8 text-center text-xs text-on-surface-variant">No economy changes recorded yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}
