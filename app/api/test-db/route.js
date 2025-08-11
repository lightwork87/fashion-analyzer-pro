import { NextResponse } from 'next/server';
import { supabase } from '../../lib/supabase';

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  // Test if we can connect after fixing the URL
  let connectionTest = 'Not tested';
  let userCount = 0;
  
  if (url && !url.includes("'") && key) {
    try {
      const { count, error } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        connectionTest = `Error: ${error.message}`;
      } else {
        connectionTest = 'Connected successfully!';
        userCount = count || 0;
      }
    } catch (err) {
      connectionTest = `Exception: ${err.message}`;
    }
  }
  
  return NextResponse.json({
    message: 'API route is working!',
    env: {
      supabaseUrl: url || 'Not set',
      supabaseKey: key ? 'Set (hidden)' : 'Not set',
      urlStartsWith: url?.startsWith('https://') ? 'Yes' : 'No',
      keyStartsWith: key?.startsWith('eyJ') ? 'Yes' : 'No',
      urlHasQuotes: url?.includes("'") || url?.includes('"') ? 'YES - THIS IS THE PROBLEM!' : 'No'
    },
    database: {
      connectionTest,
      userCount
    }
  });
}