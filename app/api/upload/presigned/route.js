import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { fileName, fileType } = await request.json();
    
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