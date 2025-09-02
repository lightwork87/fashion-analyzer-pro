'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { Upload, Loader, CheckCircle, AlertCircle, Camera } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AnalyzeSinglePage() {
  const { user } = useUser();
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(null);
  const [progress, setProgress] = useState(0);

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    setUploading(true);
    setProgress(0);

    try {
      // Validate file
      if (!file.type.startsWith('image/')) {
        throw new Error('Please select an image file');
      }

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result);
      reader.readAsDataURL(file);

      setProgress(20);

      // Compress image if needed (client-side)
      let processedFile = file;
      if (file.size > 2 * 1024 * 1024) { // If over 2MB, compress
        processedFile = await compressImage(file);
      }

      setProgress(40);

      // Convert to base64 for direct API processing
      const base64 = await fileToBase64(processedFile);
      
      setProgress(60);
      setUploading(false);
      setAnalyzing(true);

      // Send to analyze endpoint with compressed data
      const response = await fetch('/api/analyze-direct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: base64,
          fileName: file.name,
          fileSize: processedFile.size
        })
      });

      setProgress(80);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Analysis failed');
      }

      const result = await response.json();
      setProgress(100);

      // Redirect to results page
      router.push(`/dashboard/results?id=${result.analysisId}`);

    } catch (err) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to process image');
      setUploading(false);
      setAnalyzing(false);
    }
  };

  const compressImage = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // Max dimensions
          const maxWidth = 1920;
          const maxHeight = 1080;
          let width = img.width;
          let height = img.height;

          // Calculate new dimensions
          if (width > height) {
            if (width > maxWidth) {
              height *= maxWidth / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width *= maxHeight / height;
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;
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
            0.85 // 85% quality
          );
        };
        img.onerror = () => reject(new Error('Image load failed'));
      };
      reader.onerror = () => reject(new Error('File read failed'));
    });
  };

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = () => reject(new Error('File read failed'));
    });
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Analyze Fashion Item</h1>
        <p className="text-gray-600 mt-2">
          Upload a photo and let AI identify your fashion item
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        {!preview ? (
          <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <Camera className="w-12 h-12 mb-3 text-gray-400" />
              <p className="mb-2 text-sm text-gray-500">
                <span className="font-semibold">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-gray-500">
                PNG, JPG, HEIC up to 10MB
              </p>
            </div>
            <input
              type="file"
              className="hidden"
              onChange={handleFileSelect}
              accept="image/*"
              disabled={uploading || analyzing}
            />
          </label>
        ) : (
          <div className="space-y-4">
            <div className="relative">
              <img
                src={preview}
                alt="Preview"
                className="w-full h-64 object-contain rounded-lg bg-gray-100"
              />
              {(uploading || analyzing) && (
                <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                  <div className="text-center text-white">
                    <Loader className="w-8 h-8 animate-spin mx-auto mb-2" />
                    <p>{uploading ? 'Uploading...' : 'Analyzing...'}</p>
                    <p className="text-sm">{progress}%</p>
                  </div>
                </div>
              )}
            </div>

            {!uploading && !analyzing && (
              <button
                onClick={() => {
                  setPreview(null);
                  setError('');
                  setProgress(0);
                }}
                className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition"
              >
                Choose Different Image
              </button>
            )}
          </div>
        )}

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3 flex items-start">
            <AlertCircle className="w-5 h-5 text-red-600 mr-2 flex-shrink-0" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Tip:</strong> For best results, use clear photos with good lighting. 
            Multiple angles can improve accuracy.
          </p>
        </div>
      </div>
    </div>
  );
}