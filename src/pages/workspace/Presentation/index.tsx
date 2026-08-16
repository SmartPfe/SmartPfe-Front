import { useEffect, useMemo, useRef, useState } from "react";
import InfoTooltip from "@/components/ui/InfoTooltip";
import { cn } from "@/lib/utils";
import {
  createEmptySlide,
  getLanguageLabel,
  normalizeLanguage,
  PresentationDuration,
  PresentationSlide,
  usePresentation,
} from "./hooks/usePresentation";

const durations: PresentationDuration[] = [5, 10, 15, 20];

const aiButtonClass =
  "px-5 py-2 rounded-md border border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5 text-primary text-label-md font-semibold hover:from-primary/10 hover:to-secondary/10 transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed disabled:grayscale";
const translateButtonClass =
  "px-5 py-2 rounded-md border border-secondary/30 bg-secondary-container/60 text-secondary text-label-md font-semibold hover:bg-secondary-container transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed disabled:grayscale";

export default function PresentationPage() {
  const {
    presentation,
    projectLanguage,
    loading,
    saveStatus,
    aiState,
    error,
    updatePresentation,
    savePresentation,
    generateWithAi,
    refineWithAi,
    translateWithAi,
    dismissError,
  } = usePresentation();

  const [selectedSlideId, setSelectedSlideId] = useState<string | null>(null);
  const [notesOpen, setNotesOpen] = useState(true);
  const [draggedSlideId, setDraggedSlideId] = useState<string | null>(null);
  const [refineOpen, setRefineOpen] = useState(false);
  const [refineInstructions, setRefineInstructions] = useState("");
  const refinePopoverRef = useRef<HTMLDivElement>(null);

  const slides = presentation.slides;
  const selectedSlide = slides.find((slide) => slide.id === selectedSlideId) || slides[0];
  const selectedIndex = selectedSlide ? slides.findIndex((slide) => slide.id === selectedSlide.id) : -1;
  const nextSlide = selectedIndex >= 0 ? slides[selectedIndex + 1] : undefined;
  const hasSlides = slides.length > 0;
  const isAiIdle = aiState === "idle";
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

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (refinePopoverRef.current && !refinePopoverRef.current.contains(event.target as Node)) {
        setRefineOpen(false);
      }
    };

    if (refineOpen) {
      document.addEventListener("mousedown", handlePointerDown);
    }

    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [refineOpen]);

  useEffect(() => {
    setRefineOpen(false);
    setRefineInstructions("");
  }, [selectedSlide?.id]);

  const pacingLabel = useMemo(() => {
    if (!slides.length) return "AI will adapt slide count and pacing";
    const minutesPerSlide = presentation.durationMinutes / slides.length;
    return `${minutesPerSlide.toFixed(1)} min / slide average`;
  }, [presentation.durationMinutes, slides.length]);

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

  const handleRefineSubmit = async () => {
    if (!selectedSlide) return;
    await refineWithAi(selectedSlide.id, refineInstructions);
    setRefineInstructions("");
    setRefineOpen(false);
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
        <p className="font-medium text-on-surface-variant">Loading presentation...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-[1500px] flex-col gap-5 pb-24">
      <header className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-primary">Academic Defense</span>
          <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-on-surface flex items-center">
            Presentation
            <InfoTooltip label="Defense" tooltip="Generate and edit a PFE defense presentation from your complete Smart PFE context." />
          </h1>
          <p className="mt-2 max-w-[48rem] text-sm text-on-surface-variant leading-relaxed">
            Prepare the slides and speaker notes for your academic defense using the project artifacts and generated report.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 xl:justify-end">
          <span className={cn(
            "text-xs font-medium transition-colors",
            saveStatus === "saving" ? "text-on-surface-variant" : saveStatus === "saved" ? "text-secondary" : "text-error"
          )}>
            {saveStatus === "saving" ? "Autosaving..." : saveStatus === "saved" ? "All changes saved" : "Unsaved changes"}
          </span>
          <button
            onClick={() => savePresentation(presentation, true)}
            disabled={saveStatus === "saving" || !isAiIdle}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-on-primary shadow-xs transition-all hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Save now
          </button>
          <style>{`
            @keyframes presentation-popover-in {
              from { opacity: 0; transform: translateY(-4px) scale(0.98); }
              to { opacity: 1; transform: translateY(0) scale(1); }
            }
          `}</style>
        </div>
      </header>

      <div className="rounded-xl border border-outline-variant/80 bg-surface-container-lowest p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Defense duration</span>
            <div className="grid grid-cols-4 gap-1 rounded-lg bg-surface-container p-1">
              {durations.map((duration) => (
                <button
                  key={duration}
                  onClick={() => setDuration(duration)}
                  disabled={!isAiIdle}
                  className={cn(
                    "h-8 sm:h-9 rounded-md px-3 text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed",
                    presentation.durationMinutes === duration
                      ? "bg-surface text-primary shadow-xs font-bold"
                      : "text-on-surface-variant hover:text-on-surface"
                  )}
                >
                  {duration} min
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs sm:text-sm text-on-surface-variant font-medium">
              {slides.length} slides · {pacingLabel}
            </span>
            {!hasSlides ? (
              <button
                onClick={() => generateWithAi(presentation.durationMinutes)}
                disabled={!isAiIdle}
                className={aiButtonClass}
              >
                {aiState === "generating" ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    Generating...
                  </span>
                ) : "Generate with AI"}
              </button>
            ) : (
              <>
                <button
                  onClick={() => generateWithAi(presentation.durationMinutes)}
                  disabled={!isAiIdle}
                  className={aiButtonClass}
                >
                  {aiState === "generating" ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      Generating...
                    </span>
                  ) : "Generate with AI"}
                </button>
                <div className="relative" ref={refinePopoverRef}>
                  <button
                    onClick={() => setRefineOpen(true)}
                    disabled={!selectedSlide || !isAiIdle}
                    className={aiButtonClass}
                  >
                    {aiState === "refining" ? (
                      <span className="inline-flex items-center gap-2">
                        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        Refining...
                      </span>
                    ) : "Refine with AI"}
                  </button>

                  {refineOpen && (
                    <div
                      className="absolute right-0 top-full z-30 mt-2 w-[min(22rem,calc(100vw-2rem))] rounded-md border border-outline-variant bg-surface-bright p-3 shadow-xl"
                      style={{ animation: "presentation-popover-in 150ms ease-out" }}
                    >
                      <textarea
                        value={refineInstructions}
                        onChange={(event) => setRefineInstructions(event.target.value)}
                        placeholder="Tell AI what you'd like to improve (optional)..."
                        rows={4}
                        className="w-full resize-none rounded-md border border-outline-variant bg-surface px-3 py-2 text-body-md text-on-surface outline-none transition-colors placeholder:text-on-surface-variant focus:border-primary focus:ring-1 focus:ring-primary"
                        autoFocus
                      />
                      <div className="mt-3 flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setRefineInstructions("");
                            setRefineOpen(false);
                          }}
                          className="px-3 py-1.5 rounded-md border border-outline-variant bg-surface text-label-sm font-medium text-on-surface hover:bg-surface-container transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleRefineSubmit}
                          disabled={aiState === "refining"}
                          className="px-3 py-1.5 rounded-md bg-primary text-label-sm font-semibold text-on-primary hover:opacity-90 transition-opacity disabled:opacity-50"
                        >
                          {aiState === "refining" ? "Refining..." : "Refine"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                {shouldShowTranslate && (
                  <button
                    onClick={() => selectedSlide && translateWithAi(selectedSlide.id)}
                    disabled={!selectedSlide || !isAiIdle}
                    className={translateButtonClass}
                  >
                    {aiState === "translating" ? (
                      <span className="inline-flex items-center gap-2">
                        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-secondary border-t-transparent" />
                        Translating...
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-2">
                        <span aria-hidden="true">🌐</span>
                        Translate to {getLanguageLabel(projectLanguage)}
                      </span>
                    )}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-error/20 bg-error-container p-3 text-on-error-container flex items-center justify-between gap-3">
          <p className="text-body-md">{error}</p>
          <button onClick={dismissError} className="shrink-0 text-label-sm underline hover:no-underline">Dismiss</button>
        </div>
      )}

      {!hasSlides ? (
        <section className="min-h-[520px] rounded-2xl border border-outline-variant/80 bg-surface-container-lowest flex flex-col items-center justify-center px-6 text-center shadow-xs">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <span className="material-symbols-outlined text-[34px]">co_present</span>
          </div>
          <h2 className="mb-3 text-2xl font-bold tracking-tight text-on-surface">Generate your defense presentation</h2>
          <p className="max-w-xl text-sm text-on-surface-variant leading-relaxed">
            Choose a duration from the toolbar above and click <span className="font-semibold text-primary">Generate with AI</span> to build your editable slides and speaker notes.
          </p>
        </section>
      ) : (
        <section className="grid min-h-[calc(100dvh-310px)] grid-cols-1 overflow-hidden rounded-2xl border border-outline-variant/80 bg-surface shadow-xs xl:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="flex min-h-[260px] flex-col border-b border-outline-variant/80 bg-surface-container-lowest xl:border-b-0 xl:border-r">
            <div className="border-b border-outline-variant/80 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm sm:text-base font-semibold text-on-surface">Slides</h2>
                  <p className="text-xs text-on-surface-variant font-medium">
                    {slides.length} slides · {presentation.durationMinutes} minutes
                  </p>
                </div>
                <button
                  onClick={addSlide}
                  disabled={!isAiIdle}
                  title="Add slide"
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-on-primary shadow-xs transition-all hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <span className="material-symbols-outlined text-[18px]">add</span>
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
              {slides.map((slide, index) => (
                <button
                  key={slide.id}
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
                    "mb-1.5 flex w-full items-center gap-3 rounded-xl border p-2.5 text-left transition-all",
                    slide.id === selectedSlide?.id
                      ? "border-primary/40 bg-primary/10 text-primary shadow-xs font-semibold"
                      : "border-transparent text-on-surface-variant hover:bg-surface-container-low/60 hover:text-on-surface",
                    draggedSlideId === slide.id && "opacity-50"
                  )}
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-outline-variant/80 bg-surface text-xs font-bold text-primary">
                    {index + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs sm:text-sm font-semibold">{slide.title || `Slide ${index + 1}`}</span>
                    <span className="block truncate text-[11px] text-on-surface-variant">
                      {index + 1 < slides.length ? `Next: ${slides[index + 1].title}` : "Final slide"}
                    </span>
                  </span>
                  <span className="material-symbols-outlined text-[16px] text-on-surface-variant/70">drag_indicator</span>
                </button>
              ))}
            </div>
          </aside>

          {selectedSlide && (
            <main className="min-w-0 p-4 sm:p-6 lg:p-8">
              <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="mb-1.5 flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-primary">
                      Slide {selectedIndex + 1} of {slides.length}
                    </span>
                  </div>
                  <input
                    value={selectedSlide.title}
                    onChange={(event) => updateSlide(selectedSlide.id, { title: event.target.value })}
                    className="w-full border-b border-outline-variant/80 bg-transparent pb-2 text-xl sm:text-2xl font-bold tracking-tight text-on-surface outline-none transition-colors focus:border-primary"
                    placeholder="Slide title"
                  />
                  <p className="mt-2 text-xs sm:text-sm text-on-surface-variant">
                    {nextSlide ? `Next slide: ${nextSlide.title}` : "This is the closing slide."}
                  </p>
                </div>

                <button
                  onClick={() => deleteSlide(selectedSlide.id)}
                  disabled={!isAiIdle}
                  title="Delete slide"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-outline-variant/80 text-on-surface-variant transition-colors hover:border-error/40 hover:bg-error-container hover:text-error disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[20px]">delete</span>
                </button>
              </div>

              <div className="grid gap-6">
                <div className="rounded-xl border border-outline-variant/80 bg-surface-container-lowest p-5 shadow-xs transition-all">
                  <span className="mb-3 flex items-center gap-2 text-sm font-semibold text-on-surface">
                    <span className="material-symbols-outlined text-[18px] text-primary">format_list_bulleted</span>
                    Bullet points
                  </span>
                  <textarea
                    value={selectedSlide.bullets.join("\n")}
                    onChange={(event) => updateSlide(selectedSlide.id, {
                      bullets: event.target.value.split(/\r?\n/).map((item) => item.replace(/^\s*[-*•]\s*/, "").trim()).filter(Boolean),
                    })}
                    rows={8}
                    className="w-full resize-y rounded-lg border border-outline-variant/80 bg-surface p-4 text-sm leading-relaxed text-on-surface outline-none transition-all placeholder:text-on-surface-variant/60 focus:border-primary focus:ring-2 focus:ring-primary/15"
                    placeholder="One bullet per line"
                  />
                </div>

                <div className="rounded-xl border border-outline-variant/80 bg-surface-container-lowest shadow-xs transition-all">
                  <button
                    onClick={() => setNotesOpen((value) => !value)}
                    className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition-colors hover:bg-surface-container-low/40 rounded-xl"
                  >
                    <span className="flex items-center gap-2 text-sm font-semibold text-on-surface">
                      <span className="material-symbols-outlined text-[18px] text-primary">record_voice_over</span>
                      Speaker Notes
                    </span>
                    <span className="material-symbols-outlined text-[20px] text-on-surface-variant">
                      {notesOpen ? "expand_less" : "expand_more"}
                    </span>
                  </button>

                  {notesOpen && (
                    <div className="border-t border-outline-variant/80 p-5">
                      <textarea
                        value={selectedSlide.notes}
                        onChange={(event) => updateSlide(selectedSlide.id, { notes: event.target.value })}
                        rows={8}
                        className="w-full resize-y rounded-lg border border-outline-variant/80 bg-surface p-4 text-sm leading-relaxed text-on-surface outline-none transition-all placeholder:text-on-surface-variant/60 focus:border-primary focus:ring-2 focus:ring-primary/15"
                        placeholder="What should the student say for this slide?"
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
