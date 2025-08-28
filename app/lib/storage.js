// app/lib/storage.js
// Supabase storage utility with enhanced error handling

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function uploadImage(file, userId) {
  try {
    console.log(`📤 Uploading: ${file.name}, Size: ${Math.round(file.size/1024)}KB, Type: ${file.type}`);
    
    // Validate file
    if (!file) {
      throw new Error('No file provided');
    }
    
    if (file.size > 5000000) { // 5MB limit
      throw new Error(`File too large: ${Math.round(file.size/1024)}KB. Maximum 5MB allowed.`);
    }
    
    if (!file.type.startsWith('image/')) {
      throw new Error(`Invalid file type: ${file.type}. Only images allowed.`);
    }
    
    // Create unique filename with timestamp and random string
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(7);
    const extension = file.type === 'image/jpeg' ? 'jpg' : 
                     file.type === 'image/png' ? 'png' : 
                     file.type === 'image/webp' ? 'webp' : 'jpg';
    
    const fileName = `${userId}/${timestamp}-${randomString}.${extension}`;

    console.log(`📁 Uploading to path: ${fileName}`);

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('listings')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type
      });

    if (error) {
      console.error('❌ Supabase upload error:', error);
      throw new Error(`Upload failed: ${error.message}`);
    }

    console.log('✅ Upload successful:', data.path);

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('listings')
      .getPublicUrl(fileName);

    if (!publicUrl) {
      throw new Error('Failed to get public URL');
    }

    console.log('🔗 Public URL generated:', publicUrl);

    // Verify the URL is accessible
    try {
      const testResponse = await fetch(publicUrl, { method: 'HEAD' });
      if (!testResponse.ok) {
        console.warn('⚠️ Warning: Uploaded file may not be immediately accessible');
      }
    } catch (e) {
      console.warn('⚠️ Warning: Could not verify upload accessibility');
    }

    return publicUrl;
    
  } catch (error) {
    console.error('❌ Upload error:', error);
    throw error;
  }
}

export async function deleteImage(url) {
  try {
    if (!url) return;
    
    console.log('🗑️ Deleting image:', url);
    
    // Extract path from URL
    // URL format: https://[project].supabase.co/storage/v1/object/public/listings/path
    const urlParts = url.split('/storage/v1/object/public/listings/');
    if (urlParts.length !== 2) {
      console.warn('⚠️ Could not parse URL for deletion:', url);
      return;
    }
    
    const path = urlParts[1];
    console.log('📁 Deleting path:', path);

    const { error } = await supabase.storage
      .from('listings')
      .remove([path]);

    if (error) {
      console.error('❌ Delete error:', error);
      throw error;
    }
    
    console.log('✅ Image deleted successfully');
    
  } catch (error) {
    console.error('❌ Delete error:', error);
    // Don't throw - deletion failures shouldn't break the flow
  }
}

export async function uploadMultipleImages(files, userId, onProgress) {
  const results = [];
  const errors = [];
  
  console.log(`📤 Uploading ${files.length} images for user ${userId}`);
  
  for (let i = 0; i < files.length; i++) {
    try {
      if (onProgress) {
        onProgress(i, files.length);
      }
      
      const url = await uploadImage(files[i], userId);
      results.push({
        file: files[i],
        url: url,
        success: true
      });
      
    } catch (error) {
      console.error(`❌ Failed to upload ${files[i].name}:`, error);
      errors.push({
        file: files[i],
        error: error.message,
        success: false
      });
    }
  }
  
  console.log(`✅ Upload complete: ${results.length} successful, ${errors.length} failed`);
  
  return {
    successful: results,
    failed: errors,
    totalUploaded: results.length
  };
}

// Test storage connection
export async function testStorageConnection() {
  try {
    const { data, error } = await supabase.storage.listBuckets();
    
    if (error) {
      throw error;
    }
    
    const listingsBucket = data.find(bucket => bucket.name === 'listings');
    
    return {
      connected: true,
      bucketsFound: data.length,
      listingsBucketExists: !!listingsBucket,
      buckets: data.map(b => b.name)
    };
    
  } catch (error) {
    return {
      connected: false,
      error: error.message
    };
  }
}

// Get storage stats
export async function getStorageStats(userId) {
  try {
    const { data, error } = await supabase.storage
      .from('listings')
      .list(userId, {
        limit: 1000,
        sortBy: { column: 'created_at', order: 'desc' }
      });
      
    if (error) throw error;
    
    const totalFiles = data.length;
    const totalSize = data.reduce((sum, file) => sum + (file.metadata?.size || 0), 0);
    
    return {
      totalFiles,
      totalSize,
      totalSizeMB: Math.round(totalSize / 1024 / 1024 * 100) / 100,
      files: data
    };
    
  } catch (error) {
    console.error('❌ Storage stats error:', error);
    return {
      totalFiles: 0,
      totalSize: 0,
      totalSizeMB: 0,
      files: [],
      error: error.message
    };
  }
}