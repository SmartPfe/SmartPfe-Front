import React from "react";
import { cn } from "@/lib/utils";

interface InfoTooltipProps {
  label: string;
  tooltip: string;
}

export default function InfoTooltip({ label, tooltip }: InfoTooltipProps) {
  return (
    <div className="relative group/tooltip inline-flex items-center ml-3 cursor-help align-middle">
      <div className="flex items-center justify-center w-[30px] h-[30px] rounded-lg border-2 border-primary text-primary hover:bg-primary hover:text-white transition-colors shadow-sm">
        <span className="font-bold text-[18px]">!</span>
      </div>
      <div className="absolute left-full top-1/2 -translate-y-1/2 ml-4 w-64 bg-inverse-surface text-inverse-on-surface text-sm rounded-lg shadow-xl opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all duration-200 p-4 pointer-events-none z-50">
        <div className="absolute top-1/2 -left-2 -translate-y-1/2 border-[8px] border-transparent border-r-inverse-surface"></div>
        <span className="block font-bold text-primary mb-1 text-sm">{label}</span>
        <span className="font-medium text-[12px] leading-relaxed text-inverse-on-surface/90">{tooltip}</span>
      </div>
    </div>
  );
}
