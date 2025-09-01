'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';

function BatchProcessingPage() {
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
        <h1 className="text-3xl font-bold text-gray-900">Batch Processing</h1>
        <p className="text-gray-600 mt-2">
          Advanced batch processing for high-volume fashion item analysis
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
                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
                <path fillRule="evenodd" d="M4 5a2 2 0 012-2v1a1 1 0 102 0V3h3v1a1 1 0 102 0V3a2 2 0 012 2v6h-3a4 4 0 01-4 4H5a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd"/>
              </svg>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Enterprise Batch Processing
              </h2>
              <p className="text-gray-600 mb-6">
                Process hundreds of fashion items simultaneously with our advanced batch processing system.
              </p>
              
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">What's Included:</h3>
                <div className="text-left space-y-3">
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700">Process 25+ items per batch</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700">Up to 24 photos per item</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700">AI automatic photo grouping</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700">Bulk listing generation</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700">Multi-platform export</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7-293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700">Priority processing queue</span>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mb-6">
                <p className="text-yellow-800 font-medium text-sm">
                  This feature is currently in development and will be available soon for Business plan subscribers.
                </p>
              </div>

              <div className="space-y-3">
                <Link href="/dashboard/pricing">
                  <button className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium">
                    Upgrade to Business Plan
                  </button>
                </Link>
                
                <Link href="/beta-signup">
                  <button className="w-full border border-blue-600 text-blue-600 hover:bg-blue-50 px-6 py-3 rounded-lg font-medium">
                    Join Beta Program
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-xl font-semibold mb-4">How Batch Processing Works</h3>
            
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
                    1
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Mass Upload</h4>
                  <p className="text-gray-600 text-sm">
                    Upload hundreds of fashion item photos in one go. Our system accepts ZIP files, folder uploads, or drag-and-drop multiple files.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
                    2
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Smart Grouping</h4>
                  <p className="text-gray-600 text-sm">
                    Advanced AI algorithms analyze visual similarities and automatically group photos that belong to the same item.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
                    3
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Parallel Processing</h4>
                  <p className="text-gray-600 text-sm">
                    All items are processed simultaneously using our distributed AI infrastructure for maximum speed.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
                    4
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Quality Control</h4>
                  <p className="text-gray-600 text-sm">
                    Review and edit all generated listings before bulk export to your chosen marketplaces.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-xl font-semibold mb-4">Current Options</h3>
            <p className="text-gray-600 mb-4 text-sm">
              While batch processing is in development, try these alternatives:
            </p>
            <div className="space-y-3">
              <Link href="/dashboard/analyze-single">
                <button className="w-full text-left p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="font-medium text-gray-900">Single Item Analysis</div>
                  <div className="text-sm text-gray-600">Process one item at a time</div>
                </button>
              </Link>
              <Link href="/dashboard/analyze-bulk">
                <button className="w-full text-left p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="font-medium text-gray-900">Bulk Analysis</div>
                  <div className="text-sm text-gray-600">Beta version with limited features</div>
                </button>
              </Link>
              <Link href="/dashboard/smart-upload">
                <button className="w-full text-left p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="font-medium text-gray-900">Smart Upload</div>
                  <div className="text-sm text-gray-600">Enhanced single item processing</div>
                </button>
              </Link>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-xl font-semibold mb-4">Pricing</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Business Plan</span>
                <span className="font-semibold text-gray-900">£49.99/month</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Included Credits</span>
                <span className="font-semibold text-gray-900">250 analyses</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Batch Processing</span>
                <span className="font-semibold text-green-600">Included</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BatchProcessingPage;