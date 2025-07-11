import { useMemo } from "react";
import { isSameDay, parseISO, format, isValid } from "date-fns";
import { Event } from "@/types/event";

export const useCalendarEvents = (events: Event[]) => {
  // Group events by date - ensure consistent date format
  const eventsByDate = useMemo(() => {
    const result: Record<string, Event[]> = {};
    
    if (!events || !Array.isArray(events)) {
      return result;
    }
    
    events.forEach(event => {
      if (!event || !event.date) return;
      
      try {
        // Ensure date is in YYYY-MM-DD format
        let dateKey: string;
        
        if (typeof event.date === 'string') {
          // Try to parse the string date to validate it
          const parsedDate = parseISO(event.date);
          if (isValid(parsedDate)) {
            dateKey = format(parsedDate, 'yyyy-MM-dd');
          } else {
            // If parsing fails, try to use the string as-is if it's in the right format
            dateKey = event.date.includes('-') ? event.date.split('T')[0] : event.date;
          }
        } else if (event.date && typeof event.date === 'object' && 'getTime' in event.date) {
          // Check if it's a Date-like object without using instanceof
          const eventDate = event.date as Date;
          if (isValid(eventDate)) {
            dateKey = format(eventDate, 'yyyy-MM-dd');
          } else {
            console.warn('Invalid date object for event:', event.id, event.date);
            return;
          }
        } else {
          console.warn('Invalid date format for event:', event.id, event.date);
          return;
        }
        
        if (result[dateKey]) {
          result[dateKey].push(event);
        } else {
          result[dateKey] = [event];
        }
      } catch (error) {
        console.error('Error processing event date:', event.id, event.date, error);
      }
    });
    
    return result;
  }, [events]);

  // Get events for a specific date
  const getEventsForDate = (date: Date): Event[] => {
    if (!date || !isValid(date)) return [];
    
    try {
      const dateString = format(date, 'yyyy-MM-dd');
      return eventsByDate[dateString] || [];
    } catch (error) {
      console.error('Error formatting date:', date, error);
      return [];
    }
  };

  // Filter events by selected date
  const getEventsBySelectedDate = (selectedDate: Date): Event[] => {
    if (!selectedDate || !isValid(selectedDate)) return [];
    if (!events || !Array.isArray(events)) return [];
    
    return events.filter((event) => {
      if (!event || !event.date) return false;
      
      try {
        if (typeof event.date === 'string') {
          const eventDate = parseISO(event.date);
          return isValid(eventDate) && isSameDay(eventDate, selectedDate);
        } else if (event.date && typeof event.date === 'object' && 'getTime' in event.date) {
          // Check if it's a Date-like object without using instanceof
          const eventDate = event.date as Date;
          return isValid(eventDate) && isSameDay(eventDate, selectedDate);
        }
        return false;
      } catch (error) {
        console.error('Error comparing dates:', event.id, event.date, selectedDate, error);
        return false;
      }
    });
  };

  // Get event status counts for a specific date
  const getStatusCountsForDate = (date: Date) => {
    const eventsForDate = getEventsForDate(date);
    const counts: Record<string, number> = {
      new: 0,
      firstRequests: 0,
      successPartly: 0,
      successComplete: 0,
      locked: 0
    };
    
    eventsForDate.forEach(event => {
      if (event && event.status && counts.hasOwnProperty(event.status)) {
        counts[event.status]++;
      }
    });
    
    return counts;
  };

  return {
    eventsByDate,
    getEventsForDate,
    getEventsBySelectedDate,
    getStatusCountsForDate
  };
};
