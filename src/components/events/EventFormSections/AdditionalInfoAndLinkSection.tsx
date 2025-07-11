import React from "react";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

export function AdditionalInfoAndLinkSection({ form, showTeamsLink, language }) {
  return (
    <>
      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{language === "en" ? "Is there special info which isn't part of the product info?" : "Gibt es spezielle Infos, die nicht in den Produktinfos enthalten sind?"}</FormLabel>
            <FormControl>
              <Textarea {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      {showTeamsLink && (
        <FormField
          control={form.control}
          name="teams_link"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{language === "en" ? "Teams Link" : "Teams-Link"}</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
    </>
  );
}