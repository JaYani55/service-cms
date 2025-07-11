import React, { useState, useEffect } from "react";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function LockAndMentorCountSection({ form, selectedProduct, language, isLoading }) {
  const minMentors = selectedProduct?.min_amount_mentors ?? 1;
  const maxQuick = 8;
  const value = Number(form.watch("amount_requiredmentors") ?? minMentors);

  // Dynamically show custom if value is outside quick range
  const isQuickValue = value >= minMentors && value < minMentors + maxQuick;
  const [showCustom, setShowCustom] = useState(!isQuickValue);

  useEffect(() => {
    setShowCustom(!(value >= minMentors && value < minMentors + maxQuick));
  }, [value, minMentors]);

  const handleQuickSelect = (num: number) => {
    setShowCustom(false);
    form.setValue("amount_requiredmentors", num);
  };

  const handleMoreToggle = (checked: boolean) => {
    setShowCustom(checked);
    if (!checked && value >= minMentors + maxQuick) {
      form.setValue("amount_requiredmentors", minMentors + maxQuick - 1);
    }
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const num = Math.max(minMentors, Number(e.target.value) || minMentors);
    form.setValue("amount_requiredmentors", num);
  };

  return (
    <FormField
      control={form.control}
      name="amount_requiredmentors"
      render={({ field }) => (
        <FormItem>
          <FormLabel>
            {language === "en" ? "Amount Required Mentors" : "Anzahl benötigter MentorInnen"}
          </FormLabel>
          <div className="flex flex-wrap gap-2 items-center">
            {!showCustom && (
              <>
                {[...Array(maxQuick)].map((_, i) => {
                  const num = i + minMentors;
                  return (
                    <Button
                      key={num}
                      type="button"
                      onClick={() => handleQuickSelect(num)}
                      disabled={isLoading}
                      className={`w-8 h-8 p-0 nav-button mentor-count-btn${value === num ? " nav-button-active" : ""}`}
                    >
                      {num}
                    </Button>
                  );
                })}
              </>
            )}
            <div className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={showCustom}
                onChange={e => handleMoreToggle(e.target.checked)}
                disabled={isLoading}
                id="more-checkbox"
                className="mr-1"
              />
              <label htmlFor="more-checkbox" className="text-sm cursor-pointer">
                {language === "en" ? "More" : "Mehr"}
              </label>
            </div>
            {showCustom && (
              <Input
                type="number"
                min={minMentors}
                value={value}
                onChange={handleCustomChange}
                disabled={isLoading}
                className="w-20"
              />
            )}
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}