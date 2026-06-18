import { Link, Outlet } from "react-router-dom";

export default function OnboardingLayout() {
  return (
    <div className="min-h-screen flex flex-col p-md bg-surface-container-lowest text-on-surface font-body-md">
      <header className="fixed top-0 left-0 w-full flex items-center justify-between px-lg h-16 border-b border-outline-variant bg-surface-container-lowest z-50">
        <div className="flex items-center gap-xs">
          <span className="material-symbols-outlined text-primary text-[24px]">school</span>
          <span className="font-headline-sm text-headline-sm font-bold text-primary">PFE Guidance Platform</span>
        </div>
        <div className="font-label-md text-label-md text-on-surface-variant flex flex-row items-center gap-2">
            <Link to="/workspace/overview" className="flex items-center gap-xs hover:text-primary transition-colors">
              <span className="material-symbols-outlined text-[18px]">close</span>
              <span>Exit Setup</span>
            </Link>
        </div>
      </header>
      <main className="flex-1 overflow-y-auto mt-16 w-full flex items-center justify-center p-margin">
        <Outlet />
      </main>
    </div>
  );
}
