// app/components/CreditDisplay.js
// Non-overlapping credit display component

'use client';

import { useState, useEffect } from 'react';
import { CreditCard } from 'lucide-react';

export default function CreditDisplay({ className = '' }) {
  const [credits, setCredits] = useState({ total: 60, used: 0 });

  useEffect(() => {
    fetchCredits();
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
    }
  };

  const remaining = Math.max(0, credits.total - credits.used);
  const percentage = credits.total > 0 ? Math.round((remaining / credits.total) * 100) : 0;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <CreditCard className="w-4 h-4 text-gray-600" />
      <div className="text-sm">
        <span className="font-semibold text-gray-900">{remaining}</span>
        <span className="text-gray-500"> credits left</span>
      </div>
    </div>
  );
}// Force rebuild Sat 16 Aug 2025 17:33:00 BST
