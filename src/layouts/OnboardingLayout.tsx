import { Link, Outlet } from "react-router-dom";
import { OnboardingProvider } from "@/context/OnboardingContext";

export default function OnboardingLayout() {
  return (
    <OnboardingProvider>
      <div className="min-h-dvh flex flex-col p-sm sm:p-md bg-surface-container-lowest text-on-surface font-body-md overflow-x-hidden">
        <header className="fixed top-0 left-0 w-full flex items-center justify-between gap-sm px-md sm:px-lg min-h-16 py-2 border-b border-outline-variant bg-surface-container-lowest z-50">
          <div className="flex items-center gap-xs min-w-0">
            <span className="material-symbols-outlined text-primary text-[24px]">school</span>
            <span className="font-headline-sm text-headline-sm font-bold text-primary truncate">PFE Guidance Platform</span>
          </div>
          <div className="font-label-md text-label-md text-on-surface-variant flex flex-row items-center gap-2 shrink-0">
            <Link to="/workspace/overview" className="flex items-center gap-xs hover:text-primary transition-colors">
              <span className="material-symbols-outlined text-[18px]">close</span>
              <span className="hidden sm:inline">Exit Setup</span>
            </Link>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto overflow-x-hidden mt-16 w-full flex items-start justify-center px-sm sm:px-md py-md sm:py-lg">
          <Outlet />
        </main>
      </div>
    </OnboardingProvider>
  );
}
