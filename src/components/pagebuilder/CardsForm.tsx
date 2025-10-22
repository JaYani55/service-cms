import React from 'react';
import { useFormContext, useFieldArray } from 'react-hook-form';
import { PageBuilderData } from '@/types/pagebuilder';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

interface CardsFormProps {
  form: ReturnType<typeof useFormContext<PageBuilderData>>;
}

export const CardsForm: React.FC<CardsFormProps> = ({ form }) => {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'cards',
  });

  return (
    <div className="space-y-4 p-4 border rounded-lg">
      <h2 className="text-2xl font-bold">Cards Section</h2>
      {fields.map((field, index) => (
        <div key={field.id} className="space-y-2 p-2 border-b">
          <div>
            <Label>Title</Label>
            <Input {...form.register(`cards.${index}.title`)} />
          </div>
          <div>
            <Label>Description</Label>
            <Input {...form.register(`cards.${index}.description`)} />
          </div>
          <div>
            <Label>Icon</Label>
            <Input {...form.register(`cards.${index}.icon`)} />
          </div>
          <div>
            <Label>Color</Label>
            <Input {...form.register(`cards.${index}.color`)} />
          </div>
          <div>
            <Label>Items (comma separated)</Label>
            <Input 
              {...form.register(`cards.${index}.items`)} 
              onChange={(e) => {
                const items = e.target.value.split(',').map(item => item.trim());
                form.setValue(`cards.${index}.items`, items);
              }}
            />
          </div>
          <Button type="button" onClick={() => remove(index)}>Remove Card</Button>
        </div>
      ))}
      <Button type="button" onClick={() => append({ icon: '', color: '', items: [], title: '', description: '' })}>Add Card</Button>
    </div>
  );
};
