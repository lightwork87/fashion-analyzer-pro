// app/api/beta-signup/route.js
// COMPLETE BETA SIGNUP API ENDPOINT

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function POST(request) {
  try {
    const { userId } = await auth();
    const body = await request.json();
    const { email, name, businessType, monthlyVolume, feedback } = body;
    
    // Validate required fields
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Check if already signed up
    const { data: existing } = await supabase
      .from('beta_signups')
      .select('id')
      .eq('email', email)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'You have already signed up for the beta program' },
        { status: 400 }
      );
    }

    // Create beta signup
    const { data, error } = await supabase
      .from('beta_signups')
      .insert({
        email,
        name: name || null,
        clerk_id: userId || null,
        business_type: businessType || null,
        monthly_volume: monthlyVolume || null,
        feedback: feedback || null,
        status: 'pending',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Beta signup error:', error);
      return NextResponse.json(
        { error: 'Failed to sign up for beta' },
        { status: 500 }
      );
    }

    // Send confirmation email (optional - add your email service here)
    // await sendBetaWelcomeEmail(email, name);

    return NextResponse.json({
      success: true,
      message: 'Successfully signed up for beta program!',
      data
    });

  } catch (error) {
    console.error('Beta signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint to check beta status
export async function GET(request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ enrolled: false });
    }

    const { data } = await supabase
      .from('beta_signups')
      .select('*')
      .eq('clerk_id', userId)
      .single();

    return NextResponse.json({
      enrolled: !!data,
      status: data?.status || 'not_enrolled',
      data
    });

  } catch (error) {
    return NextResponse.json({ enrolled: false });
  }
}