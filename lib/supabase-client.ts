import { createBrowserClient } from './supabase';

// Create a singleton instance of the Supabase client for client components
let supabaseClient: ReturnType<typeof createBrowserClient> | null = null;

export const getSupabaseClient = () => {
  if (!supabaseClient) {
    supabaseClient = createBrowserClient();
  }
  return supabaseClient;
};
