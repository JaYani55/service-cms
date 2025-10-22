import React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { PageBuilderData } from '@/types/pagebuilder';
import { CtaForm } from './CtaForm';
import { FaqForm } from './FaqForm';
import { HeroForm } from './HeroForm';
import { CardsForm } from './CardsForm';
import { FeaturesForm } from './FeaturesForm';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { saveProductPage } from '@/services/productPageService';
import { toast } from 'sonner';

const PageBuilderSchema = z.object({
  cta: z.object({
    title: z.string(),
    description: z.string(),
    primaryButton: z.string(),
  }),
  faq: z.array(z.object({
    question: z.string(),
    answer: z.string(),
  })),
  hero: z.object({
    image: z.string(),
    stats: z.array(z.object({
      label: z.string(),
      value: z.string(),
    })),
    title: z.string(),
    description: z.string(),
  }),
  cards: z.array(z.object({
    icon: z.string(),
    color: z.string(),
    items: z.array(z.string()),
    title: z.string(),
    description: z.string(),
  })),
  features: z.array(z.object({
    title: z.string(),
    description: z.string(),
    reverse: z.boolean().optional(),
  })),
  subtitle: z.string().optional(),
  'trainer-module': z.boolean().optional(),
});

interface PageBuilderFormProps {
  initialData?: PageBuilderData | null;
  productId?: string;
  productName?: string;
}

export const PageBuilderForm: React.FC<PageBuilderFormProps> = ({ initialData, productId, productName }) => {
  const form = useForm<PageBuilderData>({
    resolver: zodResolver(PageBuilderSchema),
    defaultValues: initialData || {
      cta: { title: '', description: '', primaryButton: '' },
      faq: [],
      hero: { image: '', stats: [], title: '', description: '' },
      cards: [],
      features: [],
      subtitle: '',
      'trainer-module': false,
    },
  });

  const onSubmit = async (data: PageBuilderData) => {
    if (!productId || !productName) {
        toast.error('Product ID or name is missing.');
        return;
    }
    try {
        await saveProductPage(productId, data, productName);
        toast.success('Product page saved successfully!');
    } catch (error: any) {
        toast.error(`Failed to save product page: ${error.message}`);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <HeroForm form={form} />
        <CtaForm form={form} />
        <FaqForm form={form} />
        <CardsForm form={form} />
        <FeaturesForm form={form} />

        <div className="space-y-4 p-4 border rounded-lg">
            <h2 className="text-2xl font-bold">General</h2>
            <div>
                <Label>Subtitle</Label>
                <Input {...form.register('subtitle')} />
            </div>
            <div className="flex items-center space-x-2">
                <Checkbox id="trainer-module" {...form.register('trainer-module')} />
                <Label htmlFor="trainer-module">Trainer Module</Label>
            </div>
        </div>


        <Button type="submit">Submit Preview</Button>
      </form>
    </Form>
  );
};
