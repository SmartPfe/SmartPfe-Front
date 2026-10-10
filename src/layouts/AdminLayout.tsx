import { useEffect, useMemo, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import NotificationBell from "@/components/layout/NotificationBell";
import { NotificationProvider } from "@/context/NotificationContext";
import HugeiconsIcon from "@/components/ui/HugeiconsIcon";
import creditCoin from "@/assets/credit-coin.png";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import LanguageSelector from "@/components/LanguageSelector";

const ADMIN_NAV_ITEMS = [
  { labelKey: "admin.navigation.overview", icon: "dashboard", path: "/admin/dashboard", helperKey: "admin.navigation.overviewHelper" },
  { labelKey: "admin.navigation.users", icon: "group", path: "/admin/users", helperKey: "admin.navigation.usersHelper" },
  { labelKey: "admin.navigation.projects", icon: "folder-01", path: "/admin/projects", helperKey: "admin.navigation.projectsHelper" },
  { labelKey: "admin.navigation.creditEconomy", icon: "coin", path: "/admin/credits", helperKey: "admin.navigation.creditEconomyHelper", coin: true },
  { labelKey: "admin.navigation.creditRequests", icon: "wallet-02", path: "/admin/credit-requests", helperKey: "admin.navigation.creditRequestsHelper", coin: true },
  { labelKey: "admin.navigation.adminAccount", icon: "settings-02", path: "/admin/settings", helperKey: "admin.navigation.adminAccountHelper" },
];

export default function AdminLayout() {
  const { t } = useTranslation("shell");
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const initials = (user.fullName || "Admin").split(" ").map((part: string) => part[0]).join("").slice(0, 2).toUpperCase();
  const current = useMemo(() => ADMIN_NAV_ITEMS.find((item) => location.pathname === item.path) || ADMIN_NAV_ITEMS[0], [location.pathname]);

  useEffect(() => setMobileOpen(false), [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const sidebar = (
    <aside className="flex h-full w-[272px] flex-col border-r border-outline-variant/70 bg-surface">
      <div className="flex h-16 items-center gap-3 border-b border-outline-variant/60 px-4">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-primary to-tertiary text-sm font-extrabold text-white shadow-sm">S</div>
        <div className="min-w-0">
          <p className="truncate text-sm font-extrabold tracking-tight text-on-surface">SmartPFE</p>
          <p className="truncate text-[10px] font-bold uppercase tracking-[0.16em] text-primary">{t("admin.title")}</p>
        </div>
        <button type="button" onClick={() => setMobileOpen(false)} className="ml-auto grid h-8 w-8 place-items-center rounded-lg text-on-surface-variant hover:bg-surface-container lg:hidden" aria-label={t("admin.closeMenu")}>
          <HugeiconsIcon icon="close" size={17} />
        </button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        <p className="px-2 pb-2 pt-1 text-[9px] font-extrabold uppercase tracking-[0.18em] text-on-surface-variant/70">{t("admin.management")}</p>
        {ADMIN_NAV_ITEMS.map((item) => (
          <NavLink key={item.path} to={item.path} className={({ isActive }) => cn(
            "group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors",
            isActive ? "bg-primary/10 text-primary" : "text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface"
          )}>
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-surface-container-low group-hover:bg-surface">
              {item.coin ? <img src={creditCoin} alt="" className="h-5 w-5" /> : <HugeiconsIcon icon={item.icon} size={17} strokeWidth={1.8} />}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-xs font-bold">{t(item.labelKey)}</span>
              <span className="block truncate text-[10px] font-medium opacity-70">{t(item.helperKey)}</span>
            </span>
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-outline-variant/60 p-3">
        <div className="mb-2 flex items-center gap-3 rounded-xl bg-surface-container-low p-2.5">
          <div className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-xl bg-primary/10 text-xs font-extrabold text-primary">
            {user.avatar ? <img src={user.avatar} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" /> : initials}
          </div>
          <div className="min-w-0"><p className="truncate text-xs font-bold text-on-surface">{user.fullName || t("admin.administrator")}</p><p className="truncate text-[10px] text-on-surface-variant">{user.email}</p></div>
        </div>
        <div>
          <button type="button" onClick={handleLogout} className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-outline-variant bg-surface text-[10px] font-bold text-error hover:bg-error/5">
            <HugeiconsIcon icon="logout-01" size={13} /> {t("admin.logOut")}
          </button>
        </div>
      </div>
    </aside>
  );

  return (
    <NotificationProvider>
      <div className="min-h-dvh bg-surface-container-lowest text-on-surface">
        <div className="fixed inset-y-0 left-0 z-40 hidden lg:block">{sidebar}</div>
        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button type="button" className="absolute inset-0 bg-black/35 backdrop-blur-[1px]" onClick={() => setMobileOpen(false)} aria-label={t("admin.closeMenu")} />
            <div className="relative h-full w-[272px] shadow-2xl">{sidebar}</div>
          </div>
        )}

        <div className="min-h-dvh lg:pl-[272px]">
          <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-outline-variant/60 bg-surface/90 px-3 backdrop-blur-md sm:px-5">
            <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="grid h-8 w-8 place-items-center rounded-lg text-on-surface-variant hover:bg-surface-container lg:hidden"
                aria-label={t("admin.openMenu")}
              >
                <HugeiconsIcon icon="menu-01" size={17} strokeWidth={1.75} />
              </button>

              {/* Breadcrumb Trail */}
              <nav aria-label={t("navigation.breadcrumb")} className="flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm min-w-0">
                <Link
                  to="/admin/dashboard"
                  className="hidden sm:inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/60 transition-colors font-medium"
                >
                  <HugeiconsIcon icon="dashboard" size={15} className="text-on-surface-variant shrink-0" strokeWidth={1.75} />
                  <span>{t("admin.admin")}</span>
                </Link>

                <span className="hidden sm:inline text-outline-variant select-none">/</span>

                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface-container-low/90 border border-outline-variant/50 text-on-surface font-semibold shadow-2xs min-w-0">
                  {current.coin ? (
                    <img src={creditCoin} alt="" className="h-3.5 w-3.5 shrink-0" />
                  ) : (
                    <HugeiconsIcon icon={current.icon} size={14} className="text-primary shrink-0" strokeWidth={1.8} />
                  )}
                  <span className="truncate max-w-[150px] sm:max-w-[220px]">{t(current.labelKey)}</span>
                </div>
              </nav>
            </div>
            <div className="flex items-center gap-2">
              <LanguageSelector variant="minimal" />
              <NotificationBell label={t("admin.liveSystemUpdates")} />
              <Link to="/admin/settings" className="grid h-8 w-8 place-items-center rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface" title={t("admin.adminAccountTitle")}>
                <HugeiconsIcon icon="settings-02" size={17} />
              </Link>
              <div className="ml-1 grid h-8 w-8 place-items-center overflow-hidden rounded-full border border-primary/20 bg-primary/10 text-[10px] font-extrabold text-primary">
                {user.avatar ? <img src={user.avatar} alt={t("admin.adminAvatar")} className="h-full w-full object-cover" referrerPolicy="no-referrer" /> : initials}
              </div>
            </div>
          </header>
          <main className="min-w-0 overflow-x-hidden p-4 sm:p-6 lg:p-8"><Outlet /></main>
        </div>
      </div>
    </NotificationProvider>
  );
}
