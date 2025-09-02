'use client';

import { useState } from 'react';
import { Upload, CheckCircle, AlertCircle } from 'lucide-react';

export default function DirectImageUpload({ onUploadComplete }) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');

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

      if (file.size > 10 * 1024 * 1024) {
        throw new Error('Image must be less than 10MB');
      }

      // Step 1: Get presigned URL from your API
      const presignedResponse = await fetch('/api/upload/presigned', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type
        })
      });

      if (!presignedResponse.ok) {
        throw new Error('Failed to get upload URL');
      }

      const { uploadUrl, path } = await presignedResponse.json();

      // Step 2: Upload directly to Supabase Storage
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        }
      });

      if (!uploadResponse.ok) {
        throw new Error('Upload failed');
      }

      setProgress(100);

      // Step 3: Process with your API (only send metadata)
      const analyzeResponse = await fetch('/api/analyze-metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imagePath: path,
          fileName: file.name,
          fileSize: file.size
        })
      });

      if (!analyzeResponse.ok) {
        throw new Error('Analysis failed');
      }

      const result = await analyzeResponse.json();
      onUploadComplete(result);

    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6">
      <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          {uploading ? (
            <>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-sm text-gray-600">Uploading... {progress}%</p>
            </>
          ) : progress === 100 ? (
            <>
              <CheckCircle className="w-10 h-10 mb-3 text-green-500" />
              <p className="text-sm text-green-600">Upload complete!</p>
            </>
          ) : (
            <>
              <Upload className="w-10 h-10 mb-3 text-gray-400" />
              <p className="mb-2 text-sm text-gray-500">
                <span className="font-semibold">Click to upload</span>
              </p>
              <p className="text-xs text-gray-500">
                PNG, JPG up to 10MB
              </p>
            </>
          )}
        </div>
        <input
          type="file"
          className="hidden"
          onChange={handleFileSelect}
          accept="image/*"
          disabled={uploading}
        />
      </label>

      {error && (
        <div className="mt-4 flex items-center text-red-600 text-sm">
          <AlertCircle className="w-4 h-4 mr-1" />
          {error}
        </div>
      )}
    </div>
  );
}