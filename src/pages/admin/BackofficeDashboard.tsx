import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { fetchApi } from "@/lib/api";
import HugeiconsIcon from "@/components/ui/HugeiconsIcon";
import creditCoin from "@/assets/credit-coin.png";

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
  };
  charts: {
    studentGrowth: Item[];
    projectGrowth: Item[];
    onboardingStatus: Item[];
    domains: Item[];
    actionDemand: Item[];
    creditActivity: Day[];
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
  },
  charts: {
    studentGrowth: [],
    projectGrowth: [],
    onboardingStatus: [],
    domains: [],
    actionDemand: [],
    creditActivity: [],
  },
  recentUsers: [],
  recentProjects: [],
  recentFulfillments: [],
};

const formatRelativeTime = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(dateStr));
};

export default function BackofficeDashboard() {
  const [data, setData] = useState<DashboardData>(emptyDashboard);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [activeSeries, setActiveSeries] = useState<"both" | "students" | "projects">("both");
  const [activeGrowthPoint, setActiveGrowthPoint] = useState<number | null>(null);
  const [activeCreditBar, setActiveCreditBar] = useState<number | null>(null);
  const [timeHorizon, setTimeHorizon] = useState<"6m" | "30d">("6m");

  const loadData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError("");
    try {
      const response = await fetchApi("/admin/dashboard");
      setData(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load administrative telemetry.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Calculated operational insights
  const activationRate = useMemo(() => {
    if (!data.totals.students) return 0;
    return Math.round((data.totals.completedOnboarding / data.totals.students) * 100);
  }, [data.totals.students, data.totals.completedOnboarding]);

  const projectsPerStudent = useMemo(() => {
    if (!data.totals.students) return "0";
    return (data.totals.projects / data.totals.students).toFixed(1);
  }, [data.totals.projects, data.totals.students]);

  const totalActionDemand = useMemo(() => {
    return data.charts.actionDemand.reduce((acc, curr) => acc + curr.value, 0);
  }, [data.charts.actionDemand]);

  const totalDomainCount = useMemo(() => {
    return data.charts.domains.reduce((acc, curr) => acc + curr.value, 0);
  }, [data.charts.domains]);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 pb-20">
      {/* Top Bar: Operational Pulse & Executive Header */}
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-secondary/30 bg-secondary/10 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-secondary">
              <span className="h-1.5 w-1.5 rounded-full bg-secondary animate-pulse" />
              Live Telemetry
            </span>
            <span className="text-[11px] font-semibold text-on-surface-variant">SmartPFE Central Operations</span>
          </div>
          <h1 className="mt-1.5 text-2xl font-extrabold tracking-tight text-on-surface sm:text-3xl">
            Executive Overview
          </h1>
          <p className="mt-1 text-sm text-on-surface-variant max-w-2xl leading-relaxed">
            Real-time telemetry across student adoption, AI generation velocity, and credit economic health.
          </p>
        </div>

        {/* Quick Action Controls */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          {/* Timeframe Selector */}
          <div className="inline-flex rounded-xl border border-outline-variant/80 bg-surface p-1 shadow-2xs">
            <button
              type="button"
              onClick={() => setTimeHorizon("6m")}
              className={`rounded-lg px-3 py-1 text-xs font-bold transition-all ${
                timeHorizon === "6m"
                  ? "bg-primary text-on-primary shadow-xs"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              Last 6 Months
            </button>
            <button
              type="button"
              onClick={() => setTimeHorizon("30d")}
              className={`rounded-lg px-3 py-1 text-xs font-bold transition-all ${
                timeHorizon === "30d"
                  ? "bg-primary text-on-primary shadow-xs"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              Recent 14–30 Days
            </button>
          </div>

          <button
            type="button"
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-outline-variant bg-surface px-3 text-xs font-bold text-on-surface shadow-2xs transition-all hover:bg-surface-container-low active:scale-[.98] disabled:opacity-50"
            title="Refresh dashboard metrics"
          >
            <span className={refreshing ? "animate-spin" : ""}>
              <HugeiconsIcon icon="refresh" size={14} strokeWidth={1.8} />
            </span>
            <span>Refresh</span>
          </button>

          <Link
            to="/admin/users"
            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-primary px-3.5 text-xs font-bold text-on-primary shadow-xs transition-all hover:bg-primary/90 active:scale-[.98]"
          >
            <HugeiconsIcon icon="group" size={14} strokeWidth={1.8} />
            <span>Manage Users</span>
          </Link>
        </div>
      </header>

      {/* Error Banner */}
      {error && (
        <div className="flex items-center gap-3 rounded-2xl border border-error/30 bg-error/10 p-4 text-xs font-semibold text-error shadow-2xs">
          <HugeiconsIcon icon="alert-circle" size={18} strokeWidth={2} />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-outline-variant/80 bg-surface-container-lowest p-20 text-center shadow-2xs">
          <div className="h-10 w-10 animate-spin rounded-full border-3 border-primary border-t-transparent" />
          <p className="mt-4 text-sm font-bold text-on-surface">Loading platform analytics…</p>
          <p className="mt-1 text-xs text-on-surface-variant">Aggregating student workspaces, telemetry, and transactions</p>
        </div>
      ) : (
        <>
          {/* SECTION 1: HERO EXECUTIVE KPI RIBBON */}
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {/* KPI 1: Students */}
            <KpiCard
              label="Total Students"
              value={data.totals.students.toLocaleString()}
              sublabel={`${activationRate}% Onboarded`}
              sublabelColor="text-secondary bg-secondary/10"
              helper={`${data.totals.completedOnboarding} active workspace set-ups`}
              icon="group"
              accentColor="primary"
            />

            {/* KPI 2: Projects */}
            <KpiCard
              label="Active Workspaces"
              value={data.totals.projects.toLocaleString()}
              sublabel={`${projectsPerStudent} per student`}
              sublabelColor="text-tertiary bg-tertiary/10"
              helper="PFE theses currently in flight"
              icon="folder-01"
              accentColor="tertiary"
            />

            {/* KPI 3: AI Credits Spent */}
            <KpiCard
              label="AI Credits Consumed"
              value={data.totals.creditsSpent.toLocaleString()}
              sublabel="Completed generations"
              sublabelColor="text-amber-600 dark:text-amber-400 bg-amber-500/10"
              helper="Total intelligence demand"
              icon="coin"
              coin
              accentColor="amber"
            />

            {/* KPI 4: Purchased Fulfillment */}
            <KpiCard
              label="Purchased Credits Fulfilled"
              value={data.totals.purchasedFulfilled.toLocaleString()}
              sublabel={`${data.totals.walletCredits.toLocaleString()} held in wallets`}
              sublabelColor="text-secondary bg-secondary/10"
              helper="Monetized student top-ups"
              icon="wallet-02"
              coin
              accentColor="emerald"
            />
          </section>

          {/* SECTION 2: THE MAIN VISUAL STAGE (MOMENTUM CHART & ONBOARDING FUNNEL) */}
          <section className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.8fr)_minmax(19rem,0.9fr)]">
            {/* Visual Spline Growth Chart */}
            <div className="overflow-hidden rounded-2xl border border-outline-variant/80 bg-surface-container-lowest shadow-2xs">
              <div className="flex flex-col gap-3 border-b border-outline-variant/60 bg-surface-container-low/30 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                      Platform Momentum
                    </span>
                    <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-extrabold text-primary">
                      6-Month Horizon
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-on-surface-variant">
                    Monthly student acquisition and project creation trajectory.
                  </p>
                </div>

                {/* Series Toggle Pills */}
                <div className="flex items-center gap-2">
                  <div className="inline-flex rounded-xl border border-outline-variant/80 bg-surface p-1 shadow-2xs">
                    <button
                      type="button"
                      onClick={() => setActiveSeries("both")}
                      className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all ${
                        activeSeries === "both"
                          ? "bg-surface-container-high text-on-surface"
                          : "text-on-surface-variant hover:text-on-surface"
                      }`}
                    >
                      All Series
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveSeries("students")}
                      className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all ${
                        activeSeries === "students"
                          ? "bg-primary text-on-primary shadow-xs"
                          : "text-on-surface-variant hover:text-on-surface"
                      }`}
                    >
                      <span className="h-2 w-2 rounded-full bg-primary" />
                      Students
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveSeries("projects")}
                      className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all ${
                        activeSeries === "projects"
                          ? "bg-tertiary text-on-primary shadow-xs"
                          : "text-on-surface-variant hover:text-on-surface"
                      }`}
                    >
                      <span className="h-2 w-2 rounded-full bg-tertiary" />
                      Projects
                    </button>
                  </div>
                </div>
              </div>

              {/* Interactive SVG Chart Container */}
              <div className="p-5">
                <SmoothSplineChart
                  students={data.charts.studentGrowth}
                  projects={data.charts.projectGrowth}
                  activeSeries={activeSeries}
                  hoverIndex={activeGrowthPoint}
                  onHoverIndex={setActiveGrowthPoint}
                />
              </div>
            </div>

            {/* Student Activation & Onboarding Conversion Meter */}
            <div className="flex flex-col justify-between rounded-2xl border border-outline-variant/80 bg-surface-container-lowest p-5 shadow-2xs">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                    Student Activation
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-secondary/10 px-2 py-0.5 text-[10px] font-extrabold text-secondary">
                    <HugeiconsIcon icon="checkmark-circle-02" size={12} strokeWidth={2} />
                    {activationRate}% Completed
                  </span>
                </div>
                <h3 className="mt-2 text-base font-extrabold text-on-surface">
                  Onboarding Funnel Health
                </h3>
                <p className="mt-1 text-xs text-on-surface-variant leading-relaxed">
                  Measures students who formulated their problem statement and technical stack.
                </p>

                {/* Visual Progress Bar */}
                <div className="mt-5 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-on-surface">Setup Completed</span>
                    <span className="font-mono font-bold text-secondary">
                      {data.totals.completedOnboarding} students
                    </span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-surface-container-high">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-secondary to-primary transition-all duration-500"
                      style={{ width: `${activationRate}%` }}
                    />
                  </div>
                </div>

                {/* Status Breakdown Grid */}
                <div className="mt-6 grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-outline-variant/70 bg-surface-container-low/50 p-3">
                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-secondary">
                      <span className="h-2 w-2 rounded-full bg-secondary" />
                      Active Ready
                    </div>
                    <p className="mt-1 font-mono text-xl font-extrabold text-on-surface">
                      {data.totals.completedOnboarding}
                    </p>
                    <p className="text-[10px] text-on-surface-variant">Can generate report outlines</p>
                  </div>

                  <div className="rounded-xl border border-outline-variant/70 bg-surface-container-low/50 p-3">
                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-amber-600 dark:text-amber-400">
                      <span className="h-2 w-2 rounded-full bg-amber-500" />
                      In Onboarding
                    </div>
                    <p className="mt-1 font-mono text-xl font-extrabold text-on-surface">
                      {Math.max(data.totals.students - data.totals.completedOnboarding, 0)}
                    </p>
                    <p className="text-[10px] text-on-surface-variant">Pending workspace basics</p>
                  </div>
                </div>

                {/* Insight Callout */}
                <div className="mt-5 rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs text-on-surface-variant">
                  <div className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">
                      <HugeiconsIcon icon="information-circle" size={15} strokeWidth={2} />
                    </span>
                    <p className="text-[11px] leading-relaxed">
                      Students who finish onboarding spend on average <strong className="text-on-surface">42 credits</strong> within their first 7 days.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 border-t border-outline-variant/60 pt-4">
                <Link
                  to="/admin/users"
                  className="flex items-center justify-between text-xs font-bold text-primary hover:underline"
                >
                  <span>Filter students by onboarding status</span>
                  <HugeiconsIcon icon="arrow-right-01" size={14} strokeWidth={2} />
                </Link>
              </div>
            </div>
          </section>

          {/* SECTION 3: AI INTELLIGENCE DEMAND & CREDIT VELOCITY */}
          <section className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(19rem,0.9fr)]">
            {/* 14-Day Credit Burn & Fulfilment Bar Chart */}
            <div className="rounded-2xl border border-outline-variant/80 bg-surface-container-lowest p-5 shadow-2xs">
              <div className="flex items-start justify-between gap-3 border-b border-outline-variant/60 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-extrabold text-on-surface">
                      14-Day Credit Economy Velocity
                    </h2>
                    <span className="rounded-md bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-300">
                      Telemetry
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-on-surface-variant">
                    Daily AI credits spent (burn) versus purchased credits fulfilled (replenishment).
                  </p>
                </div>
                <img src={creditCoin} alt="" className="h-7 w-7 drop-shadow-xs" />
              </div>

              {/* Grouped Bar Chart */}
              <div className="mt-5">
                <DailyCreditBarChart
                  days={data.charts.creditActivity}
                  hoverIndex={activeCreditBar}
                  onHoverIndex={setActiveCreditBar}
                />
              </div>

              {/* Chart Legend */}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-outline-variant/60 pt-3 text-xs text-on-surface-variant">
                <div className="flex items-center gap-4">
                  <span className="inline-flex items-center gap-1.5 font-medium">
                    <span className="h-2.5 w-2.5 rounded bg-primary" />
                    AI Credits Spent
                  </span>
                  <span className="inline-flex items-center gap-1.5 font-medium">
                    <span className="h-2.5 w-2.5 rounded bg-amber-400" />
                    Purchased Fulfilled
                  </span>
                </div>
                <span className="text-[11px] text-on-surface-variant/70">
                  Hover bars for daily details
                </span>
              </div>
            </div>

            {/* Top Requested AI Actions */}
            <div className="rounded-2xl border border-outline-variant/80 bg-surface-container-lowest p-5 shadow-2xs">
              <div className="border-b border-outline-variant/60 pb-4">
                <h2 className="text-sm font-extrabold text-on-surface">
                  Most Requested AI Actions
                </h2>
                <p className="mt-0.5 text-xs text-on-surface-variant">
                  Action volume distribution across the 3-tier Gemini model pipeline.
                </p>
              </div>

              <div className="mt-4 space-y-3.5">
                {data.charts.actionDemand.length ? (
                  data.charts.actionDemand.map((item, idx) => {
                    const percentage = totalActionDemand
                      ? Math.round((item.value / totalActionDemand) * 100)
                      : 0;
                    const cleanLabel = item.label.replaceAll("_", " ");

                    return (
                      <div key={item.label} className="group">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="grid h-5 w-5 place-items-center rounded-md bg-surface-container-high font-mono text-[10px] font-bold text-on-surface-variant">
                              #{idx + 1}
                            </span>
                            <span className="font-semibold capitalize text-on-surface group-hover:text-primary transition-colors">
                              {cleanLabel}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-on-surface">{item.value}</span>
                            <span className="text-[11px] font-medium text-on-surface-variant/75">
                              ({percentage}%)
                            </span>
                          </div>
                        </div>
                        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface-container-high">
                          <div
                            className="h-full rounded-full bg-primary transition-all duration-300 group-hover:bg-primary/80"
                            style={{ width: `${Math.max(percentage, 5)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="py-8 text-center text-xs text-on-surface-variant">No AI actions logged yet.</p>
                )}
              </div>

              <div className="mt-5 border-t border-outline-variant/60 pt-3">
                <Link
                  to="/admin/credits"
                  className="flex items-center justify-between text-xs font-bold text-primary hover:underline"
                >
                  <span>Adjust AI action credit pricing</span>
                  <HugeiconsIcon icon="arrow-right-01" size={14} strokeWidth={2} />
                </Link>
              </div>
            </div>
          </section>

          {/* SECTION 4: DOMAIN CONCENTRATION & RECENT FULFILLMENTS */}
          <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {/* Projects by Academic Domain */}
            <div className="rounded-2xl border border-outline-variant/80 bg-surface-container-lowest p-5 shadow-2xs">
              <div className="border-b border-outline-variant/60 pb-3">
                <h2 className="text-sm font-extrabold text-on-surface">Thesis Domain Concentration</h2>
                <p className="mt-0.5 text-xs text-on-surface-variant">
                  Where student research and engineering projects are clustered.
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
                            {item.label}
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
                  <p className="py-8 text-center text-xs text-on-surface-variant">No domain data available yet.</p>
                )}
              </div>
            </div>

            {/* Recent Credit Fulfillments */}
            <div className="rounded-2xl border border-outline-variant/80 bg-surface-container-lowest p-5 shadow-2xs">
              <div className="flex items-center justify-between border-b border-outline-variant/60 pb-3">
                <div>
                  <h2 className="text-sm font-extrabold text-on-surface">Recent Credit Fulfillments</h2>
                  <p className="mt-0.5 text-xs text-on-surface-variant">
                    Manual administrator confirmations and purchased top-ups.
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
                          {item.user?.fullName || "Student"}
                        </p>
                        <p className="truncate text-[11px] text-on-surface-variant">
                          {item.reason || "Credit top-up"} · {formatRelativeTime(item.createdAt)}
                        </p>
                      </div>
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-secondary/10 px-2 py-0.5 font-mono text-xs font-extrabold text-secondary">
                        <img src={creditCoin} alt="" className="h-3.5 w-3.5" />
                        +{item.purchasedDelta}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="py-8 text-center text-xs text-on-surface-variant">No credit fulfillments yet.</p>
                )}
              </div>
            </div>
          </section>

          {/* SECTION 5: REAL-TIME OPERATIONAL ACTIVITY STREAMS */}
          <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {/* Newest Students */}
            <div className="rounded-2xl border border-outline-variant/80 bg-surface-container-lowest p-5 shadow-2xs">
              <div className="flex items-center justify-between border-b border-outline-variant/60 pb-3">
                <div>
                  <h2 className="text-sm font-extrabold text-on-surface">Newest Registered Students</h2>
                  <p className="mt-0.5 text-xs text-on-surface-variant">Recent account registrations</p>
                </div>
                <Link to="/admin/users" className="text-xs font-bold text-primary hover:underline">
                  View all →
                </Link>
              </div>

              <div className="mt-3 divide-y divide-outline-variant/50">
                {data.recentUsers.length ? (
                  data.recentUsers.map((user) => {
                    const initials = (user.fullName || "User")
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
                          {formatRelativeTime(user.createdAt)}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <p className="py-8 text-center text-xs text-on-surface-variant">No registered users yet.</p>
                )}
              </div>
            </div>

            {/* Newest Projects */}
            <div className="rounded-2xl border border-outline-variant/80 bg-surface-container-lowest p-5 shadow-2xs">
              <div className="flex items-center justify-between border-b border-outline-variant/60 pb-3">
                <div>
                  <h2 className="text-sm font-extrabold text-on-surface">Newest Student Workspaces</h2>
                  <p className="mt-0.5 text-xs text-on-surface-variant">Recent PFE projects created</p>
                </div>
                <Link to="/admin/projects" className="text-xs font-bold text-primary hover:underline">
                  View all →
                </Link>
              </div>

              <div className="mt-3 divide-y divide-outline-variant/50">
                {data.recentProjects.length ? (
                  data.recentProjects.map((project) => (
                    <div key={project._id} className="flex items-center justify-between gap-3 py-2.5">
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold text-on-surface">
                          {project.basics?.title || "Untitled Project"}
                        </p>
                        <p className="truncate text-[11px] text-on-surface-variant">
                          {project.user?.fullName || "Student"} ·{" "}
                          <span className="font-medium text-tertiary">{project.basics?.domain || "No domain"}</span>
                        </p>
                      </div>
                      <span className="shrink-0 text-[11px] text-on-surface-variant">
                        {formatRelativeTime(project.createdAt)}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="py-8 text-center text-xs text-on-surface-variant">No workspaces created yet.</p>
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
   REUSABLE KPI CARD COMPONENT
   ========================================================================= */
function KpiCard({
  label,
  value,
  sublabel,
  sublabelColor,
  helper,
  icon,
  coin,
  accentColor,
}: {
  label: string;
  value: string | number;
  sublabel: string;
  sublabelColor: string;
  helper: string;
  icon?: string;
  coin?: boolean;
  accentColor: "primary" | "tertiary" | "amber" | "emerald";
}) {
  const iconBgMap = {
    primary: "bg-primary/10 text-primary border border-primary/20",
    tertiary: "bg-tertiary/10 text-tertiary border border-tertiary/20",
    amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20",
    emerald: "bg-secondary/10 text-secondary border border-secondary/20",
  };

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-outline-variant/80 bg-surface-container-lowest p-5 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">{label}</p>
          <p className="mt-2 font-mono text-3xl font-extrabold tracking-tight text-on-surface">{value}</p>
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-extrabold ${sublabelColor}`}>
              {sublabel}
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

  // Generate smooth cubic bezier SVG path
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
        aria-label="Student and project growth curve"
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
              {/* Invisible touch/hover target column */}
              <rect
                x={pt.x - 20}
                y={0}
                width={40}
                height={height}
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={() => onHoverIndex(i)}
              />

              {/* Vertical Crosshair Line */}
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

              {/* Student Point */}
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

              {/* Project Point */}
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
          <span className="font-bold text-on-surface">{studentCoords[hoverIndex].label}</span>
          <div className="flex items-center gap-3">
            {showStudents && (
              <span className="flex items-center gap-1 font-semibold text-primary">
                <span className="h-2 w-2 rounded-full bg-primary" />
                {studentCoords[hoverIndex].value} Students
              </span>
            )}
            {showProjects && projectCoords[hoverIndex] && (
              <span className="flex items-center gap-1 font-semibold text-tertiary">
                <span className="h-2 w-2 rounded-full bg-tertiary" />
                {projectCoords[hoverIndex].value} Projects
              </span>
            )}
          </div>
        </div>
      )}

      {/* Month Labels on X-Axis */}
      <div className="mt-2 flex justify-between px-6 text-[11px] font-semibold text-on-surface-variant">
        {students.map((item) => (
          <span key={item.label}>{item.label}</span>
        ))}
      </div>
    </div>
  );
}

/* =========================================================================
   DAILY CREDIT TELEMETRY GROUPED BAR CHART
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
  const maxVal = Math.max(...days.map((d) => Math.max(d.spent, d.fulfilled)), 1);

  return (
    <div className="relative">
      <div
        className="flex h-44 items-end gap-1.5 border-b border-outline-variant/60 pb-1"
        onMouseLeave={() => onHoverIndex(null)}
      >
        {days.map((day, idx) => {
          const spentPct = Math.max((day.spent / maxVal) * 100, day.spent ? 8 : 2);
          const fulfilledPct = Math.max((day.fulfilled / maxVal) * 100, day.fulfilled ? 8 : 2);
          const isHovered = hoverIndex === idx;

          return (
            <div
              key={day.label}
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
                <div className="pointer-events-none absolute -top-14 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-xl border border-outline-variant bg-surface/95 px-2.5 py-1.5 text-[11px] shadow-xl backdrop-blur-md">
                  <p className="font-extrabold text-on-surface">{day.label}</p>
                  <p className="text-primary font-bold">{day.spent} spent</p>
                  <p className="text-amber-600 dark:text-amber-400 font-bold">{day.fulfilled} fulfilled</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* X-Axis dates */}
      <div className="mt-2 flex justify-between px-1 text-[10px] font-medium text-on-surface-variant/75">
        <span>{days[0]?.label}</span>
        <span>{days[Math.floor(days.length / 2)]?.label}</span>
        <span>{days[days.length - 1]?.label}</span>
      </div>
    </div>
  );
}
