import { useMemo } from "react";
import * as Diff from "diff";

interface AiSuggestionPanelProps {
  currentText: string;
  suggestedText: string;
  onAccept: () => void;
  onDiscard: () => void;
}

const stripHtml = (html: string): string => {
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || "";
};

export default function AiSuggestionPanel({
  currentText,
  suggestedText,
  onAccept,
  onDiscard,
}: AiSuggestionPanelProps) {
  const cleanCurrent   = useMemo(() => stripHtml(currentText),   [currentText]);
  const cleanSuggested = useMemo(() => stripHtml(suggestedText), [suggestedText]);

  const diffs = useMemo(
    () => Diff.diffWordsWithSpace(cleanCurrent, cleanSuggested),
    [cleanCurrent, cleanSuggested]
  );

  return (
    <div className="mt-6 border border-outline-variant rounded-xl overflow-hidden bg-surface-bright shadow-sm">
      {/* Header */}
      <div className="px-4 py-3 border-b border-outline-variant bg-surface-container flex items-center justify-between">
        <h3 className="text-label-md font-semibold text-on-surface">Suggested revision</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={onDiscard}
            className="px-4 py-1.5 rounded-md border border-outline-variant text-on-surface text-label-md font-medium hover:bg-surface-container-high transition-colors"
          >
            Discard
          </button>
          <button
            onClick={onAccept}
            className="px-4 py-1.5 rounded-md bg-primary text-on-primary text-label-md font-medium hover:opacity-90 transition-opacity"
          >
            Accept
          </button>
        </div>
      </div>

      {/* Side-by-side diff */}
      <div className="grid grid-cols-2 divide-x divide-outline-variant max-h-[420px] overflow-y-auto">
        {/* Current */}
        <div className="p-5 bg-surface-container-lowest">
          <p className="text-label-sm text-on-surface-variant uppercase tracking-wider mb-3">Current</p>
          <div className="text-body-md text-on-surface whitespace-pre-wrap opacity-75 leading-relaxed">
            {cleanCurrent || <span className="italic text-on-surface-variant">Empty</span>}
          </div>
        </div>

        {/* Suggested with diff highlights */}
        <div className="p-5 bg-secondary/5">
          <p className="text-label-sm text-secondary uppercase tracking-wider mb-3">Suggested</p>
          <div className="text-body-md text-on-surface whitespace-pre-wrap leading-relaxed">
            {diffs.map((part, i) => {
              if (part.added) {
                return (
                  <span key={i} className="bg-secondary/20 text-on-surface rounded px-0.5">
                    {part.value}
                  </span>
                );
              }
              if (part.removed) {
                return (
                  <span key={i} className="line-through text-error/50 bg-error/10 px-0.5 rounded">
                    {part.value}
                  </span>
                );
              }
              return <span key={i}>{part.value}</span>;
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
