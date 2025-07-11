import { useState, useEffect } from 'react';
import { Event } from '@/types/event';

type MentorProfile = {
  id: string;
  name: string;
  profilePic?: string;
};

type MentorAction = {
  id: string;
  name: string;
  action: 'accept' | 'decline' | null;
};

export const useMentorProfileLoader = (
  event: Event | null,
  getUserProfile: (userId: string) => Promise<any>
) => {
  const [isLoading, setIsLoading] = useState(true);
  const [requestingMentors, setRequestingMentors] = useState<MentorAction[]>([]);
  const [acceptedMentorProfiles, setAcceptedMentorProfiles] = useState<MentorProfile[]>([]);
  const [declinedMentorProfiles, setDeclinedMentorProfiles] = useState<MentorProfile[]>([]);

  useEffect(() => {
    if (!event) {
      setIsLoading(false);
      return;
    }

    const loadMentorProfiles = async () => {
      setIsLoading(true);
      try {
        // Load requesting mentors
        if (event.requestingMentors?.length > 0) {
          const requestingProfiles = await Promise.all(
            event.requestingMentors.map(async (mentorId) => {
              const profile = await getUserProfile(mentorId);
              return {
                id: mentorId,
                name: profile?.Username || 'Unknown User',
                action: null as MentorAction['action']
              };
            })
          );
          setRequestingMentors(requestingProfiles);
        } else {
          setRequestingMentors([]);
        }

        // Load accepted mentors
        if (event.acceptedMentors?.length > 0) {
          const acceptedProfiles = await Promise.all(
            event.acceptedMentors.map(async (mentorId) => {
              const profile = await getUserProfile(mentorId);
              return {
                id: mentorId,
                name: profile?.Username || 'Unknown User',
                profilePic: profile?.profilePic
              };
            })
          );
          setAcceptedMentorProfiles(acceptedProfiles);
        } else {
          setAcceptedMentorProfiles([]);
        }

        // Load declined mentors
        if (event.declinedMentors?.length > 0) {
          const declinedProfiles = await Promise.all(
            event.declinedMentors.map(async (mentorId) => {
              const profile = await getUserProfile(mentorId);
              return {
                id: mentorId,
                name: profile?.Username || 'Unknown User',
                profilePic: profile?.profilePic
              };
            })
          );
          setDeclinedMentorProfiles(declinedProfiles);
        } else {
          setDeclinedMentorProfiles([]);
        }

      } catch (error) {
        console.error('Error loading mentor profiles:', error);
        setRequestingMentors([]);
        setAcceptedMentorProfiles([]);
        setDeclinedMentorProfiles([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadMentorProfiles();
  }, [
    event?.id,
    event?.acceptedMentors?.join(','),
    event?.requestingMentors?.join(','),
    event?.declinedMentors?.join(','),
    getUserProfile
  ]);

  const updateRequestingMentors = (mentors: MentorAction[]) => {
    setRequestingMentors(mentors);
  };

  return {
    isLoading,
    requestingMentors,
    updateRequestingMentors,
    acceptedMentorProfiles,
    declinedMentorProfiles
  };
};