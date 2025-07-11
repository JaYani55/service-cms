import { Session, User as SupabaseUser } from '@supabase/supabase-js';

// Enums instead of type for better type safety
export enum UserRole {
  GUEST = 'guest',
  MENTOR = 'mentor',
  COACH = 'coach', // Keep for backward compatibility - cosmetic only
  STAFF = 'staff', // New role with actual permissions
  MENTORINGMANAGEMENT = 'mentoringmanagement',
  SUPERADMIN = 'super-admin'
}

// Split interfaces by concern
export interface UserBase {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  originalRole?: UserRole; 
  role: UserRole;
  hasAccess: boolean;
  roles: string[];
}

export interface UserProfile extends UserBase {
  company?: string;
  profilePictureUrl?: string;
  pfp_url?: string;  // Add this to match your database field
  description?: string;
  quote?: string;
  Username?: string;
  created_at?: string;  // Add this to match database field
  updated_at?: string;  // Add this for consistency
}

export interface UserAccessibility {
  hasVisibleDisability?: boolean;
  hasNonvisibleDisability?: boolean;
}

export type User = UserProfile & UserAccessibility;

// Group related state types
export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isFirstLogin: boolean;
  error: Error | null;
}

// Use discriminated union for actions
export type AuthAction = 
  | { type: 'AUTH_STATE_CHANGED'; payload: { session: Session | null; user?: User | null } }
  | { type: 'LOGIN_SUCCESS'; payload: { session: Session; user: User } }
  | { type: 'LOGOUT_SUCCESS' }
  | { type: 'SET_LOADING'; payload: { loading: boolean } }
  | { type: 'SET_FIRST_LOGIN'; payload: { isFirstLogin: boolean } }
  | { type: 'SET_ERROR'; payload: { error: Error | null } }
  | { type: 'SWITCH_ROLE'; payload: { role: UserRole } }; // Add this new action type
