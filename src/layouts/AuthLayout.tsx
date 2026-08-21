import { Outlet, Link } from "react-router-dom";
import HugeiconsIcon from "@/components/ui/HugeiconsIcon";

export default function AuthLayout() {
  return (
    <div className="relative min-h-screen w-full bg-surface text-on-surface antialiased flex flex-col justify-between items-center px-4 py-6 sm:px-6 sm:py-8 overflow-x-hidden selection:bg-primary/20 selection:text-primary">
      {/* Ambient background soft glow */}
      <div 
        aria-hidden="true" 
        className="pointer-events-none absolute inset-0 overflow-hidden flex justify-center -z-10 opacity-70 dark:opacity-30"
      >
        <div className="w-[600px] h-[350px] bg-primary/10 blur-[120px] rounded-full translate-y-[-20%]" />
      </div>

      {/* Top minimal Brand Header */}
      <header className="w-full max-w-[420px] flex items-center justify-between pt-1 pb-4">
        <Link 
          to="/" 
          className="inline-flex items-center gap-2.5 group transition-transform active:scale-[0.98]"
        >
          <div className="w-8 h-8 rounded-xl bg-primary text-on-primary flex items-center justify-center shadow-xs group-hover:bg-primary/90 transition-colors">
            <HugeiconsIcon icon="mortarboard-02" size={18} strokeWidth={2} />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold tracking-tight text-on-surface">SmartPFE</span>
          </div>
        </Link>

        <Link
          to="/"
          className="text-xs font-semibold text-on-surface-variant hover:text-on-surface transition-colors flex items-center gap-1"
        >
          <span>Back to home</span>
        </Link>
      </header>

      {/* Main Form Content */}
      <main className="w-full max-w-[420px] my-auto py-4">
        <Outlet />
      </main>

      {/* Minimal Footer */}
      <footer className="w-full max-w-[420px] pt-4 pb-1 text-center text-xs text-on-surface-variant/70">
        <p>© {new Date().getFullYear()} SmartPFE · Academic Intelligence Platform</p>
      </footer>
    </div>
  );
}
