// imageCompression.js - More aggressive client-side image compression

export async function compressImage(file, maxSizeKB = 150) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        // Start with reasonable dimensions
        let maxWidth = 1200;
        let maxHeight = 1200;
        let quality = 0.8;
        
        const attemptCompression = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Calculate new dimensions while maintaining aspect ratio
          if (width > height) {
            if (width > maxWidth) {
              height = Math.round(height * (maxWidth / width));
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round(width * (maxHeight / height));
              height = maxHeight;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          // Convert to blob with quality setting
          canvas.toBlob(
            (blob) => {
              const sizeKB = blob.size / 1024;
              console.log(`Compression attempt: ${width}x${height}, quality: ${quality}, size: ${sizeKB.toFixed(2)}KB`);
              
              // If still too large, try again with lower settings
              if (sizeKB > maxSizeKB) {
                if (quality > 0.3) {
                  // First try reducing quality
                  quality -= 0.1;
                  attemptCompression();
                } else if (maxWidth > 400) {
                  // Then try reducing dimensions
                  maxWidth = Math.round(maxWidth * 0.8);
                  maxHeight = Math.round(maxHeight * 0.8);
                  quality = 0.7; // Reset quality for new dimensions
                  attemptCompression();
                } else {
                  // Last resort: very small image
                  maxWidth = 300;
                  maxHeight = 300;
                  quality = 0.5;
                  attemptCompression();
                }
              } else {
                // Success! File is small enough
                resolve(new File([blob], file.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                }));
              }
            },
            'image/jpeg',
            quality
          );
        };
        
        attemptCompression();
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target.result;
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

export async function compressMultipleImages(files, onProgress) {
  const compressed = [];
  
  for (let i = 0; i < files.length; i++) {
    try {
      if (onProgress) {
        onProgress(i + 1, files.length, files[i].name);
      }
      
      console.log(`Starting compression of ${files[i].name} (${(files[i].size / 1024 / 1024).toFixed(2)}MB)`);
      
      const compressedFile = await compressImage(files[i], 140); // Target 140KB to be safe
      
      console.log(`✅ Compressed ${files[i].name}: ${(files[i].size / 1024).toFixed(2)}KB → ${(compressedFile.size / 1024).toFixed(2)}KB`);
      
      compressed.push(compressedFile);
    } catch (error) {
      console.error(`Failed to compress ${files[i].name}:`, error);
      // Try one more time with very aggressive settings
      try {
        const aggressiveFile = await compressImage(files[i], 100);
        compressed.push(aggressiveFile);
      } catch (e) {
        console.error(`Even aggressive compression failed for ${files[i].name}`);
        compressed.push(files[i]); // Use original as last resort
      }
    }
  }
  
  return compressed;
}

// Quick test function to check compression
export async function testCompression(file) {
  console.log(`Testing compression for ${file.name}`);
  console.log(`Original size: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
  
  const compressed = await compressImage(file, 140);
  console.log(`Compressed size: ${(compressed.size / 1024).toFixed(2)}KB`);
  
  return compressed;
}