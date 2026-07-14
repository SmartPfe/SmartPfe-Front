import React, { useState, useEffect } from "react";
import InfoTooltip from "@/components/ui/InfoTooltip";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";
import confetti from "canvas-confetti";
import { useNavigate } from "react-router-dom";

type PitchTab = "script" | "points";
type SectionStatus = "completed" | "in-progress" | "not-started";

interface PitchSection {
  id: string;
  title: string;
  icon: string;
  durationSec: number; // in seconds
  status: SectionStatus;
  script: string;
  keyPoints: string[];
}

const INITIAL_SECTIONS: PitchSection[] = [
  { 
    id: "p1", 
    title: "Introduction", 
    icon: "waving_hand", 
    durationSec: 45, 
    status: "completed", 
    script: "Good morning esteemed jury members. My name is [Your Name], and today I will present my final year project titled: 'Intelligent PFE Guidance Platform'.\n\nThis project was conducted at [Company Name] under the supervision of [Supervisor Name]. The main objective of this work is to provide a structured, AI-assisted methodology for students preparing their academic reports and oral defenses.", 
    keyPoints: ["Greet the jury", "Introduce yourself", "State project title", "Mention host company & supervisors"]
  },
  { 
    id: "p2", 
    title: "Problem Statement", 
    icon: "target", 
    durationSec: 60, 
    status: "in-progress", 
    script: "During our initial research, we observed that students face significant cognitive load when writing reports. Existing tools like Word or Notion provide blank pages, which often lead to anxiety and lack of progression.\n\nWithout a guided methodology, structuring an academic report becomes a tedious task, leading to poor quality documentation and stressful defense preparations.", 
    keyPoints: ["Cognitive load of blank pages", "Limitations of existing tools", "Impact on student mental health"]
  },
  { 
    id: "p3", 
    title: "Proposed Solution", 
    icon: "lightbulb", 
    durationSec: 90, 
    status: "not-started", 
    script: "", 
    keyPoints: []
  },
  { 
    id: "p4", 
    title: "Architecture", 
    icon: "architecture", 
    durationSec: 90, 
    status: "not-started", 
    script: "", 
    keyPoints: []
  },
  { 
    id: "p5", 
    title: "Implementation", 
    icon: "build", 
    durationSec: 90, 
    status: "not-started", 
    script: "", 
    keyPoints: []
  },
  { 
    id: "p6", 
    title: "Results & Evaluation", 
    icon: "monitoring", 
    durationSec: 75, 
    status: "not-started", 
    script: "", 
    keyPoints: []
  },
  { 
    id: "p7", 
    title: "Conclusion", 
    icon: "flag", 
    durationSec: 45, 
    status: "not-started", 
    script: "", 
    keyPoints: []
  },
  { 
    id: "p8", 
    title: "Q&A Transition", 
    icon: "forum", 
    durationSec: 15, 
    status: "not-started", 
    script: "", 
    keyPoints: []
  }
];

