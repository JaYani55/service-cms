import { UnderlineButton } from "@/components/ui/underlinebutton";
import { useTheme } from "@/contexts/ThemeContext";
import { Check, Clock, UserRound } from "lucide-react";
import { usePermissions } from "@/hooks/usePermissions"; 
interface EventsNavigationProps {
  viewMode: string;
  onViewModeChange: (mode: 'all' | 'myEvents' | 'coachEvents' | 'past') => void;
  isMentor: boolean;
  isCoach: boolean;
}

export const EventsNavigation = ({ 
  viewMode, 
  onViewModeChange, 
  isMentor, 
  isCoach 
}: EventsNavigationProps) => {
  const { language } = useTheme();
  const permissions = usePermissions(); // Add this
  
  return (
    <div className="flex overflow-x-auto pb-2 scrollbar-thin space-x-2 sm:space-x-4">
      <div className="flex items-center gap-6 mb-3">
        <UnderlineButton 
          variant="default"
          active={viewMode === 'all'}
          onClick={() => onViewModeChange('all')}
        >
          {language === "en" ? "All Events" : "Alle Veranstaltungen"}
        </UnderlineButton>
        
        {isMentor && !permissions.canViewMentorProfiles && (
          <UnderlineButton 
            variant="default"
            active={viewMode === 'myEvents'}
            onClick={() => onViewModeChange('myEvents')}
            icon={<UserRound className="h-4 w-4" />}
          >
            {language === "en" ? "My Events" : "Meine Events"}
          </UnderlineButton>
        )}

        {/* Replace isCoach with permission check */}
        {permissions.canViewMentorProfiles && (
          <UnderlineButton 
            variant="default"
            active={viewMode === 'coachEvents'}
            onClick={() => onViewModeChange('coachEvents')}
            icon={<UserRound className="h-4 w-4" />}
          >
            {language === "en" ? "My Events" : "Meine Events"}
          </UnderlineButton>
        )}
        <div className="ml-auto">
        <UnderlineButton 
          variant="gray"
          active={viewMode === 'past'}
          onClick={() => onViewModeChange('past')}
          icon={<Clock className="h-4 w-4" />}
        >
          {language === "en" ? "Archive" : "Archiv"}
        </UnderlineButton>
        </div>
      </div>
    </div>
  );
};