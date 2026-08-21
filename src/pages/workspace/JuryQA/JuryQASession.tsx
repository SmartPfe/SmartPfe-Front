import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { API_BASE_URL, fetchApi } from "@/lib/api";
import { cn } from "@/lib/utils";
import HugeiconsIcon from "@/components/ui/HugeiconsIcon";
import { formatDuration } from "../Pitch/hooks/usePitch";
import type { FinalJuryEvaluation, JuryQASessionRecord, JuryQuestion } from "./types";

type RecorderState = "idle" | "countdown" | "recording" | "recorded" | "processing" | "saved";

type JuryQASessionProps = {
  projectId: string;
  presentation?: unknown;
  pitch?: unknown;
  attempt: {
    _id?: string;
    attemptNumber: number;
    analysis?: { overallScore?: number };
  };
  initialSession?: JuryQASessionRecord | null;
  onSessionChange: (session: JuryQASessionRecord) => void;
  onBackToResults: () => void;
  onCompleted: (session: JuryQASessionRecord) => void;
};

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
  return "webm";
};

const authHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const questionAnswered = (question: JuryQuestion) => Boolean(question.answer?.transcript && question.evaluation);

export default function JuryQASession({
  projectId,
  presentation,
  pitch,
  attempt,
  initialSession,
  onSessionChange,
  onBackToResults,
  onCompleted,
}: JuryQASessionProps) {
  const [session, setSession] = useState<JuryQASessionRecord | null>(initialSession || null);
  const [loading, setLoading] = useState(!initialSession);
  const [finalizing, setFinalizing] = useState(false);
  const [error, setError] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [recorderState, setRecorderState] = useState<RecorderState>("idle");
  const [countdown, setCountdown] = useState(3);
  const [answerSeconds, setAnswerSeconds] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [savedQuestionId, setSavedQuestionId] = useState("");

  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const startedAtRef = useRef<number>(0);

  const questions = session?.questions || [];
  const activeQuestion = questions[activeIndex] || null;
  const answeredCount = questions.filter(questionAnswered).length;
  const progressPercent = questions.length ? Math.round((answeredCount / questions.length) * 100) : 0;
  const allAnswered = questions.length > 0 && answeredCount === questions.length;

  const setSessionAndNotify = useCallback((nextSession: JuryQASessionRecord) => {
    setSession(nextSession);
    onSessionChange(nextSession);
  }, [onSessionChange]);

  useEffect(() => {
    if (initialSession) {
      setSession(initialSession);
      setLoading(false);
    }
  }, [initialSession]);

  useEffect(() => {
    if (!session || session.status === "completed") return;
    const firstUnanswered = session.questions.findIndex((question) => !questionAnswered(question));
    setActiveIndex(firstUnanswered === -1 ? Math.max(0, session.questions.length - 1) : firstUnanswered);
  }, [session?._id, session?.questions?.length, session?.status]);

  useEffect(() => {
    if (recorderState !== "recording") return;
    const timer = window.setInterval(() => {
      setAnswerSeconds(Math.max(0, Math.round((Date.now() - startedAtRef.current) / 1000)));
    }, 400);
    return () => window.clearInterval(timer);
  }, [recorderState]);

  useEffect(() => () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
  }, []);

  const loadOrGenerateSession = useCallback(async () => {
    if (session || !attempt._id) return;
    setLoading(true);
    setError("");
    try {
      const data = await fetchApi("/ai/jury-qa/generate", {
        method: "POST",
        body: JSON.stringify({ projectId, juryAttemptId: attempt._id, presentation, pitch }),
      });
      setSessionAndNotify(data.session);
    } catch (err: any) {
      setError(err.message || "Failed to prepare jury questions.");
    } finally {
      setLoading(false);
    }
  }, [attempt._id, pitch, presentation, projectId, session, setSessionAndNotify]);

  useEffect(() => {
    loadOrGenerateSession();
  }, [loadOrGenerateSession]);

  const resetRecorder = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    recorderRef.current = null;
    chunksRef.current = [];
    setRecordedBlob(null);
    setAnswerSeconds(0);
    setCountdown(3);
    setRecorderState("idle");
  };

  const beginAnswer = async () => {
    if (!activeQuestion || questionAnswered(activeQuestion)) return;
    if (typeof MediaRecorder === "undefined") {
      setError("Audio recording is not supported in this browser.");
      return;
    }

    setError("");
    setSavedQuestionId("");
    setRecordedBlob(null);
    chunksRef.current = [];
    setRecorderState("countdown");
    setCountdown(3);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mimeType = supportedRecordingType();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      recorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data?.size) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const blobType = recorder.mimeType || mimeType || "audio/webm";
        setRecordedBlob(new Blob(chunksRef.current, { type: blobType }));
        streamRef.current?.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        setRecorderState("recorded");
      };

      let value = 3;
      const countdownTimer = window.setInterval(() => {
        value -= 1;
        setCountdown(value);
        if (value <= 0) {
          window.clearInterval(countdownTimer);
          startedAtRef.current = Date.now();
          setAnswerSeconds(0);
          recorder.start(500);
          setRecorderState("recording");
        }
      }, 1000);
    } catch (err: any) {
      resetRecorder();
      if (err?.name === "NotAllowedError" || err?.name === "SecurityError") {
        setError("Microphone permission was denied. Allow microphone access to answer jury questions.");
      } else {
        setError("Could not access the microphone. Please check your device and retry.");
      }
    }
  };

  const finishRecording = () => {
    if (recorderRef.current?.state === "recording") {
      recorderRef.current.stop();
    }
  };

  const validateAnswer = async () => {
    if (!session?._id || !activeQuestion || !recordedBlob) return;
    if (answerSeconds < 2) {
      setError("The answer recording is too short. Please record a complete spoken answer.");
      return;
    }

    setRecorderState("processing");
    setError("");
    try {
      const formData = new FormData();
      const ext = recordingExtension(recordedBlob.type);
      formData.append("projectId", projectId);
      formData.append("questionId", activeQuestion.id);
      formData.append("durationSeconds", String(answerSeconds));
      formData.append("audio", recordedBlob, `jury-answer-${activeQuestion.id}.${ext}`);

      const response = await fetch(`${API_BASE_URL}/ai/jury-qa/${session._id}/answer`, {
        method: "POST",
        headers: authHeaders(),
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to evaluate this answer.");

      setSessionAndNotify(data.session);
      setSavedQuestionId(activeQuestion.id);
      setRecordedBlob(null);
      setRecorderState("saved");
    } catch (err: any) {
      setError(err.message || "Could not process this answer. Please retry.");
      setRecorderState("recorded");
    }
  };

  const moveNext = () => {
    resetRecorder();
    setSavedQuestionId("");
    const nextIndex = questions.findIndex((question, index) => index > activeIndex && !questionAnswered(question));
    if (nextIndex !== -1) {
      setActiveIndex(nextIndex);
    } else if (!allAnswered) {
      const firstUnanswered = questions.findIndex((question) => !questionAnswered(question));
      setActiveIndex(firstUnanswered === -1 ? activeIndex : firstUnanswered);
    }
  };

  const finalizeSession = async () => {
    if (!session?._id || !allAnswered) return;
    setFinalizing(true);
    setError("");
    try {
      const data = await fetchApi(`/ai/jury-qa/${session._id}/finalize`, {
        method: "POST",
        body: JSON.stringify({ projectId }),
      });
      setSessionAndNotify(data.session);
      onCompleted(data.session);
    } catch (err: any) {
      setError(err.message || "Failed to prepare the final jury report.");
    } finally {
      setFinalizing(false);
    }
  };

  if (loading) {
    return (
      <SessionShell onBack={onBackToResults}>
        <ProcessingPanel
          title="Preparing jury questions..."
          description="Smart PFE is reading your report, slides, pitch, and defense feedback to prepare personalized questions."
        />
      </SessionShell>
    );
  }

  if (finalizing) {
    return (
      <SessionShell onBack={onBackToResults}>
        <ProcessingPanel
          title="The jury is preparing your final evaluation..."
          description="The report combines defense performance, answer quality, technical mastery, and readiness for the real defense."
        />
      </SessionShell>
    );
  }

  if (!session) {
    return (
      <SessionShell onBack={onBackToResults}>
        <ErrorPanel error={error || "Jury Q&A could not be loaded."} onRetry={loadOrGenerateSession} />
      </SessionShell>
    );
  }

  if (session.status === "completed" && session.finalEvaluation) {
    return (
      <SessionShell onBack={onBackToResults}>
        <FinalJuryReport session={session} evaluation={session.finalEvaluation} />
      </SessionShell>
    );
  }

  return (
    <SessionShell onBack={onBackToResults}>
      {error && (
        <div className="mb-5 rounded-xl border border-error/20 bg-error-container p-4 text-sm font-semibold text-on-error-container">
          {error}
        </div>
      )}

      <section className="rounded-2xl border border-outline-variant/80 bg-surface-container-lowest p-5 sm:p-6 shadow-2xs">
        <div className="flex flex-col gap-4 border-b border-outline-variant/60 pb-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-primary">AI Jury - Questions & Answers</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-on-surface">Jury Q&A Session</h1>
            <p className="mt-1 text-sm text-on-surface-variant">Defense Completed - Jury Q&A - Final Report</p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
            <StatusPill label="Attempt" value={`#${attempt.attemptNumber}`} />
            <StatusPill label="Defense" value={`${attempt.analysis?.overallScore || 0}/100`} />
            <StatusPill label="Answered" value={`${answeredCount}/${questions.length}`} />
            <StatusPill label="Timer" value={formatDuration(answerSeconds)} />
          </div>
        </div>

        <div className="mt-5 h-2 overflow-hidden rounded-full bg-surface-container">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progressPercent}%` }} />
        </div>
      </section>

      {activeQuestion && (
        <section className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <main className="rounded-2xl border border-outline-variant/80 bg-surface p-6 sm:p-8 shadow-2xs">
            <div className="mb-5 flex flex-wrap items-center gap-2">
              <span className="rounded-lg border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary">
                Question {activeIndex + 1} of {questions.length}
              </span>
              <span className="rounded-lg border border-outline-variant/80 bg-surface-container px-3 py-1 text-xs font-bold text-on-surface">
                {activeQuestion.category}
              </span>
              <span className={cn(
                "rounded-lg border px-3 py-1 text-xs font-bold capitalize",
                activeQuestion.difficulty === "hard"
                  ? "border-rose-500/25 bg-rose-500/10 text-rose-600 dark:text-rose-300"
                  : activeQuestion.difficulty === "medium"
                    ? "border-amber-500/25 bg-amber-500/10 text-amber-600"
                    : "border-secondary/25 bg-secondary/10 text-secondary"
              )}>
                {activeQuestion.difficulty}
              </span>
              {activeQuestion.followUpFor && (
                <span className="rounded-lg border border-outline-variant/80 bg-surface-container-low px-3 py-1 text-xs font-bold text-on-surface-variant">
                  Follow-up
                </span>
              )}
            </div>

            <p className="text-xl sm:text-2xl font-bold leading-relaxed text-on-surface">{activeQuestion.question}</p>

            <div className="mt-8 rounded-xl border border-outline-variant/80 bg-surface-container-low p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-bold text-on-surface">Answer with your voice</h2>
                  <p className="mt-0.5 text-xs text-on-surface-variant">
                    {recorderState === "recording" ? "Recording..." : recorderState === "processing" ? "Processing answer..." : "Microphone only, no camera required"}
                  </p>
                </div>
                <div className={cn(
                  "rounded-full px-3 py-1 text-xs font-bold",
                  recorderState === "recording" ? "bg-rose-500/10 text-rose-600" : "bg-surface text-on-surface-variant"
                )}>
                  {recorderState === "countdown" ? `Starting in ${countdown}` : recorderState}
                </div>
              </div>

              {questionAnswered(activeQuestion) ? (
                <SavedAnswer question={activeQuestion} onNext={allAnswered ? finalizeSession : moveNext} allAnswered={allAnswered} />
              ) : recorderState === "recorded" ? (
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={validateAnswer}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-on-primary shadow-2xs hover:bg-primary/90"
                  >
                    <HugeiconsIcon icon="check-circle" size={18} strokeWidth={2} />
                    Validate Answer
                  </button>
                  <button
                    type="button"
                    onClick={resetRecorder}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-outline-variant/80 bg-surface px-5 text-sm font-bold text-on-surface hover:bg-surface-container"
                  >
                    <HugeiconsIcon icon="refresh" size={17} strokeWidth={2} />
                    Re-record
                  </button>
                  <span className="text-xs font-semibold text-on-surface-variant">{formatDuration(answerSeconds)} recorded</span>
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-3">
                  {recorderState === "recording" ? (
                    <button
                      type="button"
                      onClick={finishRecording}
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-error px-5 text-sm font-bold text-on-error shadow-2xs hover:bg-error/90"
                    >
                      <HugeiconsIcon icon="mic-off" size={18} strokeWidth={2} />
                      Finish Answer
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={beginAnswer}
                      disabled={recorderState === "countdown" || recorderState === "processing"}
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-on-primary shadow-2xs hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <HugeiconsIcon icon="mic" size={18} strokeWidth={2} />
                      Start Answer
                    </button>
                  )}
                  <span className="text-xs font-semibold text-on-surface-variant">
                    {recorderState === "countdown" ? "Get ready to answer after the countdown." : formatDuration(answerSeconds)}
                  </span>
                </div>
              )}
            </div>
          </main>

          <aside className="rounded-2xl border border-outline-variant/80 bg-surface-container-lowest p-4 shadow-2xs h-fit">
            <h2 className="text-xs font-bold uppercase tracking-wider text-on-surface mb-3">Session Progress</h2>
            <div className="space-y-2">
              {questions.map((question, index) => (
                <button
                  key={question.id}
                  type="button"
                  onClick={() => {
                    resetRecorder();
                    setActiveIndex(index);
                  }}
                  className={cn(
                    "w-full rounded-xl border p-3 text-left transition-all",
                    index === activeIndex
                      ? "border-primary bg-primary/10"
                      : "border-outline-variant/70 bg-surface hover:bg-surface-container"
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-on-surface">Q{index + 1}</span>
                    {questionAnswered(question) ? (
                      <HugeiconsIcon icon="check-circle" size={15} strokeWidth={2} className="text-secondary" />
                    ) : (
                      <span className="h-2 w-2 rounded-full bg-outline-variant" />
                    )}
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs text-on-surface-variant">{question.category}</p>
                </button>
              ))}
            </div>
          </aside>
        </section>
      )}
    </SessionShell>
  );
}

function SessionShell({ children, onBack }: { children: React.ReactNode; onBack: () => void }) {
  return (
    <div className="mx-auto flex max-w-[1440px] flex-col pb-32">
      <button
        type="button"
        onClick={onBack}
        className="mb-5 inline-flex h-10 w-fit items-center justify-center gap-2 rounded-xl border border-outline-variant/80 bg-surface px-4 text-xs font-bold text-on-surface hover:bg-surface-container"
      >
        <HugeiconsIcon icon="arrow-left" size={16} strokeWidth={2} />
        Back to Defense Analysis
      </button>
      {children}
    </div>
  );
}

function ProcessingPanel({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex min-h-[520px] flex-col items-center justify-center rounded-2xl border border-outline-variant/80 bg-surface-container-lowest p-8 text-center shadow-2xs">
      <div className="mb-5 h-12 w-12 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
      <h1 className="text-2xl font-bold tracking-tight text-on-surface">{title}</h1>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-on-surface-variant">{description}</p>
    </div>
  );
}

function ErrorPanel({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="rounded-2xl border border-error/20 bg-error-container p-6 text-on-error-container shadow-2xs">
      <h1 className="text-lg font-bold">Jury Q&A unavailable</h1>
      <p className="mt-2 text-sm font-medium">{error}</p>
      <button type="button" onClick={onRetry} className="mt-4 rounded-xl bg-primary px-5 py-2 text-sm font-bold text-on-primary">
        Retry
      </button>
    </div>
  );
}

function StatusPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-outline-variant/80 bg-surface px-3 py-2 shadow-2xs">
      <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">{label}</p>
      <p className="font-mono text-xs font-bold text-on-surface">{value}</p>
    </div>
  );
}

function SavedAnswer({ question, onNext, allAnswered }: { question: JuryQuestion; onNext: () => void; allAnswered: boolean }) {
  return (
    <div className="rounded-xl border border-secondary/25 bg-secondary/10 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="flex items-center gap-2 text-sm font-bold text-secondary">
            <HugeiconsIcon icon="check-circle" size={17} strokeWidth={2} />
            Answer recorded
          </p>
          <p className="mt-1 text-xs text-on-surface-variant">
            Score saved: <span className="font-mono font-bold text-on-surface">{question.evaluation?.score || 0}/100</span>
          </p>
        </div>
        <button
          type="button"
          onClick={onNext}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-xs font-bold text-on-primary shadow-2xs hover:bg-primary/90"
        >
          {allAnswered ? "Prepare Final Report" : "Next Question"}
          <HugeiconsIcon icon="arrow-right" size={16} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}

function FinalJuryReport({ session, evaluation }: { session: JuryQASessionRecord; evaluation: FinalJuryEvaluation }) {
  const categoryLabels: Array<[keyof FinalJuryEvaluation["categoryScores"], string]> = [
    ["presentationDelivery", "Presentation & Delivery"],
    ["contentMastery", "Content Mastery"],
    ["technicalKnowledge", "Technical Knowledge"],
    ["qaPerformance", "Q&A Performance"],
    ["clarity", "Clarity"],
    ["criticalThinking", "Critical Thinking"],
  ];

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-outline-variant/80 bg-surface-container-lowest p-6 sm:p-7 shadow-2xs">
        <p className="text-xs font-bold uppercase tracking-wider text-primary">Final Jury Evaluation</p>
        <div className="mt-2 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="font-mono text-4xl font-bold tracking-tight text-on-surface">{evaluation.overallScore} / 100</h1>
            <p className="mt-2 text-lg font-bold text-primary">{evaluation.overallLabel}</p>
          </div>
          <div className="rounded-xl border border-secondary/25 bg-secondary/10 px-4 py-3">
            <p className="text-xs font-bold uppercase tracking-wider text-secondary">Jury Readiness</p>
            <p className="mt-1 font-mono text-xl font-bold text-on-surface">{evaluation.readinessLevel} - {evaluation.readinessPercent}%</p>
          </div>
        </div>
        <p className="mt-5 max-w-4xl text-sm leading-relaxed text-on-surface-variant">{evaluation.readinessExplanation}</p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          {categoryLabels.map(([key, label]) => (
            <div key={key} className="rounded-xl border border-outline-variant/80 bg-surface p-3 shadow-2xs">
              <p className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">{label}</p>
              <p className="mt-1 font-mono text-xl font-bold text-on-surface">{evaluation.categoryScores[key] || 0}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2">
        <ReportList title="Final Strengths" icon="check-circle" items={evaluation.strengths} />
        <ReportList title="Priority Weaknesses" icon="target" items={evaluation.weaknesses} />
      </section>

      <section className="rounded-2xl border border-outline-variant/80 bg-surface-container-lowest p-6 shadow-2xs">
        <h2 className="text-sm font-bold uppercase tracking-wider text-on-surface">Defense vs Q&A Performance</h2>
        <p className="mt-3 text-sm leading-relaxed text-on-surface-variant">{evaluation.defenseVsQA}</p>
      </section>

      <section className="rounded-2xl border border-outline-variant/80 bg-surface-container-lowest p-6 shadow-2xs">
        <h2 className="text-sm font-bold uppercase tracking-wider text-on-surface">Questions You Should Practice Again</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {evaluation.revisionTopics?.length ? evaluation.revisionTopics.map((item, index) => (
            <div key={`${item.topic}-${index}`} className="rounded-xl border border-outline-variant/80 bg-surface p-4">
              <p className="text-sm font-bold text-on-surface">{index + 1}. {item.topic}</p>
              <p className="mt-1 text-xs leading-relaxed text-on-surface-variant">{item.reason}</p>
            </div>
          )) : (
            <p className="text-sm text-on-surface-variant">No specific revision topics were returned.</p>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-outline-variant/80 bg-surface-container-lowest p-6 shadow-2xs">
        <h2 className="text-sm font-bold uppercase tracking-wider text-on-surface">Question-by-Question Review</h2>
        <div className="mt-4 space-y-3">
          {session.questions.map((question, index) => (
            <details key={question.id} className="group rounded-xl border border-outline-variant/80 bg-surface p-4 shadow-2xs">
              <summary className="flex cursor-pointer items-center justify-between gap-3 text-sm font-bold text-on-surface">
                <span>Question {index + 1} - {question.category} - {question.difficulty}</span>
                <HugeiconsIcon icon="chevron-down" size={16} strokeWidth={1.8} className="text-on-surface-variant transition-transform group-open:rotate-180" />
              </summary>
              <div className="mt-4 space-y-4 border-t border-outline-variant/60 pt-4">
                <p className="text-sm font-semibold text-on-surface">{question.question}</p>
                <ReviewBlock title="Student Answer" text={question.answer?.transcript || "No transcript recorded."} />
                <p className="font-mono text-sm font-bold text-primary">Score: {question.evaluation?.score || 0} / 100</p>
                <div className="grid gap-4 md:grid-cols-2">
                  <ReviewList title="What You Did Well" items={question.evaluation?.strengths || []} />
                  <ReviewList title="What Was Missing" items={question.evaluation?.missingPoints || []} />
                </div>
                <ReviewBlock title="How To Improve" text={question.evaluation?.feedback || ""} />
                <ReviewBlock title="Suggested Strong Answer" text={question.evaluation?.idealAnswer || ""} />
              </div>
            </details>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-outline-variant/80 bg-surface-container-lowest p-6 shadow-2xs">
        <h2 className="text-sm font-bold uppercase tracking-wider text-on-surface">Before Your Real Defense</h2>
        <ol className="mt-4 space-y-3">
          {evaluation.actionPlan?.map((item, index) => (
            <li key={`${item}-${index}`} className="flex gap-3 text-sm text-on-surface">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-on-primary">{index + 1}</span>
              <span className="leading-relaxed">{item}</span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

function ReportList({ title, icon, items }: { title: string; icon: string; items: string[] }) {
  return (
    <section className="rounded-2xl border border-outline-variant/80 bg-surface-container-lowest p-5 shadow-2xs">
      <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-on-surface">
        <HugeiconsIcon icon={icon} size={17} strokeWidth={1.8} className="text-primary" />
        {title}
      </h2>
      <ul className="mt-3 space-y-2 text-sm text-on-surface-variant">
        {items?.length ? items.map((item, index) => (
          <li key={`${title}-${index}`} className="flex gap-2">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
            <span>{item}</span>
          </li>
        )) : <li>No items returned.</li>}
      </ul>
    </section>
  );
}

function ReviewBlock({ title, text }: { title: string; text: string }) {
  return (
    <div>
      <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface">{title}</h3>
      <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-on-surface-variant">{text || "No detail returned."}</p>
    </div>
  );
}

function ReviewList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface">{title}</h3>
      <ul className="mt-2 space-y-1.5 text-sm text-on-surface-variant">
        {items.length ? items.map((item, index) => (
          <li key={`${title}-${index}`} className="flex gap-2">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
            <span>{item}</span>
          </li>
        )) : <li>No items returned.</li>}
      </ul>
    </div>
  );
}
