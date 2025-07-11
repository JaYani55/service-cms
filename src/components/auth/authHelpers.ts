import { supabase } from '@/lib/supabase';

export const authHelpers = {
  getSession: async () => supabase.auth.getSession(),
  signInWithPassword: async (email: string, password: string) =>
    supabase.auth.signInWithPassword({ email, password }),
  signOut: async () => supabase.auth.signOut(),
  fetchUserProfile: async (userId: string) =>
    supabase.from('user_profile').select('user_id, Username').eq('user_id', userId).single(),
  fetchUserRole: async (userId: string) =>
    supabase.from('user_roles').select('user_id, role_id').eq('user_id', userId).single(),
  fetchRoleName: async (roleId: string) =>
    supabase.from('roles').select('name').eq('id', roleId).single(),
  fetchEmployerInfo: async (userId: string) =>
    supabase.from('employers').select('id, name, logo_url').eq('user_id', userId).maybeSingle(),
};