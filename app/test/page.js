'use client';

import { useState } from 'react';

export default function TestPage() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const testAPI = async () => {
    setLoading(true);
    console.log('Testing API...');
    
    try {
      // Create a simple test image (1x1 pixel)
      const canvas = document.createElement('canvas');
      canvas.width = 100;
      canvas.height = 100;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = 'blue';
      ctx.fillRect(0, 0, 100, 100);
      
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg'));
      const file = new File([blob], 'test-fashion-item.jpg', { type: 'image/jpeg' });
      
      const formData = new FormData();
      formData.append('image0', file);
      
      console.log('Sending request to /api/analyze-ai...');
      console.log('File size:', file.size, 'bytes');
      
      const response = await fetch('/api/analyze-ai', {
        method: 'POST',
        body: formData
      });
      
      console.log('Response status:', response.status);
      
      const data = await response.json();
      console.log('Response data:', data);
      
      setResult(data);
      
    } catch (error) {
      console.error('Test failed:', error);
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const testSimpleAPI = async () => {
    try {
      const response = await fetch('/api/analyze-ai', {
        method: 'GET'
      });
      console.log('GET test response:', response.status);
    } catch (error) {
      console.error('GET test failed:', error);
    }
  };
  
  return (
    <div className="p-8">
      <h1 className="text-2xl mb-4">API Test Page</h1>
      
      <div className="space-y-4">
        <button 
          onClick={testAPI}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded disabled:bg-gray-400"
        >
          {loading ? 'Testing...' : 'Test Image Analysis API'}
        </button>
        
        <button 
          onClick={testSimpleAPI}
          className="bg-green-500 text-white px-4 py-2 rounded ml-4"
        >
          Test Simple GET
        </button>
      </div>
      
      {result && (
        <div className="mt-8 p-4 bg-gray-100 rounded">
          <h2 className="text-lg font-bold mb-2">Result:</h2>
          <pre className="whitespace-pre-wrap text-sm">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
      
      <p className="mt-4 text-gray-600">Open DevTools Console (F12) for detailed logs</p>
    </div>
  );
}