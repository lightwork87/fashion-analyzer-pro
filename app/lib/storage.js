// app/lib/storage.js  
// Fixed storage with detailed error reporting

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function uploadImage(file, userId) {
  console.log(`📤 Starting upload: ${file.name} (${Math.round(file.size/1024)}KB)`);
  
  try {
    // Validation
    if (!file) throw new Error('No file provided');
    if (!userId) throw new Error('No user ID provided');
    if (file.size > 5000000) throw new Error(`File too large: ${Math.round(file.size/1024)}KB`);
    if (!file.type.startsWith('image/')) throw new Error(`Invalid file type: ${file.type}`);
    
    // Check environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      throw new Error('Supabase URL not configured. Check environment variables.');
    }
    if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      throw new Error('Supabase key not configured. Check environment variables.');
    }
    
    // Generate filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(7);
    const extension = file.name.split('.').pop() || 'jpg';
    const fileName = `${userId}/${timestamp}-${randomString}.${extension}`;

    console.log(`📁 Uploading to: ${fileName}`);

    // Upload to Supabase
    const { data, error } = await supabase.storage
      .from('listings')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type
      });

    if (error) {
      console.error('❌ Supabase upload error:', error);
      
      if (error.message?.includes('Bucket not found')) {
        throw new Error('Storage bucket "listings" not found. Please create it in Supabase dashboard.');
      }
      if (error.message?.includes('JWT')) {
        throw new Error('Authentication failed. Check your Supabase keys.');
      }
      if (error.message?.includes('RLS')) {
        throw new Error('Storage access denied. Check your Supabase RLS policies.');
      }
      
      throw new Error(`Upload failed: ${error.message}`);
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('listings')
      .getPublicUrl(fileName);

    if (!publicUrl) {
      throw new Error('Failed to generate public URL');
    }

    console.log('✅ Upload successful:', publicUrl);
    return publicUrl;

  } catch (error) {
    console.error('❌ Upload error:', error.message);
    throw error;
  }
}

export async function deleteImage(url) {
  if (!url || !url.includes('supabase')) return;
  
  try {
    const pathParts = url.split('/storage/v1/object/public/listings/');
    if (pathParts.length === 2) {
      await supabase.storage.from('listings').remove([pathParts[1]]);
    }
  } catch (error) {
    console.warn('Delete failed:', error);
  }
}