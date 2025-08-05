export async function compressImage(file, maxWidth = 1200, maxHeight = 1200, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Calculate new dimensions while maintaining aspect ratio
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to base64 with reduced quality
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        
        // Log compression results
        const originalSize = file.size / 1024; // KB
        const compressedSize = (compressedBase64.length * 0.75) / 1024; // Approximate KB
        const compressionRatio = ((originalSize - compressedSize) / originalSize * 100).toFixed(1);
        
        console.log(`Image compressed: ${originalSize.toFixed(1)}KB → ${compressedSize.toFixed(1)}KB (${compressionRatio}% reduction)`);
        
        resolve(compressedBase64);
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
      
      img.src = e.target.result;
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsDataURL(file);
  });
}

export function batchCompressImages(files, maxWidth = 1200, maxHeight = 1200, quality = 0.8) {
  return Promise.all(
    Array.from(files).map(file => compressImage(file, maxWidth, maxHeight, quality))
  );
}

// Helper to check if compression is needed
export function shouldCompressImage(file) {
  const MAX_SIZE_KB = 500; // Compress if larger than 500KB
  const sizeKB = file.size / 1024;
  return sizeKB > MAX_SIZE_KB;
}

// More aggressive compression for very large images
export async function aggressiveCompress(file) {
  // First try normal compression
  let compressed = await compressImage(file, 1200, 1200, 0.8);
  let sizeKB = (compressed.length * 0.75) / 1024;
  
  // If still too large, compress more
  if (sizeKB > 300) {
    compressed = await compressImage(file, 800, 800, 0.6);
  }
  
  return compressed;
}