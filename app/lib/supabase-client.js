// app/lib/supabase-client.js - COMPLETE FILE
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let supabaseInstance = null;

export function createClient() {
  if (!supabaseInstance) {
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase environment variables');
    }
    
    supabaseInstance = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }
  
  return supabaseInstance;
}

// Add the getSupabaseClient function for backward compatibility
export function getSupabaseClient() {
  return createClient();
}

// Default export
export default createClient;