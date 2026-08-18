import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { API_BASE_URL, fetchApi } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useWorkflow } from "@/context/WorkflowContext";
import { normalizePresentation, PresentationDeck, PresentationSlide } from "./Presentation/hooks/usePresentation";
import { formatDuration, normalizePitch, PitchDeck, PitchSlide } from "./Pitch/hooks/usePitch";
import HugeiconsIcon from "@/components/ui/HugeiconsIcon";
import InfoTooltip from "@/components/ui/InfoTooltip";

type JuryStage = "loading" | "prepare" | "presenting" | "analyzing" | "results";
type MicStatus = "unknown" | "checking" | "ready" | "denied" | "unavailable";

type CategoryScores = {
  delivery: number;
  clarity: number;
  content: number;
  timing: number;
  structure: number;
};

type SectionFeedback = {
  slideNumber: number;
  slideTitle: string;
  strengths: string[];
  improvements: string[];
  observations: string[];
};

type JuryAnalysis = {
  overallScore: number;
  overallLabel: string;
  categoryScores: CategoryScores;
  timing: {
    targetSeconds: number;
    actualSeconds: number;
    differenceSeconds: number;
    assessment: string;
  };
  fillerWords: {
    total: number;
    mostFrequent: string[];
    examples: string[];
  };
  strengths: string[];
  improvements: string[];
  sectionFeedback: SectionFeedback[];
  actionPlan: string[];
};

type JuryAttempt = {
  _id?: string;
  attemptNumber: number;
  presentationVersion: number;
  pitchVersion: number;
  targetSeconds: number;
  actualSeconds: number;
  analysis: JuryAnalysis;
  status: "completed" | "failed";
  isCurrent?: boolean;
  createdAt?: string;
};

const scoreCategories: Array<[keyof CategoryScores, string]> = [
  ["delivery", "Delivery"],
  ["content", "Content"],
  ["clarity", "Clarity"],
  ["timing", "Timing"],
  ["structure", "Structure"],
];

const normalizeSeconds = (value: number) => Math.max(0, Math.round(value));

const supportedRecordingType = () => {
  if (typeof MediaRecorder === "undefined") return "";
  return [
    "audio/ogg;codecs=opus",
    "audio/ogg",
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
  ].find((type) => MediaRecorder.isTypeSupported(type)) || "";
};

const recordingExtension = (mimeType = "") => {
  const value = mimeType.toLowerCase();
  if (value.includes("ogg")) return "ogg";
  if (value.includes("mp4")) return "m4a";
  if (value.includes("mpeg") || value.includes("mp3")) return "mp3";
  if (value.includes("wav")) return "wav";
  return "webm";
};

const authHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const attemptVersionLabel = (attempt: JuryAttempt) =>
  attempt.isCurrent ? "Current version" : "Based on an older version";

const getPitchSpeech = (slide?: PitchSlide | null) => String(slide?.speech || "").trim();

const alignPitchToPresentation = (pitch: PitchDeck, slides: PresentationSlide[]) => {
  const pitchBySlideId = new Map(pitch.slides.map((slide) => [slide.slideId, slide]));
  return slides.map((slide, index) => pitchBySlideId.get(slide.id) || pitch.slides[index] || null);
};

