'use client';

import Link from 'next/link';

function TestPage() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-2xl font-bold mb-8">Navigation Test Page</h1>
      
      <div className="space-y-4">
        <Link href="/" className="block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Go to Home
        </Link>
        <Link href="/dashboard" className="block bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
          Go to Dashboard
        </Link>
        <Link href="/pricing" className="block bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700">
          Go to Pricing
        </Link>
        <Link href="/beta" className="block bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700">
          Go to Beta
        </Link>
      </div>
    </div>
  );
}

export default TestPage;