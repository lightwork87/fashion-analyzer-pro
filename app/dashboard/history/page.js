'use client';

import { useState, useEffect } from 'react';

export default function History() {
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // For now, we'll use localStorage. Later integrate with Supabase
    const savedAnalyses = localStorage.getItem('analysisHistory');
    if (savedAnalyses) {
      setAnalyses(JSON.parse(savedAnalyses));
    }
    setLoading(false);
  }, []);

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 dark:text-white">Analysis History</h1>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black dark:border-white mx-auto"></div>
              <p className="mt-4 text-gray-500 dark:text-gray-400">Loading history...</p>
            </div>
          ) : analyses.length > 0 ? (
            <div className="divide-y dark:divide-gray-700">
              {analyses.map((item, index) => (
                <div key={index} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg dark:text-white">{item.title}</h3>
                      <p className="text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">{item.description}</p>
                      <div className="flex gap-4 mt-3 text-sm text-gray-500 dark:text-gray-400">
                        <span>£{item.price}</span>
                        <span>•</span>
                        <span>{item.category}</span>
                        <span>•</span>
                        <span>{item.condition}</span>
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(item.timestamp).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        {new Date(item.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-gray-500 dark:text-gray-400">No analysis history yet</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                Your analyzed items will appear here
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

