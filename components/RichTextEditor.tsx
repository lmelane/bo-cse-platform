'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import { Bold, Italic, List, ListOrdered, Link2, Heading1, Heading2 } from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export default function RichTextEditor({ value, onChange }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
      }),
    ],
    content: value,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[200px] px-4 py-3',
      },
    },
  });

  if (!editor) {
    return null;
  }

  const setLink = () => {
    const url = window.prompt('URL');
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  return (
    <div className="border border-neutral-300 rounded-lg overflow-hidden bg-white">
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 border-b border-neutral-200 bg-neutral-50 flex-wrap">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`p-2 rounded hover:bg-neutral-200 ${editor.isActive('heading', { level: 1 }) ? 'bg-neutral-300' : ''}`}
          title="Titre 1"
        >
          <Heading1 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`p-2 rounded hover:bg-neutral-200 ${editor.isActive('heading', { level: 2 }) ? 'bg-neutral-300' : ''}`}
          title="Titre 2"
        >
          <Heading2 className="w-4 h-4" />
        </button>
        <div className="w-px h-6 bg-neutral-300 mx-1" />
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-2 rounded hover:bg-neutral-200 ${editor.isActive('bold') ? 'bg-neutral-300' : ''}`}
          title="Gras"
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-2 rounded hover:bg-neutral-200 ${editor.isActive('italic') ? 'bg-neutral-300' : ''}`}
          title="Italique"
        >
          <Italic className="w-4 h-4" />
        </button>
        <div className="w-px h-6 bg-neutral-300 mx-1" />
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-2 rounded hover:bg-neutral-200 ${editor.isActive('bulletList') ? 'bg-neutral-300' : ''}`}
          title="Liste à puces"
        >
          <List className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-2 rounded hover:bg-neutral-200 ${editor.isActive('orderedList') ? 'bg-neutral-300' : ''}`}
          title="Liste numérotée"
        >
          <ListOrdered className="w-4 h-4" />
        </button>
        <div className="w-px h-6 bg-neutral-300 mx-1" />
        <button
          type="button"
          onClick={setLink}
          className={`p-2 rounded hover:bg-neutral-200 ${editor.isActive('link') ? 'bg-neutral-300' : ''}`}
          title="Lien"
        >
          <Link2 className="w-4 h-4" />
        </button>
      </div>
      
      {/* Editor */}
      <EditorContent editor={editor} />
    </div>
  );
}
