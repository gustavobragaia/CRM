import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Only throw an error if we're in the browser or if this is a runtime API route call
const isBrowser = typeof window !== 'undefined';
const isApiRoute = process.env.NEXT_RUNTIME === 'nodejs' &&
  process.env.NEXT_PHASE !== 'phase-production-build';

if ((isBrowser || isApiRoute) && (!supabaseUrl || !supabaseAnonKey)) {
  throw new Error('Missing Supabase environment variables');
}

// Use empty strings as fallbacks during build time
const url = supabaseUrl || 'https://placeholder-url.supabase.co';
const key = supabaseAnonKey || 'placeholder-key';

// Create the Supabase client
export const supabase = createClient(url, key, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export default supabase;
