// app/lib/supabase-client.js
// SINGLETON SUPABASE CLIENT - CREATE THIS NEW FILE

import { createClient } from '@supabase/supabase-js';

let supabaseInstance = null;

export function getSupabaseClient() {
  if (!supabaseInstance) {
    supabaseInstance = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
  }
  return supabaseInstance;
}