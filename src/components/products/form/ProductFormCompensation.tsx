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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface ProductFormCompensationProps {
  form: UseFormReturn<ProductFormValues>;
}

export function ProductFormCompensation({ form }: ProductFormCompensationProps) {
  const { language } = useTheme();
  const salaryType = form.watch('salary_type');
  
  return (
    <>
      <FormField
        control={form.control}
        name="salary_type"
        render={({ field }) => (
          <FormItem className="bg-background/80 p-5 rounded-md space-y-3">
            <fieldset>
              <legend className="text-lg font-medium">
                <span lang={language === 'en' ? 'en' : 'de'}>
                  {language === 'en' ? 'Compensation Type' : 'Vergütungsart'}
                </span>
              </legend>
              <FormDescription className="text-base">
                <span lang={language === 'en' ? 'en' : 'de'}>
                  {language === 'en' 
                    ? 'Select the compensation type for this product' 
                    : 'Wählen Sie die Vergütungsart für dieses Produkt'}
                </span>
              </FormDescription>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  value={field.value}
                  className="flex flex-col space-y-2"
                  aria-labelledby="compensation-type-legend"
                >
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="Standard" id="salary-standard" className="h-5 w-5" />
                    </FormControl>
                    <FormLabel htmlFor="salary-standard" className="font-normal text-lg cursor-pointer">
                      <span lang={language === 'en' ? 'en' : 'de'}>
                        {language === 'en' ? 'Standard' : 'Standard'}
                      </span>
                    </FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="Fixpreis" id="salary-fixed" className="h-5 w-5" />
                    </FormControl>
                    <FormLabel htmlFor="salary-fixed" className="font-normal text-lg cursor-pointer">
                      <span lang={language === 'en' ? 'en' : 'de'}>
                        {language === 'en' ? 'Fixed Price' : 'Fixpreis'}
                      </span>
                    </FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="Stundensatz" id="salary-hourly" className="h-5 w-5" />
                    </FormControl>
                    <FormLabel htmlFor="salary-hourly" className="font-normal text-lg cursor-pointer">
                      <span lang={language === 'en' ? 'en' : 'de'}>
                        {language === 'en' ? 'Hourly Rate' : 'Stundensatz'}
                      </span>
                    </FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
            </fieldset>
            <FormMessage className="text-base" />
          </FormItem>
        )}
      />
      
      {/* Salary - Only show when salary_type is not Standard */}
      {salaryType && salaryType !== 'Standard' && (
        <FormField
          control={form.control}
          name="salary"
          render={({ field }) => (
            <FormItem className="bg-background/80 p-5 rounded-md">
              <FormLabel htmlFor="salary-amount" className="text-lg">
                <span lang={language === 'en' ? 'en' : 'de'}>
                  {language === 'en' 
                    ? salaryType === 'Fixpreis' 
                      ? 'Fixed Price (€)' 
                      : 'Hourly Rate (€)'
                    : salaryType === 'Fixpreis' 
                      ? 'Fixpreis (€)' 
                      : 'Stundensatz (€)'}
                </span>
              </FormLabel>
              <FormControl>
                <Input
                  id="salary-amount"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder={language === 'en' ? 'Enter amount' : 'Betrag eingeben'}
                  {...field}
                  className="text-lg h-12"
                  value={field.value === null || field.value === undefined ? '' : field.value}
                  onChange={(e) => {
                    const valueStr = e.target.value;
                    if (valueStr === '') {
                      field.onChange(undefined);
                    } else {
                      const parsed = parseFloat(valueStr);
                      field.onChange(isNaN(parsed) ? undefined : parsed);
                    }
                  }}
                  aria-describedby="salary-amount-help"
                />
              </FormControl>
              <FormMessage className="text-base" />
            </FormItem>
          )}
        />
      )}
    </>
  );
}