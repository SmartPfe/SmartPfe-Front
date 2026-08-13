import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { API_BASE_URL, fetchApi } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useWorkflow } from "@/context/WorkflowContext";
import { normalizePresentation, PresentationDeck, PresentationSlide } from "./Presentation/hooks/usePresentation";
import { formatDuration, normalizePitch, PitchDeck, PitchSlide } from "./Pitch/hooks/usePitch";

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

  const analyzeRecording = async (audioBlob: Blob, actualSeconds: number) => {
    if (!project?._id) throw new Error("Project is not ready yet. Please refresh the page.");
    if (!audioBlob.size) throw new Error("The recording is empty. Please try again.");
    if (actualSeconds < 5) throw new Error("The recording is too short to analyze. Please record at least a short attempt.");

    const formData = new FormData();
    formData.append("projectId", project._id);
    formData.append("actualSeconds", String(actualSeconds));
    formData.append("presentation", JSON.stringify(presentation));
    formData.append("pitch", JSON.stringify(pitch));
    formData.append("objectiveMetrics", JSON.stringify({
      actualSeconds,
      targetSeconds,
      slideCount: slides.length,
      expectedSpeechSeconds: alignedPitchSlides.reduce((sum, slide) => sum + (Number(slide?.estimatedSeconds) || 0), 0),
      mimeType: audioBlob.type,
      sizeBytes: audioBlob.size,
    }));
    formData.append("audio", audioBlob, `jury-defense-${Date.now()}.${recordingExtension(audioBlob.type)}`);

    const response = await fetch(`${API_BASE_URL}/ai/jury-simulation/analyze`, {
      method: "POST",
      headers: authHeaders(),
      body: formData,
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || "AI analysis failed. Please try again.");
    return data.attempt as JuryAttempt;
  };

  const finishDefense = async () => {
    try {
      const actualSeconds = normalizeSeconds(startedAt ? (Date.now() - startedAt) / 1000 : elapsedSeconds);
      setElapsedSeconds(actualSeconds);
      setStage("analyzing");
      setError("");
      const audioBlob = await stopRecording();
      const attempt = await analyzeRecording(audioBlob, actualSeconds);
      setCurrentAttempt(attempt);
      setAttempts((current) => [
        { ...attempt, isCurrent: true },
        ...current.map((item) => ({
          ...item,
          isCurrent:
            item.status === "completed" &&
            item.presentationVersion === attempt.presentationVersion &&
            item.pitchVersion === attempt.pitchVersion,
        })),
      ]);
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
      <div className="min-h-[calc(100dvh-150px)] rounded-lg border border-outline-variant bg-surface p-md sm:p-xl">
        <div className="flex min-h-[420px] items-center justify-center gap-3 text-on-surface-variant">
          <span className="h-5 w-5 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
          <span className="font-label-md">Loading Jury Simulation...</span>
        </div>
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
      <div className="min-h-[calc(100dvh-150px)] rounded-lg border border-outline-variant bg-surface p-md sm:p-xl">
        <div className="mx-auto flex min-h-[520px] w-full max-w-lg flex-col items-center justify-center text-center">
          <span className="mb-5 h-12 w-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
          <h1 className="text-headline-lg text-on-surface">Analyzing your defense...</h1>
          <p className="mt-2 w-full max-w-md text-body-md text-on-surface-variant">
            Smart PFE is comparing your recording with the presentation and expected pitch.
          </p>
        </div>
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
    <div className="w-full min-w-0 min-h-[calc(100dvh-150px)] rounded-lg border border-outline-variant bg-surface">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-xl p-md sm:p-xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <p className="mb-2 text-label-sm font-semibold uppercase text-primary">Final step</p>
            <h1 className="text-headline-lg text-on-surface">Jury Simulation</h1>
            <p className="mt-2 max-w-3xl text-body-md leading-7 text-on-surface-variant">
              Practice your PFE defense in realistic conditions using your generated slides, pitch, and microphone recording.
            </p>
          </div>
          {latestCurrentAttempt && (
            <button
              type="button"
              onClick={() => {
                setCurrentAttempt(latestCurrentAttempt);
                setStage("results");
              }}
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-outline-variant bg-surface-container-low px-4 text-label-md font-semibold text-on-surface hover:bg-surface-container sm:w-auto"
            >
              <span className="material-symbols-outlined text-[18px]">analytics</span>
              Latest assessment
            </button>
          )}
        </div>

        {error && (
          <div className="flex items-start gap-3 rounded-md border border-error/30 bg-error/5 p-4 text-body-sm text-on-surface">
            <span className="material-symbols-outlined text-error">error</span>
            <div>
              <p className="font-semibold text-error">Simulation needs attention</p>
              <p className="mt-1 text-on-surface-variant">{error}</p>
            </div>
          </div>
        )}

        {olderAttemptsExist && (
          <div className="flex items-start gap-3 rounded-md border border-outline-variant bg-surface-container-low p-4 text-body-sm text-on-surface-variant">
            <span className="material-symbols-outlined text-primary">history</span>
            <p>Your previous defense attempts were based on an older version of your presentation or pitch.</p>
          </div>
        )}

        <section className="grid min-w-0 gap-md lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="min-w-0 rounded-lg border border-outline-variant bg-surface-container-lowest p-md sm:p-lg">
            <h2 className="text-headline-sm text-on-surface">Prepare</h2>
            <div className="mt-lg grid gap-3">
              <ReadinessRow
                icon="present_to_all"
                label="Presentation"
                value={hasPresentation ? `${slides.length} slides ready` : "Missing"}
                ready={hasPresentation}
                action={!hasPresentation ? <Link to="/workspace/presentation" className="text-label-sm font-semibold text-primary">Open</Link> : null}
              />
              <ReadinessRow
                icon="campaign"
                label="Pitch"
                value={hasPitch ? `${alignedPitchSlides.filter((slide) => getPitchSpeech(slide)).length} slide speeches ready` : "Missing"}
                ready={hasPitch}
                action={!hasPitch ? <Link to="/workspace/pitch" className="text-label-sm font-semibold text-primary">Open</Link> : null}
              />
              <ReadinessRow icon="timer" label="Target Duration" value={formatDuration(targetSeconds)} ready />
              <ReadinessRow
                icon="mic"
                label="Microphone"
                value={micLabel(micStatus)}
                ready={micStatus === "ready"}
                action={
                  <button
                    type="button"
                    onClick={checkMicrophone}
                    className="text-label-sm font-semibold text-primary disabled:text-outline"
                    disabled={micStatus === "checking"}
                  >
                    {micStatus === "checking" ? "Checking" : "Check"}
                  </button>
                }
              />
            </div>

            <div className="mt-lg rounded-md border border-outline-variant bg-surface-container-low p-4 text-body-sm text-on-surface-variant">
              Your recording will be sent to our AI service to analyze your defense performance.
              Avoid including sensitive or confidential information while practicing.
            </div>

            <div className="mt-lg flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={startSimulation}
                disabled={!canStart}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-primary px-5 text-label-lg font-semibold text-on-primary shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
              >
                <span className="material-symbols-outlined text-[20px]">radio_button_checked</span>
                Start Simulation
              </button>
              <button
                type="button"
                onClick={loadSimulation}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md border border-outline-variant bg-surface px-5 text-label-lg font-semibold text-on-surface hover:bg-surface-container-low sm:w-auto"
              >
                <span className="material-symbols-outlined text-[20px]">refresh</span>
                Refresh
              </button>
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
    </div>
  );
}

function micLabel(status: MicStatus) {
  if (status === "ready") return "Ready";
  if (status === "denied") return "Not connected";
  if (status === "unavailable") return "Unavailable";
  if (status === "checking") return "Checking...";
  return "Permission needed";
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
    <div className="flex flex-wrap items-center gap-3 rounded-md border border-outline-variant bg-surface p-3 sm:flex-nowrap">
      <span className="material-symbols-outlined text-[22px] text-primary">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-label-md font-semibold text-on-surface">{label}</p>
        <p className="break-words text-body-sm text-on-surface-variant sm:truncate">{value}</p>
      </div>
      {action && <div className="shrink-0">{action}</div>}
      <span className={cn("material-symbols-outlined text-[20px]", ready ? "text-[#10B981]" : "text-outline")}>
        {ready ? "check_circle" : "radio_button_unchecked"}
      </span>
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
    <div className="w-full min-w-0 min-h-[calc(100dvh-150px)] rounded-lg border border-outline-variant bg-surface text-on-surface">
      <div className="flex min-h-[calc(100dvh-150px)] flex-col">
        <header className="flex flex-col gap-3 border-b border-outline-variant p-md sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-3 w-3 rounded-full bg-error animate-pulse" />
            <div>
              <p className="text-label-md font-semibold text-error">Recording</p>
              <p className="text-body-sm text-on-surface-variant">Slide {slideIndex + 1} of {totalSlides}</p>
            </div>
          </div>
          <div className="grid w-full grid-cols-2 gap-3 sm:flex sm:w-auto sm:flex-wrap sm:items-center">
            <TimerPill label="Current" value={formatDuration(elapsedSeconds)} />
            <TimerPill label="Target" value={formatDuration(targetSeconds)} />
            <button
              type="button"
              onClick={onFinish}
              className="col-span-2 inline-flex h-10 items-center justify-center gap-2 rounded-md bg-error px-4 text-label-md font-semibold text-white hover:bg-error/90 sm:col-span-1"
            >
              <span className="material-symbols-outlined text-[18px]">stop_circle</span>
              Finish Defense
            </button>
          </div>
        </header>

        <main className="grid min-w-0 flex-1 gap-md p-sm sm:p-md lg:grid-cols-[minmax(0,1fr)_360px]">
          <section className="flex min-h-[320px] flex-col rounded-lg border border-outline-variant bg-surface-container-lowest p-md sm:min-h-[420px] sm:p-lg">
            <div className="mb-md flex items-center justify-between gap-3">
              <p className="text-label-sm font-semibold uppercase text-primary">Current slide</p>
              <div className="flex items-center gap-2">
                <button type="button" onClick={onPrevious} disabled={slideIndex === 0} className="flex h-9 w-9 items-center justify-center rounded-md border border-outline-variant bg-surface disabled:opacity-40" title="Previous slide">
                  <span className="material-symbols-outlined text-[20px]">chevron_left</span>
                </button>
                <button type="button" onClick={onNext} disabled={slideIndex >= totalSlides - 1} className="flex h-9 w-9 items-center justify-center rounded-md border border-outline-variant bg-surface disabled:opacity-40" title="Next slide">
                  <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                </button>
              </div>
            </div>
            <div className="flex flex-1 flex-col justify-center">
              <h1 className="text-headline-md sm:text-headline-lg text-on-surface break-words">{slide?.title || "Untitled slide"}</h1>
              <ul className="mt-lg space-y-3 text-body-md sm:text-body-lg text-on-surface">
                {(slide?.bullets || []).map((bullet, index) => (
                  <li key={`${bullet}-${index}`} className="flex gap-3">
                    <span className="mt-2 h-2 w-2 rounded-full bg-primary" />
                    <span className="min-w-0 break-words">{bullet}</span>
                  </li>
                ))}
              </ul>
              {slide?.notes && (
                <p className="mt-xl rounded-md border border-outline-variant bg-surface-container-low p-4 text-body-md text-on-surface-variant">
                  {slide.notes}
                </p>
              )}
            </div>
          </section>

          <aside className="min-w-0 rounded-lg border border-outline-variant bg-surface-container-lowest p-md sm:p-lg">
            <p className="text-label-sm font-semibold uppercase text-primary">Speech reference</p>
            <h2 className="mt-2 text-headline-sm text-on-surface break-words">{pitch?.title || slide?.title || "Current slide"}</h2>
            <div className="mt-md max-h-[52dvh] overflow-y-auto pr-1 text-body-md leading-7 text-on-surface-variant">
              {pitch?.speech || "No pitch text is available for this slide."}
            </div>
          </aside>
        </main>
      </div>
    </div>
  );
}

function TimerPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-outline-variant bg-surface-container-low px-3 py-2">
      <p className="text-[11px] font-semibold uppercase text-on-surface-variant">{label}</p>
      <p className="font-mono text-label-lg text-on-surface">{value}</p>
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
    <div className="w-full min-w-0 min-h-[calc(100dvh-150px)] rounded-lg border border-outline-variant bg-surface">
      <div className="mx-auto grid w-full max-w-6xl min-w-0 gap-xl p-md sm:p-xl lg:grid-cols-[minmax(0,1fr)_340px]">
        <main className="min-w-0 space-y-xl">
          <section className="rounded-lg border border-outline-variant bg-surface-container-lowest p-md sm:p-lg">
            <p className="mb-2 text-label-sm font-semibold uppercase text-primary">Defense Assessment</p>
            <div className="flex flex-col gap-lg sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <h1 className="text-headline-lg text-on-surface">{analysis.overallScore} / 100</h1>
                <p className="mt-1 text-headline-sm text-on-surface">{analysis.overallLabel}</p>
                <p className="mt-2 text-body-sm text-on-surface-variant">
                  {attemptVersionLabel(attempt)} - Presentation v{attempt.presentationVersion}, Pitch v{attempt.pitchVersion}
                </p>
              </div>
              <button type="button" onClick={onPracticeAgain} className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-primary px-5 text-label-lg font-semibold text-on-primary hover:bg-primary/90 sm:w-auto">
                <span className="material-symbols-outlined text-[20px]">refresh</span>
                Practice Again
              </button>
            </div>
            <div className="mt-lg grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {scoreCategories.map(([key, label]) => (
                <div key={key} className="rounded-md border border-outline-variant bg-surface p-3">
                  <p className="text-label-sm font-semibold text-on-surface-variant">{label}</p>
                  <p className="mt-1 text-headline-sm text-on-surface">{analysis.categoryScores[key]}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="grid gap-md md:grid-cols-2">
            <FeedbackBlock title="Your strengths" icon="check_circle" tone="good" items={analysis.strengths} />
            <FeedbackBlock title="Improve next time" icon="trending_up" tone="warn" items={analysis.improvements} />
          </section>

          <section className="rounded-lg border border-outline-variant bg-surface-container-lowest p-md sm:p-lg">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-primary">timer</span>
              <div>
                <h2 className="text-headline-sm text-on-surface">Timing</h2>
                <p className="mt-2 text-body-md text-on-surface-variant">{analysis.timing.assessment}</p>
                <p className="mt-2 text-body-sm text-on-surface-variant">
                  Actual {formatDuration(analysis.timing.actualSeconds)} / Target {formatDuration(analysis.timing.targetSeconds)}
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-outline-variant bg-surface-container-lowest p-md sm:p-lg">
            <h2 className="text-headline-sm text-on-surface">Next attempt</h2>
            <ol className="mt-md space-y-3">
              {analysis.actionPlan.map((item, index) => (
                <li key={`${item}-${index}`} className="flex gap-3 text-body-md text-on-surface-variant">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-label-sm font-semibold text-on-primary">{index + 1}</span>
                  <span className="min-w-0 break-words">{item}</span>
                </li>
              ))}
            </ol>
          </section>

          <section className="rounded-lg border border-outline-variant bg-surface-container-lowest p-md sm:p-lg">
            <h2 className="text-headline-sm text-on-surface">Slide-by-slide feedback</h2>
            <div className="mt-md space-y-3">
              {analysis.sectionFeedback.length ? analysis.sectionFeedback.map((section) => (
                <details key={`${section.slideNumber}-${section.slideTitle}`} className="rounded-md border border-outline-variant bg-surface p-4">
                  <summary className="cursor-pointer text-label-lg font-semibold text-on-surface break-words">
                    Slide {section.slideNumber} - {section.slideTitle}
                  </summary>
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <MiniList title="Good" items={section.strengths} />
                    <MiniList title="Improve" items={section.improvements} />
                  </div>
                  {section.observations.length > 0 && (
                    <div className="mt-4">
                      <MiniList title="Observations" items={section.observations} />
                    </div>
                  )}
                </details>
              )) : (
                <p className="text-body-md text-on-surface-variant">No slide-specific feedback was returned for this attempt.</p>
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
    ? "border-[#10B981]/30 bg-[#10B981]/5 text-[#047857]"
    : "border-[#F59E0B]/30 bg-[#F59E0B]/5 text-[#B45309]";

  return (
    <section className={cn("rounded-lg border p-md sm:p-lg", toneClass)}>
      <h2 className="flex items-center gap-2 text-label-lg font-semibold uppercase">
        <span className="material-symbols-outlined text-[20px]">{icon}</span>
        {title}
      </h2>
      <ul className="mt-md space-y-2 text-body-md text-on-surface">
        {items.length ? items.map((item, index) => (
          <li key={`${item}-${index}`} className="flex gap-2">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-current" />
            <span className="min-w-0 break-words">{item}</span>
          </li>
        )) : (
          <li className="text-on-surface-variant">No item was returned for this category.</li>
        )}
      </ul>
    </section>
  );
}

function MiniList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h3 className="text-label-md font-semibold text-on-surface">{title}</h3>
      <ul className="mt-2 space-y-2 text-body-sm text-on-surface-variant">
        {items.length ? items.map((item, index) => (
          <li key={`${title}-${item}-${index}`} className="flex gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
            <span className="min-w-0 break-words">{item}</span>
          </li>
        )) : (
          <li>No feedback for this item.</li>
        )}
      </ul>
    </div>
  );
}

