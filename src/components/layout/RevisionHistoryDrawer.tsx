import React, { useEffect } from "react";
import { createPortal } from "react-dom";
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
    <div className="fixed inset-0 z-[100] flex justify-end font-sans">
      <div 
        className="fixed inset-0 bg-on-surface-variant/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div className="relative w-[90vw] sm:w-[450px] max-w-full bg-surface h-full shadow-2xl border-l border-outline-variant flex flex-col z-10 transition-transform transform translate-x-0">
        <div className="flex items-center justify-between px-6 py-5 border-b border-outline-variant bg-surface-container-lowest">
          <div>
            <h2 className="text-lg font-bold text-on-surface flex items-center gap-2 mb-1">
              <span className="material-symbols-outlined text-primary">history</span>
              Revision History
            </h2>
            <p className="text-xs text-on-surface-variant font-medium">Track modifications across all PFE phases</p>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-outline hover:text-on-surface hover:bg-surface-container transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 bg-surface-container-lowest/50">
          <div className="relative border-l-2 border-outline-variant/30 ml-3 space-y-10">
            {history.map((item) => (
              <div key={item.id} className="relative pl-6">
                <div className={cn(
                  "absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 bg-surface",
                  item.current ? "border-primary" : "border-outline-variant"
                )} />
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-outline-variant">
                      {item.time}
                    </span>
                    {item.current && (
                      <span className="text-[10px] uppercase font-bold tracking-wider bg-primary/20 text-primary px-2 py-0.5 border border-primary/30 rounded">
                        Latest Edit
                      </span>
                    )}
                  </div>
                  
                  <div className={cn(
                    "p-4 rounded-xl border mt-1",
                    item.current ? "bg-surface border-primary/30 shadow-sm" : "bg-surface-container-lowest border-outline-variant/50 hover:bg-surface-container-low transition-colors"
                  )}>
                    <div className="flex items-start justify-between gap-4 mb-2">
                       <h3 className={cn(
                        "font-bold text-sm",
                        item.current ? "text-on-surface" : "text-on-surface"
                      )}>
                        {item.action}
                      </h3>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-medium whitespace-nowrap">
                        {item.phase}
                      </span>
                    </div>
                    
                    <p className="text-xs text-on-surface-variant leading-relaxed mb-3">
                      {item.details}
                    </p>
                    
                    <div className="flex items-center justify-between border-t border-outline-variant/30 pt-3">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-surface-container-highest flex items-center justify-center text-[10px] font-bold text-on-surface">
                          {item.user === "JD" ? "JD" : item.user.substring(0, 2).toUpperCase()}
                        </div>
                        <span className="text-[11px] font-medium text-outline">{item.date}</span>
                      </div>
                      
                      {!item.current && (
                        <button className="px-2.5 py-1 text-[11px] font-bold text-primary hover:bg-primary-container/50 rounded transition-colors flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">restore</span>
                          Restore
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
