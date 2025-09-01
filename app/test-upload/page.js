'use client';

import { useState, useRef } from 'react';

function TestUpload() {
  const fileInputRef = useRef(null);
  const [files, setFiles] = useState([]);
  const [log, setLog] = useState([]);

  const addLog = (message) => {
    setLog(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const handleButtonClick = () => {
    addLog('Button clicked');
    if (fileInputRef.current) {
      addLog('File input ref found');
      fileInputRef.current.click();
    } else {
      addLog('ERROR: File input ref is null');
    }
  };

  const handleFileChange = (e) => {
    addLog(`File change event triggered, ${e.target.files.length} files selected`);
    const fileList = Array.from(e.target.files);
    setFiles(fileList);
    fileList.forEach(file => {
      addLog(`File: ${file.name}, Size: ${(file.size / 1024).toFixed(2)} KB`);
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-4">File Upload Test</h1>
        
        <div className="space-y-4">
          <button
            onClick={handleButtonClick}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Test File Upload
          </button>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />

          {files.length > 0 && (
            <div className="mt-4">
              <h3 className="font-semibold mb-2">Selected Files:</h3>
              <ul className="list-disc list-inside">
                {files.map((file, idx) => (
                  <li key={idx}>{file.name}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-6">
            <h3 className="font-semibold mb-2">Debug Log:</h3>
            <div className="bg-gray-100 p-3 rounded text-sm font-mono">
              {log.length === 0 ? 'No actions yet...' : log.map((entry, idx) => (
                <div key={idx}>{entry}</div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TestUpload;