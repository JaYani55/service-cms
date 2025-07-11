import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useTheme } from '../contexts/ThemeContext';
import { usePermissions } from './usePermissions';
import { Event } from '../types/event';
import { toast } from 'sonner';

export function useEventDetail() {
  const { getEventById } = useData();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { language } = useTheme();
  const permissions = usePermissions();
  const [event, setEvent] = useState<Event | null>(null);

  // Load event data
  useEffect(() => {
    if (!id) return;

    const loadEvent = () => {
      try {
        const eventData = getEventById(id);

        if (eventData && !eventData.status) {
          eventData.status = 'new'; // Default status
        }

        setEvent(eventData || null);
      } catch (error) {
        console.error('Error loading event data:', error);
        toast.error(
          language === "en"
            ? "Failed to load event data"
            : "Fehler beim Laden der Veranstaltungsdaten"
        );
      }
    };

    loadEvent();
  }, [id, getEventById, language]);

  // Reload event from context/cache
  const reloadEvent = () => {
    if (!id) return;
    const eventData = getEventById(id);
    setEvent(eventData || null);
  };

  // Role-based calculations
  const isMentor = user?.role === 'mentor';
  const isEventOwner = event && user && event.staff_members?.includes(user.id);
  const isAcceptedMentor = user && event?.acceptedMentors?.includes(user.id);
  const hasAlreadyRequested = user && event?.requestingMentors?.includes(user.id);

  const isMentorInvolved = user && event && (
    event.requestingMentors?.includes(user.id) ||
    event.declinedMentors?.includes(user.id) ||
    event.acceptedMentors?.includes(user.id)
  );

  const isInAnyMentorColumn = (userId?: string, event?: Event | null): boolean => {
    if (!userId || !event) return false;
    return !!(
      event.requestingMentors?.includes(userId) ||
      event.acceptedMentors?.includes(userId) ||
      event.declinedMentors?.includes(userId)
    );
  };

  const updateEvent = (updatedEvent: Event | null) => {
    setEvent(prevEvent => {
      if (!prevEvent || !updatedEvent) return prevEvent;
      return { ...updatedEvent };
    });
  };

  return {
    id,
    event,
    setEvent,
    user,
    permissions,
    isMentor,
    isEventOwner,
    isAcceptedMentor,
    hasAlreadyRequested,
    isMentorInvolved,
    language,
    updateEvent,
    reloadEvent,
  };
}