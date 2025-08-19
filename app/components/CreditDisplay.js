'use client';

import { useCredits } from '../contexts/CreditsContext';

export default function CreditsDisplay() {
  const { credits, loading } = useCredits();

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <span className="text-sm text-gray-600 dark:text-gray-300">Loading...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg">
      <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Credits:</span>
      <span className="text-sm font-bold text-black dark:text-white">{credits}</span>
    </div>
  );
}