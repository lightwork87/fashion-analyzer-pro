import { NextResponse } from 'next/server';

export async function GET() {
  // Don't try to connect to Supabase yet, just check env vars
  return NextResponse.json({
    message: 'API route is working!',
    env: {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || 'Not set',
      supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set (hidden)' : 'Not set',
      urlStartsWith: process.env.NEXT_PUBLIC_SUPABASE_URL?.startsWith('https://') ? 'Yes' : 'No',
      keyStartsWith: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.startsWith('eyJ') ? 'Yes' : 'No'
    }
  });
}