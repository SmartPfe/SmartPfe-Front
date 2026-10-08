import HugeiconsIcon from "@/components/ui/HugeiconsIcon";
import { useEffect, useId, useRef, useState } from "react";

interface InfoTooltipProps {
  label: string;
  tooltip: string;
}

export default function InfoTooltip({ label, tooltip }: InfoTooltipProps) {
  const id = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ left: 16, top: 16, width: 256, maxHeight: 320 });
  useEffect(() => {
    const close = (event: Event) => {
      if (event.type === "scroll" && event.target === panel.current) return;
      setOpen(false);
    };
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, []);
  const positionTooltip = () => {
    const anchor = trigger.current?.getBoundingClientRect();
    if (!anchor) return;
    const width = Math.min(256, window.innerWidth - 32);
    const height = panel.current?.getBoundingClientRect().height || 160;
    const top = anchor.bottom + height + 16 <= window.innerHeight ? anchor.bottom + 8 : Math.max(16, anchor.top - height - 8);
    setPosition({
      width,
      left: Math.max(16, Math.min(anchor.left, window.innerWidth - width - 16)),
      top,
      maxHeight: Math.max(0, window.innerHeight - top - 16),
    });
    setOpen(true);
  };
  return (
    <div className="relative inline-flex items-center ml-2.5 cursor-help align-middle" onMouseLeave={() => setOpen(false)}>
      <button type="button" ref={trigger} aria-label={label} aria-describedby={id} onMouseEnter={positionTooltip} onFocus={positionTooltip} onBlur={() => setOpen(false)} onKeyDown={event => { if (event.key === "Escape") setOpen(false); }}
        className="flex items-center justify-center w-7 h-7 rounded-lg border border-primary/30 bg-primary/5 text-primary hover:bg-primary hover:text-on-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary transition-all duration-200 shadow-2xs">
        <HugeiconsIcon icon="information-circle" size={16} strokeWidth={1.8} />
      </button>
      <div ref={panel} id={id} role="tooltip" style={position} className={`fixed overflow-y-auto bg-inverse-surface text-inverse-on-surface text-sm rounded-lg shadow-xl ${open ? "opacity-100 visible" : "opacity-0 invisible"} transition-opacity duration-200 p-4 z-50`}>
        <span className="block font-bold text-primary mb-1 text-sm">{label}</span>
        <span className="font-medium text-[12px] leading-relaxed text-inverse-on-surface/90">{tooltip}</span>
      </div>
    </div>
  );
}
