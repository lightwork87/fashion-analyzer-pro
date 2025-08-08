'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function PricingPage() {
  const [loading, setLoading] = useState(null);
  const [error, setError] = useState(null);
  const router = useRouter();
  
  const plans = [
    {
      id: 'starter',
      name: 'Starter',
      price: '£29',
      credits: 150,
      perPhoto: '£0.19',
      features: [
        '150 credits per month',
        'Analyze ~15 items (10 photos each)',
        'All fashion categories',
        'eBay optimization',
        'Email support'
      ],
      priceId: 'price_1RtoYQPeSETpTi7Nlzhu1KyO',
      popular: false
    },
    {
      id: 'professional',
      name: 'Professional',
      price: '£69',
      credits: 450,
      perPhoto: '£0.15',
      savings: 'Save 20%',
      features: [
        '450 credits per month',
        'Analyze ~45 items (10 photos each)',
        'Priority processing',
        'Batch upload (coming soon)',
        'Priority support',
        'Export features'
      ],
      priceId: 'price_1RtoYkPeSETpTi7Nq4SBhCku',
      popular: true
    },
    {
      id: 'business',
      name: 'Business',
      price: '£99',
      credits: 750,
      perPhoto: '£0.13',
      savings: 'Save 30%',
      features: [
        '750 credits per month',
        'Analyze ~75 items (10 photos each)',
        'Bulk processing',
        'API access (coming soon)',
        'Dedicated support',
        'Team features (coming soon)'
      ],
      priceId: 'price_1RtoZ1PeSETpTi7NmQezM39F',
      popular: false
    }
  ];

  const handleSubscribe = async (plan) => {
    setError(null);
    setLoading(plan.id);
    
    console.log('Subscribing to:', plan.name);
    console.log('Price ID:', plan.priceId);
    
    try {
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: plan.priceId,
          email: 'customer@example.com', // TODO: Get from user input/auth
          mode: 'subscription'
        }),
      });
      
      const data = await response.json();
      console.log('API Response:', data);
      
      if (!response.ok) {
        throw new Error(data.error || data.details || 'Failed to create checkout session');
      }
      
      if (data.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      setError(err.message);
    } finally {
      setLoading(null);
    }
  };

  const handleBuyCredits = async () => {
    setError(null);
    setLoading('credits');
    
    try {
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: 'price_1RtoZOPeSETpTi7Ns8eIk36d',
          email: 'customer@example.com',
          mode: 'payment' // One-time payment
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || data.details || 'Failed to create checkout session');
      }
      
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error('Credit purchase error:', err);
      setError(err.message);
    } finally {
      setLoading(null);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-gray-900">Fashion Analyzer Pro</h1>
              <span className="px-3 py-1 bg-green-100 text-green-700 text-xs rounded-full">AI Powered</span>
            </div>
            <button
              onClick={() => router.push('/')}
              className="text-gray-600 hover:text-gray-900"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 font-medium">Error</p>
            <p className="text-red-700 text-sm mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Pricing Header */}
      <div className="pt-12 pb-8 text-center">
        <h2 className="text-4xl font-bold text-gray-900 mb-4">Simple Credit-Based Pricing</h2>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
          1 credit = 1 photo analysis. The more photos you analyze, the better the AI results.
        </p>
        
        {/* Credit Calculator */}
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-sm border p-6 mb-8">
          <h3 className="font-semibold text-gray-900 mb-3">Credit Calculator</h3>
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>Single item (1 photo)</span>
              <span className="font-medium">1 credit</span>
            </div>
            <div className="flex justify-between">
              <span>Single item (10 photos)</span>
              <span className="font-medium">10 credits</span>
            </div>
            <div className="flex justify-between">
              <span>Batch: 25 items × 24 photos</span>
              <span className="font-medium">600 credits</span>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-5xl mx-auto px-4 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`bg-white rounded-lg shadow-sm border-2 ${
                plan.popular ? 'border-blue-500 transform scale-105' : 'border-gray-200'
              } relative overflow-hidden`}
            >
              {plan.popular && (
                <div className="absolute top-0 left-0 right-0 bg-blue-500 text-white py-1 text-sm font-medium text-center">
                  MOST POPULAR
                </div>
              )}
              
              {plan.savings && !plan.popular && (
                <div className="absolute top-0 right-0 bg-green-500 text-white px-3 py-1 text-sm font-medium rounded-bl-lg">
                  {plan.savings}
                </div>
              )}
              
              <div className="p-6 pt-10">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <div className="mb-2">
                  <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                  <span className="text-gray-600">/month</span>
                </div>
                <p className="text-lg font-semibold text-blue-600 mb-1">{plan.credits} credits</p>
                <p className="text-sm text-gray-500 mb-6">{plan.perPhoto} per photo</p>
                
                <button
                  onClick={() => handleSubscribe(plan)}
                  disabled={loading === plan.id}
                  className={`w-full py-3 px-4 rounded-md font-medium transition-all ${
                    plan.popular
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  } ${loading === plan.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {loading === plan.id ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                      </svg>
                      Processing...
                    </span>
                  ) : (
                    'Get Started'
                  )}
                </button>
                
                <ul className="mt-6 space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-gray-600 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* Add-on Credits */}
        <div className="mt-12 text-center">
          <div className="bg-white rounded-lg shadow-sm border p-8">
            <h4 className="text-xl font-bold text-gray-900 mb-2">Need More Credits?</h4>
            <p className="text-gray-600 mb-6">
              Running low? Buy additional credits anytime. No subscription required.
            </p>
            <div className="inline-flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="text-left">
                <p className="font-semibold text-gray-900">100 Extra Credits</p>
                <p className="text-sm text-gray-600">One-time purchase</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-900">£25</p>
                <p className="text-xs text-gray-500">£0.25 per credit</p>
              </div>
              <button
                onClick={handleBuyCredits}
                disabled={loading === 'credits'}
                className={`px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors ${
                  loading === 'credits' ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {loading === 'credits' ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : (
                  'Buy Now'
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Free Trial Info */}
        <div className="mt-8 text-center p-6 bg-gray-100 rounded-lg">
          <h4 className="text-lg font-semibold text-gray-900 mb-2">Start with 10 Free Credits</h4>
          <p className="text-gray-600">
            Try Fashion Analyzer Pro risk-free. No credit card required for your first 10 analyses.
          </p>
        </div>

        {/* Success Message */}
        {router.query?.success === 'true' && (
          <div className="mt-8 max-w-2xl mx-auto">
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
              <h3 className="font-semibold text-green-900 mb-2">🎉 Payment Successful!</h3>
              <p className="text-green-800">
                Your subscription is now active. You can start analyzing fashion items immediately.
              </p>
              <button
                onClick={() => router.push('/')}
                className="mt-4 px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Start Analyzing
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}