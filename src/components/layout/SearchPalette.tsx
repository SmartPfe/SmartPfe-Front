import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate } from "react-router-dom";
import { WORKSPACE_PHASES } from "@/lib/constants";

interface SearchPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchPalette({ isOpen, onClose }: SearchPaletteProps) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    } else {
      setQuery("");
    }
  }, [isOpen]);

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

  const filteredPhases = WORKSPACE_PHASES.filter(
    (phase) =>
      phase.label.toLowerCase().includes(query.toLowerCase()) ||
      phase.id.toLowerCase().includes(query.toLowerCase())
  );

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh] sm:pt-[20vh] font-sans">
      <div 
        className="fixed inset-0 bg-on-surface-variant/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      <div 
        style={{ width: "90%", maxWidth: "650px" }}
        className="relative bg-surface rounded-xl shadow-2xl border border-outline-variant overflow-hidden flex flex-col z-10"
      >
        <div className="flex items-center px-4 py-3 border-b border-outline-variant w-full">
          <span className="material-symbols-outlined text-outline-variant text-[24px] mr-3 shrink-0">search</span>
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent border-none outline-none text-on-surface placeholder:text-outline text-lg w-full min-w-0"
            placeholder="Search PFE phases, documents, or keywords..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-outline hover:text-on-surface hover:bg-surface-container transition-colors ml-2 shrink-0"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-2">
          {filteredPhases.length > 0 ? (
            <div className="mb-4">
              <h3 className="px-3 py-2 text-xs font-bold text-outline-variant uppercase tracking-wider">
                Workspace Phases
              </h3>
              <ul className="flex flex-col gap-1">
                {filteredPhases.map((phase) => (
                  <li key={phase.id}>
                    <button
                      onClick={() => {
                        navigate(phase.path);
                        onClose();
                      }}
                      className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-surface-container-low transition-colors text-left group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-primary-container text-on-primary-container flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-[18px]">dashboard</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors truncate">
                          {phase.label}
                        </p>
                        <p className="text-xs text-on-surface-variant truncate">
                          Navigate to {phase.label} section in workspace
                        </p>
                      </div>
                      <span className="material-symbols-outlined text-outline-variant opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        arrow_forward
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center mb-3">
                <span className="material-symbols-outlined text-outline">search_off</span>
              </div>
              <p className="text-on-surface font-medium mb-1">No results found for "{query}"</p>
              <p className="text-sm text-on-surface-variant">Try searching for phase names like "UML", "Requirements", or "Problem".</p>
            </div>
          )}
        </div>
        
        <div className="px-4 py-3 bg-surface-container-lowest border-t border-outline-variant flex items-center justify-between text-xs text-on-surface-variant">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1"><kbd className="bg-surface-container px-1.5 py-0.5 rounded border border-outline-variant font-sans text-[10px]">↑↓</kbd> to navigate</span>
            <span className="flex items-center gap-1"><kbd className="bg-surface-container px-1.5 py-0.5 rounded border border-outline-variant font-sans text-[10px]">↵</kbd> to select</span>
            <span className="flex items-center gap-1"><kbd className="bg-surface-container px-1.5 py-0.5 rounded border border-outline-variant font-sans text-[10px]">esc</kbd> to close</span>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
