// app/lib/storage.js  
// Simplified storage with reliable fallback

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase with better error handling
const supabase = (() => {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!url || !key) {
      console.warn('⚠️ Supabase not configured - using fallback storage');
      return null;
    }
    
    return createClient(url, key);
  } catch (error) {
    console.warn('⚠️ Supabase init failed - using fallback storage');
    return null;
  }
})();

// Main upload function with automatic fallback
export async function uploadImage(file, userId) {
  console.log(`📤 Uploading: ${file.name} (${Math.round(file.size/1024)}KB)`);
  
  // Validation
  if (!file || !userId) {
    throw new Error('Missing file or user ID');
  }
  
  if (file.size > 5000000) {
    throw new Error(`File too large: ${Math.round(file.size/1024)}KB. Max 5MB allowed.`);
  }
  
  if (!file.type.startsWith('image/')) {
    throw new Error('Only image files are allowed');
  }
  
  // Try Supabase first (if configured)
  if (supabase) {
    try {
      const result = await uploadToSupabase(file, userId);
      if (result) {
        console.log('✅ Supabase upload successful');
        return result;
      }
    } catch (error) {
      console.warn('⚠️ Supabase failed, using fallback:', error.message);
    }
  }
  
  // Fallback: Create blob URL (works entirely in browser)
  try {
    const blobUrl = URL.createObjectURL(file);
    console.log('✅ Blob URL created as fallback');
    
    // Store file reference for later use
    if (typeof window !== 'undefined') {
      window.tempFiles = window.tempFiles || new Map();
      window.tempFiles.set(blobUrl, {
        file: file,
        userId: userId,
        created: Date.now()
      });
    }
    
    return blobUrl;
    
  } catch (error) {
    throw new Error('All upload methods failed: ' + error.message);
  }
}

// Supabase upload with proper error handling
async function uploadToSupabase(file, userId) {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(7);
  const extension = file.name.split('.').pop() || 'jpg';
  const fileName = `${userId}/${timestamp}-${randomString}.${extension}`;

  console.log('📁 Uploading to Supabase:', fileName);

  const { data, error } = await supabase.storage
    .from('listings')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) {
    console.error('❌ Supabase error:', error);
    throw error;
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('listings')
    .getPublicUrl(fileName);

  if (!publicUrl) {
    throw new Error('Failed to get public URL');
  }

  return publicUrl;
}

// Convert blob URL back to file for analysis
export function getBlobFile(blobUrl) {
  if (typeof window === 'undefined' || !window.tempFiles) {
    return null;
  }
  
  const fileData = window.tempFiles.get(blobUrl);
  return fileData?.file || null;
}

// Clean up blob URLs
export function cleanupBlobUrls() {
  if (typeof window === 'undefined' || !window.tempFiles) {
    return;
  }
  
  const oneHour = 60 * 60 * 1000;
  const now = Date.now();
  
  for (const [blobUrl, data] of window.tempFiles.entries()) {
    if (now - data.created > oneHour) {
      URL.revokeObjectURL(blobUrl);
      window.tempFiles.delete(blobUrl);
      console.log('🧹 Cleaned up old blob URL');
    }
  }
}

// Test storage connection
export async function testStorageConnection() {
  const results = {
    supabase: { connected: false },
    fallback: { available: true }
  };
  
  if (supabase) {
    try {
      const { data, error } = await supabase.storage.listBuckets();
      
      if (!error) {
        const listingsBucket = data?.find(bucket => bucket.name === 'listings');
        results.supabase = {
          connected: true,
          bucketsFound: data?.length || 0,
          listingsBucketExists: !!listingsBucket
        };
      } else {
        results.supabase = {
          connected: false,
          error: error.message
        };
      }
    } catch (error) {
      results.supabase = {
        connected: false,
        error: error.message
      };
    }
  }
  
  return results;
}

// Delete image (cleanup)
export async function deleteImage(url) {
  try {
    if (url.startsWith('blob:')) {
      // Clean up blob URL
      URL.revokeObjectURL(url);
      if (typeof window !== 'undefined' && window.tempFiles) {
        window.tempFiles.delete(url);
      }
      console.log('✅ Blob URL cleaned up');
    } else if (supabase && url.includes('supabase')) {
      // Delete from Supabase
      const pathParts = url.split('/storage/v1/object/public/listings/');
      if (pathParts.length === 2) {
        const { error } = await supabase.storage
          .from('listings')
          .remove([pathParts[1]]);
        
        if (!error) {
          console.log('✅ File deleted from Supabase');
        }
      }
    }
  } catch (error) {
    console.warn('Delete failed:', error);
  }
}

// Initialize cleanup on page load
if (typeof window !== 'undefined') {
  // Clean up old blob URLs when page loads
  setTimeout(cleanupBlobUrls, 1000);
  
  // Set up periodic cleanup
  setInterval(cleanupBlobUrls, 5 * 60 * 1000); // Every 5 minutes
}