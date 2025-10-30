import React, { useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Typography from '@tiptap/extension-typography';
import Bold from '@tiptap/extension-bold';
import Italic from '@tiptap/extension-italic';
import { Button } from '@/components/ui/button';
import { Bold as BoldIcon, Italic as ItalicIcon, Heading1, Heading2, Heading3, List, ListOrdered } from 'lucide-react';

interface MarkdownEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
}

export const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  content,
  onChange,
  placeholder = 'Text eingeben...',
  className = '',
}) => {
  const isUpdatingFromPropRef = useRef(false);
  const lastContentRef = useRef(content);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Typography,
      Bold,
      Italic,
    ],
    content: content || '',
    onUpdate: ({ editor }) => {
      // Prevent update loops - don't trigger onChange if we're updating from props
      if (isUpdatingFromPropRef.current) {
        return;
      }

      const html = editor.getHTML();
      
      // Convert HTML to markdown format with better handling
      let markdown = html
        // Handle nested formatting (strong inside p, em inside p, etc.)
        .replace(/<p><strong>(.*?)<\/strong><\/p>/g, '**$1**\n\n')
        .replace(/<p><em>(.*?)<\/em><\/p>/g, '*$1*\n\n')
        // Handle inline formatting
        .replace(/<strong>(.*?)<\/strong>/g, '**$1**')
        .replace(/<em>(.*?)<\/em>/g, '*$1*')
        // Handle headings
        .replace(/<h1>(.*?)<\/h1>/g, '# $1\n\n')
        .replace(/<h2>(.*?)<\/h2>/g, '## $1\n\n')
        .replace(/<h3>(.*?)<\/h3>/g, '### $1\n\n')
        // Handle lists
        .replace(/<ul>(.*?)<\/ul>/gs, (match, content) => {
          const items = content.replace(/<li><p>(.*?)<\/p><\/li>/g, '- $1\n').replace(/<li>(.*?)<\/li>/g, '- $1\n');
          return items + '\n';
        })
        .replace(/<ol>(.*?)<\/ol>/gs, (match, content) => {
          let index = 1;
          const items = content.replace(/<li><p>(.*?)<\/p><\/li>/g, () => `${index++}. $1\n`).replace(/<li>(.*?)<\/li>/g, () => `${index++}. $1\n`);
          return items + '\n';
        })
        // Handle paragraphs (after other replacements to avoid conflicts)
        .replace(/<p>(.*?)<\/p>/g, '$1\n\n')
        // Handle line breaks
        .replace(/<br\s*\/?>/g, '\n')
        // Clean up multiple newlines
        .replace(/\n{3,}/g, '\n\n')
        .trim();

      // Update the last content reference
      lastContentRef.current = markdown;
      
      // Call onChange immediately without debounce
      onChange(markdown);
    },
    immediatelyRender: false,
  });

  // Update editor content when prop changes
  useEffect(() => {
    if (editor && content !== undefined) {
      // Skip update if content hasn't actually changed (avoids loops)
      if (content === lastContentRef.current) {
        return;
      }

      const currentContent = editor.getHTML();
      
      // Convert markdown to HTML for display with improved parsing
      let html = content;
      
      // First, handle headings (must be done before paragraph processing)
      html = html
        .replace(/^### (.+)$/gm, '<h3>$1</h3>')
        .replace(/^## (.+)$/gm, '<h2>$1</h2>')
        .replace(/^# (.+)$/gm, '<h1>$1</h1>');
      
      // Handle lists
      html = html
        .replace(/^- (.+)$/gm, '<li>$1</li>')
        .replace(/(<li>.*?<\/li>\n?)+/gs, '<ul>$&</ul>')
        .replace(/^\d+\. (.+)$/gm, '<li>$1</li>');
      
      // Handle inline formatting (bold and italic)
      html = html
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>');
      
      // Split by double newlines to create paragraphs, but skip already formatted content
      const lines = html.split('\n\n');
      html = lines.map(line => {
        line = line.trim();
        // Don't wrap if already a block element
        if (!line || line.startsWith('<h') || line.startsWith('<ul') || line.startsWith('<ol')) {
          return line;
        }
        return `<p>${line}</p>`;
      }).filter(line => line).join('');

      if (currentContent !== html) {
        // Set flag to prevent onUpdate from firing
        isUpdatingFromPropRef.current = true;
        editor.commands.setContent(html, { emitUpdate: false });
        // Reset the flag immediately since emitUpdate is false
        isUpdatingFromPropRef.current = false;
        // Update last content reference
        lastContentRef.current = content;
      }
    }
  }, [content, editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className={`border rounded-lg overflow-hidden ${className}`}>
      {/* Toolbar */}
      <div className="bg-muted/50 border-b p-2 flex gap-1 flex-wrap">
        <Button
          type="button"
          variant={editor.isActive('bold') ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className="h-8 w-8 p-0"
        >
          <BoldIcon className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive('italic') ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className="h-8 w-8 p-0"
        >
          <ItalicIcon className="h-4 w-4" />
        </Button>
        <div className="w-px h-8 bg-border mx-1" />
        <Button
          type="button"
          variant={editor.isActive('heading', { level: 1 }) ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className="h-8 w-8 p-0"
        >
          <Heading1 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive('heading', { level: 2 }) ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className="h-8 w-8 p-0"
        >
          <Heading2 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive('heading', { level: 3 }) ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className="h-8 w-8 p-0"
        >
          <Heading3 className="h-4 w-4" />
        </Button>
        <div className="w-px h-8 bg-border mx-1" />
        <Button
          type="button"
          variant={editor.isActive('bulletList') ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className="h-8 w-8 p-0"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive('orderedList') ? 'default' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className="h-8 w-8 p-0"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
      </div>

      {/* Editor */}
      <EditorContent 
        editor={editor} 
        className="prose prose-sm max-w-none p-4 min-h-[120px] focus:outline-none"
      />
    </div>
  );
};
