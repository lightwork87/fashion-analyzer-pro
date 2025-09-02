export const dynamic = 'force-dynamic';

import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

function createSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables');
  }
  
  return createClient(supabaseUrl, supabaseKey);
}

export async function GET() {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createSupabaseClient();
    
    const { data: userData, error } = await supabase
      .from('users')
      .select('credits_remaining')
      .eq('clerk_id', userId)
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return Response.json({ error: 'Database error' }, { status: 500 });
    }

    return Response.json({ 
      credits: userData?.credits_remaining || 0,
      userId: userId,
      debug: true,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Debug credits error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}