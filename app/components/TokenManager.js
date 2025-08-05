'use client';

import { useState } from 'react';

export default function TokenManager({ userStats, onTokenUpdate }) {
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const tokenPackages = [
    {
      id: 'pack_25',
      tokens: 25,
      price: 12,
      pricePerToken: 0.48,
      popular: false,
      description: 'Perfect for trying out our service'
    },
    {
      id: 'pack_50',
      tokens: 50,
      price: 20,
      pricePerToken: 0.40,
      popular: true,
      description: 'Great value for regular users',
      savings: '17% savings'
    },
    {
      id: 'pack_100',
      tokens: 100,
      price: 35,
      pricePerToken: 0.35,
      popular: false,
      description: 'Best for power users',
      savings: '27% savings'
    },
    {
      id: 'pack_250',
      tokens: 250,
      price: 75,
      pricePerToken: 0.30,
      popular: false,
      description: 'Maximum value for businesses',
      savings: '38% savings'
    }
  ];

  const subscriptionTiers = [
    {
      id: 'starter',
      name: 'Starter',
      tokens: 50,
      price: 15,
      features: [
        '50 analyses per month',
        'Basic condition assessment',
        'Standard processing speed',
        'Email support'
      ]
    },
    {
      id: 'professional',
      name: 'Professional',
      tokens: 150,
      price: 35,
      features: [
        '150 analyses per month',
        'Professional condition assessment',
        'Lightning-fast processing (6-8s)',
        'Ruler measurement detection',
        'Brand intelligence',
        'Priority support',
        'Analysis history'
      ],
      popular: true
    },
    {
      id: 'business',
      name: 'Business',
      tokens: 350,
      price: 65,
      features: [
        '350 analyses per month',
        'All Professional features',
        'Batch processing (coming soon)',
        'Team collaboration',
        'API access',
        'Custom integrations',
        'Phone support'
      ]
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      tokens: 1000,
      price: 125,
      features: [
        '1000 analyses per month',
        'All Business features',
        'White-label options',
        'Dedicated account manager',
        'Custom pricing tiers',
        'SLA guarantee',
        '24/7 priority support'
      ]
    }
  ];

  const handlePurchaseTokens = async (packageData) => {
    setIsProcessing(true);
    setSelectedPackage(packageData.id);
    
    try {
      // Mock purchase for now - replace with Stripe later
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      alert(`Successfully purchased ${packageData.tokens} tokens! (Mock purchase)`);
      
      if (onTokenUpdate) {
        onTokenUpdate();
      }
      
    } catch (error) {
      alert('Purchase failed. Please try again.');
      console.error('Token purchase error:', error);
    } finally {
      setIsProcessing(false);
      setSelectedPackage(null);
    }
  };

  const handleUpgradeSubscription = async (tier) => {
    setIsProcessing(true);
    
    try {
      // Mock upgrade for now - replace with Stripe later
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      alert(`Successfully upgraded to ${tier.name} plan! (Mock upgrade)`);
      
    } catch (error) {
      alert('Upgrade failed. Please try again.');
      console.error('Subscription upgrade error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Current Token Status */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Current Token Status</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-600">{userStats.tokensRemaining}</div>
            <div className="text-sm text-blue-800">Tokens Remaining</div>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-600">{userStats.totalTokens}</div>
            <div className="text-sm text-green-800">Monthly Allowance</div>
          </div>
          
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-purple-600">{userStats.analysesThisMonth}</div>
            <div className="text-sm text-purple-800">Used This Month</div>
          </div>
        </div>
        
        <div className="mt-6">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Usage Progress</span>
            <span>{userStats.analysesThisMonth} / {userStats.totalTokens}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-300"
              style={{ width: `${Math.min((userStats.analysesThisMonth / userStats.totalTokens) * 100, 100)}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Resets on {userStats.nextBilling}
          </p>
        </div>
      </div>

      {/* Token Packages */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Buy Additional Tokens</h3>
        <p className="text-gray-600 mb-6">
          Need more tokens before your next billing cycle? Purchase additional tokens that never expire.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {tokenPackages.map((pkg) => (
            <div
              key={pkg.id}
              className={`relative border-2 rounded-lg p-4 transition-colors ${
                pkg.popular
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {pkg.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                    Most Popular
                  </span>
                </div>
              )}
              
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">{pkg.tokens}</div>
                <div className="text-sm text-gray-500 mb-2">tokens</div>
                
                <div className="text-2xl font-bold text-green-600 mb-1">£{pkg.price}</div>
                <div className="text-xs text-gray-500 mb-3">
                  £{pkg.pricePerToken.toFixed(2)} per token
                </div>
                
                {pkg.savings && (
                  <div className="text-xs font-medium text-green-600 mb-3">
                    {pkg.savings}
                  </div>
                )}
                
                <p className="text-xs text-gray-600 mb-4">{pkg.description}</p>
                
                <button
                  onClick={() => handlePurchaseTokens(pkg)}
                  disabled={isProcessing && selectedPackage === pkg.id}
                  className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                    pkg.popular
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-gray-600 hover:bg-gray-700 text-white'
                  } disabled:opacity-50`}
                >
                  {isProcessing && selectedPackage === pkg.id ? (
                    <span className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing...
                    </span>
                  ) : (
                    'Purchase'
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Subscription Tiers */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Subscription Plans</h3>
        <p className="text-gray-600 mb-6">
          Upgrade your plan for better value and more tokens each month.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {subscriptionTiers.map((tier) => (
            <div
              key={tier.id}
              className={`relative border-2 rounded-lg p-6 transition-colors ${
                tier.popular
                  ? 'border-blue-500 bg-blue-50'
                  : userStats.subscriptionTier === tier.name
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200'
              }`}
            >
              {tier.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                    Recommended
                  </span>
                </div>
              )}
              
              {userStats.subscriptionTier === tier.name && (
                <div className="absolute -top-3 right-4">
                  <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                    Current Plan
                  </span>
                </div>
              )}
              
              <div className="text-center mb-6">
                <h4 className="text-lg font-bold text-gray-900 mb-2">{tier.name}</h4>
                <div className="text-3xl font-bold text-gray-900">£{tier.price}</div>
                <div className="text-sm text-gray-500">per month</div>
                <div className="text-sm text-blue-600 font-medium mt-1">
                  {tier.tokens} tokens/month
                </div>
              </div>
              
              <ul className="space-y-3 mb-6">
                {tier.features.map((feature, index) => (
                  <li key={index} className="flex items-start text-sm">
                    <span className="text-green-500 mr-2 flex-shrink-0">✓</span>
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <button
                onClick={() => handleUpgradeSubscription(tier)}
                disabled={userStats.subscriptionTier === tier.name || isProcessing}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                  userStats.subscriptionTier === tier.name
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : tier.popular
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-gray-600 hover:bg-gray-700 text-white'
                } disabled:opacity-50`}
              >
                {userStats.subscriptionTier === tier.name
                  ? 'Current Plan'
                  : isProcessing
                  ? 'Processing...'
                  : `Upgrade to ${tier.name}`
                }
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Token Usage Tips */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h3 className="text-lg font-bold text-yellow-900 mb-4">💡 Token Usage Tips</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-yellow-800">
          <div>
            <h4 className="font-semibold mb-2">Maximize Your Tokens:</h4>
            <ul className="space-y-1">
              <li>• Upload 8-12 photos per item for best results</li>
              <li>• Include ruler measurements for premium pricing</li>
              <li>• Clear, well-lit photos improve accuracy</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Token Facts:</h4>
            <ul className="space-y-1">
              <li>• 1 token = 1 complete eBay listing</li>
              <li>• Process up to 24 photos per token</li>
              <li>• Additional tokens never expire</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}