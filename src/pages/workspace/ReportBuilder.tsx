import React, { useState, useEffect } from "react";
import InfoTooltip from "@/components/ui/InfoTooltip";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";
import confetti from "canvas-confetti";

type SectionStatus = "completed" | "in-progress" | "not-started";
type ContentLength = "short" | "medium" | "long";
type ViewTab = "content" | "latex";

interface Section {
  id: string;
  title: string;
  status: SectionStatus;
  content: string;
  latexContent?: string;
  lastModified?: string;
  generatedFrom: string[];
}

const INITIAL_SECTIONS: Section[] = [
  { 
    id: "intro", 
    title: "Introduction", 
    status: "completed", 
    content: "This report introduces the PFE project encompassing the development of a comprehensive guidance platform...", 
    latexContent: "\\section{Introduction}\n\nThis report introduces the PFE project encompassing the development of a comprehensive guidance platform...",
    lastModified: "Oct 12, 2023", 
    generatedFrom: ["Project Context", "Problem Statement"] 
  },
  { 
    id: "company", 
    title: "Company Presentation", 
    status: "completed", 
    content: "The host company for this internship has been a leading provider in tech solutions...", 
    latexContent: "\\section{Company Presentation}\n\nThe host company for this internship has been a leading provider in tech solutions...",
    lastModified: "Oct 14, 2023", 
    generatedFrom: ["Project Context"] 
  },
  { 
    id: "existing-solutions", 
    title: "Existing Solutions", 
    status: "in-progress", 
    content: "Currently, solutions such as Notion and Word offer blank pages but lack the systematic guidance needed for academic reports...", 
    latexContent: "\\section{Existing Solutions}\n\nCurrently, solutions such as Notion and Word offer blank pages but lack the systematic guidance needed for academic reports...",
    lastModified: "Oct 18, 2023", 
    generatedFrom: ["Solutions Analysis"] 
  },
  { id: "requirements", title: "Requirements Analysis", status: "in-progress", content: "", generatedFrom: ["Functional Requirements", "Non-Functional Requirements"] },
  { id: "backlog", title: "Product Backlog", status: "not-started", content: "", generatedFrom: ["Product Backlog"] },
  { id: "user-stories", title: "User Stories", status: "not-started", content: "", generatedFrom: ["User Stories", "Actors"] },
  { id: "uml", title: "UML Design", status: "not-started", content: "", generatedFrom: ["UML Preparation"] },
  { id: "implementation", title: "Implementation", status: "not-started", content: "", generatedFrom: ["Technical Context"] },
  { id: "testing", title: "Testing", status: "not-started", content: "", generatedFrom: ["User Stories"] },
  { id: "conclusion", title: "Conclusion", status: "not-started", content: "", generatedFrom: ["Project Overview"] },
];

