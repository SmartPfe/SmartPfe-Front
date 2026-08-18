import { useEffect, useRef, useState } from "react";
import InfoTooltip from "@/components/ui/InfoTooltip";
import { useProblemStatement } from "./hooks/useProblemStatement";
import { getLanguageLabel } from "./hooks/useProblemStatement";
import RichTextEditor from "./components/RichTextEditor";
import AiSuggestionPanel from "./components/AiSuggestionPanel";
import AiBackgroundBanner from "@/components/ai/AiBackgroundBanner";
import SaveStatusHeader from "@/components/ui/SaveStatusHeader";
import AiActionToolbar from "@/components/ai/AiActionToolbar";

export default function ProblemStatement() {
  const {
    project,
    loading,
    saveStatus,
    aiState,
    isAiBusy,
    suggestion,
    snapshotHtml: hookSnapshotHtml,
    error,
    saveContent,
    markUnsaved,
    generateWithAi,
    refineWithAi,
    translateWithAi,
    cancelAi,
    projectLanguage,
    problemStatementLanguage,
    acceptSuggestion,
    discardSuggestion,
    dismissError,
  } = useProblemStatement();

  const [isEditorEmpty, setIsEditorEmpty] = useState(true);
  
  // Keep track of content via refs to avoid re-renders on every keystroke
  const editorHtmlRef = useRef("");
  const editorPlainRef = useRef("");
  const autosaveTimerRef = useRef<number | null>(null);
  
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

  // Sync snapshot html from hook if restored from background
  useEffect(() => {
    if (hookSnapshotHtml) {
      setSnapshotHtml(hookSnapshotHtml);
    }
  }, [hookSnapshotHtml]);

  // Ctrl+S / Cmd+S keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        if (autosaveTimerRef.current) {
          window.clearTimeout(autosaveTimerRef.current);
        }
        saveContent(editorHtmlRef.current);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [saveContent]);

  useEffect(() => {
    return () => {
      if (autosaveTimerRef.current) {
        window.clearTimeout(autosaveTimerRef.current);
      }
    };
  }, []);

  const scheduleAutosave = (content: string) => {
    markUnsaved();
    if (autosaveTimerRef.current) {
      window.clearTimeout(autosaveTimerRef.current);
    }
    autosaveTimerRef.current = window.setTimeout(() => {
      saveContent(content);
    }, 1200);
  };

  const handleGenerate = async () => {
    setSnapshotHtml(editorHtmlRef.current);
    const generatedText = await generateWithAi();
    if (generatedText) {
      // Directly inject generated text into the editor (bypassing suggestion panel)
      setExternalUpdate({ content: generatedText, timestamp: Date.now() });
    }
  };

  const handleRefine = async (instructions?: string) => {
    setSnapshotHtml(editorHtmlRef.current);
    await refineWithAi(editorPlainRef.current, instructions);
  };

  const handleTranslate = async () => {
    if (!projectLanguage) return;
    if (autosaveTimerRef.current) {
      window.clearTimeout(autosaveTimerRef.current);
    }
    setSnapshotHtml(editorHtmlRef.current);
    const translatedText = await translateWithAi(editorHtmlRef.current);
    if (translatedText) {
      setExternalUpdate({ content: translatedText, timestamp: Date.now() });
    }
  };

  const handleAccept = () => {
    if (suggestion) {
      setExternalUpdate({ content: suggestion, timestamp: Date.now() });
      saveContent(suggestion, projectLanguage || undefined);
    }
    acceptSuggestion();
  };

  const shouldShowTranslate = Boolean(
    projectLanguage &&
    !isEditorEmpty &&
    problemStatementLanguage !== projectLanguage
  );

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
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-primary">Problem Definition</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-on-surface flex items-center">
            Problem Statement
            <InfoTooltip
              label="Problem Statement"
              tooltip="Clearly articulate the issue your project aims to solve."
            />
          </h1>
          <p className="text-sm text-on-surface-variant max-w-[42rem] mt-1.5 leading-relaxed">
            Clearly define the real-world problem or research challenge your project aims to resolve.
          </p>
        </div>

        {/* Global SaveStatusHeader */}
        <SaveStatusHeader
          status={saveStatus}
          onSave={() => {
            if (autosaveTimerRef.current) {
              window.clearTimeout(autosaveTimerRef.current);
            }
            saveContent(editorHtmlRef.current);
          }}
          isBusy={isAiBusy}
        />
      </div>

      {/* Background AI Progress Banner */}
      <AiBackgroundBanner
        isVisible={isAiBusy}
        moduleName="Problem Statement"
        action={aiState}
        onCancel={cancelAi}
      />

      {/* Error Banner */}
      {error && (
        <div className="mb-6 p-3.5 rounded-xl bg-error-container text-on-error-container border border-error/20 flex items-center justify-between gap-3 shadow-2xs">
          <p className="text-sm font-medium">{error}</p>
          <button onClick={dismissError} className="shrink-0 text-xs font-semibold underline hover:no-underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Global AI Action Toolbar */}
      <AiActionToolbar
        onGenerate={handleGenerate}
        onRefine={handleRefine}
        onTranslate={handleTranslate}
        isGenerating={aiState === "generating"}
        isRefining={aiState === "refining"}
        isTranslating={aiState === "translating"}
        isBusy={isAiBusy || aiState === "suggestion_ready"}
        canGenerate={isEditorEmpty}
        canRefine={!isEditorEmpty}
        generateDisabledTitle="Editor already has content — use Refine instead"
        refineDisabledTitle="Write something first, then ask AI to refine it"
        refinePlaceholder="Tell AI what you'd like to improve (e.g., 'Make it more academic and concise')..."
        showTranslate={shouldShowTranslate}
        translateLabel={`Translate to ${getLanguageLabel(projectLanguage)}`}
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
            scheduleAutosave(html);
          }}
          readOnly={isAiBusy || aiState === "suggestion_ready"}
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
