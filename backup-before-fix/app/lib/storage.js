// app/lib/storage.js - COMPLETE FILE
import { createClient } from './supabase-client';

export async function uploadImage(file, userId) {
  const supabase = createClient();
  
  // Generate unique filename
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
  
  // Upload to Supabase storage
  const { data, error } = await supabase.storage
    .from('listings')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
    });
  
  if (error) {
    console.error('Upload error:', error);
    throw new Error('Failed to upload image');
  }
  
  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('listings')
    .getPublicUrl(fileName);
  
  return publicUrl;
}

export async function deleteImage(url) {
  const supabase = createClient();
  
  // Extract file path from URL
  const urlParts = url.split('/');
  const filePath = urlParts.slice(-2).join('/'); // Gets userId/filename
  
  const { error } = await supabase.storage
    .from('listings')
    .remove([filePath]);
  
  if (error) {
    console.error('Delete error:', error);
    throw new Error('Failed to delete image');
  }
  
  return true;
}

export async function uploadMultipleImages(files, userId) {
  const uploadPromises = files.map(file => uploadImage(file, userId));
  
  try {
    const urls = await Promise.all(uploadPromises);
    return urls;
  } catch (error) {
    console.error('Multiple upload error:', error);
    throw new Error('Failed to upload some images');
  }
}