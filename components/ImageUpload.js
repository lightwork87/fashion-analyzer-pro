'use client';

import { useState } from 'react';
import { Upload, X, AlertCircle } from 'lucide-react';

export default function ImageUpload({ onImageSelect, maxSizeMB = 5 }) {
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');
  const [isCompressing, setIsCompressing] = useState(false);

  const compressImage = async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // Calculate new dimensions (max 2048px on longest side)
          const maxDimension = 2048;
          let width = img.width;
          let height = img.height;
          
          if (width > height && width > maxDimension) {
            height = (height * maxDimension) / width;
            width = maxDimension;
          } else if (height > maxDimension) {
            width = (width * maxDimension) / height;
            height = maxDimension;
          }
          
          canvas.width = width;
          canvas.height = height;
          
          // Draw and compress
          ctx.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(new File([blob], file.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                }));
              } else {
                reject(new Error('Compression failed'));
              }
            },
            'image/jpeg',
            0.8 // 80% quality
          );
        };
        img.onerror = () => reject(new Error('Image load failed'));
      };
      reader.onerror = () => reject(new Error('File read failed'));
    });
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    setIsCompressing(true);

    try {
      // Check file type
      if (!file.type.startsWith('image/')) {
        throw new Error('Please select an image file');
      }

      // Compress if over 1MB
      let processedFile = file;
      if (file.size > 1024 * 1024) {
        processedFile = await compressImage(file);
      }

      // Check final size
      const maxSize = maxSizeMB * 1024 * 1024;
      if (processedFile.size > maxSize) {
        throw new Error(`Image must be less than ${maxSizeMB}MB after compression`);
      }

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result);
      };
      reader.readAsDataURL(processedFile);

      // Pass to parent
      onImageSelect(processedFile);

    } catch (err) {
      setError(err.message);
      setPreview(null);
    } finally {
      setIsCompressing(false);
    }
  };

  const clearImage = () => {
    setPreview(null);
    setError('');
    onImageSelect(null);
  };

  return (
    <div className="w-full">
      {!preview ? (
        <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <Upload className="w-10 h-10 mb-3 text-gray-400" />
            <p className="mb-2 text-sm text-gray-500">
              <span className="font-semibold">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-gray-500">
              PNG, JPG, GIF up to {maxSizeMB}MB
            </p>
            {isCompressing && (
              <p className="mt-2 text-sm text-blue-600">Compressing image...</p>
            )}
          </div>
          <input
            type="file"
            className="hidden"
            onChange={handleFileSelect}
            accept="image/*"
            disabled={isCompressing}
          />
        </label>
      ) : (
        <div className="relative">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-64 object-cover rounded-lg"
          />
          <button
            onClick={clearImage}
            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="mt-2 flex items-center text-red-600 text-sm">
          <AlertCircle className="w-4 h-4 mr-1" />
          {error}
        </div>
      )}
    </div>
  );
}