// app/dashboard/analyze-bulk/page.js
// BULK ANALYSIS PAGE - UP TO 25 ITEMS

'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { Images, Upload, Loader2, ArrowLeft, Info, FolderOpen } from 'lucide-react';

export default function AnalyzeBulkPage() {
  const { userId } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef(null);
  
  const [files, setFiles] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState('upload');
  const [error, setError] = useState(null);

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length > 600) {
      setError('Maximum 600 photos (25 items × 24 photos each)');
      return;
    }
    
    setFiles(selectedFiles);
    setError(null);
  };

  const processBatch = async () => {
    if (!files.length) return;
    
    setIsProcessing(true);
    setCurrentStep('grouping');
    
    try {
      // For now, simulate processing
      // In production, this would upload and group images
      setTimeout(() => {
        setCurrentStep('analyzing');
      }, 2000);
      
      setTimeout(() => {
        router.push('/dashboard/batch-results');
      }, 4000);
      
    } catch (err) {
      setError('Batch processing failed. Please try again.');
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Dashboard
          </button>
          
          <h1 className="text-3xl font-bold text-gray-900">Bulk Analysis</h1>
          <p className="text-gray-600 mt-2">
            Process up to 25 items with AI grouping
          </p>
        </div>

        {/* Instructions */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
          <div className="flex">
            <Info className="w-5 h-5 text-purple-600 mt-0.5 mr-3" />
            <div className="text-sm text-purple-800">
              <p className="font-semibold mb-1">How bulk processing works:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Upload all photos (up to 600 total)</li>
                <li>AI groups photos by item automatically</li>
                <li>Each item gets analyzed separately</li>
                <li>Download results as CSV for eBay/Vinted</li>
              </ol>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Upload Area */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          {!isProcessing ? (
            <>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center cursor-pointer hover:border-gray-400 transition"
              >
                <FolderOpen className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-600">
                  Select all photos for batch processing
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Up to 600 photos total (25 items × 24 photos)
                </p>
                
                {files.length > 0 && (
                  <div className="mt-4 p-4 bg-gray-50 rounded">
                    <p className="text-sm font-medium text-gray-900">
                      {files.length} photos selected
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      Estimated {Math.ceil(files.length / 10)} items
                    </p>
                  </div>
                )}
              </div>
              
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              
              {files.length > 0 && (
                <button
                  onClick={processBatch}
                  className="w-full mt-4 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center justify-center gap-2"
                >
                  <Images className="w-5 h-5" />
                  Process {files.length} Photos
                </button>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto" />
              <p className="mt-4 text-lg font-medium text-gray-900">
                {currentStep === 'grouping' ? 'Grouping photos by item...' : 'Analyzing items with AI...'}
              </p>
              <p className="text-sm text-gray-600 mt-2">
                This may take a few minutes
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}