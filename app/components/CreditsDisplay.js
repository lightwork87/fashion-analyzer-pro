'use client';
import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';

export default function CreditsDisplay() {
  const { user } = useUser();
  const [credits, setCredits] = useState(null);
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
        setCredits(0);
      } finally {
        setLoading(false);
      }
    };

    fetchCredits();
  }, [user]);

  if (loading) return <span>Loading...</span>;

  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm text-gray-600">
        {credits?.toLocaleString()} credits
      </span>
      <button className="text-blue-600 text-sm hover:underline">
        Get More
      </button>
    </div>
  );
}