export default function JurySimulation() {
  const { refreshWorkflow } = useWorkflow();
  const [stage, setStage] = useState<JuryStage>("loading");
  const [project, setProject] = useState<any>(null);
  const [presentation, setPresentation] = useState<PresentationDeck>(normalizePresentation());
  const [pitch, setPitch] = useState<PitchDeck>(normalizePitch());
  const [attempts, setAttempts] = useState<JuryAttempt[]>([]);
  const [currentAttempt, setCurrentAttempt] = useState<JuryAttempt | null>(null);
  const [micStatus, setMicStatus] = useState<MicStatus>("unknown");
  const [error, setError] = useState("");
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  const slides = presentation.slides;
  const alignedPitchSlides = useMemo(() => alignPitchToPresentation(pitch, slides), [pitch, slides]);
  const targetSeconds = (presentation.durationMinutes || pitch.durationMinutes || 10) * 60;
  const hasPresentation = slides.length > 0;
  const hasPitch = hasPresentation
    ? alignedPitchSlides.some((slide) => getPitchSpeech(slide))
    : pitch.slides.some((slide) => getPitchSpeech(slide));
  const canStart = hasPresentation && hasPitch && micStatus !== "denied" && micStatus !== "unavailable" && stage !== "analyzing";
  const currentSlide = slides[activeSlideIndex];
  const currentPitch = alignedPitchSlides[activeSlideIndex] || pitch.slides[activeSlideIndex];
  const olderAttemptsExist = attempts.some((attempt) => !attempt.isCurrent);
  const latestCurrentAttempt = useMemo(
    () => attempts.find((attempt) => attempt.isCurrent && attempt.status === "completed") || null,
    [attempts]
  );

  const loadSimulation = useCallback(async () => {
    setStage("loading");
    setError("");
    try {
      const projectData = await fetchApi("/projects/my-project");
      const [presentationData, pitchData, juryData] = await Promise.all([
        fetchApi(`/projects/${projectData._id}/presentation`),
        fetchApi(`/projects/${projectData._id}/pitch`),
        fetchApi(`/projects/${projectData._id}/jury-simulation`),
      ]);

      setProject(projectData);
      setPresentation(normalizePresentation(presentationData.presentation || {}));
      setPitch(normalizePitch(pitchData.pitch || {}));
      setAttempts(Array.isArray(juryData.attempts) ? juryData.attempts : []);
      setCurrentAttempt(null);
      setActiveSlideIndex(0);
      setStage("prepare");
    } catch (err: any) {
      setError(err.message || "Failed to load Jury Simulation. Please refresh the page.");
      setStage("prepare");
    }
  }, []);

  useEffect(() => {
    loadSimulation();
  }, [loadSimulation]);

  useEffect(() => {
    const checkPermission = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setMicStatus("unavailable");
        return;
      }

      try {
        const permission = await navigator.permissions?.query({ name: "microphone" as PermissionName });
        if (permission?.state === "granted") setMicStatus("ready");
        if (permission?.state === "denied") setMicStatus("denied");
        if (permission) {
          permission.onchange = () => {
            if (permission.state === "granted") setMicStatus("ready");
            if (permission.state === "denied") setMicStatus("denied");
            if (permission.state === "prompt") setMicStatus("unknown");
          };
        }
      } catch {
        setMicStatus("unknown");
      }
    };

    checkPermission();
  }, []);

  useEffect(() => {
    if (stage !== "presenting" || !startedAt) return;
    const interval = window.setInterval(() => {
      setElapsedSeconds(normalizeSeconds((Date.now() - startedAt) / 1000));
    }, 500);
    return () => window.clearInterval(interval);
  }, [stage, startedAt]);

  useEffect(() => {
    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      if (stage !== "presenting") return;
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", warnBeforeUnload);
    return () => window.removeEventListener("beforeunload", warnBeforeUnload);
  }, [stage]);

  useEffect(() => () => {
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
    streamRef.current?.getTracks().forEach((track) => track.stop());
  }, []);

  const requestMicrophone = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setMicStatus("unavailable");
      setError("Your browser cannot access microphone recording. Try a modern browser such as Chrome or Edge.");
      return null;
    }

    setMicStatus("checking");
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      setMicStatus("ready");
      return stream;
    } catch (err: any) {
      const denied = err?.name === "NotAllowedError" || err?.name === "PermissionDeniedError";
      setMicStatus(denied ? "denied" : "unavailable");
      setError(
        denied
          ? "Microphone permission was denied. Enable microphone access in your browser site settings, then try again."
          : "Microphone recording could not start. Check that a microphone is connected and not used by another app."
      );
      return null;
    }
  };

  const checkMicrophone = async () => {
    const stream = await requestMicrophone();
    stream?.getTracks().forEach((track) => track.stop());
  };

  const startSimulation = async () => {
    if (!hasPresentation || !hasPitch) return;
    const stream = await requestMicrophone();
    if (!stream) return;

    try {
      const mimeType = supportedRecordingType();
      chunksRef.current = [];
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      recorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data?.size) chunksRef.current.push(event.data);
      };
      recorder.onerror = () => setError("Recording failed. Please stop and retry the simulation.");
      recorder.start();
      setElapsedSeconds(0);
      setStartedAt(Date.now());
      setActiveSlideIndex(0);
      setCurrentAttempt(null);
      setStage("presenting");
    } catch {
      stream.getTracks().forEach((track) => track.stop());
      setMicStatus("unavailable");
      setError("Recording could not start in this browser. Please try again with another supported browser.");
    }
  };

  const stopRecording = () =>
    new Promise<Blob>((resolve, reject) => {
      const recorder = recorderRef.current;
      const stream = streamRef.current;
      if (!recorder || recorder.state === "inactive") {
        reject(new Error("Recording was not active."));
        return;
      }

      recorder.onstop = () => {
        stream?.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        resolve(new Blob(chunksRef.current, { type: recorder.mimeType || supportedRecordingType() || "audio/webm" }));
      };
      recorder.onerror = () => reject(new Error("Recording failed before it could be saved."));
      recorder.stop();
    });

  const finishDefense = async () => {
    if (stage !== "presenting") return;
    setStage("analyzing");
    setError("");

    try {
      const audioBlob = await stopRecording();
      const projectData = project || (await fetchApi("/projects/my-project"));
      const formData = new FormData();
      const ext = audioBlob.type.includes("ogg") ? "ogg" : audioBlob.type.includes("mp4") ? "m4a" : "webm";
      formData.append("audio", audioBlob, `jury-attempt.${ext}`);
      formData.append("targetSeconds", String(targetSeconds));
      formData.append("actualSeconds", String(elapsedSeconds));

      const response = await fetch(`${API_BASE_URL}/projects/${projectData._id}/jury-simulation/evaluate`, {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to analyze the jury simulation.");
      }

      const attempt = data.attempt;
      setAttempts((current) => [attempt, ...current.filter((item) => item._id !== attempt._id)]);
      setCurrentAttempt(attempt);
      await refreshWorkflow();
      setStage("results");
    } catch (err: any) {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      setError(err.message || "The attempt could not be analyzed. Please try again.");
      setStage("prepare");
    } finally {
      setStartedAt(null);
      recorderRef.current = null;
      chunksRef.current = [];
    }
  };

  const practiceAgain = () => {
    setCurrentAttempt(null);
    setActiveSlideIndex(0);
    setElapsedSeconds(0);
    setError("");
    setStage("prepare");
  };

  if (stage === "loading") {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center">
        <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-sm font-medium text-on-surface-variant">Loading Jury Simulation...</p>
      </div>
    );
  }

  if (stage === "presenting") {
    return (
      <SimulationMode
        slide={currentSlide}
        pitch={currentPitch}
        slideIndex={activeSlideIndex}
        totalSlides={slides.length}
        elapsedSeconds={elapsedSeconds}
        targetSeconds={targetSeconds}
        onPrevious={() => setActiveSlideIndex((index) => Math.max(0, index - 1))}
        onNext={() => setActiveSlideIndex((index) => Math.min(slides.length - 1, index + 1))}
        onFinish={finishDefense}
      />
    );
  }

  if (stage === "analyzing") {
    return (
      <div className="mx-auto flex max-w-xl min-h-[520px] flex-col items-center justify-center text-center p-8 rounded-2xl border border-outline-variant/80 bg-surface-container-lowest shadow-2xs">
        <div className="mb-5 h-12 w-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
        <h1 className="text-2xl font-bold tracking-tight text-on-surface">Analyzing your defense speech...</h1>
        <p className="mt-2 text-sm text-on-surface-variant max-w-md leading-relaxed">
          Smart PFE AI is evaluating your verbal clarity, pacing, slide coverage, and vocal delivery confidence.
        </p>
      </div>
    );
  }

  if (stage === "results" && currentAttempt) {
    return (
      <ResultsView
        attempt={currentAttempt}
        attempts={attempts}
        onPracticeAgain={practiceAgain}
        onSelectAttempt={setCurrentAttempt}
      />
    );
  }

  return (
    <div className="mx-auto flex max-w-[1440px] flex-col h-full pb-32">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-primary">Live Rehearsal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-on-surface flex items-center">
            Jury Simulation
            <InfoTooltip
              label="Defense Rehearsal"
              tooltip="Simulate your live defense presentation with audio recording and instant AI jury feedback."
            />
          </h1>
          <p className="text-sm text-on-surface-variant max-w-2xl mt-1.5 leading-relaxed">
            Practice your PFE defense in realistic conditions using your slides, pitch speech, and live voice recording.
          </p>
        </div>

        {latestCurrentAttempt && (
          <button
            type="button"
            onClick={() => {
              setCurrentAttempt(latestCurrentAttempt);
              setStage("results");
            }}
            className="inline-flex items-center gap-2 h-9 px-4 rounded-lg border border-outline-variant/80 bg-surface text-xs font-bold text-on-surface hover:bg-surface-container transition-all shadow-2xs cursor-pointer"
          >
            <HugeiconsIcon icon="analytics" size={16} strokeWidth={1.8} className="text-primary" />
            <span>Latest Assessment ({latestCurrentAttempt.analysis.overallScore}/100)</span>
          </button>
        )}
      </div>

      {error && (
        <div className="mb-6 p-3.5 rounded-xl bg-error-container text-on-error-container border border-error/20 flex items-center justify-between gap-3 shadow-2xs">
          <p className="text-sm font-medium">{error}</p>
          <button onClick={() => setError("")} className="shrink-0 text-xs font-semibold underline hover:no-underline">
            Dismiss
          </button>
        </div>
      )}

      {olderAttemptsExist && (
        <div className="mb-6 p-3.5 rounded-xl border border-outline-variant/80 bg-surface-container-low text-xs text-on-surface-variant flex items-center gap-2.5">
          <HugeiconsIcon icon="clock" size={16} strokeWidth={1.8} className="text-primary shrink-0" />
          <span>Your earlier defense attempts were recorded on a previous version of the presentation.</span>
        </div>
      )}

      <section className="grid gap-6 md:grid-cols-[1fr_360px]">
        {/* Preparation Check Card */}
        <div className="rounded-2xl border border-outline-variant/80 bg-surface-container-lowest p-6 sm:p-7 shadow-2xs flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-outline-variant mb-4">Readiness Checklist</h2>
            <div className="grid gap-3">
              <ReadinessRow
                icon="presentation"
                label="Presentation Deck"
                value={hasPresentation ? `${slides.length} slides ready` : "Missing slides"}
                ready={hasPresentation}
                action={!hasPresentation ? <Link to="/workspace/presentation" className="text-xs font-bold text-primary hover:underline">Create</Link> : null}
              />
              <ReadinessRow
                icon="book-open"
                label="Pitch Speech"
                value={hasPitch ? `${alignedPitchSlides.filter((slide) => getPitchSpeech(slide)).length} slide speeches ready` : "Missing speech"}
                ready={hasPitch}
                action={!hasPitch ? <Link to="/workspace/pitch" className="text-xs font-bold text-primary hover:underline">Draft</Link> : null}
              />
              <ReadinessRow
                icon="clock"
                label="Target Duration"
                value={formatDuration(targetSeconds)}
                ready
              />
              <ReadinessRow
                icon="mic"
                label="Microphone Audio"
                value={micLabel(micStatus)}
                ready={micStatus === "ready"}
                action={
                  <button
                    type="button"
                    onClick={checkMicrophone}
                    className="text-xs font-bold text-primary hover:underline cursor-pointer disabled:opacity-40"
                    disabled={micStatus === "checking"}
                  >
                    {micStatus === "checking" ? "Checking..." : "Test Mic"}
                  </button>
                }
              />
            </div>
            <div className="mt-5 rounded-xl border border-outline-variant/60 bg-surface-container-low/40 p-3.5 text-xs text-on-surface-variant/80 leading-relaxed">
              Your voice recording will be securely processed by AI to generate a detailed jury review, timing breakdown, and slide-by-slide feedback.
            </div>

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={startSimulation}
                disabled={!canStart}
                className="inline-flex items-center justify-center gap-2 h-10 px-6 rounded-lg bg-primary text-on-primary text-xs font-bold shadow-2xs hover:bg-primary/90 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <HugeiconsIcon icon="play-circle" size={17} strokeWidth={2} />
                <span>Start Live Simulation</span>
              </button>
              <button
                type="button"
                onClick={loadSimulation}
                className="inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-lg border border-outline-variant/80 bg-surface text-xs font-semibold text-on-surface hover:bg-surface-container transition-all cursor-pointer"
              >
                <HugeiconsIcon icon="refresh" size={15} strokeWidth={1.8} />
                <span>Refresh Status</span>
              </button>
            </div>
          </div>
        </div>

        <AttemptHistory
          attempts={attempts}
          onSelectAttempt={(attempt) => {
            setCurrentAttempt(attempt);
            setStage("results");
          }}
        />
      </section>
    </div>
  );
}

