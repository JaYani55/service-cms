import React, { createContext, useContext, useReducer, useEffect, useRef } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { User, UserRole } from '@/types/auth';
import { useQueryClient, QueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '../constants/queryKeys';
import { fetchStaffNames } from '../utils/staffUtils';
import { jwtDecode } from 'jwt-decode';

// Import your new reducer and helpers
import { authReducer, initialState } from '@/components/auth/authReducer';
import { authHelpers } from '@/components/auth/authHelpers';

interface MyJwtPayload {
  user_roles?: string[];
  [key: string]: any;
}

// Define AuthContext type
interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isFirstLogin: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hasAccess: boolean;
  roles: string[];
  switchRole: (role: UserRole) => void;
  getAvailableRoles: () => UserRole[];
  isSuperAdmin: boolean;
  // Add these new permission helper methods
  hasRole: (role: UserRole) => boolean;
  hasAnyRole: (roles: UserRole[]) => boolean;
  getCurrentRole: () => UserRole;
}

// Create context with undefined initial value
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper functions for auth API calls
const loadAppData = async (session: Session, queryClient: QueryClient) => {
  try {
    // Force SeaTable metadata refresh before any SeaTable queries
    const seatableClient = await import('@/lib/seatableClient').then(m => m.seatableClient);
    await seatableClient.getMetadata(true); // <--- Add this line

    const { data, error } = await supabase
      .from('mentorbooking_events')
      .select(`
        *,
        mentorbooking_products:product_id (
          id,
          name,
          description_de,
          description_effort
        )
      `)
      .order('date', { ascending: true });
    
    if (error) throw error;
    
    if (data && data.length > 0) {
      // Collect all staff member IDs
      const allStaffIds = new Set<string>();
      
      data.forEach(event => {
        if (event.staff_members && Array.isArray(event.staff_members)) {
          event.staff_members.forEach(id => allStaffIds.add(id));
        }
      });
      
      const staffNames = await fetchStaffNames([...allStaffIds]);
  
      const transformedEvents = data.map(event => {
        const staffMembers = event.staff_members || [];
        const primaryStaffId = staffMembers[0] || '';
        
        return {
          id: event.id,
          company: event.company,
          date: event.date,
          time: event.time,
          description: event.description || '',
          staff_members: staffMembers,
          primaryStaffId: primaryStaffId,
          primaryStaffName: staffNames[primaryStaffId] || 'Unknown',
          staffNames: staffMembers.map(id => staffNames[id] || 'Unknown'),
          status: event.status,
          requestingMentors: event.requesting_mentors || [],
          acceptedMentors: event.accepted_mentors || [],
          declinedMentors: event.declined_mentors || [],
          amount_requiredmentors: event.amount_requiredmentors || 1,
          product_id: event.product_id,
          ProductInfo: event.mentorbooking_products ? {
            name: event.mentorbooking_products.name,
            description: event.mentorbooking_products.description_de
          } : undefined
        };
      });
      
      // Instead of fetching profile extensions separately, use SeaTable API for staff photos
      const staffProfileUrls = await Promise.all(
        [...allStaffIds].map(async (staffId) => {
          try {
            // Prüfe, ob staffId auch Mentor ist, bevor getMentorById aufgerufen wird
            // Hier ist KEINE direkte Rollenprüfung möglich, da nur die ID bekannt ist.
            // Daher: Versuche getMentorById, aber ignoriere Fehler, falls staffId kein Mentor ist.
            const seatableClient = await import('@/lib/seatableClient').then(m => m.seatableClient);
            const staffData = await seatableClient.getMentorById(staffId);
            // staffData ist nur dann nicht null, wenn staffId ein Mentor ist
            return { 
              user_id: staffId,
              profile_picture_url: staffData?.Profilbild || null
            };
          } catch (err) {
            // Fehler abfangen und null zurückgeben, falls staffId kein Mentor ist
            // Logge den Fehler nur, wenn du Debug brauchst
            // console.error(`[LoadAppData-Events] Error fetching staff profile for ${staffId}:`, err);
            return { user_id: staffId, profile_picture_url: null };
          }
        })
      );

      const staffProfiles = staffProfileUrls.reduce((acc, curr) => {
        if (curr.user_id) {
          acc[curr.user_id] = curr;
        }
        return acc;
      }, {} as Record<string, any>);

      // Now, attach the profile_picture_url to each event
      const eventsWithStaff = transformedEvents.map(event => {
        const staffProfile = staffProfiles[event.primaryStaffId];
        return {
          ...event,
          staffProfilePicture: staffProfile?.profile_picture_url || null
        };
      });

      // Update the cache with events that include staff profile pictures
      await new Promise<void>((resolve) => {
        queryClient.setQueryData([QUERY_KEYS.EVENTS], eventsWithStaff);
        resolve();
      });
    } else {
      queryClient.setQueryData([QUERY_KEYS.EVENTS], []);
    }
  } catch (err) {
    console.error("[CACHE DEBUG] Error loading app data:", err);
  }
};

