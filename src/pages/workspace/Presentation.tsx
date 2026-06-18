import React, { useState, useEffect } from "react";
import InfoTooltip from "@/components/ui/InfoTooltip";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";
import confetti from "canvas-confetti";

type SlideStatus = "completed" | "in-progress" | "not-started";
type Duration = 5 | 10 | 15 | 20;

interface Slide {
  id: string;
  title: string;
  status: SlideStatus;
  objective: string;
  content: string;
  speakerNotes: string;
}

export default function Presentation() {
  const [duration, setDuration] = useState<Duration>(15);
  const [slides, setSlides] = useState<Slide[]>([]);
  const [activeSlideId, setActiveSlideId] = useState<string | null>(null);
  
  const [isEditing, setIsEditing] = useState(false);
  const [draftContent, setDraftContent] = useState("");
  const [draftNotes, setDraftNotes] = useState("");

  const activeSlide = slides.find(s => s.id === activeSlideId);
  const completedCount = slides.filter(s => s.status === "completed").length;
  const progressPercent = slides.length > 0 ? Math.round((completedCount / slides.length) * 100) : 0;

  useEffect(() => {
    if (activeSlide) {
      setDraftContent(activeSlide.content);
      setDraftNotes(activeSlide.speakerNotes);
      setIsEditing(false);
    }
  }, [activeSlideId, slides]);

  const handleGenerateStructure = () => {
    const numSlides = duration === 5 ? 6 : duration === 10 ? 10 : duration === 15 ? 15 : 20;
    
    const initial: Slide[] = [
      { id: "s1", title: "Title Slide", status: "completed", objective: "Introduce the project, the student, and the supervisors.", content: "• Project Title: Intelligent PFE Guidance Platform\n• Student: John Doe\n• Supervisor: Dr. Smith\n• Academic Year: 2023-2024", speakerNotes: "Good morning esteemed jury members. My name is John Doe, and today I will present my final year project..." },
      { id: "s2", title: "Context & Company", status: "completed", objective: "Provide brief background on the host company and project context.", content: "• Tech Solutions Inc.\n• Context: Academic supervision is difficult to structure\n• Need for an automated guidance system", speakerNotes: "I completed my internship at Tech Solutions Inc. We noticed that students often struggle with the methodology..." },
      { id: "s3", title: "Problem Statement", status: "in-progress", objective: "Clearly identify the core problem being solved.", content: "• Students face high cognitive load when writing reports\n• Existing tools (Word, Notion) are too generic\n• Lack of structured progress tracking", speakerNotes: "The main problem we identified is that blank document editors cause anxiety. Students don't know where to start..." },
      { id: "s4", title: "Proposed Solution", status: "not-started", objective: "Introduce the platform and its core value proposition.", content: "• Guided methodology workflow\n• Step-by-step report builder\n• Contextual AI assistance (no generic chatbots)", speakerNotes: "" },
      { id: "s5", title: "Architecture & Tech Stack", status: "not-started", objective: "Explain the technical choices and system design.", content: "• Frontend: React, Tailwind CSS\n• Backend: Node.js, Express\n• Database: Cloud SQL (PostgreSQL)\n• AI: Gemini 1.5 Pro via Google AI SDK", speakerNotes: "" },
      { id: "s6", title: "Key Features Demonstration", status: "not-started", objective: "Highlight 2-3 main features with screenshots or descriptions.", content: "", speakerNotes: "" },
      { id: "s7", title: "Conclusion & Perspectives", status: "not-started", objective: "Summarize the project outcome and future improvements.", content: "", speakerNotes: "" }
    ];
    
    setSlides(initial);
    setActiveSlideId(initial[0].id);
  };

  const handleMarkComplete = () => {
    if (!activeSlide) return;
    setSlides(prev => prev.map(s => s.id === activeSlide.id ? { ...s, status: "completed", content: draftContent, speakerNotes: draftNotes } : s));
    
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.65 },
      colors: ['#10B981', '#34D399', '#059669', '#A7F3D0'],
      disableForReducedMotion: true,
      zIndex: 100,
    });
  };

  const handleSave = () => {
    if (!activeSlide) return;
    setSlides(prev => prev.map(s => s.id === activeSlide.id ? { ...s, content: draftContent, speakerNotes: draftNotes, status: s.status === "not-started" ? "in-progress" : s.status } : s));
    setIsEditing(false);
  };

  const handleMoveSlide = (direction: 'up' | 'down') => {
    if (!activeSlide) return;
    const index = slides.findIndex(s => s.id === activeSlide.id);
    if (direction === 'up' && index > 0) {
      const newSlides = [...slides];
      [newSlides[index - 1], newSlides[index]] = [newSlides[index], newSlides[index - 1]];
      setSlides(newSlides);
    } else if (direction === 'down' && index < slides.length - 1) {
      const newSlides = [...slides];
      [newSlides[index + 1], newSlides[index]] = [newSlides[index], newSlides[index + 1]];
      setSlides(newSlides);
    }
  };

  const handleAddSlide = () => {
    const newId = `s${Date.now()}`;
    const newSlide: Slide = {
      id: newId,
      title: "New Slide",
      status: "not-started",
      objective: "Define the objective for this slide.",
      content: "",
      speakerNotes: ""
    };
    
    if (activeSlide) {
      const index = slides.findIndex(s => s.id === activeSlide.id);
      const newSlides = [...slides];
      newSlides.splice(index + 1, 0, newSlide);
      setSlides(newSlides);
    } else {
      setSlides([...slides, newSlide]);
    }
    setActiveSlideId(newId);
  };

  const handleDeleteSlide = () => {
    if (!activeSlide) return;
    const index = slides.findIndex(s => s.id === activeSlide.id);
    const newSlides = slides.filter(s => s.id !== activeSlide.id);
    setSlides(newSlides);
    if (newSlides.length > 0) {
      setActiveSlideId(newSlides[Math.min(index, newSlides.length - 1)].id);
    } else {
      setActiveSlideId(null);
    }
  };

  return (
    <div className="flex h-[calc(100vh-100px)] w-[calc(100%+64px)] -mx-xl -my-margin flex-col lg:flex-row overflow-hidden relative">
      
      {/* LEFT PANEL: Slide Outline */}
      <div className="w-full lg:w-[320px] shrink-0 border-b lg:border-b-0 lg:border-r border-outline-variant bg-surface-container-lowest flex flex-col pt-md lg:h-full max-h-[35vh] lg:max-h-full">
        <div className="px-md mb-sm lg:mb-lg">
          <h2 className="font-headline-sm text-headline-sm text-on-surface mb-xs hidden lg:block">Presentation Plan</h2>
          
          <div className="bg-surface-container-low rounded-xl p-md border border-outline-variant mt-sm">
            <div className="mb-3">
              <span className="block font-label-sm font-bold text-on-surface-variant uppercase tracking-wider mb-2">Duration Mode</span>
              <div className="flex bg-surface-container rounded-lg p-1">
                {([5, 10, 15, 20] as Duration[]).map(d => (
                  <button 
                    key={d}
                    onClick={() => setDuration(d)}
                    disabled={slides.length > 0}
                    className={cn(
                      "flex-1 py-1.5 rounded-md font-label-sm transition-colors",
                      duration === d 
                        ? "bg-surface shadow-[0_1px_3px_rgba(0,0,0,0.1)] text-on-surface font-bold" 
                        : "text-on-surface-variant hover:text-on-surface",
                      slides.length > 0 && duration !== d ? "opacity-30 cursor-not-allowed" : ""
                    )}
                  >
                    {d}m
                  </button>
                ))}
              </div>
            </div>

            {slides.length > 0 && (
              <>
                <div className="flex justify-between items-end mb-2 pt-3 border-t border-outline-variant">
                  <span className="font-label-sm text-on-surface-variant">Preparation Progress</span>
                  <span className="font-label-md font-bold text-primary">{progressPercent}%</span>
                </div>
                <div className="h-1.5 w-full bg-surface-container-high rounded-full overflow-hidden mb-1">
                  <motion.div 
                    className="h-full bg-primary"
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {slides.length > 0 ? (
          <div className="flex-1 overflow-y-auto px-sm pb-lg space-y-1 custom-scrollbar">
            {slides.map((slide, index) => {
              const isActive = slide.id === activeSlideId;
              return (
                <button
                  key={slide.id}
                  onClick={() => setActiveSlideId(slide.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors group",
                    isActive 
                      ? "bg-primary-container text-on-primary-container" 
                      : "hover:bg-surface-container-low text-on-surface-variant"
                  )}
                >
                  <span className={cn("font-label-sm w-4 shrink-0 opacity-50", isActive ? "text-primary" : "")}>{index + 1}.</span>
                  {slide.status === "completed" && <span className="material-symbols-outlined text-[16px] text-[#10B981] shrink-0">check_circle</span>}
                  {slide.status === "in-progress" && <span className="material-symbols-outlined text-[16px] text-[#F59E0B] shrink-0">warning</span>}
                  {slide.status === "not-started" && <span className="material-symbols-outlined text-[16px] text-outline shrink-0">radio_button_unchecked</span>}
                  <span className={cn("font-body-sm text-body-sm truncate flex-1", isActive ? "font-semibold" : "")}>
                    {slide.title}
                  </span>
                </button>
              )
            })}
          </div>
        ) : (
          <div className="flex-1 p-md flex flex-col justify-center text-center opacity-70">
            <span className="material-symbols-outlined text-4xl mb-2 text-on-surface-variant">view_carousel</span>
            <p className="font-body-sm text-on-surface-variant">Set your duration and generate a structure to start.</p>
          </div>
        )}
        
        {slides.length > 0 && (
          <div className="p-md border-t border-outline-variant bg-surface-container-lowest">
            <h4 className="font-label-sm font-bold text-on-surface mb-2 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">fact_check</span> Defense Alignment
            </h4>
            <div className="space-y-1.5 flex flex-col pt-1">
              <div className="flex items-center gap-2 font-label-sm text-on-surface-variant">
                <span className="material-symbols-outlined text-[14px] text-[#10B981]">check</span> Problem Statement
              </div>
              <div className="flex items-center gap-2 font-label-sm text-on-surface-variant">
                <span className="material-symbols-outlined text-[14px] text-[#10B981]">check</span> Requirements
              </div>
              <div className="flex items-center gap-2 font-label-sm text-on-surface-variant">
                <span className="material-symbols-outlined text-[14px] text-[#10B981]">check</span> Solution
              </div>
              <div className="flex items-center gap-2 font-label-sm text-on-surface-variant">
                <span className="material-symbols-outlined text-[14px] text-[#D97706]">warning</span> Testing / Validation
              </div>
              <div className="flex items-center gap-2 font-label-sm text-on-surface-variant">
                <span className="material-symbols-outlined text-[14px] text-[#D97706]">warning</span> Results
              </div>
            </div>
          </div>
        )}
      </div>

      {/* CENTER PANEL: Workspace */}
      <div className="flex-1 overflow-y-auto bg-surface flex flex-col shadow-[-4px_0_24px_rgba(0,0,0,0.02)] z-10 relative custom-scrollbar">
        {slides.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-surface w-full h-[50vh] lg:h-auto">
            <div className="w-20 h-20 rounded-3xl bg-primary-container flex items-center justify-center mb-6">
              <span className="material-symbols-outlined text-[36px] text-on-primary-container">co_present</span>
            </div>
            <h2 className="text-display text-on-surface tracking-tight mb-4">No presentation structure defined yet</h2>
            <p className="font-body-lg text-on-surface-variant max-w-md mb-8">
              Generate an academic defense sequence optimized for your {duration}-minute presentation length.
            </p>
            <button 
              onClick={handleGenerateStructure}
              className="h-12 px-8 bg-primary text-on-primary font-label-lg rounded-xl flex items-center gap-2 hover:bg-primary/90 transition-all shadow-[0_4px_12px_rgba(var(--primary),0.2)] hover:shadow-[0_4px_16px_rgba(var(--primary),0.3)] hover:-translate-y-0.5"
            >
              <span className="material-symbols-outlined text-[20px]">auto_awesome</span>
              Generate Presentation Structure
            </button>
          </div>
        ) : activeSlide ? (
          <div className="max-w-3xl w-full mx-auto p-md lg:p-xl flex-1 flex flex-col">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                {isEditing ? (
                  <input
                    type="text"
                    value={activeSlide.title}
                    onChange={(e) => setSlides(prev => prev.map(s => s.id === activeSlide.id ? { ...s, title: e.target.value } : s))}
                    className="text-display text-on-surface tracking-tight w-full bg-transparent border-b-2 border-primary outline-none py-1"
                  />
                ) : (
                  <h1 className="text-display text-on-surface tracking-tight">{activeSlide.title}</h1>
                )}
              </div>
              
              <div className="flex items-center gap-2 shrink-0 ml-4">
                <button title="Move Up" onClick={() => handleMoveSlide('up')} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container text-on-surface-variant transition-colors disabled:opacity-30">
                  <span className="material-symbols-outlined text-[20px]">arrow_upward</span>
                </button>
                <button title="Move Down" onClick={() => handleMoveSlide('down')} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container text-on-surface-variant transition-colors disabled:opacity-30">
                  <span className="material-symbols-outlined text-[20px]">arrow_downward</span>
                </button>
                <div className="w-px h-6 bg-outline-variant mx-1"></div>
                <button title="Add Slide Here" onClick={handleAddSlide} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container text-on-surface-variant transition-colors">
                  <span className="material-symbols-outlined text-[20px]">add</span>
                </button>
                <button title="Delete Slide" onClick={handleDeleteSlide} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-error-container hover:text-error text-on-surface-variant transition-colors">
                  <span className="material-symbols-outlined text-[20px]">delete</span>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3 mb-6">
              {activeSlide.status === "completed" && (
                <span className="font-label-sm text-label-sm bg-[#10B981]/10 text-[#059669] px-2.5 py-1 rounded border border-[#10B981]/20 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[14px]">check_circle</span> Completed
                </span>
              )}
              {activeSlide.status === "in-progress" && (
                <span className="font-label-sm text-label-sm bg-[#FEF3C7] text-[#D97706] px-2.5 py-1 rounded border border-[#FDE68A] uppercase tracking-wider flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[14px]">warning</span> In Progress
                </span>
              )}
              {activeSlide.status === "not-started" && (
                <span className="font-label-sm text-label-sm bg-surface-container-high text-on-surface-variant px-2.5 py-1 rounded border border-outline-variant uppercase tracking-wider flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[14px]">radio_button_unchecked</span> Not Started
                </span>
              )}
            </div>

            <div className="bg-secondary-container text-on-secondary-container p-4 rounded-xl mb-8 flex items-start gap-3 border border-secondary/20">
              <span className="material-symbols-outlined text-[20px] mt-0.5">track_changes</span>
              <div>
                <span className="block font-label-md font-bold mb-1">Slide Objective</span>
                {isEditing ? (
                  <textarea
                    value={activeSlide.objective}
                    onChange={(e) => setSlides(prev => prev.map(s => s.id === activeSlide.id ? { ...s, objective: e.target.value } : s))}
                    className="w-full bg-transparent border-b border-on-secondary-container/30 outline-none font-body-sm resize-none custom-scrollbar"
                    rows={2}
                  />
                ) : (
                  <p className="font-body-sm">{activeSlide.objective}</p>
                )}
              </div>
            </div>

            <div className="flex-1 flex flex-col gap-6 mb-10">
              <div className="flex items-center justify-between border-b border-outline-variant pb-2">
                <h3 className="font-headline-sm text-on-surface">Slide Content</h3>
                {!isEditing ? (
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setIsEditing(true)}
                      className="h-8 px-3 font-label-sm text-on-surface hover:bg-surface-container-low border border-outline-variant rounded-md flex items-center gap-1.5 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[16px]">edit</span> Edit
                    </button>
                    <button 
                      onClick={handleMarkComplete}
                      disabled={activeSlide.status === "completed"}
                      className={cn(
                        "h-8 px-3 font-label-sm rounded-md flex items-center gap-1.5 transition-all shadow-sm",
                        activeSlide.status === "completed" 
                          ? "bg-surface-container-high text-on-surface-variant opacity-50 cursor-not-allowed border border-outline-variant"
                          : "bg-[#10B981] hover:bg-[#059669] text-white"
                      )}
                    >
                      <span className="material-symbols-outlined text-[16px]">done_all</span> Mark Complete
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setIsEditing(false)}
                      className="h-8 px-3 font-label-sm text-on-surface hover:bg-surface-container-low rounded-md transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleSave}
                      className="h-8 px-3 bg-primary text-on-primary font-label-sm rounded-md hover:bg-primary/90 transition-colors shadow-sm"
                    >
                      Save
                    </button>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-8 flex-1">
                <div className="flex-1 min-h-[200px]">
                  <label className="block font-label-sm font-bold text-on-surface-variant uppercase tracking-wider mb-3 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px]">format_list_bulleted</span> Key Points
                  </label>
                  <div className={cn(
                    "w-full h-full rounded-xl transition-all duration-300",
                    isEditing ? "border-2 border-primary focus-within:ring-4 focus-within:ring-primary/10" : "border border-outline-variant bg-surface-container-lowest"
                  )}>
                    <textarea
                      value={draftContent}
                      onChange={(e) => setDraftContent(e.target.value)}
                      readOnly={!isEditing}
                      placeholder={isEditing ? "Enter bullet points to display on the slide..." : "No visual content planned for this slide. Click Edit to add some."}
                      className={cn(
                        "w-full h-[180px] resize-none outline-none font-body-lg leading-relaxed text-on-surface bg-transparent custom-scrollbar p-4",
                        !isEditing && !draftContent && "italic text-on-surface-variant opacity-70"
                      )}
                    />
                  </div>
                </div>

                <div className="flex-1 min-h-[200px]">
                  <label className="block font-label-sm font-bold text-on-surface-variant uppercase tracking-wider mb-3 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px]">record_voice_over</span> Speaker Notes
                  </label>
                  <div className={cn(
                    "w-full h-full rounded-xl transition-all duration-300",
                    isEditing ? "border-2 border-primary focus-within:ring-4 focus-within:ring-primary/10" : "border-l-4 border-l-primary bg-primary-container/20 border-y border-r border-outline-variant"
                  )}>
                    <textarea
                      value={draftNotes}
                      onChange={(e) => setDraftNotes(e.target.value)}
                      readOnly={!isEditing}
                      placeholder={isEditing ? "Write down what you want to actually say during the defense..." : "No speaker notes yet."}
                      className={cn(
                        "w-full h-[180px] resize-none outline-none font-body-lg leading-relaxed text-on-surface bg-transparent custom-scrollbar p-4",
                        !isEditing && !draftNotes && "italic text-on-surface-variant opacity-70"
                      )}
                    />
                  </div>
                </div>
              </div>

            </div>
          </div>
        ) : null}
      </div>

      {/* RIGHT PANEL: AI Coach */}
      {slides.length > 0 && activeSlide && (
        <div className="w-full lg:w-[320px] shrink-0 border-t lg:border-t-0 lg:border-l border-outline-variant bg-surface-container-lowest flex flex-col lg:h-full max-h-[40vh] lg:max-h-full overflow-y-auto">
          <div className="p-md border-b border-outline-variant bg-primary-container/30">
            <h3 className="font-headline-sm text-headline-sm text-on-surface flex items-center gap-1.5 mb-2">
              <span className="material-symbols-outlined text-[20px] text-primary">school</span>
              AI Coach
            </h3>
            <p className="font-body-sm text-on-surface-variant">Contextual guidance tailored for this specific slide to help you present effectively.</p>
          </div>

          <div className="p-md border-b border-outline-variant">
            <h4 className="font-label-md font-bold text-on-surface mb-3 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px] text-[#8B5CF6]">tips_and_updates</span> Speaker Tips
            </h4>
            <ul className="space-y-2 mb-4">
              <li className="font-body-sm text-on-surface-variant flex items-start gap-2">
                <span className="text-[#10B981] font-bold mt-0.5">Do:</span> Keep it conversational. Remember the jury has already read the report.
              </li>
              <li className="font-body-sm text-on-surface-variant flex items-start gap-2">
                <span className="text-error font-bold mt-0.5">Don't:</span> Read directly from the slide. Use it only as a visual cue.
              </li>
            </ul>
          </div>

          <div className="p-md border-b border-outline-variant">
            <h4 className="font-label-md font-bold text-on-surface mb-3 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px] text-[#F59E0B]">quick_reference_all</span> Jury Perspective
            </h4>
            <div className="bg-surface-container p-3 rounded-lg border border-outline-variant">
              <p className="font-label-sm font-bold text-on-surface mb-1">Expected Question:</p>
              <p className="font-body-sm text-on-surface-variant italic">
                "{activeSlide.id === 's3' ? "Why is this problem significant enough for a 6-month PFE?" : "Could you elaborate on why you chose this specific approach over alternatives?"}"
              </p>
            </div>
          </div>

          <div className="p-md">
            <h4 className="font-label-md font-bold text-on-surface mb-3 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px] text-primary">bolt</span> Quick Actions
            </h4>
            <div className="flex flex-col gap-2">
              <ActionCard icon="record_voice_over" title="Draft Speaker Notes" desc="Generate natural speech text" />
              <ActionCard icon="short_text" title="Make Visuals Concise" desc="Reduce slide bullet points" />
              <ActionCard icon="security" title="Academic Tone Check" desc="Ensure professional vocabulary" />
            </div>
          </div>
        </div>
      )}
      
    </div>
  )
}

function ActionCard({ icon, title, desc }: { icon: string, title: string, desc: string }) {
  return (
    <button className="flex items-center gap-3 p-3 rounded-xl border border-outline-variant bg-surface-container-lowest hover:bg-surface-container-low hover:border-outline shadow-sm transition-all duration-200 text-left group">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-primary-container text-on-primary-container group-hover:bg-primary group-hover:text-on-primary transition-colors">
        <span className="material-symbols-outlined text-[18px]">{icon}</span>
      </div>
      <div>
        <span className="block font-label-md text-label-md text-on-surface line-clamp-1">{title}</span>
        <span className="block font-label-sm text-label-sm text-on-surface-variant line-clamp-1 mt-0.5">{desc}</span>
      </div>
    </button>
  )
}

