import React from 'react';
import { ContentBlock } from '@/types/pagebuilder';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ImageUploader } from './ImageUploader';
import { Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface ContentBlockEditorProps {
  block: ContentBlock;
  path: string;
  onRemove: () => void;
  form: any;
}

export const ContentBlockEditor: React.FC<ContentBlockEditorProps> = ({
  block,
  path,
  onRemove,
  form,
}) => {
  return (
    <Card className="p-4 space-y-4 bg-muted/30">
      <div className="flex justify-between items-center">
        <Label className="text-base font-semibold flex items-center space-x-2">
          <span className="text-muted-foreground">
            {block.type === 'text' && '📝'}
            {block.type === 'image' && '🖼️'}
            {block.type === 'quote' && '💬'}
            {block.type === 'list' && '📋'}
            {block.type === 'video' && '🎥'}
          </span>
          <span>
            {block.type === 'text' && 'Text Block'}
            {block.type === 'image' && 'Image Block'}
            {block.type === 'quote' && 'Quote Block'}
            {block.type === 'list' && 'List Block'}
            {block.type === 'video' && 'Video Block'}
          </span>
        </Label>
        <Button type="button" variant="destructive" size="sm" onClick={onRemove}>
          <Trash2 className="h-4 w-4 mr-1" />
          Entfernen
        </Button>
      </div>

      {block.type === 'text' && (
        <>
          <div>
            <Label className="text-sm">Content</Label>
            <Textarea {...form.register(`${path}.content`)} rows={4} />
          </div>
          <div>
            <Label className="text-sm">Format</Label>
            <Select
              value={form.watch(`${path}.format`) || 'paragraph'}
              onValueChange={(value) => form.setValue(`${path}.format`, value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="paragraph">Paragraph</SelectItem>
                <SelectItem value="heading1">Heading 1</SelectItem>
                <SelectItem value="heading2">Heading 2</SelectItem>
                <SelectItem value="heading3">Heading 3</SelectItem>
                <SelectItem value="bold">Bold</SelectItem>
                <SelectItem value="italic">Italic</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </>
      )}

      {block.type === 'image' && (
        <>
          <div className="space-y-4">
            {/* Preview if image exists */}
            {form.watch(`${path}.src`) && (
              <div className="relative">
                <img
                  src={form.watch(`${path}.src`)}
                  alt={form.watch(`${path}.alt`) || 'Preview'}
                  className="max-h-48 rounded-lg border object-contain w-full"
                />
              </div>
            )}

            {/* Image URL Input with Uploader */}
            <div>
              <Label className="text-sm">Bild-URL</Label>
              <ImageUploader
                value={form.watch(`${path}.src`)}
                onChange={(url) => form.setValue(`${path}.src`, url)}
                bucket="booking_media"
                folder="product-images"
              />
            </div>
          </div>

          <div>
            <Label className="text-sm">Alt-Text</Label>
            <Input {...form.register(`${path}.alt`)} placeholder="Beschreibung für Barrierefreiheit" />
          </div>
          <div>
            <Label className="text-sm">Bildunterschrift (Optional)</Label>
            <Input {...form.register(`${path}.caption`)} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-sm">Breite (Optional)</Label>
              <Input
                type="number"
                {...form.register(`${path}.width`, { valueAsNumber: true })}
                placeholder="px"
              />
            </div>
            <div>
              <Label className="text-sm">Höhe (Optional)</Label>
              <Input
                type="number"
                {...form.register(`${path}.height`, { valueAsNumber: true })}
                placeholder="px"
              />
            </div>
          </div>
        </>
      )}

      {block.type === 'quote' && (
        <>
          <div>
            <Label className="text-sm">Quote Text</Label>
            <Textarea {...form.register(`${path}.text`)} rows={3} />
          </div>
          <div>
            <Label className="text-sm">Author (Optional)</Label>
            <Input {...form.register(`${path}.author`)} />
          </div>
          <div>
            <Label className="text-sm">Source (Optional)</Label>
            <Input {...form.register(`${path}.source`)} />
          </div>
        </>
      )}

      {block.type === 'list' && (
        <>
          <div>
            <Label className="text-sm">List Style</Label>
            <Select
              value={form.watch(`${path}.style`) || 'unordered'}
              onValueChange={(value) => form.setValue(`${path}.style`, value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ordered">Ordered (1, 2, 3...)</SelectItem>
                <SelectItem value="unordered">Unordered (bullets)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-sm">List Items (one per line)</Label>
            <Textarea
              {...form.register(`${path}.items`)}
              rows={5}
              placeholder="Item 1&#10;Item 2&#10;Item 3"
              onChange={(e) => {
                const items = e.target.value.split('\n').filter((item) => item.trim());
                form.setValue(`${path}.items`, items);
              }}
            />
          </div>
        </>
      )}

      {block.type === 'video' && (
        <>
          <div>
            <Label className="text-sm">Video URL</Label>
            <Input {...form.register(`${path}.src`)} placeholder="YouTube or Vimeo embed URL" />
          </div>
          <div>
            <Label className="text-sm">Provider</Label>
            <Select
              value={form.watch(`${path}.provider`) || 'youtube'}
              onValueChange={(value) => form.setValue(`${path}.provider`, value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="youtube">YouTube</SelectItem>
                <SelectItem value="vimeo">Vimeo</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-sm">Caption (Optional)</Label>
            <Input {...form.register(`${path}.caption`)} />
          </div>
        </>
      )}
    </Card>
  );
};
