import React from 'react';
import { useFormContext, useFieldArray } from 'react-hook-form';
import { PageBuilderData } from '@/types/pagebuilder';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

interface FaqFormProps {
  form: ReturnType<typeof useFormContext<PageBuilderData>>;
}

export const FaqForm: React.FC<FaqFormProps> = ({ form }) => {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'faq',
  });

  return (
    <div className="space-y-4 p-4 border rounded-lg">
      <h2 className="text-2xl font-bold">FAQ Section</h2>
      {fields.map((field, index) => (
        <div key={field.id} className="space-y-2 p-2 border-b">
          <div>
            <Label>Question</Label>
            <Input {...form.register(`faq.${index}.question`)} />
          </div>
          <div>
            <Label>Answer</Label>
            <Input {...form.register(`faq.${index}.answer`)} />
          </div>
          <Button type="button" onClick={() => remove(index)}>Remove FAQ</Button>
        </div>
      ))}
      <Button type="button" onClick={() => append({ question: '', answer: '' })}>Add FAQ</Button>
    </div>
  );
};
