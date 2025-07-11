import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSeatableMentors } from '@/hooks/useSeatableMentors';
import { supabase } from '@/lib/supabase';
import { SeaTableRow } from '@/types/seaTableTypes';

interface ProfileUser {
  id: string;
  Username?: string;
  pfp_url?: string;
  [key: string]: any;
}

export const useProfileData = (language: 'en' | 'de') => {
  const { userId } = useParams<{ userId: string }>();
  const { user: currentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [accessChecked, setAccessChecked] = useState(false);
  const [user, setUser] = useState<ProfileUser | null>(null);
  const [seatableMentorData, setSeatableMentorData] = useState<SeaTableRow | null>(null);
  const [isRegistrationInProcess, setIsRegistrationInProcess] = useState(false);

  // Determine the actual user ID to fetch
  const targetUserId = userId || currentUser?.id;
  const isOwnProfile = !userId || userId === currentUser?.id;

  // SeaTable hook - ALWAYS use "extern" view for profiles
  const { getMentorById, tryAlternateTables } = useSeatableMentors({
    viewName: 'extern'
  });

  // Check access permissions
  const checkAccess = useCallback(async () => {
    if (!targetUserId) {
      setHasAccess(false);
      setAccessChecked(true);
      setIsLoading(false);
      return;
    }

    try {
      console.log('[useProfileData] Checking access for user:', targetUserId);
      
      // Query user_profile table
      const { data: profileData, error: profileError } = await supabase
        .from('user_profile')
        .select('*')
        .eq('user_id', targetUserId)
        .single();

      if (profileError) {
        console.error('[useProfileData] Error fetching profile:', profileError);
        
        // If it's a "not found" error, the user might not have a profile yet
        if (profileError.code === 'PGRST116') {
          console.log('[useProfileData] User profile not found, checking if user exists in auth');
          
          // User exists in auth but no profile - this is registration in process
          setIsRegistrationInProcess(true);
          setUser({
            id: targetUserId,
            Username: 'Registration in Process'
          });
          setHasAccess(true);
          setAccessChecked(true);
          setIsLoading(false);
          return;
        }
        
        throw profileError;
      }

      // Check if user has mentor role
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select(`
          role_id,
          roles (
            name
          )
        `)
        .eq('user_id', targetUserId);

      if (roleError) {
        console.error('[useProfileData] Error fetching roles:', roleError);
        throw roleError;
      }

      // Fix: The roles property is an object, not an array
      const userRoles = roleData?.map((r: any) => r.roles?.name).filter(Boolean) || [];
      const isMentor = userRoles.includes('mentor');

      console.log('[useProfileData] User roles:', userRoles);
      console.log('[useProfileData] Is mentor:', isMentor);

      // Set user profile data
      setUser({
        id: targetUserId,
        Username: profileData.Username,
        pfp_url: profileData.pfp_url,
        ...profileData
      });

      // Access control logic
      if (isOwnProfile) {
        // Always allow access to own profile
        setHasAccess(true);
      } else {
        // For other profiles, check if current user has permission
        const currentUserRoles = currentUser?.roles || [];
        
        // Define elevated roles that can view other profiles
        const elevatedRoles = ['super-admin', 'staff', 'mentoringmanagement'];
        
        // Check if user has any elevated roles
        const hasElevatedRole = currentUserRoles.some(role => 
          elevatedRoles.includes(role)
        );
        
        if (hasElevatedRole) {
          // User has elevated permissions - can view any profile
          setHasAccess(true);
        } else {
          // User does not have elevated permissions - cannot view other profiles
          // This includes users who are ONLY mentors
          setHasAccess(false);
        }
      }

      setAccessChecked(true);

    } catch (error) {
      console.error('[useProfileData] Error in checkAccess:', error);
      setHasAccess(false);
      setAccessChecked(true);
    } finally {
      setIsLoading(false);
    }
  }, [targetUserId, isOwnProfile, currentUser?.roles]);

  // Fetch SeaTable data
  const fetchSeaTableData = useCallback(async () => {
    if (!targetUserId || !hasAccess) return;

    try {
      console.log('[useProfileData] Fetching SeaTable data for:', targetUserId);
      
      let mentorData = await getMentorById(targetUserId);
      
      // If not found, try alternate tables
      if (!mentorData) {
        console.log('[useProfileData] No data found, trying alternate tables');
        mentorData = await tryAlternateTables(targetUserId);
      }

      if (mentorData) {
        console.log('[useProfileData] SeaTable data found:', Object.keys(mentorData));
        setSeatableMentorData(mentorData);
      } else {
        console.log('[useProfileData] No SeaTable data found');
        setSeatableMentorData(null);
      }

    } catch (error) {
      console.error('[useProfileData] Error fetching SeaTable data:', error);
      setSeatableMentorData(null);
    }
  }, [targetUserId, hasAccess, getMentorById, tryAlternateTables]);

  // Update username function
  const updateUsername = useCallback(async (newUsername: string): Promise<boolean> => {
    if (!targetUserId || !isOwnProfile) return false;

    try {
      const { error } = await supabase
        .from('user_profile')
        .update({ Username: newUsername })
        .eq('user_id', targetUserId);

      if (error) throw error;

      // Update local state
      setUser(prev => prev ? { ...prev, Username: newUsername } : null);
      return true;

    } catch (error) {
      console.error('[useProfileData] Error updating username:', error);
      return false;
    }
  }, [targetUserId, isOwnProfile]);

  // Effects
  useEffect(() => {
    if (targetUserId) {
      setIsLoading(true);
      setAccessChecked(false);
      checkAccess();
    }
  }, [targetUserId, checkAccess]);

  useEffect(() => {
    if (hasAccess && accessChecked && !isRegistrationInProcess) {
      fetchSeaTableData();
    }
  }, [hasAccess, accessChecked, isRegistrationInProcess, fetchSeaTableData]);

  return {
    isLoading,
    hasAccess,
    accessChecked,
    user,
    seatableMentorData,
    isRegistrationInProcess,
    updateUsername,
    isOwnProfile,
    targetUserId
  };
};