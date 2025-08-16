// app/dashboard/smart-upload/page.js
// FIXED VERSION - NO ERRORS

'use client';

import React, { useState, useRef, useEffect } from 'react'; // Added React import
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { Upload, Loader2 } from 'lucide-react';

export default function SmartUploadPage() {
  const { userId } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef(null);
  
  const [fileCount, setFileCount] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleFileSelect = (e) => {
    const files = e.target.files;
    if (files) {
      setFileCount(files.length);
    }
  };

  const analyzeImages = async () => {
    if (!fileCount || !userId) return;
    
    setIsAnalyzing(true);
    
    try {
      const response = await fetch('/api/analyze-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageCount: fileCount }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        sessionStorage.setItem('analysisResult', JSON.stringify(data.analysis));
        router.push('/dashboard/results');
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Upload Images</h1>
        
        <div className="bg-white p-8 rounded-lg shadow">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          {fileCount === 0 ? (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full p-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition"
            >
              <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600">Click to select images</p>
            </button>
          ) : (
            <div className="text-center">
              <p className="text-lg mb-4">{fileCount} images selected</p>
              <button
                onClick={analyzeImages}
                disabled={isAnalyzing}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 inline mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  'Analyze Images'
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}