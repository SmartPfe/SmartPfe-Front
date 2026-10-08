import { apiMessage, displayApiMessage, type ApiMessage } from "@/lib/apiMessage";
import React, { useEffect, useMemo, useState, useRef } from "react";
import { createIdempotencyKey, fetchApi } from "@/lib/api";
import HugeiconsIcon from "@/components/ui/HugeiconsIcon";
import creditCoin from "@/assets/credit-coin.png";
import { useTranslation } from "react-i18next";

type AdminUser = {
  _id: string;
  fullName: string;
  email: string;
  role: "admin" | "etudiant";
  hasCompletedOnboarding: boolean;
  authProvider?: string;
  avatar?: string;
  createdAt: string;
  walletEligible: boolean;
  credits?: { promotional: number; purchased: number; total: number };
};

type SortKey = "name" | "joined" | "credits";
type OnboardingFilter = "all" | "completed" | "pending";

const formatDate = (value: string, locale: string) =>
  new Intl.DateTimeFormat(locale, { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));

const formatDateTime = (value: string, locale: string) =>
  new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));

export default function AdminUsers() {
  const { t, i18n } = useTranslation("adminManagement");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [onboardingFilter, setOnboardingFilter] = useState<OnboardingFilter>("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("joined");
  const [descending, setDescending] = useState(true);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<AdminUser | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [wallet, setWallet] = useState<any>(null);
  const [amount, setAmount] = useState(10);
  const [bucket, setBucket] = useState<"promotional" | "purchased">("purchased");
  const [reason, setReason] = useState("");
  const [reference, setReference] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<ApiMessage>("");
  const [notice, setNotice] = useState<{ amount: number; bucket: "promotional" | "purchased"; added: boolean; deliveryKey?: string } | null>(null);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const pageSize = 10;

  const loadUsers = async (showRefreshSpin = false) => {
    if (showRefreshSpin) setIsRefreshing(true);
    else setIsLoading(true);
    setError("");
    setErrorKey(null);
    try {
      const data = await fetchApi("/admin/users");
      setUsers(data);
    } catch (err) {
      if (err instanceof Error) setError(apiMessage(err));
      else { setError(""); setErrorKey("users.errors.load"); }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [roleFilter, onboardingFilter, query, sort, descending]);

  // Keyboard shortcut to focus search with "/"
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const openWallet = async (user: AdminUser) => {
    if (!user.walletEligible) return;
    setSelected(user);
    setHistory([]);
    setWallet(user.credits || null);
    setBucket("purchased");
    setAmount(10);
    setReason("");
    setReference("");
    setError("");
    setErrorKey(null);
    setNotice(null);
    try {
      const data = await fetchApi(`/admin/users/${user._id}/credits?limit=20`);
      setWallet(data.wallet);
      setHistory(data.items || []);
      setUsers((items) => items.map((item) => (item._id === user._id ? { ...item, credits: data.wallet } : item)));
    } catch (err) {
      if (err instanceof Error) setError(apiMessage(err));
      else { setError(""); setErrorKey("users.errors.wallet"); }
    }
  };

  const adjust = async () => {
    if (!selected || !Number.isInteger(Number(amount)) || Number(amount) === 0 || !reason.trim()) {
      setError("");
      setErrorKey("users.errors.validation");
      return;
    }
    setSaving(true);
    setError("");
    setErrorKey(null);
    setNotice(null);
    try {
      const data = await fetchApi(`/admin/users/${selected._id}/credits/adjust`, {
        method: "POST",
        headers: { "X-Idempotency-Key": createIdempotencyKey() },
        body: JSON.stringify({ amount: Number(amount), bucket, reason: reason.trim(), reference: reference.trim() }),
      });
      setWallet(data.wallet);
      setUsers((items) => items.map((item) => (item._id === selected._id ? { ...item, credits: data.wallet } : item)));
      setHistory((items) => [data.transaction, ...items]);
      const deliveryKey = bucket === "purchased" && Number(amount) > 0
        ? data.emailSent
          ? "users.wallet.notice.emailSent"
          : "users.wallet.notice.emailNotConfigured"
        : undefined;
      setNotice({ amount: Math.abs(Number(amount)), bucket, added: Number(amount) > 0, deliveryKey });
      setReason("");
      setReference("");
      setAmount(10);
    } catch (err) {
      if (err instanceof Error) setError(apiMessage(err));
      else { setError(""); setErrorKey("users.errors.adjust"); }
    } finally {
      setSaving(false);
    }
  };

  // Aggregated Counts for Header & Segment Pills
  const counts = useMemo(() => {
    const studentCount = users.filter((u) => u.walletEligible).length;
    const adminCount = users.length - studentCount;
    const onboardedCount = users.filter((u) => u.walletEligible && u.hasCompletedOnboarding).length;
    const pendingOnboardingCount = users.filter((u) => u.walletEligible && !u.hasCompletedOnboarding).length;
    const totalCirculatingCredits = users.reduce((acc, u) => acc + (u.credits?.total || 0), 0);
    return {
      total: users.length,
      students: studentCount,
      admins: adminCount,
      onboarded: onboardedCount,
      pendingOnboarding: pendingOnboardingCount,
      circulatingCredits: totalCirculatingCredits,
    };
  }, [users]);

  // Filter & Sort Logic
  const filteredUsers = useMemo(() => {
    return users
      .filter((user) => {
        const roleMatch = roleFilter === "all" || user.role === roleFilter;
        const onboardingMatch =
          onboardingFilter === "all"
            ? true
            : onboardingFilter === "completed"
            ? user.hasCompletedOnboarding
            : !user.hasCompletedOnboarding;
        const searchNeedle = query.trim().toLowerCase();
        const searchMatch = !searchNeedle || `${user.fullName} ${user.email} ${user.role}`.toLowerCase().includes(searchNeedle);
        return roleMatch && onboardingMatch && searchMatch;
      })
      .sort((a, b) => {
        const direction = descending ? -1 : 1;
        if (sort === "name") return direction * a.fullName.localeCompare(b.fullName);
        if (sort === "credits") return direction * ((a.credits?.total || 0) - (b.credits?.total || 0));
        return direction * (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      });
  }, [users, roleFilter, onboardingFilter, query, sort, descending]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const visibleUsers = filteredUsers.slice((page - 1) * pageSize, page * pageSize);

  const sortBy = (key: SortKey) => {
    setDescending(sort === key ? !descending : key !== "name");
    setSort(key);
  };

  const clearAllFilters = () => {
    setQuery("");
    setRoleFilter("all");
    setOnboardingFilter("all");
    setSort("joined");
    setDescending(true);
  };

  const hasActiveFilters = query.trim() !== "" || roleFilter !== "all" || onboardingFilter !== "all";

  // Excel / CSV Export
  const exportCsv = () => {
    if (!users.length) return;
    const headers = [
      "Full Name",
      "Email",
      "Role",
      "Onboarding Completed",
      "Total Credits",
      "Promotional Credits",
      "Purchased Credits",
      "Joined Date",
    ];
    const rows = filteredUsers.map((u) => {
      const d = new Date(u.createdAt);
      const dateFormatted = d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
      return [
        `"${u.fullName.replace(/"/g, '""')}"`,
        `"${u.email.replace(/"/g, '""')}"`,
        u.walletEligible ? "Student" : "Admin",
        u.hasCompletedOnboarding ? "Completed" : "Pending",
        u.credits?.total ?? 0,
        u.credits?.promotional ?? 0,
        u.credits?.purchased ?? 0,
        `"${dateFormatted}"`,
      ];
    });

    // Prepend UTF-8 BOM (\uFEFF) so Excel opens UTF-8 text with correct encoding without clipping dates
    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((e) => e.join(","))].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `smartpfe_students_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 pb-16">
      {/* Page Header with Compact Telemetry Pills (Replacing Oversized Cards) */}
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-primary">{t("common.administration")}</span>
            <span className="h-1 w-1 rounded-full bg-outline-variant" />
            <span className="text-[11px] font-semibold text-on-surface-variant">{t("users.management")}</span>
          </div>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-on-surface sm:text-3xl">
            {t("users.title")}
          </h1>
          <p className="mt-1 text-sm text-on-surface-variant max-w-2xl">
            {t("users.description")}
          </p>
        </div>

        {/* Compact, High-Density Executive Telemetry Strip */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          <div className="flex items-center gap-2 rounded-xl border border-outline-variant/80 bg-surface-container-lowest px-3 py-1.5 shadow-2xs">
            <span className="flex h-2 w-2 rounded-full bg-primary" />
            <span className="text-xs font-bold text-on-surface">{counts.students}</span>
            <span className="text-[11px] font-medium text-on-surface-variant">{t("common.students")}</span>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-outline-variant/80 bg-surface-container-lowest px-3 py-1.5 shadow-2xs">
            <span className="flex h-2 w-2 rounded-full bg-secondary" />
            <span className="text-xs font-bold text-on-surface">{counts.onboarded}</span>
            <span className="text-[11px] font-medium text-on-surface-variant">{t("users.onboarded")}</span>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-outline-variant/80 bg-surface-container-lowest px-3 py-1.5 shadow-2xs">
            <img src={creditCoin} alt="" className="h-4 w-4" />
            <span className="font-mono text-xs font-bold text-on-surface">{counts.circulatingCredits.toLocaleString(i18n.language)}</span>
            <span className="text-[11px] font-medium text-on-surface-variant">{t("users.held")}</span>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-outline-variant/80 bg-surface-container-lowest px-3 py-1.5 shadow-2xs">
            <span className="flex h-2 w-2 rounded-full bg-surface-container-highest" />
            <span className="text-xs font-bold text-on-surface">{counts.admins}</span>
            <span className="text-[11px] font-medium text-on-surface-variant">{t("common.admin")}</span>
          </div>

          <button
            type="button"
            onClick={() => loadUsers(true)}
            disabled={isRefreshing}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-outline-variant bg-surface px-3 text-xs font-bold text-on-surface shadow-2xs transition-all hover:bg-surface-container-low active:scale-[.98] disabled:opacity-50"
            title={t("users.refreshTitle")}
          >
            <span className={isRefreshing ? "animate-spin" : ""}>
              <HugeiconsIcon icon="refresh" size={14} strokeWidth={1.8} />
            </span>
            <span>{t("common.refresh")}</span>
          </button>
        </div>
      </header>

      {/* Main Table Card with Modern Toolbar */}
      <section className="overflow-hidden rounded-2xl border border-outline-variant/80 bg-surface-container-lowest shadow-2xs">
        {/* Enterprise Toolbar */}
        <div className="border-b border-outline-variant/60 bg-surface-container-low/40 p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            {/* Left: Omni-Search Bar */}
            <div className="relative w-full lg:max-w-md">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/70">
                <HugeiconsIcon icon="search" size={17} strokeWidth={1.8} />
              </span>
              <input
                ref={searchInputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t("users.searchPlaceholder")}
                className="h-10 w-full rounded-xl border border-outline-variant/90 bg-surface pl-10 pr-9 text-xs sm:text-sm font-medium text-on-surface placeholder:text-on-surface-variant/55 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 grid h-6 w-6 place-items-center rounded-md text-on-surface-variant/60 hover:bg-surface-container-high hover:text-on-surface transition-colors"
                  aria-label={t("users.clearSearch")}
                >
                  <HugeiconsIcon icon="close" size={13} strokeWidth={2} />
                </button>
              )}
            </div>

            {/* Center / Right: Filter Group & Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Role Segmented Pills */}
              <div className="inline-flex rounded-xl border border-outline-variant/80 bg-surface p-1 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setRoleFilter("all")}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                    roleFilter === "all"
                      ? "bg-primary text-on-primary shadow-xs"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  {t("common.all")} <span className="opacity-70 text-[10px]">({counts.total})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRoleFilter("etudiant")}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                    roleFilter === "etudiant"
                      ? "bg-primary text-on-primary shadow-xs"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  {t("common.students")} <span className="opacity-70 text-[10px]">({counts.students})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRoleFilter("admin")}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                    roleFilter === "admin"
                      ? "bg-primary text-on-primary shadow-xs"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  {t("users.table.admins")} <span className="opacity-70 text-[10px]">({counts.admins})</span>
                </button>
              </div>

              {/* Onboarding Status Filter */}
              <div className="relative">
                <select
                  value={onboardingFilter}
                  onChange={(e) => setOnboardingFilter(e.target.value as OnboardingFilter)}
                  className="h-9 appearance-none rounded-xl border border-outline-variant/80 bg-surface pl-3 pr-8 text-xs font-semibold text-on-surface outline-none transition-all hover:bg-surface-container-low focus:border-primary focus:ring-2 focus:ring-primary/20"
                >
                  <option value="all">{t("users.allOnboarding")}</option>
                  <option value="completed">{t("users.completedOnboarding")}</option>
                  <option value="pending">{t("users.pendingOnboarding")}</option>
                </select>
                <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant/70">
                  <HugeiconsIcon icon="chevron-down" size={13} strokeWidth={2} />
                </span>
              </div>

              {/* Sort Selector */}
              <div className="relative">
                <select
                  value={`${sort}-${descending ? "desc" : "asc"}`}
                  onChange={(e) => {
                    const [key, dir] = e.target.value.split("-");
                    setSort(key as SortKey);
                    setDescending(dir === "desc");
                  }}
                  className="h-9 appearance-none rounded-xl border border-outline-variant/80 bg-surface pl-3 pr-8 text-xs font-semibold text-on-surface outline-none transition-all hover:bg-surface-container-low focus:border-primary focus:ring-2 focus:ring-primary/20"
                >
                  <option value="joined-desc">{t("users.sort.newest")}</option>
                  <option value="joined-asc">{t("users.sort.oldest")}</option>
                  <option value="name-asc">{t("users.sort.nameAsc")}</option>
                  <option value="name-desc">{t("users.sort.nameDesc")}</option>
                  <option value="credits-desc">{t("users.sort.creditsHigh")}</option>
                  <option value="credits-asc">{t("users.sort.creditsLow")}</option>
                </select>
                <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant/70">
                  <HugeiconsIcon icon="chevron-down" size={13} strokeWidth={2} />
                </span>
              </div>

              {/* Excel Export Button */}
              <button
                type="button"
                onClick={exportCsv}
                disabled={!filteredUsers.length}
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-outline-variant/80 bg-surface px-3 text-xs font-semibold text-on-surface shadow-2xs transition-all hover:border-emerald-500/40 hover:bg-emerald-500/5 hover:text-emerald-600 dark:hover:text-emerald-400 active:scale-[.98] disabled:opacity-40"
                title={t("users.exportTitle")}
              >
                <HugeiconsIcon icon="file-excel" size={15} className="text-emerald-600 dark:text-emerald-400" strokeWidth={1.8} />
                <span className="hidden sm:inline">{t("users.export")}</span>
              </button>

              {/* Reset Filters Chip (if active) */}
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="inline-flex h-9 items-center gap-1 rounded-xl bg-primary/10 px-2.5 text-xs font-bold text-primary hover:bg-primary/20 transition-colors"
                >
                  <HugeiconsIcon icon="filter-remove" size={13} strokeWidth={2} />
                  <span>{t("users.reset")}</span>
                </button>
              )}
            </div>
          </div>

          {/* Active Filter Context Bar */}
          <div className="mt-3 flex items-center justify-between text-xs text-on-surface-variant">
            <span>
              {t("common.showing", { shown: filteredUsers.length, total: users.length, item: t("users.accounts") })}
              {hasActiveFilters && <span className="ml-1 text-primary">{t("users.filtered")}</span>}
            </span>
            <span className="hidden sm:inline text-[11px] text-on-surface-variant/70">
              {t("users.tipSort")}
            </span>
          </div>
        </div>

        {/* Error Alert */}
        {(error || errorKey) && !selected && (
          <div className="m-4 flex items-center gap-2 rounded-xl border border-error/30 bg-error/10 px-4 py-3 text-xs font-semibold text-error">
            <HugeiconsIcon icon="alert-circle" size={16} strokeWidth={1.8} />
            <span>{errorKey ? t(errorKey) : displayApiMessage(error)}</span>
          </div>
        )}

        {/* Table Content */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="mt-3 text-sm font-medium text-on-surface-variant">{t("users.loadingDirectory")}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">
              <thead className="border-b border-outline-variant/60 bg-surface-container-low/60 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                <tr>
                  <Head label={t("users.table.account")} active={sort === "name"} descending={descending} onClick={() => sortBy("name")} />
                  <th className="px-4 py-3">{t("users.table.role")}</th>
                  <th className="px-4 py-3">{t("users.table.onboarding")}</th>
                  <Head label={t("common.credits")} active={sort === "credits"} descending={descending} onClick={() => sortBy("credits")} />
                  <Head label={t("users.table.joined")} active={sort === "joined"} descending={descending} onClick={() => sortBy("joined")} />
                  <th className="px-5 py-3 text-right">{t("users.table.actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/40">
                {visibleUsers.map((user) => {
                  const initials = (user.fullName || "User")
                    .split(" ")
                    .map((p) => p[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase();
                  const promo = user.credits?.promotional ?? 0;
                  const purch = user.credits?.purchased ?? 0;
                  const total = user.credits?.total ?? 0;

                  return (
                    <tr
                      key={user._id}
                      className="group transition-colors hover:bg-surface-container-low/40"
                    >
                      {/* Account Identity */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/20 text-xs font-extrabold text-primary">
                            {user.avatar ? (
                              <img
                                src={user.avatar}
                                alt={user.fullName}
                                className="h-full w-full rounded-xl object-cover"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              initials
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-xs font-bold text-on-surface group-hover:text-primary transition-colors">
                              {user.fullName}
                            </p>
                            <p className="truncate text-[11px] text-on-surface-variant">{user.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide ${
                            user.walletEligible
                              ? "bg-primary/10 text-primary border border-primary/20"
                              : "bg-surface-container-high text-on-surface-variant border border-outline-variant"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              user.walletEligible ? "bg-primary" : "bg-on-surface-variant"
                            }`}
                          />
                          {user.walletEligible ? t("common.students") : t("common.admin")}
                        </span>
                      </td>

                      {/* Onboarding Progress */}
                      <td className="px-4 py-3.5">
                        {user.walletEligible ? (
                          user.hasCompletedOnboarding ? (
                            <span className="inline-flex items-center gap-1 rounded-md bg-secondary/10 px-2 py-0.5 text-[10px] font-bold text-secondary">
                              <HugeiconsIcon icon="checkmark-circle-02" size={12} strokeWidth={2} />
                              {t("users.table.completed")}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                              <HugeiconsIcon icon="time-quarter" size={12} strokeWidth={2} />
                              {t("users.table.pending")}
                            </span>
                          )
                        ) : (
                          <span className="text-[11px] text-on-surface-variant/70">—</span>
                        )}
                      </td>

                      {/* Credits Balance */}
                      <td className="px-4 py-3.5">
                        {user.walletEligible ? (
                          <div className="flex flex-col">
                            <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-on-surface">
                              <img src={creditCoin} alt="" className="h-4 w-4" />
                              {total.toLocaleString(i18n.language)}
                            </span>
                            <span className="text-[10px] text-on-surface-variant/75">
                              {promo} {t("users.table.promoShort")} · {purch} {t("users.table.purchasedShort")}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-on-surface-variant/70 italic">{t("users.table.noWallet")}</span>
                        )}
                      </td>

                      {/* Joined Date */}
                      <td className="px-4 py-3.5">
                        <span className="text-xs text-on-surface-variant">{formatDate(user.createdAt, i18n.language)}</span>
                      </td>

                      {/* Action */}
                      <td className="px-5 py-3.5 text-right">
                        {user.walletEligible ? (
                          <button
                            type="button"
                            onClick={() => openWallet(user)}
                            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-outline-variant bg-surface px-2.5 text-[11px] font-bold text-on-surface shadow-2xs transition-all hover:border-primary/50 hover:bg-primary/5 hover:text-primary active:scale-[.98]"
                          >
                            <HugeiconsIcon icon="wallet-02" size={13} strokeWidth={1.8} />
                            <span>{t("users.table.manageWallet")}</span>
                          </button>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/70">
                            <HugeiconsIcon icon="lock" size={11} strokeWidth={2} />
                            {t("users.table.protected")}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Empty Search / Filter State */}
            {!filteredUsers.length && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-surface-container-high text-on-surface-variant">
                  <HugeiconsIcon icon="search" size={24} strokeWidth={1.5} />
                </div>
                <p className="mt-3 text-sm font-bold text-on-surface">{t("users.empty.title")}</p>
                <p className="mt-1 text-xs text-on-surface-variant max-w-sm">
                  {t("users.empty.description")}
                </p>
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="mt-4 inline-flex h-8 items-center gap-1 rounded-lg bg-primary px-3 text-xs font-bold text-on-primary transition-all hover:bg-primary/90"
                >
                  {t("users.empty.clear")}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Table Footer with Paging Controls */}
        <footer className="flex flex-col gap-3 border-t border-outline-variant/60 bg-surface-container-low/20 px-4 py-3 text-xs text-on-surface-variant sm:flex-row sm:items-center sm:justify-between">
          <span>
            {filteredUsers.length
              ? t("users.pagination.showingPage", { from: (page - 1) * pageSize + 1, to: Math.min(page * pageSize, filteredUsers.length), total: filteredUsers.length })
              : t("users.empty.zeroAccounts")}
          </span>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              disabled={page === 1}
              onClick={() => setPage((current) => current - 1)}
              className="inline-flex h-8 items-center gap-1 rounded-lg border border-outline-variant bg-surface px-2.5 font-bold text-on-surface shadow-2xs transition-all hover:bg-surface-container-low disabled:opacity-40"
            >
              <HugeiconsIcon icon="chevron-left" size={13} strokeWidth={2} />
              {t("common.previous")}
            </button>
            <span className="px-2 font-medium">
              {t("users.pagination.pageOf", { page, total: totalPages })}
            </span>
            <button
              type="button"
              disabled={page === totalPages}
              onClick={() => setPage((current) => current + 1)}
              className="inline-flex h-8 items-center gap-1 rounded-lg border border-outline-variant bg-surface px-2.5 font-bold text-on-surface shadow-2xs transition-all hover:bg-surface-container-low disabled:opacity-40"
            >
              {t("common.next")}
              <HugeiconsIcon icon="chevron-right" size={13} strokeWidth={2} />
            </button>
          </div>
        </footer>
      </section>

      {/* Wallet Management Drawer */}
      {selected && (
        <WalletDrawer
          selected={selected}
          wallet={wallet}
          history={history}
          amount={amount}
          setAmount={setAmount}
          bucket={bucket}
          setBucket={setBucket}
          reason={reason}
          setReason={setReason}
          reference={reference}
          setReference={setReference}
          saving={saving}
          error={error}
          errorKey={errorKey}
          notice={notice}
          onClose={() => setSelected(null)}
          onAdjust={adjust}
        />
      )}
    </div>
  );
}

function Head({
  label,
  active,
  descending,
  onClick,
}: {
  label: string;
  active: boolean;
  descending: boolean;
  onClick: () => void;
}) {
  return (
    <th className="px-4 py-3">
      <button
        type="button"
        onClick={onClick}
        className={`inline-flex items-center gap-1 transition-colors hover:text-primary ${
          active ? "text-primary font-extrabold" : ""
        }`}
      >
        <span>{label}</span>
        <span className={`transition-transform duration-200 ${active && !descending ? "rotate-180" : ""}`}>
          <HugeiconsIcon icon="chevron-down" size={12} strokeWidth={2} />
        </span>
      </button>
    </th>
  );
}

function WalletDrawer(props: any) {
  const { t, i18n } = useTranslation("adminManagement");
  const tCreditHistory = i18n.getFixedT(i18n.resolvedLanguage || i18n.language, "creditHistory");
  const {
    selected,
    wallet,
    history,
    amount,
    setAmount,
    bucket,
    setBucket,
    reason,
    setReason,
    reference,
    setReference,
    saving,
    error,
    errorKey,
    notice,
    onClose,
    onAdjust,
  } = props;

  const quickPresets = [10, 25, 50, 100];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-end bg-black/40 backdrop-blur-[2px] transition-opacity sm:p-4"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) onClose();
      }}
    >
      <aside className="flex h-[94dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-outline-variant bg-surface shadow-2xl sm:h-full sm:rounded-2xl">
        {/* Drawer Header */}
        <header className="flex items-center justify-between border-b border-outline-variant/60 bg-surface-container-low/40 p-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 border border-primary/20 text-sm font-extrabold text-primary">
              <HugeiconsIcon icon="wallet-02" size={18} strokeWidth={1.8} />
            </div>
            <div>
              <p className="text-sm font-extrabold text-on-surface">{selected.fullName}</p>
              <p className="text-xs text-on-surface-variant">{selected.email}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-lg text-on-surface-variant hover:bg-surface-container transition-colors"
            aria-label={t("users.wallet.close")}
          >
            <HugeiconsIcon icon="close" size={16} strokeWidth={2} />
          </button>
        </header>

        {/* Drawer Body */}
        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          {(error || errorKey) && (
            <div className="flex items-center gap-2 rounded-xl border border-error/30 bg-error/10 px-3.5 py-2.5 text-xs font-semibold text-error">
              <HugeiconsIcon icon="alert-circle" size={15} strokeWidth={2} />
              <span>{errorKey ? t(errorKey) : displayApiMessage(error)}</span>
            </div>
          )}
          {notice && (
            <div className="flex items-center gap-2 rounded-xl border border-secondary/30 bg-secondary/10 px-3.5 py-2.5 text-xs font-semibold text-secondary">
              <HugeiconsIcon icon="checkmark-circle-02" size={15} strokeWidth={2} />
              <span>
                {t(`users.wallet.notice.${notice.added ? "added" : "removed"}${notice.bucket === "purchased" ? "Purchased" : "Promotional"}`, {
                  amount: notice.amount.toLocaleString(i18n.language),
                })}
                {notice.deliveryKey ? ` ${t(notice.deliveryKey)}` : ""}
              </span>
            </div>
          )}

          {/* Current Balance Glow Card */}
          <div className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/15 via-amber-500/5 to-primary/5 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-amber-700 dark:text-amber-300">
                  {t("users.wallet.totalBalance")}
                </p>
                <div className="mt-1.5 flex items-center gap-2.5">
                  <img src={creditCoin} alt="" className="h-8 w-8 drop-shadow-xs" />
                  <span className="font-mono text-3xl font-extrabold tracking-tight text-on-surface">
                    {(wallet?.total ?? 0).toLocaleString(i18n.language)}
                  </span>
                  <span className="text-xs font-semibold text-on-surface-variant">{t("users.wallet.credits")}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2.5">
              <div className="rounded-xl border border-outline-variant/60 bg-surface/80 p-2.5 backdrop-blur-xs">
                <span className="text-[11px] font-medium text-on-surface-variant">{t("common.promotional")}</span>
                <p className="mt-0.5 font-mono text-base font-bold text-on-surface">
                  {(wallet?.promotional ?? 0).toLocaleString(i18n.language)}
                </p>
              </div>
              <div className="rounded-xl border border-outline-variant/60 bg-surface/80 p-2.5 backdrop-blur-xs">
                <span className="text-[11px] font-medium text-on-surface-variant">{t("common.purchased")}</span>
                <p className="mt-0.5 font-mono text-base font-bold text-amber-600 dark:text-amber-400">
                  {(wallet?.purchased ?? 0).toLocaleString(i18n.language)}
                </p>
              </div>
            </div>
          </div>

          {/* Fulfil / Adjust Form */}
          <section className="rounded-2xl border border-outline-variant/80 bg-surface-container-lowest p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-on-surface">
                {t("users.wallet.fulfilAdjust")}
              </h2>
              <span className="rounded-full bg-amber-400/10 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-300">
                {t("users.wallet.purchasedDefault")}
              </span>
            </div>

            {/* Quick Amount Presets */}
            <div className="mt-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">{t("users.wallet.quickPresets")}</span>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {quickPresets.map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setAmount(val)}
                    className={`h-7 rounded-lg border px-2.5 text-xs font-bold transition-all ${
                      amount === val
                        ? "border-primary bg-primary text-on-primary shadow-xs"
                        : "border-outline-variant bg-surface text-on-surface hover:border-primary/40"
                    }`}
                  >
                    +{val}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                {t("users.wallet.amount")}
                <input
                  type="number"
                  step="1"
                  value={amount}
                  onChange={(event) => setAmount(Number(event.target.value))}
                  className="mt-1 h-10 w-full rounded-xl border border-outline-variant bg-surface px-3 font-mono text-sm font-bold text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </label>
              <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                {t("users.wallet.bucket")}
                <select
                  value={bucket}
                  onChange={(event) => setBucket(event.target.value as any)}
                  className="mt-1 h-10 w-full rounded-xl border border-outline-variant bg-surface px-3 text-xs font-semibold text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                >
                  <option value="purchased">{t("common.purchased")}</option>
                  <option value="promotional">{t("common.promotional")}</option>
                </select>
              </label>
            </div>

            <div className="mt-2.5 space-y-2">
              <input
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder={t("users.wallet.reasonPlaceholder")}
                maxLength={500}
                className="h-10 w-full rounded-xl border border-outline-variant bg-surface px-3 text-xs text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              <input
                value={reference}
                onChange={(event) => setReference(event.target.value)}
                placeholder={t("users.wallet.referencePlaceholder")}
                maxLength={200}
                className="h-10 w-full rounded-xl border border-outline-variant bg-surface px-3 text-xs text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <button
              type="button"
              onClick={onAdjust}
              disabled={saving}
              className="mt-3.5 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-primary text-xs font-extrabold text-on-primary shadow-xs transition-all hover:bg-primary/90 active:scale-[.99] disabled:opacity-50"
            >
              {saving ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>{t("users.wallet.applying")}</span>
                </>
              ) : (
                <>
                  <HugeiconsIcon icon="checkmark-circle-02" size={16} strokeWidth={2} />
                  <span>{t("users.wallet.confirm")}</span>
                </>
              )}
            </button>
            <p className="mt-2 text-[10px] text-on-surface-variant/80">
              {t("users.wallet.emailNote")}
            </p>
          </section>

          {/* Recent Wallet History */}
          <section>
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-on-surface">
              {t("users.wallet.recentActivity", { count: history.length })}
            </h2>
            <div className="mt-2 divide-y divide-outline-variant/50 rounded-2xl border border-outline-variant/70 bg-surface-container-lowest p-2">
              {history.length ? (
                history.map((item: any) => {
                  const delta = ["refunded", "cancelled"].includes(item.status)
                    ? 0
                    : (item.promotionalDelta || 0) + (item.purchasedDelta || 0) - (item.chargedCost || 0);
                  const isPositive = delta > 0;

                  return (
                    <div key={item._id} className="flex items-center justify-between gap-3 p-2.5">
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold capitalize text-on-surface">
                          {item.reason || (item.actionKey && i18n.exists(`actions.${item.actionKey}`, { ns: "creditHistory" })
                            ? tCreditHistory(`actions.${item.actionKey}`)
                            : item.actionKey?.replaceAll("_", " ") || item.kind)}
                        </p>
                        <p className="text-[10px] text-on-surface-variant">{formatDateTime(item.createdAt, i18n.language)}</p>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 font-mono text-xs font-extrabold ${
                          isPositive ? "text-secondary" : "text-on-surface"
                        }`}
                      >
                        {isPositive ? `+${delta}` : delta}
                      </span>
                    </div>
                  );
                })
              ) : (
                <p className="py-6 text-center text-xs text-on-surface-variant">{t("users.wallet.emptyHistory")}</p>
              )}
            </div>
          </section>
        </div>
      </aside>
    </div>
  );
}
