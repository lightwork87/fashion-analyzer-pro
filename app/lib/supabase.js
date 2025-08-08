import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper functions for user management
export async function getOrCreateUser(clerkUser) {
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

    // If user doesn't exist, create them
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({
        clerk_id: clerkUser.id,
        email: clerkUser.emailAddresses[0].emailAddress,
        credits_total: 10, // Free trial credits
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

// Check if user has enough credits
export async function checkUserCredits(clerkId, creditsNeeded = 1) {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('credits_total, credits_used, bonus_credits')
      .eq('clerk_id', clerkId)
      .single();

    if (error || !user) {
      return { hasEnoughCredits: false, creditsAvailable: 0, error };
    }

    const totalCredits = user.credits_total + user.bonus_credits;
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

// Use credits
export async function useCredits(clerkId, creditsToUse = 1, imageCount = 1) {
  try {
    // Start a transaction
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, credits_used')
      .eq('clerk_id', clerkId)
      .single();

    if (userError || !user) {
      return { success: false, error: userError || 'User not found' };
    }

    // Update credits used
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        credits_used: user.credits_used + creditsToUse,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (updateError) {
      return { success: false, error: updateError };
    }

    // Log credit usage
    const { error: logError } = await supabase
      .from('credit_usage')
      .insert({
        user_id: user.id,
        credits_used: creditsToUse,
        image_count: imageCount,
        analysis_type: 'fashion'
      });

    if (logError) {
      console.error('Error logging credit usage:', logError);
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Error using credits:', error);
    return { success: false, error };
  }
}

// Save analysis results
export async function saveAnalysis(clerkId, analysisData) {
  try {
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', clerkId)
      .single();

    if (userError || !user) {
      return { success: false, error: userError || 'User not found' };
    }

    const { error: insertError } = await supabase
      .from('analyses')
      .insert({
        user_id: user.id,
        images_count: analysisData.imageCount,
        brand: analysisData.brand?.name || 'Unknown',
        item_type: analysisData.itemType,
        condition_score: analysisData.condition?.score,
        estimated_value_min: analysisData.estimatedPrice?.min,
        estimated_value_max: analysisData.estimatedPrice?.max,
        sku: analysisData.sku,
        ebay_title: analysisData.ebayTitle,
        description: analysisData.description,
        metadata: analysisData
      });

    if (insertError) {
      console.error('Error saving analysis:', insertError);
      return { success: false, error: insertError };
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Error saving analysis:', error);
    return { success: false, error };
  }
}

// Get user's analysis history
export async function getUserAnalyses(clerkId, limit = 10) {
  try {
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', clerkId)
      .single();

    if (userError || !user) {
      return { analyses: [], error: userError || 'User not found' };
    }

    const { data: analyses, error } = await supabase
      .from('analyses')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    return { analyses: analyses || [], error };
  } catch (error) {
    console.error('Error fetching analyses:', error);
    return { analyses: [], error };
  }
}