import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  estimateSpeechSeconds,
  formatDuration,
  PitchSlide,
  usePitch,
} from "./hooks/usePitch";

const aiButtonClass =
  "px-5 py-2 rounded-md border border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5 text-primary text-label-md font-semibold hover:from-primary/10 hover:to-secondary/10 transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed disabled:grayscale";

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

export default function PitchPage() {
  const navigate = useNavigate();
  const {
    pitch,
    loading,
    aiState,
    error,
    updatePitch,
    generateWithAi,
    refineWithAi,
    generateSlideWithAi,
    refineSlideWithAi,
    dismissError,
  } = usePitch();

  const [selectedSlideId, setSelectedSlideId] = useState<string | null>(null);
  const [tipsOpen, setTipsOpen] = useState(true);

  const slides = pitch.slides;
  const selectedSlide = slides.find((slide) => slide.slideId === selectedSlideId) || slides[0];
  const selectedIndex = selectedSlide ? slides.findIndex((slide) => slide.slideId === selectedSlide.slideId) : -1;
  const hasPresentation = slides.length > 0;
  const hasPitch = slides.some((slide) => slide.speech.trim());

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
      tips: value.split(/\r?\n/).map((tip) => tip.replace(/^\s*[-*\u2022]\s*/, "").trim()).filter(Boolean),
    });
  };

  const exportPdf = () => {
    const sections = slides.map((slide, index) => {
      const tips = slide.tips.length
        ? `<ul>${slide.tips.map((tip) => `<li>${escapeHtml(tip)}</li>`).join("")}</ul>`
        : "<p>No speaker tips yet.</p>";

      return `
        <section class="slide">
          <p class="kicker">Slide ${index + 1}</p>
          <h2>${escapeHtml(slide.title || `Slide ${index + 1}`)}</h2>
          <p class="duration">Estimated duration: ${formatDuration(getCurrentSeconds(slide))}</p>
          <h3>Speech</h3>
          ${paragraphHtml(slide.speech) || "<p>No speech yet.</p>"}
          <h3>Speaker Tips</h3>
          ${tips}
        </section>
      `;
    }).join("");

    const html = `
      <!doctype html>
      <html>
        <head>
          <title>Pitch Speech</title>
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
              <h1>Pitch Speech</h1>
              <p class="meta">Presentation Duration: ${pitch.durationMinutes} min</p>
              <p class="meta">Estimated Current Duration: ${formatDuration(totalEstimatedSeconds)}</p>
            </header>
            ${sections}
          </main>
        </body>
      </html>
    `;

    const printFrame = document.createElement("iframe");
    printFrame.title = "Pitch PDF Export";
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
        <p className="font-medium text-on-surface-variant">Loading pitch...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-[1440px] flex-col gap-5 pb-24">
      <header className="sticky top-0 z-20 -mx-2 border-b border-outline-variant/70 bg-background/95 px-2 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
            <div>
              <span className="text-on-surface-variant">Presentation Duration</span>
              <span className="ml-2 font-semibold text-on-surface">{pitch.durationMinutes} min</span>
            </div>
            <div>
              <span className="text-on-surface-variant">Estimated Current Duration</span>
              <span className="ml-2 font-semibold text-on-surface">{formatDuration(totalEstimatedSeconds)}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {!hasPitch ? (
              <button
                onClick={generateWithAi}
                disabled={aiState === "generating" || !hasPresentation}
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
            <button
              onClick={exportPdf}
              disabled={!hasPitch}
              className="rounded-md border border-outline-variant bg-surface px-4 py-2 text-sm font-medium text-on-surface transition-colors hover:bg-surface-container-low disabled:opacity-50"
            >
              Export PDF
            </button>
          </div>
        </div>
      </header>

      {error && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-error/20 bg-error-container p-3 text-on-error-container">
          <p className="text-body-md">{error}</p>
          <button onClick={dismissError} className="shrink-0 text-label-sm underline hover:no-underline">Dismiss</button>
        </div>
      )}

      {!hasPresentation ? (
        <section className="mx-auto flex min-h-[560px] max-w-2xl flex-col items-center justify-center px-6 text-center">
          <p className="mb-3 text-label-sm font-semibold uppercase text-primary">Pitch</p>
          <h1 className="mb-4 text-display text-on-surface">Generate your presentation first</h1>
          <p className="mb-8 text-body-lg leading-8 text-on-surface-variant">
            The speech follows your slide order and selected duration, so Smart PFE needs a generated presentation before creating the pitch.
          </p>
          <button
            onClick={() => navigate("/workspace/presentation")}
            className="rounded-md bg-primary px-5 py-2 text-sm font-medium text-on-primary shadow-sm transition-opacity hover:opacity-90"
          >
            Go to Presentation
          </button>
        </section>
      ) : (
        <section className="grid h-[calc(100dvh-185px)] min-h-[620px] grid-cols-1 overflow-hidden rounded-xl border border-outline-variant/70 bg-surface shadow-sm lg:grid-cols-[300px_minmax(0,1fr)] xl:grid-cols-[340px_minmax(0,1fr)]">
          <aside className="min-w-0 border-b border-outline-variant/70 bg-surface px-4 py-5 lg:border-b-0 lg:border-r">
            <nav className="flex h-full max-h-[300px] flex-col gap-1 overflow-y-auto pr-1 lg:max-h-none">
              {slides.map((slide, index) => (
                <button
                  key={slide.slideId}
                  onClick={() => setSelectedSlideId(slide.slideId)}
                  className={cn(
                    "grid w-full grid-cols-[2.25rem_minmax(0,1fr)] items-center gap-2 rounded-md px-3 py-2.5 text-left transition-colors",
                    slide.slideId === selectedSlide?.slideId
                      ? "bg-primary/10 text-primary"
                      : "text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface"
                  )}
                >
                  <span className="text-sm font-semibold tabular-nums">{index + 1}</span>
                  <span className="truncate text-sm font-medium">{slide.title || `Slide ${index + 1}`}</span>
                </button>
              ))}
            </nav>
          </aside>

          {selectedSlide && (
            <main className="min-w-0 overflow-y-auto bg-surface-container-lowest px-4 py-8 sm:px-8 lg:px-12">
              <div className="mx-auto flex max-w-[860px] flex-col">
                <div className="mb-8 min-h-[150px]">
                  <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-2">
                    <p className="text-sm font-semibold text-primary">Slide {selectedIndex + 1}</p>
                    <p className="inline-flex items-center gap-2 whitespace-nowrap rounded-full border border-outline-variant/70 bg-surface px-3 py-1 text-sm text-on-surface-variant">
                      <span>Estimated speaking time</span>
                      <span className="font-semibold text-on-surface">{formatDuration(getCurrentSeconds(selectedSlide))}</span>
                    </p>
                  </div>
                  <h1 className="line-clamp-2 text-[2.25rem] font-semibold leading-tight text-on-surface">
                    {selectedSlide.title}
                  </h1>
                </div>

                <label className="block">
                  <textarea
                    value={selectedSlide.speech}
                    onChange={(event) => updateSlide(selectedSlide.slideId, { speech: event.target.value })}
                    rows={22}
                    className="min-h-[520px] w-full resize-y rounded-md border border-outline-variant/70 bg-surface px-8 py-8 text-[17px] leading-8 text-on-surface shadow-[0_18px_50px_rgba(15,23,42,0.045)] outline-none transition focus:border-primary/60 focus:ring-4 focus:ring-primary/10"
                    placeholder="Generate with AI or start writing the speech for this slide."
                  />
                </label>

                <section className="mt-5 overflow-hidden rounded-md border border-outline-variant/70 bg-surface shadow-[0_12px_32px_rgba(15,23,42,0.035)]">
                  <button
                    onClick={() => setTipsOpen((value) => !value)}
                    className="flex w-full items-center justify-between px-5 py-4 text-left text-sm font-semibold text-on-surface"
                  >
                    Speaker Tips
                    <span className="material-symbols-outlined text-[20px] text-on-surface-variant">
                      {tipsOpen ? "expand_less" : "expand_more"}
                    </span>
                  </button>

                  {tipsOpen && (
                    <div className="border-t border-outline-variant/70 p-5">
                      <textarea
                        value={selectedSlide.tips.join("\n")}
                        onChange={(event) => updateTips(selectedSlide.slideId, event.target.value)}
                        rows={4}
                        className="w-full resize-y rounded-md border border-outline-variant/70 bg-surface-container-lowest p-4 text-body-md leading-7 text-on-surface outline-none focus:border-primary/60 focus:ring-4 focus:ring-primary/10"
                        placeholder="Emphasis, pauses, transitions, or mistakes to avoid."
                      />
                    </div>
                  )}
                </section>

                <div className="mt-6 flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => refineSlideWithAi(selectedSlide.slideId)}
                    disabled={aiState === "generating" || !selectedSlide.speech.trim()}
                    className={aiButtonClass}
                  >
                    {aiState === "generating" ? "Refining..." : "Refine"}
                  </button>
                  <button
                    onClick={() => generateSlideWithAi(selectedSlide.slideId)}
                    disabled={aiState === "generating"}
                    className={aiButtonClass}
                  >
                    {aiState === "generating" ? "Generating..." : "Regenerate"}
                  </button>
                </div>
              </div>
            </main>
          )}
        </section>
      )}
    </div>
  );

}
