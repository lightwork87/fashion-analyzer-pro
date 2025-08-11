import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables!');
  console.log('URL:', supabaseUrl);
  console.log('Key:', supabaseAnonKey ? 'Set' : 'Missing');
}

// Check if they're swapped
if (supabaseUrl && supabaseUrl.startsWith('eyJ')) {
  console.error('ERROR: Supabase URL and Key appear to be swapped!');
  console.error('The URL should start with https://, not with eyJ');
}

// Only create client if variables look correct
let supabase = null;
if (supabaseUrl && supabaseUrl.startsWith('https://') && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
} else {
  console.error('Invalid Supabase configuration - check environment variables');
}

export { supabase };

// Helper functions for user management
export async function getOrCreateUser(clerkUser) {
  if (!supabase) {
    console.error('Supabase client not initialized');
    return { user: null, error: 'Supabase not configured' };
  }
  
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

// Add null checks to other functions too
export async function checkUserCredits(clerkId, creditsNeeded = 1) {
  if (!supabase) {
    return { hasEnoughCredits: false, creditsAvailable: 0, error: 'Supabase not configured' };
  }
  
  // Rest of the function...
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('credits_total, credits_used, bonus_credits')
      .eq('clerk_id', clerkId)
      .single();

    if (error || !user) {
      return { hasEnoughCredits: false, creditsAvailable: 0, error };
    }

    const totalCredits = user.credits_total + (user.bonus_credits || 0);
    const creditsAvailable = totalCredits - user.credits_used;
    const hasEnoughCredits = creditsAvailable >= creditsNeeded;

    return { 
      hasEnoughCredits, 
      creditsAvailable,
      totalCredits,
      creditsUsed: user.credits_used,
      error: null 
    };
  } catch (error) {
    console.error('Error checking credits:', error);
    return { hasEnoughCredits: false, creditsAvailable: 0, error };
  }
}
// At the very bottom of /app/lib/supabase.js, add:
export {
  supabase,
  getOrCreateUser,
  checkUserCredits,
  useCredits,
  saveAnalysis,
  getUserAnalyses
};