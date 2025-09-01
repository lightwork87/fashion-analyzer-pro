// app/api/upload/route.js - COMPLETE FILE
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { uploadImage } from '@/app/lib/storage';

export async function POST(request) {
  try {
    const { userId } = await auth();
    
    console.log('Upload route - userId:', userId);
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized - No userId' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file');
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    
    // Check file size before processing
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    if (buffer.length > 4.5 * 1024 * 1024) { // 4.5MB limit
      return NextResponse.json({ error: 'File too large. Max 4.5MB allowed' }, { status: 413 });
    }

    // Upload to storage
    const uploadResult = await uploadImage(buffer, file.name);
    
    if (!uploadResult.success) {
      return NextResponse.json({ error: uploadResult.error }, { status: 500 });
    }

    return NextResponse.json({ 
      url: uploadResult.url,
      filename: file.name,
      size: buffer.length
    });
    
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ 
      error: 'Upload failed', 
      details: error.message 
    }, { status: 500 });
  }
}