import React from "react";
import { cn } from "@/lib/utils";
import HugeiconsIcon from "@/components/ui/HugeiconsIcon";

interface AiBackgroundBannerProps {
  isVisible: boolean;
  moduleName: string;
  action?: "generating" | "refining" | "translating" | "acting" | string;
  customMessage?: string;
  onCancel?: () => void;
  className?: string;
}

export default function AiBackgroundBanner({
  isVisible,
  moduleName,
  action = "generating",
  customMessage,
  onCancel,
  className,
}: AiBackgroundBannerProps) {
  if (!isVisible) return null;

  const defaultActionText =
    action === "generating"
      ? `Generating ${moduleName}`
      : action === "refining"
      ? `Refining ${moduleName}`
      : action === "translating"
      ? `Translating ${moduleName}`
      : `Processing ${moduleName}`;

  const message = customMessage || defaultActionText;

  return (
    <div
      className={cn(
        "relative rounded-xl border border-primary/20 bg-surface-container-lowest/90 backdrop-blur-md p-3.5 sm:p-4 mb-6 overflow-hidden shadow-sm transition-all duration-300 ease-out animate-in fade-in-50 slide-in-from-top-2",
        className
      )}
      role="status"
      aria-live="polite"
    >
      <style>{`
        @keyframes ai-banner-shimmer {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(100%); }
          100% { transform: translateX(250%); }
        }
      `}</style>

      {/* Top glowing progress bar */}
      <div className="absolute top-0 inset-x-0 h-1 bg-primary/10 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-primary/60 via-primary to-secondary rounded-full"
          style={{
            width: "45%",
            animation: "ai-banner-shimmer 1.5s cubic-bezier(0.4, 0, 0.2, 1) infinite",
          }}
        />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-0.5">
        {/* Left: Spinner, Action Title & Friendly Explanation */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <span className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-on-surface tracking-tight">
                {message}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-[10px] font-semibold text-primary">
                <HugeiconsIcon icon="flash" size={13} strokeWidth={2} />
                Background task
              </span>
            </div>
            <p className="text-[11px] text-on-surface-variant font-normal mt-0.5 flex items-center gap-1.5">
              <HugeiconsIcon icon="information-circle" size={14} strokeWidth={1.5} className="text-primary/80 shrink-0" />
              Feel free to explore other pages — your progress won't be lost.
            </p>
          </div>
        </div>

        {/* Right: Stop/Cancel Button (if provided) */}
        {onCancel && (
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            <button
              type="button"
              onClick={onCancel}
              className="h-7 px-2.5 rounded-lg text-on-surface-variant hover:text-error hover:bg-error-container/30 transition-colors flex items-center gap-1 text-[11px] font-semibold cursor-pointer border border-outline-variant/60"
              title="Stop and cancel this generation"
            >
              <HugeiconsIcon icon="cancel-circle" size={14} strokeWidth={1.75} />
              <span>Stop</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
