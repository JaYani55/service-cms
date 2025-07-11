import { useState, useEffect } from 'react';
import { Event } from "@/types/event";
import { UserRole } from '@/types/auth';


export const useEventAcceptance = (user: any, events: Event[] | null) => {
  const [newAcceptedEventIds, setNewAcceptedEventIds] = useState<string[]>([]);

  
  useEffect(() => {
    if (!user || !events || user.role !== UserRole.MENTOR) return;
    
    const storageKey = `acceptedEvents_${user.id}`;
    const storedIds = localStorage.getItem(storageKey);
    const previouslyAcceptedEventIds = storedIds ? JSON.parse(storedIds) : [];
    
    // Get currently accepted events
    const currentAcceptedEventIds = events
      .filter(event => event.acceptedMentors?.includes(user.id))
      .map(event => event.id);
    
    // Find newly accepted events
    const newlyAcceptedIds = currentAcceptedEventIds
      .filter(id => !previouslyAcceptedEventIds.includes(id));
    
    // Update local storage with current state
    localStorage.setItem(storageKey, JSON.stringify(currentAcceptedEventIds));
    
    // Set state to newly accepted event ids
    setNewAcceptedEventIds(newlyAcceptedIds);
  }, [events, user]);

  const clearNewAcceptedEvent = (eventId?: string) => {
    if (!eventId) return;
    setNewAcceptedEventIds(prev => prev.filter(id => id !== eventId));
  };

  return { newAcceptedEventIds, clearNewAcceptedEvent };
};