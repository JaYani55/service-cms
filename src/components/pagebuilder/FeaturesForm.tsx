import React from 'react';
import { useFormContext, useFieldArray } from 'react-hook-form';
import { PageBuilderData, ContentBlock } from '@/types/pagebuilder';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Plus, Trash2, Star, ArrowLeftRight } from 'lucide-react';

interface FeaturesFormProps {
  form: ReturnType<typeof useFormContext<PageBuilderData>>;
}

export const FeaturesForm: React.FC<FeaturesFormProps> = ({ form }) => {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'features',
  });

  const generateBlockId = (prefix: string) => {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <span>⭐</span>
          <span>Features Section</span>
        </CardTitle>
        <CardDescription>
          Heben Sie die wichtigsten Produktmerkmale hervor
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-end">
          <Button
            type="button"
            size="sm"
            onClick={() =>
              append({
                title: '',
                description: [
                  {
                    id: generateBlockId('feature-desc'),
                    type: 'text',
                    content: '',
                    format: 'paragraph',
                  } as ContentBlock,
                ],
                reverse: false,
              })
            }
          >
            <Plus className="h-4 w-4 mr-2" />
            Feature hinzufügen
          </Button>
        </div>

        <Accordion type="multiple" className="w-full">
          {fields.map((field, index) => (
            <AccordionItem key={field.id} value={`feature-${index}`} className="border rounded-lg mb-2 px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center space-x-2 text-left flex-1">
                  <Star className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="font-medium flex-1">
                    {form.watch(`features.${index}.title`) || `Feature ${index + 1}`}
                  </span>
                  {form.watch(`features.${index}.reverse`) && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <ArrowLeftRight className="h-3 w-3" />
                      Reverse
                    </Badge>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label className="font-semibold">Feature Titel</Label>
                    <Input
                      {...form.register(`features.${index}.title`)}
                      placeholder="z.B. Begegnung auf Augenhöhe"
                    />
                  </div>

                  <div className="flex items-center space-x-2 p-3 border rounded-lg bg-muted/30">
                    <Checkbox
                      id={`features.${index}.reverse`}
                      checked={form.watch(`features.${index}.reverse`) || false}
                      onCheckedChange={(checked) =>
                        form.setValue(`features.${index}.reverse`, checked as boolean)
                      }
                    />
                    <Label htmlFor={`features.${index}.reverse`} className="cursor-pointer">
                      Layout umkehren (Bild/Text Position tauschen)
                    </Label>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label className="font-semibold">Beschreibung</Label>
                    <FeatureDescriptionBlocks featureIndex={index} form={form} />
                  </div>

                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => remove(index)}
                    className="w-full"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Feature entfernen
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        {fields.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Star className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Noch keine Features hinzugefügt</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const FeatureDescriptionBlocks: React.FC<{ featureIndex: number; form: any }> = ({
  featureIndex,
  form,
}) => {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: `features.${featureIndex}.description`,
  });

  const generateBlockId = (prefix: string) => {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  return (
    <div className="space-y-3">
      {fields.map((field, blockIndex) => {
        const block = form.watch(`features.${featureIndex}.description.${blockIndex}`) as ContentBlock;
        return (
          <Card key={field.id} className="border-dashed">
            <CardContent className="pt-4 space-y-3">
              <div className="flex justify-between items-start">
                <Badge variant="outline">{block.type}</Badge>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => remove(blockIndex)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>

              {block.type === 'text' && (
                <>
                  <Textarea
                    {...form.register(`features.${featureIndex}.description.${blockIndex}.content`)}
                    placeholder="Beschreibungstext eingeben..."
                    rows={4}
                    className="resize-none"
                  />
                  <Select
                    value={
                      form.watch(`features.${featureIndex}.description.${blockIndex}.format`) ||
                      'paragraph'
                    }
                    onValueChange={(value) =>
                      form.setValue(
                        `features.${featureIndex}.description.${blockIndex}.format`,
                        value as any
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="paragraph">Paragraph</SelectItem>
                      <SelectItem value="heading1">Überschrift 1</SelectItem>
                      <SelectItem value="heading2">Überschrift 2</SelectItem>
                      <SelectItem value="heading3">Überschrift 3</SelectItem>
                      <SelectItem value="bold">Fett</SelectItem>
                      <SelectItem value="italic">Kursiv</SelectItem>
                    </SelectContent>
                  </Select>
                </>
              )}
            </CardContent>
          </Card>
        );
      })}
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() =>
          append({
            id: generateBlockId(`feature${featureIndex}-block`),
            type: 'text',
            content: '',
            format: 'paragraph',
          } as ContentBlock)
        }
        className="w-full"
      >
        <Plus className="h-4 w-4 mr-2" />
        Beschreibungs-Block hinzufügen
      </Button>
    </div>
  );
};
