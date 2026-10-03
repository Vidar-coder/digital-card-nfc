"use client";

import { Placeholder } from "@tiptap/extensions";
import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Bold, Heading3, Italic, Link2, List, ListOrdered, Quote, Redo2, Undo2, type LucideIcon } from "lucide-react";
import { useEffect } from "react";
import { cn } from "@/lib/utils";

interface Props {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export function RichTextEditor({ value, onChange, placeholder = "Write about yourself…" }: Props) {
  const editor = useEditor({
    immediatelyRender: false, // avoid SSR hydration mismatch
    extensions: [
      StarterKit.configure({
        heading: { levels: [3] },
        link: { openOnClick: false, autolink: true, protocols: ["mailto", "tel"] },
        codeBlock: false,
        code: false,
        horizontalRule: false,
      }),
      Placeholder.configure({ placeholder }),
    ],
    content: value,
    editorProps: { attributes: { class: "text-[15px] leading-relaxed text-zinc-800", "aria-label": "About me" } },
    onUpdate: ({ editor }) => onChange(editor.isEmpty ? "" : editor.getHTML()),
  });

  // Sync external resets (e.g. "Discard changes").
  useEffect(() => {
    if (editor && value !== editor.getHTML() && !(value === "" && editor.isEmpty)) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [value, editor]);

  const state = useEditorState({
    editor,
    selector: ({ editor: e }) =>
      e
        ? {
            bold: e.isActive("bold"),
            italic: e.isActive("italic"),
            h3: e.isActive("heading", { level: 3 }),
            ul: e.isActive("bulletList"),
            ol: e.isActive("orderedList"),
            quote: e.isActive("blockquote"),
            link: e.isActive("link"),
            canUndo: e.can().undo(),
            canRedo: e.can().redo(),
          }
        : null,
  });

  const setLink = () => {
    if (!editor) return;
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Link URL", prev ?? "https://");
    if (url === null) return;
    if (url === "" || url === "https://") editor.chain().focus().unsetLink().run();
    else editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  const tools: { icon: LucideIcon; label: string; active?: boolean; disabled?: boolean; run: () => void }[] = editor
    ? [
        { icon: Bold, label: "Bold", active: state?.bold, run: () => editor.chain().focus().toggleBold().run() },
        { icon: Italic, label: "Italic", active: state?.italic, run: () => editor.chain().focus().toggleItalic().run() },
        { icon: Heading3, label: "Heading", active: state?.h3, run: () => editor.chain().focus().toggleHeading({ level: 3 }).run() },
        { icon: List, label: "Bullet list", active: state?.ul, run: () => editor.chain().focus().toggleBulletList().run() },
        { icon: ListOrdered, label: "Numbered list", active: state?.ol, run: () => editor.chain().focus().toggleOrderedList().run() },
        { icon: Quote, label: "Quote", active: state?.quote, run: () => editor.chain().focus().toggleBlockquote().run() },
        { icon: Link2, label: "Link", active: state?.link, run: setLink },
        { icon: Undo2, label: "Undo", disabled: !state?.canUndo, run: () => editor.chain().focus().undo().run() },
        { icon: Redo2, label: "Redo", disabled: !state?.canRedo, run: () => editor.chain().focus().redo().run() },
      ]
    : [];

  return (
    <div className="rte overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xs focus-within:border-brand focus-within:ring-3 focus-within:ring-brand/15">
      <div className="flex flex-wrap gap-0.5 border-b border-zinc-100 bg-zinc-50/80 p-1.5" role="toolbar" aria-label="Formatting">
        {tools.map((t, i) => (
          <button
            key={t.label}
            type="button"
            onClick={t.run}
            disabled={t.disabled}
            aria-label={t.label}
            aria-pressed={t.active}
            title={t.label}
            className={cn(
              "flex size-8 items-center justify-center rounded-md text-zinc-600 transition hover:bg-white hover:text-zinc-900 disabled:opacity-30",
              t.active && "bg-white text-brand shadow-xs ring-1 ring-zinc-200",
              i === 7 && "ml-auto",
            )}
          >
            <t.icon className="size-4" />
          </button>
        ))}
      </div>
      {editor ? <EditorContent editor={editor} /> : <div className="min-h-[220px] animate-pulse bg-zinc-50" />}
    </div>
  );
}
