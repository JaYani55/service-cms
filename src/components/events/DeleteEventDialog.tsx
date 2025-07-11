import { useTheme } from '@/contexts/ThemeContext';
import { usePermissions } from '@/hooks/usePermissions';
import { isEventInPast } from '@/utils/eventUtils';
import { Event } from '@/types/event';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";

interface DeleteEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete: () => Promise<void>;
  isDeleting: boolean;
  event?: Event;
}

export const DeleteEventDialog = ({
  open,
  onOpenChange,
  onDelete,
  isDeleting,
  event
}: DeleteEventDialogProps) => {
  const { language } = useTheme();
  const { canViewAdminData } = usePermissions();
  
  // Check if event is in the past and user is not super-admin
  const isPastEvent = event ? isEventInPast(event) : false;
  const canDeletePastEvent = !isPastEvent || canViewAdminData;
  
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {language === "en" ? "Delete Event" : "Veranstaltung löschen"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {!canDeletePastEvent ? (
              language === "en"
                ? "This event has already taken place and cannot be deleted. Only super-admins can delete past events."
                : "Diese Veranstaltung hat bereits stattgefunden und kann nicht gelöscht werden. Nur Super-Admins können vergangene Veranstaltungen löschen."
            ) : (
              language === "en"
                ? "Are you sure? This action cannot be undone."
                : "Sind Sie sicher? Diese Aktion kann nicht rückgängig gemacht werden."
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>
            {language === "en" ? "Cancel" : "Abbrechen"}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              if (canDeletePastEvent) {
                onDelete();
              }
            }}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={isDeleting || !canDeletePastEvent}
          >
            {isDeleting ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin h-4 w-4 border-2 border-white border-opacity-50 border-t-white rounded-full"></div>
                {language === "en" ? "Deleting..." : "Löschen..."}
              </div>
            ) : (
              language === "en" ? "Delete" : "Löschen"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};