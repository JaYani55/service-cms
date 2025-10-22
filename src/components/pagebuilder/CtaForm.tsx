import React from 'react';
import { useFormContext } from 'react-hook-form';
import { PageBuilderData } from '@/types/pagebuilder';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface CtaFormProps {
  form: ReturnType<typeof useFormContext<PageBuilderData>>;
}

export const CtaForm: React.FC<CtaFormProps> = ({ form }) => {
  return (
    <div className="space-y-4 p-4 border rounded-lg">
      <h2 className="text-2xl font-bold">CTA Section</h2>
      <div>
        <Label>Title</Label>
        <Input {...form.register('cta.title')} />
      </div>
      <div>
        <Label>Description</Label>
        <Input {...form.register('cta.description')} />
      </div>
      <div>
        <Label>Primary Button Text</Label>
        <Input {...form.register('cta.primaryButton')} />
      </div>
    </div>
  );
};
