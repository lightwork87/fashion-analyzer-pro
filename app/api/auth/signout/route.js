// app/api/auth/signout/route.js
// Optional: Use this if you need to perform cleanup on sign out

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
    
    if (userId) {
      // Perform any cleanup tasks here
      // For example:
      
      // 1. Clear any active sessions in your database
      await supabase
        .from('user_sessions')
        .delete()
        .eq('user_id', userId);
      
      // 2. Update last seen timestamp
      await supabase
        .from('users')
        .update({ 
          last_seen: new Date().toISOString(),
          is_online: false 
        })
        .eq('clerk_id', userId);
      
      // 3. Clear any temporary data
      // Add your cleanup logic here
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Signed out successfully' 
    });
    
  } catch (error) {
    console.error('Sign out error:', error);
    return NextResponse.json(
      { error: 'Failed to sign out' },
      { status: 500 }
    );
  }
}

// To use this in your sign out button:
/*
const handleSignOut = async () => {
  setIsSigningOut(true);
  
  try {
    // Call cleanup API first
    await fetch('/api/auth/signout', { method: 'POST' });
    
    // Then sign out with Clerk
    await signOut(() => {
      router.push('/');
    });
  } catch (error) {
    console.error('Error signing out:', error);
    setIsSigningOut(false);
  }
};
*/