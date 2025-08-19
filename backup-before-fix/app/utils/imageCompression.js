// Server-side compression without sharp
export async function compressImage(buffer) {
  // For server-side, just return the buffer as-is
  // Sharp is too heavy for Vercel deployment
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