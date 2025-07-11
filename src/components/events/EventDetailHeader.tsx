import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions'; // Add this import
import { isEventInPast } from '@/utils/eventUtils';
import { Event } from '@/types/event';

interface EventDetailHeaderProps {
  event: Event; // Change to receive the full event object
  isEventOwner: boolean;
  onDeleteClick: () => void;
  isPastEvent?: boolean;
}

export const EventDetailHeader = ({ 
  event, 
  isEventOwner, 
  onDeleteClick,
  isPastEvent = false
}: EventDetailHeaderProps) => {
  const navigate = useNavigate();
  const { language } = useTheme();
  const { user } = useAuth();
  const permissions = usePermissions(); // Use centralized permissions
  
  // Use centralized permission instead of role checks
  const canEditEvents = permissions.canEditEvents;

  // Calculate if event is in the past
  const eventInPast = isPastEvent || isEventInPast(event);
  
  // Check if user can delete past events (only super-admins can)
  const isSuperAdmin = permissions.canViewAdminData; // This indicates super-admin
  const canDeletePastEvent = !eventInPast || isSuperAdmin;
  
  // Show delete button only if user is event owner AND (event is not past OR user is super-admin)
  const showDeleteButton = isEventOwner && canDeletePastEvent;

  return (
    <div className="flex items-center justify-between">
      <Button
        variant="ghost"
        size="sm"
        className="gap-1"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft className="h-4 w-4" />
        {language === "en" ? "Back" : "Zurück"}
      </Button>

      <div className="flex gap-2">
        {/* Show Edit button to users with edit permissions but disable it for past events */}
        {canEditEvents && (
          <Button
            size="sm"
            variant="outline"
            className="gap-1"
            onClick={() => navigate(`/edit-event/${event.id}`)}
            disabled={eventInPast}
          >
            <Edit className="h-4 w-4" />
            {language === "en" ? "Edit" : "Bearbeiten"}
          </Button>
        )}
        
        {/* Show delete button only for event owners, and only if they can delete past events */}
        {showDeleteButton && (
          <Button
            size="sm"
            variant="destructive"
            className="gap-1"
            onClick={onDeleteClick}
          >
            <Trash2 className="h-4 w-4" />
            {language === "en" ? "Delete" : "Löschen"}
          </Button>
        )}
        
        {/* Show a disabled delete button with tooltip if user is owner but can't delete past event */}
        {isEventOwner && eventInPast && !isSuperAdmin && (
          <Button
            size="sm"
            variant="outline"
            className="gap-1 opacity-50 cursor-not-allowed"
            disabled
            title={language === "en" 
              ? "Past events cannot be deleted" 
              : "Vergangene Veranstaltungen können nicht gelöscht werden"}
          >
            <Trash2 className="h-4 w-4" />
            {language === "en" ? "Delete" : "Löschen"}
          </Button>
        )}
      </div>
    </div>
  );
};