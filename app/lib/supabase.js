import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables!');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');

// Helper functions for user management
export async function getOrCreateUser(clerkUser) {
  console.log('getOrCreateUser called with:', clerkUser.id);
  
  try {
    // First, try to get existing user
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('clerk_id', clerkUser.id)
      .single();

    if (existingUser) {
      return { user: existingUser, error: null };
    }

    if (fetchError && fetchError.code !== 'PGRST116') {
      return { user: null, error: fetchError };
    }

    // If user doesn't exist, create them
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({
        clerk_id: clerkUser.id,
        email: clerkUser.emailAddresses[0].emailAddress,
        credits_total: 10,
        credits_used: 0,
        subscription_status: 'free',
        subscription_plan: 'free'
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating user:', createError);
      return { user: null, error: createError };
    }

    return { user: newUser, error: null };
  } catch (error) {
    console.error('Error in getOrCreateUser:', error);
    return { user: null, error };
  }
}