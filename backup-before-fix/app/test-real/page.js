'use client';

import { useState } from 'react';

export default function TestRealPage() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const testAPI = async () => {
    if (!selectedFile) {
      alert('Please select an image first!');
      return;
    }

    setLoading(true);
    console.log('Testing with real image...');
    
    try {
      const formData = new FormData();
      formData.append('image0', selectedFile);
      
      console.log('Sending request to /api/analyze-ai...');
      console.log('File:', selectedFile.name, 'Size:', selectedFile.size, 'bytes');
      
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
  
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Fashion Analyzer - Real Image Test</h1>
      
      <div className="space-y-6">
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="mb-4"
          />
          
          {preview && (
            <div className="mt-4">
              <p className="text-sm text-gray-600 mb-2">Preview:</p>
              <img 
                src={preview} 
                alt="Preview" 
                className="max-w-xs max-h-64 object-contain border rounded"
              />
            </div>
          )}
        </div>
        
        <button 
          onClick={testAPI}
          disabled={loading || !selectedFile}
          className="bg-blue-500 text-white px-6 py-3 rounded-lg disabled:bg-gray-400 font-semibold"
        >
          {loading ? 'Analyzing...' : 'Analyze Fashion Item'}
        </button>
      </div>
      
      {result && (
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4">Analysis Results:</h2>
          
          {result.items && result.items.length > 0 && (
            <div className="bg-white border rounded-lg p-6 shadow-sm">
              {result.items.map((item, index) => (
                <div key={index} className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="font-semibold">Brand:</p>
                      <p>{item.brand.name} (Confidence: {(item.brand.confidence * 100).toFixed(0)}%)</p>
                    </div>
                    <div>
                      <p className="font-semibold">Item Type:</p>
                      <p>{item.itemType}</p>
                    </div>
                    <div>
                      <p className="font-semibold">Condition:</p>
                      <p>{item.condition.score}/10 - {item.condition.description}</p>
                    </div>
                    <div>
                      <p className="font-semibold">Size:</p>
                      <p>{item.size}</p>
                    </div>
                    <div>
                      <p className="font-semibold">Price Range:</p>
                      <p>£{item.estimatedPrice.min} - £{item.estimatedPrice.max}</p>
                    </div>
                    <div>
                      <p className="font-semibold">Color:</p>
                      <p>{item.color}</p>
                    </div>
                  </div>
                  
                  <div className="border-t pt-3 mt-4">
                    <p className="font-semibold">eBay Title:</p>
                    <p className="bg-gray-100 p-2 rounded font-mono text-sm">{item.ebayTitle}</p>
                  </div>
                  
                  <div>
                    <p className="font-semibold">SKU:</p>
                    <p className="font-mono text-sm">{item.sku}</p>
                  </div>
                  
                  <div>
                    <p className="font-semibold">Description:</p>
                    <p className="text-sm whitespace-pre-line">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {result.error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded">
              Error: {result.error}
            </div>
          )}
          
          <details className="mt-4">
            <summary className="cursor-pointer text-gray-600 hover:text-gray-800">
              View Raw JSON Response
            </summary>
            <pre className="mt-2 p-4 bg-gray-100 rounded text-xs overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}