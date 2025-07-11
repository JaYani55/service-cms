import React from "react";
import { CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function FooterSection({ isLoading, mode, language }) {
  return (
    <CardFooter className="flex justify-between px-0 mt-4">
      <Button type="submit" disabled={isLoading} className="rounded-full px-6 py-2 text-base font-semibold shadow-md">
        {mode === "create"
          ? language === "en" ? "Create Event" : "Event erstellen"
          : language === "en" ? "Save Changes" : "Änderungen speichern"}
      </Button>
    </CardFooter>
  );
}