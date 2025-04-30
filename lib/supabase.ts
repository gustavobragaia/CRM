import { createClient } from '@supabase/supabase-js';

// Environment variables should be set in .env.local file
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Create a Supabase client for browser usage
export const createBrowserClient = () => {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase URL and Anon Key must be defined');
  }
  return createClient(supabaseUrl, supabaseAnonKey);
};
