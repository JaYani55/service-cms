import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

interface ProductEditWarningDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ProductName: string;
  eventsUsingProduct: { id: string; company: string }[];
  onContinueEdit: () => void;
}

export function ProductEditWarningDialog({
  open,
  onOpenChange,
  ProductName,
  eventsUsingProduct,
  onContinueEdit,
}: ProductEditWarningDialogProps) {
  const { language } = useTheme();
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
            <AlertCircle className="h-5 w-5" />
            {language === "en" ? "Warning: Product in Use" : "Warnung: Produkt in Verwendung"}
          </DialogTitle>
          <DialogDescription>
            {language === "en"
              ? `The product "${ProductName}" is currently used by ${eventsUsingProduct.length} event(s). Editing this product may affect those events.`
              : `Das Produkt "${ProductName}" wird derzeit von ${eventsUsingProduct.length} Veranstaltung(en) verwendet. Das Bearbeiten dieses Produkts kann diese Veranstaltungen beeinflussen.`}
          </DialogDescription>
        </DialogHeader>
        
        <div className="my-4 max-h-[200px] overflow-y-auto border rounded-md p-3">
          <ul className="list-disc pl-5 space-y-1">
            {eventsUsingProduct.map(event => (
              <li key={event.id} className="text-sm">
                {event.company}
              </li>
            ))}
          </ul>
        </div>
        
        <DialogFooter className="gap-3">
          <Button 
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {language === "en" ? "Cancel" : "Abbrechen"}
          </Button>
          <Button 
            variant="default"
            onClick={onContinueEdit}
          >
            {language === "en" ? "Edit Anyway" : "Trotzdem bearbeiten"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}