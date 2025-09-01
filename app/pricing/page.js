'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';

function PricingPage() {
  const { user, isLoaded } = useUser();
  const [loading, setLoading] = useState(false);

  const plans = [
    {
      name: 'Starter',
      price: '£9.99',
      period: 'month',
      credits: 25,
      features: [
        '25 AI analyses per month',
        'Basic fashion insights',
        'Standard pricing suggestions',
        'Email support'
      ],
      popular: false
    },
    {
      name: 'Pro',
      price: '£24.99',
      period: 'month',
      credits: 100,
      features: [
        '100 AI analyses per month',
        'Advanced fashion insights',
        'Smart pricing recommendations',
        'Bulk processing',
        'Priority support',
        'Multi-platform exports'
      ],
      popular: true
    },
    {
      name: 'Business',
      price: '£49.99',
      period: 'month',
      credits: 250,
      features: [
        '250 AI analyses per month',
        'Professional insights',
        'Market-based pricing',
        'Batch processing (25 items)',
        'API access',
        'Dedicated support',
        'Custom integrations'
      ],
      popular: false
    }
  ];

  const creditPacks = [
    {
      name: '10 Credits',
      price: '£4.99',
      credits: 10,
      savings: null
    },
    {
      name: '50 Credits',
      price: '£19.99',
      credits: 50,
      savings: '20%'
    },
    {
      name: '100 Credits',
      price: '£34.99',
      credits: 100,
      savings: '30%'
    }
  ];

  const handleSubscribe = async (planName) => {
    setLoading(true);
    try {
      const response = await fetch('/api/stripe/create-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ planName })
      });

      const data = await response.json();
      
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Subscription error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBuyCredits = async (creditPack) => {
    setLoading(true);
    try {
      const response = await fetch('/api/stripe/purchase-credits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          credits: creditPack.credits,
          amount: parseFloat(creditPack.price.replace('£', ''))
        })
      });

      const data = await response.json();
      
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Credit purchase error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Get started with AI-powered fashion analysis. Choose a subscription for regular use or buy credits as needed.
          </p>
        </div>

        <div className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            Monthly Subscriptions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map((plan, index) => (
              <div
                key={index}
                className={`relative bg-white rounded-lg shadow-sm border-2 p-6 ${
                  plan.popular ? 'border-blue-500' : 'border-gray-200'
                }`}
              >
                {plan.popular && (
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="text-center mb-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {plan.name}
                  </h3>
                  <div className="mb-4">
                    <span className="text-3xl font-bold text-gray-900">
                      {plan.price}
                    </span>
                    <span className="text-gray-600">/{plan.period}</span>
                  </div>
                  <p className="text-gray-600">
                    {plan.credits} credits included
                  </p>
                </div>

                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center">
                      <svg className="w-4 h-4 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleSubscribe(plan.name)}
                  disabled={loading}
                  className={`w-full py-3 px-4 rounded-lg font-medium ${
                    plan.popular
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                  } disabled:opacity-50`}
                >
                  {loading ? 'Processing...' : user ? 'Subscribe Now' : 'Sign Up to Subscribe'}
                </button>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            One-Time Credit Packs
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {creditPacks.map((pack, index) => (
              <div
                key={index}
                className="bg-white rounded-lg shadow-sm border p-6"
              >
                <div className="text-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {pack.name}
                  </h3>
                  <div className="mb-2">
                    <span className="text-2xl font-bold text-gray-900">
                      {pack.price}
                    </span>
                  </div>
                  {pack.savings && (
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                      Save {pack.savings}
                    </span>
                  )}
                </div>

                <div className="text-center mb-6">
                  <p className="text-gray-600">
                    {pack.credits} AI analyses
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Credits never expire
                  </p>
                </div>

                <button
                  onClick={() => handleBuyCredits(pack)}
                  disabled={loading}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-900 py-2 px-4 rounded-lg font-medium disabled:opacity-50"
                >
                  {loading ? 'Processing...' : user ? 'Buy Credits' : 'Sign Up to Buy'}
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16 text-center">
          <p className="text-gray-600 mb-4">
            Need help choosing? Contact our support team.
          </p>
          <Link href="/dashboard/support">
            <button className="text-blue-600 hover:text-blue-700 font-medium">
              Get Support
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}

