// app/api/admin/add-credits/route.js - TEMPORARY FOR TESTING
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    console.log('Adding credits for user:', userId);
    
    // First check if user exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('credits')
      .eq('clerk_user_id', userId)
      .single();
    
    if (existingUser) {
      // Update existing user
      const { data, error } = await supabase
        .from('users')
        .update({ credits: 100 })
        .eq('clerk_user_id', userId)
        .select()
        .single();
        
      if (error) {
        console.error('Update error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      
      return NextResponse.json({ 
        success: true, 
        credits: 100,
        message: 'Credits updated to 100'
      });
    } else {
      // Create new user record
      const { data, error } = await supabase
        .from('users')
        .insert({ 
          clerk_user_id: userId,
          credits: 100,
          created_at: new Date().toISOString()
        })
        .select()
        .single();
        
      if (error) {
        console.error('Insert error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      
      return NextResponse.json({ 
        success: true, 
        credits: 100,
        message: 'User created with 100 credits'
      });
    }
  } catch (error) {
    console.error('Admin add credits error:', error);
    return NextResponse.json({ 
      error: 'Failed to add credits',
      details: error.message 
    }, { status: 500 });
  }
}