function micLabel(status: MicStatus) {
  if (status === "ready") return "Ready to record";
  if (status === "denied") return "Permission denied";
  if (status === "unavailable") return "Not detected";
  if (status === "checking") return "Testing...";
  return "Permission required";
}

function ReadinessRow({
  icon,
  label,
  value,
  ready,
  action,
}: {
  icon: string;
  label: string;
  value: string;
  ready: boolean;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-outline-variant/70 bg-surface p-3.5 transition-all">
      <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
        <HugeiconsIcon icon={icon} size={16} strokeWidth={1.8} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold text-on-surface">{label}</p>
        <p className="truncate text-xs text-on-surface-variant/80 mt-0.5">{value}</p>
      </div>
      {action}
      <HugeiconsIcon
        icon={ready ? "check-circle" : "alert-circle"}
        size={18}
        strokeWidth={1.8}
        className={ready ? "text-secondary" : "text-outline-variant"}
      />
    </div>
  );
}

function SimulationMode({
  slide,
  pitch,
  slideIndex,
  totalSlides,
  elapsedSeconds,
  targetSeconds,
  onPrevious,
  onNext,
  onFinish,
}: {
  slide?: PresentationSlide;
  pitch?: PitchSlide;
  slideIndex: number;
  totalSlides: number;
  elapsedSeconds: number;
  targetSeconds: number;
  onPrevious: () => void;
  onNext: () => void;
  onFinish: () => void;
}) {
  return (
    <div className="min-h-[calc(100dvh-150px)] rounded-2xl border border-outline-variant/80 bg-surface text-on-surface overflow-hidden shadow-2xs">
      <div className="flex min-h-[calc(100dvh-150px)] flex-col">
        <header className="flex flex-col gap-3 border-b border-outline-variant/70 p-4 bg-surface-container-low/40 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-3 w-3 rounded-full bg-error animate-pulse" />
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-error">Recording In Progress</p>
              <p className="text-xs font-semibold text-on-surface">Slide {slideIndex + 1} of {totalSlides}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <TimerPill label="Elapsed" value={formatDuration(elapsedSeconds)} />
            <TimerPill label="Target" value={formatDuration(targetSeconds)} />
            <button
              type="button"
              onClick={onFinish}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-error px-4 text-xs font-bold text-white shadow-2xs hover:bg-error/90 transition-all cursor-pointer"
            >
              <HugeiconsIcon icon="stop-circle" size={16} strokeWidth={2} />
              <span>Finish Defense</span>
            </button>
          </div>
        </header>

        <main className="grid flex-1 gap-5 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_380px] bg-surface-container-lowest">
          <section className="flex min-h-[420px] flex-col rounded-2xl border border-outline-variant/80 bg-surface p-6 sm:p-8 shadow-2xs justify-between">
            <div>
              <div className="mb-4 flex items-center justify-between gap-3 pb-3 border-b border-outline-variant/60">
                <span className="text-xs font-bold uppercase tracking-wider text-primary">Live Slide View</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onPrevious}
                    disabled={slideIndex === 0}
                    className="w-8 h-8 rounded-lg border border-outline-variant/80 bg-surface flex items-center justify-center text-on-surface hover:bg-surface-container disabled:opacity-30 cursor-pointer"
                    title="Previous slide"
                  >
                    <HugeiconsIcon icon="arrow-right" size={14} strokeWidth={2} className="rotate-180" />
                  </button>
                  <button
                    type="button"
                    onClick={onNext}
                    disabled={slideIndex >= totalSlides - 1}
                    className="w-8 h-8 rounded-lg border border-outline-variant/80 bg-surface flex items-center justify-center text-on-surface hover:bg-surface-container disabled:opacity-30 cursor-pointer"
                    title="Next slide"
                  >
                    <HugeiconsIcon icon="arrow-right" size={14} strokeWidth={2} />
                  </button>
                </div>
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-on-surface">{slide?.title || "Untitled slide"}</h1>
              <ul className="mt-6 space-y-3 text-sm sm:text-base text-on-surface">
                {(slide?.bullets || []).map((bullet, index) => (
                  <li key={`${bullet}-${index}`} className="flex items-start gap-3">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                    <span className="leading-relaxed">{bullet}</span>
                  </li>
                ))}
              </ul>
            </div>

            {slide?.notes && (
              <div className="mt-8 rounded-xl border border-outline-variant/70 bg-surface-container-low/40 p-4 text-xs text-on-surface-variant leading-relaxed">
                <span className="font-bold text-on-surface uppercase tracking-wider block mb-1">Speaker Notes:</span>
                {slide.notes}
              </div>
            )}
          </section>

          <aside className="rounded-2xl border border-outline-variant/80 bg-surface p-6 shadow-2xs flex flex-col">
            <span className="text-xs font-bold uppercase tracking-wider text-primary mb-2">Speech Reference Script</span>
            <h2 className="text-sm font-bold text-on-surface pb-3 border-b border-outline-variant/60">{pitch?.title || slide?.title || "Current slide"}</h2>
            <div className="mt-4 flex-1 overflow-y-auto pr-1 text-xs sm:text-sm leading-relaxed text-on-surface-variant font-sans">
              {pitch?.speech || "No pitch script is available for this slide."}
            </div>
          </aside>
        </main>
      </div>
    </div>
  );
}

function TimerPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-outline-variant/80 bg-surface px-3 py-1.5 shadow-2xs">
      <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">{label}</p>
      <p className="font-mono text-xs font-bold text-on-surface">{value}</p>
    </div>
  );
}

function ResultsView({
  attempt,
  attempts,
  onPracticeAgain,
  onSelectAttempt,
}: {
  attempt: JuryAttempt;
  attempts: JuryAttempt[];
  onPracticeAgain: () => void;
  onSelectAttempt: (attempt: JuryAttempt) => void;
}) {
  const analysis = attempt.analysis;

  return (
    <div className="mx-auto flex max-w-[1440px] flex-col h-full pb-32">
      <div className="grid w-full gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <main className="space-y-6">
          <section className="rounded-2xl border border-outline-variant/80 bg-surface-container-lowest p-6 sm:p-7 shadow-2xs">
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-primary">AI Evaluation</span>
            </div>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-outline-variant/60">
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold font-mono text-on-surface tracking-tight">{analysis.overallScore} / 100</h1>
                <p className="mt-1 text-base font-bold text-primary">{analysis.overallLabel}</p>
                <p className="mt-1 text-xs text-on-surface-variant">
                  {attemptVersionLabel(attempt)} · Presentation v{attempt.presentationVersion}, Pitch v{attempt.pitchVersion}
                </p>
              </div>
              <button
                type="button"
                onClick={onPracticeAgain}
                className="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-lg bg-primary text-on-primary text-xs font-bold shadow-2xs hover:bg-primary/90 transition-all cursor-pointer"
              >
                <HugeiconsIcon icon="refresh" size={15} strokeWidth={2} />
                <span>Practice Again</span>
              </button>
            </div>
            <div className="mt-6 grid gap-3 grid-cols-2 sm:grid-cols-5">
              {scoreCategories.map(([key, label]) => (
                <div key={key} className="rounded-xl border border-outline-variant/80 bg-surface p-3.5 text-center shadow-2xs">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">{label}</p>
                  <p className="mt-1 text-xl font-bold font-mono text-on-surface">{analysis.categoryScores[key]}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="grid gap-5 md:grid-cols-2">
            <FeedbackBlock title="Key Strengths" icon="check-circle" tone="good" items={analysis.strengths} />
            <FeedbackBlock title="Areas For Improvement" icon="trending-up" tone="warn" items={analysis.improvements} />
          </section>

          <section className="rounded-2xl border border-outline-variant/80 bg-surface-container-lowest p-6 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
                <HugeiconsIcon icon="clock" size={18} strokeWidth={1.8} />
              </div>
              <div>
                <h2 className="text-sm font-bold text-on-surface tracking-tight">Speech Timing Breakdown</h2>
                <p className="text-xs text-on-surface-variant mt-0.5">{analysis.timing.assessment}</p>
                <p className="text-xs font-semibold text-primary mt-1 font-mono">
                  Actual {formatDuration(analysis.timing.actualSeconds)} / Target {formatDuration(analysis.timing.targetSeconds)}
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-outline-variant/80 bg-surface-container-lowest p-6 shadow-2xs">
            <h2 className="text-sm font-bold uppercase tracking-wider text-outline-variant mb-4">Recommended Action Plan</h2>
            <ol className="space-y-3">
              {analysis.actionPlan.map((item, index) => (
                <li key={`${item}-${index}`} className="flex gap-3 text-xs sm:text-sm text-on-surface">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-on-primary font-mono">{index + 1}</span>
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ol>
          </section>

          <section className="rounded-2xl border border-outline-variant/80 bg-surface-container-lowest p-6 shadow-2xs">
            <h2 className="text-sm font-bold uppercase tracking-wider text-outline-variant mb-4">Slide-by-Slide Analysis</h2>
            <div className="space-y-3">
              {analysis.sectionFeedback.length ? analysis.sectionFeedback.map((section) => (
                <details key={`${section.slideNumber}-${section.slideTitle}`} className="rounded-xl border border-outline-variant/80 bg-surface p-4 shadow-2xs group">
                  <summary className="cursor-pointer text-xs sm:text-sm font-bold text-on-surface flex items-center justify-between">
                    <span>Slide {section.slideNumber} — {section.slideTitle}</span>
                    <HugeiconsIcon icon="chevron-down" size={16} strokeWidth={1.8} className="text-on-surface-variant group-open:rotate-180 transition-transform" />
                  </summary>
                  <div className="mt-4 grid gap-4 md:grid-cols-2 pt-3 border-t border-outline-variant/60">
                    <MiniList title="Positive Observations" items={section.strengths} />
                    <MiniList title="Recommendations" items={section.improvements} />
                  </div>
                </details>
              )) : (
                <p className="text-xs text-on-surface-variant">No slide-specific feedback was recorded for this attempt.</p>
              )}
            </div>
          </section>
        </main>

        <AttemptHistory attempts={attempts} onSelectAttempt={onSelectAttempt} selectedId={attempt._id} />
      </div>
    </div>
  );
}

function FeedbackBlock({ title, icon, tone, items }: { title: string; icon: string; tone: "good" | "warn"; items: string[] }) {
  const toneClass = tone === "good"
    ? "border-secondary/30 bg-secondary/5 text-secondary"
    : "border-amber-500/30 bg-amber-500/5 text-amber-600";

  return (
    <section className={cn("rounded-2xl border p-5 sm:p-6 shadow-2xs", toneClass)}>
      <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
        <HugeiconsIcon icon={icon} size={17} strokeWidth={1.8} />
        {title}
      </h2>
      <ul className="mt-3 space-y-2 text-xs sm:text-sm text-on-surface">
        {items.length ? items.map((item, index) => (
          <li key={`${item}-${index}`} className="flex items-start gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-current" />
            <span className="leading-relaxed">{item}</span>
          </li>
        )) : (
          <li className="text-on-surface-variant">No feedback returned for this category.</li>
        )}
      </ul>
    </section>
  );
}

function MiniList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h3 className="text-xs font-bold text-on-surface mb-2">{title}</h3>
      <ul className="space-y-1.5 text-xs text-on-surface-variant">
        {items.length ? items.map((item, index) => (
          <li key={`${title}-${item}-${index}`} className="flex items-start gap-2">
            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" />
            <span>{item}</span>
          </li>
        )) : (
          <li className="text-on-surface-variant/60">No items in this section.</li>
        )}
      </ul>
    </div>
  );
}

function AttemptHistory({ attempts, onSelectAttempt, selectedId }: { attempts: JuryAttempt[]; onSelectAttempt: (attempt: JuryAttempt) => void; selectedId?: string }) {
  return (
    <aside className="rounded-2xl border border-outline-variant/80 bg-surface-container-lowest p-5 sm:p-6 shadow-2xs h-fit">
      <h2 className="text-xs font-bold uppercase tracking-wider text-outline-variant mb-4">Attempt History</h2>
      <div className="space-y-2.5">
        {attempts.length ? attempts.map((attempt) => (
          <button
            key={attempt._id || attempt.attemptNumber}
            type="button"
            onClick={() => onSelectAttempt(attempt)}
            className={cn(
              "w-full rounded-xl border p-3.5 text-left transition-all duration-150 cursor-pointer shadow-2xs",
              selectedId === attempt._id
                ? "border-primary bg-primary/10"
                : "border-outline-variant/70 bg-surface hover:bg-surface-container"
            )}
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-bold text-on-surface">Attempt #{attempt.attemptNumber}</span>
              <span className="text-sm font-bold font-mono text-primary">{attempt.analysis?.overallScore ?? 0}</span>
            </div>
            <p className={cn("mt-1 text-[11px] font-semibold", attempt.isCurrent ? "text-secondary" : "text-on-surface-variant/70")}>
              {attemptVersionLabel(attempt)}
            </p>
            <p className="mt-0.5 text-[11px] text-on-surface-variant font-mono">{formatDuration(attempt.actualSeconds)} recorded</p>
          </button>
        )) : (
          <p className="rounded-xl border border-dashed border-outline-variant/80 p-4 text-xs text-on-surface-variant text-center">
            No previous attempts recorded.
          </p>
        )}
      </div>
    </aside>
  );
}

