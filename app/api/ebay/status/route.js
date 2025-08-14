import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabase } from '../../../lib/supabase';

export const dynamic = 'force-dynamic';
export async function GET(request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ connected: false });
    }
    
    // Get user from Clerk ID
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single();
    
    if (!user) {
      return NextResponse.json({ connected: false });
    }
    
    // Check if user has eBay tokens
    const { data: tokens } = await supabase
      .from('ebay_tokens')
      .select('expires_at')
      .eq('user_id', user.id)
      .single();
    
    if (!tokens) {
      return NextResponse.json({ connected: false });
    }
    
    // Check if token is still valid
    const isValid = new Date(tokens.expires_at) > new Date();
    
    return NextResponse.json({ connected: isValid });
    
  } catch (error) {
    console.error('Status check error:', error);
    return NextResponse.json({ connected: false });
  }
}