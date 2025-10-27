import React from 'react';
import { useFormContext, useFieldArray } from 'react-hook-form';
import { PageBuilderData } from '@/types/pagebuilder';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Plus, Trash2, LayoutGrid } from 'lucide-react';

interface CardsFormProps {
  form: ReturnType<typeof useFormContext<PageBuilderData>>;
}

export const CardsForm: React.FC<CardsFormProps> = ({ form }) => {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'cards',
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <span>🎴</span>
          <span>Cards Section</span>
        </CardTitle>
        <CardDescription>
          Präsentieren Sie Informationen in übersichtlichen Karten
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-end">
          <Button
            type="button"
            size="sm"
            onClick={() => append({ icon: 'Clock', color: 'primary', items: [], title: '', description: '' })}
          >
            <Plus className="h-4 w-4 mr-2" />
            Karte hinzufügen
          </Button>
        </div>

        <Accordion type="multiple" className="w-full">
          {fields.map((field, index) => (
            <AccordionItem key={field.id} value={`card-${index}`} className="border rounded-lg mb-2 px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center space-x-2 text-left">
                  <LayoutGrid className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="font-medium">
                    {form.watch(`cards.${index}.title`) || `Karte ${index + 1}`}
                  </span>
                  <Badge variant="secondary">{form.watch(`cards.${index}.color`)}</Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="font-semibold">Titel</Label>
                      <Input
                        {...form.register(`cards.${index}.title`)}
                        placeholder="Kartentitel"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-semibold">Beschreibung</Label>
                      <Input
                        {...form.register(`cards.${index}.description`)}
                        placeholder="Kurzbeschreibung"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="font-semibold">Icon</Label>
                      <Input
                        {...form.register(`cards.${index}.icon`)}
                        placeholder="z.B. Clock, Lightbulb"
                      />
                      <p className="text-xs text-muted-foreground">Lucide Icon Name</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="font-semibold">Farbe</Label>
                      <Input
                        {...form.register(`cards.${index}.color`)}
                        placeholder="z.B. primary, secondary"
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label className="font-semibold">Listenelemente</Label>
                    <Textarea
                      {...form.register(`cards.${index}.items`)}
                      placeholder="Ein Element pro Zeile..."
                      rows={6}
                      className="resize-none font-mono text-sm"
                      onChange={(e) => {
                        const items = e.target.value.split('\n').filter(item => item.trim());
                        form.setValue(`cards.${index}.items`, items);
                      }}
                    />
                    <p className="text-xs text-muted-foreground">
                      Jedes Element in einer neuen Zeile eingeben
                    </p>
                  </div>

                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => remove(index)}
                    className="w-full"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Karte entfernen
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        {fields.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <LayoutGrid className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Noch keine Karten hinzugefügt</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
