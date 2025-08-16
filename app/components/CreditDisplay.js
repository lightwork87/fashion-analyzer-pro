// app/components/CreditDisplay.js
// COMPLETE FILE - CREDIT DISPLAY COMPONENT

'use client';

import { useState, useEffect } from 'react';
import { CreditCard } from 'lucide-react';

export default function CreditDisplay({ className = '' }) {
  const [credits, setCredits] = useState({ total: 0, used: 0, bonus: 0, available: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCredits();
    // Refresh credits every 30 seconds
    const interval = setInterval(fetchCredits, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchCredits = async () => {
    try {
      const response = await fetch('/api/user/credits');
      if (response.ok) {
        const data = await response.json();
        setCredits(data);
      }
    } catch (error) {
      console.error('Failed to fetch credits:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <CreditCard className="w-4 h-4 text-gray-400 animate-pulse" />
        <span className="text-sm text-gray-400">Loading...</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <CreditCard className="w-4 h-4 text-gray-600" />
      <div className="text-sm">
        <span className="font-semibold text-gray-900">{credits.available || 0}</span>
        <span className="text-gray-500"> credits</span>
        {credits.bonus > 0 && (
          <span className="text-green-600 text-xs ml-1">(+{credits.bonus} bonus)</span>
        )}
      </div>
    </div>
  );
}