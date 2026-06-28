import { useEffect, useRef, useState } from "react";
import InfoTooltip from "@/components/ui/InfoTooltip";
import { useProblemStatement } from "./hooks/useProblemStatement";
import RichTextEditor from "./components/RichTextEditor";
import AiActionBar from "./components/AiActionBar";
import AiSuggestionPanel from "./components/AiSuggestionPanel";
import type { Editor } from "@tiptap/react";

export default function ProblemStatement() {
  const {
    project,
    loading,
    saveStatus,
    aiState,
    suggestion,
    error,
    saveContent,
    markUnsaved,
    generateWithAi,
    refineWithAi,
    acceptSuggestion,
    discardSuggestion,
    dismissError,
  } = useProblemStatement();

  const [isEditorEmpty, setIsEditorEmpty] = useState(true);
  
  // Keep track of content via refs to avoid re-renders on every keystroke
  const editorHtmlRef = useRef("");
  const editorPlainRef = useRef("");
  
  const [snapshotHtml, setSnapshotHtml] = useState(""); // Capture HTML before AI request
  const [externalUpdate, setExternalUpdate] = useState<{ content: string; timestamp: number } | undefined>();

  // Initialize empty state once project loads
  useEffect(() => {
    if (project) {
      const content = project.description?.problemStatement || "";
      const tmp = document.createElement("div");
      tmp.innerHTML = content;
      editorHtmlRef.current = content;
      editorPlainRef.current = tmp.textContent || tmp.innerText || "";
      setIsEditorEmpty((tmp.textContent || tmp.innerText || "").trim().length === 0);
    }
  }, [project]);

  // Ctrl+S / Cmd+S keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        saveContent(editorHtmlRef.current);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [saveContent]);

  const handleGenerate = async () => {
    setSnapshotHtml(editorHtmlRef.current);
    const generatedText = await generateWithAi();
    if (generatedText) {
      // Directly inject generated text into the editor (bypassing suggestion panel)
      setExternalUpdate({ content: generatedText, timestamp: Date.now() });
      saveContent(generatedText);
    }
  };

  const handleRefine = () => {
    setSnapshotHtml(editorHtmlRef.current);
    refineWithAi(editorPlainRef.current);
  };

  const handleAccept = () => {
    if (suggestion) {
      setExternalUpdate({ content: suggestion, timestamp: Date.now() });
      saveContent(suggestion);
    }
    acceptSuggestion();
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-[50vh] items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-on-surface-variant font-medium">Loading editor...</p>
      </div>
    );
  }

  return (
    <div className="max-w-[860px] mx-auto w-full pb-32">
      {/* Page Header */}
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-display text-on-surface mb-2 flex items-center">
            Problem Statement
            <InfoTooltip
              label="Problem Statement"
              tooltip="Clearly articulate the issue your project aims to solve."
            />
          </h1>
          <p className="text-body-lg text-on-surface-variant max-w-[42rem]">
            Clearly define the issue your project aims to resolve.
          </p>
        </div>

        {/* Save indicator + Save button */}
        <div className="flex items-center gap-4 shrink-0">
          <span className={`text-label-sm transition-colors ${
            saveStatus === "saving" ? "text-on-surface-variant" :
            saveStatus === "saved"  ? "text-secondary" :
            "text-outline"
          }`}>
            {saveStatus === "saving" ? "Saving..." :
             saveStatus === "saved"  ? "Saved" :
             "Unsaved changes"}
          </span>
          <button
            onClick={() => saveContent(editorHtmlRef.current)}
            disabled={saveStatus === "saving"}
            className="px-5 py-2 rounded-md bg-primary text-on-primary text-label-md font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            Save
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mb-6 p-3 rounded-lg bg-error-container text-on-error-container border border-error/20 flex items-center justify-between gap-3">
          <p className="text-body-md">{error}</p>
          <button onClick={dismissError} className="shrink-0 text-label-sm underline hover:no-underline">
            Dismiss
          </button>
        </div>
      )}

      {/* AI Action Bar — always visible above editor */}
      <AiActionBar
        onGenerate={handleGenerate}
        onRefine={handleRefine}
        loading={aiState === "generating"}
        editorIsEmpty={isEditorEmpty}
        disabled={aiState === "suggestion_ready"}
      />

      {/* Editor */}
      <div className="mt-3">
        <RichTextEditor
          content={project?.description?.problemStatement || ""}
          externalUpdateTrigger={externalUpdate}
          onChange={(html, plainText, isEmpty) => {
            editorHtmlRef.current = html;
            editorPlainRef.current = plainText;
            if (isEditorEmpty !== isEmpty) {
              setIsEditorEmpty(isEmpty);
            }
            markUnsaved();
          }}
          readOnly={aiState === "generating" || aiState === "suggestion_ready"}
        />
      </div>

      {/* AI Suggestion Panel — appears below editor when AI responds (Refine only) */}
      {aiState === "suggestion_ready" && suggestion && (
        <AiSuggestionPanel
          currentText={snapshotHtml}
          suggestedText={suggestion}
          onAccept={handleAccept}
          onDiscard={discardSuggestion}
        />
      )}
    </div>
  );
}
