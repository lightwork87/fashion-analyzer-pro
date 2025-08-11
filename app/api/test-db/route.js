import { NextResponse } from 'next/server';
import { supabase } from '../../lib/supabase';

export async function GET() {
  try {
    // Test 1: Can we connect?
    const { data: testConnection, error: connectionError } = await supabase
      .from('users')
      .select('count');
    
    // Test 2: Try to insert
    const testId = `test_${Date.now()}`;
    const { data: insertData, error: insertError } = await supabase
      .from('users')
      .insert({
        clerk_id: testId,
        email: `${testId}@test.com`,
        credits_total: 10,
        credits_used: 0,
        subscription_status: 'free',
        subscription_plan: 'free'
      })
      .select();
    
    // Test 3: Read back
    const { data: allUsers, error: readError } = await supabase
      .from('users')
      .select('*')
      .limit(5);
    
    return NextResponse.json({
      connection: connectionError ? `Error: ${connectionError.message}` : 'Connected',
      insert: insertError ? `Error: ${insertError.message}` : insertData,
      users: readError ? `Error: ${readError.message}` : allUsers,
      env: {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing',
        key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Missing'
      }
    });
  } catch (error) {
    return NextResponse.json({ error: error.message });
  }
}