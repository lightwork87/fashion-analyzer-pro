import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables!');
}

// Check if they're swapped
if (supabaseUrl && supabaseUrl.startsWith('eyJ')) {
  console.error('ERROR: Supabase URL and Key appear to be swapped!');
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
  console.log('🔵 getOrCreateUser called with:', {
    clerkId: clerkUser.id,
    email: clerkUser.emailAddresses[0].emailAddress
  });
  
  if (!supabase) {
    console.error('❌ Supabase client not initialized');
    return { user: null, error: 'Supabase not configured' };
  }
  
  try {
    // First, try to get existing user
    console.log('🔍 Looking for existing user...');
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('clerk_id', clerkUser.id)
      .single();

    if (existingUser) {
      console.log('✅ Found existing user:', existingUser.id);
      return { user: existingUser, error: null };
    }

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('❌ Error fetching user:', fetchError);
      return { user: null, error: fetchError };
    }

    // If user doesn't exist, create them
    console.log('📝 Creating new user...');
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
      console.error('❌ Error creating user:', createError);
      return { user: null, error: createError };
    }

    console.log('✅ Created new user:', newUser.id);
    return { user: newUser, error: null };
  } catch (error) {
    console.error('❌ Error in getOrCreateUser:', error);
    return { user: null, error };
  }
}

// Check if user has enough credits
export async function checkUserCredits(clerkId, creditsNeeded = 1) {
  console.log('💳 checkUserCredits called:', { clerkId, creditsNeeded });
  
  if (!supabase) {
    return { hasEnoughCredits: false, creditsAvailable: 0, error: 'Supabase not configured' };
  }
  
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('credits_total, credits_used, bonus_credits')
      .eq('clerk_id', clerkId)
      .single();

    console.log('Credit check result:', { user, error });

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

// Use credits
export async function useCredits(clerkId, creditsToUse = 1, imageCount = 1) {
  console.log('💳 useCredits called:', { clerkId, creditsToUse, imageCount });
  
  if (!supabase) {
    console.error('❌ Supabase client not initialized');
    return { success: false, error: 'Supabase not configured' };
  }
  
  try {
    // Get user by clerk_id
    console.log('🔍 Finding user by clerk_id...');
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, credits_used')
      .eq('clerk_id', clerkId)
      .single();

    if (userError || !user) {
      console.error('❌ User not found:', userError);
      return { success: false, error: userError || 'User not found' };
    }

    console.log('✅ Found user:', user.id, 'Current credits used:', user.credits_used);

    // Update credits used
    console.log('📝 Updating credits...');
    const newCreditsUsed = user.credits_used + creditsToUse;
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        credits_used: newCreditsUsed,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('❌ Error updating credits:', updateError);
      return { success: false, error: updateError };
    }

    console.log('✅ Credits updated. New credits used:', newCreditsUsed);

    // Log credit usage
    console.log('📝 Logging credit usage...');
    const { error: logError } = await supabase
      .from('credit_usage')
      .insert({
        user_id: user.id,
        credits_used: creditsToUse,
        image_count: imageCount,
        analysis_type: 'fashion'
      });

    if (logError) {
      console.error('❌ Error logging credit usage:', logError);
    } else {
      console.log('✅ Credit usage logged');
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('❌ Error in useCredits:', error);
    return { success: false, error };
  }
}

// Save analysis results
export async function saveAnalysis(clerkId, analysisData) {
  console.log('💾 saveAnalysis called for user:', clerkId);
  
  if (!supabase) {
    return { success: false, error: 'Supabase not configured' };
  }
  
  try {
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', clerkId)
      .single();

    if (userError || !user) {
      console.error('User not found for analysis:', userError);
      return { success: false, error: userError || 'User not found' };
    }

    const { error: insertError } = await supabase
      .from('analyses')
      .insert({
        user_id: user.id,
        images_count: analysisData.imageCount || 1,
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

    console.log('✅ Analysis saved successfully');
    return { success: true, error: null };
  } catch (error) {
    console.error('Error saving analysis:', error);
    return { success: false, error };
  }
}

// Get user's analysis history
export async function getUserAnalyses(clerkId, limit = 10) {
  if (!supabase) {
    return { analyses: [], error: 'Supabase not configured' };
  }
  
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

// DELETE THIS ENTIRE SECTION - it's causing the duplicate export error
// export {
//   getOrCreateUser,
//   checkUserCredits,
//   useCredits,
//   saveAnalysis,
//   getUserAnalyses
// };