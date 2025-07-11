import React from "react";
import { FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ProductApprovedMentorSelector } from "../ProductApprovedMentorSelector";

export function ProductApprovedMentorSelectSection({ form, selectedProduct, approvedMentorNames, isLoading, language }) {
  if (!selectedProduct) return null;
  if (approvedMentorNames.length === 0) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        {language === "en"
          ? "No approved mentors for this product. Please assign mentors in the product settings."
          : "Keine freigegebenen MentorInnen für dieses Produkt. Bitte weisen Sie MentorInnen in den Produkteinstellungen zu."}
      </div>
    );
  }

  // Memoize the array so it doesn't change on every render
  const approvedMentorIds = React.useMemo(
    () => approvedMentorNames.map(m => m.id),
    [approvedMentorNames]
  );

  return (
    <FormField
      control={form.control}
      name="initial_selected_mentors"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="mt-6 mb-2 block text-base font-semibold">
            {language === "en" ? "Select Approved Mentors" : "Freigegebene Mentoren auswählen"}
          </FormLabel>
          <ProductApprovedMentorSelector
            approvedMentorIds={approvedMentorIds}
            selectedMentors={field.value || []}
            onChange={field.onChange}
            disabled={isLoading}
            language={language}
            checkboxClassName="w-7 h-7 appearance-none rounded-md border-2 border-gray-300 bg-white checked:bg-green-500 hover:border-green-500 transition-all flex items-center justify-center"
            checkmarkClassName="text-white text-2xl"
          />
          <FormMessage />
        </FormItem>
      )}
    />
  );
}