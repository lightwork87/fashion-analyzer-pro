// app/dashboard/vinted-export/page.js
'use client';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Download } from 'lucide-react';

export default function VintedExportPage() {
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
      <h1 className="text-3xl font-bold text-gray-900 mb-4">Export to Vinted</h1>
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <p className="mb-4">Export your listings in Vinted CSV format.</p>
        <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2">
          <Download className="w-4 h-4" />
          Download CSV
        </button>
      </div>
    </div>
  );
}