import { Link } from "react-router-dom";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface OnboardingStepProps {
  step: number;
  title: string;
  description: string;
  children: ReactNode;
  backTo?: string;
  backLabel?: string;
  nextTo: string;
  nextLabel: string;
  nextIcon?: string;
  isNextDisabled?: boolean;
}

export default function OnboardingStep({
  step,
  title,
  description,
  children,
  backTo,
  backLabel = "Back",
  nextTo,
  nextLabel,
  nextIcon = "arrow_forward",
  isNextDisabled = false,
}: OnboardingStepProps) {
  const progressWidth = `${(step / 4) * 100}%`;

  return (
    <div className="w-full max-w-[960px] flex flex-col gap-lg mx-auto">
      <div className="flex flex-col gap-xs">
        <div className="flex justify-between items-center font-label-md text-label-md text-on-surface-variant">
          <span>Step {step} of 4</span>
          <span className="text-primary font-semibold">{title}</span>
        </div>
        <div className="w-full h-1 bg-surface-container-high rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500 ease-in-out"
            style={{ width: progressWidth }}
          />
        </div>
      </div>

      <section className="bg-surface-container-lowest border border-outline-variant rounded-lg p-md sm:p-lg flex flex-col gap-md shadow-sm">
        <header className="flex flex-col md:flex-row md:items-start md:justify-between gap-xs md:gap-lg pb-md border-b border-outline-variant">
          <h1 className="font-headline-md text-headline-md text-on-surface shrink-0">{title}</h1>
          <p className="font-body-md text-body-md text-on-surface-variant md:max-w-[560px]">{description}</p>
        </header>

        <div className="flex flex-col gap-md">{children}</div>
      </section>

      <footer className={cn("flex items-center gap-md", backTo ? "justify-between" : "justify-end")}>
        {backTo && (
          <Link
            to={backTo}
            className="flex items-center justify-center gap-xs min-w-[120px] px-lg py-sm rounded-DEFAULT border border-outline-variant bg-surface text-on-surface font-label-md text-label-md hover:bg-surface-container transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            {backLabel}
          </Link>
        )}
        <Link
          to={isNextDisabled ? "#" : nextTo}
          aria-disabled={isNextDisabled}
          onClick={(event) => {
            if (isNextDisabled) event.preventDefault();
          }}
          className={cn(
            "flex items-center justify-center gap-xs min-w-[120px] px-lg py-sm rounded-DEFAULT border border-primary bg-primary text-on-primary font-label-md text-label-md transition-colors",
            isNextDisabled
              ? "opacity-50 cursor-not-allowed"
              : "hover:bg-on-surface-variant"
          )}
        >
          {nextLabel}
          <span className="material-symbols-outlined text-[18px]">{nextIcon}</span>
        </Link>
      </footer>
    </div>
  );
}
