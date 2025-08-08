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
        'Analyze 150 items (unlimited photos each)',
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
        'Analyze 450 items (unlimited photos each)',
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
        'Analyze 750 items (unlimited photos each)',
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
    
    try {
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: plan.priceId,
          email: 'customer@example.com',
          mode: 'subscription'
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || data.details || 'Failed to create checkout session');
      }
      
      if (data.url) {
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
          mode: 'payment'
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

      {/* Pricing Hero */}
      <div className="bg-white py-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-gray-900">Simple, Credit-Based Pricing</h2>
          <p className="mt-4 text-xl text-gray-600">
            Pay for what you use. 1 credit = 1 listing analysis (up to 24 photos)
          </p>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`bg-white rounded-lg shadow-lg overflow-hidden ${
                plan.popular ? 'ring-2 ring-blue-600' : ''
              }`}
            >
              {plan.popular && (
                <div className="bg-blue-600 text-white text-center py-2 text-sm font-medium">
                  MOST POPULAR
                </div>
              )}
              
              <div className="p-8">
                <h3 className="text-2xl font-bold text-gray-900">{plan.name}</h3>
                <div className="mt-4 flex items-baseline">
                  <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                  <span className="ml-2 text-gray-600">/month</span>
                </div>
                
                <div className="mt-4 space-y-1">
                  <p className="text-lg font-medium text-gray-900">{plan.credits} credits</p>
                  <p className="text-sm text-gray-600">{plan.perPhoto} per listing</p>
                  {plan.savings && (
                    <p className="text-sm font-medium text-green-600">{plan.savings}</p>
                  )}
                </div>
                
                <ul className="mt-6 space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <svg
                        className="flex-shrink-0 h-5 w-5 text-green-500 mt-0.5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="ml-2 text-gray-700 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <button
                  onClick={() => handleSubscribe(plan)}
                  disabled={loading === plan.id}
                  className={`mt-8 w-full py-3 px-4 rounded-md font-medium transition-colors ${
                    plan.popular
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                  } ${loading === plan.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {loading === plan.id ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </span>
                  ) : (
                    'Subscribe Now'
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
        
        {/* One-time Credit Purchase */}
        <div className="mt-12 bg-white rounded-lg shadow-lg p-8 max-w-2xl mx-auto">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-gray-900">Need More Credits?</h3>
            <p className="mt-2 text-gray-600">
              Buy additional credits anytime. No subscription required.
            </p>
            
            <div className="mt-6 inline-flex items-center gap-4">
              <div>
                <p className="text-3xl font-bold text-gray-900">100 credits</p>
                <p className="text-gray-600">One-time purchase</p>
              </div>
              <div className="text-4xl text-gray-400">→</div>
              <div>
                <p className="text-3xl font-bold text-gray-900">£25</p>
                <p className="text-gray-600">£0.25 per listing</p>
              </div>
            </div>
            
            <button
              onClick={handleBuyCredits}
              disabled={loading === 'credits'}
              className={`mt-8 px-8 py-3 bg-green-600 text-white rounded-md font-medium hover:bg-green-700 transition-colors ${
                loading === 'credits' ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {loading === 'credits' ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
              ) : (
                'Buy 100 Credits'
              )}
            </button>
          </div>
        </div>
        
        {/* FAQ Section */}
        <div className="mt-16 max-w-3xl mx-auto">
          <h3 className="text-2xl font-bold text-gray-900 text-center mb-8">
            Frequently Asked Questions
          </h3>
          
          <div className="space-y-6">
            <div className="bg-white rounded-lg p-6">
              <h4 className="font-semibold text-gray-900">How do credits work?</h4>
              <p className="mt-2 text-gray-600">
                Each fashion item analysis costs 1 credit, regardless of how many photos you upload (up to 24 photos per item). 
                Credits reset monthly on your subscription date.
              </p>
            </div>
            
            <div className="bg-white rounded-lg p-6">
              <h4 className="font-semibold text-gray-900">Do unused credits roll over?</h4>
              <p className="mt-2 text-gray-600">
                Monthly subscription credits do not roll over. However, credits purchased as one-time top-ups never expire 
                and remain in your account until used.
              </p>
            </div>
            
            <div className="bg-white rounded-lg p-6">
              <h4 className="font-semibold text-gray-900">Can I change plans anytime?</h4>
              <p className="mt-2 text-gray-600">
                Yes! You can upgrade or downgrade your plan at any time. Changes take effect at your next billing cycle.
              </p>
            </div>
            
            <div className="bg-white rounded-lg p-6">
              <h4 className="font-semibold text-gray-900">What payment methods do you accept?</h4>
              <p className="mt-2 text-gray-600">
                We accept all major credit cards, debit cards, and digital wallets through our secure payment processor, Stripe.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}