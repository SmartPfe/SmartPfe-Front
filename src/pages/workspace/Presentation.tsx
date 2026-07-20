import React, { useEffect, useMemo, useState } from "react";
import InfoTooltip from "@/components/ui/InfoTooltip";
import { cn } from "@/lib/utils";
import { fetchApi } from "@/lib/api";
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

type BuilderStep = "plan" | "slides" | "practice";
type DefenseSectionStatus = "planned" | "slides-ready" | "notes-ready" | "practiced";

interface DefenseSection {
  id: string;
  title: string;
  objective: string;
  durationMinutes: number;
  status: DefenseSectionStatus;
  slideIds: string[];
}

interface DefenseSlide {
  id: string;
  sectionId: string;
  title: string;
  keyPoints: string;
  speakerNotes: string;
  estimatedSeconds: number;
  tips: string[];
}

const defenseDurations: Duration[] = [5, 10, 15, 20];

const defenseBlueprints = [
  ["Introduction", "Open the defense, introduce the project scope, and position the academic context."],
  ["Problem Statement", "Explain the concrete problem, its impact, and why it deserves a structured solution."],
  ["Existing Solutions", "Compare current alternatives and identify the limits that motivated the proposed work."],
  ["Proposed Solution", "Present the core idea, users, and value delivered by the project."],
  ["Methodology", "Clarify the working process, requirements approach, and project organization."],
  ["Architecture", "Explain the main technical components and how they interact."],
  ["Implementation", "Show the important features, implementation choices, and completed work."],
  ["Results", "Summarize validation, deliverables, tests, and measurable outcomes."],
  ["Conclusion", "Close with achievements, limits, and future improvements."],
] as const;

