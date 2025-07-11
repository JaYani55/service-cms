import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create a client without the Content-Type header
export const fileUploadClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: true,
    detectSessionInUrl: false,
    storageKey: 'supabase.auth.token',
    flowType: 'pkce',
    storage: window.localStorage
  },
  global: {
    headers: {
      'Accept': 'application/json',
      'pragma': 'no-cache',
      'cache-control': 'no-cache'
      // No Content-Type header!
    }
  }
});