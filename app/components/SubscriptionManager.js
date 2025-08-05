'use client';

import { useState } from 'react';

export default function SubscriptionManager({ userStats, onSubscriptionUpdate }) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  const handleUpdateBilling = async () => {
    setIsUpdating(true);
    
    try {
      // Mock for now - will integrate with Stripe later
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert('Billing portal would open here (Stripe integration coming)');
      
    } catch (error) {
      alert('Failed to open billing portal. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancelSubscription = async () => {
    setIsUpdating(true);
    
    try {
      // Mock cancellation
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert('Subscription cancelled successfully (Mock)');
      setShowCancelModal(false);
      
      if (onSubscriptionUpdate) {
        onSubscriptionUpdate();
      }
      
    } catch (error) {
      alert('Failed to cancel subscription. Please contact support.');
    } finally {
      setIsUpdating(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-UK', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-8">
      {/* Current Subscription */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-6">Current Subscription</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <div className="bg-blue-50 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-bold text-blue-900">{userStats.subscriptionTier} Plan</h4>
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                  Active
                </span>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-blue-700">Monthly Price:</span>
                  <span className="font-semibold text-blue-900">{userStats.subscriptionPrice}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">Tokens per Month:</span>
                  <span className="font-semibold text-blue-900">{userStats.totalTokens}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">Next Billing:</span>
                  <span className="font-semibold text-blue-900">{formatDate(userStats.nextBilling)}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Plan Features</h4>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-center">
                <span className="text-green-500 mr-3">✓</span>
                {userStats.totalTokens} analyses per month
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-3">✓</span>
                Lightning-fast processing (6-8 seconds)
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-3">✓</span>
                Professional condition assessment
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-3">✓</span>
                Ruler measurement detection
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-3">✓</span>
                Brand intelligence & authenticity scoring
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-3">✓</span>
                Analysis history & export
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-3">✓</span>
                Priority email support
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-8 flex gap-4">
          <button
            onClick={handleUpdateBilling}
            disabled={isUpdating}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {isUpdating ? 'Loading...' : 'Manage Billing'}
          </button>
          
          <button
            onClick={() => setShowCancelModal(true)}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Cancel Subscription
          </button>
        </div>
      </div>

      {/* Usage This Month */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-6">This Month's Usage</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-600">{userStats.analysesThisMonth}</div>
            <div className="text-sm text-blue-800">Analyses Used</div>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-600">{userStats.tokensRemaining}</div>
            <div className="text-sm text-green-800">Tokens Remaining</div>
          </div>
          
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-purple-600">{userStats.avgProcessingTime}</div>
            <div className="text-sm text-purple-800">Avg Processing Time</div>
          </div>
          
          <div className="bg-orange-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-orange-600">{userStats.successRate}</div>
            <div className="text-sm text-orange-800">Success Rate</div>
          </div>
        </div>
        
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Monthly Usage</span>
            <span>{userStats.analysesThisMonth} / {userStats.totalTokens} tokens</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-300"
              style={{ width: `${Math.min((userStats.analysesThisMonth / userStats.totalTokens) * 100, 100)}%` }}
            ></div>
          </div>
        </div>
        
        {userStats.analysesThisMonth > userStats.totalTokens * 0.8 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex">
              <div className="text-yellow-500 mr-3">⚠️</div>
              <div>
                <h4 className="font-semibold text-yellow-800">High Usage Alert</h4>
                <p className="text-yellow-700 text-sm">
                  You've used {Math.round((userStats.analysesThisMonth / userStats.totalTokens) * 100)}% of your monthly tokens. 
                  Consider upgrading your plan or purchasing additional tokens.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Payment Method */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-6">Payment Method</h3>
        
        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
          <div className="flex items-center">
            <div className="w-12 h-8 bg-blue-600 rounded flex items-center justify-center text-white text-xs font-bold mr-4">
              VISA
            </div>
            <div>
              <div className="font-medium text-gray-900">•••• •••• •••• 4242</div>
              <div className="text-sm text-gray-500">Expires 12/2028</div>
            </div>
          </div>
          
          <button
            onClick={handleUpdateBilling}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            Update
          </button>
        </div>
      </div>

      {/* Cancel Subscription Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 m-4 max-w-md w-full">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Cancel Subscription</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to cancel your subscription? You'll lose access to premium features 
              at the end of your current billing period.
            </p>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex">
                <div className="text-yellow-500 mr-3">⚠️</div>
                <div className="text-sm text-yellow-800">
                  <p className="font-semibold">What you'll lose:</p>
                  <ul className="mt-2 space-y-1">
                    <li>• Lightning-fast processing</li>
                    <li>• Professional condition assessment</li>
                    <li>• Ruler measurement detection</li>
                    <li>• Priority support</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-4 rounded-lg font-medium"
              >
                Keep Subscription
              </button>
              <button
                onClick={handleCancelSubscription}
                disabled={isUpdating}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg font-medium disabled:opacity-50"
              >
                {isUpdating ? 'Cancelling...' : 'Yes, Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}