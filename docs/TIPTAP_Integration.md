# TipTap Markdown Editor Integration

## Overview
The page builder uses TipTap for all text content blocks. Text is edited in a WYSIWYG surface and persisted as markdown so schema-driven content remains portable.

## Supported Formatting
- Bold via `**text**`
- Italic via `*text*`
- Headings via `#`, `##`, `###`
- Bullet and numbered lists
- Links via `[label](url)`

## Link Tool
The toolbar includes a link action for text selections.

1. Select the text inside the editor.
2. Click the link button.
3. Paste a URL.
4. Click `Link uebernehmen`.

Supported URL formats:
- `https://example.com`
- `http://example.com`
- `mailto:hello@example.com`
- `tel:+49123456789`
- `/internal-path`
- `#section-anchor`

If the user enters a bare hostname such as `example.com`, the editor stores it as `https://example.com`.

## Storage Format
Formatted content is stored as markdown in the existing text block `content` string.

Examples:
```md
**Bold text**
*Italic text*
# Heading 1
[Project docs](https://example.com/docs)
```

## Implementation Notes
- The shared editor lives in `src/components/pagebuilder/MarkdownEditor.tsx`.
- All pagebuilder text block editors reuse this component.
- The parser/serializer supports the markdown subset listed above, including inline links.
- The link toolbar uses TipTap's link extension and keeps storage compatible with existing markdown-based content blocks.