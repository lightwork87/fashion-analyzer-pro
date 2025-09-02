export const dynamic = "force-dynamic";
// app/api/user/credits/route.js - COMPLETE FIXED VERSION
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

// Add dynamic export to prevent static generation issues
export const dynamic = 'force-dynamic';

// Initialize Supabase client with proper error handling
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase configuration is missing');
  }

  return createClient(supabaseUrl, supabaseKey);
}

// Get or create user in database
async function ensureUserExists(supabase, userId, userEmail = null) {
  try {
    // Try to get existing user
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('clerk_id', userId)
      .single();

    if (existingUser) {
      return existingUser;
    }

    // If user doesn't exist, create them
    if (fetchError && fetchError.code === 'PGRST116') {
      console.log('🔨 Creating new user in database:', userId);
      
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          clerk_id: userId,
          email: userEmail,
          credits_remaining: 5, // Give new users 5 free credits
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (createError) {
        throw createError;
      }

      return newUser;
    }

    throw fetchError;
  } catch (error) {
    console.error('❌ Error ensuring user exists:', error);
    throw error;
  }
}

export async function GET() {
  try {
    console.log('💳 User Credits Route - GET request');
    
    // Check authentication
    const { userId } = auth();
    
    if (!userId) {
      console.log('❌ User Credits: No authenticated user');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    console.log('✅ User authenticated:', userId);

    // Initialize Supabase
    const supabase = getSupabaseClient();
    
    // Ensure user exists and get their data
    const userData = await ensureUserExists(supabase, userId);
    
    console.log('✅ User data retrieved:', {
      id: userData.id,
      credits: userData.credits_remaining
    });

    return NextResponse.json({
      success: true,
      credits: userData.credits_remaining || 0,
      userId: userData.clerk_id,
      email: userData.email
    });

  } catch (error) {
    console.error('❌ User Credits GET Error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch user credits',
        details: error.message
      },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    console.log('💳 User Credits Route - POST request');
    
    // Check authentication
    const { userId } = auth();
    
    if (!userId) {
      console.log('❌ User Credits: No authenticated user');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    const { action, amount, reason } = body;

    if (!action || !amount) {
      return NextResponse.json(
        { error: 'Action and amount are required' },
        { status: 400 }
      );
    }

    // Initialize Supabase
    const supabase = getSupabaseClient();
    
    // Ensure user exists
    const userData = await ensureUserExists(supabase, userId);
    
    let newCredits;
    
    // Handle different credit actions
    switch (action) {
      case 'add':
        newCredits = (userData.credits_remaining || 0) + parseInt(amount);
        break;
        
      case 'subtract':
        newCredits = Math.max(0, (userData.credits_remaining || 0) - parseInt(amount));
        break;
        
      case 'set':
        newCredits = parseInt(amount);
        break;
        
      default:
        return NextResponse.json(
          { error: 'Invalid action. Use "add", "subtract", or "set"' },
          { status: 400 }
        );
    }

    // Update user credits
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({ 
        credits_remaining: newCredits,
        updated_at: new Date().toISOString()
      })
      .eq('clerk_id', userId)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    // Log the credit transaction
    try {
      await supabase
        .from('credit_transactions')
        .insert({
          user_id: updatedUser.id,
          action,
          amount: parseInt(amount),
          previous_balance: userData.credits_remaining || 0,
          new_balance: newCredits,
          reason: reason || `Credits ${action}`,
          created_at: new Date().toISOString()
        });
    } catch (logError) {
      console.warn('⚠️ Failed to log credit transaction:', logError);
      // Don't fail the request if logging fails
    }

    console.log('✅ Credits updated successfully:', {
      userId,
      action,
      amount,
      previousBalance: userData.credits_remaining,
      newBalance: newCredits
    });

    return NextResponse.json({
      success: true,
      credits: newCredits,
      previousCredits: userData.credits_remaining || 0,
      action,
      amount: parseInt(amount)
    });

  } catch (error) {
    console.error('❌ User Credits POST Error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to update user credits',
        details: error.message
      },
      { status: 500 }
    );
  }
}