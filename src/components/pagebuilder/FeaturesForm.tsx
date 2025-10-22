import React from 'react';
import { useFormContext, useFieldArray } from 'react-hook-form';
import { PageBuilderData } from '@/types/pagebuilder';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface FeaturesFormProps {
  form: ReturnType<typeof useFormContext<PageBuilderData>>;
}

export const FeaturesForm: React.FC<FeaturesFormProps> = ({ form }) => {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'features',
  });

  return (
    <div className="space-y-4 p-4 border rounded-lg">
      <h2 className="text-2xl font-bold">Features Section</h2>
      {fields.map((field, index) => (
        <div key={field.id} className="space-y-2 p-2 border-b">
          <div>
            <Label>Title</Label>
            <Input {...form.register(`features.${index}.title`)} />
          </div>
          <div>
            <Label>Description</Label>
            <Input {...form.register(`features.${index}.description`)} />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id={`features.${index}.reverse`} {...form.register(`features.${index}.reverse`)} />
            <Label htmlFor={`features.${index}.reverse`}>Reverse Layout</Label>
          </div>
          <Button type="button" onClick={() => remove(index)}>Remove Feature</Button>
        </div>
      ))}
      <Button type="button" onClick={() => append({ title: '', description: '', reverse: false })}>Add Feature</Button>
    </div>
  );
};
