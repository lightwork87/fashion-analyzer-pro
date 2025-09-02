export const dynamic = 'force-dynamic';

import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

function initializeSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing required Supabase environment variables');
  }
  
  return createClient(supabaseUrl, supabaseKey);
}

export async function GET() {
  try {
    // Initialize Supabase with error handling
    const supabase = initializeSupabase();

    // Get authenticated user
    const { userId } = auth();
    
    if (!userId) {
      return Response.json({ 
        error: 'Unauthorized access' 
      }, { status: 401 });
    }

    // Fetch user credits from database
    const { data: userData, error: fetchError } = await supabase
      .from('users')
      .select(`
        credits_remaining, 
        subscription_status, 
        subscription_credits,
        email,
        created_at,
        updated_at
      `)
      .eq('clerk_id', userId)
      .single();

    if (fetchError) {
      console.error('User credits fetch error:', fetchError);
      
      // Handle user not found
      if (fetchError.code === 'PGRST116') {
        // Create user if doesn't exist
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert({
            clerk_id: userId,
            credits_remaining: 5, // Default starter credits
            subscription_status: 'free',
            subscription_credits: 0
          })
          .select()
          .single();

        if (createError) {
          console.error('User creation error:', createError);
          return Response.json({ 
            error: 'Failed to create user record' 
          }, { status: 500 });
        }

        return Response.json({
          credits: newUser.credits_remaining,
          subscriptionStatus: newUser.subscription_status,
          subscriptionCredits: newUser.subscription_credits,
          userId: userId,
          isNewUser: true
        });
      }
      
      return Response.json({ 
        error: 'Database query failed',
        details: fetchError.message 
      }, { status: 500 });
    }

    // Return user credit information
    return Response.json({
      credits: userData.credits_remaining || 0,
      subscriptionStatus: userData.subscription_status || 'free',
      subscriptionCredits: userData.subscription_credits || 0,
      userId: userId,
      userEmail: userData.email,
      accountCreated: userData.created_at,
      lastUpdated: userData.updated_at
    });
    
  } catch (error) {
    console.error('GET /api/user/credits error:', error);
    return Response.json({ 
      error: 'Internal server error',
      message: error.message 
    }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    // Initialize Supabase
    const supabase = initializeSupabase();

    // Get authenticated user
    const { userId } = auth();
    
    if (!userId) {
      return Response.json({ 
        error: 'Unauthorized access' 
      }, { status: 401 });
    }

    // Parse request body
    let requestData;
    try {
      requestData = await request.json();
    } catch (parseError) {
      return Response.json({ 
        error: 'Invalid JSON in request body' 
      }, { status: 400 });
    }

    const { action, amount } = requestData;

    // Validate required fields
    if (!action) {
      return Response.json({ 
        error: 'Missing required field: action' 
      }, { status: 400 });
    }

    // Handle credit deduction
    if (action === 'deduct') {
      if (!amount || typeof amount !== 'number' || amount <= 0) {
        return Response.json({ 
          error: 'Invalid amount - must be a positive number' 
        }, { status: 400 });
      }

      // Check current credits first
      const { data: currentUser, error: fetchError } = await supabase
        .from('users')
        .select('credits_remaining')
        .eq('clerk_id', userId)
        .single();

      if (fetchError) {
        console.error('Failed to fetch current credits:', fetchError);
        return Response.json({ 
          error: 'Failed to verify current credits' 
        }, { status: 500 });
      }

      // Check if user has enough credits
      if (currentUser.credits_remaining < amount) {
        return Response.json({ 
          error: 'Insufficient credits',
          available: currentUser.credits_remaining,
          required: amount 
        }, { status: 400 });
      }

      // Deduct credits using atomic update
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update({ 
          credits_remaining: currentUser.credits_remaining - amount,
          updated_at: new Date().toISOString()
        })
        .eq('clerk_id', userId)
        .select('credits_remaining')
        .single();

      if (updateError) {
        console.error('Credit deduction error:', updateError);
        return Response.json({ 
          error: 'Failed to deduct credits' 
        }, { status: 500 });
      }

      return Response.json({
        success: true,
        action: 'deduct',
        amount: amount,
        remainingCredits: updatedUser.credits_remaining,
        timestamp: new Date().toISOString()
      });
    }

    // Handle credit addition
    if (action === 'add') {
      if (!amount || typeof amount !== 'number' || amount <= 0) {
        return Response.json({ 
          error: 'Invalid amount - must be a positive number' 
        }, { status: 400 });
      }

      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update({ 
          credits_remaining: supabase.raw(`credits_remaining + ${amount}`),
          updated_at: new Date().toISOString()
        })
        .eq('clerk_id', userId)
        .select('credits_remaining')
        .single();

      if (updateError) {
        console.error('Credit addition error:', updateError);
        return Response.json({ 
          error: 'Failed to add credits' 
        }, { status: 500 });
      }

      return Response.json({
        success: true,
        action: 'add',
        amount: amount,
        remainingCredits: updatedUser.credits_remaining,
        timestamp: new Date().toISOString()
      });
    }

    // Handle unsupported actions
    return Response.json({ 
      error: `Unsupported action: ${action}`,
      supportedActions: ['deduct', 'add']
    }, { status: 400 });
    
  } catch (error) {
    console.error('POST /api/user/credits error:', error);
    return Response.json({ 
      error: 'Internal server error',
      message: error.message 
    }, { status: 500 });
  }
}