import { useEffect, useMemo, useState } from "react";
import InfoTooltip from "@/components/ui/InfoTooltip";
import { cn } from "@/lib/utils";
import {
  createEmptySlide,
  PresentationDuration,
  PresentationSlide,
  usePresentation,
} from "./hooks/usePresentation";

const durations: PresentationDuration[] = [5, 10, 15, 20];

const aiButtonClass =
  "px-5 py-2 rounded-md border border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5 text-primary text-label-md font-semibold hover:from-primary/10 hover:to-secondary/10 transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed disabled:grayscale";

export default function PresentationPage() {
  const {
    presentation,
    loading,
    saveStatus,
    aiState,
    error,
    updatePresentation,
    savePresentation,
    generateWithAi,
    refineWithAi,
    dismissError,
  } = usePresentation();

  const [selectedSlideId, setSelectedSlideId] = useState<string | null>(null);
  const [notesOpen, setNotesOpen] = useState(true);
  const [draggedSlideId, setDraggedSlideId] = useState<string | null>(null);

  const slides = presentation.slides;
  const selectedSlide = slides.find((slide) => slide.id === selectedSlideId) || slides[0];
  const selectedIndex = selectedSlide ? slides.findIndex((slide) => slide.id === selectedSlide.id) : -1;
  const nextSlide = selectedIndex >= 0 ? slides[selectedIndex + 1] : undefined;
  const hasSlides = slides.length > 0;

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
      return { ...current, slides: [...current.slides, nextSlide] };
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
        <p className="font-medium text-on-surface-variant">Loading presentation...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-[1500px] flex-col gap-5 pb-24">
      <header className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h1 className="font-display text-display text-on-surface mb-2 flex items-center">
            Presentation
            <InfoTooltip label="Defense" tooltip="Generate and edit a PFE defense presentation from your complete Smart PFE context." />
          </h1>
          <p className="max-w-[48rem] font-body-lg text-body-lg text-on-surface-variant">
            Prepare the slides and speaker notes for your academic defense using the project artifacts and generated report.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 xl:justify-end">
          <span className={cn(
            "text-label-sm transition-colors",
            saveStatus === "saving" ? "text-on-surface-variant" : saveStatus === "saved" ? "text-secondary" : "text-error"
          )}>
            {saveStatus === "saving" ? "Autosaving..." : saveStatus === "saved" ? "All changes saved" : "Unsaved changes"}
          </span>
          <button
            onClick={() => savePresentation(presentation, true)}
            disabled={saveStatus === "saving" || aiState === "generating"}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-on-primary shadow-sm transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            Save now
          </button>
        </div>
      </header>

      <div className="rounded-xl border border-outline-variant bg-surface p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <span className="font-label-sm font-bold uppercase text-on-surface-variant">Defense duration</span>
            <div className="grid grid-cols-4 gap-1 rounded-lg bg-surface-container p-1">
              {durations.map((duration) => (
                <button
                  key={duration}
                  onClick={() => setDuration(duration)}
                  disabled={aiState === "generating"}
                  className={cn(
                    "h-9 rounded-md px-3 font-label-sm transition-colors disabled:opacity-50",
                    presentation.durationMinutes === duration
                      ? "bg-surface text-primary shadow-sm font-bold"
                      : "text-on-surface-variant hover:text-on-surface"
                  )}
                >
                  {duration} min
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="text-body-sm text-on-surface-variant">
              {slides.length} slides · {pacingLabel}
            </span>
            {!hasSlides ? (
              <button
                onClick={() => generateWithAi(presentation.durationMinutes)}
                disabled={aiState === "generating"}
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
              <button
                onClick={refineWithAi}
                disabled={aiState === "generating"}
                className={aiButtonClass}
              >
                {aiState === "generating" ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    Refining...
                  </span>
                ) : "Refine with AI"}
              </button>
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
        <section className="min-h-[520px] rounded-xl border border-outline-variant bg-surface flex flex-col items-center justify-center px-6 text-center">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-xl bg-primary-container text-on-primary-container">
            <span className="material-symbols-outlined text-[34px]">co_present</span>
          </div>
          <h2 className="mb-3 text-headline-md text-on-surface">Generate your defense presentation</h2>
          <p className="mb-7 max-w-xl text-body-lg text-on-surface-variant">
            Choose a duration, then Smart PFE will build editable slides and speaker notes from your complete project context and report.
          </p>
          <button
            onClick={() => generateWithAi(presentation.durationMinutes)}
            disabled={aiState === "generating"}
            className={aiButtonClass}
          >
            {aiState === "generating" ? (
              <span className="inline-flex items-center gap-2">
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                Generating...
              </span>
            ) : "Generate with AI"}
          </button>
        </section>
      ) : (
        <section className="grid min-h-[calc(100dvh-310px)] grid-cols-1 overflow-hidden rounded-xl border border-outline-variant bg-surface xl:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="flex min-h-[260px] flex-col border-b border-outline-variant bg-surface-container-lowest xl:border-b-0 xl:border-r">
            <div className="border-b border-outline-variant p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-headline-sm text-on-surface">Slides</h2>
                  <p className="text-body-sm text-on-surface-variant">
                    {slides.length} slides · {presentation.durationMinutes} minutes
                  </p>
                </div>
                <button
                  onClick={addSlide}
                  disabled={aiState === "generating"}
                  title="Add slide"
                  className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-on-primary transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[20px]">add</span>
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
                    "mb-1 flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors",
                    slide.id === selectedSlide?.id
                      ? "border-primary/25 bg-primary-container/45 text-primary shadow-sm"
                      : "border-transparent text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface",
                    draggedSlideId === slide.id && "opacity-50"
                  )}
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-outline-variant bg-surface font-label-md text-primary">
                    {index + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-body-sm font-semibold">{slide.title || `Slide ${index + 1}`}</span>
                    <span className="block truncate text-label-sm text-on-surface-variant">
                      {index + 1 < slides.length ? `Next: ${slides[index + 1].title}` : "Final slide"}
                    </span>
                  </span>
                  <span className="material-symbols-outlined text-[18px] text-on-surface-variant">drag_indicator</span>
                </button>
              ))}
            </div>
          </aside>

          {selectedSlide && (
            <main className="min-w-0 p-4 sm:p-6 lg:p-8">
              <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1">
                  <p className="mb-2 text-label-sm font-bold uppercase text-primary">
                    Slide {selectedIndex + 1} of {slides.length}
                  </p>
                  <input
                    value={selectedSlide.title}
                    onChange={(event) => updateSlide(selectedSlide.id, { title: event.target.value })}
                    className="w-full border-b border-outline-variant bg-transparent pb-2 text-headline-md text-on-surface outline-none focus:border-primary"
                    placeholder="Slide title"
                  />
                  <p className="mt-2 text-body-sm text-on-surface-variant">
                    {nextSlide ? `Next slide: ${nextSlide.title}` : "This is the closing slide."}
                  </p>
                </div>

                <button
                  onClick={() => deleteSlide(selectedSlide.id)}
                  disabled={aiState === "generating"}
                  title="Delete slide"
                  className="flex h-9 w-9 items-center justify-center rounded-md border border-outline-variant text-on-surface-variant transition-colors hover:bg-error-container hover:text-error disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[20px]">delete</span>
                </button>
              </div>

              <div className="grid gap-5">
                <label className="block">
                  <span className="mb-2 flex items-center gap-2 font-label-md text-on-surface">
                    <span className="material-symbols-outlined text-[18px] text-primary">format_list_bulleted</span>
                    Bullet points
                  </span>
                  <textarea
                    value={selectedSlide.bullets.join("\n")}
                    onChange={(event) => updateSlide(selectedSlide.id, {
                      bullets: event.target.value.split(/\r?\n/).map((item) => item.replace(/^\s*[-*•]\s*/, "").trim()).filter(Boolean),
                    })}
                    rows={9}
                    className="w-full resize-y rounded-lg border border-outline-variant bg-surface-container-lowest p-4 text-body-md text-on-surface outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
                    placeholder="One bullet per line"
                  />
                </label>

                <div className="rounded-lg border border-outline-variant bg-surface-container-lowest">
                  <button
                    onClick={() => setNotesOpen((value) => !value)}
                    className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
                  >
                    <span className="flex items-center gap-2 font-label-md text-on-surface">
                      <span className="material-symbols-outlined text-[18px] text-primary">record_voice_over</span>
                      Speaker Notes
                    </span>
                    <span className="material-symbols-outlined text-[20px] text-on-surface-variant">
                      {notesOpen ? "expand_less" : "expand_more"}
                    </span>
                  </button>

                  {notesOpen && (
                    <div className="border-t border-outline-variant p-4">
                      <textarea
                        value={selectedSlide.notes}
                        onChange={(event) => updateSlide(selectedSlide.id, { notes: event.target.value })}
                        rows={10}
                        className="w-full resize-y rounded-md border border-outline-variant bg-surface p-4 text-body-md leading-relaxed text-on-surface outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
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
