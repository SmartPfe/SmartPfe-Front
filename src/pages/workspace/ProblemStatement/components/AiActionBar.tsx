import { useEffect, useRef, useState } from "react";
import HugeiconsIcon from "@/components/ui/HugeiconsIcon";

interface AiActionBarProps {
  onGenerate: () => void;
  onRefine: (instructions?: string) => void | Promise<void>;
  onTranslate?: () => void | Promise<void>;
  activeAction: "generating" | "refining" | "translating" | null;
  editorIsEmpty: boolean;
  disabled?: boolean;
  showTranslate?: boolean;
  translateLabel?: string;
}

export default function AiActionBar({
  onGenerate,
  onRefine,
  onTranslate,
  activeAction,
  editorIsEmpty,
  disabled = false,
  showTranslate = false,
  translateLabel = "Translate",
}: AiActionBarProps) {
  const [refineOpen, setRefineOpen] = useState(false);
  const [instructions, setInstructions] = useState("");
  const popoverRef = useRef<HTMLDivElement>(null);
  const loading = activeAction !== null;
  const isGenerating = activeAction === "generating";
  const isRefining = activeAction === "refining";
  const isTranslating = activeAction === "translating";

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setRefineOpen(false);
      }
    };

    if (refineOpen) {
      document.addEventListener("mousedown", handlePointerDown);
    }

    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [refineOpen]);

  useEffect(() => {
    if (disabled || editorIsEmpty) {
      setRefineOpen(false);
    }
  }, [disabled, editorIsEmpty]);

  const handleRefineSubmit = async () => {
    await onRefine(instructions);
    setInstructions("");
    setRefineOpen(false);
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <style>{`
        @keyframes problem-statement-popover-in {
          from { opacity: 0; transform: translateY(-4px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
      <button
        onClick={onGenerate}
        disabled={loading || disabled || !editorIsEmpty}
        title={!editorIsEmpty ? "Editor already has content — use Refine instead" : "Generate a full first draft with AI"}
        className="px-5 py-2 rounded-md border border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5 text-primary text-label-md font-semibold
                   hover:from-primary/10 hover:to-secondary/10 transition-all shadow-sm
                   disabled:opacity-40 disabled:cursor-not-allowed disabled:grayscale"
      >
        {isGenerating ? (
          <span className="inline-flex items-center gap-2">
            <span className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            Generating...
          </span>
        ) : (
          "Generate with AI"
        )}
      </button>

      <div className="relative" ref={popoverRef}>
        <button
          onClick={() => setRefineOpen(true)}
          disabled={loading || disabled || editorIsEmpty}
          title={editorIsEmpty ? "Write something first, then ask AI to refine it" : "Improve and expand your current text with AI"}
          className="px-5 py-2 rounded-md border border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5 text-primary text-label-md font-semibold
                     hover:from-primary/10 hover:to-secondary/10 transition-all shadow-sm
                     disabled:opacity-40 disabled:cursor-not-allowed disabled:grayscale"
        >
          {isRefining ? (
            <span className="inline-flex items-center gap-2">
              <span className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              Refining...
            </span>
          ) : (
            "Refine with AI"
          )}
        </button>

        {refineOpen && (
          <div
            className="absolute left-0 top-full z-30 mt-2 w-[min(22rem,calc(100vw-2rem))] rounded-md border border-outline-variant bg-surface-bright p-3 shadow-xl"
            style={{ animation: "problem-statement-popover-in 150ms ease-out" }}
          >
            <textarea
              value={instructions}
              onChange={(event) => setInstructions(event.target.value)}
              placeholder="Tell AI what you'd like to improve (optional)..."
              rows={4}
              className="w-full resize-none rounded-md border border-outline-variant bg-surface px-3 py-2 text-body-md text-on-surface outline-none transition-colors placeholder:text-on-surface-variant focus:border-primary focus:ring-1 focus:ring-primary"
              autoFocus
            />
            <div className="mt-3 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setInstructions("");
                  setRefineOpen(false);
                }}
                className="px-3 py-1.5 rounded-md border border-outline-variant bg-surface text-label-sm font-medium text-on-surface hover:bg-surface-container transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRefineSubmit}
                disabled={isRefining}
                className="px-3 py-1.5 rounded-md bg-primary text-label-sm font-semibold text-on-primary hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {isRefining ? "Refining..." : "Refine"}
              </button>
            </div>
          </div>
        )}
      </div>

      {showTranslate && onTranslate && (
        <button
          onClick={onTranslate}
          disabled={loading || disabled}
          className="px-5 py-2 rounded-md border border-secondary/30 bg-secondary-container/60 text-secondary text-label-md font-semibold
                     hover:bg-secondary-container transition-all shadow-sm
                     disabled:opacity-40 disabled:cursor-not-allowed disabled:grayscale"
        >
          {isTranslating ? (
            <span className="inline-flex items-center gap-2">
              <span className="w-3.5 h-3.5 border-2 border-secondary border-t-transparent rounded-full animate-spin" />
              Translating...
            </span>
          ) : (
            <span className="inline-flex items-center gap-2">
              <HugeiconsIcon icon="globe-02" size={16} strokeWidth={1.75} />
              {translateLabel}
            </span>
          )}
        </button>
      )}
    </div>
  );
}
