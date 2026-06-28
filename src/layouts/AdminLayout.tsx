import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import NotificationBell from "@/components/layout/NotificationBell";

const ADMIN_NAV_ITEMS = [
  { label: "Dashboard", icon: "dashboard", path: "/admin/dashboard" },
  { label: "Users", icon: "group", path: "/admin/users" },
  { label: "Projects", icon: "folder_managed", path: "/admin/projects" },
  { label: "Settings", icon: "settings", path: "/admin/settings" },
];

function isActive(pathname: string, path: string) {
  return pathname === path;
}

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const initials = (user.fullName || "A").substring(0, 2).toUpperCase();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-surface-container-lowest text-on-surface lg:flex">
      <aside className="w-full lg:w-72 lg:h-screen lg:sticky lg:top-0 bg-surface border-r border-outline-variant flex flex-col">
        <div className="h-16 px-lg border-b border-outline-variant flex items-center gap-sm">
          <div className="w-10 h-10 rounded-lg bg-primary text-on-primary flex items-center justify-center font-bold">
            A
          </div>
          <div className="min-w-0">
            <p className="font-headline-sm text-headline-sm text-on-surface truncate">PFE Backoffice</p>
            <p className="font-body-sm text-body-sm text-on-surface-variant truncate">Admin Panel</p>
          </div>
        </div>

        <nav className="p-md flex lg:flex-col gap-xs overflow-x-auto lg:overflow-visible">
          {ADMIN_NAV_ITEMS.map((item) => {
            const active = isActive(location.pathname, item.path);
            return (
              <Link
                key={item.label}
                to={item.path}
                className={`flex items-center gap-sm px-md py-sm rounded-lg font-label-md text-label-md whitespace-nowrap transition-colors ${
                  active
                    ? "bg-primary-container text-primary"
                    : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto p-md border-t border-outline-variant hidden lg:flex flex-col gap-md">
          <div className="rounded-lg bg-surface-container-low border border-outline-variant p-md">
            <p className="font-label-md text-label-md text-on-surface truncate">{user.fullName || "Admin"}</p>
            <p className="font-body-sm text-body-sm text-on-surface-variant truncate">{user.email}</p>
            <span className="inline-flex mt-sm px-sm py-base rounded-full bg-primary-container text-primary font-label-sm text-label-sm">
              admin
            </span>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full px-md py-sm rounded-DEFAULT border border-outline-variant bg-surface text-on-surface font-label-md text-label-md hover:bg-surface-container transition-colors flex items-center justify-center gap-xs"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
            Log Out
          </button>
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-16 bg-surface border-b border-outline-variant px-lg flex items-center justify-between sticky top-0 z-30">
          <div>
            <p className="font-label-md text-label-md text-primary uppercase tracking-wider">Admin</p>
            <p className="font-body-md text-body-md text-on-surface-variant">Backoffice management</p>
          </div>
          <div className="flex items-center gap-sm">
            <NotificationBell label="Live system updates" />
            <Link
              to="/admin/settings"
              className="w-9 h-9 rounded-lg border border-outline-variant bg-surface flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors"
              title="Admin settings"
            >
              <span className="material-symbols-outlined text-[20px]">settings</span>
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="hidden sm:flex px-md py-sm rounded-DEFAULT border border-outline-variant bg-surface text-on-surface font-label-md text-label-md hover:bg-surface-container transition-colors"
            >
              Log Out
            </button>
            <div className="w-9 h-9 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-sm overflow-hidden">
              {user.avatar ? (
                <img src={user.avatar} alt="Admin avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                initials
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 min-w-0 px-lg py-xl">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
