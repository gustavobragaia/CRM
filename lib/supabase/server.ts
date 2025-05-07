import { createClient } from '@supabase/supabase-js';

// Create a single supabase client for interacting with your database with admin privileges
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default supabase;