export default function Presentation() {
  const [duration, setDuration] = useState<Duration>(15);
  const [activeStep, setActiveStep] = useState<BuilderStep>("plan");
  const [sections, setSections] = useState<DefenseSection[]>([]);
  const [slides, setSlides] = useState<DefenseSlide[]>([]);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [activeSlideId, setActiveSlideId] = useState<string | null>(null);
  const [projectContext, setProjectContext] = useState<any>(null);
  const [contextLoading, setContextLoading] = useState(true);

  const activeSection = sections.find((section) => section.id === activeSectionId) || sections[0];
  const sectionSlides = activeSection ? slides.filter((slide) => slide.sectionId === activeSection.id) : [];
  const activeSlide = sectionSlides.find((slide) => slide.id === activeSlideId) || sectionSlides[0];
  const generatedSectionCount = sections.filter((section) => section.slideIds.length > 0).length;
  const notesReadyCount = slides.filter((slide) => slide.speakerNotes.trim()).length;
  const totalSeconds = slides.reduce((sum, slide) => sum + slide.estimatedSeconds, 0);

  useEffect(() => {
    const loadProjectContext = async () => {
      try {
        setProjectContext(await fetchApi("/projects/my-project"));
      } catch {
        setProjectContext(null);
      } finally {
        setContextLoading(false);
      }
    };

    loadProjectContext();
  }, []);

  useEffect(() => {
    if (!activeSectionId && sections.length) setActiveSectionId(sections[0].id);
  }, [activeSectionId, sections]);

  useEffect(() => {
    if (!activeSlideId && sectionSlides.length) setActiveSlideId(sectionSlides[0].id);
  }, [activeSlideId, sectionSlides]);

  const projectName = projectContext?.title || projectContext?.projectName || "Smart PFE Project";
  const techStack = Array.isArray(projectContext?.technicalContext?.technologies)
    ? projectContext.technicalContext.technologies.join(", ")
    : "the selected technical stack";
  const methodology = projectContext?.technicalContext?.methodology || "the project methodology";

  const stepReadiness = useMemo(
    () => ({
      plan: sections.length > 0,
      slides: generatedSectionCount > 0,
      practice: slides.length > 0 && notesReadyCount === slides.length,
    }),
    [generatedSectionCount, notesReadyCount, sections.length, slides.length]
  );

  const generateDefensePlan = () => {
    const selected = duration === 5
      ? [defenseBlueprints[0], defenseBlueprints[1], defenseBlueprints[3], defenseBlueprints[6], defenseBlueprints[8]]
      : duration === 10
        ? defenseBlueprints.filter((_, index) => index !== 2)
        : defenseBlueprints;
    const base = Math.floor(duration / selected.length);
    const extra = duration - base * selected.length;
    const nextSections = selected.map(([title, objective], index) => ({
      id: `defense-section-${Date.now()}-${index}`,
      title,
      objective: title === "Methodology" ? `${objective} Connect the sequence to ${methodology}.` : objective,
      durationMinutes: base + (index < extra ? 1 : 0),
      status: "planned" as DefenseSectionStatus,
      slideIds: [],
    }));

    setSections(nextSections);
    setSlides([]);
    setActiveSectionId(nextSections[0]?.id || null);
    setActiveSlideId(null);
    setActiveStep("plan");
  };

  const updateSection = (sectionId: string, updates: Partial<DefenseSection>) => {
    setSections((current) => current.map((section) => section.id === sectionId ? { ...section, ...updates } : section));
  };

  const moveSection = (sectionId: string, direction: "up" | "down") => {
    setSections((current) => {
      const index = current.findIndex((section) => section.id === sectionId);
      const target = direction === "up" ? index - 1 : index + 1;
      if (index < 0 || target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const generateSlidesForSection = (section: DefenseSection) => {
    const slideCount = section.durationMinutes <= 1 ? 1 : section.durationMinutes <= 2 ? 2 : 3;
    const secondsPerSlide = Math.max(45, Math.round((section.durationMinutes * 60) / slideCount));
    const nextSlides = Array.from({ length: slideCount }).map((_, index) => ({
      id: `defense-slide-${section.id}-${Date.now()}-${index}`,
      sectionId: section.id,
      title: slideCount === 1 ? section.title : `${section.title}: ${index === 0 ? "Key Message" : index === 1 ? "Evidence" : "Transition"}`,
      keyPoints: [
        `- ${section.title} focus for ${projectName}`,
        "- Keep the visual content concise and academic",
        section.title === "Architecture" || section.title === "Implementation" ? `- Mention the stack: ${techStack}` : "- Use concrete evidence from the report",
        "- End with a transition to the next part",
      ].join("\n"),
      speakerNotes: [
        `In this slide, I will explain the role of ${section.title.toLowerCase()} in the defense.`,
        "I will connect it to the project context, justify the important decision, and avoid reading the bullets directly.",
        "The goal is to help the jury understand why this point matters for the final solution.",
      ].join("\n\n"),
      estimatedSeconds: secondsPerSlide,
      tips: [
        index === 0 ? "Start with the main message before details." : "Use this slide as evidence, not as a script.",
        section.title === "Architecture" ? "Point to data flow and responsibilities." : "Connect the slide to the problem and objective.",
        "Leave one sentence for transition.",
        "Keep eye contact during the first sentence.",
      ],
    }));

    setSlides((current) => [...current.filter((slide) => slide.sectionId !== section.id), ...nextSlides]);
    setSections((current) => current.map((item) => item.id === section.id ? { ...item, status: "notes-ready", slideIds: nextSlides.map((slide) => slide.id) } : item));
    setActiveSectionId(section.id);
    setActiveSlideId(nextSlides[0]?.id || null);
    setActiveStep("slides");
  };

  const generateAllSlides = () => {
    const generated: DefenseSlide[] = [];
    const nextSections = sections.map((section) => {
      const slideCount = section.durationMinutes <= 1 ? 1 : section.durationMinutes <= 2 ? 2 : 3;
      const sectionSlides = Array.from({ length: slideCount }).map((_, index) => ({
        id: `defense-slide-${section.id}-${Date.now()}-${index}`,
        sectionId: section.id,
        title: slideCount === 1 ? section.title : `${section.title}: ${index === 0 ? "Key Message" : index === 1 ? "Evidence" : "Transition"}`,
        keyPoints: [`- ${section.title} focus for ${projectName}`, "- 3-4 academic key points", "- Evidence from the completed project"].join("\n"),
        speakerNotes: [`Introduce ${section.title.toLowerCase()} clearly.`, "Explain the decision, connect it to the report, and transition smoothly."].join("\n\n"),
        estimatedSeconds: Math.max(45, Math.round((section.durationMinutes * 60) / slideCount)),
        tips: ["Keep one idea per slide.", "Prefer explanation over reading.", "Close with a transition."],
      }));
      generated.push(...sectionSlides);
      return { ...section, status: "notes-ready" as DefenseSectionStatus, slideIds: sectionSlides.map((slide) => slide.id) };
    });

    setSections(nextSections);
    setSlides(generated);
    setActiveSectionId(nextSections[0]?.id || null);
    setActiveSlideId(generated[0]?.id || null);
    setActiveStep("slides");
  };

  const updateSlide = (slideId: string, updates: Partial<DefenseSlide>) => {
    setSlides((current) => current.map((slide) => slide.id === slideId ? { ...slide, ...updates } : slide));
  };

  const markPracticed = () => {
    if (!activeSection) return;
    setSections((current) => current.map((section) => section.id === activeSection.id ? { ...section, status: "practiced" } : section));
    confetti({
      particleCount: 70,
      spread: 55,
      origin: { y: 0.7 },
      colors: ["#10B981", "#34D399", "#0EA5E9", "#A7F3D0"],
      disableForReducedMotion: true,
      zIndex: 100,
    });
  };

  return (
    <div className="max-w-[1500px] mx-auto flex flex-col gap-5 pb-24">
      <header className="flex flex-col xl:flex-row xl:items-end justify-between gap-4">
        <div>
          <h1 className="text-display text-on-surface mb-2 flex items-center">
            AI Defense Builder
            <InfoTooltip label="Defense" tooltip="Plan your PFE defense, generate slide groups, write speaker notes, and rehearse from your project context." />
          </h1>
          <p className="text-body-lg text-on-surface-variant max-w-[54rem]">
            Build a defense sequence from your completed project and report: Project Context to Presentation Plan to Slides to Speaker Notes to Rehearsal.
          </p>
        </div>
        <div className="rounded-lg border border-outline-variant bg-surface px-4 py-3 min-w-[260px]">
          <span className="block text-label-sm text-on-surface-variant mb-1">Project Context</span>
          <div className="flex items-center gap-2 text-body-sm text-on-surface">
            <span className={cn("material-symbols-outlined text-[18px]", contextLoading ? "text-on-surface-variant" : "text-secondary")}>
              {contextLoading ? "sync" : "check_circle"}
            </span>
            {contextLoading ? "Loading context..." : projectContext ? projectName : "Using defense template"}
          </div>
        </div>
      </header>

      <div className="rounded-xl border border-outline-variant bg-surface overflow-hidden">
        <div className="grid grid-cols-1 xl:grid-cols-[320px_minmax(0,1fr)] min-h-[calc(100dvh-270px)]">
          <aside className="border-b xl:border-b-0 xl:border-r border-outline-variant bg-surface-container-lowest flex flex-col">
            <div className="p-4 border-b border-outline-variant">
              <DefenseStepNav activeStep={activeStep} setActiveStep={setActiveStep} readiness={stepReadiness} />
            </div>
            <div className="p-4 border-b border-outline-variant">
              <span className="block font-label-sm font-bold text-on-surface-variant uppercase mb-2">Defense Duration</span>
              <div className="grid grid-cols-4 gap-1 bg-surface-container rounded-lg p-1">
                {defenseDurations.map((item) => (
                  <button
                    key={item}
                    onClick={() => setDuration(item)}
                    className={cn("h-9 rounded-md font-label-sm transition-colors", duration === item ? "bg-surface text-primary shadow-sm font-bold" : "text-on-surface-variant hover:text-on-surface")}
                  >
                    {item}m
                  </button>
                ))}
              </div>
              <button onClick={generateDefensePlan} className="mt-3 w-full h-10 rounded-md bg-primary text-on-primary font-label-md flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors">
                <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                Generate Defense Plan
              </button>
            </div>
            <div className="flex-1 min-h-[260px] overflow-y-auto p-2">
              {sections.length ? sections.map((section, index) => (
                <button
                  key={section.id}
                  onClick={() => {
                    setActiveSectionId(section.id);
                    setActiveSlideId(slides.find((slide) => slide.sectionId === section.id)?.id || null);
                  }}
                  className={cn("w-full rounded-lg border px-3 py-2.5 text-left mb-1 transition-colors", section.id === activeSection?.id ? "bg-primary-container/50 border-primary/20 text-primary" : "border-transparent hover:bg-surface-container-low text-on-surface-variant")}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-label-sm text-primary shrink-0">{index + 1}</span>
                    <span className="material-symbols-outlined text-[17px] shrink-0">{section.slideIds.length ? "view_carousel" : "calendar_view_week"}</span>
                    <span className="text-body-sm font-semibold truncate">{section.title}</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-2 text-label-sm">
                    <span>{section.durationMinutes} min</span>
                    <span>{section.slideIds.length ? `${section.slideIds.length} slides` : "slide group"}</span>
                  </div>
                </button>
              )) : (
                <div className="h-full min-h-[220px] flex flex-col items-center justify-center text-center px-4 text-on-surface-variant">
                  <span className="material-symbols-outlined text-[40px] mb-2">co_present</span>
                  <p className="text-body-sm">Choose a duration and generate a defense plan to start.</p>
                </div>
              )}
            </div>
            {sections.length > 0 && (
              <div className="p-4 border-t border-outline-variant bg-surface-container-lowest">
                <div className="grid grid-cols-3 gap-2">
                  <DefenseMetric label="Plan" value={`${sections.length}`} />
                  <DefenseMetric label="Slides" value={`${slides.length}`} />
                  <DefenseMetric label="Time" value={formatDefenseSeconds(totalSeconds || duration * 60)} />
                </div>
              </div>
            )}
          </aside>

          <main className="min-w-0 bg-surface">
            {activeStep === "plan" && (
              <DefensePlanStep
                sections={sections}
                duration={duration}
                activeSectionId={activeSection?.id}
                onGeneratePlan={generateDefensePlan}
                onSelectSection={setActiveSectionId}
                onUpdateSection={updateSection}
                onMoveSection={moveSection}
                onGenerateSlides={generateSlidesForSection}
                onGenerateAllSlides={generateAllSlides}
              />
            )}
            {activeStep === "slides" && (
              <DefenseSlidesStep
                planGenerated={sections.length > 0}
                activeSection={activeSection}
                sectionSlides={sectionSlides}
                activeSlide={activeSlide}
                setActiveSlideId={setActiveSlideId}
                onGenerateSlides={generateSlidesForSection}
                onUpdateSlide={updateSlide}
                onGoPlan={() => setActiveStep("plan")}
              />
            )}
            {activeStep === "practice" && (
              <DefensePracticeStep
                planGenerated={sections.length > 0}
                activeSection={activeSection}
                sectionSlides={sectionSlides}
                activeSlide={activeSlide}
                setActiveSlideId={setActiveSlideId}
                onGenerateSlides={generateSlidesForSection}
                onMarkPracticed={markPracticed}
                onGoSlides={() => setActiveStep("slides")}
              />
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

function LegacyPresentation() {
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
    <div className="flex min-h-[calc(100dvh-150px)] lg:h-[calc(100dvh-150px)] w-full flex-col lg:flex-row overflow-hidden relative rounded-xl border border-outline-variant bg-surface">
      
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
      <div className="flex-1 min-w-0 overflow-y-auto bg-surface flex flex-col shadow-[-4px_0_24px_rgba(0,0,0,0.02)] z-10 relative custom-scrollbar">
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
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-2">
              <div className="flex-1">
                {isEditing ? (
                  <input
                    type="text"
                    value={activeSlide.title}
                    onChange={(e) => setSlides(prev => prev.map(s => s.id === activeSlide.id ? { ...s, title: e.target.value } : s))}
                    className="text-display text-on-surface tracking-tight w-full bg-transparent border-b-2 border-primary outline-none py-1"
                  />
                ) : (
                  <h1 className="text-display text-on-surface tracking-tight break-words">{activeSlide.title}</h1>
                )}
              </div>
              
              <div className="flex items-center gap-2 shrink-0 sm:ml-4 flex-wrap">
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
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-outline-variant pb-2">
                <h3 className="font-headline-sm text-on-surface">Slide Content</h3>
                {!isEditing ? (
                  <div className="flex items-center gap-2 flex-wrap">
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
                  <div className="flex items-center gap-2 flex-wrap">
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

function DefenseStepNav({
  activeStep,
  setActiveStep,
  readiness,
}: {
  activeStep: BuilderStep;
  setActiveStep: (step: BuilderStep) => void;
  readiness: Record<BuilderStep, boolean>;
}) {
  const steps: { key: BuilderStep; label: string; icon: string }[] = [
    { key: "plan", label: "Plan", icon: "route" },
    { key: "slides", label: "Build Slides", icon: "view_carousel" },
    { key: "practice", label: "Practice", icon: "record_voice_over" },
  ];

  return (
    <div className="grid grid-cols-3 xl:grid-cols-1 gap-2">
      {steps.map((step, index) => (
        <button
          key={step.key}
          onClick={() => setActiveStep(step.key)}
          className={cn(
            "rounded-lg border px-3 py-2 text-left transition-colors",
            activeStep === step.key ? "bg-primary-container/50 border-primary/20 text-primary" : "bg-surface border-outline-variant text-on-surface-variant hover:text-on-surface"
          )}
        >
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">{readiness[step.key] ? "check_circle" : step.icon}</span>
            <span className="font-label-md">{index + 1}. {step.label}</span>
          </div>
        </button>
      ))}
    </div>
  );
}

function DefensePlanStep({
  sections,
  duration,
  activeSectionId,
  onGeneratePlan,
  onSelectSection,
  onUpdateSection,
  onMoveSection,
  onGenerateSlides,
  onGenerateAllSlides,
}: {
  sections: DefenseSection[];
  duration: Duration;
  activeSectionId?: string;
  onGeneratePlan: () => void;
  onSelectSection: (id: string) => void;
  onUpdateSection: (id: string, updates: Partial<DefenseSection>) => void;
  onMoveSection: (id: string, direction: "up" | "down") => void;
  onGenerateSlides: (section: DefenseSection) => void;
  onGenerateAllSlides: () => void;
}) {
  if (!sections.length) {
    return (
      <div className="min-h-[560px] flex flex-col items-center justify-center text-center p-8">
        <div className="w-20 h-20 rounded-xl bg-primary-container flex items-center justify-center mb-5">
          <span className="material-symbols-outlined text-[38px] text-on-primary-container">route</span>
        </div>
        <h2 className="text-headline-lg text-on-surface mb-3">Create your academic defense plan</h2>
        <p className="text-body-lg text-on-surface-variant max-w-xl mb-7">
          Start from a {duration}-minute structure that turns your project context into a clear defense sequence.
        </p>
        <button onClick={onGeneratePlan} className="h-11 px-6 rounded-md bg-primary text-on-primary font-label-md flex items-center gap-2 hover:bg-primary/90 transition-colors">
          <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
          Generate Defense Plan
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-6">
        <div>
          <h2 className="text-headline-md text-on-surface mb-1">Presentation Plan</h2>
          <p className="text-body-md text-on-surface-variant">
            Review the timeline, adjust timing, reorder sections, then generate slide groups.
          </p>
        </div>
        <button onClick={onGenerateAllSlides} className="h-10 px-4 rounded-md border border-primary/20 bg-primary text-on-primary font-label-md flex items-center gap-2 hover:bg-primary/90 transition-colors">
          <span className="material-symbols-outlined text-[18px]">auto_awesome_motion</span>
          Generate All Slides
        </button>
      </div>

      <div className="space-y-3">
        {sections.map((section, index) => (
          <div
            key={section.id}
            className={cn(
              "rounded-lg border bg-surface-container-lowest p-4 transition-colors",
              section.id === activeSectionId ? "border-primary/30 ring-4 ring-primary/5" : "border-outline-variant"
            )}
            onClick={() => onSelectSection(section.id)}
          >
            <div className="flex flex-col xl:flex-row xl:items-start gap-4">
              <div className="w-10 h-10 rounded-md bg-surface border border-outline-variant flex items-center justify-center font-label-md text-primary shrink-0">
                {index + 1}
              </div>
              <div className="flex-1 grid gap-3">
                <input
                  value={section.title}
                  onChange={(event) => onUpdateSection(section.id, { title: event.target.value })}
                  className="w-full bg-transparent border-b border-outline-variant focus:border-primary outline-none text-headline-sm text-on-surface pb-1"
                />
                <textarea
                  value={section.objective}
                  onChange={(event) => onUpdateSection(section.id, { objective: event.target.value })}
                  rows={2}
                  className="w-full resize-none rounded-md border border-outline-variant bg-surface px-3 py-2 text-body-sm text-on-surface outline-none focus:border-primary"
                />
              </div>
              <div className="flex flex-wrap xl:flex-col gap-2 xl:w-[190px]">
                <label className="h-9 px-3 rounded-md border border-outline-variant bg-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-[17px] text-primary">timer</span>
                  <input
                    type="number"
                    min={1}
                    value={section.durationMinutes}
                    onChange={(event) => onUpdateSection(section.id, { durationMinutes: Number(event.target.value) || 1 })}
                    className="w-12 bg-transparent outline-none text-label-md text-on-surface"
                  />
                  <span className="text-label-sm text-on-surface-variant">min</span>
                </label>
                <div className="flex gap-2">
                  <DefenseIconButton icon="arrow_upward" label="Move up" onClick={() => onMoveSection(section.id, "up")} />
                  <DefenseIconButton icon="arrow_downward" label="Move down" onClick={() => onMoveSection(section.id, "down")} />
                </div>
                <button onClick={() => onGenerateSlides(section)} className="h-9 px-3 rounded-md border border-primary/20 bg-primary-container/30 text-primary font-label-sm flex items-center justify-center gap-1.5 hover:bg-primary-container/50 transition-colors">
                  <span className="material-symbols-outlined text-[16px]">view_carousel</span>
                  {section.slideIds.length ? "Regenerate" : "Generate Slides"}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DefenseSlidesStep({
  planGenerated,
  activeSection,
  sectionSlides,
  activeSlide,
  setActiveSlideId,
  onGenerateSlides,
  onUpdateSlide,
  onGoPlan,
}: {
  planGenerated: boolean;
  activeSection?: DefenseSection;
  sectionSlides: DefenseSlide[];
  activeSlide?: DefenseSlide;
  setActiveSlideId: (id: string) => void;
  onGenerateSlides: (section: DefenseSection) => void;
  onUpdateSlide: (id: string, updates: Partial<DefenseSlide>) => void;
  onGoPlan: () => void;
}) {
  if (!planGenerated || !activeSection) {
    return <DefenseBlockedState icon="route" title="Generate a defense plan first" body="Slides are created from the presentation structure so each slide belongs to a clear academic section." action="Go to Plan" onAction={onGoPlan} />;
  }

  if (!sectionSlides.length) {
    return (
      <DefenseBlockedState
        icon="view_carousel"
        title={`Generate slides for ${activeSection.title}`}
        body="Each plan section becomes a slide group with visual key points and AI speaker notes."
        action="Generate Section Slides"
        onAction={() => onGenerateSlides(activeSection)}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 2xl:grid-cols-[260px_minmax(0,1fr)] min-h-full">
      <div className="border-b 2xl:border-b-0 2xl:border-r border-outline-variant bg-surface-container-lowest p-3">
        <div className="mb-3 px-1">
          <h2 className="text-headline-sm text-on-surface">{activeSection.title}</h2>
          <p className="text-body-sm text-on-surface-variant">{sectionSlides.length} generated slides</p>
        </div>
        <div className="space-y-1">
          {sectionSlides.map((slide, index) => (
            <button
              key={slide.id}
              onClick={() => setActiveSlideId(slide.id)}
              className={cn(
                "w-full rounded-md border px-3 py-2 text-left transition-colors",
                slide.id === activeSlide?.id ? "bg-primary-container/50 border-primary/20 text-primary" : "bg-surface border-outline-variant text-on-surface-variant hover:text-on-surface"
              )}
            >
              <span className="block text-label-sm mb-1">Slide {index + 1}</span>
              <span className="block text-body-sm font-semibold truncate">{slide.title}</span>
            </button>
          ))}
        </div>
      </div>

      {activeSlide && (
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 mb-5">
            <div className="flex-1">
              <input
                value={activeSlide.title}
                onChange={(event) => onUpdateSlide(activeSlide.id, { title: event.target.value })}
                className="w-full bg-transparent border-b border-outline-variant focus:border-primary outline-none text-headline-md text-on-surface pb-2"
              />
              <p className="text-body-sm text-on-surface-variant mt-2">Estimated speaking time: {formatDefenseSeconds(activeSlide.estimatedSeconds)}</p>
            </div>
            <button onClick={() => onGenerateSlides(activeSection)} className="h-9 px-3 rounded-md border border-primary/20 bg-primary-container/30 text-primary font-label-sm flex items-center gap-1.5 hover:bg-primary-container/50 transition-colors">
              <span className="material-symbols-outlined text-[16px]">autorenew</span>
              Regenerate Group
            </button>
          </div>

          <div className="grid gap-5">
            <DefenseEditorBlock icon="format_list_bulleted" title="Slide Key Points" value={activeSlide.keyPoints} rows={8} onChange={(value) => onUpdateSlide(activeSlide.id, { keyPoints: value })} />
            <DefenseEditorBlock icon="record_voice_over" title="AI Speaker Notes" value={activeSlide.speakerNotes} rows={9} onChange={(value) => onUpdateSlide(activeSlide.id, { speakerNotes: value })} />
            <div className="rounded-lg border border-outline-variant bg-surface-container-lowest p-4">
              <h3 className="font-label-md text-on-surface mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-primary">tips_and_updates</span>
                Presentation Tips
              </h3>
              <div className="grid sm:grid-cols-2 gap-2">
                {activeSlide.tips.map((tip) => (
                  <div key={tip} className="rounded-md border border-outline-variant bg-surface px-3 py-2 text-body-sm text-on-surface-variant">
                    {tip}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DefensePracticeStep({
  planGenerated,
  activeSection,
  sectionSlides,
  activeSlide,
  setActiveSlideId,
  onGenerateSlides,
  onMarkPracticed,
  onGoSlides,
}: {
  planGenerated: boolean;
  activeSection?: DefenseSection;
  sectionSlides: DefenseSlide[];
  activeSlide?: DefenseSlide;
  setActiveSlideId: (id: string) => void;
  onGenerateSlides: (section: DefenseSection) => void;
  onMarkPracticed: () => void;
  onGoSlides: () => void;
}) {
  if (!planGenerated || !activeSection) {
    return <DefenseBlockedState icon="route" title="Plan the defense first" body="Practice mode needs a presentation plan and slide groups." action="Go to Slides" onAction={onGoSlides} />;
  }

  if (!sectionSlides.length) {
    return (
      <DefenseBlockedState
        icon="view_carousel"
        title="Generate slides before practice"
        body="Speaker notes and rehearsal timing are attached to generated slides."
        action="Generate Section Slides"
        onAction={() => onGenerateSlides(activeSection)}
      />
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-6">
        <div>
          <h2 className="text-headline-md text-on-surface mb-1">Practice: {activeSection.title}</h2>
          <p className="text-body-md text-on-surface-variant">Rehearse with the speaking script, timing target, and jury-facing tips.</p>
        </div>
        <button onClick={onMarkPracticed} className="h-10 px-4 rounded-md bg-secondary text-on-secondary font-label-md flex items-center gap-2 hover:opacity-90 transition-opacity">
          <span className="material-symbols-outlined text-[18px]">done_all</span>
          Mark Section Practiced
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[280px_minmax(0,1fr)] gap-4">
        <div className="rounded-lg border border-outline-variant bg-surface-container-lowest p-3 h-fit">
          <h3 className="font-label-md text-on-surface mb-3">Slide Run Order</h3>
          <div className="space-y-2">
            {sectionSlides.map((slide, index) => (
              <button
                key={slide.id}
                onClick={() => setActiveSlideId(slide.id)}
                className={cn(
                  "w-full rounded-md px-3 py-2 text-left border transition-colors",
                  slide.id === activeSlide?.id ? "border-primary/20 bg-primary-container/50 text-primary" : "border-outline-variant bg-surface text-on-surface-variant hover:text-on-surface"
                )}
              >
                <span className="block text-label-sm">Slide {index + 1} - {formatDefenseSeconds(slide.estimatedSeconds)}</span>
                <span className="block text-body-sm font-semibold truncate">{slide.title}</span>
              </button>
            ))}
          </div>
        </div>

        {activeSlide && (
          <div className="rounded-lg border border-outline-variant bg-surface overflow-hidden">
            <div className="p-4 border-b border-outline-variant bg-surface-container-lowest flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-headline-sm text-on-surface">{activeSlide.title}</h3>
                <p className="text-body-sm text-on-surface-variant">Target duration: {formatDefenseSeconds(activeSlide.estimatedSeconds)}</p>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-md border border-primary/20 bg-primary-container/30 px-3 py-1 text-label-sm text-primary">
                <span className="material-symbols-outlined text-[16px]">timer</span>
                Rehearsal cue
              </span>
            </div>
            <div className="p-5 grid gap-5">
              <div>
                <h4 className="font-label-md text-on-surface mb-2">What appears on the slide</h4>
                <pre className="whitespace-pre-wrap rounded-lg border border-outline-variant bg-surface-container-lowest p-4 text-body-md text-on-surface font-sans">{activeSlide.keyPoints}</pre>
              </div>
              <div>
                <h4 className="font-label-md text-on-surface mb-2">What to say</h4>
                <div className="rounded-lg border-l-4 border-l-primary border-y border-r border-outline-variant bg-primary-container/10 p-4 text-body-lg text-on-surface leading-relaxed whitespace-pre-wrap">
                  {activeSlide.speakerNotes}
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-2">
                {activeSlide.tips.map((tip) => (
                  <div key={tip} className="rounded-md border border-outline-variant bg-surface-container-lowest px-3 py-2 text-body-sm text-on-surface-variant">
                    {tip}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function DefenseEditorBlock({ icon, title, value, rows, onChange }: { icon: string; title: string; value: string; rows: number; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="font-label-md text-on-surface mb-2 flex items-center gap-2">
        <span className="material-symbols-outlined text-[18px] text-primary">{icon}</span>
        {title}
      </span>
      <textarea
        value={value}
        rows={rows}
        onChange={(event) => onChange(event.target.value)}
        className="w-full resize-y rounded-lg border border-outline-variant bg-surface-container-lowest p-4 text-body-md text-on-surface outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
      />
    </label>
  );
}

function DefenseBlockedState({ icon, title, body, action, onAction }: { icon: string; title: string; body: string; action: string; onAction: () => void }) {
  return (
    <div className="min-h-[560px] flex flex-col items-center justify-center text-center p-8">
      <div className="w-16 h-16 rounded-xl bg-surface-container border border-outline-variant flex items-center justify-center mb-4">
        <span className="material-symbols-outlined text-[32px] text-primary">{icon}</span>
      </div>
      <h2 className="text-headline-md text-on-surface mb-2">{title}</h2>
      <p className="text-body-md text-on-surface-variant max-w-lg mb-6">{body}</p>
      <button onClick={onAction} className="h-10 px-4 rounded-md bg-primary text-on-primary font-label-md hover:bg-primary/90 transition-colors">
        {action}
      </button>
    </div>
  );
}

function DefenseIconButton({ icon, label, onClick }: { icon: string; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      title={label}
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      className="w-9 h-9 rounded-md border border-outline-variant bg-surface text-on-surface-variant hover:text-primary hover:bg-primary/10 transition-colors flex items-center justify-center"
    >
      <span className="material-symbols-outlined text-[18px]">{icon}</span>
    </button>
  );
}

function DefenseMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-outline-variant bg-surface px-2 py-2 text-center">
      <span className="block text-label-sm text-on-surface-variant">{label}</span>
      <span className="block font-label-md text-on-surface">{value}</span>
    </div>
  );
}

function formatDefenseSeconds(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return remainder ? `${minutes}:${String(remainder).padStart(2, "0")}` : `${minutes}m`;
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

