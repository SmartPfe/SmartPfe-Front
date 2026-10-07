import { Editor } from "@tiptap/react";
import { useTranslation } from "react-i18next";

interface EditorToolbarProps {
  editor: Editor | null;
}

export default function EditorToolbar({ editor }: EditorToolbarProps) {
  const { t } = useTranslation("design");
  if (!editor) {
    return null;
  }

  const wordCount = editor.storage.characterCount.words();

  return (
    <div className="flex items-center justify-between p-2 border-b border-outline-variant bg-surface-container-lowest">
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={!editor.can().chain().focus().toggleBold().run()}
          className={`p-1.5 rounded-md flex items-center justify-center transition-colors ${
            editor.isActive("bold") ? "bg-primary-container text-on-primary-container" : "text-on-surface-variant hover:bg-surface-container"
          }`}
          title={t("problem.toolbar.bold")}
        >
          <span className="material-symbols-outlined text-[18px]">format_bold</span>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={!editor.can().chain().focus().toggleItalic().run()}
          className={`p-1.5 rounded-md flex items-center justify-center transition-colors ${
            editor.isActive("italic") ? "bg-primary-container text-on-primary-container" : "text-on-surface-variant hover:bg-surface-container"
          }`}
          title={t("problem.toolbar.italic")}
        >
          <span className="material-symbols-outlined text-[18px]">format_italic</span>
        </button>
        
        <div className="w-[1px] h-5 bg-outline-variant mx-1"></div>
        
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`p-1.5 rounded-md flex items-center justify-center transition-colors font-bold text-sm ${
            editor.isActive("heading", { level: 1 }) ? "bg-primary-container text-on-primary-container" : "text-on-surface-variant hover:bg-surface-container"
          }`}
          title={t("problem.toolbar.heading1")}
        >
          H1
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`p-1.5 rounded-md flex items-center justify-center transition-colors font-bold text-sm ${
            editor.isActive("heading", { level: 2 }) ? "bg-primary-container text-on-primary-container" : "text-on-surface-variant hover:bg-surface-container"
          }`}
          title={t("problem.toolbar.heading2")}
        >
          H2
        </button>

        <div className="w-[1px] h-5 bg-outline-variant mx-1"></div>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-1.5 rounded-md flex items-center justify-center transition-colors ${
            editor.isActive("bulletList") ? "bg-primary-container text-on-primary-container" : "text-on-surface-variant hover:bg-surface-container"
          }`}
          title={t("problem.toolbar.bulletList")}
        >
          <span className="material-symbols-outlined text-[18px]">format_list_bulleted</span>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-1.5 rounded-md flex items-center justify-center transition-colors ${
            editor.isActive("orderedList") ? "bg-primary-container text-on-primary-container" : "text-on-surface-variant hover:bg-surface-container"
          }`}
          title={t("problem.toolbar.numberedList")}
        >
          <span className="material-symbols-outlined text-[18px]">format_list_numbered</span>
        </button>
      </div>

      <div className="text-label-sm text-on-surface-variant pr-2">
        {wordCount} {t(wordCount === 1 ? "problem.toolbar.word" : "problem.toolbar.words")}
      </div>
    </div>
  );
}
