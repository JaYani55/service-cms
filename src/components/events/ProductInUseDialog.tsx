import { useTheme } from '@/contexts/ThemeContext';
import { X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ProductInUseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ProductName: string;
  eventsUsingProduct: { id: string; company: string }[];
}

export const ProductInUseDialog = ({
  open,
  onOpenChange,
  ProductName,
  eventsUsingProduct
}: ProductInUseDialogProps) => {
  const { language } = useTheme();
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            {language === "en" ? "Cannot Delete Product" : "Produkt kann nicht gelöscht werden"}
          </DialogTitle>
          <DialogDescription>
            {language === "en"
              ? `The Product "${ProductName}" cannot be deleted because it is currently used by the following events:`
              : `Die Produkt "${ProductName}" kann nicht gelöscht werden, da sie derzeit von folgenden Veranstaltungen verwendet wird:`}
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
        
        <DialogDescription className="text-amber-600 dark:text-amber-400">
          {language === "en"
            ? "Please reassign these events to another Product first, or remove the Product assignment from these events."
            : "Bitte weisen Sie diesen Veranstaltungen zuerst eine andere Produkt zu oder entfernen Sie die Produktezuweisung von diesen Veranstaltungen."}
        </DialogDescription>
        
        <DialogFooter className="mt-4">
          <Button 
            onClick={() => onOpenChange(false)}
          >
            {language === "en" ? "Understood" : "Verstanden"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};