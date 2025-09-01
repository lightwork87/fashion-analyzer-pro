// app/lib/supabase.js - COMPLETE REWRITE
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Export missing functions that are being imported
export async function getOrCreateUser(clerkId, email) {
  try {
    // First try to get existing user
    let { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('clerk_id', clerkId)
      .single();

    if (error && error.code === 'PGRST116') {
      // User doesn't exist, create new one
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert([
          { 
            clerk_id: clerkId,
            email: email,
            credits_remaining: 3 // Default starter credits
          }
        ])
        .select()
        .single();

      if (insertError) throw insertError;
      return newUser;
    }

    if (error) throw error;
    return user;
  } catch (error) {
    console.error('Error in getOrCreateUser:', error);
    throw error;
  }
}

export async function checkUserCredits(clerkId) {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('credits_remaining')
      .eq('clerk_id', clerkId)
      .single();

    if (error) {
      console.error('Error checking user credits:', error);
      return 0;
    }

    return data?.credits_remaining || 0;
  } catch (error) {
    console.error('Error in checkUserCredits:', error);
    return 0;
  }
}

export async function updateUserCredits(clerkId, creditsToDeduct) {
  try {
    const { data, error } = await supabase
      .from('users')
      .update({ 
        credits_remaining: supabase.raw(`credits_remaining - ${creditsToDeduct}`)
      })
      .eq('clerk_id', clerkId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating user credits:', error);
    throw error;
  }
}