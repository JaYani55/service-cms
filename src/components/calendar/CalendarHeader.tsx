import { format } from "date-fns";
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";


interface CalendarHeaderProps {
  currentMonth: Date;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
}

const CalendarHeader = ({ 
  currentMonth, 
  onPreviousMonth, 
  onNextMonth 
}: CalendarHeaderProps) => {
  const { language } = useTheme();
  
  return (
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-2xl font-semibold flex items-center gap-2">
        <CalendarIcon className="h-6 w-6" />
        {format(currentMonth, language === "en" ? "MMMM yyyy" : "MMMM yyyy")}
      </h2>

      
      <div className="flex gap-4">
        <Button 
          variant="default" 
          size="icon" 
          onClick={onPreviousMonth}
          aria-label={language === "en" ? "Previous month" : "Vorheriger Monat"}
          className="h-11 w-11 rounded-full bg-primary/90 text-primary-foreground shadow-lg hover:bg-primary hover:-translate-x-1 hover:scale-105 transition-all duration-300 group"
        >
          <ChevronLeft className="h-6 w-6 transition-transform group-hover:scale-110" strokeWidth={2.5} />
        </Button>
        <Button 
          variant="default" 
          size="icon" 
          onClick={onNextMonth}
          aria-label={language === "en" ? "Next month" : "Nächster Monat"}
          className="h-11 w-11 rounded-full bg-primary/90 text-primary-foreground shadow-lg hover:bg-primary hover:translate-x-1 hover:scale-105 transition-all duration-300 group"
        >
          <ChevronRight className="h-6 w-6 transition-transform group-hover:scale-110" strokeWidth={2.5} />
        </Button>
      </div>
    </div>
  );
};

export default CalendarHeader;
