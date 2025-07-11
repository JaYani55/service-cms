import React from 'react';
import { getIconByName } from '@/constants/pillaricons';
import { cn } from "@/lib/utils";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";
import { ProductInfo } from '@/components/products/types';

interface PillarIconProps {
  ProductInfo: ProductInfo | null | undefined;
  isDark: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
  showLabel?: boolean;
  language?: 'en' | 'de';
}

const PillarIcon: React.FC<PillarIconProps> = ({ 
  ProductInfo,
  isDark, 
  size = 'md', 
  className,
  label,
  showLabel = true,
  language = 'en'
}) => {
  if (!ProductInfo) {
    return (
      <div className="flex flex-col items-center">
        <div className={cn(
          "flex items-center justify-center",
          size === "sm" ? "h-6 w-6" : size === "lg" ? "h-10 w-10" : "h-8 w-8",
          className
        )}>
          -
        </div>
        {showLabel && (
          <span className="text-xs text-muted-foreground mt-1">
            {label || (language === "en" ? "Product" : "Produkt")}
          </span>
        )}
      </div>
    );
  }

  const iconSizes = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6"
  };

  const containerSizes = {
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-10 w-10"
  };

  return (
    <div className="flex flex-col items-center">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div 
              className={cn(
                "rounded-full bg-primary/10 flex items-center justify-center",
                containerSizes[size],
                className
              )}
            >
              {ProductInfo.icon_name ? (
                <img 
                  src={getIconByName(ProductInfo.icon_name, isDark)} 
                  alt={ProductInfo.name} 
                  className={cn("object-contain", iconSizes[size])}
                />
              ) : (
                <span className="text-primary">{ProductInfo.name.charAt(0)}</span>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            {ProductInfo.name}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      {showLabel && (
        <span className="text-xs text-muted-foreground mt-1">
          {label || (language === "en" ? "Product" : "Produkt")}
        </span>
      )}
    </div>
  );
};

export default PillarIcon;