export default function ReportBuilder() {
  const [sections, setSections] = useState<Section[]>(INITIAL_SECTIONS);
  const [activeSectionId, setActiveSectionId] = useState<string>("requirements");
  const [isEditing, setIsEditing] = useState(false);
  const [draftContent, setDraftContent] = useState("");
  const [showCompletionBanner, setShowCompletionBanner] = useState(false);
  const [activeTab, setActiveTab] = useState<ViewTab>("content");
  const [contentLength, setContentLength] = useState<ContentLength>("medium");
  const [copied, setCopied] = useState(false);

  const activeSection = sections.find(s => s.id === activeSectionId) || sections[0];
  const completedCount = sections.filter(s => s.status === "completed").length;
  const progressPercent = Math.round((completedCount / sections.length) * 100);

  useEffect(() => {
    setDraftContent(activeSection.content);
    setIsEditing(false);
    setShowCompletionBanner(false);
    setActiveTab("content");
  }, [activeSectionId, sections]);

  const handleMarkComplete = () => {
    setSections(prev => prev.map(s => s.id === activeSectionId ? { ...s, status: "completed", content: draftContent, latexContent: `\\section{${s.title}}\n\n${draftContent}`, lastModified: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) } : s));
    setShowCompletionBanner(true);
    
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#10B981', '#34D399', '#059669', '#A7F3D0'],
      disableForReducedMotion: true,
      zIndex: 100,
    });
  };

  const handleSave = () => {
    setSections(prev => prev.map(s => s.id === activeSectionId ? { ...s, content: draftContent, latexContent: `\\section{${s.title}}\n\n${draftContent}`, status: s.status === "not-started" ? "in-progress" : s.status, lastModified: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) } : s));
    setIsEditing(false);
  };

  const handleGenerateDraft = () => {
    const lengthStr = contentLength === "short" ? "~1 page" : contentLength === "medium" ? "~2-3 pages" : "~4-5 pages";
    const newContent = `This is an AI-generated draft for ${activeSection.title}. It synthesizes the insights gathered from ${activeSection.generatedFrom.join(" and ")}.\n\nTarget length: ${lengthStr}.\n\nPlease review and edit the content to ensure it perfectly aligns with your academic tone and specific internship experiences.`;
    setDraftContent(newContent);
    setSections(prev => prev.map(s => s.id === activeSectionId ? { ...s, status: "in-progress" } : s));
    setIsEditing(true);
    setActiveTab("content");
  };

  const handleCopyLatex = () => {
    if (activeSection.latexContent) {
      navigator.clipboard.writeText(activeSection.latexContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const nextSection = sections[sections.findIndex(s => s.id === activeSectionId) + 1];

  return (
    <div className="flex h-[calc(100vh-100px)] w-[calc(100%+64px)] -mx-xl -my-margin flex-col lg:flex-row overflow-hidden relative">
      
      {/* LEFT PANEL: Report Structure Navigation */}
      <div className="w-full lg:w-[300px] shrink-0 border-b lg:border-b-0 lg:border-r border-outline-variant bg-surface-container-lowest flex flex-col pt-md lg:h-full max-h-[30vh] lg:max-h-full">
        <div className="px-md mb-sm lg:mb-lg">
          <h2 className="font-headline-sm text-headline-sm text-on-surface mb-xs hidden lg:block">Report Structure</h2>
          <div className="bg-surface-container-low rounded-xl p-md border border-outline-variant mt-sm">
            <div className="flex justify-between items-end mb-2">
              <span className="font-label-md text-label-md text-on-surface-variant">Report Progress</span>
              <span className="font-headline-sm text-headline-sm text-primary">{progressPercent}%</span>
            </div>
            <div className="h-2 w-full bg-surface-container-high rounded-full overflow-hidden mb-2">
              <motion.div 
                className="h-full bg-primary"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
            <span className="font-label-sm text-label-sm text-on-surface-variant">{completedCount} of {sections.length} sections completed</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-sm pb-lg space-y-1">
          {sections.map(section => {
            const isActive = section.id === activeSectionId;
            return (
              <button
                key={section.id}
                onClick={() => setActiveSectionId(section.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors",
                  isActive 
                    ? "bg-primary-container text-on-primary-container" 
                    : "hover:bg-surface-container-low text-on-surface-variant"
                )}
              >
                {section.status === "completed" && <span className="material-symbols-outlined text-[18px] text-[#10B981]">check_circle</span>}
                {section.status === "in-progress" && <span className="material-symbols-outlined text-[18px] text-[#F59E0B]">warning</span>}
                {section.status === "not-started" && <span className="material-symbols-outlined text-[18px] text-outline">radio_button_unchecked</span>}
                <span className={cn("font-body-md text-body-md truncate", isActive ? "font-semibold" : "")}>
                  {section.title}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* CENTER PANEL: Current Section Workspace */}
      <div className="flex-1 overflow-y-auto bg-surface flex flex-col shadow-[-4px_0_24px_rgba(0,0,0,0.02)] z-10 relative">
        <div className="max-w-3xl w-full mx-auto p-xl flex-1 flex flex-col">
          
          <div className="mb-8">
            <div className="flex items-start justify-between mb-4">
              <h1 className="text-display text-on-surface tracking-tight">{activeSection.title}</h1>
              <div className="flex items-center gap-3">
                {activeSection.status === "completed" && (
                  <span className="font-label-sm text-label-sm bg-[#10B981]/10 text-[#059669] px-2.5 py-1 rounded border border-[#10B981]/20 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[14px]">check_circle</span> Completed
                  </span>
                )}
                {activeSection.status === "in-progress" && (
                  <span className="font-label-sm text-label-sm bg-[#FEF3C7] text-[#D97706] px-2.5 py-1 rounded border border-[#FDE68A] uppercase tracking-wider flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[14px]">warning</span> In Progress
                  </span>
                )}
                {activeSection.status === "not-started" && (
                  <span className="font-label-sm text-label-sm bg-surface-container-high text-on-surface-variant px-2.5 py-1 rounded border border-outline-variant uppercase tracking-wider flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[14px]">radio_button_unchecked</span> Not Started
                  </span>
                )}
              </div>
            </div>

            {activeSection.lastModified && (
              <p className="font-body-sm text-body-sm text-on-surface-variant mb-6">
                Last modified: {activeSection.lastModified}
              </p>
            )}
          </div>

          <AnimatePresence mode="wait">
            {showCompletionBanner && nextSection && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mb-8 p-md bg-[#10B981]/10 border border-[#10B981]/20 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3 text-[#059669]">
                  <span className="material-symbols-outlined text-[24px]">task_alt</span>
                  <div>
                    <span className="block font-label-lg font-bold">Great progress!</span>
                    <span className="font-body-sm text-on-surface-variant">Next recommended section: {nextSection.title}</span>
                  </div>
                </div>
                <button 
                  onClick={() => setActiveSectionId(nextSection.id)}
                  className="px-4 py-2 bg-white text-[#059669] hover:bg-surface-container-lowest font-label-md rounded-lg transition-colors border border-[#10B981]/20 shadow-sm shrink-0 whitespace-nowrap"
                >
                  Open Next Section
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex-1 flex flex-col mb-10 relative">
            <div className="flex items-center justify-between border-b border-outline-variant mb-4 relative z-10 bg-surface">
              <div className="flex gap-6">
                <button 
                  onClick={() => setActiveTab("content")} 
                  className={cn("py-2 font-label-md transition-colors border-b-2", activeTab === "content" ? "border-primary text-primary" : "border-transparent text-on-surface-variant hover:text-on-surface")}
                >
                  Content
                </button>
                <button 
                  onClick={() => setActiveTab("latex")} 
                  className={cn("py-2 font-label-md transition-colors border-b-2", activeTab === "latex" ? "border-primary text-primary" : "border-transparent text-on-surface-variant hover:text-on-surface")}
                >
                  LaTeX
                </button>
              </div>
              <div className="flex items-center gap-3">
                {activeTab === "latex" ? (
                  <button 
                    onClick={handleCopyLatex}
                    className="h-8 px-3 font-label-sm text-primary hover:bg-primary/10 rounded-md transition-colors flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[16px]">{copied ? "check" : "content_copy"}</span>
                    {copied ? "Copied!" : "Copy LaTeX"}
                  </button>
                ) : (
                  <>
                    {(draftContent || isEditing) && !isEditing ? (
                      <>
                        <button 
                          onClick={() => setIsEditing(true)}
                          className="h-8 px-3 font-label-sm text-on-surface hover:bg-surface-container-low border border-outline-variant rounded-md flex items-center gap-1.5 transition-colors disabled:opacity-50"
                          disabled={activeSection.status === "completed"}
                        >
                          <span className="material-symbols-outlined text-[16px]">edit</span> Edit
                        </button>
                        <button 
                          onClick={handleMarkComplete}
                          disabled={activeSection.status === "completed"}
                          className={cn(
                            "h-8 px-3 font-label-sm rounded-md flex items-center gap-1.5 transition-all shadow-sm",
                            activeSection.status === "completed" 
                              ? "bg-surface-container-high text-on-surface-variant opacity-50 cursor-not-allowed border border-outline-variant"
                              : "bg-[#10B981] hover:bg-[#059669] text-white"
                          )}
                        >
                          <span className="material-symbols-outlined text-[16px]">done_all</span> Mark Complete
                        </button>
                      </>
                    ) : isEditing ? (
                      <>
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
                      </>
                    ) : null}
                  </>
                )}
              </div>
            </div>

            <div className="flex-1 flex flex-col relative h-[400px]">
              {activeTab === "latex" ? (
                <div className="flex-1 bg-[#1e1e1e] rounded-xl p-md overflow-y-auto">
                  <pre className="font-mono text-[13px] leading-relaxed text-[#d4d4d4] whitespace-pre-wrap">
                    {activeSection.latexContent || "% No LaTeX content generated yet.\n% Switch to Content tab and generate a draft."}
                  </pre>
                </div>
              ) : !draftContent && !isEditing ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center border-2 border-dashed border-outline-variant rounded-2xl bg-surface-container-lowest">
                  <div className="w-16 h-16 rounded-2xl bg-surface-container flex items-center justify-center mb-4">
                    <span className="material-symbols-outlined text-[28px] text-on-surface-variant">edit_document</span>
                  </div>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface mb-2">This section has not been drafted yet</h3>
                  <p className="font-body-md text-body-md text-on-surface-variant max-w-[350px] mb-6">
                    Select your preferred section length and use the AI assistant to instantly generate a comprehensive first draft.
                  </p>
                  
                  <div className="flex bg-surface-container-low rounded-lg p-1 mb-6 border border-outline-variant/50">
                    {(["short", "medium", "long"] as ContentLength[]).map(l => (
                      <button 
                        key={l}
                        onClick={() => setContentLength(l)}
                        className={cn(
                          "px-4 py-1.5 rounded-md font-label-sm transition-colors flex items-center gap-1", 
                          contentLength === l 
                            ? "bg-surface shadow-[0_1px_3px_rgba(0,0,0,0.1)] text-on-surface font-bold" 
                            : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
                        )}
                      >
                        <span className="capitalize">{l}</span>
                        <span className="text-outline text-[11px] font-normal">({l === 'short' ? '~1 pg' : l === 'medium' ? '~2-3 pgs' : '~4-5 pgs'})</span>
                      </button>
                    ))}
                  </div>

                  <button 
                    onClick={handleGenerateDraft}
                    className="h-10 px-6 bg-primary text-on-primary font-label-md rounded-lg flex items-center gap-2 hover:bg-primary/90 transition-colors shadow-sm"
                  >
                    <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                    Generate Draft
                  </button>
                </div>
              ) : (
                <div className={cn(
                  "flex-1 w-full rounded-xl transition-all duration-300",
                  isEditing 
                    ? "border-2 border-primary focus-within:ring-4 focus-within:ring-primary/10 overflow-hidden shadow-sm" 
                    : "border-transparent"
                )}>
                  <textarea
                    value={draftContent}
                    onChange={(e) => setDraftContent(e.target.value)}
                    readOnly={!isEditing}
                    className={cn(
                      "w-full h-full resize-none outline-none font-body-lg leading-relaxed text-on-surface bg-transparent custom-scrollbar",
                      isEditing ? "p-4" : "py-2"
                    )}
                    placeholder="Start writing..."
                  />
                </div>
              )}
            </div>
            
            {activeTab === "content" && (draftContent || isEditing) && (
              <div className="mt-6 border-t border-outline-variant pt-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-label-sm text-on-surface-variant uppercase tracking-wider mr-2">AI Tools</span>
                  <button className="h-8 px-3 bg-surface-container-low hover:bg-surface-container border border-outline-variant rounded-md font-label-sm text-on-surface flex items-center gap-1.5 transition-colors">
                    <span className="material-symbols-outlined text-[16px] text-primary">auto_awesome</span> Generate Draft
                  </button>
                  <button className="h-8 px-3 bg-surface-container-low hover:bg-surface-container border border-outline-variant rounded-md font-label-sm text-on-surface flex items-center gap-1.5 transition-colors">
                    <span className="material-symbols-outlined text-[16px] text-primary">school</span> Improve Style
                  </button>
                  <button className="h-8 px-3 bg-surface-container-low hover:bg-surface-container border border-outline-variant rounded-md font-label-sm text-on-surface flex items-center gap-1.5 transition-colors">
                    <span className="material-symbols-outlined text-[16px] text-primary">add_box</span> Expand
                  </button>
                  <button className="h-8 px-3 bg-surface-container-low hover:bg-surface-container border border-outline-variant rounded-md font-label-sm text-on-surface flex items-center gap-1.5 transition-colors">
                    <span className="material-symbols-outlined text-[16px] text-primary">compress</span> Summarize
                  </button>
                  <button className="h-8 px-3 bg-surface-container-low hover:bg-surface-container border border-outline-variant rounded-md font-label-sm text-on-surface flex items-center gap-1.5 transition-colors">
                    <span className="material-symbols-outlined text-[16px] text-primary">history</span> Alternative Version
                  </button>
                </div>
                <div className="flex items-center gap-1.5 bg-surface-container-lowest px-3 py-1.5 rounded border border-outline-variant font-label-sm text-on-surface-variant shrink-0">
                  <span className="material-symbols-outlined text-[16px]">format_align_left</span>
                  {draftContent.trim() ? draftContent.trim().split(/\s+/).length : 0} words
                </div>
              </div>
            )}
          </div>
          
        </div>
      </div>

      {/* RIGHT PANEL: Insights & Actions */}
      <div className="w-full lg:w-[320px] shrink-0 border-t lg:border-t-0 lg:border-l border-outline-variant bg-surface-container-lowest flex flex-col lg:h-full max-h-[40vh] lg:max-h-full overflow-y-auto">
        <div className="p-md border-b border-outline-variant">
          <h3 className="font-headline-sm text-headline-sm text-on-surface mb-xs flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[20px] text-primary">psychology</span>
            Generated From
          </h3>
          <p className="font-body-sm text-body-sm text-on-surface-variant mb-4">
            Built using completed project methodology phases.
          </p>
          <div className="flex flex-col gap-2">
            {activeSection.generatedFrom.map(src => (
              <div key={src} className="flex items-center gap-2 font-label-sm text-label-sm text-on-surface">
                <span className="material-symbols-outlined text-[16px] text-[#10B981]">check</span> {src}
              </div>
            ))}
          </div>
        </div>

        <div className="p-md border-b border-outline-variant">
          <h3 className="font-headline-sm text-headline-sm text-on-surface mb-xs">Report Health</h3>
          <div className="flex items-center gap-4 mb-5 mt-3">
            <div className="w-12 h-12 rounded-full border-[3px] border-[#10B981] flex items-center justify-center shrink-0">
              <span className="font-label-lg font-bold text-[#059669]">85</span>
            </div>
            <div>
              <span className="block font-label-md text-on-surface">Good Progress</span>
              <span className="block font-label-sm text-on-surface-variant">9 / 12 sections checked</span>
            </div>
          </div>
          
          <div className="space-y-3 mb-2">
            <div className="flex justify-between items-center">
              <span className="font-body-sm text-on-surface-variant">Consistency</span>
              <span className="font-label-sm text-[#10B981] bg-[#10B981]/10 px-2 py-0.5 rounded">Good</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-body-sm text-on-surface-variant">Coverage</span>
              <span className="font-label-sm text-[#10B981] bg-[#10B981]/10 px-2 py-0.5 rounded">Good</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-body-sm text-on-surface-variant">Missing Elements</span>
              <span className="font-label-sm text-[#D97706] bg-[#FEF3C7] px-2 py-0.5 rounded">3</span>
            </div>
          </div>
        </div>

        <div className="p-md">
          <div className="bg-error-container/40 border border-error/20 p-4 rounded-xl">
            <h4 className="font-label-sm font-bold text-on-error-container mb-3 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px]">warning</span> Missing Elements
            </h4>
            <ul className="space-y-2">
              <li className="font-body-sm text-on-surface-variant flex items-start gap-2">
                <span className="material-symbols-outlined text-[16px] mt-0.5 opacity-70">circle</span> Testing Strategy
              </li>
              <li className="font-body-sm text-on-surface-variant flex items-start gap-2">
                <span className="material-symbols-outlined text-[16px] mt-0.5 opacity-70">circle</span> Non Functional Requirements
              </li>
              <li className="font-body-sm text-on-surface-variant flex items-start gap-2">
                <span className="material-symbols-outlined text-[16px] mt-0.5 opacity-70">circle</span> Existing Solution Comparison
              </li>
            </ul>
          </div>
        </div>
      </div>
      
    </div>
  )
}
