import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import InfoTooltip from "@/components/ui/InfoTooltip";
import { cn } from "@/lib/utils";
import { displayApiMessage } from "@/lib/apiMessage";
import {
  createEmptySlide,
  getLanguageLabel,
  normalizeLanguage,
  PresentationDuration,
  PresentationError,
  PresentationSlide,
  usePresentation,
} from "./hooks/usePresentation";
import AiBackgroundBanner from "@/components/ai/AiBackgroundBanner";
import HugeiconsIcon from "@/components/ui/HugeiconsIcon";
import SaveStatusHeader from "@/components/ui/SaveStatusHeader";
import AiActionToolbar from "@/components/ai/AiActionToolbar";

const durations: PresentationDuration[] = [5, 10, 15, 20];

export default function PresentationPage() {
  const { t, i18n } = useTranslation("delivery");
  const {
    presentation,
    projectLanguage,
    loading,
    saveStatus,
    aiState,
    isAiBusy,
    error,
    updatePresentation,
    savePresentation,
    generateWithAi,
    refineWithAi,
    translateWithAi,
    cancelAi,
    dismissError,
  } = usePresentation();
  const localizedProjectLanguage = getDeliveryLanguageLabel(projectLanguage, t);
  const displayError = resolveDeliveryError(error, t);

  const [selectedSlideId, setSelectedSlideId] = useState<string | null>(null);
  const [notesOpen, setNotesOpen] = useState(true);
  const [draggedSlideId, setDraggedSlideId] = useState<string | null>(null);

  const slides = presentation.slides;
  const selectedSlide = slides.find((slide) => slide.id === selectedSlideId) || slides[0];
  const selectedIndex = selectedSlide ? slides.findIndex((slide) => slide.id === selectedSlide.id) : -1;
  const nextSlide = selectedIndex >= 0 ? slides[selectedIndex + 1] : undefined;
  const hasSlides = slides.length > 0;
  const isAiIdle = !isAiBusy && aiState === "idle";
  const selectedSlideHasContent = Boolean(
    selectedSlide &&
    (selectedSlide.title.trim() || selectedSlide.bullets.length || selectedSlide.notes.trim())
  );
  const shouldShowTranslate = Boolean(
    selectedSlideHasContent &&
    projectLanguage &&
    normalizeLanguage(selectedSlide?.language) !== normalizeLanguage(projectLanguage)
  );

  useEffect(() => {
    if (!selectedSlideId && slides.length) {
      setSelectedSlideId(slides[0].id);
      return;
    }

    if (selectedSlideId && slides.length && !slides.some((slide) => slide.id === selectedSlideId)) {
      setSelectedSlideId(slides[Math.min(selectedIndex, slides.length - 1)]?.id || slides[0].id);
    }
  }, [selectedIndex, selectedSlideId, slides]);

  const pacingLabel = useMemo(() => {
    if (!slides.length) return t("presentation.pacingEmpty");
    const minutesPerSlide = presentation.durationMinutes / slides.length;
    return t("presentation.pacingAverage", { minutes: new Intl.NumberFormat(i18n.resolvedLanguage || "en", { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(minutesPerSlide) });
  }, [presentation.durationMinutes, slides.length, t, i18n.resolvedLanguage]);

  const setDuration = (durationMinutes: PresentationDuration) => {
    updatePresentation((current) => ({ ...current, durationMinutes }));
  };

  const updateSlide = (slideId: string, updates: Partial<PresentationSlide>) => {
    updatePresentation((current) => ({
      ...current,
      slides: current.slides.map((slide) => slide.id === slideId ? { ...slide, ...updates } : slide),
    }));
  };

  const addSlide = () => {
    updatePresentation((current) => {
      const nextSlide = createEmptySlide(current.slides.length);
      setSelectedSlideId(nextSlide.id);
      return { ...current, slides: [...current.slides, { ...nextSlide, language: projectLanguage }] };
    });
  };

  const deleteSlide = (slideId: string) => {
    updatePresentation((current) => {
      const index = current.slides.findIndex((slide) => slide.id === slideId);
      const nextSlides = current.slides.filter((slide) => slide.id !== slideId);
      setSelectedSlideId(nextSlides[Math.min(index, nextSlides.length - 1)]?.id || nextSlides[0]?.id || null);
      return { ...current, slides: nextSlides };
    });
  };

  const moveSlide = (fromId: string, toId: string) => {
    if (fromId === toId) return;

    updatePresentation((current) => {
      const fromIndex = current.slides.findIndex((slide) => slide.id === fromId);
      const toIndex = current.slides.findIndex((slide) => slide.id === toId);
      if (fromIndex < 0 || toIndex < 0) return current;

      const nextSlides = [...current.slides];
      const [moved] = nextSlides.splice(fromIndex, 1);
      nextSlides.splice(toIndex, 0, moved);
      return { ...current, slides: nextSlides };
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center">
        <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-sm font-medium text-on-surface-variant">{t("presentation.loading")}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-col h-full pb-32">
      {/* Header Section */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-primary">{t("presentation.eyebrow")}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-on-surface flex items-center">
            {t("presentation.title")}
            <InfoTooltip
              label={t("presentation.tooltipLabel")}
              tooltip={t("presentation.tooltip")}
            />
          </h1>
          <p className="text-sm text-on-surface-variant max-w-[48rem] mt-1.5 leading-relaxed">
            {t("presentation.description")}
          </p>
        </div>

        {/* Global SaveStatusHeader */}
        <SaveStatusHeader
          status={saveStatus}
          onSave={() => savePresentation(presentation, true)}
          isBusy={isAiBusy}
        />
      </div>

      {/* Background AI Progress Banner */}
      <AiBackgroundBanner
        isVisible={isAiBusy}
        moduleName={t("presentation.moduleName")}
        action={aiState}
        onCancel={cancelAi}
      />

      {/* Duration Selector & Pacing Ribbon */}
      <div className="mb-6 rounded-2xl border border-outline-variant/80 bg-surface-container-lowest p-3.5 sm:p-4 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">{t("presentation.targetDuration")}</span>
            <div className="inline-flex bg-surface-container p-1 rounded-xl border border-outline-variant/60">
              {durations.map((duration) => (
                <button
                  key={duration}
                  type="button"
                  onClick={() => setDuration(duration)}
                  disabled={!isAiIdle}
                  className={cn(
                    "h-7 sm:h-8 px-3 rounded-lg text-xs font-bold transition-all duration-150 cursor-pointer",
                    presentation.durationMinutes === duration
                      ? "bg-primary text-on-primary shadow-2xs"
                      : "text-on-surface-variant hover:text-on-surface hover:bg-surface/50"
                  )}
                >
                  {duration} {t("presentation.minutes")}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-on-surface-variant">
            <HugeiconsIcon icon="clock" size={15} strokeWidth={1.8} className="text-primary" />
            <span>{t("presentation.slideCount", { count: slides.length })} · {pacingLabel}</span>
          </div>
        </div>
      </div>

      {/* Global AI Action Toolbar */}
      <AiActionToolbar
        onGenerate={() => generateWithAi(presentation.durationMinutes)}
        onRefine={(instructions) => selectedSlide && refineWithAi(selectedSlide.id, instructions)}
        onTranslate={() => selectedSlide && translateWithAi(selectedSlide.id)}
        isGenerating={aiState === "generating"}
        isRefining={aiState === "refining"}
        isTranslating={aiState === "translating"}
        isBusy={isAiBusy}
        canRefine={Boolean(selectedSlide)}
        refineDisabledTitle={t("presentation.refineDisabled")}
        refinePlaceholder={t("presentation.refinePlaceholder", { slide: selectedIndex + 1 })}
        showTranslate={shouldShowTranslate}
        translateLabel={t("common.translateTo", { language: localizedProjectLanguage })}
        primaryAction={
          <button
            type="button"
            onClick={addSlide}
            disabled={!isAiIdle}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 h-9 px-4 bg-primary text-on-primary rounded-lg text-[13px] font-semibold tracking-tight hover:bg-primary/90 transition-all duration-150 shadow-2xs active:scale-[0.98] disabled:opacity-50 select-none cursor-pointer"
          >
            <HugeiconsIcon icon="add" size={16} strokeWidth={2} />
            <span>{t("presentation.addSlide")}</span>
          </button>
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

      {!hasSlides ? (
        <section className="min-h-[520px] rounded-2xl border border-outline-variant/80 bg-surface-container-lowest flex flex-col items-center justify-center px-6 text-center shadow-2xs">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20">
            <HugeiconsIcon icon="presentation" size={32} strokeWidth={1.8} />
          </div>
          <h2 className="mb-2 text-2xl font-bold tracking-tight text-on-surface">{t("presentation.emptyTitle")}</h2>
          <p className="max-w-xl text-sm text-on-surface-variant leading-relaxed">
            {t("presentation.emptyDescription")}
          </p>
        </section>
      ) : (
        <section className="grid min-h-[calc(100dvh-310px)] grid-cols-1 overflow-hidden rounded-2xl border border-outline-variant/80 bg-surface shadow-2xs xl:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="flex min-h-[260px] flex-col border-b border-outline-variant/80 bg-surface-container-lowest xl:border-b-0 xl:border-r">
            <div className="border-b border-outline-variant/80 p-4 bg-surface-container-low/40">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-bold text-on-surface tracking-tight">{t("presentation.slideDeck")}</h2>
                  <p className="text-xs text-on-surface-variant font-medium">
                    {t("presentation.slideCountDuration", { slides: t("presentation.slideCount", { count: slides.length }), minutes: presentation.durationMinutes })}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addSlide}
                  disabled={!isAiIdle}
                  title={t("presentation.addSlideTitle")}
                  aria-label={t("presentation.addSlideTitle")}
                  className="w-8 h-8 rounded-lg bg-primary text-on-primary shadow-2xs flex items-center justify-center hover:bg-primary/90 transition-all cursor-pointer disabled:opacity-50"
                >
                  <HugeiconsIcon icon="add" size={16} strokeWidth={2} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2.5 flex flex-col gap-1.5 bg-surface-container-low/20">
              {slides.map((slide, index) => (
                <button
                  key={slide.id}
                  type="button"
                  draggable
                  onDragStart={() => setDraggedSlideId(slide.id)}
                  onDragEnd={() => setDraggedSlideId(null)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={() => {
                    if (draggedSlideId) moveSlide(draggedSlideId, slide.id);
                    setDraggedSlideId(null);
                  }}
                  onClick={() => setSelectedSlideId(slide.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl border p-2.5 text-left transition-all duration-150 cursor-pointer",
                    slide.id === selectedSlide?.id
                      ? "border-primary bg-primary/10 text-primary shadow-2xs font-semibold"
                      : "border-outline-variant/60 bg-surface text-on-surface-variant hover:bg-surface-container hover:text-on-surface",
                    draggedSlideId === slide.id && "opacity-50"
                  )}
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-outline-variant/80 bg-surface text-xs font-bold font-mono text-primary">
                    {index + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-bold text-on-surface">{slide.title || `Slide ${index + 1}`}</span>
                    <span className="block truncate text-[11px] text-on-surface-variant/80">
                      {index + 1 < slides.length ? t("presentation.nextSlide", { title: slides[index + 1].title }) : t("presentation.finalSlide")}
                    </span>
                  </span>
                  <span className="text-on-surface-variant/40 hover:text-on-surface-variant shrink-0 flex items-center">
                    <HugeiconsIcon icon="drag-indicator" size={15} strokeWidth={1.8} />
                  </span>
                </button>
              ))}
            </div>
          </aside>

          {selectedSlide && (
            <main className="min-w-0 p-5 sm:p-7 bg-surface-container-lowest">
              <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between pb-4 border-b border-outline-variant/60">
                <div className="min-w-0 flex-1">
                  <div className="mb-1.5 flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-primary">
                      {t("presentation.slidePosition", { current: selectedIndex + 1, total: slides.length })}
                    </span>
                  </div>
                  <input
                    value={selectedSlide.title}
                    onChange={(event) => updateSlide(selectedSlide.id, { title: event.target.value })}
                    className="w-full bg-transparent pb-1 text-xl sm:text-2xl font-bold tracking-tight text-on-surface outline-none transition-colors border-b border-transparent focus:border-primary placeholder:text-on-surface-variant/40"
                    placeholder={t("presentation.slideTitlePlaceholder")}
                  />
                  <p className="mt-2 text-xs text-on-surface-variant">
                    {nextSlide ? t("presentation.nextSlidePreview", { title: nextSlide.title }) : t("presentation.closingSlide")}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => deleteSlide(selectedSlide.id)}
                  disabled={!isAiIdle}
                  title={t("presentation.deleteSlide")}
                  aria-label={t("presentation.deleteSlide")}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-error hover:bg-error/10 transition-colors cursor-pointer disabled:opacity-50 shrink-0"
                >
                  <HugeiconsIcon icon="delete" size={17} strokeWidth={1.8} />
                </button>
              </div>

              <div className="grid gap-5">
                <div className="rounded-2xl border border-outline-variant/80 bg-surface p-4 sm:p-5 shadow-2xs">
                  <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-on-surface">
                    <HugeiconsIcon icon="list-ordered" size={16} strokeWidth={1.8} className="text-primary" />
                    <span>{t("presentation.bulletPoints")}</span>
                  </div>
                  <textarea
                    value={selectedSlide.bullets.join("\n")}
                    onChange={(event) => updateSlide(selectedSlide.id, {
                      bullets: event.target.value.split(/\r?\n/).map((item) => item.replace(/^\s*[-*•]\s*/, "").trim()).filter(Boolean),
                    })}
                    rows={7}
                    className="w-full resize-y rounded-xl border border-outline-variant/80 bg-surface-container-lowest p-3.5 text-xs sm:text-sm leading-relaxed text-on-surface outline-none transition-all placeholder:text-on-surface-variant/60 focus:border-primary focus:ring-1 focus:ring-primary"
                    placeholder={t("presentation.bulletPlaceholder")}
                  />
                </div>

                <div className="rounded-2xl border border-outline-variant/80 bg-surface shadow-2xs overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setNotesOpen((value) => !value)}
                    className="flex w-full items-center justify-between gap-3 px-5 py-3.5 text-left transition-colors hover:bg-surface-container-low/40 cursor-pointer"
                  >
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-on-surface">
                      <HugeiconsIcon icon="person" size={16} strokeWidth={1.8} className="text-primary" />
                      <span>{t("presentation.speakerTalkingPoints")}</span>
                    </div>
                    <HugeiconsIcon icon={notesOpen ? "chevron-down" : "chevron-right"} size={16} strokeWidth={1.8} className="text-on-surface-variant" />
                  </button>

                  {notesOpen && (
                    <div className="border-t border-outline-variant/70 p-4 sm:p-5 bg-surface-container-lowest/50">
                      <textarea
                        value={selectedSlide.notes}
                        onChange={(event) => updateSlide(selectedSlide.id, { notes: event.target.value })}
                        rows={7}
                        className="w-full resize-y rounded-xl border border-outline-variant/80 bg-surface p-3.5 text-xs sm:text-sm leading-relaxed text-on-surface outline-none transition-all placeholder:text-on-surface-variant/60 focus:border-primary focus:ring-1 focus:ring-primary"
                        placeholder={t("presentation.notesPlaceholder")}
                      />
                    </div>
                  )}
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
  if (label === "english") return t("presentation.languageNames.english");
  if (label === "french") return t("presentation.languageNames.french");
  if (label === "arabic") return t("presentation.languageNames.arabic");
  return getLanguageLabel(language);
}

function resolveDeliveryError(error: PresentationError | null, t: (key: string) => string) {
  if (!error) return "";
  if (typeof error === "string") return error;
  return "translationKey" in error ? t(error.translationKey) : displayApiMessage(error);
}
