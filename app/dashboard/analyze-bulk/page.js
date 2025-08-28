'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Crown, Sparkles, Info } from 'lucide-react';

export default function AnalyzeBulkPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
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
              <span>Pro Feature</span>
            </span>
          </div>
          <p className="text-gray-600">Process up to 25 items with 24 photos each</p>
        </div>

        {/* Coming Soon Message */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-purple-600" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Bulk Analysis Coming Soon!</h2>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            We're working hard to bring you the ability to analyze 25 items at once with up to 24 photos each. 
            This feature will be perfect for professional resellers.
          </p>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <Info className="w-5 h-5 text-blue-600 mt-0.5 mr-3" />
              <div className="text-sm text-blue-800 text-left">
                <p className="font-semibold mb-1">What to expect:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Process up to 25 items simultaneously</li>
                  <li>24 photos per item for comprehensive analysis</li>
                  <li>Automatic grouping of photos by item</li>
                  <li>Bulk export to eBay UK and Vinted</li>
                  <li>Advanced batch editing tools</li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <Link
              href="/dashboard/analyze-single"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Try Single Item Analysis
            </Link>
            <p className="text-sm text-gray-500">
              For now, use single item analysis to create professional listings
            </p>
          </div>
        </div>
        
        {/* Feature Preview */}
        <div className="mt-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-6 text-white">
          <h3 className="text-xl font-bold mb-2">Want early access?</h3>
          <p className="text-purple-100 mb-4">
            Join our beta program to get first access to bulk analysis features
          </p>
          <button className="bg-white text-purple-600 px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition">
            Join Beta Program
          </button>
        </div>
      </div>
    </div>
  );
}