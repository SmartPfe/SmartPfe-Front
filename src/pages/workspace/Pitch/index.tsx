import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import InfoTooltip from "@/components/ui/InfoTooltip";
import {
  estimateSpeechSeconds,
  formatDuration,
  getLanguageLabel,
  normalizeLanguage,
  PitchSlide,
  usePitch,
} from "./hooks/usePitch";
import AiBackgroundBanner from "@/components/ai/AiBackgroundBanner";
import HugeiconsIcon from "@/components/ui/HugeiconsIcon";
import SaveStatusHeader from "@/components/ui/SaveStatusHeader";
import AiActionToolbar from "@/components/ai/AiActionToolbar";

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
        <p className="text-sm font-medium text-on-surface-variant">Loading pitch...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-[1440px] flex-col h-full pb-32">
      {/* Header Section */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-primary">Oral Defense Speech</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-on-surface flex items-center">
            Pitch Speech
            <InfoTooltip
              label="Speech"
              tooltip="Craft the exact spoken script and timing for every slide of your defense presentation."
            />
          </h1>
          <p className="text-sm text-on-surface-variant max-w-[48rem] mt-1.5 leading-relaxed">
            Write and rehearse your full oral presentation speech with live time estimates and speaker delivery tips.
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
        moduleName="Pitch & Defense Speech"
        action={aiState}
        onCancel={cancelAi}
      />

      {/* Speaking Duration Status Bar */}
      <div className="mb-6 rounded-2xl border border-outline-variant/80 bg-surface-container-lowest p-3.5 sm:p-4 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Target Duration:</span>
              <span className="text-sm font-bold font-mono text-on-surface">{pitch.durationMinutes} min</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Estimated Speech:</span>
              <span className="text-sm font-bold font-mono text-primary">{formatDuration(totalEstimatedSeconds)}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={exportPdf}
            disabled={!hasPitch}
            className="inline-flex items-center gap-2 h-8 px-3.5 rounded-lg border border-outline-variant/80 bg-surface text-xs font-bold text-on-surface hover:bg-surface-container transition-all shadow-2xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <HugeiconsIcon icon="book-open" size={15} strokeWidth={1.8} className="text-primary" />
            <span>Export Speech PDF</span>
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
        refineDisabledTitle="Generate speech before refining"
        refinePlaceholder="Tell AI what to refine across the entire pitch speech (e.g., 'Make the speech more engaging and confident for an academic jury')..."
        showTranslate={shouldShowTranslate}
        translateLabel={`Translate to ${getLanguageLabel(projectLanguage)}`}
        primaryAction={
          selectedSlide ? (
            <button
              type="button"
              onClick={() => generateSlideWithAi(selectedSlide.slideId)}
              disabled={isAiBusy}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 h-9 px-4 bg-primary text-on-primary rounded-lg text-[13px] font-semibold tracking-tight hover:bg-primary/90 transition-all duration-150 shadow-2xs active:scale-[0.98] disabled:opacity-50 select-none cursor-pointer"
            >
              <HugeiconsIcon icon="refresh" size={15} strokeWidth={2} />
              <span>Regenerate Slide</span>
            </button>
          ) : undefined
        }
      />

      {error && (
        <div className="mb-6 p-3.5 rounded-xl bg-error-container text-on-error-container border border-error/20 flex items-center justify-between gap-3 shadow-2xs">
          <p className="text-sm font-medium">{error}</p>
          <button onClick={dismissError} className="shrink-0 text-xs font-semibold underline hover:no-underline">
            Dismiss
          </button>
        </div>
      )}

      {!hasPresentation ? (
        <section className="mx-auto flex min-h-[520px] max-w-xl flex-col items-center justify-center px-6 text-center rounded-2xl border border-outline-variant/80 bg-surface-container-lowest shadow-2xs">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20">
            <HugeiconsIcon icon="presentation" size={32} strokeWidth={1.8} />
          </div>
          <h2 className="mb-2 text-2xl font-bold tracking-tight text-on-surface">Generate your presentation first</h2>
          <p className="mb-6 text-sm text-on-surface-variant leading-relaxed">
            The speech script aligns directly with your slide structure and duration. Generate your presentation slides before crafting the speech.
          </p>
          <button
            type="button"
            onClick={() => navigate("/workspace/presentation")}
            className="inline-flex items-center gap-2 h-9 px-5 rounded-lg bg-primary text-on-primary text-xs font-bold shadow-2xs hover:bg-primary/90 transition-all cursor-pointer"
          >
            <span>Go to Presentation</span>
            <HugeiconsIcon icon="arrow-right" size={14} strokeWidth={2} />
          </button>
        </section>
      ) : (
        <section className="grid min-h-[580px] grid-cols-1 overflow-hidden rounded-2xl border border-outline-variant/80 bg-surface shadow-2xs lg:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="min-w-0 border-b border-outline-variant/80 bg-surface-container-lowest px-3 py-4 lg:border-b-0 lg:border-r">
            <div className="mb-3 px-2 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-outline-variant">Slides</span>
              <span className="text-xs font-semibold text-primary">{slides.length} total</span>
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
                    <span className="text-xs font-bold uppercase tracking-wider text-primary">Slide {selectedIndex + 1}</span>
                    <span className="inline-flex items-center gap-1.5 rounded-lg border border-outline-variant/80 bg-surface px-2.5 py-1 text-xs text-on-surface-variant font-medium shadow-2xs">
                      <HugeiconsIcon icon="clock" size={13} strokeWidth={1.8} className="text-primary" />
                      <span>Speaking duration:</span>
                      <span className="font-bold text-on-surface font-mono">{formatDuration(getCurrentSeconds(selectedSlide))}</span>
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
                      placeholder="Generate with AI or start drafting the oral speech for this slide..."
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
                        <span>Speaker Delivery Tips</span>
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
                          placeholder="Emphasis, pauses, transitions, or mistakes to avoid."
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
