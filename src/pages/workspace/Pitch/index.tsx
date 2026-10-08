import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { displayApiMessage } from "@/lib/apiMessage";
import InfoTooltip from "@/components/ui/InfoTooltip";
import {
  estimateSpeechSeconds,
  formatDuration,
  getLanguageLabel,
  normalizeLanguage,
  PitchSlide,
  PitchError,
  usePitch,
} from "./hooks/usePitch";
import AiBackgroundBanner from "@/components/ai/AiBackgroundBanner";
import HugeiconsIcon from "@/components/ui/HugeiconsIcon";
import SaveStatusHeader from "@/components/ui/SaveStatusHeader";
import AiActionToolbar from "@/components/ai/AiActionToolbar";
import CreditBadge from "@/components/credits/CreditBadge";

const escapeHtml = (value = "") =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const paragraphHtml = (value = "") =>
  escapeHtml(value)
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim().replace(/\n/g, "<br />"))
    .filter(Boolean)
    .map((paragraph) => `<p>${paragraph}</p>`)
    .join("");

export function getPitchExportCopy(language?: string | null) {
  const normalizedLanguage = normalizeLanguage(language);
  if (normalizedLanguage === "fr") {
    return {
      title: "Discours oral",
      slide: "Diapositive",
      estimatedDuration: "Durée estimée :",
      speech: "Discours",
      speakerTips: "Conseils de présentation orale",
      noSpeakerTips: "Aucun conseil de présentation pour le moment.",
      noSpeech: "Aucun discours pour le moment.",
      presentationDuration: "Durée de la présentation :",
      estimatedCurrentDuration: "Durée actuelle estimée :",
      minuteUnit: "min",
      secondUnit: "s",
    };
  }
  if (normalizedLanguage === "ar") {
    return {
      title: "خطاب العرض",
      slide: "الشريحة",
      estimatedDuration: "المدة المقدرة:",
      speech: "الخطاب",
      speakerTips: "نصائح الإلقاء",
      noSpeakerTips: "لا توجد نصائح للإلقاء بعد.",
      noSpeech: "لا يوجد خطاب بعد.",
      presentationDuration: "مدة العرض التقديمي:",
      estimatedCurrentDuration: "المدة الحالية المقدرة:",
      minuteUnit: "دقيقة",
      secondUnit: "ثانية",
    };
  }
  return {
    title: "Pitch Speech",
    slide: "Slide",
    estimatedDuration: "Estimated duration:",
    speech: "Speech",
    speakerTips: "Speaker Tips",
    noSpeakerTips: "No speaker tips yet.",
    noSpeech: "No speech yet.",
    presentationDuration: "Presentation Duration:",
    estimatedCurrentDuration: "Estimated Current Duration:",
    minuteUnit: "min",
    secondUnit: "sec",
  };
}

function formatPitchExportDuration(seconds: number, language?: string | null) {
  const copy = getPitchExportCopy(language);
  const safeSeconds = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;
  if (minutes === 0) return `${remainingSeconds} ${copy.secondUnit}`;
  return `${minutes} ${copy.minuteUnit} ${String(remainingSeconds).padStart(2, "0")} ${copy.secondUnit}`;
}

