import sharp from 'sharp';

export async function compressImage(buffer) {
  try {
    // Use sharp if available, otherwise return original
    if (typeof sharp !== 'undefined') {
      const compressed = await sharp(buffer)
        .resize(1200, 1200, { 
          fit: 'inside',
          withoutEnlargement: true 
        })
        .jpeg({ quality: 85 })
        .toBuffer();
      
      return compressed;
    }
  } catch (error) {
    console.error('Sharp compression failed:', error);
  }
  
  // Return original if compression fails
  return buffer;
}

// Browser-compatible version for client-side
export async function compressImageClient(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Calculate new dimensions
        let width = img.width;
        let height = img.height;
        const maxSize = 1200;
        
        if (width > height && width > maxSize) {
          height = (height * maxSize) / width;
          width = maxSize;
        } else if (height > maxSize) {
          width = (width * maxSize) / height;
          height = maxSize;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => resolve(blob),
          'image/jpeg',
          0.85
        );
      };
      
      img.src = e.target.result;
    };
    
    reader.readAsDataURL(file);
  });
}