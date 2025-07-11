import React from 'react';
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import { useTheme } from '@/contexts/ThemeContext';
import { Product } from '@/services/events/productService';
import { cn } from "@/lib/utils";

interface ProductFormFooterProps {
  isLoading: boolean;
  editingProduct: Product | null;
  onCancel: () => void;
  className?: string;
}

export function ProductFormFooter({ isLoading, editingProduct, onCancel, className }: ProductFormFooterProps) {
  const { language } = useTheme();
  
  return (
    <div className={cn("flex items-center justify-end gap-3", className)}>
      <Button
        type="button"
        variant="outline"
        onClick={onCancel}
        className="px-5"
      >
        {language === 'en' ? 'Cancel' : 'Abbrechen'}
      </Button>
      
      <Button 
        type="submit"
        disabled={isLoading}
        className={cn(
          "px-5 bg-gradient-to-r from-green-100 to-green-200 hover:from-green-200 hover:to-green-300",
          "border border-green-300 text-black shadow-md hover:shadow-lg transition-all",
          "hover:scale-[1.02] active:scale-[0.98]"
        )}
      >
        {isLoading ? (
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
            <span>{language === 'en' ? 'Saving...' : 'Speichern...'}</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Save className="h-4 w-4" />
            {editingProduct 
              ? language === 'en' ? 'Update' : 'Aktualisieren'
              : language === 'en' ? 'Create' : 'Erstellen'
            }
          </div>
        )}
      </Button>
    </div>
  );
}