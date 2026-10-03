import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";

export default function CreditDialog({ children, titleId, onClose, busy = false }: {
  children: ReactNode; titleId: string; onClose: () => void; busy?: boolean;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busy) closeRef.current();
      if (event.key !== "Tab") return;
      const targets = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]') || []);
      const first = targets[0]; const last = targets[targets.length - 1];
      if (!first) { event.preventDefault(); return; }
      if (event.shiftKey && (document.activeElement === first || document.activeElement === dialogRef.current)) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || document.activeElement === dialogRef.current)) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = overflow;
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, [busy]);
  return createPortal(
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-5">
      <div className="absolute inset-0 bg-black/45 backdrop-blur-md" onClick={() => !busy && onClose()} />
      <div ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby={titleId}
        className="relative flex max-h-[calc(100dvh-2rem)] w-full max-w-xl flex-col overflow-hidden rounded-3xl border border-outline-variant bg-surface shadow-2xl outline-none">
        {children}
      </div>
    </div>, document.body
  );
}
