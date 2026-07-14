import React, { useState } from "react";
import InfoTooltip from "@/components/ui/InfoTooltip";
import confetti from "canvas-confetti";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";

export default function UserStories() {
  const [tasks, setTasks] = useState({ task1: false, task2: false, task3: false });

  const handleTaskToggle = (taskId: keyof typeof tasks, checked: boolean) => {
    const newTasks = { ...tasks, [taskId]: checked };
    setTasks(newTasks);

    if (newTasks.task1 && newTasks.task2 && newTasks.task3 && !tasks[taskId]) {
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.65 },
        colors: ['#10B981', '#34D399', '#059669', '#A7F3D0'],
        disableForReducedMotion: true,
        zIndex: 100,
        ticks: 150
      });
    }
  };

  return (
    <div className="flex min-h-[calc(100dvh-150px)] w-full flex-col lg:flex-row overflow-hidden rounded-xl border border-outline-variant bg-surface">
      {/* Left Pane: Stories List */}
      <div className="w-full lg:w-[360px] flex-shrink-0 flex flex-col border-b lg:border-b-0 lg:border-r border-outline-variant bg-surface-container-lowest lg:h-full max-h-[48dvh] lg:max-h-none relative z-10">
        
        <div className="p-md border-b border-outline-variant bg-surface-container-lowest z-10">
          <div className="flex items-center justify-between mb-sm">
            <h1 className="font-headline-sm text-headline-sm text-on-surface flex items-center min-w-0">
              User Stories
              <InfoTooltip 
                label="User Stories" 
                tooltip="Describe features from an end-user perspective to guide development." 
              />
            </h1>
            <AnimatePresence mode="wait">
              {tasks.task1 && tasks.task2 && tasks.task3 ? (
                <motion.span 
                  key="complete"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  className="font-label-sm text-label-sm bg-[#10B981] text-white px-2 py-1 rounded uppercase tracking-wider shadow-sm flex items-center gap-1 shrink-0"
                >
                  <span className="material-symbols-outlined text-[14px]">done_all</span> Phase Complete
                </motion.span>
              ) : (
                <motion.span 
                  key="progress"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  className="font-label-sm text-label-sm bg-secondary-fixed text-on-secondary-fixed-variant px-2 py-1 rounded uppercase tracking-wider shrink-0"
                >
                  In Progress
                </motion.span>
              )}
            </AnimatePresence>
          </div>
          <div className="flex flex-col gap-sm">
            <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row sm:items-center gap-2">
              <div className="relative flex-1">
                <span className="material-symbols-outlined absolute left-2 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">search</span>
                <input type="text" placeholder="Search stories..." className="w-full pl-8 pr-3 py-1.5 bg-surface border border-outline-variant rounded text-body-md focus:outline-none focus:border-secondary transition-colors" />
              </div>
              <select className="bg-surface border border-outline-variant rounded px-2 py-1.5 text-body-md text-on-surface-variant focus:outline-none focus:border-secondary">
                <option>All Priorities</option>
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
              </select>
            </div>
            
            <div className="flex items-center justify-between text-body-md text-on-surface-variant">
              <label className="flex items-center gap-2 cursor-pointer hover:text-on-surface transition-colors">
                <input type="checkbox" className="rounded border-outline-variant text-primary focus:ring-primary" />
                <span className="font-label-md">Select All</span>
              </label>
              <div className="flex items-center gap-2">
                <button className="hover:text-primary transition-colors flex items-center font-label-md" title="Export">
                  <span className="material-symbols-outlined text-lg">download</span>
                </button>
                <button className="hover:text-primary transition-colors flex items-center font-label-md" title="Move">
                  <span className="material-symbols-outlined text-lg">drive_file_move</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="flex flex-col">
            <div className={cn("p-md border-b border-outline-variant cursor-pointer relative transition-all duration-300", tasks.task1 && tasks.task2 && tasks.task3 ? "bg-surface-container-low" : "bg-surface-container-high")}>
              <div className={cn("absolute left-0 top-0 bottom-0 w-1 transition-colors duration-300", tasks.task1 && tasks.task2 && tasks.task3 ? "bg-[#10B981]" : "bg-secondary")}></div>
              <div className="flex items-center gap-3 mb-1">
                <input type="checkbox" checked={tasks.task1 && tasks.task2 && tasks.task3} readOnly className="rounded border-outline-variant text-primary focus:ring-primary mt-0.5 cursor-pointer pointer-events-none" />
                <div className="flex justify-between items-center flex-1">
                  <span className={cn("font-label-md text-label-md transition-colors", tasks.task1 && tasks.task2 && tasks.task3 ? "text-outline-variant line-through" : "text-on-surface-variant")}>US-01</span>
                  <span className="font-label-sm text-label-sm bg-error-container text-on-error-container px-2 py-0.5 rounded uppercase">High</span>
                </div>
              </div>
              <p className={cn("font-body-md text-body-md font-medium pl-6 line-clamp-2 transition-colors", tasks.task1 && tasks.task2 && tasks.task3 ? "text-outline-variant line-through" : "text-on-surface")}>Upload project deliverables for supervisor review</p>
            </div>

            <div className="p-md border-b border-outline-variant hover:bg-surface-container-low cursor-pointer transition-colors group relative">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-transparent group-hover:bg-outline-variant transition-colors"></div>
              <div className="flex items-center gap-3 mb-1">
                <input type="checkbox" className="rounded border-outline-variant text-primary focus:ring-primary mt-0.5" />
                <div className="flex justify-between items-center flex-1">
                  <span className="font-label-md text-label-md text-on-surface-variant">US-02</span>
                  <span className="font-label-sm text-label-sm bg-surface-container-high text-on-surface px-2 py-0.5 rounded uppercase border border-outline-variant">Medium</span>
                </div>
              </div>
              <p className="font-body-md text-body-md text-on-surface pl-6 line-clamp-2">Leave inline comments on uploaded documents</p>
            </div>

            <div className="p-md border-b border-outline-variant hover:bg-surface-container-low cursor-pointer transition-colors group relative">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-transparent group-hover:bg-outline-variant transition-colors"></div>
              <div className="flex items-center gap-3 mb-1">
                <input type="checkbox" className="rounded border-outline-variant text-primary focus:ring-primary mt-0.5" />
                <div className="flex justify-between items-center flex-1">
                  <span className="font-label-md text-label-md text-on-surface-variant">US-03</span>
                  <span className="font-label-sm text-label-sm bg-error-container text-on-error-container px-2 py-0.5 rounded uppercase">High</span>
                </div>
              </div>
              <p className="font-body-md text-body-md text-on-surface pl-6 line-clamp-2">Configure submission deadlines across departments</p>
            </div>
          </div>
        </div>

        <div className="p-md border-t border-outline-variant bg-surface-container-lowest flex flex-col gap-2">
          <button className="flex items-center justify-center gap-2 w-full bg-primary text-on-primary px-4 py-2 rounded-lg hover:opacity-90 transition-opacity font-body-md font-medium">
            <span className="material-symbols-outlined text-[20px]">add</span>
            Add User Story
          </button>
          <button className="flex items-center justify-center gap-2 w-full bg-surface-container border border-outline-variant text-on-surface px-4 py-2 rounded-lg hover:bg-surface-container-high transition-colors font-body-md font-medium shadow-sm">
            <span className="material-symbols-outlined text-secondary text-[20px]">auto_awesome</span>
            AI Suggestions
          </button>
        </div>
      </div>

      {/* Right Pane: Story Detail */}
      <div className="flex-1 min-w-0 overflow-y-auto bg-surface relative">
        <div className="max-w-4xl mx-auto p-md sm:p-lg lg:p-xl">
          <div className="flex items-center gap-3 mb-lg sm:mb-xl flex-wrap">
            <span className="font-label-md text-label-md text-on-surface-variant bg-surface-container px-3 py-1.5 rounded-full border border-outline-variant">US-01</span>
            <span className="font-label-sm text-label-sm bg-error-container text-on-error-container px-3 py-1.5 rounded-full uppercase tracking-wider font-bold">High Priority</span>
          </div>

          <h2 className={cn("font-headline-lg text-headline-lg mb-lg leading-tight transition-colors duration-300", tasks.task1 && tasks.task2 && tasks.task3 ? "text-outline-variant line-through" : "text-on-surface")}>
            Upload project deliverables
          </h2>

          <div className="bg-surface-container-low border border-outline-variant rounded-xl p-lg mb-xl relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-secondary"></div>
            <div className="text-headline-sm font-medium text-on-surface leading-relaxed space-y-2">
              <p><span className="text-secondary font-bold">As a</span> Student,</p>
              <p><span className="text-secondary font-bold">I want to</span> upload my project deliverables,</p>
              <p><span className="text-secondary font-bold">So that</span> my supervisor can review them.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-xl">
            <div className="md:col-span-2 space-y-xl">
              <section>
                <h3 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-sm flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">subject</span> Description
                </h3>
                <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed">
                  This story covers the core submission functionality for students. It requires a robust file upload mechanism that handles large documents and ensures proper routing to the assigned supervisor. 
                </p>
              </section>

              <section>
                <h3 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-md flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">fact_check</span> Acceptance Criteria
                </h3>
                <div className="bg-surface-container-lowest border border-outline-variant rounded-lg overflow-hidden">
                  <label className="flex items-start gap-3 p-md border-b border-outline-variant hover:bg-surface-container-low cursor-pointer transition-colors group">
                    <input 
                      type="checkbox" 
                      checked={tasks.task1}
                      onChange={(e) => handleTaskToggle("task1", e.target.checked)}
                      className="mt-1 rounded border-outline-variant text-secondary focus:ring-secondary w-4 h-4 cursor-pointer" 
                    />
                    <span className={cn("font-body-md group-hover:text-primary transition-all", tasks.task1 ? "text-outline-variant line-through" : "text-on-surface")}>System accepts PDF and ZIP formats up to 50MB.</span>
                  </label>
                  <label className="flex items-start gap-3 p-md border-b border-outline-variant hover:bg-surface-container-low cursor-pointer transition-colors group">
                    <input 
                      type="checkbox" 
                      checked={tasks.task2}
                      onChange={(e) => handleTaskToggle("task2", e.target.checked)}
                      className="mt-1 rounded border-outline-variant text-secondary focus:ring-secondary w-4 h-4 cursor-pointer" 
                    />
                    <span className={cn("font-body-md group-hover:text-primary transition-all", tasks.task2 ? "text-outline-variant line-through" : "text-on-surface")}>Upload triggers an automatic email notification to assigned supervisor.</span>
                  </label>
                  <label className="flex items-start gap-3 p-md hover:bg-surface-container-low cursor-pointer transition-colors group">
                    <input 
                      type="checkbox" 
                      checked={tasks.task3}
                      onChange={(e) => handleTaskToggle("task3", e.target.checked)}
                      className="mt-1 rounded border-outline-variant text-secondary focus:ring-secondary w-4 h-4 cursor-pointer" 
                    />
                    <span className={cn("font-body-md group-hover:text-primary transition-all", tasks.task3 ? "text-outline-variant line-through" : "text-on-surface")}>Student can view upload timestamp and status.</span>
                  </label>
                </div>
              </section>
            </div>

            <div className="space-y-lg border-t md:border-t-0 md:border-l border-outline-variant pt-lg md:pt-0 md:pl-lg">
              <div>
                <span className="block font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-2">Status</span>
                <AnimatePresence mode="wait">
                  {tasks.task1 && tasks.task2 && tasks.task3 ? (
                    <motion.span 
                      key="approved"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      className="inline-flex items-center gap-1.5 font-label-md text-label-md bg-[#10B981]/10 text-[#059669] px-2.5 py-1 rounded-md border border-[#10B981]/30 shadow-sm"
                    >
                      <span className="material-symbols-outlined text-[14px]">check_circle</span> Approved
                    </motion.span>
                  ) : (
                    <motion.span 
                      key="progress"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      className="inline-flex items-center gap-1.5 font-label-md text-label-md bg-secondary-fixed text-on-secondary-fixed-variant px-2.5 py-1 rounded-md border border-outline-variant"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span> In Progress
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
              <div>
                <span className="block font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">Assignee</span>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-8 h-8 rounded-full bg-surface-container-high border border-outline-variant flex items-center justify-center text-on-surface font-label-md">
                    SD
                  </div>
                  <span className="font-body-md text-on-surface">Sarah Dev</span>
                </div>
              </div>
              <div>
                <span className="block font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">Epic Link</span>
                <a href="#" className="font-body-md text-secondary hover:underline flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">account_tree</span> Document Management
                </a>
              </div>
              <div>
                <span className="block font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">Created</span>
                <span className="font-body-md text-on-surface-variant">Oct 12, 2023</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
