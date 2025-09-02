export const dynamic = 'force-dynamic';

import { auth } from '@clerk/nextjs';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET() {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

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