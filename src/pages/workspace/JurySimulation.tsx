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

  // Live Defense Staging State
  const [isRecording, setIsRecording] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  // Live Hardware Testing State
  const [isTestingMic, setIsTestingMic] = useState(false);
  const [micVolume, setMicVolume] = useState(0);
  const [isTestingCam, setIsTestingCam] = useState(false);
  const [camStatus, setCamStatus] = useState<"off" | "checking" | "ready" | "denied" | "unavailable">("off");
  const [isMirrored, setIsMirrored] = useState(true);

  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  // Hardware test refs
  const micStreamRef = useRef<MediaStream | null>(null);
  const micAudioContextRef = useRef<AudioContext | null>(null);
  const micAnimFrameRef = useRef<number | null>(null);
  const camStreamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

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
      setPresentation(normalizePresentation(presentationData.presentation || {}, projectData));
      setPitch(normalizePitch(pitchData.pitch || {}, projectData));
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
      try {
        if (navigator.permissions?.query) {
          const permission = await navigator.permissions.query({ name: "microphone" as PermissionName });
          setMicStatus(permission.state === "granted" ? "ready" : permission.state === "denied" ? "denied" : "unknown");
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
    if (stage !== "presenting" || !startedAt || !isRecording) return;
    const interval = window.setInterval(() => {
      setElapsedSeconds(normalizeSeconds((Date.now() - startedAt) / 1000));
    }, 500);
    return () => window.clearInterval(interval);
  }, [stage, startedAt, isRecording]);

  useEffect(() => {
    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      if (stage !== "presenting" || !isRecording) return;
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", warnBeforeUnload);
    return () => window.removeEventListener("beforeunload", warnBeforeUnload);
  }, [stage, isRecording]);

  // Clean up all hardware testing resources on unmount
  useEffect(() => {
    return () => {
      if (recorderRef.current?.state === "recording") recorderRef.current.stop();
      streamRef.current?.getTracks().forEach((track) => track.stop());

      if (micAnimFrameRef.current) cancelAnimationFrame(micAnimFrameRef.current);
      if (micAudioContextRef.current) {
        micAudioContextRef.current.close().catch(() => {});
      }
      micStreamRef.current?.getTracks().forEach((track) => track.stop());

      camStreamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  // Live Mic Test Controller
  const startMicTest = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setMicStatus("unavailable");
      setError("Microphone access is not supported in this browser.");
      return;
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

      micStreamRef.current = stream;
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      micAudioContextRef.current = audioCtx;
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateVolume = () => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const avg = sum / bufferLength;
        const normalized = Math.min(100, Math.round((avg / 128) * 100));
        setMicVolume(normalized);
        micAnimFrameRef.current = requestAnimationFrame(updateVolume);
      };

      updateVolume();
      setMicStatus("ready");
      setIsTestingMic(true);
    } catch (err: any) {
      const denied = err?.name === "NotAllowedError" || err?.name === "PermissionDeniedError";
      setMicStatus(denied ? "denied" : "unavailable");
      setIsTestingMic(false);
      setError(
        denied
          ? "Microphone access was denied. Please allow microphone permission in your browser settings."
          : "Could not start microphone test. Please verify your microphone connection."
      );
    }
  };

  const stopMicTest = () => {
    if (micAnimFrameRef.current) {
      cancelAnimationFrame(micAnimFrameRef.current);
      micAnimFrameRef.current = null;
    }
    if (micAudioContextRef.current) {
      micAudioContextRef.current.close().catch(() => {});
      micAudioContextRef.current = null;
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((track) => track.stop());
      micStreamRef.current = null;
    }
    setIsTestingMic(false);
    setMicVolume(0);
  };

  const toggleMicTest = () => {
    if (isTestingMic) {
      stopMicTest();
    } else {
      startMicTest();
    }
  };

  // Live Camera Test Controller
  const startCamTest = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setCamStatus("unavailable");
      setError("Camera access is not supported in this browser.");
      return;
    }

    setCamStatus("checking");
    setError("");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });

      camStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
      setCamStatus("ready");
      setIsTestingCam(true);
    } catch (err: any) {
      const denied = err?.name === "NotAllowedError" || err?.name === "PermissionDeniedError";
      setCamStatus(denied ? "denied" : "unavailable");
      setIsTestingCam(false);
      setError(
        denied
          ? "Camera access was denied. Please allow camera permission in your browser settings."
          : "Could not start camera preview. Please check your camera connection."
      );
    }
  };

  const stopCamTest = () => {
    if (camStreamRef.current) {
      camStreamRef.current.getTracks().forEach((track) => track.stop());
      camStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsTestingCam(false);
    setCamStatus("off");
  };

  const toggleCamTest = () => {
    if (isTestingCam) {
      stopCamTest();
    } else {
      startCamTest();
    }
  };

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

  // Step 1: Transition smoothly from Studio into the Podium Lobby (NO instant recording)
  const enterPodium = () => {
    if (!hasPresentation || !hasPitch) return;

    // Stop all preview hardware tests
    stopMicTest();
    stopCamTest();

    setElapsedSeconds(0);
    setActiveSlideIndex(0);
    setIsRecording(false);
    setCountdown(null);
    setCurrentAttempt(null);
    setError("");
    setStage("presenting");
  };

  // Step 2: Triggered by the student when ready to speak
  const beginDefenseRecording = async () => {
    setError("");
    setCountdown(3);

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          executeActualStart();
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const executeActualStart = async () => {
    const stream = await requestMicrophone();
    if (!stream) {
      setCountdown(null);
      return;
    }

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

      // Start live audio visualizer for active recording feedback
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        micAudioContextRef.current = audioCtx;
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 64;
        const source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const updateVolume = () => {
          analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < bufferLength; i++) {
            sum += dataArray[i];
          }
          const avg = sum / bufferLength;
          const normalized = Math.min(100, Math.round((avg / 128) * 100));
          setMicVolume(normalized);
          micAnimFrameRef.current = requestAnimationFrame(updateVolume);
        };

        updateVolume();
      } catch {}

      setElapsedSeconds(0);
      setStartedAt(Date.now());
      setIsRecording(true);
      setCountdown(null);
    } catch {
      stream.getTracks().forEach((track) => track.stop());
      setMicStatus("unavailable");
      setIsRecording(false);
      setCountdown(null);
      setError("Recording could not start in this browser. Please try again with Chrome or Edge.");
    }
  };

  const stopRecording = () =>
    new Promise<Blob>((resolve, reject) => {
      if (micAnimFrameRef.current) {
        cancelAnimationFrame(micAnimFrameRef.current);
        micAnimFrameRef.current = null;
      }
      if (micAudioContextRef.current) {
        micAudioContextRef.current.close().catch(() => {});
        micAudioContextRef.current = null;
      }

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

  const cancelSimulation = () => {
    if (micAnimFrameRef.current) {
      cancelAnimationFrame(micAnimFrameRef.current);
      micAnimFrameRef.current = null;
    }
    if (micAudioContextRef.current) {
      micAudioContextRef.current.close().catch(() => {});
      micAudioContextRef.current = null;
    }
    if (recorderRef.current && recorderRef.current.state === "recording") {
      try {
        recorderRef.current.stop();
      } catch {}
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    recorderRef.current = null;
    chunksRef.current = [];
    setStartedAt(null);
    setElapsedSeconds(0);
    setActiveSlideIndex(0);
    setIsRecording(false);
    setCountdown(null);
    setMicVolume(0);
    setError("");
    setStage("prepare");
  };

  const finishDefense = async () => {
    if (stage !== "presenting") return;

    // Strict 2-minute minimum requirement check (120 seconds)
    if (elapsedSeconds < 120) {
      if (micAnimFrameRef.current) {
        cancelAnimationFrame(micAnimFrameRef.current);
        micAnimFrameRef.current = null;
      }
      if (micAudioContextRef.current) {
        micAudioContextRef.current.close().catch(() => {});
        micAudioContextRef.current = null;
      }
      if (recorderRef.current && recorderRef.current.state === "recording") {
        try {
          recorderRef.current.stop();
        } catch {}
      }
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      recorderRef.current = null;
      chunksRef.current = [];
      setStartedAt(null);
      setElapsedSeconds(0);
      setActiveSlideIndex(0);
      setIsRecording(false);
      setCountdown(null);
      setMicVolume(0);
      setError("The defense rehearsal must be at least 2 minutes (120 seconds) for the AI jury to assess your presentation.");
      setStage("prepare");
      return;
    }

    setStage("analyzing");
    setError("");

    try {
      const audioBlob = await stopRecording();
      const projectData = project || (await fetchApi("/projects/my-project"));
      const formData = new FormData();
      const ext = audioBlob.type.includes("ogg") ? "ogg" : audioBlob.type.includes("mp4") ? "m4a" : "webm";
      formData.append("projectId", projectData._id);
      formData.append("audio", audioBlob, `jury-attempt.${ext}`);
      formData.append("actualSeconds", String(elapsedSeconds));
      formData.append("presentation", JSON.stringify(presentation));
      formData.append("pitch", JSON.stringify(pitch));

      const response = await fetch(`${API_BASE_URL}/ai/jury-simulation/analyze`, {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: formData,
      });

      let data: any = {};
      try {
        data = await response.json();
      } catch {
        throw new Error("Invalid response received from the jury evaluation service. Please retry.");
      }

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
      setIsRecording(false);
      setCountdown(null);
      setMicVolume(0);
    }
  };

  const practiceAgain = () => {
    setCurrentAttempt(null);
    setActiveSlideIndex(0);
    setElapsedSeconds(0);
    setIsRecording(false);
    setCountdown(null);
    setMicVolume(0);
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
        isRecording={isRecording}
        countdown={countdown}
        liveVolume={micVolume}
        onStartRecording={beginDefenseRecording}
        onPrevious={() => setActiveSlideIndex((index) => Math.max(0, index - 1))}
        onNext={() => setActiveSlideIndex((index) => Math.min(slides.length - 1, index + 1))}
        onCancel={cancelSimulation}
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
    <div className="w-full flex flex-col h-full pb-24 px-1 sm:px-2">
      {/* Top Header & Immediate Action Bar */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-outline-variant/70">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-on-surface flex items-center">
            Jury Simulation
            <InfoTooltip
              label="Defense Rehearsal"
              tooltip="Rehearse your graduation defense with slide projection, teleprompter, and instant AI jury evaluation."
            />
          </h1>
          <p className="text-sm sm:text-base text-on-surface-variant font-medium mt-1">
            Test your mic and camera framing, verify your speech scripts, and enter the defense podium.
          </p>
        </div>

        {/* Action Controls in Header (Immediate & accessible without scrolling) */}
        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          {latestCurrentAttempt && (
            <button
              type="button"
              onClick={() => {
                setCurrentAttempt(latestCurrentAttempt);
                setStage("results");
              }}
              className="h-11 sm:h-12 px-5 rounded-xl border border-outline-variant/80 bg-surface hover:bg-surface-container text-xs sm:text-sm font-bold text-on-surface flex items-center gap-2 transition-all shadow-2xs cursor-pointer"
            >
              <HugeiconsIcon icon="analytics" size={16} strokeWidth={2} className="text-primary" />
              <span>Latest Score: {latestCurrentAttempt.analysis.overallScore}/100</span>
            </button>
          )}

          <button
            type="button"
            onClick={enterPodium}
            disabled={!canStart}
            className="h-11 sm:h-12 px-6 sm:px-7 rounded-xl bg-primary text-on-primary text-xs sm:text-sm font-bold shadow-md hover:bg-primary/90 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2.5"
          >
            <HugeiconsIcon icon="play-circle" size={20} strokeWidth={2} />
            <span>Enter Defense Podium</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-error-container text-on-error-container border border-error/20 flex items-center justify-between gap-3 shadow-2xs">
          <p className="text-sm font-semibold">{error}</p>
          <button onClick={() => setError("")} className="shrink-0 text-xs font-bold underline hover:no-underline cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {olderAttemptsExist && (
        <div className="mb-6 p-4 rounded-xl border border-outline-variant/80 bg-surface-container-low text-xs sm:text-sm text-on-surface font-medium flex items-center gap-3">
          <HugeiconsIcon icon="clock" size={18} strokeWidth={2} className="text-primary shrink-0" />
          <span>Past rehearsal attempts were recorded on an earlier version of this presentation.</span>
        </div>
      )}

      {/* Main 2-Column Full-Width Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] 2xl:grid-cols-[minmax(0,1fr)_400px] gap-6 lg:gap-8 items-start">
        
        {/* Left Column: Device Check Console + Readiness Matrix */}
        <div className="flex flex-col gap-6 lg:gap-8 min-w-0">
          
          {/* 1. Hardware Check Studio Pod (Sleek Compact Height) */}
          <div className="rounded-2xl border border-outline-variant/80 bg-surface p-5 shadow-2xs">
            <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-outline-variant/60">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary border border-primary/20 flex items-center justify-center">
                  <HugeiconsIcon icon="tune" size={16} strokeWidth={2} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-on-surface">Hardware Pre-Flight Check</h2>
                  <p className="text-xs text-on-surface-variant font-medium">Verify camera framing and microphone levels</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={cn(
                  "px-2.5 py-0.5 rounded-md text-xs font-bold border",
                  micStatus === "ready"
                    ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                    : micStatus === "denied"
                      ? "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30"
                      : "bg-surface-container text-on-surface border-outline-variant/60"
                )}>
                  Mic: {micStatus === "ready" ? "Ready" : micStatus === "checking" ? "Checking" : micStatus === "denied" ? "Denied" : "Idle"}
                </span>
                <span className={cn(
                  "px-2.5 py-0.5 rounded-md text-xs font-bold border",
                  camStatus === "ready"
                    ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                    : camStatus === "denied"
                      ? "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30"
                      : "bg-surface-container text-on-surface border-outline-variant/60"
                )}>
                  Cam: {camStatus === "ready" ? "Live" : camStatus === "checking" ? "Starting" : "Off"}
                </span>
              </div>
            </div>

            {/* Camera & Mic Sleek Viewports */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Camera Preview Pod */}
              <div className="flex flex-col rounded-xl border border-outline-variant/70 bg-surface-container-lowest p-3.5 shadow-2xs justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                      <HugeiconsIcon icon="camera" size={15} strokeWidth={2} className="text-primary" />
                      Camera Preview
                    </span>
                    {isTestingCam && (
                      <button
                        type="button"
                        onClick={() => setIsMirrored(!isMirrored)}
                        className="text-xs font-semibold text-primary hover:underline cursor-pointer"
                      >
                        {isMirrored ? "Mirror: On" : "Mirror: Off"}
                      </button>
                    )}
                  </div>

                  {/* Sleek Viewport Frame */}
                  <div className="relative h-40 sm:h-44 w-full rounded-lg overflow-hidden bg-neutral-950 border border-neutral-800 flex items-center justify-center shadow-inner">
                    {isTestingCam ? (
                      <>
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          muted
                          className={cn("w-full h-full object-cover", isMirrored && "scale-x-[-1]")}
                        />
                        {/* Framing markers */}
                        <div className="absolute top-2.5 left-2.5 w-3 h-3 border-t-2 border-l-2 border-white pointer-events-none" />
                        <div className="absolute top-2.5 right-2.5 w-3 h-3 border-t-2 border-r-2 border-white pointer-events-none" />
                        <div className="absolute bottom-2.5 left-2.5 w-3 h-3 border-b-2 border-l-2 border-white pointer-events-none" />
                        <div className="absolute bottom-2.5 right-2.5 w-3 h-3 border-b-2 border-r-2 border-white pointer-events-none" />
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-xs text-white text-[10px] font-mono">
                          HD Stream Live
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center p-3 text-center text-neutral-300">
                        <div className="w-9 h-9 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center mb-1.5 text-neutral-400">
                          <HugeiconsIcon icon="video" size={20} strokeWidth={1.8} />
                        </div>
                        <p className="text-xs font-semibold text-neutral-200">Camera preview is off</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-outline-variant/60 flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-on-surface">
                    {isTestingCam ? "Camera is streaming" : "Ensure you are centered"}
                  </span>
                  <button
                    type="button"
                    onClick={toggleCamTest}
                    className={cn(
                      "h-8 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs flex items-center gap-1.5 shrink-0",
                      isTestingCam
                        ? "bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30 hover:bg-rose-500/25"
                        : "bg-primary text-on-primary hover:bg-primary/90"
                    )}
                  >
                    <HugeiconsIcon icon={isTestingCam ? "video-off" : "video"} size={13} strokeWidth={2} />
                    <span>{isTestingCam ? "Turn Off" : "Test Camera"}</span>
                  </button>
                </div>
              </div>

              {/* Microphone Level Pod */}
              <div className="flex flex-col rounded-xl border border-outline-variant/70 bg-surface-container-lowest p-3.5 shadow-2xs justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                      <HugeiconsIcon icon="mic" size={15} strokeWidth={2} className="text-primary" />
                      Microphone Audio
                    </span>
                    <span className={cn(
                      "text-xs font-bold uppercase tracking-wider",
                      isTestingMic && micVolume > 15 ? "text-emerald-600 dark:text-emerald-400" : "text-on-surface-variant"
                    )}>
                      {isTestingMic ? (micVolume > 65 ? "High Input" : micVolume > 15 ? "Optimal" : "Listening...") : "Idle"}
                    </span>
                  </div>

                  {/* Compact VU Visualizer Viewport */}
                  <div className="relative h-40 sm:h-44 w-full rounded-lg overflow-hidden bg-surface-container-low border border-outline-variant/60 flex flex-col items-center justify-center p-3">
                    {isTestingMic ? (
                      <div className="w-full flex flex-col items-center justify-center gap-2.5">
                        {/* Dynamic Equalizer Bars */}
                        <div className="flex items-end justify-center gap-1 sm:gap-1.5 h-16 sm:h-20 w-full max-w-xs px-2">
                          {[12, 22, 35, 50, 70, 85, 100, 80, 60, 45, 65, 90, 100, 75, 55, 40, 60, 80, 95, 70, 45, 30, 20, 15].map((factor, i) => {
                            const dynamicHeight = Math.max(8, Math.min(100, (micVolume * factor) / 50));
                            return (
                              <div
                                key={i}
                                className={cn(
                                  "w-1.5 rounded-full transition-all duration-75",
                                  micVolume > 65
                                    ? "bg-amber-500"
                                    : micVolume > 15
                                      ? "bg-emerald-500"
                                      : "bg-primary"
                                )}
                                style={{ height: `${dynamicHeight}%` }}
                              />
                            );
                          })}
                        </div>
                        <div className="px-2.5 py-0.5 rounded-full bg-surface border border-outline-variant/70 shadow-2xs">
                          <p className="text-xs font-bold text-on-surface font-mono">
                            Input Level: {micVolume}%
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center text-center">
                        <div className="w-9 h-9 rounded-xl bg-surface border border-outline-variant/80 flex items-center justify-center mb-1.5 text-primary shadow-2xs">
                          <HugeiconsIcon icon="mic" size={20} strokeWidth={1.8} />
                        </div>
                        <p className="text-xs font-semibold text-on-surface">Microphone is idle</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-outline-variant/60 flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-on-surface">
                    {isTestingMic ? "Speaking level active" : "Speak to test audio"}
                  </span>
                  <button
                    type="button"
                    onClick={toggleMicTest}
                    className={cn(
                      "h-8 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs flex items-center gap-1.5 shrink-0",
                      isTestingMic
                        ? "bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30 hover:bg-rose-500/25"
                        : "bg-primary text-on-primary hover:bg-primary/90"
                    )}
                  >
                    <HugeiconsIcon icon={isTestingMic ? "mic-off" : "mic"} size={13} strokeWidth={2} />
                    <span>{isTestingMic ? "Stop Mic" : "Test Mic"}</span>
                  </button>
                </div>
              </div>

            </div>
          </div>

          {/* 2. Spacious Readiness Matrix */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            
            {/* Card 1: Deck */}
            <div className="rounded-2xl border border-outline-variant/80 bg-surface p-5 sm:p-6 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-on-surface">Presentation Deck</span>
                <div className={cn(
                  "w-7 h-7 rounded-lg flex items-center justify-center border",
                  hasPresentation ? "bg-emerald-500/15 text-emerald-600 border-emerald-500/30" : "bg-amber-500/15 text-amber-600 border-amber-500/30"
                )}>
                  <HugeiconsIcon icon={hasPresentation ? "checkmark-circle-02" : "alert-circle"} size={16} strokeWidth={2} />
                </div>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-on-surface font-mono">
                {hasPresentation ? `${slides.length} Slides Ready` : "No Slides"}
              </h3>
              <div className="mt-4 pt-3 border-t border-outline-variant/60 flex items-center justify-between">
                <Link to="/workspace/presentation" className="text-xs font-bold text-primary hover:underline flex items-center gap-1.5">
                  <span>{hasPresentation ? "Review Slides" : "Create Slides"}</span>
                  <HugeiconsIcon icon="arrow-right" size={13} strokeWidth={2} />
                </Link>
              </div>
            </div>

            {/* Card 2: Pitch */}
            <div className="rounded-2xl border border-outline-variant/80 bg-surface p-5 sm:p-6 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-on-surface">Pitch Script</span>
                <div className={cn(
                  "w-7 h-7 rounded-lg flex items-center justify-center border",
                  hasPitch ? "bg-emerald-500/15 text-emerald-600 border-emerald-500/30" : "bg-amber-500/15 text-amber-600 border-amber-500/30"
                )}>
                  <HugeiconsIcon icon={hasPitch ? "checkmark-circle-02" : "alert-circle"} size={16} strokeWidth={2} />
                </div>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-on-surface font-mono">
                {alignedPitchSlides.filter((s) => getPitchSpeech(s)).length} / {slides.length} Scripted
              </h3>
              <div className="mt-4 pt-3 border-t border-outline-variant/60 flex items-center justify-between">
                <Link to="/workspace/pitch" className="text-xs font-bold text-primary hover:underline flex items-center gap-1.5">
                  <span>{hasPitch ? "Review Script" : "Draft Pitch"}</span>
                  <HugeiconsIcon icon="arrow-right" size={13} strokeWidth={2} />
                </Link>
              </div>
            </div>

            {/* Card 3: Target Timing & Minimum Window */}
            <div className="rounded-2xl border border-outline-variant/80 bg-surface p-5 sm:p-6 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-on-surface">Target Duration</span>
                <div className="w-7 h-7 rounded-lg bg-blue-500/15 text-blue-600 border border-blue-500/30 flex items-center justify-center">
                  <HugeiconsIcon icon="clock" size={16} strokeWidth={2} />
                </div>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-on-surface font-mono">
                {formatDuration(targetSeconds)}
              </h3>
              <div className="mt-4 pt-3 border-t border-outline-variant/60 flex items-center justify-between">
                <span className="text-xs font-semibold text-primary">Min 2m Rehearsal</span>
                <span className="text-xs font-bold text-on-surface-variant font-mono">~{slides.length ? Math.round((targetSeconds / slides.length / 60) * 10) / 10 : 1.5}m/slide</span>
              </div>
            </div>

          </div>

        </div>

        {/* Right Column: Attempt History & Criteria Guide */}
        <div className="flex flex-col gap-6">
          <AttemptHistory
            attempts={attempts}
            onSelectAttempt={(attempt) => {
              setCurrentAttempt(attempt);
              setStage("results");
            }}
          />

          {/* Jury Criteria Card */}
          <div className="rounded-2xl border border-outline-variant/80 bg-surface-container-lowest p-5 sm:p-6 shadow-2xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface mb-3.5">AI Evaluation Metrics</h3>
            <div className="space-y-2.5">
              {[
                { label: "Delivery", desc: "Fluency, vocal confidence & minimal filler words" },
                { label: "Content", desc: "Technical accuracy, depth & methodology" },
                { label: "Clarity", desc: "Clear articulation of project concepts & results" },
                { label: "Timing", desc: "Pacing aligned with allocated target duration" },
                { label: "Structure", desc: "Logical narrative & smooth slide transitions" },
              ].map((dim) => (
                <div key={dim.label} className="p-3 rounded-xl border border-outline-variant/60 bg-surface">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    <h4 className="text-xs font-bold text-on-surface">{dim.label}</h4>
                  </div>
                  <p className="text-xs text-on-surface-variant mt-0.5 pl-3.5">{dim.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
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
  isRecording,
  countdown,
  liveVolume = 0,
  onStartRecording,
  onPrevious,
  onNext,
  onCancel,
  onFinish,
}: {
  slide?: PresentationSlide;
  pitch?: PitchSlide;
  slideIndex: number;
  totalSlides: number;
  elapsedSeconds: number;
  targetSeconds: number;
  isRecording: boolean;
  countdown: number | null;
  liveVolume?: number;
  onStartRecording: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onCancel: () => void;
  onFinish: () => void;
}) {
  const MIN_REQUIRED_SECONDS = 120;
  const isMinMet = elapsedSeconds >= MIN_REQUIRED_SECONDS;
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      if (containerRef.current?.requestFullscreen) {
        containerRef.current.requestFullscreen().catch(() => {});
      } else {
        document.documentElement.requestFullscreen().catch(() => {});
      }
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // Keyboard navigation support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") onNext();
      if (e.key === "ArrowLeft") onPrevious();
      if (e.key === "Escape" && !document.fullscreenElement) onCancel();
      if (e.key === "f" || e.key === "F") toggleFullscreen();
      if (e.key === " " && !isRecording && countdown === null) {
        e.preventDefault();
        onStartRecording();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onNext, onPrevious, onCancel, onStartRecording, isRecording, countdown]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative rounded-2xl border border-outline-variant/80 bg-surface text-on-surface overflow-hidden shadow-2xs transition-all",
        isFullscreen ? "min-h-screen h-screen rounded-none border-none p-2 sm:p-4" : "min-h-[calc(100dvh-150px)]"
      )}
    >
      {/* Sleek Minimalist 3-2-1 Countdown (No spinning circles) */}
      {countdown !== null && (
        <div className="absolute inset-0 z-50 bg-surface/95 backdrop-blur-md flex flex-col items-center justify-center text-center p-6 animate-fade-in">
          <div className="flex flex-col items-center">
            <span className="text-7xl sm:text-9xl font-black text-primary font-mono tracking-tighter leading-none select-none transition-all duration-300 transform scale-110">
              {countdown}
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-on-surface mt-4">Take a deep breath...</h2>
            <p className="text-sm text-on-surface-variant mt-1">Starting live recording in {countdown}s</p>
          </div>
        </div>
      )}

      <div className="flex min-h-full flex-col h-full">
        
        {/* Header Bar */}
        <header className="flex flex-col gap-3 border-b border-outline-variant/70 p-4 bg-surface-container-low/40 sm:flex-row sm:items-center sm:justify-between shrink-0">
          <div className="flex items-center gap-3">
            {isRecording ? (
              <span className="flex h-3 w-3 rounded-full bg-error animate-pulse" />
            ) : (
              <span className="flex h-3 w-3 rounded-full bg-primary" />
            )}
            <div>
              <p className={cn(
                "text-xs font-bold uppercase tracking-wider",
                isRecording ? "text-error" : "text-primary"
              )}>
                {isRecording ? "Recording In Progress" : "Defense Podium Standby"}
              </p>
              <p className="text-xs font-semibold text-on-surface">Slide {slideIndex + 1} of {totalSlides}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {isRecording ? (
              <>
                {/* Live Reassuring Microphone Visualizer Pill */}
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-outline-variant/80 bg-surface shadow-2xs">
                  <HugeiconsIcon
                    icon="mic"
                    size={14}
                    strokeWidth={2}
                    className={cn(
                      "transition-colors",
                      liveVolume > 15 ? "text-emerald-500 animate-pulse" : "text-on-surface-variant"
                    )}
                  />
                  <div className="flex items-end gap-0.5 h-3.5 w-10">
                    {[20, 45, 75, 100, 70, 40].map((factor, idx) => {
                      const height = Math.max(3, Math.min(14, (liveVolume * factor) / 60));
                      return (
                        <div
                          key={idx}
                          className={cn(
                            "w-1 rounded-full transition-all duration-75",
                            liveVolume > 65 ? "bg-amber-500" : liveVolume > 15 ? "bg-emerald-500" : "bg-primary/40"
                          )}
                          style={{ height: `${height}px` }}
                        />
                      );
                    })}
                  </div>
                  <span className="text-[10px] font-mono font-bold text-on-surface">{liveVolume}%</span>
                </div>

                <TimerPill label="Elapsed" value={formatDuration(elapsedSeconds)} />
                <TimerPill label="Target" value={formatDuration(targetSeconds)} />

                {/* 2-Minute Progress Pill */}
                <div className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 border shadow-2xs font-mono",
                  isMinMet
                    ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                    : "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30"
                )}>
                  <HugeiconsIcon icon={isMinMet ? "checkmark-circle-02" : "lock"} size={13} strokeWidth={2} />
                  <span>{isMinMet ? "2m Met (Ready)" : `${formatDuration(elapsedSeconds)} / 2:00`}</span>
                </div>

                {/* Fullscreen Toggle Button */}
                <button
                  type="button"
                  onClick={toggleFullscreen}
                  className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-outline-variant/80 bg-surface px-3 text-xs font-bold text-on-surface shadow-2xs hover:bg-surface-container transition-all cursor-pointer"
                  title={isFullscreen ? "Exit Fullscreen (F)" : "Enter Fullscreen (F)"}
                >
                  <HugeiconsIcon icon={isFullscreen ? "fullscreen-exit" : "fullscreen"} size={14} strokeWidth={2} />
                  <span className="hidden sm:inline">{isFullscreen ? "Exit Fullscreen" : "Fullscreen"}</span>
                </button>

                <button
                  type="button"
                  onClick={onCancel}
                  className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-outline-variant/80 bg-surface px-3.5 text-xs font-bold text-on-surface shadow-2xs hover:bg-surface-container transition-all cursor-pointer"
                  title="Cancel rehearsal and return without evaluating"
                >
                  <HugeiconsIcon icon="close" size={14} strokeWidth={2} />
                  <span>Cancel</span>
                </button>

                <button
                  type="button"
                  onClick={onFinish}
                  disabled={!isMinMet}
                  title={isMinMet ? "Finish defense and get AI Jury Evaluation" : "Minimum 2 minutes required before finishing"}
                  className={cn(
                    "inline-flex h-9 items-center justify-center gap-2 rounded-lg px-4 text-xs font-bold transition-all shadow-2xs",
                    isMinMet
                      ? "bg-error text-white hover:bg-error/90 cursor-pointer shadow-md"
                      : "bg-surface-container text-on-surface-variant border border-outline-variant/70 opacity-50 cursor-not-allowed"
                  )}
                >
                  <HugeiconsIcon icon={isMinMet ? "stop-circle" : "lock"} size={15} strokeWidth={2} />
                  <span>{isMinMet ? "Finish Defense" : "Min 2m Required"}</span>
                </button>
              </>
            ) : (
              <>
                <TimerPill label="Target Time" value={formatDuration(targetSeconds)} />
                <div className="px-3 py-1.5 rounded-lg border border-outline-variant/80 bg-surface text-xs font-bold text-on-surface font-mono">
                  Min. 2m Required
                </div>

                {/* Fullscreen Toggle Button */}
                <button
                  type="button"
                  onClick={toggleFullscreen}
                  className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-outline-variant/80 bg-surface px-3 text-xs font-bold text-on-surface shadow-2xs hover:bg-surface-container transition-all cursor-pointer"
                  title={isFullscreen ? "Exit Fullscreen (F)" : "Enter Fullscreen (F)"}
                >
                  <HugeiconsIcon icon={isFullscreen ? "fullscreen-exit" : "fullscreen"} size={14} strokeWidth={2} />
                  <span className="hidden sm:inline">{isFullscreen ? "Exit Fullscreen" : "Fullscreen"}</span>
                </button>

                <button
                  type="button"
                  onClick={onCancel}
                  className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-outline-variant/80 bg-surface px-3.5 text-xs font-bold text-on-surface shadow-2xs hover:bg-surface-container transition-all cursor-pointer"
                >
                  <HugeiconsIcon icon="close" size={14} strokeWidth={2} />
                  <span>Exit Podium</span>
                </button>

                <button
                  type="button"
                  onClick={onStartRecording}
                  className="inline-flex h-9 sm:h-10 items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white px-5 text-xs sm:text-sm font-bold shadow-md transition-all cursor-pointer"
                >
                  <HugeiconsIcon icon="mic" size={16} strokeWidth={2} />
                  <span>Begin Speaking & Record</span>
                </button>
              </>
            )}
          </div>
        </header>

        {/* Breathing / Standby Banner when not recording */}
        {!isRecording && (
          <div className="bg-primary/10 border-b border-primary/20 px-5 py-3 flex items-center justify-between gap-4 text-xs sm:text-sm text-on-surface shrink-0">
            <div className="flex items-center gap-2.5">
              <HugeiconsIcon icon="mic" size={17} strokeWidth={2} className="text-primary shrink-0" />
              <span>
                <strong>Podium Ready:</strong> Take a breath and review your opening slide. When you are ready to speak, click <strong>Begin Speaking & Record</strong> (or press Space).
              </span>
            </div>
            <span className="text-xs font-bold text-primary shrink-0 hidden md:inline font-mono">2 min minimum rehearsal</span>
          </div>
        )}

        <main className="grid flex-1 gap-5 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_380px] bg-surface-container-lowest overflow-hidden">
          <section className="flex min-h-[420px] flex-col rounded-2xl border border-outline-variant/80 bg-surface p-6 sm:p-8 shadow-2xs justify-between overflow-y-auto">
            <div>
              <div className="mb-4 flex items-center justify-between gap-3 pb-3 border-b border-outline-variant/60">
                <span className="text-xs font-bold uppercase tracking-wider text-primary">Live Slide View</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onPrevious}
                    disabled={slideIndex === 0}
                    className="w-8 h-8 rounded-lg border border-outline-variant/80 bg-surface flex items-center justify-center text-on-surface hover:bg-surface-container disabled:opacity-30 cursor-pointer"
                    title="Previous slide (Left Arrow)"
                  >
                    <HugeiconsIcon icon="arrow-right" size={14} strokeWidth={2} className="rotate-180" />
                  </button>
                  <button
                    type="button"
                    onClick={onNext}
                    disabled={slideIndex >= totalSlides - 1}
                    className="w-8 h-8 rounded-lg border border-outline-variant/80 bg-surface flex items-center justify-center text-on-surface hover:bg-surface-container disabled:opacity-30 cursor-pointer"
                    title="Next slide (Right Arrow)"
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

          <aside className="rounded-2xl border border-outline-variant/80 bg-surface p-6 shadow-2xs flex flex-col overflow-hidden">
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
    <aside className="rounded-2xl border border-outline-variant/80 bg-surface-container-lowest p-4 sm:p-5 shadow-2xs h-fit">
      <h2 className="text-xs font-bold uppercase tracking-wider text-on-surface mb-3">Attempt History</h2>
      <div className="space-y-2">
        {attempts.length ? attempts.map((attempt) => (
          <button
            key={attempt._id || attempt.attemptNumber}
            type="button"
            onClick={() => onSelectAttempt(attempt)}
            className={cn(
              "w-full rounded-xl border p-3 text-left transition-all duration-150 cursor-pointer shadow-2xs",
              selectedId === attempt._id
                ? "border-primary bg-primary/10"
                : "border-outline-variant/70 bg-surface hover:bg-surface-container"
            )}
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-bold text-on-surface">Attempt #{attempt.attemptNumber}</span>
              <span className="text-sm font-bold font-mono text-primary">{attempt.analysis?.overallScore ?? 0}</span>
            </div>
            <p className={cn("mt-1 text-xs font-semibold", attempt.isCurrent ? "text-secondary" : "text-on-surface-variant")}>
              {attemptVersionLabel(attempt)}
            </p>
            <p className="mt-0.5 text-xs text-on-surface font-mono">{formatDuration(attempt.actualSeconds)} recorded</p>
          </button>
        )) : (
          <p className="rounded-xl border border-dashed border-outline-variant/80 p-4 text-xs text-on-surface-variant text-center font-medium">
            No previous attempts recorded.
          </p>
        )}
      </div>
    </aside>
  );
}

