import React from "react";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { StaffCombobox } from "../StaffCombobox";

export function StaffSection({ form, isLoading, language }) {
  return (
    <FormField
      control={form.control}
      name="staff_members"
      render={({ field }) => (
        <FormItem>
          <FormControl>
            <StaffCombobox
              value={field.value || []}
              onChange={field.onChange}
              disabled={isLoading}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}