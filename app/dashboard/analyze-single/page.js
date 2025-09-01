'use client';
import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';

function AnalyzeSinglePage() {
  const { user } = useUser();
  const [credits, setCredits] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCredits = async () => {
      if (!user) return;
      
      try {
        const response = await fetch('/api/user/credits');
        if (response.ok) {
          const data = await response.json();
          setCredits(data.credits_remaining || 0);
        }
      } catch (error) {
        console.error('Error fetching credits:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCredits();
  }, [user]);

  return (
    <div className="container mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Single Item Analysis
        </h1>
        <p className="text-gray-600 mb-6">
          Upload photos of your fashion item for instant AI analysis
        </p>
        
        <div className="text-blue-600 font-medium">
          Credits remaining: {loading ? 'Loading...' : credits.toLocaleString()} • Cost: 1 credit per analysis
        </div>
      </div>
      
      {/* Rest of your component */}
    </div>
  );
}

// This MUST be the default export
export default AnalyzeSinglePage;