export default function Pitch() {
  const navigate = useNavigate();
  const [sections, setSections] = useState<PitchSection[]>(INITIAL_SECTIONS);
  const [activeId, setActiveId] = useState<string>("p1");
  const [activeTab, setActiveTab] = useState<PitchTab>("script");
  const [isEditing, setIsEditing] = useState(false);
  const [draftScript, setDraftScript] = useState("");

  const activeSection = sections.find(s => s.id === activeId) || sections[0];
  const completedCount = sections.filter(s => s.status === "completed").length;
  
  // Calculate total duration in seconds
  const totalDurationSec = sections.reduce((acc, curr) => acc + curr.durationSec, 0);
  const totalMin = Math.floor(totalDurationSec / 60);
  const totalSec = totalDurationSec % 60;

  useEffect(() => {
    setDraftScript(activeSection.script);
    setIsEditing(false);
    setActiveTab("script");
  }, [activeId, sections]);

  const handleSave = () => {
    setSections(prev => prev.map(s => s.id === activeId ? { ...s, script: draftScript, status: s.status === "not-started" ? "in-progress" : s.status } : s));
    setIsEditing(false);
  };

  const handleMarkComplete = () => {
    setSections(prev => prev.map(s => s.id === activeId ? { ...s, script: draftScript, status: "completed" } : s));
    setIsEditing(false);
    confetti({
      particleCount: 60,
      spread: 60,
      origin: { y: 0.65 },
      colors: ['#4f46e5', '#8B5CF6', '#3b82f6', '#c084fc'],
      disableForReducedMotion: true,
      zIndex: 100,
    });
  };

  const handleGenerateScript = () => {
    setDraftScript(`[AI Generated Draft for ${activeSection.title}]\n\nBased on your report context, begin by addressing the jury clearly.\n\n"Today I will guide you through the ${activeSection.title} phase of our project. As we established in the previous section, the main focus here is..."`);
    setIsEditing(true);
  };

  const handleMoveSection = (direction: 'up' | 'down') => {
    const index = sections.findIndex(s => s.id === activeId);
    if (direction === 'up' && index > 0) {
      const newSections = [...sections];
      [newSections[index - 1], newSections[index]] = [newSections[index], newSections[index - 1]];
      setSections(newSections);
    } else if (direction === 'down' && index < sections.length - 1) {
      const newSections = [...sections];
      [newSections[index + 1], newSections[index]] = [newSections[index], newSections[index + 1]];
      setSections(newSections);
    }
  };

  return (
    <div className="flex min-h-[calc(100dvh-150px)] lg:h-[calc(100dvh-150px)] w-full flex-col lg:flex-row overflow-hidden relative bg-surface rounded-xl border border-outline-variant">
      
      {/* LEFT PANEL: Pitch Sections Navigator */}
      <div className="w-full lg:w-[320px] shrink-0 border-b lg:border-b-0 lg:border-r border-outline-variant bg-surface-container-lowest flex flex-col pt-md lg:h-full max-h-[35vh] lg:max-h-full">
        <div className="px-md mb-sm lg:mb-md">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-headline-sm text-headline-sm text-on-surface hidden lg:block">Pitch Builder</h2>
            <span className="font-label-sm bg-primary/10 text-primary px-2.5 py-0.5 rounded-full">{sections.length} sections</span>
          </div>

          <div className="flex gap-2 mb-4">
            <button className="flex-1 bg-primary text-on-primary font-label-md py-2 rounded-lg hover:bg-primary/90 flex items-center justify-center gap-2 transition-colors shadow-sm">
              <span className="material-symbols-outlined text-[18px]">add</span> Add Section
            </button>
            <button className="flex-1 bg-surface-container-low text-on-surface-variant font-label-md py-2 rounded-lg hover:bg-surface-container hover:text-on-surface border border-outline-variant flex items-center justify-center gap-2 transition-colors">
              <span className="material-symbols-outlined text-[18px]">auto_awesome</span> Generate
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-sm pb-lg space-y-2 custom-scrollbar">
          {sections.map((section, index) => {
            const isActive = section.id === activeId;
            return (
              <div 
                key={section.id}
                onClick={() => setActiveId(section.id)}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all border cursor-pointer group",
                  isActive 
                    ? "bg-primary-container text-on-primary-container border-[#8B5CF6]/30 shadow-sm" 
                    : "bg-surface-container-lowest hover:bg-surface-container-low border-outline-variant hover:border-outline"
                )}
              >
                <span className={cn("font-label-md w-4 shrink-0 text-center opacity-50", isActive ? "text-primary" : "")}>{index + 1}</span>
                
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                  isActive ? "bg-white text-[#8B5CF6] shadow-sm" : "bg-surface-container text-on-surface-variant"
                )}>
                  <span className="material-symbols-outlined text-[18px]">{section.icon}</span>
                </div>
                
                <div className="flex-1 min-w-0">
                  <span className={cn("block font-label-md truncate mb-0.5", isActive ? "font-bold" : "text-on-surface")}>
                    {section.title}
                  </span>
                  <span className="block font-label-sm text-on-surface-variant flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px]">schedule</span>
                    ~ {section.durationSec} sec
                  </span>
                </div>

                <div className="shrink-0 flex items-center">
                  {section.status === "completed" && <span className="material-symbols-outlined text-[18px] text-[#10B981]">check_circle</span>}
                  {section.status === "in-progress" && <span className="material-symbols-outlined text-[18px] text-[#F59E0B]">warning</span>}
                  {section.status === "not-started" && <span className="material-symbols-outlined text-[18px] text-outline opacity-30">radio_button_unchecked</span>}
                </div>
              </div>
            )
          })}
        </div>

        {/* Readiness Widget at Bottom */}
        <div className="p-md border-t border-outline-variant bg-surface-container-lowest mt-auto hidden lg:block">
          <h4 className="font-label-md font-bold text-on-surface mb-3">Pitch Readiness</h4>
          <div className="flex items-center gap-4 mb-4">
            <div className="relative w-14 h-14 shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" className="text-surface-container-high" />
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray={`${Math.round((completedCount/sections.length)*100)}, 100`} className="text-primary" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center font-label-md font-bold text-on-surface">
                {Math.round((completedCount/sections.length)*100)}%
              </div>
            </div>
            <div className="flex flex-col gap-1.5 flex-1">
              <div className="flex items-center justify-between font-label-sm">
                <span className="text-on-surface-variant">Speech Generated</span>
                <span className="material-symbols-outlined text-[14px] text-[#10B981]">check_circle</span>
              </div>
              <div className="flex items-center justify-between font-label-sm">
                <span className="text-on-surface-variant">Timing Optimized</span>
                <span className="material-symbols-outlined text-[14px] text-[#10B981]">check_circle</span>
              </div>
              <div className="flex items-center justify-between font-label-sm">
                <span className="text-on-surface-variant">Practice Done</span>
                <span className="material-symbols-outlined text-[14px] text-outline">radio_button_unchecked</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CENTER PANEL: Main Workspace */}
      <div className="flex-1 min-w-0 overflow-y-auto bg-surface flex flex-col shadow-[-4px_0_24px_rgba(0,0,0,0.02)] z-10 relative custom-scrollbar">
        <div className="max-w-3xl w-full mx-auto p-md lg:p-xl flex-1 flex flex-col pt-lg">
          
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-12 h-12 rounded-xl bg-primary-container text-on-primary-container flex items-center justify-center">
                <span className="material-symbols-outlined text-[24px]">{activeSection.icon}</span>
              </div>
              <div>
                <h1 className="text-display text-on-surface tracking-tight mb-1 flex items-center gap-2 break-words">
                  {activeSection.title}
                  <span className="text-[20px]">👋</span>
                </h1>
                <span className="font-label-md text-on-surface-variant flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px]">schedule</span>
                  Estimated time: ~ {activeSection.durationSec} sec
                </span>
              </div>
            </div>
            
            <div className="flex gap-2 shrink-0">
              <button 
                onClick={() => handleMoveSection('up')}
                className="w-10 h-10 flex items-center justify-center rounded-lg border border-outline-variant text-on-surface-variant hover:bg-surface-container-low transition-colors"
              >
                <span className="material-symbols-outlined">arrow_upward</span>
              </button>
              <button 
                onClick={() => handleMoveSection('down')}
                className="w-10 h-10 flex items-center justify-center rounded-lg border border-outline-variant text-on-surface-variant hover:bg-surface-container-low transition-colors"
              >
                <span className="material-symbols-outlined">arrow_downward</span>
              </button>
            </div>
          </div>

          <div className="flex-1 flex flex-col bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-sm overflow-hidden mb-8 max-h-[500px]">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-outline-variant px-4 pt-4 bg-surface-container-lowest">
              <div className="flex gap-4 sm:gap-6">
                <button 
                  onClick={() => setActiveTab("script")} 
                  className={cn("pb-3 font-label-md transition-colors border-b-2", activeTab === "script" ? "border-primary text-primary" : "border-transparent text-on-surface-variant hover:text-on-surface")}
                >
                  Speech Script
                </button>
                <button 
                  onClick={() => setActiveTab("points")} 
                  className={cn("pb-3 font-label-md transition-colors border-b-2", activeTab === "points" ? "border-primary text-primary" : "border-transparent text-on-surface-variant hover:text-on-surface")}
                >
                  Key Points
                </button>
              </div>
              <button onClick={handleGenerateScript} className="pb-3 text-primary font-label-sm flex items-center gap-1.5 hover:text-primary/80 transition-colors">
                <span className="material-symbols-outlined text-[16px]">autorenew</span> Regenerate
              </button>
            </div>

            <div className="flex-1 p-6 overflow-y-auto">
              <AnimatePresence mode="wait">
                {activeTab === "script" ? (
                  <motion.div 
                    key="script"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="h-full flex flex-col"
                  >
                    {!draftScript && !isEditing ? (
                      <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 text-on-surface-variant my-8">
                        <span className="material-symbols-outlined text-4xl opacity-50">mic_external_off</span>
                        <p className="font-body-md max-w-sm">No speech drafted for this section yet. Generate one to get started.</p>
                        <button onClick={handleGenerateScript} className="h-9 px-4 bg-surface-container-high hover:bg-surface-container text-on-surface font-label-md rounded-lg transition-colors border border-outline-variant">
                          Generate Draft
                        </button>
                      </div>
                    ) : (
                      <textarea
                        value={draftScript}
                        onChange={(e) => setDraftScript(e.target.value)}
                        readOnly={!isEditing}
                        className={cn(
                          "flex-1 w-full resize-none outline-none font-body-lg leading-[1.8] bg-transparent custom-scrollbar",
                          isEditing ? "text-on-surface" : "text-on-surface-variant"
                        )}
                        placeholder="Start typing your speech..."
                      />
                    )}
                  </motion.div>
                ) : (
                  <motion.div 
                    key="points"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="h-full"
                  >
                    {activeSection.keyPoints.length > 0 ? (
                      <ul className="space-y-4">
                        {activeSection.keyPoints.map((point, idx) => (
                          <li key={idx} className="flex items-start gap-3 font-body-lg text-on-surface">
                            <span className="material-symbols-outlined text-[20px] text-primary mt-0.5">check_circle</span>
                            {point}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center text-center space-y-3 text-on-surface-variant h-full opacity-60">
                         <span className="material-symbols-outlined text-3xl">list_alt</span>
                         <p>No key points defined.</p>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="border-t border-outline-variant bg-surface-container-lowest p-3 px-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="font-label-sm text-on-surface-variant flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px]">format_align_left</span>
                {draftScript.trim() ? draftScript.trim().split(/\s+/).length : 0} words
              </div>
              
              <div className="flex items-center gap-2 flex-wrap justify-end">
                {!isEditing ? (
                  <>
                    <button 
                      onClick={() => setIsEditing(true)}
                      className="h-9 px-4 font-label-sm text-on-surface hover:bg-surface-container-low border border-outline-variant rounded-md flex items-center gap-1.5 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[16px]">edit</span> Edit
                    </button>
                    <button 
                      onClick={handleMarkComplete}
                      disabled={activeSection.status === "completed"}
                      className={cn(
                        "h-9 px-4 font-label-sm rounded-md flex items-center gap-1.5 transition-all shadow-sm",
                        activeSection.status === "completed" 
                          ? "bg-surface-container-high text-on-surface-variant opacity-50 cursor-not-allowed border border-outline-variant"
                          : "bg-primary hover:bg-primary/90 text-on-primary"
                      )}
                    >
                      <span className="material-symbols-outlined text-[16px]">check</span> Mark Complete
                    </button>
                  </>
                ) : (
                  <>
                    <button 
                      onClick={() => setIsEditing(false)}
                      className="h-9 px-4 font-label-sm text-on-surface hover:bg-surface-container-low rounded-md transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleSave}
                      className="h-9 px-4 bg-primary text-on-primary font-label-sm rounded-md hover:bg-primary/90 transition-colors shadow-sm"
                    >
                      Save
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="bg-primary/5 border border-primary/20 rounded-xl p-md mb-8">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-label-md font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">sticky_note_2</span> Speaker Notes (for you)
              </h4>
              <button className="h-7 px-3 bg-primary text-on-primary text-[11px] font-bold uppercase tracking-wider rounded flex items-center gap-1 shadow-sm">
                <span className="material-symbols-outlined text-[14px]">auto_awesome</span> AI Coach Tips
              </button>
            </div>
            <ul className="space-y-2">
              <li className="font-body-sm text-on-surface-variant flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0"></span> Speak clearly and pause after each main idea.
              </li>
              <li className="font-body-sm text-on-surface-variant flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0"></span> Look at the jury, do not read from your slides.
              </li>
              <li className="font-body-sm text-on-surface-variant flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0"></span> Emphasize the value and impact of your solution.
              </li>
            </ul>
          </div>
          
        </div>
        
        {/* Footer actions */}
        <div className="p-4 border-t border-outline-variant bg-surface flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-auto sticky bottom-0 z-20">
          <button className="h-9 px-4 font-label-md text-on-surface hover:bg-surface-container flex items-center gap-2 rounded-lg transition-colors">
            <span className="material-symbols-outlined text-[18px]">visibility</span> Preview Full Pitch
          </button>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
            <button className="h-9 px-4 font-label-md text-on-surface-variant hover:text-on-surface hover:bg-surface-container flex items-center gap-2 rounded-lg transition-colors">
              <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span> Export PDF
            </button>
            <button onClick={() => navigate('/workspace/jury-simulation')} className="h-9 px-5 bg-[#8B5CF6] text-white hover:bg-[#7c3aed] font-label-md rounded-lg flex items-center gap-2 transition-all shadow-sm">
              Next: Jury Simulation <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL: AI Speech Coach & Analytics */}
      <div className="w-full lg:w-[340px] shrink-0 border-t lg:border-t-0 lg:border-l border-outline-variant bg-surface-container-lowest flex flex-col lg:h-full max-h-[50vh] lg:max-h-full overflow-y-auto">
        <div className="p-md border-b border-outline-variant">
          <h3 className="font-headline-sm text-headline-sm text-on-surface flex items-center gap-1.5 mb-xs">
            <span className="material-symbols-outlined text-[20px] text-[#8B5CF6]">psychology</span>
            AI Speech Assistant
          </h3>
          <p className="font-body-sm text-on-surface-variant mb-md">Enhance flow, adjust tone, and practice effectively.</p>

          <div className="flex flex-col gap-2">
            <CoachAction 
              icon="mic_double" 
              title="Improve Speech" 
              desc="Make it more fluent and clear" 
              btnText="Improve"
              btnColor="bg-[#8B5CF6] hover:bg-[#7c3aed]" 
            />
            <CoachAction 
              icon="tune" 
              title="Adjust Tone" 
              desc="Make it more academic or simple" 
              btnText="Adjust" 
              btnColor="bg-[#8B5CF6] hover:bg-[#7c3aed]"
            />
            <CoachAction 
              icon="compress" 
              title="Shorten Speech" 
              desc="Reduce length without losing value" 
              btnText="Shorten" 
              btnColor="bg-[#8B5CF6] hover:bg-[#7c3aed]"
            />
            <CoachAction 
              icon="expand_content" 
              title="Expand Speech" 
              desc="Add more relevant details" 
              btnText="Expand" 
              btnColor="bg-[#8B5CF6] hover:bg-[#7c3aed]"
            />
            <CoachAction 
              icon="translate" 
              title="Translate" 
              desc="Translate speech to another language" 
              btnText="Translate" 
              btnColor="bg-[#8B5CF6] hover:bg-[#7c3aed]"
            />
          </div>
        </div>

        <div className="p-md border-b border-outline-variant">
          <h4 className="font-label-md font-bold text-on-surface mb-4 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[18px] text-primary">speed</span> Timing & Flow
          </h4>
          
          <div className="space-y-3 mb-4">
            <div className="flex items-center justify-between">
              <span className="font-body-sm text-on-surface-variant">Total Duration</span>
              <span className="font-label-sm text-on-surface font-bold">{totalMin} min {totalSec} sec</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-body-sm text-on-surface-variant">Avg. per Slide</span>
              <span className="font-label-sm text-on-surface font-bold">~ 58 sec</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-body-sm text-on-surface-variant">Estimated Pace</span>
              <span className="font-label-sm text-[#10B981] font-bold">Good (128 wpm)</span>
            </div>
          </div>
          
          <div className="space-y-1">
            <div className="flex justify-between font-label-sm">
              <span className="text-on-surface-variant">Target Duration</span>
              <span className="text-on-surface-variant">78%</span>
            </div>
            <div className="h-1.5 w-full bg-surface-container-high rounded-full overflow-hidden">
              <div className="h-full bg-[#8B5CF6] w-[78%] rounded-full shadow-[0_0_8px_rgba(139,92,246,0.5)]"></div>
            </div>
            <span className="block text-[11px] text-on-surface-variant text-right mt-1">Optimal (7-10 min)</span>
          </div>
        </div>

        <div className="p-md border-b border-outline-variant">
          <h4 className="font-label-md font-bold text-on-surface mb-4 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[18px] text-primary">assignment_turned_in</span> Pitch Quality Score
          </h4>
          
          <div className="flex gap-4">
            <div className="flex flex-col items-center justify-center">
              <span className="text-[32px] font-bold text-on-surface leading-none">78<span className="text-[16px] text-on-surface-variant font-normal">/100</span></span>
              <span className="font-label-sm text-[#10B981] mt-1">Good</span>
            </div>
            
            <div className="flex-1 space-y-2 mt-1">
              <ScoreLine label="Structure" score={18} max={20} color="#10B981" />
              <ScoreLine label="Content" score={17} max={20} color="#10B981" />
              <ScoreLine label="Clarity" score={16} max={20} color="#F59E0B" />
              <ScoreLine label="Impact" score={15} max={20} color="#F59E0B" />
              <ScoreLine label="Delivery" score={12} max={20} color="#EF4444" />
            </div>
          </div>
        </div>

        <div className="p-md mt-auto bg-primary/5 mt-4 mx-md mb-md rounded-xl border border-primary/20">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[16px] text-on-primary">mic</span>
            </div>
            <h4 className="font-label-md font-bold text-primary">Practice & Feedback</h4>
          </div>
          <p className="font-body-xs text-on-surface-variant mb-4">Practice your pitch out loud and get instant AI feedback.</p>
          <button className="w-full h-10 bg-primary hover:bg-primary/90 text-on-primary font-label-md rounded-lg transition-colors shadow-sm focus:ring-2 focus:ring-primary/40">
            Start Practice Session
          </button>
        </div>
      </div>
      
    </div>
  )
}

function CoachAction({ icon, title, desc, btnText, btnColor }: { icon: string, title: string, desc: string, btnText: string, btnColor: string }) {
  return (
    <div className="flex items-center gap-3 p-2.5 rounded-xl border border-transparent hover:border-outline-variant hover:bg-surface-container-lowest transition-all group">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-on-surface-variant group-hover:bg-primary-container group-hover:text-primary transition-colors">
        <span className="material-symbols-outlined text-[18px]">{icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <span className="block font-label-sm font-bold text-on-surface truncate">{title}</span>
        <span className="block text-[11px] text-on-surface-variant truncate">{desc}</span>
      </div>
      <button className={cn("px-3 py-1.5 text-white text-[11px] font-bold rounded-md shadow-sm transition-colors", btnColor)}>
        {btnText}
      </button>
    </div>
  )
}

function ScoreLine({ label, score, max, color }: { label: string, score: number, max: number, color: string }) {
  const percent = (score / max) * 100;
  return (
    <div className="flex items-center gap-2">
      <span className="w-16 font-label-xs text-on-surface-variant">{label}</span>
      <div className="flex-1 h-1.5 bg-surface-container-high rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${percent}%`, backgroundColor: color }}></div>
      </div>
      <span className="w-8 text-right font-label-xs text-on-surface-variant">{score}/{max}</span>
    </div>
  )
}

