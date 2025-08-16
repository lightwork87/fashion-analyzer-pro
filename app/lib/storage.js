// app/lib/storage.js
// Supabase storage utility

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function uploadImage(file, userId) {
  try {
    // Create unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(7);
    const extension = file.name.split('.').pop();
    const fileName = `${userId}/${timestamp}-${randomString}.${extension}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('listings')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('listings')
      .getPublicUrl(fileName);

    return publicUrl;
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
}

export async function deleteImage(url) {
  try {
    // Extract path from URL
    const path = url.split('/storage/v1/object/public/listings/')[1];
    if (!path) return;

    const { error } = await supabase.storage
      .from('listings')
      .remove([path]);

    if (error) throw error;
  } catch (error) {
    console.error('Delete error:', error);
  }
}