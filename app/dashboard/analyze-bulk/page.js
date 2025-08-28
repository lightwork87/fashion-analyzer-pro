'use client';

import Link from 'next/link';
import { ArrowLeft, Crown, Sparkles } from 'lucide-react';

export default function AnalyzeBulkPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link
          href="/dashboard"
          className="flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Dashboard
        </Link>
        
        <div className="flex items-center space-x-3 mb-2">
          <Sparkles className="w-8 h-8 text-purple-600" />
          <h1 className="text-3xl font-bold text-gray-900">Bulk Analysis</h1>
          <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium flex items-center space-x-1">
            <Crown className="w-4 h-4" />
            <span>Coming Soon</span>
          </span>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Bulk Processing Coming Soon!</h2>
          <p className="text-gray-600 mb-6">
            Process up to 25 items with 24 photos each. Perfect for professional resellers.
          </p>
          
          <Link
            href="/dashboard/analyze-single"
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Try Single Item Analysis
          </Link>
        </div>
      </div>
    </div>
  );
}