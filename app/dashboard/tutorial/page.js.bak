// app/dashboard/tutorial/page.js
// TUTORIAL PAGE

'use client';

import Link from 'next/link';
import { ArrowLeft, Camera, Upload, Tag, PoundSterling } from 'lucide-react';

export default function TutorialPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Dashboard
          </Link>
          
          <h1 className="text-3xl font-bold text-gray-900">Quick Tutorial</h1>
          <p className="text-gray-600 mt-2">
            Learn how to use LightLister AI in 4 easy steps
          </p>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-start">
              <div className="flex items-center justify-center w-8 h-8 bg-blue-600 text-white rounded-full font-bold mr-4">
                1
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  <Camera className="inline w-5 h-5 mr-2" />
                  Take Photos
                </h3>
                <p className="text-gray-600">
                  Photograph your item from multiple angles. Make sure to include:
                </p>
                <ul className="mt-2 space-y-1 text-sm text-gray-600 list-disc list-inside">
                  <li>Clear shots of brand labels and tags</li>
                  <li>Size labels and care instructions</li>
                  <li>Any flaws or unique features</li>
                  <li>Overall front and back views</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-start">
              <div className="flex items-center justify-center w-8 h-8 bg-blue-600 text-white rounded-full font-bold mr-4">
                2
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  <Upload className="inline w-5 h-5 mr-2" />
                  Upload & Analyze
                </h3>
                <p className="text-gray-600">
                  Upload your photos to LightLister AI. Our AI will:
                </p>
                <ul className="mt-2 space-y-1 text-sm text-gray-600 list-disc list-inside">
                  <li>Detect the brand automatically</li>
                  <li>Identify size and measurements</li>
                  <li>Assess condition (1-10 scale)</li>
                  <li>Suggest optimal pricing</li>
                  <li>Generate professional titles</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-start">
              <div className="flex items-center justify-center w-8 h-8 bg-blue-600 text-white rounded-full font-bold mr-4">
                3
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  <Tag className="inline w-5 h-5 mr-2" />
                  Review & Edit
                </h3>
                <p className="text-gray-600">
                  Check the AI-generated listing:
                </p>
                <ul className="mt-2 space-y-1 text-sm text-gray-600 list-disc list-inside">
                  <li>Verify the brand and size are correct</li>
                  <li>Adjust pricing if needed</li>
                  <li>Copy the optimized title and description</li>
                  <li>Use platform-specific formatting</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-start">
              <div className="flex items-center justify-center w-8 h-8 bg-blue-600 text-white rounded-full font-bold mr-4">
                4
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  <PoundSterling className="inline w-5 h-5 mr-2" />
                  List & Sell
                </h3>
                <p className="text-gray-600">
                  Post your listing:
                </p>
                <ul className="mt-2 space-y-1 text-sm text-gray-600 list-disc list-inside">
                  <li>Copy details to eBay UK or Vinted</li>
                  <li>Upload your photos</li>
                  <li>Set your shipping options</li>
                  <li>Publish and start selling!</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-2">Pro Tips</h3>
          <ul className="space-y-1 text-sm text-blue-800">
            <li>• Use natural lighting for best photo quality</li>
            <li>• Include measurements for better buyer confidence</li>
            <li>• Price competitively - check similar sold items</li>
            <li>• Ship quickly to maintain good seller ratings</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default TutorialPage;