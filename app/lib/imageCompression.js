// app/lib/imageCompression.js - NEW FILE
export async function compressImage(file, maxWidth = 1200, maxHeight = 1200, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Calculate new dimensions
        if (width > height) {
          if (width > maxWidth) {
            height = height * (maxWidth / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = width * (maxHeight / height);
            height = maxHeight;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              // Create new file with compressed blob
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              reject(new Error('Compression failed'));
            }
          },
          'image/jpeg',
          quality
        );
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target.result;
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

export async function compressMultipleImages(files, maxSizeKB = 500) {
  const compressed = [];
  
  for (const file of files) {
    try {
      // Start with high quality
      let quality = 0.9;
      let compressedFile = await compressImage(file, 1200, 1200, quality);
      
      // Keep reducing quality if still too large
      while (compressedFile.size > maxSizeKB * 1024 && quality > 0.1) {
        quality -= 0.1;
        compressedFile = await compressImage(file, 1200, 1200, quality);
      }
      
      console.log(`Compressed ${file.name}: ${(file.size / 1024).toFixed(2)}KB → ${(compressedFile.size / 1024).toFixed(2)}KB`);
      compressed.push(compressedFile);
    } catch (error) {
      console.error(`Failed to compress ${file.name}:`, error);
      compressed.push(file); // Use original if compression fails
    }
  }
  
  return compressed;
}