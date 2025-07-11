import React from 'react';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTheme } from "../../contexts/ThemeContext";

interface CounterButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  count: number;
  englishLabel?: string;
  germanLabel?: string;
  className?: string;
}

export function CounterButton({
  count,
  englishLabel = "View Requests",
  germanLabel = "Anfragen ansehen",
  className,
  ...props
}: CounterButtonProps) {
  const { language } = useTheme();

  return (
    <Button
      type="button"
      size="xl"
      className={cn(
        "relative flex items-center justify-center text-black font-semibold px-6 py-3 rounded-2xl transition-all duration-200",
        className
      )}
      style={{ background: 'linear-gradient(182deg,rgba(242, 247, 255, 1) 0%, rgba(201, 213, 246, 1) 100%)' }}
      {...props}
    >
      <span className="text-base md:text-lg">
        {language === "en" ? englishLabel : germanLabel}
      </span>
      {count > 0 && (
        <span
          className={cn(
            "absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold w-7 h-7 flex items-center justify-center rounded-full border-2 border-white shadow-md",
          )}
        >
          {count}
        </span>
      )}
    </Button>
  );
} 