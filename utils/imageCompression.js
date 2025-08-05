// utils/imageCompression.js
// Complete image compression utility for Claude API compatibility

export class ImageCompressor {
  constructor() {
    this.maxFileSize = 4.5 * 1024 * 1024; // 4.5MB (safe under Claude's 5MB limit)
    this.maxDimension = 2048; // Max width/height
    this.compressionQuality = 0.8; // Starting quality
  }

  async compressImage(file) {
    return new Promise((resolve, reject) => {
      // If already small enough, use as-is
      if (file.size <= this.maxFileSize) {
        this.fileToBase64(file).then(resolve).catch(reject);
        return;
      }

      console.log(`🔧 Compressing: ${file.name} (${Math.round(file.size/1024)}KB → target: ${Math.round(this.maxFileSize/1024)}KB)`);

      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      img.onload = () => {
        // Calculate new dimensions
        const { width, height } = this.calculateDimensions(img.width, img.height);
        
        canvas.width = width;
        canvas.height = height;

        // Draw image on canvas
        ctx.drawImage(img, 0, 0, width, height);
        
        // Compress to target size
        this.compressToTarget(canvas, file.name)
          .then(resolve)
          .catch(reject);
      };

      img.onerror = () => reject(new Error(`Failed to load image: ${file.name}`));
      img.src = URL.createObjectURL(file);
    });
  }

  calculateDimensions(width, height) {
    // If already small enough, don't resize
    if (width <= this.maxDimension && height <= this.maxDimension) {
      return { width, height };
    }

    // Calculate scaling to fit within max dimension
    const scale = Math.min(this.maxDimension / width, this.maxDimension / height);
    
    return {
      width: Math.round(width * scale),
      height: Math.round(height * scale)
    };
  }

  async compressToTarget(canvas, fileName) {
    let quality = this.compressionQuality;
    let attempts = 0;
    const maxAttempts = 5;

    while (attempts < maxAttempts) {
      const dataUrl = canvas.toDataURL('image/jpeg', quality);
      const base64Data = dataUrl.split(',')[1];
      const sizeInBytes = (base64Data.length * 3) / 4; // Convert base64 to bytes

      console.log(`📏 Attempt ${attempts + 1}: ${Math.round(sizeInBytes/1024)}KB at ${Math.round(quality*100)}% quality`);

      if (sizeInBytes <= this.maxFileSize) {
        console.log(`✅ Compression successful: ${fileName} → ${Math.round(sizeInBytes/1024)}KB`);
        return {
          dataUrl,
          base64Data,
          originalSize: canvas.width * canvas.height,
          compressedSize: sizeInBytes,
          compressionRatio: Math.round((1 - sizeInBytes / (canvas.width * canvas.height)) * 100)
        };
      }

      // Reduce quality for next attempt
      quality *= 0.7;
      attempts++;
    }

    throw new Error(`Could not compress ${fileName} to required size after ${maxAttempts} attempts`);
  }

  async fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target.result;
        const base64Data = dataUrl.split(',')[1];
        resolve({
          dataUrl,
          base64Data,
          originalSize: file.size,
          compressedSize: file.size,
          compressionRatio: 0 // No compression needed
        });
      };
      reader.onerror = () => reject(new Error(`Failed to read file: ${file.name}`));
      reader.readAsDataURL(file);
    });
  }

  // Batch compress multiple images
  async compressImages(files, onProgress = null) {
    const results = [];
    const errors = [];

    for (let i = 0; i < files.length; i++) {
      try {
        if (onProgress) {
          onProgress({
            current: i + 1,
            total: files.length,
            fileName: files[i].name,
            status: 'compressing'
          });
        }

        const compressed = await this.compressImage(files[i]);
        results.push({
          file: files[i],
          compressed,
          success: true
        });

        if (onProgress) {
          onProgress({
            current: i + 1,
            total: files.length,
            fileName: files[i].name,
            status: 'complete',
            compressedSize: compressed.compressedSize
          });
        }

      } catch (error) {
        console.error(`❌ Compression failed for ${files[i].name}:`, error);
        errors.push({
          file: files[i],
          error: error.message
        });

        if (onProgress) {
          onProgress({
            current: i + 1,
            total: files.length,
            fileName: files[i].name,
            status: 'error',
            error: error.message
          });
        }
      }
    }

    return {
      successful: results,
      failed: errors,
      totalProcessed: files.length,
      successCount: results.length,
      failureCount: errors.length
    };
  }

  // Validate file before processing
  validateFile(file) {
    const maxOriginalSize = 50 * 1024 * 1024; // 50MB original limit
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `Unsupported file type: ${file.type}. Please use JPEG, PNG, or WebP.`
      };
    }

    if (file.size > maxOriginalSize) {
      return {
        valid: false,
        error: `File too large: ${Math.round(file.size/1024/1024)}MB. Maximum original size is 50MB.`
      };
    }

    return { valid: true };
  }

  // Get compression statistics
  getCompressionStats(results) {
    const totalOriginalSize = results.reduce((sum, r) => sum + r.file.size, 0);
    const totalCompressedSize = results.reduce((sum, r) => sum + r.compressed.compressedSize, 0);
    const averageCompression = Math.round((1 - totalCompressedSize / totalOriginalSize) * 100);

    return {
      originalSizeMB: Math.round(totalOriginalSize / 1024 / 1024 * 100) / 100,
      compressedSizeMB: Math.round(totalCompressedSize / 1024 / 1024 * 100) / 100,
      compressionRatio: averageCompression,
      spaceSavedMB: Math.round((totalOriginalSize - totalCompressedSize) / 1024 / 1024 * 100) / 100
    };
  }
}

// Export a singleton instance for easy use
export const imageCompressor = new ImageCompressor();