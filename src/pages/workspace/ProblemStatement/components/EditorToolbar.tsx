import { Editor } from "@tiptap/react";

interface EditorToolbarProps {
  editor: Editor | null;
}

export default function EditorToolbar({ editor }: EditorToolbarProps) {
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
          title="Bold"
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
          title="Italic"
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
          title="Heading 1"
        >
          H1
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`p-1.5 rounded-md flex items-center justify-center transition-colors font-bold text-sm ${
            editor.isActive("heading", { level: 2 }) ? "bg-primary-container text-on-primary-container" : "text-on-surface-variant hover:bg-surface-container"
          }`}
          title="Heading 2"
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
          title="Bullet List"
        >
          <span className="material-symbols-outlined text-[18px]">format_list_bulleted</span>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-1.5 rounded-md flex items-center justify-center transition-colors ${
            editor.isActive("orderedList") ? "bg-primary-container text-on-primary-container" : "text-on-surface-variant hover:bg-surface-container"
          }`}
          title="Numbered List"
        >
          <span className="material-symbols-outlined text-[18px]">format_list_numbered</span>
        </button>
      </div>

      <div className="text-label-sm text-on-surface-variant pr-2">
        {wordCount} {wordCount === 1 ? 'word' : 'words'}
      </div>
    </div>
  );
}
