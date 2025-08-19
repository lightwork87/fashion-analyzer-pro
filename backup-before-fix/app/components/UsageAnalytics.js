'use client';

import { useState, useEffect } from 'react';

export default function UsageAnalytics({ userStats }) {
  const [timeRange, setTimeRange] = useState('30days');
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    setLoading(true);
    
    // Mock analytics data for demonstration
    const mockAnalytics = {
      overview: {
        totalAnalyses: 234,
        successRate: 98.2,
        avgProcessingTime: 8.4,
        totalTokensUsed: 267,
        measuredItems: 156,
        topCondition: 'GOOD'
      },
      brandBreakdown: [
        { brand: 'ZARA', count: 45, percentage: 19.2 },
        { brand: 'H&M', count: 38, percentage: 16.2 },
        { brand: 'Nike', count: 32, percentage: 13.7 },
        { brand: 'Mango', count: 28, percentage: 12.0 },
        { brand: 'COS', count: 24, percentage: 10.3 },
        { brand: 'Other', count: 67, percentage: 28.6 }
      ],
      conditionBreakdown: [
        { condition: 'EXCELLENT', count: 58, percentage: 24.8 },
        { condition: 'VERY GOOD', count: 67, percentage: 28.6 },
        { condition: 'GOOD', count: 89, percentage: 38.0 },
        { condition: 'FAIR', count: 18, percentage: 7.7 },
        { condition: 'POOR', count: 2, percentage: 0.9 }
      ],
      categoryBreakdown: [
        { category: 'Dress', count: 62, avgValue: '£28' },
        { category: 'Jacket', count: 45, avgValue: '£35' },
        { category: 'Shoes', count: 41, avgValue: '£42' },
        { category: 'Trousers', count: 38, avgValue: '£31' },
        { category: 'Blouse', count: 34, avgValue: '£24' },
        { category: 'Other', count: 14, avgValue: '£19' }
      ],
      insights: [
        {
          type: 'success',
          title: 'High Success Rate',
          description: 'Your analysis success rate is 98.2%, which is excellent!',
          action: 'Keep up the great photo quality!'
        },
        {
          type: 'warning',
          title: 'Measurement Opportunity',
          description: '66% of your items include ruler measurements.',
          action: 'Consider adding ruler measurements to more items'
        },
        {
          type: 'info',
          title: 'Brand Focus',
          description: 'Your top 3 brands account for 49% of analyses.',
          action: 'Try analyzing more designer or luxury brands'
        }
      ]
    };
    
    setTimeout(() => {
      setAnalytics(mockAnalytics);
      setLoading(false);
    }, 500);
  };

  const getInsightIcon = (type) => {
    switch (type) {
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return '📊';
    }
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading analytics...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Time Range Selector */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold text-gray-900">Usage Analytics</h3>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="90days">Last 90 Days</option>
            <option value="1year">Last Year</option>
          </select>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-3xl font-bold text-blue-600">{analytics.overview.totalAnalyses}</div>
          <div className="text-sm text-gray-500">Total Analyses</div>
          <div className="text-xs text-green-600 mt-1">+15% from last period</div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-3xl font-bold text-green-600">{analytics.overview.successRate}%</div>
          <div className="text-sm text-gray-500">Success Rate</div>
          <div className="text-xs text-green-600 mt-1">+2.1% from last period</div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-3xl font-bold text-purple-600">{analytics.overview.avgProcessingTime}s</div>
          <div className="text-sm text-gray-500">Avg Processing</div>
          <div className="text-xs text-green-600 mt-1">-1.2s faster</div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-3xl font-bold text-orange-600">{analytics.overview.totalTokensUsed}</div>
          <div className="text-sm text-gray-500">Tokens Used</div>
          <div className="text-xs text-blue-600 mt-1">{((analytics.overview.totalTokensUsed / userStats.totalTokens) * 100).toFixed(1)}% of allowance</div>
        </div>
      </div>

      {/* Brand and Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Brand Breakdown */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Top Brands Analyzed</h3>
          <div className="space-y-4">
            {analytics.brandBreakdown.map((brand, index) => (
              <div key={brand.brand}>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-gray-900">{brand.brand}</span>
                  <span className="text-sm text-gray-500">{brand.count} ({brand.percentage}%)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${brand.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Categories & Average Values</h3>
          <div className="space-y-4">
            {analytics.categoryBreakdown.map((category, index) => (
              <div key={category.category} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900">{category.category}</div>
                  <div className="text-sm text-gray-500">{category.count} items</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-green-600">{category.avgValue}</div>
                  <div className="text-xs text-gray-500">avg value</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Condition Analysis */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-6">Condition Distribution</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {analytics.conditionBreakdown.map((condition) => (
            <div key={condition.condition} className="text-center">
              <div className={`px-3 py-2 rounded-lg font-medium mb-2 ${getConditionColor(condition.condition)}`}>
                {condition.condition}
              </div>
              <div className="text-2xl font-bold text-gray-900">{condition.count}</div>
              <div className="text-sm text-gray-500">{condition.percentage}%</div>
            </div>
          ))}
        </div>
      </div>

      {/* Insights and Recommendations */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-6">Insights & Recommendations</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {analytics.insights.map((insight, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start">
                <div className="text-2xl mr-3 flex-shrink-0">
                  {getInsightIcon(insight.type)}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-2">{insight.title}</h4>
                  <p className="text-sm text-gray-600 mb-3">{insight.description}</p>
                  <div className="text-sm font-medium text-blue-600">{insight.action}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-6">Performance Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-3xl mb-2">📏</div>
            <div className="text-2xl font-bold text-blue-600">{analytics.overview.measuredItems}</div>
            <div className="text-sm text-blue-800">Items with Measurements</div>
            <div className="text-xs text-blue-600 mt-1">
              {((analytics.overview.measuredItems / analytics.overview.totalAnalyses) * 100).toFixed(1)}% of total
            </div>
          </div>
          
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-3xl mb-2">⚡</div>
            <div className="text-2xl font-bold text-green-600">{analytics.overview.avgProcessingTime}s</div>
            <div className="text-sm text-green-800">Average Speed</div>
            <div className="text-xs text-green-600 mt-1">30% faster than average</div>
          </div>
          
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-3xl mb-2">🎯</div>
            <div className="text-2xl font-bold text-purple-600">{analytics.overview.successRate}%</div>
            <div className="text-sm text-purple-800">Success Rate</div>
            <div className="text-xs text-purple-600 mt-1">Excellent performance</div>
          </div>
        </div>
      </div>
    </div>
  );
}