import React from "react";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { CompanyCombobox } from "../CompanyCombobox";

export function CompanySection({ form, isLoading, language }) {
  return (
    <FormField
      control={form.control}
      name="employer_id"
      render={({ field }) => (
        <FormItem>
          <FormControl>
            <CompanyCombobox
              value={field.value}
              onChange={(id, name) => {
                field.onChange(id);
                form.setValue("company", name);
              }}
              disabled={isLoading}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}