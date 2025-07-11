import React, { createContext, useContext, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { Event } from '@/types/event';
import { useAuth } from './AuthContext';
import { QUERY_KEYS } from '../constants/queryKeys';
import { supabase } from '../lib/supabase';
import { fetchStaffNames } from '../utils/staffUtils';

// Define types for our context
interface DataContextType {
  events: Event[] | undefined;
  isLoadingEvents: boolean;
  eventsError: Error | null;
  refetchEvents: () => Promise<void>;
  refetchAllData: () => Promise<void>;
  getEventById: (id: string) => Event | undefined;
  getUserProfile: (userId: string) => Promise<any>;
  getMentorData: (userId: string) => Promise<any>;
  updateMentorData: (userId: string, data: any) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);



export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // Implement actual data fetching for when cache is empty
  const fetchEventsFromAPI = async (): Promise<Event[]> => {
    try {
      const { data, error } = await supabase
        .from('mentorbooking_events')
        .select(`
          *,
          ProductInfo:product_id (
            id,
            name,
            description_effort,
            description_de,
            icon_name,
            gradient
          )
        `)
        .order('date', { ascending: true });
      
      if (error) {
        throw error;
      }
      
      if (!data || data.length === 0) {
        return [];
      }

      // Collect all staff member IDs (only from staff_members)
      const allStaffIds = new Set<string>();

      data.forEach(event => {
        if (event.staff_members && Array.isArray(event.staff_members)) {
          event.staff_members.forEach(id => {
            if (id && typeof id === 'string') {
              allStaffIds.add(id);
            }
          });
        }
      });
      
      const staffNames = await fetchStaffNames([...allStaffIds]);
      
      // Transform the events
      const transformedEvents = data
        .filter(event => event && typeof event === 'object')
        .map(event => {
          const staffMembers = event.staff_members && Array.isArray(event.staff_members) && event.staff_members.length > 0
            ? event.staff_members.filter(id => id && typeof id === 'string')
            : [];

          const primaryStaffId = staffMembers[0] || '';
          const primaryStaffName = staffNames[primaryStaffId] || 'Unknown';

          return {
            id: event.id,
            title: event.company || '',
            employer_id: event.employer_id || '',
            company: event.company || '',
            date: event.date || '',
            time: event.time || '',
            end_time: event.end_time || '',
            duration_minutes: event.duration_minutes || null,
            description: event.description || '',
            staff_members: staffMembers,
            primaryStaffId: primaryStaffId,
            primaryStaffName: primaryStaffName,
            staffNames: staffMembers.map(id => staffNames[id] || 'Unknown'),
            staffProfilePicture: event.staffProfilePicture || null,
            status: event.status || 'new',
            mode: event.mode || 'online',
            requestingMentors: event.requesting_mentors || [],
            acceptedMentors: event.accepted_mentors || [],
            declinedMentors: event.declined_mentors || [],
            amount_requiredmentors: event.amount_requiredmentors || 1,
            product_id: event.product_id,
            ProductInfo: event.ProductInfo, // <-- Make sure this is included!
            teams_link: event.teams_link || '',
            initial_selected_mentors: event.initial_selected_mentors || [],
          };
        });

      return transformedEvents;
    } catch (error) {
      throw error;
    }
  };

  // 1. Declare refetchEvents FIRST
  const refetchEvents = async () => {
    try {
      // Fetch fresh data from API
      const freshEvents = await fetchEventsFromAPI();
      queryClient.setQueryData([QUERY_KEYS.EVENTS], freshEvents || []);
      await refetch();
      return Promise.resolve();
    } catch (error) {
      queryClient.setQueryData([QUERY_KEYS.EVENTS], []);
      return Promise.reject(error);
    }
  };

  // 2. THEN add your useEffect for realtime subscription
  useEffect(() => {
    if (!user?.hasAccess) return;

    const channel = supabase.channel('events_changes');

    // Listen for changes in requesting_mentors
    channel.on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'mentorbooking_events',
        filter: `requesting_mentors=cs.{${user.id}}`
      },
      (payload) => {
        console.log('Realtime: requesting_mentors changed', payload);
        refetchEvents();
      }
    );

    // Listen for changes in accepted_mentors
    channel.on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'mentorbooking_events',
        filter: `accepted_mentors=cs.{${user.id}}`
      },
      (payload) => {
        console.log('Realtime: accepted_mentors changed', payload);
        refetchEvents();
      }
    );

    // Listen for changes in declined_mentors
    channel.on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'mentorbooking_events',
        filter: `declined_mentors=cs.{${user.id}}`
      },
      (payload) => {
        console.log('Realtime: declined_mentors changed', payload);
        refetchEvents();
      }
    );

    channel.subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [user?.id, user?.hasAccess, refetchEvents]);
  
  const { 
    data: events, 
    isLoading: isLoadingEvents, 
    error: eventsError,
    refetch
  } = useQuery({
    queryKey: [QUERY_KEYS.EVENTS],
    queryFn: async () => {
      return await fetchEventsFromAPI();
    },
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: false,
    // Add permission check here
    enabled: !!user && user.hasAccess
  });

  // Add a new comprehensive data refresh function
  const refetchAllData = async () => {
    try {
      
      // 1. Refetch events
      const freshEvents = await fetchEventsFromAPI();
      queryClient.setQueryData([QUERY_KEYS.EVENTS], freshEvents || []);
      
      // 2. Invalidate all user profiles and SeaTable mentors data
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.USER_PROFILE] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SEATABLE_MENTORS] }); // Fix this line
      
      // 3. Invalidate any other cached data as needed
      // Add additional refresh logic for other data types
      
      // 4. Trigger React Query's refetch mechanism
      await refetch();
      
      return Promise.resolve();
    } catch (error) {
      return Promise.reject(error);
    }
  };

  // Helper to get a single event by ID from the cache
  const getEventById = (id: string): Event | undefined => {
    if (!events) return undefined;
    return events.find(event => event.id === id);
  };

  // Get user profile from cache or API
  const getUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_profile')
        .select('*')
        .eq('user_id', userId)
        .single();
        
      if (error) {
        return null;
      }
      
      return data;
    } catch (error) {
      return null;
    }
  };

  // Get mentor data from cache or API with SeaTable fallback
  const getMentorData = async (userId: string) => {
    try {
      // First check if we have this data in the cache
      const cachedData = queryClient.getQueryData([QUERY_KEYS.SEATABLE_MENTORS, userId]);
      if (cachedData) {
        return cachedData;
      }
      
      // If not in cache, get from SeaTable
      // Import dynamically to avoid circular dependencies
      const { useSeatableMentors } = await import('@/hooks/useSeatableMentors');
      const { getMentorById } = useSeatableMentors();
      
      const mentorData = await getMentorById(userId);
      
      // Cache the data we fetched
      if (mentorData) {
        queryClient.setQueryData([QUERY_KEYS.SEATABLE_MENTORS, userId], mentorData);
      }
      
      return mentorData;
    } catch (error) {
      throw error;
    }
  };

  // Update mentor data
  const updateMentorData = async (userId: string, data: any) => {
    try {
      // Update in SeaTable
      // Import dynamically to avoid circular dependencies
      const { seatableClient } = await import('@/lib/seatableClient');
      
      // Get current data first to find the row ID
      const rows = await seatableClient.getFilteredRows('Mentors', 'Mentor_ID', userId);
      
      if (rows.length === 0) {
        throw new Error(`User ${userId} not found in SeaTable`);
      }
      
      // Update the data
      const rowId = rows[0]._id;
      await seatableClient.updateRow('Mentors', rowId, data);
      
      // After successful update, refetch the data
      await refetchAllData();
    } catch (error) {
      throw error;
    }
  };

  // Make sure the DataProvider returns JSX
  return (
    <DataContext.Provider value={{
      events,
      isLoadingEvents,
      eventsError: eventsError as Error | null,
      refetchEvents,
      refetchAllData,
      getEventById,
      getUserProfile,
      getMentorData,
      updateMentorData
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};