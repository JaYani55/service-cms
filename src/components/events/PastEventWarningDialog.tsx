import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Clock, Edit3, Trash2 } from 'lucide-react';

interface PastEventWarningDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onContinueCreate: () => void;
  selectedDate: string;
}

export function PastEventWarningDialog({
  open,
  onOpenChange,
  onContinueCreate,
  selectedDate
}: PastEventWarningDialogProps) {
  const { language } = useTheme();
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
            <AlertTriangle className="h-5 w-5" />
            {language === "en" ? "Warning: Creating Past Event" : "Warnung: Vergangenes Event erstellen"}
          </DialogTitle>
          <DialogDescription>
            {language === "en"
              ? `You are about to create an event for ${selectedDate}, which is in the past.`
              : `Sie sind dabei, ein Event für den ${selectedDate} zu erstellen, der in der Vergangenheit liegt.`}
          </DialogDescription>
        </DialogHeader>
        
        <div className="my-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md">
          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
            <div className="space-y-2">
              <p className="font-medium text-amber-800 dark:text-amber-200">
                {language === "en" ? "Important Limitations:" : "Wichtige Einschränkungen:"}
              </p>
              <ul className="text-sm text-amber-700 dark:text-amber-300 space-y-1">
                <li className="flex items-center gap-2">
                  <Edit3 className="h-3 w-3" />
                  {language === "en" 
                    ? "This event cannot be edited after creation" 
                    : "Dieses Event kann nach der Erstellung nicht bearbeitet werden"}
                </li>
                <li className="flex items-center gap-2">
                  <Trash2 className="h-3 w-3" />
                  {language === "en" 
                    ? "This event cannot be deleted (except by super-admins)" 
                    : "Dieses Event kann nicht gelöscht werden (außer von Super-Admins)"}
                </li>
              </ul>
            </div>
          </div>
        </div>
        
        <DialogDescription className="text-muted-foreground">
          {language === "en"
            ? "Are you sure you want to create this past event? Please double-check all details before proceeding."
            : "Sind Sie sicher, dass Sie dieses vergangene Event erstellen möchten? Bitte überprüfen Sie alle Details vor dem Fortfahren."}
        </DialogDescription>
        
        <DialogFooter className="gap-3">
          <Button 
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {language === "en" ? "Cancel" : "Abbrechen"}
          </Button>
          <Button 
            variant="default"
            onClick={onContinueCreate}
            className="bg-amber-600 hover:bg-amber-700 dark:bg-amber-700 dark:hover:bg-amber-800"
          >
            {language === "en" ? "Create Past Event" : "Vergangenes Event erstellen"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}