import { Button } from "@/components/ui/button";
import { NewEventButton } from "@/components/ui/NewEventButton";
import { RefreshButton } from "@/components/ui/RefreshButton";
import { useTheme } from "@/contexts/ThemeContext";
import { useData } from "@/contexts/DataContext";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useState } from "react";

interface EventsHeaderProps {
  refetchEvents: () => Promise<void>;
  isLoadingEvents: boolean;
}

export const EventsHeader = ({ refetchEvents, isLoadingEvents }: EventsHeaderProps) => {
  const { language } = useTheme();
  const { refetchAllData } = useData();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetchAllData();
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="flex justify-between items-center mb-6">
      <div className="flex items-center gap-2">
        <RefreshButton 
          onClick={handleRefresh} 
          isLoading={isRefreshing}
        />
      </div>
      <div className="flex gap-3">
        <NewEventButton />
      </div>
    </div>
  );
};