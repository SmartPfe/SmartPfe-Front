import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import HugeiconsIcon from "@/components/ui/HugeiconsIcon";
import { cn } from "@/lib/utils";

interface RevisionHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function RevisionHistoryDrawer({ isOpen, onClose }: RevisionHistoryDrawerProps) {
  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const history = [
    { 
      id: 1, 
      time: "Just now", 
      date: "Today, 10:50 AM", 
      user: "JD", 
      action: "Updated UML Diagrams", 
      details: "Added 'AnalyticsEngine' class and defined relation with Dashboard component in Class Diagram.",
      phase: "UML Preparation",
      current: true 
    },
    { 
      id: 2, 
      time: "2 hours ago", 
      date: "Today, 8:30 AM", 
      user: "JD", 
      action: "Validated Phase: Product Backlog", 
      details: "Approved 12 Backlog Items and moved sprint velocity metric to 42 points.",
      phase: "Product Backlog",
      current: false 
    },
    { 
      id: 3, 
      time: "Yesterday", 
      date: "Jun 16, 4:15 PM", 
      user: "Professor Smith", 
      action: "Added Review Comment", 
      details: "\"Please consider scaling implications. Add a Non-Functional Requirement for at least 10,000 concurrent users.\"",
      phase: "Non-Functional Reqs",
      current: false 
    },
    { 
      id: 4, 
      time: "Yesterday", 
      date: "Jun 16, 1:20 PM", 
      user: "JD", 
      action: "Restructured Report Sections", 
      details: "Reordered 'Technical Stack' to appear before 'Implementation Details'. Added Chapter 4.",
      phase: "Report Structure",
      current: false 
    },
    { 
      id: 5, 
      time: "2 days ago", 
      date: "Jun 15, 11:00 AM", 
      user: "JD", 
      action: "Project Initialization", 
      details: "Created 'AI-Powered Analytics Platform for Retail' project workspace and defined core Domain.",
      phase: "Overview",
      current: false 
    },
  ];

  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-end font-sans animate-in fade-in duration-150">
      <div 
        className="fixed inset-0 bg-black/45 dark:bg-black/60 backdrop-blur-md transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative w-[90vw] sm:w-[420px] max-w-full bg-surface h-full shadow-2xl border-l border-outline-variant/80 flex flex-col z-10 animate-in slide-in-from-right duration-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant/60 bg-surface-container-lowest">
          <div>
            <h2 className="text-sm font-bold text-on-surface flex items-center gap-2">
              <HugeiconsIcon icon="history" size={17} className="text-primary" strokeWidth={1.8} />
              <span>Revision History</span>
            </h2>
            <p className="text-[11px] text-on-surface-variant mt-0.5 font-medium">Track modifications across all PFE phases</p>
          </div>
          <button 
            onClick={onClose}
            type="button"
            className="w-7 h-7 rounded-md flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
            aria-label="Close revision history"
          >
            <HugeiconsIcon icon="close" size={15} strokeWidth={2} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-5 bg-surface">
          <div className="relative border-l-2 border-outline-variant/40 ml-2 space-y-6">
            {history.map((item) => (
              <div key={item.id} className="relative pl-5">
                <div className={cn(
                  "absolute -left-[7px] top-1 w-3 h-3 rounded-full border-2 bg-surface",
                  item.current ? "border-primary bg-primary/20" : "border-outline-variant"
                )} />
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-outline-variant">
                      {item.time}
                    </span>
                    {item.current && (
                      <span className="text-[9px] uppercase font-bold tracking-wider bg-primary/10 text-primary px-1.5 py-0.5 border border-primary/20 rounded">
                        Latest Edit
                      </span>
                    )}
                  </div>
                  
                  <div className={cn(
                    "p-3 rounded-xl border transition-all",
                    item.current ? "bg-surface-container-low/90 border-primary/30 shadow-xs" : "bg-surface-container-lowest border-outline-variant/60 hover:bg-surface-container-low"
                  )}>
                    <div className="flex items-start justify-between gap-3 mb-1.5">
                       <h3 className="font-semibold text-xs text-on-surface">
                        {item.action}
                      </h3>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-surface-container text-on-surface-variant font-medium whitespace-nowrap">
                        {item.phase}
                      </span>
                    </div>
                    
                    <p className="text-xs text-on-surface-variant leading-relaxed mb-2.5">
                      {item.details}
                    </p>
                    
                    <div className="flex items-center justify-between border-t border-outline-variant/40 pt-2 text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <div className="w-4 h-4 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[9px] font-bold">
                          {item.user === "JD" ? "JD" : item.user.substring(0, 2).toUpperCase()}
                        </div>
                        <span className="text-[10px] font-mono text-outline-variant">{item.date}</span>
                      </div>
                      
                      {!item.current && (
                        <button type="button" className="px-2 py-0.5 text-[10px] font-semibold text-primary hover:bg-primary/10 rounded transition-colors flex items-center gap-1 cursor-pointer">
                          <HugeiconsIcon icon="refresh" size={11} strokeWidth={2} />
                          <span>Restore</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

