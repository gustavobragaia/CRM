// Export all Supabase functionality from a single entry point
import { supabase as clientSupabase } from './client';
import { supabase as serverSupabase } from './server';

// Auth functions
import * as authFunctions from './auth';

// API functions
import * as apiFunctions from './api';

// Export everything
export const supabaseClient = clientSupabase;
export const supabaseServer = serverSupabase;
export const auth = authFunctions;
export const api = apiFunctions;

// Default export for convenience
export default {
  client: clientSupabase,
  server: serverSupabase,
  auth: authFunctions,
  api: apiFunctions
};
