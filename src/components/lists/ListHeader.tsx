import { Button } from "@/components/ui/button";
import { ListIcon } from "lucide-react";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { RefreshButton } from "@/components/ui/RefreshButton";
import { NewEventButton } from "@/components/ui/NewEventButton";

interface ListHeaderProps {
  language: string;
  isLoadingEvents: boolean;
  refetchEvents: () => Promise<void>;
}

const ListHeader = ({ language, isLoadingEvents, refetchEvents }: ListHeaderProps) => {
  return (
    <div className="flex justify-between items-center mb-6">
      <div className="flex gap-3">
        <RefreshButton 
          onClick={refetchEvents} 
          isLoading={isLoadingEvents} 
        />
        <NewEventButton />
      </div>
    </div>
  );
};

export default ListHeader;