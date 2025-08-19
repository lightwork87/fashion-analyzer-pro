'use client';

import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

export default function EbaySettingsPage() {
  const { user, isLoaded, isSignedIn } = useUser();
  const router = useRouter();
  
  if (!isLoaded || !isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/dashboard" className="flex items-center">
                <Image 
                  src="/logo.png" 
                  alt="LightLister AI" 
                  width={32} 
                  height={32}
                  className="h-8 w-auto mr-3"
                />
                <h1 className="text-xl font-bold text-gray-900">eBay Settings</h1>
              </Link>
            </div>
            
            <Link 
              href="/dashboard"
              className="text-sm bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </header>
      
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">eBay Integration Settings</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="font-medium mb-2">Connection Status</h3>
              <p className="text-sm text-gray-600">
                Your eBay account is connected and ready to use.
              </p>
            </div>
            
            <div>
              <h3 className="font-medium mb-2">Business Policies</h3>
              <p className="text-sm text-gray-600 mb-4">
                To list items on eBay, you need to set up business policies in your eBay account:
              </p>
              <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                <li>Payment Policy</li>
                <li>Return Policy</li>
                <li>Shipping Policy</li>
              </ul>
              <a 
                href="https://www.ebay.co.uk/sh/buspolicy/manager"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-3 text-sm text-blue-600 hover:text-blue-800"
              >
                Manage eBay Business Policies →
              </a>
            </div>
            
            <div className="pt-4 border-t">
              <p className="text-sm text-gray-500">
                Connected account: {user.emailAddresses?.[0]?.emailAddress}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}