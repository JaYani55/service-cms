import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useMentorRequests } from './useMentorRequests';
import type { Event } from '@/types/event';

export function useManualMentorApproval(event: Event) {
  const { user } = useAuth();
  const [isApproving, setIsApproving] = useState(false);
  const { processRequest } = useMentorRequests(event, user);

  async function approveMentorManually(mentorId: string, _mentorName: string) {
    setIsApproving(true);
    try {
      await processRequest(mentorId, 'approve');
    } finally {
      setIsApproving(false);
    }
  }

  async function declineMentorManually(mentorId: string, _mentorName: string) {
    setIsApproving(true);
    try {
      await processRequest(mentorId, 'decline');
    } finally {
      setIsApproving(false);
    }
  }

  return { isApproving, approveMentorManually, declineMentorManually };
}
