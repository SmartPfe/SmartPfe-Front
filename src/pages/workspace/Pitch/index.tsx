import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  estimateSpeechSeconds,
  formatDuration,
  getLanguageLabel,
  normalizeLanguage,
  PitchSlide,
  usePitch,
} from "./hooks/usePitch";

const aiButtonClass =
  "px-5 py-2 rounded-md border border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5 text-primary text-label-md font-semibold hover:from-primary/10 hover:to-secondary/10 transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed disabled:grayscale";
const translateButtonClass =
  "px-5 py-2 rounded-md border border-secondary/30 bg-secondary-container/60 text-secondary text-label-md font-semibold hover:bg-secondary-container transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed disabled:grayscale";

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
    projectLanguage,
    loading,
    aiState,
    error,
    updatePitch,
    generateWithAi,
    refineWithAi,
    generateSlideWithAi,
    refineSlideWithAi,
    translateSlideWithAi,
    dismissError,
  } = usePitch();

  const [selectedSlideId, setSelectedSlideId] = useState<string | null>(null);
  const [tipsOpen, setTipsOpen] = useState(true);
  const [deckRefineOpen, setDeckRefineOpen] = useState(false);
  const [deckRefineInstructions, setDeckRefineInstructions] = useState("");
  const [slideRefineOpen, setSlideRefineOpen] = useState(false);
  const [slideRefineInstructions, setSlideRefineInstructions] = useState("");
  const deckRefinePopoverRef = useRef<HTMLDivElement>(null);
  const slideRefinePopoverRef = useRef<HTMLDivElement>(null);

  const slides = pitch.slides;
  const selectedSlide = slides.find((slide) => slide.slideId === selectedSlideId) || slides[0];
  const selectedIndex = selectedSlide ? slides.findIndex((slide) => slide.slideId === selectedSlide.slideId) : -1;
  const hasPresentation = slides.length > 0;
  const hasPitch = slides.some((slide) => slide.speech.trim());
  const isAiIdle = aiState === "idle";
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

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (deckRefinePopoverRef.current && !deckRefinePopoverRef.current.contains(target)) {
        setDeckRefineOpen(false);
      }
      if (slideRefinePopoverRef.current && !slideRefinePopoverRef.current.contains(target)) {
        setSlideRefineOpen(false);
      }
    };

    if (deckRefineOpen || slideRefineOpen) {
      document.addEventListener("mousedown", handlePointerDown);
    }

    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [deckRefineOpen, slideRefineOpen]);

  useEffect(() => {
    setSlideRefineOpen(false);
    setSlideRefineInstructions("");
  }, [selectedSlide?.slideId]);

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

  const handleDeckRefineSubmit = async () => {
    await refineWithAi(deckRefineInstructions);
    setDeckRefineInstructions("");
    setDeckRefineOpen(false);
  };

  const handleSlideRefineSubmit = async () => {
    if (!selectedSlide) return;
    await refineSlideWithAi(selectedSlide.slideId, slideRefineInstructions);
    setSlideRefineInstructions("");
    setSlideRefineOpen(false);
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
      <header className="sticky top-0 z-20 -mx-2 border-b border-outline-variant/80 bg-surface/90 px-4 py-3.5 backdrop-blur-md">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Presentation Duration</span>
              <span className="text-sm font-bold text-on-surface font-mono">{pitch.durationMinutes} min</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Estimated Current Duration</span>
              <span className="text-sm font-bold text-primary font-mono">{formatDuration(totalEstimatedSeconds)}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <style>{`
              @keyframes pitch-popover-in {
                from { opacity: 0; transform: translateY(-4px) scale(0.98); }
                to { opacity: 1; transform: translateY(0) scale(1); }
              }
            `}</style>
            {!hasPitch ? (
              <button
                onClick={generateWithAi}
                disabled={!isAiIdle || !hasPresentation}
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
              <div className="relative" ref={deckRefinePopoverRef}>
                <button
                  onClick={() => setDeckRefineOpen(true)}
                  disabled={!isAiIdle}
                  className={aiButtonClass}
                >
                  {aiState === "refining" ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      Refining...
                    </span>
                  ) : "Refine with AI"}
                </button>

                {deckRefineOpen && (
                  <div
                    className="absolute right-0 top-full z-30 mt-2 w-[min(22rem,calc(100vw-2rem))] rounded-xl border border-outline-variant bg-surface-bright p-3.5 shadow-xl"
                    style={{ animation: "pitch-popover-in 150ms ease-out" }}
                  >
                    <textarea
                      value={deckRefineInstructions}
                      onChange={(event) => setDeckRefineInstructions(event.target.value)}
                      placeholder="Tell AI what you'd like to improve (optional)..."
                      rows={4}
                      className="w-full resize-none rounded-lg border border-outline-variant/80 bg-surface px-3 py-2 text-sm text-on-surface outline-none transition-colors placeholder:text-on-surface-variant/60 focus:border-primary focus:ring-2 focus:ring-primary/15"
                      autoFocus
                    />
                    <div className="mt-3 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setDeckRefineInstructions("");
                          setDeckRefineOpen(false);
                        }}
                        className="px-3 py-1.5 rounded-lg border border-outline-variant bg-surface text-xs font-semibold text-on-surface hover:bg-surface-container transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleDeckRefineSubmit}
                        disabled={aiState === "refining"}
                        className="px-3 py-1.5 rounded-lg bg-primary text-xs font-semibold text-on-primary hover:bg-primary/90 transition-all disabled:opacity-50"
                      >
                        {aiState === "refining" ? "Refining..." : "Refine"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
            {shouldShowTranslate && selectedSlide && (
              <button
                onClick={() => translateSlideWithAi(selectedSlide.slideId)}
                disabled={!isAiIdle}
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
            <button
              onClick={exportPdf}
              disabled={!hasPitch}
              className="rounded-lg border border-outline-variant/80 bg-surface px-4 py-2 text-sm font-semibold text-on-surface transition-all hover:bg-surface-container-low disabled:opacity-40 disabled:cursor-not-allowed"
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
          <span className="mb-2 text-xs font-bold uppercase tracking-wider text-primary">Pitch</span>
          <h1 className="mb-3 text-2xl sm:text-3xl font-bold tracking-tight text-on-surface">Generate your presentation first</h1>
          <p className="mb-8 text-sm text-on-surface-variant leading-relaxed">
            The speech follows your slide order and selected duration, so Smart PFE needs a generated presentation before creating the pitch.
          </p>
          <button
            onClick={() => navigate("/workspace/presentation")}
            className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary shadow-xs transition-all hover:bg-primary/90"
          >
            Go to Presentation
          </button>
        </section>
      ) : (
        <section className="grid h-[calc(100dvh-185px)] min-h-[620px] grid-cols-1 overflow-hidden rounded-2xl border border-outline-variant/80 bg-surface shadow-xs lg:grid-cols-[300px_minmax(0,1fr)] xl:grid-cols-[340px_minmax(0,1fr)]">
          <aside className="min-w-0 border-b border-outline-variant/80 bg-surface-container-lowest px-3 py-4 lg:border-b-0 lg:border-r">
            <nav className="flex h-full max-h-[300px] flex-col gap-1.5 overflow-y-auto pr-1 lg:max-h-none">
              {slides.map((slide, index) => (
                <button
                  key={slide.slideId}
                  onClick={() => setSelectedSlideId(slide.slideId)}
                  className={cn(
                    "grid w-full grid-cols-[2rem_minmax(0,1fr)] items-center gap-2.5 rounded-xl px-3 py-2.5 text-left transition-all",
                    slide.slideId === selectedSlide?.slideId
                      ? "border border-primary/40 bg-primary/10 text-primary shadow-xs font-semibold"
                      : "border border-transparent text-on-surface-variant hover:bg-surface-container-low/60 hover:text-on-surface"
                  )}
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-md border border-outline-variant/80 bg-surface text-xs font-bold text-primary font-mono">{index + 1}</span>
                  <span className="truncate text-xs sm:text-sm font-medium">{slide.title || `Slide ${index + 1}`}</span>
                </button>
              ))}
            </nav>
          </aside>

          {selectedSlide && (
            <main className="min-w-0 overflow-y-auto bg-surface px-4 py-8 sm:px-8 lg:px-12">
              <div className="mx-auto flex max-w-[860px] flex-col">
                <div className="mb-6">
                  <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-primary">Slide {selectedIndex + 1}</span>
                    <span className="inline-flex items-center gap-2 whitespace-nowrap rounded-full border border-outline-variant/80 bg-surface-container-lowest px-3 py-1 text-xs text-on-surface-variant font-medium shadow-xs">
                      <span>Estimated speaking time:</span>
                      <span className="font-bold text-on-surface font-mono">{formatDuration(getCurrentSeconds(selectedSlide))}</span>
                    </span>
                  </div>
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-on-surface leading-snug">
                    {selectedSlide.title}
                  </h1>
                </div>

                <div className="rounded-2xl border border-outline-variant/80 bg-surface-container-lowest p-6 sm:p-8 shadow-xs">
                  <label className="block">
                    <textarea
                      value={selectedSlide.speech}
                      onChange={(event) => updateSlide(selectedSlide.slideId, { speech: event.target.value })}
                      rows={18}
                      className="min-h-[440px] w-full resize-y rounded-xl border border-outline-variant/80 bg-surface p-5 sm:p-6 text-sm sm:text-base leading-relaxed text-on-surface outline-none transition-all placeholder:text-on-surface-variant/60 focus:border-primary focus:ring-2 focus:ring-primary/15"
                      placeholder="Generate with AI or start writing the speech for this slide."
                    />
                  </label>

                  <section className="mt-5 overflow-hidden rounded-xl border border-outline-variant/80 bg-surface shadow-xs">
                    <button
                      onClick={() => setTipsOpen((value) => !value)}
                      className="flex w-full items-center justify-between px-5 py-3.5 text-left text-sm font-semibold text-on-surface hover:bg-surface-container-low/40 transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px] text-primary">tips_and_updates</span>
                        Speaker Tips
                      </span>
                      <span className="material-symbols-outlined text-[20px] text-on-surface-variant">
                        {tipsOpen ? "expand_less" : "expand_more"}
                      </span>
                    </button>

                    {tipsOpen && (
                      <div className="border-t border-outline-variant/80 p-5">
                        <textarea
                          value={selectedSlide.tips.join("\n")}
                          onChange={(event) => updateTips(selectedSlide.slideId, event.target.value)}
                          rows={4}
                          className="w-full resize-y rounded-lg border border-outline-variant/80 bg-surface-container-lowest p-4 text-xs sm:text-sm leading-relaxed text-on-surface outline-none transition-all placeholder:text-on-surface-variant/60 focus:border-primary focus:ring-2 focus:ring-primary/15"
                          placeholder="Emphasis, pauses, transitions, or mistakes to avoid."
                        />
                      </div>
                    )}
                  </section>

                  <div className="mt-6 flex flex-wrap items-center gap-2">
                    <div className="relative" ref={slideRefinePopoverRef}>
                      <button
                        onClick={() => setSlideRefineOpen(true)}
                        disabled={!isAiIdle || !selectedSlide.speech.trim()}
                        className={aiButtonClass}
                      >
                        {aiState === "refining" ? "Refining..." : "Refine with AI"}
                      </button>

                      {slideRefineOpen && (
                        <div
                          className="absolute left-0 bottom-full z-30 mb-2 w-[min(22rem,calc(100vw-2rem))] rounded-xl border border-outline-variant bg-surface-bright p-3.5 shadow-xl"
                          style={{ animation: "pitch-popover-in 150ms ease-out" }}
                        >
                          <textarea
                            value={slideRefineInstructions}
                            onChange={(event) => setSlideRefineInstructions(event.target.value)}
                            placeholder="Tell AI what you'd like to improve (optional)..."
                            rows={4}
                            className="w-full resize-none rounded-lg border border-outline-variant/80 bg-surface px-3 py-2 text-sm text-on-surface outline-none transition-colors placeholder:text-on-surface-variant/60 focus:border-primary focus:ring-2 focus:ring-primary/15"
                            autoFocus
                          />
                          <div className="mt-3 flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setSlideRefineInstructions("");
                                setSlideRefineOpen(false);
                              }}
                              className="px-3 py-1.5 rounded-lg border border-outline-variant bg-surface text-xs font-semibold text-on-surface hover:bg-surface-container transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={handleSlideRefineSubmit}
                              disabled={aiState === "refining"}
                              className="px-3 py-1.5 rounded-lg bg-primary text-xs font-semibold text-on-primary hover:bg-primary/90 transition-all disabled:opacity-50"
                            >
                              {aiState === "refining" ? "Refining..." : "Refine"}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                    {shouldShowTranslate && (
                      <button
                        onClick={() => translateSlideWithAi(selectedSlide.slideId)}
                        disabled={!isAiIdle}
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
                    <button
                      onClick={() => generateSlideWithAi(selectedSlide.slideId)}
                      disabled={!isAiIdle}
                      className={aiButtonClass}
                    >
                      {aiState === "generating" ? "Generating..." : "Regenerate"}
                    </button>
                  </div>
                </div>
              </div>
            </main>
          )}
        </section>
      )}
    </div>
  );
};
