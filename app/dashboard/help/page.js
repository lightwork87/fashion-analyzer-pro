// app/dashboard/help/page.js
// HELP PAGE - FIXED SYNTAX

'use client';

import Link from 'next/link';
import { ArrowLeft, HelpCircle, Mail, FileText, Video } from 'lucide-react';

HelpPage() {
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
          
          <h1 className="text-3xl font-bold text-gray-900">Help & Support</h1>
          <p className="text-gray-600 mt-2">
            Get help with LightLister AI
          </p>
        </div>

        <div className="grid gap-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-start">
              <FileText className="w-6 h-6 text-blue-600 mt-1 mr-4" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Getting Started
                </h3>
                <p className="text-gray-600 mb-4">
                  Learn how to analyze items and create listings
                </p>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Upload clear photos of your items</li>
                  <li>• Include photos of labels and tags</li>
                  <li>• Wait for AI analysis (takes 10-30 seconds)</li>
                  <li>• Review and copy listing details</li>
                  <li>• Post to eBay UK or Vinted</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-start">
              <Video className="w-6 h-6 text-purple-600 mt-1 mr-4" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Video Tutorials
                </h3>
                <p className="text-gray-600">
                  Coming soon - Step-by-step video guides
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-start">
              <Mail className="w-6 h-6 text-green-600 mt-1 mr-4" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Contact Support
                </h3>
                <p className="text-gray-600 mb-4">
                  Need help? Reach out to our team
                </p>
                <a href="mailto:support@lightlisterai.co.uk" className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Email Support
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HelpPage;