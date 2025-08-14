const compressImage = async (file) => {
  // Add type checking
  if (!file || !(file instanceof File)) {
    console.error('Invalid file object:', file);
    return null;
  }

  return new Promise((resolve, reject) => {
    try {
      const reader = new FileReader();
      
      reader.onerror = (error) => {
        console.error('FileReader error:', error);
        reject(error);
      };
      
      reader.onload = (event) => {
        if (!event?.target?.result) {
          reject(new Error('No file data'));
          return;
        }
        
        const img = new Image();
        
        img.onerror = () => {
          console.error('Image load error');
          reject(new Error('Image load failed'));
        };
        
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            if (!canvas) {
              reject(new Error('Canvas creation failed'));
              return;
            }
            
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              reject(new Error('Canvas context failed'));
              return;
            }
            
            // Rest of the compression logic...
            let width = img.width;
            let height = img.height;
            const maxSize = 600;
            
            if (width > height && width > maxSize) {
              height = (height / width) * maxSize;
              width = maxSize;
            } else if (height > maxSize) {
              width = (width / height) * maxSize;
              height = maxSize;
            }
            
            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);
            
            // Use callback pattern for toBlob
            canvas.toBlob((blob) => {
              if (!blob) {
                reject(new Error('Blob creation failed'));
                return;
              }
              
              resolve({
                blob: blob,
                preview: canvas.toDataURL('image/jpeg', 0.6),
                file: new File([blob], file.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now()
                }),
                name: file.name,
                originalFile: file,
                size: blob.size
              });
            }, 'image/jpeg', 0.6);
            
          } catch (canvasError) {
            console.error('Canvas processing error:', canvasError);
            reject(canvasError);
          }
        };
        
        img.src = event.target.result;
      };
      
      reader.readAsDataURL(file);
      
    } catch (error) {
      console.error('Compress image error:', error);
      reject(error);
    }
  });
};