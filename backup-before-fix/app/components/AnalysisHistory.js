'use client';

import { useState, useEffect } from 'react';

export default function AnalysisHistory() {
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data - replace with real API calls later
  useEffect(() => {
    loadAnalysisHistory();
  }, []);

  const loadAnalysisHistory = async () => {
    setLoading(true);
    
    // Mock data for demonstration
    const mockHistory = [
      {
        id: 'analysis_001',
        date: '2025-08-05T14:30:00Z',
        brand: 'ZARA',
        category: 'Dress',
        condition: 'EXCELLENT',
        size: 'UK 12',
        estimatedValue: '£25-35',
        bagNumber: 'BAG-142',
        tokensUsed: 1,
        processingTime: '8s',
        hasRulerMeasurements: true,
        ebayTitle: 'ZARA Women\'s Dress Size 12 Excellent Measured Preloved',
        status: 'completed'
      },
      {
        id: 'analysis_002',
        date: '2025-08-05T13:45:00Z',
        brand: 'H&M',
        category: 'Jacket',
        condition: 'GOOD',
        size: 'UK 10',
        estimatedValue: '£15-22',
        bagNumber: 'BAG-141',
        tokensUsed: 1,
        processingTime: '12s',
        hasRulerMeasurements: false,
        ebayTitle: 'H&M Women\'s Jacket Size 10 Good Condition Preloved',
        status: 'completed'
      },
      {
        id: 'analysis_003',
        date: '2025-08-05T12:20:00Z',
        brand: 'Nike',
        category: 'Trainers',
        condition: 'VERY GOOD',
        size: 'UK 7',
        estimatedValue: '£40-55',
        bagNumber: 'BAG-140',
        tokensUsed: 1,
        processingTime: '7s',
        hasRulerMeasurements: true,
        ebayTitle: 'Nike Trainers Size 7 Very Good Measured Preloved',
        status: 'completed'
      }
    ];
    
    setTimeout(() => {
      setAnalyses(mockHistory);
      setLoading(false);
    }, 500);
  };

  const getConditionColor = (condition) => {
    const colors = {
      'EXCELLENT': 'bg-green-100 text-green-800',
      'VERY GOOD': 'bg-green-100 text-green-800',
      'GOOD': 'bg-blue-100 text-blue-800',
      'FAIR': 'bg-yellow-100 text-yellow-800',
      'POOR': 'bg-red-100 text-red-800'
    };
    return colors[condition] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-UK', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const copyToClipboard = async (text, type) => {
    try {
      await navigator.clipboard.writeText(text);
      alert(`${type} copied to clipboard!`);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const filteredAnalyses = analyses.filter(analysis => {
    if (filter !== 'all' && analysis.condition !== filter) return false;
    if (searchTerm && !analysis.brand.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !analysis.category.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !analysis.bagNumber.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const sortedAnalyses = [...filteredAnalyses].sort((a, b) => {
    switch (sortBy) {
      case 'date':
        return new Date(b.date) - new Date(a.date);
      case 'brand':
        return a.brand.localeCompare(b.brand);
      case 'value':
        const aValue = parseInt(a.estimatedValue.match(/£(\d+)/)[1]);
        const bValue = parseInt(b.estimatedValue.match(/£(\d+)/)[1]);
        return bValue - aValue;
      case 'condition':
        return a.condition.localeCompare(b.condition);
      default:
        return 0;
    }
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading analysis history...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-2xl font-bold text-blue-600">{analyses.length}</div>
          <div className="text-sm text-gray-500">Total Analyses</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-2xl font-bold text-green-600">
            {analyses.reduce((sum, a) => sum + a.tokensUsed, 0)}
          </div>
          <div className="text-sm text-gray-500">Tokens Used</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-2xl font-bold text-purple-600">
            {analyses.filter(a => a.hasRulerMeasurements).length}
          </div>
          <div className="text-sm text-gray-500">With Measurements</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-2xl font-bold text-orange-600">
            {Math.round(analyses.reduce((sum, a) => sum + parseInt(a.processingTime), 0) / analyses.length)}s
          </div>
          <div className="text-sm text-gray-500">Avg Processing</div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by brand, category, or bag number..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Condition</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Conditions</option>
              <option value="EXCELLENT">Excellent</option>
              <option value="VERY GOOD">Very Good</option>
              <option value="GOOD">Good</option>
              <option value="FAIR">Fair</option>
              <option value="POOR">Poor</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sort by</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="date">Date</option>
              <option value="brand">Brand</option>
              <option value="value">Value</option>
              <option value="condition">Condition</option>
            </select>
          </div>
        </div>
      </div>

      {/* Analysis List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Analysis History ({sortedAnalyses.length} results)
          </h3>
        </div>
        
        <div className="divide-y divide-gray-200">
          {sortedAnalyses.map((analysis) => (
            <div key={analysis.id} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex items-start space-x-4">
                {/* Thumbnail */}
                <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">📸</span>
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold text-gray-900 mb-1">
                        {analysis.brand} {analysis.category}
                      </h4>
                      <p className="text-sm text-gray-600 mb-2">
                        {analysis.ebayTitle}
                      </p>
                      
                      <div className="flex flex-wrap gap-2 mb-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getConditionColor(analysis.condition)}`}>
                          {analysis.condition}
                        </span>
                        <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
                          Size {analysis.size}
                        </span>
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                          {analysis.bagNumber}
                        </span>
                        {analysis.hasRulerMeasurements && (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                            📏 Measured
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-500">
                        <span>{formatDate(analysis.date)}</span>
                        <span className="mx-2">•</span>
                        <span>{analysis.processingTime}</span>
                        <span className="mx-2">•</span>
                        <span>{analysis.tokensUsed} token</span>
                      </div>
                    </div>
                    
                    <div className="text-right ml-4">
                      <div className="text-lg font-bold text-green-600 mb-2">
                        {analysis.estimatedValue}
                      </div>
                      
                      <div className="flex gap-2">
                        <button
                          onClick={() => copyToClipboard(analysis.ebayTitle, 'Title')}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded"
                        >
                          📋 Copy Title
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {sortedAnalyses.length === 0 && (
          <div className="p-12 text-center">
            <div className="text-gray-400 text-4xl mb-4">📋</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No analyses found</h3>
            <p className="text-gray-500">
              {searchTerm || filter !== 'all' 
                ? 'Try adjusting your search or filter criteria.' 
                : 'Start analyzing fashion items to see your history here.'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
}