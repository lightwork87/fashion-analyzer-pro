// app/api/beta-signup/route.js
// SIMPLIFIED VERSION WITH DETAILED LOGGING

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function POST(request) {
  console.log('Beta signup endpoint called');
  
  try {
    const body = await request.json();
    console.log('Request body:', body);
    
    const { email, name, businessType, monthlyVolume, feedback } = body;
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Simple insert without checking for existing
    const { data, error } = await supabase
      .from('beta_signups')
      .insert({
        email,
        name: name || null,
        business_type: businessType || null,
        monthly_volume: monthlyVolume || null,
        feedback: feedback || null,
        status: 'pending'
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      
      // Check for duplicate email
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Email already registered' },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    console.log('Successfully created:', data);
    
    return NextResponse.json({
      success: true,
      message: 'Successfully signed up for beta program!',
      data
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ 
    status: 'ok',
    message: 'Beta signup endpoint'
  });
}