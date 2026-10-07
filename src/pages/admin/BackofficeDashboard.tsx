import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { fetchApi } from "@/lib/api";
import HugeiconsIcon from "@/components/ui/HugeiconsIcon";
import creditCoin from "@/assets/credit-coin.png";
import { useTranslation } from "react-i18next";
import { displayOptionLabel } from "@/lib/onboardingOptions";

type Item = { label: string; value: number };
type Day = { key?: string; label: string; spent: number; fulfilled: number };

type DashboardData = {
  totals: {
    users: number;
    students: number;
    admins: number;
    projects: number;
    completedOnboarding: number;
    creditsSpent: number;
    purchasedFulfilled: number;
    walletCredits: number;
    promotionalCredits?: number;
    purchasedCredits?: number;
  };
  charts: {
    studentGrowth: Item[];
    projectGrowth: Item[];
    onboardingStatus: Item[];
    domains: Item[];
    actionDemand: Item[];
    creditActivity: Day[];
    creditMonthly?: Day[];
  };
  recentUsers: Array<{
    _id: string;
    fullName: string;
    email: string;
    role?: string;
    hasCompletedOnboarding?: boolean;
    createdAt: string;
  }>;
  recentProjects: Array<{
    _id: string;
    basics?: { title?: string; domain?: string };
    user?: { fullName?: string; email?: string };
    createdAt: string;
  }>;
  recentFulfillments: Array<{
    _id: string;
    user?: { fullName?: string; email?: string };
    purchasedDelta: number;
    reason: string;
    createdAt: string;
  }>;
};

const emptyDashboard: DashboardData = {
  totals: {
    users: 0,
    students: 0,
    admins: 0,
    projects: 0,
    completedOnboarding: 0,
    creditsSpent: 0,
    purchasedFulfilled: 0,
    walletCredits: 0,
    promotionalCredits: 0,
    purchasedCredits: 0,
  },
  charts: {
    studentGrowth: [],
    projectGrowth: [],
    onboardingStatus: [],
    domains: [],
    actionDemand: [],
    creditActivity: [],
    creditMonthly: [],
  },
  recentUsers: [],
  recentProjects: [],
  recentFulfillments: [],
};

type CreditTimeRange = "24h" | "7d" | "30d" | "12m";
type CreditGranularity = "day" | "week" | "month";
type MomentumTimeRange = "12m" | "6m" | "3m";

const formatCreditDateKey = (key: string | undefined, locale: string, fallback: string) => {
  const dayMatch = key?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const monthMatch = key?.match(/^(\d{4})-(\d{2})$/);
  if (!dayMatch && !monthMatch) return fallback;
  const year = Number((dayMatch || monthMatch)?.[1]);
  const month = Number((dayMatch || monthMatch)?.[2]) - 1;
  const day = dayMatch ? Number(dayMatch[3]) : 1;
  const date = new Date(Date.UTC(year, month, day));
  return new Intl.DateTimeFormat(locale, {
    month: "short",
    ...(dayMatch ? { day: "numeric" as const } : {}),
    timeZone: "UTC",
  }).format(date);
};

const formatRelativeTime = (dateStr: string, locale: string, t: (key: string, options?: any) => string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return t("dashboard.relative.now");
  if (minutes < 60) return t("dashboard.relative.minutes", { count: minutes });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t("dashboard.relative.hours", { count: hours });
  const days = Math.floor(hours / 24);
  if (days < 7) return t("dashboard.relative.days", { count: days });
  return new Intl.DateTimeFormat(locale, { month: "short", day: "numeric" }).format(new Date(dateStr));
};

