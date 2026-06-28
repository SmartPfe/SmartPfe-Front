import { useEffect } from "react";
import { useEditor, EditorContent, Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import CharacterCount from "@tiptap/extension-character-count";
import EditorToolbar from "./EditorToolbar";

interface RichTextEditorProps {
  content: string;
  onChange: (html: string, plainText: string, isEmpty: boolean) => void;
  readOnly?: boolean;
  externalUpdateTrigger?: { content: string; timestamp: number };
}

export default function RichTextEditor({
  content,
  onChange,
  readOnly = false,
  externalUpdateTrigger,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder:
          "Start writing your problem statement...\n\nDescribe the problem you're solving, why it matters, and what your project proposes.",
      }),
      CharacterCount,
    ],
    content,
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const plainText = editor.getText();
      const isEmpty = editor.isEmpty;
      onChange(html, plainText, isEmpty);
    },
    onCreate: ({ editor }) => {
      const html = editor.getHTML();
      const plainText = editor.getText();
      const isEmpty = editor.isEmpty;
      onChange(html, plainText, isEmpty);
    },
  });

  // Handle external updates (e.g. AI generation/accepting suggestions)
  useEffect(() => {
    if (editor && externalUpdateTrigger) {
      editor.commands.setContent(externalUpdateTrigger.content);
      const html = editor.getHTML();
      const plainText = editor.getText();
      onChange(html, plainText, editor.isEmpty);
    }
  }, [editor, externalUpdateTrigger]);

  // Automatically update content when async project loads
  useEffect(() => {
    if (editor && content && editor.isEmpty) {
      editor.commands.setContent(content);
      const html = editor.getHTML();
      const plainText = editor.getText();
      onChange(html, plainText, editor.isEmpty);
    }
  }, [editor, content]);

  // Properly sync readOnly prop changes via useEffect (not inline — avoids render-phase side effects)
  useEffect(() => {
    if (editor) {
      editor.setEditable(!readOnly);
    }
  }, [editor, readOnly]);

  return (
    <div
      className={`flex flex-col border rounded-md overflow-hidden bg-surface-bright transition-all
        ${readOnly
          ? "border-outline-variant opacity-60 pointer-events-none"
          : "border-outline-variant focus-within:border-primary focus-within:ring-1 focus-within:ring-primary"
        }`}
    >
      <EditorToolbar editor={editor} />
      <div className="p-5 min-h-[320px]">
        <EditorContent
          editor={editor}
          className="outline-none min-h-[280px] text-body-lg text-on-surface leading-relaxed [&_.ProseMirror]:outline-none [&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_.ProseMirror_p.is-editor-empty:first-child::before]:text-on-surface-variant [&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none [&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left [&_.ProseMirror_p.is-editor-empty:first-child::before]:h-0"
        />
      </div>
    </div>
  );
}
