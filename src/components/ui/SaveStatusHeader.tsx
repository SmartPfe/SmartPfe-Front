import React from "react";
import { cn } from "@/lib/utils";

export type SaveStatus = "saved" | "saving" | "unsaved";

export interface SaveStatusHeaderProps {
  status: SaveStatus;
  onSave: () => void | Promise<void>;
  isBusy?: boolean;
  className?: string;
  savedLabel?: string;
  savingLabel?: string;
  unsavedLabel?: string;
  saveButtonLabel?: string;
}

/**
 * Reusable Executive Save Action Header control
 * Displays dynamic autosave status badge + Save button with consistent styling.
 */
export default function SaveStatusHeader({
  status,
  onSave,
  isBusy = false,
  className,
  savedLabel = "All changes saved",
  savingLabel = "Autosaving...",
  unsavedLabel = "Unsaved changes",
  saveButtonLabel = "Save now",
}: SaveStatusHeaderProps) {
  const isSaving = status === "saving";
  const isSaved = status === "saved";
  const isUnsaved = status === "unsaved";

  return (
    <div className={cn("flex items-center gap-3 shrink-0 self-start sm:self-auto select-none", className)}>
      <span
        className={cn(
          "text-xs font-medium px-2.5 py-1 rounded-full border transition-all duration-150",
          isSaving && "bg-surface-container text-on-surface-variant border-outline-variant",
          isSaved && "bg-secondary/10 text-secondary border-secondary/20",
          isUnsaved && "bg-error/10 text-error border-error/20"
        )}
      >
        {isSaving ? savingLabel : isSaved ? savedLabel : unsavedLabel}
      </span>
      <button
        type="button"
        onClick={onSave}
        disabled={isSaving || isBusy}
        className="h-9 px-4 rounded-lg bg-primary text-on-primary text-[13px] font-semibold tracking-tight hover:bg-primary/90 transition-all duration-150 shadow-2xs active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
      >
        {saveButtonLabel}
      </button>
    </div>
  );
}