export default function BackofficeDashboard() {
  const { t, i18n } = useTranslation("adminManagement");
  const tOnboarding = i18n.getFixedT(i18n.resolvedLanguage || i18n.language, "onboarding");
  const tCreditHistory = i18n.getFixedT(i18n.resolvedLanguage || i18n.language, "creditHistory");
  const [data, setData] = useState<DashboardData>(emptyDashboard);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [errorKey, setErrorKey] = useState<string | null>(null);

  // Credit Filter Controls (As shown in reference photo)
  const [creditRange, setCreditRange] = useState<CreditTimeRange>("30d");
  const [creditGranularity, setCreditGranularity] = useState<CreditGranularity>("day");
  const [activeCreditBar, setActiveCreditBar] = useState<number | null>(null);

  const handleCreditRangeChange = (range: CreditTimeRange) => {
    setCreditRange(range);
    setActiveCreditBar(null);
    if (range === "12m") {
      setCreditGranularity("month");
    } else if (creditGranularity === "month") {
      setCreditGranularity("day");
    }
  };

  // Momentum Filter Controls
  const [momentumRange, setMomentumRange] = useState<MomentumTimeRange>("12m");
  const [activeSeries, setActiveSeries] = useState<"both" | "students" | "projects">("both");
  const [activeGrowthPoint, setActiveGrowthPoint] = useState<number | null>(null);

  const loadData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError("");
    setErrorKey(null);
    try {
      const response = await fetchApi("/admin/dashboard");
      setData(response);
    } catch (err) {
      if (err instanceof Error) setError(err.message);
      else { setError(""); setErrorKey("dashboard.error"); }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered and aggregated Credit Activity
  const processedCreditActivity = useMemo(() => {
    if (creditRange === "12m") {
      if (data.charts.creditMonthly && data.charts.creditMonthly.length > 0) {
        return data.charts.creditMonthly;
      }
    }

    const rawDays = data.charts.creditActivity || [];
    if (!rawDays.length) return [];

    // Slice based on creditRange
    let sliced = rawDays;
    if (creditRange === "24h") {
      sliced = rawDays.slice(-1);
    } else if (creditRange === "7d") {
      sliced = rawDays.slice(-7);
    } else if (creditRange === "30d") {
      sliced = rawDays.slice(-30);
    } else if (creditRange === "12m") {
      sliced = rawDays;
    }

    if (creditGranularity === "day") {
      return sliced;
    }

    if (creditGranularity === "week") {
      // Group into 7-day chunks
      const weeks: Day[] = [];
      for (let i = 0; i < sliced.length; i += 7) {
        const chunk = sliced.slice(i, i + 7);
        const spent = chunk.reduce((sum, d) => sum + d.spent, 0);
        const fulfilled = chunk.reduce((sum, d) => sum + d.fulfilled, 0);
        const label = t("dashboard.credit.weekLabel", {
          week: Math.floor(i / 7) + 1,
          date: formatCreditDateKey(chunk[0]?.key, i18n.language, chunk[0]?.label || ""),
        });
        weeks.push({ label, spent, fulfilled });
      }
      return weeks;
    }

    if (creditGranularity === "month") {
      if (data.charts.creditMonthly && data.charts.creditMonthly.length > 0) {
        return data.charts.creditMonthly;
      }
      const spent = sliced.reduce((sum, d) => sum + d.spent, 0);
      const fulfilled = sliced.reduce((sum, d) => sum + d.fulfilled, 0);
      return [{ label: t("dashboard.credit.selectedPeriod"), spent, fulfilled }];
    }

    return sliced;
  }, [data.charts.creditActivity, data.charts.creditMonthly, creditRange, creditGranularity, t]);

  // Date range formatted label for Credit Telemetry
  const creditDateRangeLabel = useMemo(() => {
    const now = new Date();
    const endStr = new Intl.DateTimeFormat(i18n.language, { month: "short", day: "numeric", year: "numeric" }).format(now);
    let daysBack = 30;
    if (creditRange === "24h") daysBack = 1;
    if (creditRange === "7d") daysBack = 7;
    if (creditRange === "30d") daysBack = 30;
    if (creditRange === "12m") daysBack = 365;

    const start = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);
    const startStr = new Intl.DateTimeFormat(i18n.language, { month: "short", day: "numeric", year: "numeric" }).format(start);
    return `${startStr} – ${endStr}`;
  }, [creditRange, i18n.language]);

  // Filtered Student & Project Growth Momentum
  const processedMomentum = useMemo(() => {
    const count = momentumRange === "12m" ? 12 : momentumRange === "6m" ? 6 : 3;
    return {
      students: (data.charts.studentGrowth || []).slice(-count),
      projects: (data.charts.projectGrowth || []).slice(-count),
    };
  }, [data.charts.studentGrowth, data.charts.projectGrowth, momentumRange]);

  // Key Credit Economics & Insights
  const creditMetrics = useMemo(() => {
    const studentsCount = data.totals.students || 1;
    const avgBurnPerStudent = Math.round(data.totals.creditsSpent / studentsCount);
    const activationRate = Math.round(((data.totals.completedOnboarding || 0) / studentsCount) * 100);
    const totalCirculating = data.totals.walletCredits || 0;
    const purchased = data.totals.purchasedCredits || 0;
    const purchasedRatio = totalCirculating > 0 ? Math.round((purchased / totalCirculating) * 100) : 0;

    return {
      avgBurnPerStudent,
      activationRate,
      purchasedRatio,
      totalSpent: data.totals.creditsSpent,
      totalFulfilled: data.totals.purchasedFulfilled,
      circulating: totalCirculating,
    };
  }, [data.totals]);

  const totalActionDemand = useMemo(() => {
    return data.charts.actionDemand.reduce((acc, curr) => acc + curr.value, 0);
  }, [data.charts.actionDemand]);

  const totalDomainCount = useMemo(() => {
    return data.charts.domains.reduce((acc, curr) => acc + curr.value, 0);
  }, [data.charts.domains]);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 pb-20">
      {/* Top Bar: Live Operational Status & Header */}
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {t("dashboard.productionTelemetry")}
            </span>
            <span className="text-[11px] font-semibold text-on-surface-variant">{t("dashboard.pulse")}</span>
          </div>
          <h1 className="mt-1.5 text-2xl font-extrabold tracking-tight text-on-surface sm:text-3xl">
            {t("dashboard.title")}
          </h1>
          <p className="mt-1 text-sm text-on-surface-variant max-w-2xl leading-relaxed">
            {t("dashboard.description")}
          </p>
        </div>

        {/* Global Action Controls */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          <button
            type="button"
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-outline-variant bg-surface px-3 text-xs font-bold text-on-surface shadow-2xs transition-all hover:bg-surface-container-low active:scale-[.98] disabled:opacity-50"
            title={t("dashboard.refreshTitle")}
          >
            <span className={refreshing ? "animate-spin" : ""}>
              <HugeiconsIcon icon="refresh" size={14} strokeWidth={1.8} />
            </span>
            <span>{t("common.refresh")}</span>
          </button>

          <Link
            to="/admin/credits"
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-amber-400/40 bg-amber-400/10 px-3 text-xs font-bold text-amber-700 dark:text-amber-300 shadow-2xs transition-all hover:bg-amber-400/20 active:scale-[.98]"
          >
            <img src={creditCoin} alt="" className="h-4 w-4" />
            <span>{t("dashboard.economyPolicies")}</span>
          </Link>

          <Link
            to="/admin/users"
            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-primary px-3.5 text-xs font-bold text-on-primary shadow-xs transition-all hover:bg-primary/90 active:scale-[.98]"
          >
            <HugeiconsIcon icon="group" size={14} strokeWidth={1.8} />
            <span>{t("dashboard.manageUsers")}</span>
          </Link>
        </div>
      </header>

      {/* Error Banner */}
      {(error || errorKey) && (
        <div className="flex items-center gap-3 rounded-2xl border border-error/30 bg-error/10 p-4 text-xs font-semibold text-error shadow-2xs">
          <HugeiconsIcon icon="alert-circle" size={18} strokeWidth={2} />
          <span>{errorKey ? t(errorKey) : error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-outline-variant/80 bg-surface-container-lowest p-20 text-center shadow-2xs">
          <div className="h-10 w-10 animate-spin rounded-full border-3 border-primary border-t-transparent" />
          <p className="mt-4 text-sm font-bold text-on-surface">{t("dashboard.loading")}</p>
          <p className="mt-1 text-xs text-on-surface-variant">{t("dashboard.loadingDescription")}</p>
        </div>
      ) : (
        <>
          {/* =========================================================================
              CREDIT-FIRST HERO KPI RIBBON (Oriented around Revenue & Credit Economy)
             ========================================================================= */}
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {/* KPI 1: Purchased Credits Fulfilled (Main Revenue Driver) */}
            <CreditKpiCard
              label={t("dashboard.kpi.purchasedFulfilled")}
              value={data.totals.purchasedFulfilled.toLocaleString(i18n.language)}
              badge={t("dashboard.kpi.directRevenue")}
              badgeColor="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
              helper={t("dashboard.kpi.confirmedPurchases")}
              icon="wallet-02"
              coin
              accentColor="emerald"
            />

            {/* KPI 2: Total AI Credits Spent (Demand & Value Capture) */}
            <CreditKpiCard
              label={t("dashboard.kpi.totalBurned")}
              value={data.totals.creditsSpent.toLocaleString(i18n.language)}
              badge={t("dashboard.kpi.actionDemand")}
              badgeColor="bg-primary/10 text-primary border-primary/20"
              helper={t("dashboard.kpi.completedGenerations")}
              icon="coin"
              coin
              accentColor="primary"
            />

            {/* KPI 3: Circulating Wallet Pool (Student Liabilities) */}
            <CreditKpiCard
              label={t("dashboard.kpi.walletBalance")}
              value={data.totals.walletCredits.toLocaleString(i18n.language)}
              badge={t("dashboard.kpi.purchasedBuffer", { percent: creditMetrics.purchasedRatio })}
              badgeColor="bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20"
              helper={t("dashboard.kpi.heldByStudents")}
              icon="coin"
              coin
              accentColor="amber"
            />

            {/* KPI 4: Student Unit Economics (Burn / Student) */}
            <CreditKpiCard
              label={t("dashboard.kpi.avgBurnStudent")}
              value={`${creditMetrics.avgBurnPerStudent} cr`}
              badge={t("dashboard.kpi.onboarded", { percent: creditMetrics.activationRate })}
              badgeColor="bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20"
              helper={t("dashboard.kpi.activeWorkspaces", { count: data.totals.students })}
              icon="group"
              accentColor="tertiary"
            />
          </section>

          {/* =========================================================================
              SECTION 1 (TOP STAGE - NO SCROLLING): CREDIT ECONOMY VELOCITY & AI DEMAND
             ========================================================================= */}
          <section className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.75fr)_minmax(20rem,0.85fr)]">
            {/* 1. Credit Economy Velocity Chart with Full Date Filter System */}
            <div className="overflow-hidden rounded-2xl border border-outline-variant/80 bg-surface-container-lowest shadow-2xs">
              {/* Header with Date Filter System (Matching the reference screenshot) */}
              <div className="flex flex-col gap-3.5 border-b border-outline-variant/60 bg-surface-container-low/30 p-5">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-extrabold text-on-surface">
                        {t("dashboard.credit.title")}
                      </h2>
                      <span className="rounded-md bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-300">
                        {t("dashboard.credit.engine")}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-on-surface-variant">
                      {t("dashboard.credit.description")}
                    </p>
                  </div>

                  <img src={creditCoin} alt="" className="hidden sm:block h-7 w-7 drop-shadow-xs" />
                </div>

                {/* Filter Toolbar matching the user's reference photo */}
                <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
                  {/* Left: Range Preset Pills: [ 12 months ] [ 30 days ] [ 7 days ] [ 24 hours ] */}
                  <div className="inline-flex rounded-xl border border-outline-variant/80 bg-surface p-1 shadow-2xs">
                    <button
                      type="button"
                      onClick={() => handleCreditRangeChange("12m")}
                      className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                        creditRange === "12m"
                          ? "bg-primary text-on-primary shadow-xs"
                          : "text-on-surface-variant hover:text-on-surface"
                      }`}
                    >
                      {t("dashboard.credit.12months")}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCreditRangeChange("30d")}
                      className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                        creditRange === "30d"
                          ? "bg-primary text-on-primary shadow-xs"
                          : "text-on-surface-variant hover:text-on-surface"
                      }`}
                    >
                      {t("dashboard.credit.30days")}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCreditRangeChange("7d")}
                      className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                        creditRange === "7d"
                          ? "bg-primary text-on-primary shadow-xs"
                          : "text-on-surface-variant hover:text-on-surface"
                      }`}
                    >
                      {t("dashboard.credit.7days")}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCreditRangeChange("24h")}
                      className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                        creditRange === "24h"
                          ? "bg-primary text-on-primary shadow-xs"
                          : "text-on-surface-variant hover:text-on-surface"
                      }`}
                    >
                      {t("dashboard.credit.24hours")}
                    </button>
                  </div>

                  {/* Right: Date Range Pill + Granularity (Per Day / Per Week / Per Month) */}
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Date Range Badge Pill */}
                    <div className="inline-flex items-center gap-1.5 rounded-xl border border-outline-variant/80 bg-surface px-3 py-1 text-xs font-semibold text-on-surface shadow-2xs">
                      <HugeiconsIcon icon="calendar" size={13} strokeWidth={1.8} className="text-on-surface-variant" />
                      <span>{creditDateRangeLabel}</span>
                    </div>

                    {/* Granularity Selector: Locked to Per Month on 12m, Per Day/Week otherwise */}
                    <div className="inline-flex rounded-xl border border-outline-variant/80 bg-surface p-1 shadow-2xs">
                      {creditRange === "12m" ? (
                        <div className="flex items-center gap-1.5 rounded-lg bg-surface-container-high px-2.5 py-1 text-[11px] font-extrabold text-on-surface">
                          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                          <span>{t("dashboard.credit.perMonth")}</span>
                        </div>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => setCreditGranularity("day")}
                            className={`rounded-lg px-2 py-1 text-[11px] font-bold transition-all ${
                              creditGranularity === "day"
                                ? "bg-surface-container-high text-on-surface font-extrabold"
                                : "text-on-surface-variant hover:text-on-surface"
                            }`}
                          >
                            {t("dashboard.credit.perDay")}
                          </button>
                          <button
                            type="button"
                            onClick={() => setCreditGranularity("week")}
                            className={`rounded-lg px-2 py-1 text-[11px] font-bold transition-all ${
                              creditGranularity === "week"
                                ? "bg-surface-container-high text-on-surface font-extrabold"
                                : "text-on-surface-variant hover:text-on-surface"
                            }`}
                          >
                            {t("dashboard.credit.perWeek")}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Grouped Bar Chart */}
              <div className="p-5">
                <DailyCreditBarChart
                  days={processedCreditActivity}
                  hoverIndex={activeCreditBar}
                  onHoverIndex={setActiveCreditBar}
                />
              </div>

              {/* Chart Legend & Telemetry Insights */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-outline-variant/60 bg-surface-container-low/20 px-5 py-3 text-xs text-on-surface-variant">
                <div className="flex items-center gap-4">
                  <span className="inline-flex items-center gap-1.5 font-bold text-on-surface">
                    <span className="h-2.5 w-2.5 rounded bg-primary" />
                    {t("dashboard.credit.spent", { count: processedCreditActivity.reduce((acc, d) => acc + d.spent, 0).toLocaleString(i18n.language) })}
                  </span>
                  <span className="inline-flex items-center gap-1.5 font-bold text-amber-700 dark:text-amber-300">
                    <span className="h-2.5 w-2.5 rounded bg-amber-400" />
                    {t("dashboard.credit.fulfilled", { count: processedCreditActivity.reduce((acc, d) => acc + d.fulfilled, 0).toLocaleString(i18n.language) })}
                  </span>
                </div>
                <span className="text-[11px] text-on-surface-variant/75">
                  {t("dashboard.credit.hover")}
                </span>
              </div>
            </div>

            {/* 2. Most Requested AI Capabilities (Action Demand) */}
            <div className="flex flex-col justify-between rounded-2xl border border-outline-variant/80 bg-surface-container-lowest p-5 shadow-2xs">
              <div>
                <div className="border-b border-outline-variant/60 pb-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-extrabold text-on-surface">
                      {t("dashboard.credit.actionDemand")}
                    </h2>
                    <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                      {t("dashboard.credit.topRequested")}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-on-surface-variant">
                    {t("dashboard.credit.actionDescription")}
                  </p>
                </div>

                <div className="mt-4 space-y-3.5">
                  {data.charts.actionDemand.length ? (
                    data.charts.actionDemand.map((item, idx) => {
                      const percentage = totalActionDemand
                        ? Math.round((item.value / totalActionDemand) * 100)
                        : 0;
                      const cleanLabel = item.label.replaceAll("_", " ");
                      const actionLabel = i18n.exists(`actions.${item.label}`, { ns: "creditHistory" })
                        ? tCreditHistory(`actions.${item.label}`)
                        : cleanLabel;

                      return (
                        <div key={item.label} className="group">
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="grid h-5 w-5 shrink-0 place-items-center rounded-md bg-surface-container-high font-mono text-[10px] font-bold text-on-surface-variant">
                                #{idx + 1}
                              </span>
                              <span className="truncate font-semibold capitalize text-on-surface group-hover:text-primary transition-colors">
                                {actionLabel}
                              </span>
                            </div>
                            <div className="flex shrink-0 items-center gap-2">
                              <span className="font-mono font-bold text-on-surface">{item.value}</span>
                              <span className="text-[11px] font-medium text-on-surface-variant/75">
                                ({percentage}%)
                              </span>
                            </div>
                          </div>
                          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface-container-high">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-primary to-tertiary transition-all duration-300 group-hover:brightness-110"
                              style={{ width: `${Math.max(percentage, 5)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="py-8 text-center text-xs text-on-surface-variant">{t("dashboard.credit.noActions")}</p>
                  )}
                </div>
              </div>

              <div className="mt-5 border-t border-outline-variant/60 pt-3">
                <Link
                  to="/admin/credits"
                  className="flex items-center justify-between text-xs font-bold text-primary hover:underline"
                >
                  <span>{t("dashboard.credit.configurePrices")}</span>
                  <HugeiconsIcon icon="arrow-right-01" size={14} strokeWidth={2} />
                </Link>
              </div>
            </div>
          </section>

          {/* =========================================================================
              SECTION 2: PLATFORM MOMENTUM & STUDENT ONBOARDING FUNNEL
             ========================================================================= */}
          <section className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.75fr)_minmax(20rem,0.85fr)]">
            {/* Visual Spline Growth Chart with 12m / 6m / 3m Filter */}
            <div className="overflow-hidden rounded-2xl border border-outline-variant/80 bg-surface-container-lowest shadow-2xs">
              <div className="flex flex-col gap-3 border-b border-outline-variant/60 bg-surface-container-low/30 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                      {t("dashboard.momentum.title")}
                    </span>
                    <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-extrabold text-primary">
                      {t("dashboard.momentum.adoption")}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-on-surface-variant">
                    {t("dashboard.momentum.description")}
                  </p>
                </div>

                {/* Filter Controls for Momentum */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* Range Pills */}
                  <div className="inline-flex rounded-xl border border-outline-variant/80 bg-surface p-1 shadow-2xs">
                    <button
                      type="button"
                      onClick={() => setMomentumRange("12m")}
                      className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all ${
                        momentumRange === "12m"
                          ? "bg-primary text-on-primary shadow-xs"
                          : "text-on-surface-variant hover:text-on-surface"
                      }`}
                    >
                      {t("dashboard.momentum.12months")}
                    </button>
                    <button
                      type="button"
                      onClick={() => setMomentumRange("6m")}
                      className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all ${
                        momentumRange === "6m"
                          ? "bg-primary text-on-primary shadow-xs"
                          : "text-on-surface-variant hover:text-on-surface"
                      }`}
                    >
                      {t("dashboard.momentum.6months")}
                    </button>
                    <button
                      type="button"
                      onClick={() => setMomentumRange("3m")}
                      className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all ${
                        momentumRange === "3m"
                          ? "bg-primary text-on-primary shadow-xs"
                          : "text-on-surface-variant hover:text-on-surface"
                      }`}
                    >
                      {t("dashboard.momentum.3months")}
                    </button>
                  </div>

                  {/* Series Toggle Pills */}
                  <div className="inline-flex rounded-xl border border-outline-variant/80 bg-surface p-1 shadow-2xs">
                    <button
                      type="button"
                      onClick={() => setActiveSeries("both")}
                      className={`rounded-lg px-2 py-1 text-[11px] font-bold transition-all ${
                        activeSeries === "both"
                          ? "bg-surface-container-high text-on-surface"
                          : "text-on-surface-variant hover:text-on-surface"
                      }`}
                    >
                      {t("dashboard.momentum.all")}
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveSeries("students")}
                      className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold transition-all ${
                        activeSeries === "students"
                          ? "bg-primary text-on-primary shadow-xs"
                          : "text-on-surface-variant hover:text-on-surface"
                      }`}
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                      {t("dashboard.momentum.students")}
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveSeries("projects")}
                      className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold transition-all ${
                        activeSeries === "projects"
                          ? "bg-tertiary text-on-primary shadow-xs"
                          : "text-on-surface-variant hover:text-on-surface"
                      }`}
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-tertiary" />
                      {t("dashboard.momentum.projects")}
                    </button>
                  </div>
                </div>
              </div>

              {/* Interactive SVG Chart Container */}
              <div className="p-5">
                <SmoothSplineChart
                  students={processedMomentum.students}
                  projects={processedMomentum.projects}
                  activeSeries={activeSeries}
                  hoverIndex={activeGrowthPoint}
                  onHoverIndex={setActiveGrowthPoint}
                />
              </div>
            </div>

            {/* Student Activation & Onboarding Funnel */}
            <div className="flex flex-col justify-between rounded-2xl border border-outline-variant/80 bg-surface-container-lowest p-5 shadow-2xs">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                    {t("dashboard.onboarding.activation")}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-secondary/10 px-2 py-0.5 text-[10px] font-extrabold text-secondary">
                    <HugeiconsIcon icon="checkmark-circle-02" size={12} strokeWidth={2} />
                    {t("dashboard.onboarding.completedPercent", { percent: creditMetrics.activationRate })}
                  </span>
                </div>
                <h3 className="mt-2 text-base font-extrabold text-on-surface">
                  {t("dashboard.onboarding.health")}
                </h3>
                <p className="mt-1 text-xs text-on-surface-variant leading-relaxed">
                  {t("dashboard.onboarding.description")}
                </p>

                {/* Visual Progress Bar */}
                <div className="mt-5 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-on-surface">{t("dashboard.onboarding.setupCompleted")}</span>
                    <span className="font-mono font-bold text-secondary">
                      {t("dashboard.onboarding.students", { count: data.totals.completedOnboarding })}
                    </span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-surface-container-high">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-secondary to-primary transition-all duration-500"
                      style={{ width: `${creditMetrics.activationRate}%` }}
                    />
                  </div>
                </div>

                {/* Status Breakdown Grid */}
                <div className="mt-6 grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-outline-variant/70 bg-surface-container-low/50 p-3">
                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-secondary">
                      <span className="h-2 w-2 rounded-full bg-secondary" />
                      {t("dashboard.onboarding.activeReady")}
                    </div>
                    <p className="mt-1 font-mono text-xl font-extrabold text-on-surface">
                      {data.totals.completedOnboarding}
                    </p>
                    <p className="text-[10px] text-on-surface-variant">{t("dashboard.onboarding.canGenerate")}</p>
                  </div>

                  <div className="rounded-xl border border-outline-variant/70 bg-surface-container-low/50 p-3">
                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-amber-600 dark:text-amber-400">
                      <span className="h-2 w-2 rounded-full bg-amber-500" />
                      {t("dashboard.onboarding.inOnboarding")}
                    </div>
                    <p className="mt-1 font-mono text-xl font-extrabold text-on-surface">
                      {Math.max(data.totals.students - data.totals.completedOnboarding, 0)}
                    </p>
                    <p className="text-[10px] text-on-surface-variant">{t("dashboard.onboarding.pendingBasics")}</p>
                  </div>
                </div>

                {/* Insight Callout */}
                <div className="mt-5 rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs text-on-surface-variant">
                  <div className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">
                      <HugeiconsIcon icon="information-circle" size={15} strokeWidth={2} />
                    </span>
                    <p className="text-[11px] leading-relaxed">
                      {t("dashboard.onboarding.insight")}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 border-t border-outline-variant/60 pt-4">
                <Link
                  to="/admin/users"
                  className="flex items-center justify-between text-xs font-bold text-primary hover:underline"
                >
                  <span>{t("dashboard.onboarding.filter")}</span>
                  <HugeiconsIcon icon="arrow-right-01" size={14} strokeWidth={2} />
                </Link>
              </div>
            </div>
          </section>

          {/* =========================================================================
              SECTION 3: DOMAIN CONCENTRATION & RECENT FULFILLMENTS
             ========================================================================= */}
          <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {/* Projects by Academic Domain */}
            <div className="rounded-2xl border border-outline-variant/80 bg-surface-container-lowest p-5 shadow-2xs">
              <div className="border-b border-outline-variant/60 pb-3">
                <h2 className="text-sm font-extrabold text-on-surface">{t("dashboard.domains.title")}</h2>
                <p className="mt-0.5 text-xs text-on-surface-variant">
                  {t("dashboard.domains.description")}
                </p>
              </div>

              <div className="mt-4 space-y-3">
                {data.charts.domains.length ? (
                  data.charts.domains.map((item) => {
                    const percentage = totalDomainCount ? Math.round((item.value / totalDomainCount) * 100) : 0;
                    return (
                      <div key={item.label} className="group">
                        <div className="flex items-center justify-between text-xs">
                          <span className="truncate font-semibold text-on-surface group-hover:text-primary transition-colors">
                            {displayOptionLabel(item.label, "domain", tOnboarding)}
                          </span>
                          <span className="font-mono text-xs font-bold text-on-surface">
                            {item.value} <span className="font-normal text-on-surface-variant">({percentage}%)</span>
                          </span>
                        </div>
                        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface-container-high">
                          <div
                            className="h-full rounded-full bg-tertiary transition-all duration-300"
                            style={{ width: `${Math.max(percentage, 4)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="py-8 text-center text-xs text-on-surface-variant">{t("dashboard.domains.empty")}</p>
                )}
              </div>
            </div>

            {/* Recent Credit Fulfillments */}
            <div className="rounded-2xl border border-outline-variant/80 bg-surface-container-lowest p-5 shadow-2xs">
              <div className="flex items-center justify-between border-b border-outline-variant/60 pb-3">
                <div>
                  <h2 className="text-sm font-extrabold text-on-surface">{t("dashboard.fulfillments.title")}</h2>
                  <p className="mt-0.5 text-xs text-on-surface-variant">
                    {t("dashboard.fulfillments.description")}
                  </p>
                </div>
                <img src={creditCoin} alt="" className="h-6 w-6" />
              </div>

              <div className="mt-3 divide-y divide-outline-variant/50">
                {data.recentFulfillments.length ? (
                  data.recentFulfillments.map((item) => (
                    <div key={item._id} className="flex items-center justify-between gap-3 py-2.5">
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold text-on-surface">
                          {item.user?.fullName || t("dashboard.recent.student")}
                        </p>
                        <p className="truncate text-[11px] text-on-surface-variant">
                          {item.reason || t("dashboard.fulfillments.creditTopUp")} · {formatRelativeTime(item.createdAt, i18n.language, t)}
                        </p>
                      </div>
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-secondary/10 px-2 py-0.5 font-mono text-xs font-extrabold text-secondary">
                        <img src={creditCoin} alt="" className="h-3.5 w-3.5" />
                        +{item.purchasedDelta}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="py-8 text-center text-xs text-on-surface-variant">{t("dashboard.fulfillments.empty")}</p>
                )}
              </div>
            </div>
          </section>

          {/* =========================================================================
              SECTION 4: REAL-TIME OPERATIONAL ACTIVITY STREAMS
             ========================================================================= */}
          <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {/* Newest Students */}
            <div className="rounded-2xl border border-outline-variant/80 bg-surface-container-lowest p-5 shadow-2xs">
              <div className="flex items-center justify-between border-b border-outline-variant/60 pb-3">
                <div>
                  <h2 className="text-sm font-extrabold text-on-surface">{t("dashboard.recent.usersTitle")}</h2>
                  <p className="mt-0.5 text-xs text-on-surface-variant">{t("dashboard.recent.usersDescription")}</p>
                </div>
                <Link to="/admin/users" className="text-xs font-bold text-primary hover:underline">
                  {t("common.viewAll")}
                </Link>
              </div>

              <div className="mt-3 divide-y divide-outline-variant/50">
                {data.recentUsers.length ? (
                  data.recentUsers.map((user) => {
                    const initials = (user.fullName || t("dashboard.recent.user"))
                      .split(" ")
                      .map((p) => p[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase();

                    return (
                      <div key={user._id} className="flex items-center justify-between gap-3 py-2.5">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/10 border border-primary/20 text-xs font-extrabold text-primary">
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-xs font-bold text-on-surface">{user.fullName}</p>
                            <p className="truncate text-[11px] text-on-surface-variant">{user.email}</p>
                          </div>
                        </div>
                        <span className="shrink-0 text-[11px] text-on-surface-variant">
                          {formatRelativeTime(user.createdAt, i18n.language, t)}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <p className="py-8 text-center text-xs text-on-surface-variant">{t("dashboard.recent.usersEmpty")}</p>
                )}
              </div>
            </div>

            {/* Newest Projects */}
            <div className="rounded-2xl border border-outline-variant/80 bg-surface-container-lowest p-5 shadow-2xs">
              <div className="flex items-center justify-between border-b border-outline-variant/60 pb-3">
                <div>
                  <h2 className="text-sm font-extrabold text-on-surface">{t("dashboard.recent.projectsTitle")}</h2>
                  <p className="mt-0.5 text-xs text-on-surface-variant">{t("dashboard.recent.projectsDescription")}</p>
                </div>
                <Link to="/admin/projects" className="text-xs font-bold text-primary hover:underline">
                  {t("common.viewAll")}
                </Link>
              </div>

              <div className="mt-3 divide-y divide-outline-variant/50">
                {data.recentProjects.length ? (
                  data.recentProjects.map((project) => (
                    <div key={project._id} className="flex items-center justify-between gap-3 py-2.5">
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold text-on-surface">
                          {project.basics?.title || t("dashboard.recent.untitled")}
                        </p>
                        <p className="truncate text-[11px] text-on-surface-variant">
                          {project.user?.fullName || t("dashboard.recent.student")} ·{" "}
                          <span className="font-medium text-tertiary">{project.basics?.domain || t("dashboard.recent.noDomain")}</span>
                        </p>
                      </div>
                      <span className="shrink-0 text-[11px] text-on-surface-variant">
                        {formatRelativeTime(project.createdAt, i18n.language, t)}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="py-8 text-center text-xs text-on-surface-variant">{t("dashboard.recent.projectsEmpty")}</p>
                )}
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

/* =========================================================================
   REUSABLE CREDIT-FOCUSED KPI CARD COMPONENT
   ========================================================================= */
function CreditKpiCard({
  label,
  value,
  badge,
  badgeColor,
  helper,
  icon,
  coin,
  accentColor,
}: {
  label: string;
  value: string | number;
  badge: string;
  badgeColor: string;
  helper: string;
  icon?: string;
  coin?: boolean;
  accentColor: "primary" | "tertiary" | "amber" | "emerald";
}) {
  const iconBgMap = {
    primary: "bg-primary/10 text-primary border border-primary/20",
    tertiary: "bg-tertiary/10 text-tertiary border border-tertiary/20",
    amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20",
    emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
  };

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-outline-variant/80 bg-surface-container-lowest p-5 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">{label}</p>
          <p className="mt-2 font-mono text-3xl font-extrabold tracking-tight text-on-surface">{value}</p>
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-extrabold border ${badgeColor}`}>
              {badge}
            </span>
            <span className="text-[11px] text-on-surface-variant/70">{helper}</span>
          </div>
        </div>

        <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${iconBgMap[accentColor]}`}>
          {coin ? (
            <img src={creditCoin} alt="" className="h-6 w-6 drop-shadow-xs" />
          ) : (
            <HugeiconsIcon icon={icon || "analytics-01"} size={22} strokeWidth={1.75} />
          )}
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   HIGH-FIDELITY SMOOTH SPLINE SVG CHART
   ========================================================================= */
function SmoothSplineChart({
  students,
  projects,
  activeSeries,
  hoverIndex,
  onHoverIndex,
}: {
  students: Item[];
  projects: Item[];
  activeSeries: "both" | "students" | "projects";
  hoverIndex: number | null;
  onHoverIndex: (idx: number | null) => void;
}) {
  const { t, i18n } = useTranslation("adminManagement");
  const monthLabel = (label: string) => {
    const month = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].indexOf(label);
    return month < 0 ? label : new Intl.DateTimeFormat(i18n.language, { month: "short", timeZone: "UTC" }).format(new Date(Date.UTC(2000, month, 1)));
  };
  const width = 640;
  const height = 220;
  const paddingX = 45;
  const paddingY = 30;

  const count = Math.max(students.length, projects.length, 1);
  const maxVal = Math.max(
    ...students.map((s) => s.value),
    ...projects.map((p) => p.value),
    1
  );

  const getCoordinates = (items: Item[]) => {
    return items.map((item, idx) => {
      const x = paddingX + idx * ((width - paddingX * 2) / Math.max(count - 1, 1));
      const y = height - paddingY - (item.value / maxVal) * (height - paddingY * 2);
      return { x, y, value: item.value, label: item.label };
    });
  };

  const studentCoords = getCoordinates(students);
  const projectCoords = getCoordinates(projects);

  const createSmoothPath = (coords: Array<{ x: number; y: number }>) => {
    if (!coords.length) return "";
    return coords.reduce((acc, point, i, arr) => {
      if (i === 0) return `M ${point.x},${point.y}`;
      const prev = arr[i - 1];
      const cx1 = prev.x + (point.x - prev.x) / 2;
      const cy1 = prev.y;
      const cx2 = prev.x + (point.x - prev.x) / 2;
      const cy2 = point.y;
      return `${acc} C ${cx1},${cy1} ${cx2},${cy2} ${point.x},${point.y}`;
    }, "");
  };

  const studentPath = createSmoothPath(studentCoords);
  const projectPath = createSmoothPath(projectCoords);

  const studentAreaPath = studentCoords.length
    ? `${studentPath} L ${studentCoords[studentCoords.length - 1].x},${height - paddingY} L ${studentCoords[0].x},${height - paddingY} Z`
    : "";

  const projectAreaPath = projectCoords.length
    ? `${projectPath} L ${projectCoords[projectCoords.length - 1].x},${height - paddingY} L ${projectCoords[0].x},${height - paddingY} Z`
    : "";

  const showStudents = activeSeries === "both" || activeSeries === "students";
  const showProjects = activeSeries === "both" || activeSeries === "projects";

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-56 w-full overflow-visible"
        role="img"
        aria-label={t("dashboard.momentum.chartLabel")}
        onMouseLeave={() => onHoverIndex(null)}
      >
        <defs>
          <linearGradient id="studentGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--theme-primary)" stopOpacity="0.25" />
            <stop offset="100%" stopColor="var(--theme-primary)" stopOpacity="0.0" />
          </linearGradient>
          <linearGradient id="projectGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--theme-tertiary)" stopOpacity="0.22" />
            <stop offset="100%" stopColor="var(--theme-tertiary)" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {[0.25, 0.5, 0.75, 1].map((ratio) => {
          const y = height - paddingY - ratio * (height - paddingY * 2);
          return (
            <line
              key={ratio}
              x1={paddingX}
              y1={y}
              x2={width - paddingX}
              y2={y}
              stroke="var(--theme-outline-variant)"
              strokeOpacity="0.5"
              strokeDasharray="4 4"
            />
          );
        })}

        {/* Area Fills */}
        {showStudents && <path d={studentAreaPath} fill="url(#studentGradient)" />}
        {showProjects && <path d={projectAreaPath} fill="url(#projectGradient)" />}

        {/* Spline Lines */}
        {showStudents && (
          <path
            d={studentPath}
            fill="none"
            stroke="var(--theme-primary)"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
        {showProjects && (
          <path
            d={projectPath}
            fill="none"
            stroke="var(--theme-tertiary)"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Hover Crosshair & Data Points */}
        {studentCoords.map((pt, i) => {
          const isHovered = hoverIndex === i;
          return (
            <g key={pt.label}>
              <rect
                x={pt.x - 20}
                y={0}
                width={40}
                height={height}
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={() => onHoverIndex(i)}
              />

              {isHovered && (
                <line
                  x1={pt.x}
                  y1={paddingY}
                  x2={pt.x}
                  y2={height - paddingY}
                  stroke="var(--theme-primary)"
                  strokeWidth="1.5"
                  strokeDasharray="3 3"
                />
              )}

              {showStudents && (
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isHovered ? 6 : 4}
                  fill="var(--theme-surface)"
                  stroke="var(--theme-primary)"
                  strokeWidth={isHovered ? 3 : 2}
                  className="transition-all duration-150 pointer-events-none"
                />
              )}

              {showProjects && projectCoords[i] && (
                <circle
                  cx={projectCoords[i].x}
                  cy={projectCoords[i].y}
                  r={isHovered ? 6 : 4}
                  fill="var(--theme-surface)"
                  stroke="var(--theme-tertiary)"
                  strokeWidth={isHovered ? 3 : 2}
                  className="transition-all duration-150 pointer-events-none"
                />
              )}
            </g>
          );
        })}
      </svg>

      {/* Interactive Tooltip Card */}
      {hoverIndex !== null && studentCoords[hoverIndex] && (
        <div
          className="pointer-events-none absolute z-10 -top-2 flex flex-col gap-1 rounded-xl border border-outline-variant/90 bg-surface/95 px-3 py-2 text-xs shadow-xl backdrop-blur-md transition-all duration-75"
          style={{
            left: `${(studentCoords[hoverIndex].x / width) * 100}%`,
            transform: "translate(-50%, -100%)",
          }}
        >
          <span className="font-bold text-on-surface">{monthLabel(studentCoords[hoverIndex].label)}</span>
          <div className="flex items-center gap-3">
            {showStudents && (
              <span className="flex items-center gap-1 font-semibold text-primary">
                <span className="h-2 w-2 rounded-full bg-primary" />
                {t("dashboard.studentsCount", { count: studentCoords[hoverIndex].value })}
              </span>
            )}
            {showProjects && projectCoords[hoverIndex] && (
              <span className="flex items-center gap-1 font-semibold text-tertiary">
                <span className="h-2 w-2 rounded-full bg-tertiary" />
                {t("dashboard.projectsCount", { count: projectCoords[hoverIndex].value })}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Month Labels on X-Axis */}
      <div className="mt-2 flex justify-between px-6 text-[11px] font-semibold text-on-surface-variant">
        {students.map((item) => (
          <span key={item.label}>{monthLabel(item.label)}</span>
        ))}
      </div>
    </div>
  );
}

/* =========================================================================
   DAILY / WEEKLY CREDIT TELEMETRY GROUPED BAR CHART
   ========================================================================= */
function DailyCreditBarChart({
  days,
  hoverIndex,
  onHoverIndex,
}: {
  days: Day[];
  hoverIndex: number | null;
  onHoverIndex: (idx: number | null) => void;
}) {
  const { t, i18n } = useTranslation("adminManagement");
  const maxVal = Math.max(...days.map((d) => Math.max(d.spent, d.fulfilled)), 1);

  return (
    <div className="relative">
      <div
        className="flex h-48 items-end gap-1 sm:gap-1.5 border-b border-outline-variant/60 pb-1"
        onMouseLeave={() => onHoverIndex(null)}
      >
        {days.map((day, idx) => {
          const spentPct = Math.max((day.spent / maxVal) * 100, day.spent ? 8 : 2);
          const fulfilledPct = Math.max((day.fulfilled / maxVal) * 100, day.fulfilled ? 8 : 2);
          const isHovered = hoverIndex === idx;
          const displayedLabel = formatCreditDateKey(day.key, i18n.language, day.label);

          return (
            <div
              key={`${day.label}-${idx}`}
              className={`relative flex min-w-0 flex-1 cursor-pointer items-end gap-0.5 rounded-lg transition-colors ${
                isHovered ? "bg-surface-container-high/60" : "hover:bg-surface-container-low/50"
              }`}
              style={{ height: "100%" }}
              onMouseEnter={() => onHoverIndex(idx)}
            >
              {/* Spent Bar */}
              <div
                className="w-1/2 rounded-t-md bg-primary transition-all duration-200 group-hover:brightness-110"
                style={{ height: `${spentPct}%` }}
              />
              {/* Fulfilled Bar */}
              <div
                className="w-1/2 rounded-t-md bg-amber-400 transition-all duration-200 group-hover:brightness-110"
                style={{ height: `${fulfilledPct}%` }}
              />

              {/* Day Hover Tooltip */}
              {isHovered && (
                <div className="pointer-events-none absolute -top-16 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-xl border border-outline-variant bg-surface/95 px-3 py-2 text-[11px] shadow-xl backdrop-blur-md">
                  <p className="font-extrabold text-on-surface">{displayedLabel}</p>
                  <p className="text-primary font-bold">{t("dashboard.spentTooltip", { count: day.spent.toLocaleString(i18n.language) })}</p>
                  <p className="text-amber-600 dark:text-amber-400 font-bold">{t("dashboard.fulfilledTooltip", { count: day.fulfilled.toLocaleString(i18n.language) })}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* X-Axis dates */}
      <div className="mt-2 flex justify-between px-1 text-[10px] font-medium text-on-surface-variant/75">
        {days.length <= 14 ? (
          days.map((day, idx) => (
            <span
              key={`${day.label}-${idx}`}
              className={`truncate text-center ${
                days.length > 7 && idx % 2 !== 0 && idx !== days.length - 1 ? "hidden sm:block" : "block"
              }`}
              style={{ flex: 1 }}
            >
              {formatCreditDateKey(day.key, i18n.language, day.label)}
            </span>
          ))
        ) : (
          <>
            <span>{days[0]?.label || ""}</span>
            {days.length > 2 && <span>{days[Math.floor(days.length / 2)]?.label || ""}</span>}
            <span>{days[days.length - 1]?.label || ""}</span>
          </>
        )}
      </div>
    </div>
  );
}
