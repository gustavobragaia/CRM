import { supabase } from './supabase/client';

// Export a function to get the Supabase client for client components
export const getSupabaseClient = () => {
  return supabase;
};