// Add a ref to track initial authentication
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const queryClient = useQueryClient();
  const safetyTimeoutRef = useRef<number | null>(null);
  const isInitialAuthRef = useRef(true);
  const hasInitializedRef = useRef(false);

  // REMOVE the second useEffect with initAuth completely
  // Keep only this one useEffect for auth management
  useEffect(() => {
    let mounted = true;
    
    // Safety timeout
    safetyTimeoutRef.current = window.setTimeout(() => {
      if (mounted) {
        dispatch({ type: 'SET_LOADING', payload: { loading: false } });
      }
    }, 8000);

    const initAuth = async () => {
      if (hasInitializedRef.current) return;
      hasInitializedRef.current = true;

      dispatch({ type: 'SET_LOADING', payload: { loading: true } });
      
      try {
        const { data: { session }, error } = await authHelpers.getSession();
        if (error) throw error;

        // Set up SINGLE auth listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
          if (!mounted) return;

          switch (event) {
            case 'SIGNED_IN': {
              if (!newSession) return;
              
              // Only process if it's the initial auth
              if (isInitialAuthRef.current) {
                const userData = await fetchUserData(newSession);
                dispatch({ 
                  type: 'AUTH_STATE_CHANGED', 
                  payload: {
                    session: newSession,
                    user: userData
                  }
                });
                isInitialAuthRef.current = false;
              }
              break;
            }
            case 'SIGNED_OUT': {
              dispatch({ type: 'LOGOUT_SUCCESS' });
              break;
            }
            default: {
              // Ignore all other events
            }
          }
        });

        // Handle initial session
        if (session) {
          const userData = await fetchUserData(session);
          dispatch({ 
            type: 'AUTH_STATE_CHANGED', 
            payload: {
              session,
              user: userData
            }
          });
          isInitialAuthRef.current = false;
        }

        if (safetyTimeoutRef.current) {
          clearTimeout(safetyTimeoutRef.current);
        }
      } catch (err) {
        dispatch({ 
          type: 'AUTH_STATE_CHANGED', 
          payload: { session: null }
        });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: { loading: false } });
      }
    };

    initAuth();

    return () => {
      mounted = false;
      if (safetyTimeoutRef.current) {
        clearTimeout(safetyTimeoutRef.current);
      }
    };
  }, []); // Empty dependency array

  const fetchUserData = async (session: Session): Promise<User | null> => {
    try {
      // 1. Get roles from JWT token
      const token = session.access_token;
      const decoded = jwtDecode<MyJwtPayload>(token);
      const userRoleNames = decoded.user_roles || [];

      // 2. Check if user has any of the allowed roles
      const hasValidRole = userRoleNames.some(role => 
        ['mentor', 'staff', 'super-admin', 'mentoringmanagement'].includes(role)
      );

      if (!hasValidRole) {
        throw new Error('Not permitted / Keine Berechtigung');
      }

      // 3. Fetch additional user data
      const profileResult = await authHelpers.fetchUserProfile(session.user.id);
      const employerResult = await authHelpers.fetchEmployerInfo(session.user.id);

      // 4. Determine user's role (priority: super-admin > staff > mentoringmanagement > mentor)
      let userRole = UserRole.GUEST;
      if (userRoleNames.includes('super-admin')) {
        userRole = UserRole.SUPERADMIN;
      } else if (userRoleNames.includes('staff')) {
        userRole = UserRole.STAFF;
      } else if (userRoleNames.includes('mentoringmanagement')) {
        userRole = UserRole.MENTORINGMANAGEMENT;
      } else if (userRoleNames.includes('mentor')) {
        userRole = UserRole.MENTOR;
      }

      // 5. Build and return user object
      const userData: User = {
        id: session.user.id,
        email: session.user.email || '',
        firstName: profileResult.data?.Username?.split(' ')[0] || '',
        lastName: profileResult.data?.Username?.split(' ').slice(1).join(' ') || '',
        role: userRole,
        originalRole: userRole,
        Username: profileResult.data?.Username,
        hasAccess: hasValidRole,
        roles: userRoleNames
      };

      return userData;

    } catch (error) {
      // Return minimal user object as fallback
      if (session?.user) {
        return {
          id: session.user.id,
          email: session.user.email || '',
          firstName: '',
          lastName: '',
          role: UserRole.GUEST,
          hasAccess: false,
          roles: []
        };
      }
      
      throw error;
    }
  };

  // Update the login function
  const login = async (email: string, password: string): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: { loading: true } });
      
      // 1. Clear everything first
      queryClient.removeQueries();
      queryClient.clear();
      localStorage.clear();
      sessionStorage.clear();
      
      // 2. Attempt login
      const { data, error } = await authHelpers.signInWithPassword(email, password);
      
      if (error) throw error;
      
      if (!data.session) {
        throw new Error("Login successful but no session returned");
      }

      // 3. Get user data and verify access
      const userData = await fetchUserData(data.session);
      
      if (!userData?.hasAccess) {
        await authHelpers.signOut();
        throw new Error('Not permitted / Keine Berechtigung');
      }

      // 4. Load fresh data before updating UI state
      await loadAppData(data.session, queryClient);

      // 5. Only update UI state after everything is loaded
      dispatch({ 
        type: 'LOGIN_SUCCESS', 
        payload: {
          session: data.session,
          user: userData
        }
      });

    } catch (error) {
      dispatch({ 
        type: 'SET_ERROR', 
        payload: { error: error as Error }
      });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: { loading: false } });
    }
  };

  // Update the logout function
  const logout = async () => {
    try {
      // Dispatch logout first to update UI state
      dispatch({ type: 'LOGOUT_SUCCESS' });
      
      // Clear React Query cache using the queryClient instance
      queryClient.clear(); // Use the instance, not the class
      
      // Clear all storage
      localStorage.clear();
      sessionStorage.clear();
      
      // Clear cookies
      document.cookie.split(";").forEach((c) => {
        document.cookie = c
          .replace(/^ +/, "")
          .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });

      // Perform Supabase signout
      await supabase.auth.signOut();
      
      // Redirect and reload
      window.location.href = '/login';
      window.location.reload();

    } catch (error) {
      window.location.href = '/login';
      window.location.reload();
    }
  };

  // Update the switchRole function to use centralized logic
  const switchRole = (role: UserRole) => {
    if (!state.user?.hasAccess) {
      return;
    }
    
    // Convert UserRole enum to string for comparison
    const roleString = role.toString();
    
    // Allow switching if user is super-admin OR if they actually have the target role
    const canSwitch = state.user.originalRole === UserRole.SUPERADMIN || 
                     state.user.roles.includes(roleString);
    
    if (!canSwitch) {
      console.warn(`User cannot switch to role ${roleString}. Available roles:`, state.user.roles);
      return;
    }
    
    dispatch({ 
      type: 'SWITCH_ROLE', 
      payload: { role } 
    });
  };

  // Add helper function to get available roles for switching
  const getAvailableRoles = (): UserRole[] => {
    if (!state.user?.roles) return [];
    
    const availableRoles: UserRole[] = [];
    
    // If super-admin, they can switch to any role
    if (state.user.originalRole === UserRole.SUPERADMIN) {
      return [UserRole.SUPERADMIN, UserRole.STAFF, UserRole.MENTORINGMANAGEMENT, UserRole.MENTOR];
    }
    
    // Otherwise, only allow switching between roles the user actually has
    state.user.roles.forEach(roleString => {
      switch (roleString) {
        case 'super-admin':
          availableRoles.push(UserRole.SUPERADMIN);
          break;
        case 'staff':
          availableRoles.push(UserRole.STAFF);
          break;
        case 'mentoringmanagement':
          availableRoles.push(UserRole.MENTORINGMANAGEMENT);
          break;
        case 'mentor':
          availableRoles.push(UserRole.MENTOR);
          break;
      }
    });
    
    return availableRoles;
  };

  // Add helper methods for permission checking
  const hasRole = (role: UserRole): boolean => {
    if (!state.user?.roles) return false;
    return state.user.roles.includes(role.toString());
  };

  const hasAnyRole = (roles: UserRole[]): boolean => {
    if (!state.user?.roles) return false;
    return roles.some(role => state.user.roles.includes(role.toString()));
  };

  const getCurrentRole = (): UserRole => {
    return state.user?.role || UserRole.GUEST;
  };

  // Create memoized context value to prevent unnecessary renders
  const contextValue: AuthContextType = {
    user: state.user,
    session: state.session,
    loading: state.loading,
    isFirstLogin: state.isFirstLogin,
    login,
    logout,
    hasAccess: state.user?.hasAccess || false,
    roles: state.user?.roles || [],
    switchRole,
    getAvailableRoles,
    isSuperAdmin: state.user?.originalRole === UserRole.SUPERADMIN || false,
    hasRole,
    hasAnyRole,
    getCurrentRole
  };

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};