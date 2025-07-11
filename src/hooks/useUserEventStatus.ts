import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Event } from '@/types/event';

/**
 * Hook that returns a user's involvement in an event as mentor or staff.
 * - For mentors: checks if user is in requestingMentors, acceptedMentors, or declinedMentors.
 * - For staff: checks if user is in staff_members.
 *
 * @param event The event to check against
 * @returns An object with mentor and staff involvement flags
 */
export function useUserEventStatus(event: Event | null | undefined) {
  const { user } = useAuth();
  const { refetchEvents } = useData();

  const status = useMemo(() => {
    if (!user || !event) {
      return {
        isMentor: false,
        isRequesting: false,
        isAccepted: false,
        isDeclined: false,
        isStaff: false,
      };
    }

    // Mentor involvement
    const isMentor = user.role === 'mentor';
    const isRequesting = isMentor && event.requestingMentors?.includes(user.id);
    const isAccepted = isMentor && event.acceptedMentors?.includes(user.id);
    const isDeclined = isMentor && event.declinedMentors?.includes(user.id);

    // Staff involvement
    // If your event uses a different property for staff, adjust here
    const isStaff = user.role === 'staff' && event.staff_members?.includes(user.id);

    return {
      isMentor,
      isRequesting,
      isAccepted,
      isDeclined,
      isStaff,
    };
  }, [event, user]);

  // Optionally, a refresh function if you want to refetch event data
  const refreshEventStatus = async () => {
    await refetchEvents();
  };

  return {
    ...status,
    refreshEventStatus,
  };
}