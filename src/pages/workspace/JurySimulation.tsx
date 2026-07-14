import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";

type SimulationStage = "setup" | "recording_pitch" | "processing_pitch" | "jury_questions" | "processing_answers" | "final_feedback";

interface JuryMember {
  id: string;
  name: string;
  role: string;
  icon: string;
  color: string;
  bgColor: string;
  focus: string;
}

const JURY_MEMBERS: JuryMember[] = [
  { id: "academic", name: "Dr. Academic", role: "Professor", icon: "school", color: "text-blue-600", bgColor: "bg-blue-100", focus: "Methodology & Rigor" },
  { id: "technical", name: "Eng. Tech", role: "Software Engineer", icon: "code", color: "text-emerald-600", bgColor: "bg-emerald-100", focus: "Architecture & Code" },
  { id: "industry", name: "Mr. Reviewer", role: "Product Manager", icon: "business_center", color: "text-purple-600", bgColor: "bg-purple-100", focus: "Usability & Value" }
];

interface Question {
  id: string;
  juryId: string;
  text: string;
  studentAnswer?: string;
}

export default function JurySimulation() {
  const [stage, setStage] = useState<SimulationStage>("setup");
  const [timer, setTimer] = useState(0);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [metrics, setMetrics] = useState({ clarity: 0, confidence: 0, fluency: 0, pace: 0, fillers: 0 });

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (stage === "recording_pitch") {
      interval = setInterval(() => setTimer(prev => prev + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [stage]);

  const handleStartRecording = () => {
    setStage("recording_pitch");
    setTimer(0);
  };

  const handleStopRecording = () => {
    setStage("processing_pitch");
    // Simulate processing delay
    setTimeout(() => {
      setMetrics({ clarity: 85, confidence: 78, fluency: 82, pace: 124, fillers: 4 });
      setQuestions([
        { id: "q1", juryId: "academic", text: "In your methodology, why did you choose this specific approach over traditional waterfall for a PFE project?" },
        { id: "q2", juryId: "technical", text: "Can you elaborate on how your system architecture handles concurrent requests and ensures scalability?" },
        { id: "q3", juryId: "industry", text: "From a business perspective, how do you see this platform differentiating itself from existing tools like Notion?" }
      ]);
      setStage("jury_questions");
    }, 2500);
  };

  const handleAnswerSubmit = () => {
    if (!currentAnswer.trim()) return;
    
    const newQuestions = [...questions];
    newQuestions[activeQuestionIndex].studentAnswer = currentAnswer;
    setQuestions(newQuestions);
    setCurrentAnswer("");

    if (activeQuestionIndex < questions.length - 1) {
      setStage("processing_answers");
      setTimeout(() => {
        setActiveQuestionIndex(prev => prev + 1);
        setStage("jury_questions");
      }, 1500);
    } else {
      setStage("processing_answers");
      setTimeout(() => {
        setStage("final_feedback");
      }, 2000);
    }
  };

  const currentQuestion = questions[activeQuestionIndex];
  const currentJury = currentQuestion ? JURY_MEMBERS.find(j => j.id === currentQuestion.juryId) : null;

  return (
    <div className="flex min-h-[calc(100dvh-150px)] lg:h-[calc(100dvh-150px)] w-full flex-col lg:flex-row overflow-hidden relative bg-surface rounded-xl border border-outline-variant">
      
      {/* CENTER PANEL: Main Simulation Workspace */}
      <div className="flex-1 min-w-0 flex flex-col relative z-10 custom-scrollbar overflow-y-auto">
        <div className="max-w-4xl w-full mx-auto p-md lg:p-xl flex-1 flex flex-col relative">
          
          <div className="flex items-center gap-3 mb-6 lg:mb-10 min-w-0">
            <div className="w-12 h-12 rounded-xl bg-primary-container text-on-primary-container flex items-center justify-center">
              <span className="material-symbols-outlined text-[24px]">Record_Voice_Over</span>
            </div>
            <div>
              <h1 className="text-display text-on-surface tracking-tight mb-1">Defense Simulation</h1>
              <p className="font-label-md text-on-surface-variant">Practice under pressure with AI jury members.</p>
            </div>
          </div>

          {/* STAGE: SETUP OR RECORDING */}
          <AnimatePresence mode="wait">
            {(stage === "setup" || stage === "recording_pitch" || stage === "processing_pitch") && (
              <motion.div 
                key="recording"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex-1 w-full flex flex-col items-center justify-center -mt-10"
              >
                <div className="w-full max-w-2xl bg-surface-container-lowest border border-outline-variant rounded-3xl p-md sm:p-xl flex flex-col items-center text-center shadow-sm relative overflow-hidden">
                  
                  {stage === "processing_pitch" && (
                     <div className="absolute inset-0 bg-surface/80 backdrop-blur-sm z-20 flex flex-col items-center justify-center">
                        <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4" />
                        <h3 className="font-headline-sm text-on-surface mb-2">Analyzing your pitch...</h3>
                        <p className="font-body-sm text-on-surface-variant">Evaluating pace, tone, and filler words.</p>
                     </div>
                  )}

                  <div className="relative mb-8 mt-4">
                    <div className={cn(
                      "w-32 h-32 rounded-full flex items-center justify-center transition-all duration-500",
                      stage === "recording_pitch" ? "bg-error/10 scale-110" : "bg-primary-container text-on-primary-container"
                    )}>
                      <span className={cn(
                        "material-symbols-outlined text-[48px] transition-colors",
                        stage === "recording_pitch" ? "text-error animate-pulse" : "text-primary text-opacity-80"
                      )}>
                        {stage === "recording_pitch" ? "mic" : "videocam"}
                      </span>
                    </div>
                    {stage === "recording_pitch" && (
                      <div className="absolute -inset-4 border-2 border-error/50 rounded-full animate-ping" />
                    )}
                  </div>

                  <h2 className="text-display text-on-surface mb-2 break-words">
                    {stage === "recording_pitch" ? "Recording in progress..." : "Ready to present?"}
                  </h2>
                  <p className="font-body-lg text-on-surface-variant max-w-md mb-8">
                    {stage === "recording_pitch" 
                      ? "Speak clearly. The AI is listening to your pace and arguments." 
                      : "Deliver your prepared pitch. We will analyze your performance and generate specific jury questions."}
                  </p>

                  {stage === "recording_pitch" ? (
                    <div className="flex flex-col items-center gap-4">
                      <div className="font-mono text-3xl font-bold tracking-wider text-error">
                        {Math.floor(timer / 60).toString().padStart(2, '0')}:{(timer % 60).toString().padStart(2, '0')}
                      </div>
                      <button 
                        onClick={handleStopRecording}
                        className="h-12 px-8 bg-error text-white font-label-lg rounded-xl flex items-center gap-2 hover:bg-error/90 transition-all shadow-md"
                      >
                        <span className="material-symbols-outlined">stop_circle</span> Stop & Analyze
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={handleStartRecording}
                      className="h-12 px-8 bg-primary text-on-primary font-label-lg rounded-xl flex items-center gap-2 hover:bg-primary/90 transition-all shadow-[0_4px_12px_rgba(var(--primary),0.2)] hover:-translate-y-0.5"
                    >
                      <span className="material-symbols-outlined">mic</span> Start Pitch
                    </button>
                  )}
                </div>
              </motion.div>
            )}

            {/* STAGE: JURY QUESTIONS & ANSWERS */}
            {(stage === "jury_questions" || stage === "processing_answers") && currentJury && currentQuestion && (
              <motion.div 
                key="questions"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex-1 w-full flex flex-col"
              >
                <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <h3 className="font-headline-sm text-on-surface flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">forum</span> Jury Q&A Session
                  </h3>
                  <span className="font-label-sm text-on-surface-variant bg-surface-container px-3 py-1 rounded-full">
                    Question {activeQuestionIndex + 1} of {questions.length}
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto mb-6 pr-2 space-y-6">
                  {questions.map((q, idx) => {
                    const j = JURY_MEMBERS.find(m => m.id === q.juryId);
                    if (!j || idx > activeQuestionIndex) return null;

                    return (
                      <div key={q.id} className="space-y-4">
                        {/* Jury Question Bubble */}
                        <motion.div 
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="flex items-start gap-3 sm:gap-4 max-w-full sm:max-w-[85%]"
                        >
                          <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border border-black/5 shadow-sm", j.bgColor, j.color)}>
                            <span className="material-symbols-outlined text-[24px]">{j.icon}</span>
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-label-md font-bold text-on-surface">{j.name}</span>
                              <span className="font-label-sm text-on-surface-variant px-2 py-0.5 rounded bg-surface-container">{j.role}</span>
                            </div>
                            <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl rounded-tl-none p-4 shadow-sm relative">
                              <p className="font-body-lg text-on-surface leading-relaxed">{q.text}</p>
                            </div>
                          </div>
                        </motion.div>

                        {/* Student Answer Bubble */}
                        {q.studentAnswer && (
                          <motion.div 
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-start gap-3 sm:gap-4 max-w-full sm:max-w-[85%] ml-auto flex-row-reverse"
                          >
                            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shrink-0 text-on-primary shadow-sm">
                              <span className="material-symbols-outlined text-[20px]">person</span>
                            </div>
                            <div>
                              <div className="flex items-center justify-end gap-2 mb-1">
                                <span className="font-label-md font-bold text-on-surface">You</span>
                              </div>
                              <div className="bg-primary text-on-primary rounded-2xl rounded-tr-none p-4 shadow-sm text-left">
                                <p className="font-body-lg leading-relaxed whitespace-pre-wrap">{q.studentAnswer}</p>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </div>
                    )
                  })}

                  {stage === "processing_answers" && (
                    <motion.div 
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="flex items-center gap-3 text-on-surface-variant p-4 ml-16"
                    >
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-on-surface-variant/40 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                        <span className="w-2 h-2 bg-on-surface-variant/40 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                        <span className="w-2 h-2 bg-on-surface-variant/40 rounded-full animate-bounce"></span>
                      </div>
                      <span className="font-label-sm">Jury is evaluating...</span>
                    </motion.div>
                  )}
                </div>

                {stage === "jury_questions" && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    className="mt-auto bg-surface-container-lowest border border-outline-variant p-2 rounded-2xl shadow-sm flex items-end gap-2"
                  >
                    <textarea 
                      value={currentAnswer}
                      onChange={e => setCurrentAnswer(e.target.value)}
                      placeholder="Type your answer here, or use the mic to speak..."
                      className="flex-1 bg-transparent border-none outline-none resize-none font-body-md text-on-surface p-3 min-h-[60px] max-h-[200px]"
                      rows={2}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleAnswerSubmit();
                        }
                      }}
                    />
                    <div className="flex items-center gap-1 p-1">
                      <button className="w-10 h-10 flex items-center justify-center rounded-xl text-on-surface-variant hover:bg-surface-container transition-colors">
                        <span className="material-symbols-outlined">mic</span>
                      </button>
                      <button 
                        onClick={handleAnswerSubmit}
                        disabled={!currentAnswer.trim()}
                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-primary text-on-primary disabled:opacity-50 transition-colors shadow-sm"
                      >
                        <span className="material-symbols-outlined">send</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* STAGE: FINAL FEEDBACK */}
            {stage === "final_feedback" && (
              <motion.div 
                key="feedback"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex-1 w-full flex flex-col mt-4"
              >
                 <div className="bg-surface-container-lowest border border-outline-variant rounded-3xl p-xl shadow-sm">
                    <div className="flex items-start justify-between mb-8">
                       <div>
                         <h2 className="text-display text-on-surface mb-2">Defense Complete</h2>
                         <p className="font-body-lg text-on-surface-variant">Here is your structured feedback from the jury.</p>
                       </div>
                       <div className="text-center">
                          <div className="w-20 h-20 rounded-full border-4 border-[#10B981] flex items-center justify-center mb-2 mx-auto">
                            <span className="text-[32px] font-bold text-[#059669]">82</span>
                          </div>
                          <span className="font-label-md text-on-surface-variant">Overall Score</span>
                       </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                       <div className="bg-[#10B981]/5 border border-[#10B981]/20 p-5 rounded-2xl">
                          <h4 className="font-label-lg font-bold text-[#059669] flex items-center gap-2 mb-3">
                            <span className="material-symbols-outlined">thumb_up</span> Strengths
                          </h4>
                          <ul className="space-y-2 text-on-surface">
                            <li className="flex items-start gap-2 font-body-sm"><span className="text-[#10B981] shrink-0 mt-0.5">•</span> Clear explanation of the architectural choices.</li>
                            <li className="flex items-start gap-2 font-body-sm"><span className="text-[#10B981] shrink-0 mt-0.5">•</span> Confident delivery during the technical questions.</li>
                            <li className="flex items-start gap-2 font-body-sm"><span className="text-[#10B981] shrink-0 mt-0.5">•</span> Excellent structural flow mirroring the report.</li>
                          </ul>
                       </div>
                       <div className="bg-[#EF4444]/5 border border-[#EF4444]/20 p-5 rounded-2xl">
                          <h4 className="font-label-lg font-bold text-[#B91C1C] flex items-center gap-2 mb-3">
                            <span className="material-symbols-outlined">trending_down</span> Weaknesses
                          </h4>
                          <ul className="space-y-2 text-on-surface">
                            <li className="flex items-start gap-2 font-body-sm"><span className="text-[#EF4444] shrink-0 mt-0.5">•</span> Hesitated on the business differentiation question.</li>
                            <li className="flex items-start gap-2 font-body-sm"><span className="text-[#EF4444] shrink-0 mt-0.5">•</span> Used filler words ("um", "like") several times.</li>
                            <li className="flex items-start gap-2 font-body-sm"><span className="text-[#EF4444] shrink-0 mt-0.5">•</span> Pacing was slightly rushed in the conclusion.</li>
                          </ul>
                       </div>
                    </div>

                    <div className="bg-surface-container-low border border-outline-variant p-6 rounded-2xl mb-8">
                      <h4 className="font-label-lg font-bold text-on-surface flex items-center gap-2 mb-3">
                        <span className="material-symbols-outlined text-primary">lightbulb</span> Actionable Improvements
                      </h4>
                      <p className="font-body-md text-on-surface-variant leading-relaxed">
                        To improve your final defense, consider adding a slide explicitly comparing your platform's features to Notion and Word. This will pre-empt the industry reviewer's questions. Also, practice pausing instead of using filler words during transitions.
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4">
                      <button 
                        onClick={() => { setStage("setup"); setQuestions([]); }}
                        className="h-10 px-6 bg-primary text-on-primary font-label-md rounded-lg flex items-center gap-2 hover:bg-primary/90 transition-all shadow-sm"
                      >
                        <span className="material-symbols-outlined">refresh</span> Retry Simulation
                      </button>
                      <button className="h-10 px-6 bg-surface-container-high text-on-surface font-label-md rounded-lg flex items-center gap-2 hover:bg-surface-container transition-colors">
                        <span className="material-symbols-outlined">ios_share</span> Export Feedback
                      </button>
                    </div>
                 </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>

      {/* RIGHT PANEL: Analytics Dashboard */}
      <div className="w-full lg:w-[340px] shrink-0 border-t lg:border-t-0 lg:border-l border-outline-variant bg-surface-container-lowest flex flex-col lg:h-full max-h-[50vh] lg:max-h-full overflow-y-auto">
        
        <div className="p-md border-b border-outline-variant bg-surface-container-low/50">
           <h3 className="font-headline-sm text-headline-sm text-on-surface mb-2 flex items-center gap-2">
             <span className="material-symbols-outlined text-primary">monitoring</span> Analytics
           </h3>
           <p className="font-body-sm text-on-surface-variant">Real-time tracking of your pitch delivery and Q&A performance.</p>
        </div>

        <div className="p-md border-b border-outline-variant">
           <h4 className="font-label-md font-bold text-on-surface mb-4">Speech Analysis</h4>
           <div className="space-y-4">
              <MetricBar label="Clarity" score={metrics.clarity} />
              <MetricBar label="Confidence" score={metrics.confidence} />
              <MetricBar label="Fluency" score={metrics.fluency} />
              
              <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-outline-variant">
                 <div className="bg-surface-container p-3 rounded-xl border border-outline-variant">
                    <span className="block font-label-xs text-on-surface-variant uppercase tracking-wider mb-1">Pace</span>
                    <div className="flex items-end gap-1">
                      <span className="text-2xl font-bold text-on-surface leading-none">{metrics.pace || "—"}</span>
                      <span className="font-label-xs text-on-surface-variant mb-0.5">wpm</span>
                    </div>
                 </div>
                 <div className="bg-error/5 p-3 rounded-xl border border-error/10">
                    <span className="block font-label-xs text-error uppercase tracking-wider mb-1">Fillers</span>
                    <div className="flex items-end gap-1">
                      <span className="text-2xl font-bold text-error leading-none">{metrics.fillers === 0 && stage === 'setup' ? "—" : metrics.fillers}</span>
                      <span className="font-label-xs text-error/70 mb-0.5">detected</span>
                    </div>
                 </div>
              </div>
           </div>
        </div>

        <div className="p-md">
           <h4 className="font-label-md font-bold text-on-surface mb-4">Jury Personalities</h4>
           <div className="space-y-3">
             {JURY_MEMBERS.map(j => (
                <div key={j.id} className="flex gap-3 p-3 rounded-xl bg-surface-container-lowest border border-outline-variant">
                   <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center shrink-0", j.bgColor, j.color)}>
                     <span className="material-symbols-outlined text-[20px]">{j.icon}</span>
                   </div>
                   <div>
                     <span className="block font-label-sm font-bold text-on-surface">{j.role}</span>
                     <span className="block text-[11px] text-on-surface-variant mt-0.5">Focus: {j.focus}</span>
                   </div>
                </div>
             ))}
           </div>
        </div>

      </div>

    </div>
  )
}

function MetricBar({ label, score }: { label: string, score: number }) {
  const isZero = score === 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between font-label-sm">
        <span className="text-on-surface-variant">{label}</span>
        <span className={cn(isZero ? "text-outline" : "text-primary font-bold")}>{isZero ? "—" : `${score}%`}</span>
      </div>
      <div className="h-1.5 w-full bg-surface-container-high rounded-full overflow-hidden">
        <motion.div 
          className="h-full bg-primary rounded-full transition-all duration-1000"
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
        />
      </div>
    </div>
  )
}
