'use client';

import { useState } from 'react';
import { compressImage } from '../utils/imageCompression';

export default function TestCompressionPage() {
  const [originalFile, setOriginalFile] = useState(null);
  const [compressedFile, setCompressedFile] = useState(null);
  const [compressing, setCompressing] = useState(false);
  const [result, setResult] = useState(null);

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setOriginalFile(file);
    setCompressedFile(null);
    setResult(null);
    setCompressing(true);
    
    try {
      console.log(`Original file: ${file.name}, ${(file.size / 1024 / 1024).toFixed(2)}MB`);
      
      const compressed = await compressImage(file, 140);
      setCompressedFile(compressed);
      
      console.log(`Compressed: ${(compressed.size / 1024).toFixed(2)}KB`);
    } catch (error) {
      console.error('Compression failed:', error);
    } finally {
      setCompressing(false);
    }
  };

  const testAPI = async () => {
    if (!compressedFile) return;
    
    try {
      const formData = new FormData();
      formData.append('image0', compressedFile);
      
      const response = await fetch('/api/analyze-ai', {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('API test failed:', error);
      setResult({ error: error.message });
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Image Compression Test</h1>
      
      <div className="space-y-6">
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="mb-4"
          />
          
          {originalFile && (
            <div className="mt-4 space-y-2">
              <p><strong>Original:</strong> {originalFile.name}</p>
              <p>Size: {(originalFile.size / 1024 / 1024).toFixed(2)}MB ({(originalFile.size / 1024).toFixed(0)}KB)</p>
            </div>
          )}
          
          {compressing && (
            <p className="mt-4 text-blue-600">Compressing...</p>
          )}
          
          {compressedFile && (
            <div className="mt-4 space-y-2 text-green-600">
              <p><strong>Compressed:</strong></p>
              <p>Size: {(compressedFile.size / 1024).toFixed(2)}KB</p>
              <p>Reduction: {(((originalFile.size - compressedFile.size) / originalFile.size) * 100).toFixed(1)}%</p>
              
              <button
                onClick={testAPI}
                className="mt-4 bg-blue-500 text-white px-4 py-2 rounded"
              >
                Test with API
              </button>
            </div>
          )}
        </div>
        
        {result && (
          <div className="border rounded-lg p-4 bg-gray-50">
            <h3 className="font-bold mb-2">API Result:</h3>
            <pre className="text-xs overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}