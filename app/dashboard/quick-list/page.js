'use client';
import { useRouter } from 'next/navigation';

export default function QuickList() {
  const router = useRouter();
  
  const handleQuickAnalyze = async () => {
    const response = await fetch('/api/analyze-ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ images: ['placeholder-1', 'placeholder-2'] })
    });
    
    const data = await response.json();
    if (data.success) {
      sessionStorage.setItem('analysisResult', JSON.stringify(data.analysis));
      router.push('/dashboard/listing-results');
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl mb-4">Quick List - No Image Upload</h1>
      <button
        onClick={handleQuickAnalyze}
        className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
      >
        Create Listing (No Upload Needed)
      </button>
    </div>
  );
}