function AttemptHistory({ attempts, onSelectAttempt, selectedId }: { attempts: JuryAttempt[]; onSelectAttempt: (attempt: JuryAttempt) => void; selectedId?: string }) {
  return (
    <aside className="min-w-0 rounded-lg border border-outline-variant bg-surface-container-lowest p-md sm:p-lg">
      <h2 className="text-headline-sm text-on-surface">Previous Attempts</h2>
      <div className="mt-md space-y-3">
        {attempts.length ? attempts.map((attempt) => (
          <button
            key={attempt._id || attempt.attemptNumber}
            type="button"
            onClick={() => onSelectAttempt(attempt)}
            className={cn(
              "w-full rounded-md border p-4 text-left transition hover:bg-surface-container-low",
              selectedId === attempt._id ? "border-primary bg-primary/5" : "border-outline-variant bg-surface"
            )}
          >
            <div className="flex items-center justify-between gap-3">
              <span className="min-w-0 text-label-lg font-semibold text-on-surface break-words">Attempt #{attempt.attemptNumber}</span>
              <span className="text-headline-sm text-on-surface">{attempt.analysis?.overallScore ?? 0}</span>
            </div>
            <p className={cn("mt-1 text-body-sm", attempt.isCurrent ? "text-[#047857]" : "text-on-surface-variant")}>
              {attemptVersionLabel(attempt)}
            </p>
            <p className="mt-1 text-body-sm text-on-surface-variant">{formatDuration(attempt.actualSeconds)} recorded</p>
          </button>
        )) : (
          <p className="rounded-md border border-dashed border-outline-variant p-4 text-body-sm text-on-surface-variant">
            No previous attempts yet.
          </p>
        )}
      </div>
    </aside>
  );
}

