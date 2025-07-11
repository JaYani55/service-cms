import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface MentorTrait {
  id: number;
  group_name: string;
  description?: string;
}

export const useMentorTraits = (mentorId?: string) => {
  const [traits, setTraits] = useState<MentorTrait[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!mentorId) {
      setTraits([]);
      return;
    }

    const fetchMentorTraits = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch all mentor groups where this mentor is a member
        const { data: groups, error: groupsError } = await supabase
          .from('mentor_groups')
          .select('id, group_name, description, user_in_group');

        if (groupsError) throw groupsError;

        // Filter groups where the mentor is a member
        const mentorTraits = (groups || [])
          .filter(group => {
            const members = Array.isArray(group.user_in_group) ? group.user_in_group : [];
            return members.includes(mentorId);
          })
          .map(group => ({
            id: group.id,
            group_name: group.group_name,
            description: group.description
          }))
          .sort((a, b) => a.group_name.localeCompare(b.group_name));

        setTraits(mentorTraits);
      } catch (err) {
        console.error('Error fetching mentor traits:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setTraits([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMentorTraits();
  }, [mentorId]);

  return { traits, isLoading, error };
};