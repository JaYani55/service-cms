import React from 'react';
import { useFormContext, useFieldArray } from 'react-hook-form';
import { PageBuilderData } from '@/types/pagebuilder';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

interface HeroFormProps {
  form: ReturnType<typeof useFormContext<PageBuilderData>>;
}

export const HeroForm: React.FC<HeroFormProps> = ({ form }) => {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'hero.stats',
  });

  return (
    <div className="space-y-4 p-4 border rounded-lg">
      <h2 className="text-2xl font-bold">Hero Section</h2>
      <div>
        <Label>Title</Label>
        <Input {...form.register('hero.title')} />
      </div>
      <div>
        <Label>Description</Label>
        <Input {...form.register('hero.description')} />
      </div>
      <div>
        <Label>Image URL</Label>
        <Input {...form.register('hero.image')} />
      </div>
      <div>
        <h3 className="text-lg font-semibold">Stats</h3>
        {fields.map((field, index) => (
          <div key={field.id} className="flex items-center space-x-2">
            <Input {...form.register(`hero.stats.${index}.label`)} placeholder="Label" />
            <Input {...form.register(`hero.stats.${index}.value`)} placeholder="Value" />
            <Button type="button" onClick={() => remove(index)}>Remove</Button>
          </div>
        ))}
        <Button type="button" onClick={() => append({ label: '', value: '' })}>Add Stat</Button>
      </div>
    </div>
  );
};
