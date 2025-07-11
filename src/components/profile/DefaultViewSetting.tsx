import React, { useState } from 'react';
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Home } from "lucide-react";

interface DefaultViewSettingProps {
  defaultView?: string;
  language: 'en' | 'de';
  onUpdate: (view: string) => Promise<boolean>;
}

export const DefaultViewSetting = ({ defaultView = 'events', language, onUpdate }: DefaultViewSettingProps) => {
  const [selectedView, setSelectedView] = useState(defaultView);
  const [isSaving, setIsSaving] = useState(false);
  
  const handleSave = async () => {
    try {
      setIsSaving(true);
      const success = await onUpdate(selectedView);
      
      if (success) {
        toast.success(
          language === 'en'
            ? 'Default view updated successfully'
            : 'Standardansicht erfolgreich aktualisiert'
        );
      } else {
        throw new Error('Update failed');
      }
    } catch (error) {
      console.error('Error updating default view:', error);
      toast.error(
        language === 'en'
          ? 'Failed to update default view'
          : 'Fehler beim Aktualisieren der Standardansicht'
      );
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <div>
      <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
        <Home className="h-5 w-5" />
        {language === "en" ? "Default Landing Page" : "Standardstartseite"}
      </h3>
      
      <p className="mb-4 text-muted-foreground">
        {language === "en" 
          ? "Choose which page you'd like to see first when you log in."
          : "Wähle aus, welche Seite du zuerst sehen möchtest, wenn du dich anmeldest."}
      </p>
      
      <div className="flex items-center gap-4">
        <Select value={selectedView} onValueChange={setSelectedView}>
          <SelectTrigger className="w-full max-w-[200px]">
            <SelectValue placeholder={language === "en" ? "Select view" : "Ansicht wählen"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="events">{language === "en" ? "Events" : "Veranstaltungen"}</SelectItem>
            <SelectItem value="calendar">{language === "en" ? "Calendar" : "Kalender"}</SelectItem>
            <SelectItem value="list">{language === "en" ? "List" : "Liste"}</SelectItem>
          </SelectContent>
        </Select>
        
        <Button 
          onClick={handleSave}
          disabled={isSaving || selectedView === defaultView}
        >
          {language === "en" ? "Save" : "Speichern"}
        </Button>
      </div>
    </div>
  );
};