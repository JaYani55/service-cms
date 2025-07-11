import { useMemo } from 'react';
import { Event, EventStatus } from '@/types/event';
import { UserRole } from '@/types/auth';
import { fetchStaffNames } from '../utils/staffUtils';
import { usePermissions } from './usePermissions';

export type ViewMode = 'all' | 'myEvents' | 'coachEvents' | 'past';
export type StatusFilterType = EventStatus | 'needsMentors' | null;

interface UseEventFiltersProps {
  events: Event[] | null;
  viewMode: ViewMode;
  statusFilter: StatusFilterType;
  user: any;
  search?: string;
  sortBy?: keyof Event;
  sortDirection?: "asc" | "desc";
}

export const useEventFilters = ({
  events,
  viewMode,
  statusFilter,
  user,
  search = '',
  sortBy = 'date',
  sortDirection = 'desc'
}: UseEventFiltersProps) => {
  const { canMentorViewEvent } = usePermissions();
  return useMemo(() => {
    if (!events) return { filteredEvents: [], upcomingEvents: [], pastEvents: [] };
    
    // First filter the events
    let filteredEvents = events.filter(event => {
      // Base filters
      const matchesSearch = !search || 
        event.company.toLowerCase().includes(search.toLowerCase()) ||
        event.description?.toLowerCase().includes(search.toLowerCase());

      // Status filtering
      let matchesStatus = true;
      if (statusFilter) {
        if (statusFilter === 'needsMentors') {
          matchesStatus = 
            ['new', 'firstRequests', 'successPartly'].includes(event.status) &&
            (event.acceptedMentors?.length || 0) < event.amount_requiredmentors;
        } else {
          matchesStatus = event.status === statusFilter;
        }
      }

      // View mode specific filtering
      if (viewMode === 'myEvents' && user?.role === UserRole.MENTOR) {
        return (
          matchesSearch && 
          matchesStatus &&
          (event.acceptedMentors?.includes(user.id) || 
           event.requestingMentors?.includes(user.id) ||
           event.declinedMentors?.includes(user.id))
        );
      }

      if (viewMode === 'coachEvents') {
        return matchesSearch && matchesStatus && event.staff_members?.includes(user.id);
      }

      if (viewMode === 'past') {
        const eventDate = new Date(event.date);
        return matchesSearch && matchesStatus && eventDate < new Date();
      }

      // Default view (all)
      if (viewMode === 'all' && user?.role === UserRole.MENTOR) {
        if (!canMentorViewEvent({ initial_selected_mentors: event.initial_selected_mentors || [], })) return false;
      }
      return matchesSearch && matchesStatus;
    });
    
    // Sort the filtered results
    filteredEvents = [...filteredEvents].sort((a, b) => {
      let aValue: any = a[sortBy];
      let bValue: any = b[sortBy];
      
      if (sortBy === 'primaryStaffName') {
        aValue = a.primaryStaffName || '';
        bValue = b.primaryStaffName || '';
      }
      
      if (sortBy === 'date') {
        aValue = new Date(a.date + ' ' + a.time);
        bValue = new Date(b.date + ' ' + b.time);
      }
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const comparison = aValue.localeCompare(bValue);
        return sortDirection === 'asc' ? comparison : -comparison;
      }
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    // Split into upcoming and past events
    const now = new Date();
    let upcomingEvents = filteredEvents.filter(event => new Date(event.date) >= now);
    let pastEvents = filteredEvents.filter(event => new Date(event.date) < now);
    
    upcomingEvents = upcomingEvents.sort((a, b) => {
      const dateA = new Date(a.date + 'T' + a.time);
      const dateB = new Date(b.date + 'T' + b.time);
      return sortDirection === 'asc'
        ? dateA.getTime() - dateB.getTime()
        : dateB.getTime() - dateA.getTime();
    });
    
    pastEvents = pastEvents.sort((a, b) => {
      const dateA = new Date(a.date + 'T' + a.time);
      const dateB = new Date(b.date + 'T' + b.time);
      return sortDirection === 'asc'
        ? dateA.getTime() - dateB.getTime()
        : dateB.getTime() - dateA.getTime();
    });

    return {
      filteredEvents,
      upcomingEvents,
      pastEvents
    };
  }, [events, viewMode, statusFilter, user, search, sortBy, sortDirection, canMentorViewEvent]);
};