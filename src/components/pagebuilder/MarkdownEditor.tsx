import React, { useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Typography from '@tiptap/extension-typography';
import Bold from '@tiptap/extension-bold';
import Italic from '@tiptap/extension-italic';
import { Button } from '@/components/ui/button';
import { Bold as BoldIcon, Italic as ItalicIcon, Heading1, Heading2, Heading3, List, ListOrdered } from 'lucide-react';

interface TiptapMark {
  type: string;
}

interface TiptapNode {
  type: string;
  text?: string;
  attrs?: Record<string, unknown>;
  marks?: TiptapMark[];
  content?: TiptapNode[];
}

const escapeMarkdownText = (text: string): string => text;

const applyMarks = (text: string, marks?: TiptapMark[]): string => {
  if (!marks || marks.length === 0) {
    return text;
  }

  const hasBold = marks.some((mark) => mark.type === 'bold');
  const hasItalic = marks.some((mark) => mark.type === 'italic');
  let formatted = text;

  if (hasBold && hasItalic) {
    formatted = `***${formatted}***`;
  } else if (hasBold) {
    formatted = `**${formatted}**`;
  } else if (hasItalic) {
    formatted = `*${formatted}*`;
  }

  return formatted;
};

const serializeInlineContent = (nodes?: TiptapNode[]): string => {
  if (!nodes || nodes.length === 0) {
    return '';
  }

  return nodes
    .map((node) => {
      if (node.type === 'text') {
        return applyMarks(escapeMarkdownText(node.text || ''), node.marks);
      }

      if (node.type === 'hardBreak') {
        return '\n';
      }

      return serializeInlineContent(node.content);
    })
    .join('');
};

const serializeBlockNode = (node: TiptapNode, orderedListIndex = 0): string => {
  if (node.type === 'heading') {
    const level = Math.min(Math.max(Number(node.attrs?.level || 1), 1), 3);
    return `${'#'.repeat(level)} ${serializeInlineContent(node.content)}`.trimEnd();
  }

  if (node.type === 'paragraph') {
    return serializeInlineContent(node.content);
  }

  if (node.type === 'bulletList') {
    return (node.content || [])
      .map((item) => `- ${serializeListItem(item)}`.trimEnd())
      .join('\n');
  }

  if (node.type === 'orderedList') {
    return (node.content || [])
      .map((item, index) => `${orderedListIndex + index + 1}. ${serializeListItem(item)}`.trimEnd())
      .join('\n');
  }

  if (node.type === 'listItem') {
    return serializeListItem(node);
  }

  return serializeInlineContent(node.content);
};

const serializeListItem = (node: TiptapNode): string => {
  const blocks = node.content || [];
  const segments = blocks
    .map((child) => {
      if (child.type === 'paragraph') {
        return serializeInlineContent(child.content);
      }
      return serializeBlockNode(child);
    })
    .filter(Boolean);

  return segments.join('\n');
};

const serializeDocumentToMarkdown = (doc?: TiptapNode): string => {
  const content = doc?.content || [];
  const blocks = content
    .map((node) => serializeBlockNode(node))
    .filter((block) => block.trim().length > 0);

  return blocks.join('\n\n').trim();
};

const createTextNode = (text: string, marks?: TiptapMark[]): TiptapNode => ({
  type: 'text',
  text,
  ...(marks && marks.length > 0 ? { marks } : {}),
});

const parseInlineMarkdown = (input: string): TiptapNode[] => {
  const nodes: TiptapNode[] = [];
  const pattern = /(\*\*\*[^*]+\*\*\*|\*\*[^*]+\*\*|\*[^*]+\*)/g;
  const segments = input.split('\n');

  segments.forEach((segment, segmentIndex) => {
    let cursor = 0;
    let match: RegExpExecArray | null;

    pattern.lastIndex = 0;
    while ((match = pattern.exec(segment)) !== null) {
      if (match.index > cursor) {
        nodes.push(createTextNode(segment.slice(cursor, match.index)));
      }

      const token = match[0];
      if (token.startsWith('***') && token.endsWith('***')) {
        nodes.push(createTextNode(token.slice(3, -3), [{ type: 'bold' }, { type: 'italic' }]));
      } else if (token.startsWith('**') && token.endsWith('**')) {
        nodes.push(createTextNode(token.slice(2, -2), [{ type: 'bold' }]));
      } else if (token.startsWith('*') && token.endsWith('*')) {
        nodes.push(createTextNode(token.slice(1, -1), [{ type: 'italic' }]));
      }

      cursor = match.index + token.length;
    }

    if (cursor < segment.length) {
      nodes.push(createTextNode(segment.slice(cursor)));
    }

    if (segmentIndex < segments.length - 1) {
      nodes.push({ type: 'hardBreak' });
    }
  });

  return nodes;
};

const parseParagraph = (markdown: string): TiptapNode => ({
  type: 'paragraph',
  content: parseInlineMarkdown(markdown),
});

const parseList = (lines: string[], ordered: boolean): TiptapNode => ({
  type: ordered ? 'orderedList' : 'bulletList',
  content: lines.map((line) => ({
    type: 'listItem',
    content: [
      parseParagraph(line.replace(ordered ? /^\d+\.\s+/ : /^-\s+/, '')),
    ],
  })),
});

const parseMarkdownToDocument = (markdown: string): TiptapNode => {
  const normalized = markdown.replace(/\r\n/g, '\n').trim();
  if (!normalized) {
    return {
      type: 'doc',
      content: [{ type: 'paragraph' }],
    };
  }

  const lines = normalized.split('\n');
  const content: TiptapNode[] = [];

  for (let index = 0; index < lines.length;) {
    const line = lines[index];

    if (line.trim() === '') {
      index += 1;
      continue;
    }

    const headingMatch = line.match(/^(#{1,3})\s+(.*)$/);
    if (headingMatch) {
      content.push({
        type: 'heading',
        attrs: { level: headingMatch[1].length },
        content: parseInlineMarkdown(headingMatch[2]),
      });
      index += 1;
      continue;
    }

    if (/^-\s+/.test(line)) {
      const listLines: string[] = [];
      while (index < lines.length && /^-\s+/.test(lines[index])) {
        listLines.push(lines[index]);
        index += 1;
      }
      content.push(parseList(listLines, false));
      continue;
    }

    if (/^\d+\.\s+/.test(line)) {
      const listLines: string[] = [];
      while (index < lines.length && /^\d+\.\s+/.test(lines[index])) {
        listLines.push(lines[index]);
        index += 1;
      }
      content.push(parseList(listLines, true));
      continue;
    }

    const paragraphLines: string[] = [];
    while (
      index < lines.length &&
      lines[index].trim() !== '' &&
      !/^(#{1,3})\s+/.test(lines[index]) &&
      !/^-\s+/.test(lines[index]) &&
      !/^\d+\.\s+/.test(lines[index])
    ) {
      paragraphLines.push(lines[index]);
      index += 1;
    }

    content.push(parseParagraph(paragraphLines.join('\n')));
  }

  return { type: 'doc', content };
};

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
    content: parseMarkdownToDocument(content || ''),
    onUpdate: ({ editor }) => {
      // Prevent update loops - don't trigger onChange if we're updating from props
      if (isUpdatingFromPropRef.current) {
        return;
      }

      const markdown = serializeDocumentToMarkdown(editor.getJSON() as TiptapNode);

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

      const nextDoc = parseMarkdownToDocument(content);
      const currentMarkdown = serializeDocumentToMarkdown(editor.getJSON() as TiptapNode);

      if (currentMarkdown !== content) {
        // Set flag to prevent onUpdate from firing
        isUpdatingFromPropRef.current = true;
        editor.commands.setContent(nextDoc, { emitUpdate: false });
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
