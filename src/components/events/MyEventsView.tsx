import { EventCard } from "@/components/events/EventCard";
import { PendingRequestsProgressList } from "@/components/events/PendingRequestsProgressList";
import { Event } from "@/types/event";
import { User } from "@/types/auth";
import { useTheme } from "@/contexts/ThemeContext";
import { usePermissions } from "@/hooks/usePermissions";

interface MyEventsViewProps {
  upcomingEvents: Event[];
  pastEvents: Event[];
  user: User;
  newAcceptedEventIds: string[];
  onEventClick: (event: Event) => void;
  onRequestMentorClick: (event: Event, e: React.MouseEvent) => Promise<void>;
  onPendingRequestsClick: (eventId: string) => void;
  onDismissNewBadge: (eventId: string) => void;
  refreshEvents: () => Promise<void>;
}

export const MyEventsView = ({
  upcomingEvents,
  pastEvents,
  user,
  newAcceptedEventIds,
  onEventClick,
  onRequestMentorClick,
  onPendingRequestsClick,
  onDismissNewBadge,
  refreshEvents
}: MyEventsViewProps) => {
  const { language } = useTheme();
  const { canViewMentorProfiles } = usePermissions();

  // Filter for pending requests (mentors who have requested)
  const pendingRequestEvents = upcomingEvents.filter(event =>
    event.requestingMentors?.includes(user?.id || '')
  );

  return (
    <div className="space-y-10">
      {/* Upcoming events section */}
      <div>
        <div className="relative flex items-center py-4">
          <div className="flex-grow border-t border-gray-300"></div>
          <h2 className="px-4 text-2xl font-semibold">
            {language === "en" ? "My Upcoming Events" : "Meine bevorstehenden Veranstaltungen"}
          </h2>
          <div className="flex-grow border-t border-gray-300"></div>
        </div>

        {upcomingEvents.length === 0 ? (
          <div className="text-center py-8">
            <p>{language === "en" ? "No upcoming events found" : "Keine bevorstehenden Veranstaltungen gefunden"}</p>
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {upcomingEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                language={language}
                userId={user?.id}
                onEventClick={() => onEventClick(event)}
                onRequestClick={(e) => onRequestMentorClick(event, e)}
                onPendingRequestsClick={() => onPendingRequestsClick(event.id)}
                isNewlyAccepted={newAcceptedEventIds.includes(event.id)}
                onDismissNewBadge={onDismissNewBadge}
                refetchEvents={refreshEvents}
              />
            ))}
          </div>
        )}
      </div>

      {/* Pending requests - only show if user has mentor viewing permissions */}
      {canViewMentorProfiles && pendingRequestEvents.length > 0 && (
        <PendingRequestsProgressList
          pendingRequestEvents={pendingRequestEvents}
          onEventClick={onEventClick}
          user={user}
          refreshEvents={refreshEvents}
        />
      )}

      {/* Past events section */}
      <div>
        <div className="relative flex items-center py-4">
          <div className="flex-grow border-t border-gray-300"></div>
          <h2 className="px-4 text-2xl font-semibold">
            {language === "en" ? "My Past Events" : "Meine vergangenen Veranstaltungen"}
          </h2>
          <div className="flex-grow border-t border-gray-300"></div>
        </div>

        {pastEvents.length === 0 ? (
          <div className="text-center py-8">
            <p>{language === "en" ? "No past events found" : "Keine vergangenen Veranstaltungen gefunden"}</p>
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {pastEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                language={language}
                userId={user?.id}
                onEventClick={() => onEventClick(event)}
                onRequestClick={(e) => onRequestMentorClick(event, e)}
                onPendingRequestsClick={() => onPendingRequestsClick(event.id)}
                isNewlyAccepted={false}
                onDismissNewBadge={onDismissNewBadge}
                refetchEvents={refreshEvents}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};