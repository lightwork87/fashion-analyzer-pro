'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';

function HomePage() {
  const { user, isLoaded } = useUser();

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-6 py-20">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            AI-Powered Fashion Listing Generator
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Transform your fashion photos into professional listings with advanced AI analysis. 
            Perfect for eBay, Vinted, and more.
          </p>
          
          <div className="flex gap-4 justify-center mb-12">
            {user ? (
              <Link href="/dashboard">
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium">
                  Go to Dashboard
                </button>
              </Link>
            ) : (
              <>
                <Link href="/sign-up">
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium">
                    Get Started Free
                  </button>
                </Link>
                <Link href="/sign-in">
                  <button className="border border-gray-300 hover:bg-gray-50 text-gray-700 px-6 py-3 rounded-lg font-medium">
                    Sign In
                  </button>
                </Link>
              </>
            )}
          </div>

          <div className="grid md:grid-cols-3 gap-8 mt-16">
            <div className="bg-white p-8 rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold mb-4">AI Fashion Analysis</h3>
              <p className="text-gray-600">
                Advanced computer vision identifies brands, conditions, and detailed descriptions automatically.
              </p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold mb-4">Smart Pricing</h3>
              <p className="text-gray-600">
                Get market-based pricing suggestions based on real-time data and trends.
              </p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold mb-4">Multi-Platform</h3>
              <p className="text-gray-600">
                Create listings for eBay, Vinted, Depop, and other marketplaces instantly.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomePage;