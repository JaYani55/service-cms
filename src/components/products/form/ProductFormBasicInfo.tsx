import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { ProductFormValues } from '../types';
import { useTheme } from '@/contexts/ThemeContext';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface ProductFormBasicInfoProps {
  form: UseFormReturn<ProductFormValues>;
}

export function ProductFormBasicInfo({ form }: ProductFormBasicInfoProps) {
  const { language } = useTheme();
  
  return (
    <div className="bg-muted/30 p-6 rounded-lg border border-border/50 space-y-6">
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel htmlFor="product-name" className="text-lg">
              <span lang={language === 'en' ? 'en' : 'de'}>
                {language === 'en' ? 'Title' : 'Titel'}
              </span>
              <span className="text-red-500" aria-label={language === 'en' ? 'required' : 'erforderlich'}>*</span>
            </FormLabel>
            <FormControl>
              <Input 
                id="product-name"
                placeholder={language === 'en' ? 'Enter Product name' : 'Produktname eingeben'} 
                {...field} 
                className="text-lg h-12"
                aria-required="true"
              />
            </FormControl>
            <FormMessage className="text-base" />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="description_de"
        render={({ field }) => (
          <FormItem>
            <FormLabel htmlFor="product-description" className="text-lg">
              <span lang={language === 'en' ? 'en' : 'de'}>
                {language === 'en' ? 'Description' : 'Beschreibung'}
              </span>
              <span className="text-red-500" aria-label={language === 'en' ? 'required' : 'erforderlich'}>*</span>
            </FormLabel>
            <FormControl>
              <Textarea 
                id="product-description"
                placeholder={language === 'en' ? 'Enter description' : 'Beschreibung eingeben'} 
                {...field}
                className="text-lg min-h-[120px] resize-y"
                aria-required="true"
              />
            </FormControl>
            <FormMessage className="text-base" />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="description_effort"
        render={({ field }) => (
          <FormItem>
            <FormLabel htmlFor="effort-description" className="text-lg">
              <span lang={language === 'en' ? 'en' : 'de'}>
                {language === 'en' ? 'Effort Description' : 'Aufwandsbeschreibung'}
              </span>
            </FormLabel>
            <FormDescription className="text-base">
              <span lang={language === 'en' ? 'en' : 'de'}>
                {language === 'en' 
                  ? 'Describe the effort required for this product' 
                  : 'Beschreiben Sie den Aufwand für dieses Produkt'}
              </span>
            </FormDescription>
            <FormControl>
              <Textarea 
                id="effort-description"
                placeholder={language === 'en' ? 'Enter effort description' : 'Aufwandsbeschreibung eingeben'} 
                {...field}
                className="text-lg min-h-[100px] resize-y"
                aria-describedby="effort-description-help"
              />
            </FormControl>
            <FormMessage className="text-base" />
          </FormItem>
        )}
      />
    </div>
  );
}