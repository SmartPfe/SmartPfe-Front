import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface OnboardingStepProps {
  step: number;
  title: string;
  description: string;
  children: ReactNode;
  backTo?: string;
  backLabel?: string;
  nextTo?: string;
  nextLabel: string;
  nextIcon?: string;
  isNextDisabled?: boolean;
  onNextAction?: () => void;
}

export default function OnboardingStep({
  step,
  title,
  description,
  children,
  backTo,
  backLabel,
  nextTo,
  nextLabel,
  nextIcon = "arrow_forward",
  isNextDisabled = false,
  onNextAction,
}: OnboardingStepProps) {
  const { t } = useTranslation("onboarding");
  const progressWidth = `${(step / 4) * 100}%`;

  return (
    <div className="w-full max-w-3xl flex flex-col gap-6 mx-auto py-2 font-sans">
      {/* Step Progress Bar */}
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center text-xs font-semibold text-on-surface-variant">
          <span>{t("steps.progress", { step })}</span>
          <span className="text-primary font-bold">{title}</span>
        </div>
        <div className="w-full h-1.5 bg-surface-container-high rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500 ease-in-out"
            style={{ width: progressWidth }}
          />
        </div>
      </div>

      {/* Main Content Card */}
      <section className="bg-surface-container-lowest border border-outline-variant/80 rounded-2xl p-6 sm:p-8 flex flex-col gap-6 shadow-2xs">
        <header className="flex flex-col md:flex-row md:items-start md:justify-between gap-2 md:gap-6 pb-5 border-b border-outline-variant/40 min-w-0">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-on-surface">{title}</h1>
            <p className="mt-1 text-xs sm:text-sm text-on-surface-variant leading-relaxed max-w-xl">{description}</p>
          </div>
        </header>

        <div className="flex flex-col gap-5">{children}</div>
      </section>

      {/* Bottom Step Navigation Footer */}
      <footer className={cn("flex flex-col sm:flex-row sm:items-center gap-3", backTo ? "sm:justify-between" : "sm:justify-end")}>
        {backTo && (
          <Link
            to={backTo}
            className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl border border-outline-variant/80 bg-surface hover:bg-surface-container text-on-surface text-xs font-semibold transition-all shadow-2xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            <span>{backLabel || t("steps.back")}</span>
          </Link>
        )}
        {onNextAction ? (
          <button
            type="button"
            disabled={isNextDisabled}
            onClick={onNextAction}
            className={cn(
              "inline-flex items-center justify-center gap-2 h-10 px-5 rounded-xl bg-primary text-on-primary text-xs font-bold shadow-2xs transition-all cursor-pointer",
              isNextDisabled
                ? "opacity-50 cursor-not-allowed"
                : "hover:bg-primary/90 active:scale-98"
            )}
          >
            <span>{nextLabel}</span>
            <span className="material-symbols-outlined text-[18px]">{nextIcon}</span>
          </button>
        ) : (
          <Link
            to={isNextDisabled ? "#" : (nextTo || "#")}
            aria-disabled={isNextDisabled}
            onClick={(event) => {
              if (isNextDisabled) event.preventDefault();
            }}
            className={cn(
              "inline-flex items-center justify-center gap-2 h-10 px-5 rounded-xl bg-primary text-on-primary text-xs font-bold shadow-2xs transition-all cursor-pointer",
              isNextDisabled
                ? "opacity-50 cursor-not-allowed"
                : "hover:bg-primary/90 active:scale-98"
            )}
          >
            <span>{nextLabel}</span>
            <span className="material-symbols-outlined text-[18px]">{nextIcon}</span>
          </Link>
        )}
      </footer>
    </div>
  );
}
