'use client';

import { useState } from 'react';

export default function TestBatch() {
  const [log, setLog] = useState([]);
  const [images, setImages] = useState([]);

  const addLog = (message) => {
    setLog(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
    console.log(message);
  };

  const testImageProcessing = async (e) => {
    const files = Array.from(e.target.files);
    addLog(`Selected ${files.length} files`);

    try {
      for (const file of files) {
        addLog(`Processing ${file.name} (${(file.size / 1024).toFixed(2)} KB)`);
        
        // Test basic file reading
        const reader = new FileReader();
        const dataUrl = await new Promise((resolve, reject) => {
          reader.onload = (e) => resolve(e.target.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        
        addLog(`Successfully read ${file.name}`);
        
        // Test image loading
        const img = new Image();
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = dataUrl;
        });
        
        addLog(`Image loaded: ${img.width}x${img.height}`);
        
        // Test canvas
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 100;
        canvas.height = 100;
        ctx.drawImage(img, 0, 0, 100, 100);
        
        addLog(`Canvas created successfully`);
        
        setImages(prev => [...prev, {
          name: file.name,
          preview: canvas.toDataURL('image/jpeg', 0.5)
        }]);
      }
      
      addLog('All images processed successfully!');
    } catch (error) {
      addLog(`ERROR: ${error.message}`);
      console.error(error);
    }
  };

  const testAPICall = async () => {
    addLog('Testing API call...');
    
    try {
      const response = await fetch('/api/batch/group', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          images: [{
            index: 0,
            thumbnail: 'data:image/jpeg;base64,/9j/4AAQSkZJRg==',
            name: 'test.jpg'
          }],
          totalImages: 1
        })
      });
      
      addLog(`Response status: ${response.status}`);
      
      const contentType = response.headers.get('content-type');
      addLog(`Content-Type: ${contentType}`);
      
      if (contentType?.includes('application/json')) {
        const data = await response.json();
        addLog(`Response: ${JSON.stringify(data)}`);
      } else {
        const text = await response.text();
        addLog(`Non-JSON response: ${text.substring(0, 100)}`);
      }
    } catch (error) {
      addLog(`API ERROR: ${error.message}`);
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Batch Processing Debug</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="font-semibold mb-4">Test Image Processing</h2>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={testImageProcessing}
            className="mb-4"
          />
          
          <div className="grid grid-cols-4 gap-2 mb-4">
            {images.map((img, idx) => (
              <div key={idx}>
                <img src={img.preview} alt={img.name} className="w-full h-20 object-cover rounded" />
                <p className="text-xs truncate">{img.name}</p>
              </div>
            ))}
          </div>
          
          <button
            onClick={testAPICall}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Test API Call
          </button>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="font-semibold mb-4">Debug Log</h2>
          <div className="bg-gray-100 p-4 rounded font-mono text-sm max-h-96 overflow-y-auto">
            {log.length === 0 ? (
              <p className="text-gray-500">No logs yet...</p>
            ) : (
              log.map((entry, idx) => (
                <div key={idx} className="mb-1">{entry}</div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default TestBatch;