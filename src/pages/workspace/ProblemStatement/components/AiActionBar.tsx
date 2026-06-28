interface AiActionBarProps {
  onGenerate: () => void;
  onRefine: () => void;
  loading: boolean;
  editorIsEmpty: boolean;
  disabled?: boolean;
}

export default function AiActionBar({
  onGenerate,
  onRefine,
  loading,
  editorIsEmpty,
  disabled = false,
}: AiActionBarProps) {
  return (
    <div className="flex items-center gap-3">
      <button
        onClick={onGenerate}
        disabled={loading || disabled || !editorIsEmpty}
        title={!editorIsEmpty ? "Editor already has content — use Refine instead" : "Generate a full first draft with AI"}
        className="px-5 py-2 rounded-md border border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5 text-primary text-label-md font-semibold
                   hover:from-primary/10 hover:to-secondary/10 transition-all shadow-sm
                   disabled:opacity-40 disabled:cursor-not-allowed disabled:grayscale"
      >
        {loading ? (
          <span className="inline-flex items-center gap-2">
            <span className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            Generating...
          </span>
        ) : (
          "Generate with AI"
        )}
      </button>

      <button
        onClick={onRefine}
        disabled={loading || disabled || editorIsEmpty}
        title={editorIsEmpty ? "Write something first, then ask AI to refine it" : "Improve and expand your current text with AI"}
        className="px-5 py-2 rounded-md border border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5 text-primary text-label-md font-semibold
                   hover:from-primary/10 hover:to-secondary/10 transition-all shadow-sm
                   disabled:opacity-40 disabled:cursor-not-allowed disabled:grayscale"
      >
        {loading ? (
          <span className="inline-flex items-center gap-2">
            <span className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            Refining...
          </span>
        ) : (
          "Refine with AI"
        )}
      </button>
    </div>
  );
}
