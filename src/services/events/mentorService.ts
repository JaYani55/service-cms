import { supabase } from '@/lib/supabase';

export const assignMentorToEvent = async (eventId: string, mentorId: string): Promise<void> => {
  // First, get the current event to access existing mentor arrays
  const { data: currentEvent, error: fetchError } = await supabase
    .from('mentorbooking_events')
    .select('acceptedMentors, requestingMentors')
    .eq('id', eventId)
    .single();

  if (fetchError) {
    console.error('Error fetching current event:', fetchError);
    throw new Error(fetchError.message || 'Failed to fetch event');
  }

  // Update the event with the new mentor assignment
  const updatedAcceptedMentors = [...(currentEvent.acceptedMentors || []), mentorId];
  const updatedRequestingMentors = (currentEvent.requestingMentors || []).filter(id => id !== mentorId);

  const { error } = await supabase
    .from('mentorbooking_events')
    .update({
      acceptedMentors: updatedAcceptedMentors,
      requestingMentors: updatedRequestingMentors
    })
    .eq('id', eventId);

  if (error) {
    console.error('Error assigning mentor to event:', error);
    throw new Error(error.message || 'Failed to assign mentor to event');
  }
};

export const removeMentorFromEvent = async (eventId: string, mentorId: string): Promise<void> => {
  // First, get the current event to access existing mentor arrays
  const { data: currentEvent, error: fetchError } = await supabase
    .from('mentorbooking_events')
    .select('acceptedMentors')
    .eq('id', eventId)
    .single();

  if (fetchError) {
    console.error('Error fetching current event:', fetchError);
    throw new Error(fetchError.message || 'Failed to fetch event');
  }

  // Remove mentor from accepted array only
  const updatedAcceptedMentors = (currentEvent.acceptedMentors || []).filter(id => id !== mentorId);

  const { error } = await supabase
    .from('mentorbooking_events')
    .update({
      acceptedMentors: updatedAcceptedMentors
    })
    .eq('id', eventId);

  if (error) {
    console.error('Error removing mentor from event:', error);
    throw new Error(error.message || 'Failed to remove mentor from event');
  }
};