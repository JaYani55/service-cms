import React from 'react';
import { Event } from '@/types/event';
import { User } from '@/types/auth';
import { useTheme } from '@/contexts/ThemeContext';
import { usePermissions } from '@/hooks/usePermissions';
import { formatDate } from '@/utils/eventUtils';
import { Calendar } from 'lucide-react';

interface PendingRequestsProgressListProps {
  pendingRequestEvents: Event[];
  onEventClick: (event: Event) => void;
  user: User;
  refreshEvents: () => Promise<void>;
}

export const PendingRequestsProgressList: React.FC<PendingRequestsProgressListProps> = ({
  pendingRequestEvents,
  onEventClick,
  user,
  refreshEvents
}) => {
  const { language } = useTheme();
  const { canViewMentorProfiles } = usePermissions();

  // Only show this component if user has mentor permissions
  if (!canViewMentorProfiles) {
    return null;
  }
  
  return (
    <div className="my-6">
      <h2 className="text-2xl font-semibold mb-4">
        {language === 'en' ? 'My Pending Requests' : 'Meine ausstehenden Anfragen'}
      </h2>
      
      <div className="space-y-4">
        {pendingRequestEvents.map((event) => {
          return (
            <div 
              key={event.id} 
              className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => onEventClick(event)}
            >
              {/* Display information about the event */}
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5 mr-1" />
                    <span>{formatDate(event.date, language)}</span>
                    {event.time && <span className="ml-1">• {event.time}</span>}
                  </div>
                </div>
              </div>
              
              {/* Progress bar */}
              <div className="mt-4">
                <div className="text-xs mb-1 flex justify-between">
                  <span>
                    {language === 'en' ? 'Request sent' : 'Anfrage gesendet'}
                  </span>
                  <span>
                    {language === 'en' ? 'Waiting for response' : 'Warten auf Antwort'}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: '50%' }}
                  ></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};