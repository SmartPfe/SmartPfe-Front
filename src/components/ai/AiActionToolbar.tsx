import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import HugeiconsIcon from "@/components/ui/HugeiconsIcon";

export interface AiActionToolbarProps {
  onGenerate: () => void | Promise<void>;
  onRefine: (instructions?: string) => void | Promise<void>;
  onTranslate?: () => void | Promise<void>;
  isGenerating?: boolean;
  isRefining?: boolean;
  isTranslating?: boolean;
  isBusy?: boolean;
  canGenerate?: boolean;
  canRefine?: boolean;
  generateDisabledTitle?: string;
  refineDisabledTitle?: string;
  generateLabel?: string;
  refineLabel?: string;
  refinePlaceholder?: string;
  showTranslate?: boolean;
  translateLabel?: string;
  primaryAction?: React.ReactNode;
  className?: string;
}

export const aiButtonClass =
  "inline-flex items-center justify-center gap-2 h-9 px-3.5 rounded-lg border border-primary/25 bg-gradient-to-r from-primary/10 via-primary/5 to-secondary/10 text-primary text-[13px] font-medium tracking-tight hover:from-primary/15 hover:to-secondary/15 hover:border-primary/40 transition-all duration-150 shadow-2xs active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:grayscale select-none cursor-pointer";

export const translateButtonClass =
  "inline-flex items-center justify-center gap-2 h-9 px-3.5 rounded-lg border border-secondary/30 bg-secondary/10 text-secondary text-[13px] font-medium tracking-tight hover:bg-secondary/15 hover:border-secondary/50 transition-all duration-150 shadow-2xs active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:grayscale select-none cursor-pointer";

export const primaryActionClass =
  "w-full sm:w-auto inline-flex items-center justify-center gap-1.5 h-9 px-4 bg-primary text-on-primary rounded-lg text-[13px] font-semibold tracking-tight hover:bg-primary/90 transition-all duration-150 shadow-2xs active:scale-[0.98] disabled:opacity-50 select-none cursor-pointer";

/**
 * Reusable AI Action Toolbar Component
 * Encapsulates Generate with AI, Refine with AI (with Popover), Translate with AI, and optional primary action.
 */
export default function AiActionToolbar({
  onGenerate,
  onRefine,
  onTranslate,
  isGenerating = false,
  isRefining = false,
  isTranslating = false,
  isBusy = false,
  canGenerate = true,
  canRefine = true,
  generateDisabledTitle,
  refineDisabledTitle,
  generateLabel = "Generate with AI",
  refineLabel = "Refine with AI",
  refinePlaceholder = "Tell AI what you'd like to improve (optional)...",
  showTranslate = false,
  translateLabel = "Translate",
  primaryAction,
  className,
}: AiActionToolbarProps) {
  const [refineOpen, setRefineOpen] = useState(false);
  const [refineInstructions, setRefineInstructions] = useState("");
  const refinePopoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (refinePopoverRef.current && !refinePopoverRef.current.contains(event.target as Node)) {
        setRefineOpen(false);
      }
    };

    if (refineOpen) {
      document.addEventListener("mousedown", handlePointerDown);
    }

    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [refineOpen]);

  useEffect(() => {
    if (isBusy || !canRefine) {
      setRefineOpen(false);
    }
  }, [isBusy, canRefine]);

  const handleRefineSubmit = async () => {
    await onRefine(refineInstructions);
    setRefineInstructions("");
    setRefineOpen(false);
  };

  const isAnyBusy = isBusy || isGenerating || isRefining || isTranslating;

  return (
    <div
      className={cn(
        "relative z-10 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-container-lowest border border-outline-variant/80 rounded-xl p-2 sm:p-2.5 shadow-2xs",
        className
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <style>{`
          @keyframes ai-toolbar-popover-in {
            from { opacity: 0; transform: translateY(-4px) scale(0.98); }
            to { opacity: 1; transform: translateY(0) scale(1); }
          }
        `}</style>

        {/* 1. Generate with AI */}
        <button
          type="button"
          onClick={onGenerate}
          disabled={isAnyBusy || !canGenerate}
          title={!canGenerate ? generateDisabledTitle : undefined}
          className={aiButtonClass}
        >
          {isGenerating ? (
            <>
              <span className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span>Generating...</span>
            </>
          ) : (
            <>
              <HugeiconsIcon icon="ai-beautify" size={17} strokeWidth={1.65} />
              <span>{generateLabel}</span>
            </>
          )}
        </button>

        {/* 2. Refine with AI (Popover) */}
        <div className="relative" ref={refinePopoverRef}>
          <button
            type="button"
            onClick={() => setRefineOpen((prev) => !prev)}
            disabled={isAnyBusy || !canRefine}
            title={!canRefine ? refineDisabledTitle : undefined}
            className={aiButtonClass}
          >
            {isRefining ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span>Refining...</span>
              </>
            ) : (
              <>
                <HugeiconsIcon icon="ai-refine" size={17} strokeWidth={1.65} />
                <span>{refineLabel}</span>
              </>
            )}
          </button>

          {refineOpen && (
            <div
              className="absolute left-0 top-full z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] rounded-xl border border-outline-variant/90 bg-surface p-3.5 shadow-2xl"
              style={{ animation: "ai-toolbar-popover-in 150ms ease-out" }}
            >
              <div className="flex items-center gap-1.5 mb-2 text-xs font-semibold text-on-surface">
                <HugeiconsIcon icon="edit" size={14} strokeWidth={1.8} className="text-primary" />
                <span>Refine Instructions</span>
              </div>
              <textarea
                value={refineInstructions}
                onChange={(event) => setRefineInstructions(event.target.value)}
                placeholder={refinePlaceholder}
                rows={4}
                className="w-full resize-none rounded-lg border border-outline-variant/80 bg-surface px-3 py-2 text-sm text-on-surface outline-none transition-colors placeholder:text-on-surface-variant/60 focus:border-primary focus:ring-2 focus:ring-primary/15"
                autoFocus
              />
              <div className="mt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setRefineInstructions("");
                    setRefineOpen(false);
                  }}
                  className="h-8 px-3 rounded-lg border border-outline-variant bg-surface text-xs font-semibold text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleRefineSubmit}
                  disabled={isRefining}
                  className="h-8 px-3.5 rounded-lg bg-primary text-xs font-semibold text-on-primary hover:bg-primary/90 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isRefining ? "Refining..." : "Refine"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 3. Translate with AI */}
        {showTranslate && onTranslate && (
          <button
            type="button"
            onClick={onTranslate}
            disabled={isAnyBusy}
            className={translateButtonClass}
          >
            {isTranslating ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-secondary border-t-transparent rounded-full animate-spin" />
                <span>Translating...</span>
              </>
            ) : (
              <>
                <HugeiconsIcon icon="ai-translate" size={17} strokeWidth={1.65} />
                <span>{translateLabel}</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* 4. Right Side Primary Action */}
      {primaryAction && <div>{primaryAction}</div>}
    </div>
  );
}
