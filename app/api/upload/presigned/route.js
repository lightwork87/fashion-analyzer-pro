import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

// DON'T initialize Supabase at module level during build
// Instead, create a function to get the client when needed
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase configuration missing');
  }
  
  return createClient(supabaseUrl, supabaseKey);
}

export async function POST(request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { fileName, fileType } = await request.json();
    
    // Initialize Supabase only when the function runs
    let supabase;
    try {
      supabase = getSupabaseClient();
    } catch (error) {
      console.error('Supabase init error:', error);
      return NextResponse.json(
        { error: 'Storage service not configured' }, 
        { status: 500 }
      );
    }
    
    // Generate unique file name
    const uniqueFileName = `${userId}/${Date.now()}-${fileName}`;
    
    // Create signed upload URL for Supabase Storage
    const { data, error } = await supabase.storage
      .from('fashion-images')
      .createSignedUploadUrl(uniqueFileName);

    if (error) {
      console.error('Presigned URL error:', error);
      return NextResponse.json({ error: 'Failed to generate upload URL' }, { status: 500 });
    }

    return NextResponse.json({
      uploadUrl: data.signedUrl,
      token: data.token,
      path: uniqueFileName
    });

  } catch (error) {
    console.error('Upload presigned error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}