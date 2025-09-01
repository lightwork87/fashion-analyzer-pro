'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';

function AnalyzeBulkPage() {
  const { user, isLoaded } = useUser();
  const [credits, setCredits] = useState(0);

  useEffect(() => {
    if (user) {
      fetchCredits();
    }
  }, [user]);

  const fetchCredits = async () => {
    try {
      const response = await fetch('/api/user/credits');
      const data = await response.json();
      setCredits(data.credits || 0);
    } catch (error) {
      console.error('Failed to fetch credits:', error);
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Bulk Analysis</h1>
        <p className="text-gray-600 mt-2">
          Process multiple fashion items at once with AI-powered batch analysis
        </p>
        <div className="mt-4">
          <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
            Credits remaining: {credits}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <div className="bg-white p-8 rounded-lg shadow-sm border">
            <div className="text-center">
              <svg className="h-24 w-24 text-gray-400 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 01-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 111.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-2.293-2.293a1 1 0 111.414-1.414L15.586 13H14a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Bulk Processing Coming Soon
              </h2>
              <p className="text-gray-600 mb-6">
                We're working on an advanced bulk processing feature that will allow you to:
              </p>
              
              <div className="text-left space-y-3 mb-8">
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700">Upload 25+ items simultaneously</span>
                </div>
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700">AI automatically groups photos by item</span>
                </div>
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700">Batch create professional listings</span>
                </div>
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700">Export to multiple platforms</span>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg mb-6">
                <p className="text-blue-800 font-medium">
                  Join our beta program to get early access!
                </p>
              </div>

              <Link href="/beta-signup">
                <button className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium mb-3">
                  Join Beta Program
                </button>
              </Link>
              
              <Link href="/dashboard/analyze-single">
                <button className="w-full border border-gray-300 hover:bg-gray-50 text-gray-700 px-6 py-3 rounded-lg font-medium">
                  Try Single Item Analysis
                </button>
              </Link>
            </div>
          </div>
        </div>

        <div>
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-xl font-semibold mb-4">How It Will Work</h3>
            
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold">
                    1
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Upload Photos</h4>
                  <p className="text-gray-600 text-sm">
                    Drag and drop multiple fashion item photos (up to 24 photos per item, 25 items total)
                  </p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold">
                    2
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">AI Grouping</h4>
                  <p className="text-gray-600 text-sm">
                    Our AI automatically identifies and groups photos that belong to the same item
                  </p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold">
                    3
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Batch Analysis</h4>
                  <p className="text-gray-600 text-sm">
                    Each item group gets analyzed for brand, condition, description, and pricing
                  </p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold">
                    4
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Review & Export</h4>
                  <p className="text-gray-600 text-sm">
                    Review all listings and export directly to eBay, Vinted, Depop, and more
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border mt-6">
            <h3 className="text-xl font-semibold mb-4">Current Alternatives</h3>
            <div className="space-y-3">
              <Link href="/dashboard/analyze-single">
                <button className="w-full text-left p-3 border rounded-lg hover:bg-gray-50">
                  <div className="font-medium text-gray-900">Single Item Analysis</div>
                  <div className="text-sm text-gray-600">Analyze one item at a time</div>
                </button>
              </Link>
              <Link href="/dashboard/smart-upload">
                <button className="w-full text-left p-3 border rounded-lg hover:bg-gray-50">
                  <div className="font-medium text-gray-900">Smart Upload</div>
                  <div className="text-sm text-gray-600">Enhanced single item processing</div>
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AnalyzeBulkPage;