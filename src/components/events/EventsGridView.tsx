import { EventCard } from "@/components/events/EventCard";
import { Event } from "@/types/event";
import { useTheme } from "@/contexts/ThemeContext";
import { useData } from "@/contexts/DataContext";

interface EventsGridViewProps {
  events: Event[];
  userRole?: string;
  userId?: string;
  newAcceptedEventIds: string[];
  onEventClick: (event: Event) => void;
  onRequestClick: (event: Event, e: React.MouseEvent) => Promise<void>;
  onPendingRequestsClick: (eventId: string) => void;
  isSubmittingRequest?: boolean;
  refetchEvents?: () => Promise<void>;
}

export const EventsGridView = ({
  events,
  userRole,
  userId,
  newAcceptedEventIds,
  onEventClick,
  onRequestClick,
  onPendingRequestsClick,
  isSubmittingRequest = false,
  refetchEvents
}: EventsGridViewProps) => {
  const { language } = useTheme();
  
  if (events.length === 0) {
    return (
      <div className="text-center py-12">
        <p>{language === "en" ? "No events found" : "Keine Veranstaltungen gefunden"}</p>
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {events.map((event) => (
        <EventCard
          key={event.id}
          event={event}
          language={language}
          userId={userId}
          onEventClick={() => onEventClick(event)}
          onRequestClick={(e) => onRequestClick(event, e)}
          onPendingRequestsClick={() => onPendingRequestsClick(event.id)}
          isNewlyAccepted={newAcceptedEventIds.includes(event.id)}
          refetchEvents={refetchEvents}
          isSubmittingRequest={isSubmittingRequest}
        />
      ))}
    </div>
  );
};