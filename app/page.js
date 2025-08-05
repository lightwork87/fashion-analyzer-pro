'use client';

import { useState, useEffect } from 'react';
import { useUser, useAuth, SignInButton, SignOutButton } from '@clerk/nextjs';

// Dashboard Components
import AnalysisWorkspace from './components/AnalysisWorkspace';
import AnalysisHistory from './components/AnalysisHistory';
import SubscriptionManager from './components/SubscriptionManager';
import UsageAnalytics from './components/UsageAnalytics';
import TokenManager from './components/TokenManager';

export default function ProfessionalDashboard() {
  const { isSignedIn, user } = useUser();
  const { signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('analyzer');
  const [userStats, setUserStats] = useState({
    tokensRemaining: 142,
    totalTokens: 150,
    analysesThisMonth: 8,
    subscriptionTier: 'Professional',
    subscriptionPrice: '£35',
    nextBilling: '2025-09-05',
    totalAnalyses: 234,
    avgProcessingTime: '8.4s',
    successRate: '98.2%'
  });

  // Load user stats when signed in
  useEffect(() => {
    if (isSignedIn) {
      loadUserStats();
    }
  }, [isSignedIn]);

  const loadUserStats = async () => {
    // Mock data for now - replace with real API call later
    setUserStats({
      tokensRemaining: 142,
      totalTokens: 150,
      analysesThisMonth: 8,
      subscriptionTier: 'Professional',
      subscriptionPrice: '£35',
      nextBilling: '2025-09-05',
      totalAnalyses: 234,
      avgProcessingTime: '8.4s',
      successRate: '98.2%'
    });
  };

  // Simulate token usage
  const handleAnalysisComplete = () => {
    setUserStats(prev => ({
      ...prev,
      tokensRemaining: Math.max(0, prev.tokensRemaining - 1),
      analysesThisMonth: prev.analysesThisMonth + 1
    }));
  };

  const navigation = [
    { id: 'analyzer', name: '⚡ Analyzer', icon: '🔍', description: 'Create new listings' },
    { id: 'history', name: 'History', icon: '📋', description: 'Past analyses' },
    { id: 'analytics', name: 'Analytics', icon: '📊', description: 'Usage insights' },
    { id: 'tokens', name: 'Tokens', icon: '🪙', description: 'Manage credits' },
    { id: 'subscription', name: 'Billing', icon: '💳', description: 'Subscription' },
  ];

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
          <div className="text-6xl mb-6">⚡</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Fashion Analyzer Pro
          </h1>
          <p className="text-gray-600 mb-8">
            Professional eBay listing creation with AI-powered analysis and ruler measurements.
          </p>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-900 mb-2">✨ Professional Features:</h3>
            <ul className="text-sm text-blue-800 space-y-1 text-left">
              <li>• 📏 Ruler measurement detection</li>
              <li>• 🎯 Brand intelligence & authenticity scoring</li>
              <li>• ⚡ 6-8 second processing with overlapping AI</li>
              <li>• 💰 Condition-adjusted UK pricing</li>
              <li>• 📦 Batch listing system (coming soon)</li>
            </ul>
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-green-900 mb-2">🪙 Token-Based Pricing:</h3>
            <div className="text-sm text-green-800 space-y-1">
              <div className="flex justify-between">
                <span>Professional (150 tokens/month):</span>
                <span className="font-bold">£35</span>
              </div>
              <div className="text-xs text-green-600 mt-2">
                1 token = 1 complete eBay listing
              </div>
            </div>
          </div>

          <SignInButton mode="modal">
            <button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors shadow-lg">
              🚀 Start Professional Trial
            </button>
          </SignInButton>
          
          <p className="text-xs text-gray-500 mt-4">
            7-day free trial • No credit card required
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Professional Sidebar */}
      <div className="w-64 bg-white shadow-xl border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900 flex items-center">
            ⚡ Fashion Analyzer
          </h1>
          <p className="text-sm text-gray-500 mt-1">Professional Dashboard</p>
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-gray-200 bg-blue-50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
              {user?.firstName?.charAt(0) || user?.emailAddresses?.[0]?.emailAddress?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.firstName || user?.emailAddresses?.[0]?.emailAddress?.split('@')[0] || 'User'}
              </p>
              <p className="text-xs text-blue-600 font-medium">
                {userStats.subscriptionTier} Plan
              </p>
            </div>
          </div>
          
          {/* Token Status */}
          <div className="mt-3 bg-white rounded-lg p-3">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-medium text-gray-600">Tokens Remaining</span>
              <span className="text-sm font-bold text-blue-600">
                {userStats.tokensRemaining}/{userStats.totalTokens}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.max((userStats.tokensRemaining / userStats.totalTokens) * 100, 5)}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Resets on {userStats.nextBilling}
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <div className="space-y-2">
            {navigation.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full text-left px-4 py-3 rounded-lg transition-colors duration-200 ${
                  activeTab === item.id
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-lg">{item.icon}</span>
                  <div>
                    <div className="font-medium">{item.name}</div>
                    <div className={`text-xs ${
                      activeTab === item.id ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      {item.description}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={() => signOut()}
            className="w-full text-gray-600 hover:text-gray-900 text-sm py-2 px-4 rounded-lg hover:bg-gray-100 transition-colors"
          >
            🚪 Sign Out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {navigation.find(nav => nav.id === activeTab)?.name}
              </h2>
              <p className="text-gray-500">
                {navigation.find(nav => nav.id === activeTab)?.description}
              </p>
            </div>
            
            {/* Quick Stats */}
            <div className="flex space-x-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{userStats.analysesThisMonth}</div>
                <div className="text-xs text-gray-500">This Month</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{userStats.avgProcessingTime}</div>
                <div className="text-xs text-gray-500">Avg Speed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{userStats.successRate}</div>
                <div className="text-xs text-gray-500">Success Rate</div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-6 overflow-auto">
          {activeTab === 'analyzer' && (
            <AnalysisWorkspace userStats={userStats} onAnalysisComplete={handleAnalysisComplete} />
          )}
          {activeTab === 'history' && (
            <AnalysisHistory />
          )}
          {activeTab === 'analytics' && (
            <UsageAnalytics userStats={userStats} />
          )}
          {activeTab === 'tokens' && (
            <TokenManager userStats={userStats} onTokenUpdate={loadUserStats} />
          )}
          {activeTab === 'subscription' && (
            <SubscriptionManager userStats={userStats} onSubscriptionUpdate={loadUserStats} />
          )}
        </div>
      </div>
    </div>
  );
}