export default function PitchPage() {
  const { t } = useTranslation("delivery");
  const navigate = useNavigate();
  const {
    pitch,
    projectLanguage,
    loading,
    aiState,
    isAiBusy,
    error,
    updatePitch,
    generateWithAi,
    refineWithAi,
    generateSlideWithAi,
    refineSlideWithAi,
    translateSlideWithAi,
    cancelAi,
    dismissError,
  } = usePitch();
  const localizedProjectLanguage = getDeliveryLanguageLabel(projectLanguage, t);
  const displayError = resolveDeliveryError(error, t);

  const [selectedSlideId, setSelectedSlideId] = useState<string | null>(null);
  const [tipsOpen, setTipsOpen] = useState(true);

  const slides = pitch.slides;
  const selectedSlide = slides.find((slide) => slide.slideId === selectedSlideId) || slides[0];
  const selectedIndex = selectedSlide ? slides.findIndex((slide) => slide.slideId === selectedSlide.slideId) : -1;
  const hasPresentation = slides.length > 0;
  const hasPitch = slides.some((slide) => slide.speech.trim());
  const isAiIdle = !isAiBusy && aiState === "idle";
  const selectedSlideLanguage = normalizeLanguage(selectedSlide?.language);
  const selectedSlideHasSpeech = Boolean(selectedSlide?.speech.trim());
  const shouldShowTranslate = Boolean(
    selectedSlideHasSpeech &&
    projectLanguage &&
    (!selectedSlideLanguage || selectedSlideLanguage !== projectLanguage)
  );

  const getCurrentSeconds = (slide: PitchSlide) =>
    slide.speech.trim() ? estimateSpeechSeconds(slide.speech, slide.estimatedSeconds) : 0;

  const totalEstimatedSeconds = useMemo(
    () => slides.reduce((total, slide) => total + getCurrentSeconds(slide), 0),
    [slides]
  );

  useEffect(() => {
    if (!selectedSlideId && slides.length) {
      setSelectedSlideId(slides[0].slideId);
      return;
    }

    if (selectedSlideId && slides.length && !slides.some((slide) => slide.slideId === selectedSlideId)) {
      setSelectedSlideId(slides[Math.min(selectedIndex, slides.length - 1)]?.slideId || slides[0].slideId);
    }
  }, [selectedIndex, selectedSlideId, slides]);

  const updateSlide = (slideId: string, updates: Partial<PitchSlide>) => {
    updatePitch((current) => ({
      ...current,
      slides: current.slides.map((slide) => slide.slideId === slideId ? { ...slide, ...updates } : slide),
    }));
  };

  const updateTips = (slideId: string, value: string) => {
    updateSlide(slideId, {
      tips: value.split(/\r?\n/).map((tip) => tip.replace(/^\s*[-*•]\s*/, "").trim()).filter(Boolean),
    });
  };

  const exportPdf = () => {
    const projectExportCopy = getPitchExportCopy(projectLanguage);
    const sections = slides.map((slide, index) => {
      const slideExportCopy = getPitchExportCopy(normalizeLanguage(slide.language) || normalizeLanguage(projectLanguage));
      const tips = slide.tips.length
        ? `<ul>${slide.tips.map((tip) => `<li>${escapeHtml(tip)}</li>`).join("")}</ul>`
        : `<p>${slideExportCopy.noSpeakerTips}</p>`;

      return `
        <section class="slide">
          <p class="kicker">${slideExportCopy.slide} ${index + 1}</p>
          <h2>${escapeHtml(slide.title || `${slideExportCopy.slide} ${index + 1}`)}</h2>
          <p class="duration">${slideExportCopy.estimatedDuration} ${formatPitchExportDuration(getCurrentSeconds(slide), slide.language || projectLanguage)}</p>
          <h3>${slideExportCopy.speech}</h3>
          ${paragraphHtml(slide.speech) || `<p>${slideExportCopy.noSpeech}</p>`}
          <h3>${slideExportCopy.speakerTips}</h3>
          ${tips}
        </section>
      `;
    }).join("");

    const html = `
      <!doctype html>
      <html>
        <head>
          <title>${projectExportCopy.title}</title>
          <style>
            * { box-sizing: border-box; }
            body { margin: 0; color: #1f2937; font-family: Arial, sans-serif; line-height: 1.55; }
            main { max-width: 760px; margin: 0 auto; padding: 40px 32px; }
            header { border-bottom: 1px solid #d1d5db; margin-bottom: 28px; padding-bottom: 18px; }
            h1 { font-size: 26px; margin: 0 0 8px; }
            h2 { font-size: 21px; margin: 0 0 6px; }
            h3 { font-size: 13px; letter-spacing: .06em; margin: 22px 0 8px; text-transform: uppercase; }
            p { margin: 0 0 12px; }
            ul { margin: 0 0 12px 20px; padding: 0; }
            li { margin-bottom: 6px; }
            .meta, .duration, .kicker { color: #6b7280; font-size: 13px; }
            .kicker { font-weight: 700; letter-spacing: .08em; margin-bottom: 4px; text-transform: uppercase; }
            .slide { border-bottom: 1px solid #e5e7eb; padding: 26px 0; page-break-inside: avoid; }
            .slide + .slide { page-break-before: always; }
            @page { margin: 18mm; }
            @media print {
              main { padding: 0; }
              header { margin-bottom: 16px; }
            }
          </style>
        </head>
        <body>
          <main>
            <header>
              <h1>${projectExportCopy.title}</h1>
              <p class="meta">${projectExportCopy.presentationDuration} ${pitch.durationMinutes} ${projectExportCopy.minuteUnit}</p>
              <p class="meta">${projectExportCopy.estimatedCurrentDuration} ${formatPitchExportDuration(totalEstimatedSeconds, projectLanguage)}</p>
            </header>
            ${sections}
          </main>
        </body>
      </html>
    `;

    const printFrame = document.createElement("iframe");
    printFrame.title = t("pitch.printFrameTitle");
    printFrame.style.position = "fixed";
    printFrame.style.right = "0";
    printFrame.style.bottom = "0";
    printFrame.style.width = "0";
    printFrame.style.height = "0";
    printFrame.style.border = "0";
    printFrame.style.opacity = "0";
    document.body.appendChild(printFrame);

    const frameWindow = printFrame.contentWindow;
    const frameDocument = printFrame.contentDocument || frameWindow?.document;

    if (!frameWindow || !frameDocument) {
      printFrame.remove();
      return;
    }

    const cleanup = () => {
      window.setTimeout(() => {
        printFrame.remove();
      }, 500);
    };

    frameDocument.open();
    frameDocument.write(html);
    frameDocument.close();
    frameWindow.onafterprint = cleanup;

    window.setTimeout(() => {
      frameWindow.focus();
      frameWindow.print();
    }, 150);

    window.setTimeout(() => {
      if (document.body.contains(printFrame)) {
        printFrame.remove();
      }
    }, 30000);
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center">
        <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-sm font-medium text-on-surface-variant">{t("pitch.loading")}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-[1440px] flex-col h-full pb-32">
      {/* Header Section */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-primary">{t("pitch.eyebrow")}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-on-surface flex items-center">
            {t("pitch.title")}
            <InfoTooltip
              label={t("pitch.tooltipLabel")}
              tooltip={t("pitch.tooltip")}
            />
          </h1>
          <p className="text-sm text-on-surface-variant max-w-[48rem] mt-1.5 leading-relaxed">
            {t("pitch.description")}
          </p>
        </div>

        {/* Global SaveStatusHeader */}
        <SaveStatusHeader
          status="saved"
          onSave={() => {}}
          isBusy={isAiBusy}
        />
      </div>

      {/* Background AI Progress Banner */}
      <AiBackgroundBanner
        isVisible={isAiBusy}
        moduleName={t("pitch.moduleName")}
        action={aiState}
        onCancel={cancelAi}
      />

      {/* Speaking Duration Status Bar */}
      <div className="mb-6 rounded-2xl border border-outline-variant/80 bg-surface-container-lowest p-3.5 sm:p-4 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">{t("pitch.targetDuration")}</span>
              <span className="text-sm font-bold font-mono text-on-surface">{pitch.durationMinutes} {t("pitch.minutes")}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">{t("pitch.estimatedSpeech")}</span>
              <span className="text-sm font-bold font-mono text-primary">{formatDeliveryDuration(totalEstimatedSeconds, t)}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={exportPdf}
            disabled={!hasPitch}
            aria-label={t("pitch.exportSpeechPdf")}
            className="inline-flex items-center gap-2 h-8 px-3.5 rounded-lg border border-outline-variant/80 bg-surface text-xs font-bold text-on-surface hover:bg-surface-container transition-all shadow-2xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <HugeiconsIcon icon="book-open" size={15} strokeWidth={1.8} className="text-primary" />
            <span>{t("pitch.exportSpeechPdf")}</span>
          </button>
        </div>
      </div>

      {/* Global AI Action Toolbar */}
      <AiActionToolbar
        onGenerate={generateWithAi}
        onRefine={refineWithAi}
        onTranslate={() => selectedSlide && translateSlideWithAi(selectedSlide.slideId)}
        isGenerating={aiState === "generating"}
        isRefining={aiState === "refining"}
        isTranslating={aiState === "translating"}
        isBusy={isAiBusy}
        canRefine={hasPitch}
        refineDisabledTitle={t("pitch.refineDisabled")}
        refinePlaceholder={t("pitch.refinePlaceholder")}
        showTranslate={shouldShowTranslate}
        translateLabel={t("common.translateTo", { language: localizedProjectLanguage })}
        primaryAction={
          selectedSlide ? (
            <button
              type="button"
              onClick={() => generateSlideWithAi(selectedSlide.slideId)}
              disabled={isAiBusy}
              aria-label={t("pitch.regenerateSlide")}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 h-9 px-4 bg-primary text-on-primary rounded-lg text-[13px] font-semibold tracking-tight hover:bg-primary/90 transition-all duration-150 shadow-2xs active:scale-[0.98] disabled:opacity-50 select-none cursor-pointer"
            >
              <HugeiconsIcon icon="refresh" size={15} strokeWidth={2} />
              <span>{t("pitch.regenerateSlide")}</span>
              <CreditBadge actionKey="pitch_slide" className="border-white/25 bg-white/15 text-white" />
            </button>
          ) : undefined
        }
      />

      {displayError && (
        <div className="mb-6 p-3.5 rounded-xl bg-error-container text-on-error-container border border-error/20 flex items-center justify-between gap-3 shadow-2xs">
          <p className="text-sm font-medium">{displayError}</p>
          <button onClick={dismissError} className="shrink-0 text-xs font-semibold underline hover:no-underline">
            {t("common.dismiss")}
          </button>
        </div>
      )}

      {!hasPresentation ? (
        <section className="mx-auto flex min-h-[520px] max-w-xl flex-col items-center justify-center px-6 text-center rounded-2xl border border-outline-variant/80 bg-surface-container-lowest shadow-2xs">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20">
            <HugeiconsIcon icon="presentation" size={32} strokeWidth={1.8} />
          </div>
          <h2 className="mb-2 text-2xl font-bold tracking-tight text-on-surface">{t("pitch.emptyTitle")}</h2>
          <p className="mb-6 text-sm text-on-surface-variant leading-relaxed">
            {t("pitch.emptyDescription")}
          </p>
          <button
            type="button"
            onClick={() => navigate("/workspace/presentation")}
            className="inline-flex items-center gap-2 h-9 px-5 rounded-lg bg-primary text-on-primary text-xs font-bold shadow-2xs hover:bg-primary/90 transition-all cursor-pointer"
          >
            <span>{t("pitch.goToPresentation")}</span>
            <HugeiconsIcon icon="arrow-right" size={14} strokeWidth={2} />
          </button>
        </section>
      ) : (
        <section className="grid min-h-[580px] grid-cols-1 overflow-hidden rounded-2xl border border-outline-variant/80 bg-surface shadow-2xs lg:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="min-w-0 border-b border-outline-variant/80 bg-surface-container-lowest px-3 py-4 lg:border-b-0 lg:border-r">
            <div className="mb-3 px-2 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-outline-variant">{t("pitch.slides")}</span>
              <span className="text-xs font-semibold text-primary">{t("pitch.slideCount", { count: slides.length })}</span>
            </div>
            <nav className="flex flex-col gap-1.5 pr-1">
              {slides.map((slide, index) => (
                <button
                  key={slide.slideId}
                  type="button"
                  onClick={() => setSelectedSlideId(slide.slideId)}
                  className={cn(
                    "grid w-full grid-cols-[2rem_minmax(0,1fr)] items-center gap-2.5 rounded-xl px-3 py-2.5 text-left transition-all duration-150 cursor-pointer",
                    slide.slideId === selectedSlide?.slideId
                      ? "border border-primary bg-primary/10 text-primary shadow-2xs font-semibold"
                      : "border border-outline-variant/60 bg-surface text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
                  )}
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg border border-outline-variant/80 bg-surface text-xs font-bold text-primary font-mono">{index + 1}</span>
                  <span className="truncate text-xs sm:text-sm font-medium text-on-surface">{slide.title || `Slide ${index + 1}`}</span>
                </button>
              ))}
            </nav>
          </aside>

          {selectedSlide && (
            <main className="min-w-0 bg-surface-container-lowest px-5 py-7 sm:px-8 lg:px-10">
              <div className="mx-auto flex max-w-[860px] flex-col">
                <div className="mb-6 pb-4 border-b border-outline-variant/60">
                  <div className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-primary">{t("pitch.slideNumber", { number: selectedIndex + 1 })}</span>
                    <span className="inline-flex items-center gap-1.5 rounded-lg border border-outline-variant/80 bg-surface px-2.5 py-1 text-xs text-on-surface-variant font-medium shadow-2xs">
                      <HugeiconsIcon icon="clock" size={13} strokeWidth={1.8} className="text-primary" />
                      <span>{t("pitch.speakingDuration")}</span>
                      <span className="font-bold text-on-surface font-mono">{formatDeliveryDuration(getCurrentSeconds(selectedSlide), t)}</span>
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-on-surface leading-snug">
                    {selectedSlide.title}
                  </h2>
                </div>

                <div className="rounded-2xl border border-outline-variant/80 bg-surface p-5 sm:p-7 shadow-2xs">
                  <label className="block">
                    <textarea
                      value={selectedSlide.speech}
                      onChange={(event) => updateSlide(selectedSlide.slideId, { speech: event.target.value })}
                      rows={14}
                      className="min-h-[380px] w-full resize-y rounded-xl border border-outline-variant/80 bg-surface-container-lowest p-4 sm:p-5 text-xs sm:text-sm leading-relaxed text-on-surface outline-none transition-all placeholder:text-on-surface-variant/60 focus:border-primary focus:ring-1 focus:ring-primary font-sans"
                      placeholder={t("pitch.speechPlaceholder")}
                    />
                  </label>

                  <section className="mt-5 overflow-hidden rounded-xl border border-outline-variant/80 bg-surface shadow-2xs">
                    <button
                      type="button"
                      onClick={() => setTipsOpen((value) => !value)}
                      className="flex w-full items-center justify-between px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-on-surface hover:bg-surface-container-low/40 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <HugeiconsIcon icon="lightbulb" size={16} strokeWidth={1.8} className="text-primary" />
                        <span>{t("pitch.speakerDeliveryTips")}</span>
                      </div>
                      <HugeiconsIcon icon={tipsOpen ? "chevron-down" : "chevron-right"} size={16} strokeWidth={1.8} className="text-on-surface-variant" />
                    </button>

                    {tipsOpen && (
                      <div className="border-t border-outline-variant/80 p-4 sm:p-5 bg-surface-container-lowest/50">
                        <textarea
                          value={selectedSlide.tips.join("\n")}
                          onChange={(event) => updateTips(selectedSlide.slideId, event.target.value)}
                          rows={4}
                          className="w-full resize-y rounded-lg border border-outline-variant/80 bg-surface p-3 text-xs sm:text-sm leading-relaxed text-on-surface outline-none transition-all placeholder:text-on-surface-variant/60 focus:border-primary focus:ring-1 focus:ring-primary"
                          placeholder={t("pitch.tipsPlaceholder")}
                        />
                      </div>
                    )}
                  </section>
                </div>
              </div>
            </main>
          )}
        </section>
      )}
    </div>
  );
}

function getDeliveryLanguageLabel(language: string, t: (key: string) => string) {
  const label = getLanguageLabel(language).toLowerCase();
  if (label === "english") return t("pitch.languageNames.english");
  if (label === "french") return t("pitch.languageNames.french");
  if (label === "arabic") return t("pitch.languageNames.arabic");
  return getLanguageLabel(language);
}

function resolveDeliveryError(error: PitchError | null, t: (key: string) => string) {
  if (!error) return "";
  if (typeof error === "string") return error;
  return "translationKey" in error ? t(error.translationKey) : displayApiMessage(error);
}

function formatDeliveryDuration(seconds: number, t: (key: string, options?: any) => string) {
  const safeSeconds = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;
  if (minutes === 0) return t("pitch.durationSeconds", { seconds: remainingSeconds });
  return t("pitch.durationMinutes", { minutes, seconds: String(remainingSeconds).padStart(2, "0") });
}
