'use client';

// app/dashboard/ebay-settings/page.js
'use client';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

function EbaySettingsPage() {
  const router = useRouter();
  
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <button
        onClick={() => router.push('/dashboard')}
        className="flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back to Dashboard
      </button>
      <h1 className="text-3xl font-bold text-gray-900 mb-4">eBay UK Settings</h1>
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <p>eBay integration settings will be available here.</p>
      </div>
    </div>
  );
}

export default EbaySettingsPage;