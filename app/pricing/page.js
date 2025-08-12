'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import Image from 'next/image';
import { PLANS, CREDIT_PACKS } from '../lib/stripe';

export default function PricingPage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [loading, setLoading] = useState(false);

  const handleSelectPlan = async (plan) => {
    if (!user) {
      router.push('/sign-up');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: plan.priceId,
          userId: user.id,
        }),
      });

      const data = await response.json();
      
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
      alert('Failed to start checkout. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Image 
                src="/logo.png" 
                alt="LightLister AI" 
                width={40} 
                height={40}
                className="h-10 w-auto"
              />
              <h1 className="text-2xl font-bold text-gray-900">LightLister AI</h1>
              <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs rounded-full font-semibold">
                BETA VERSION
              </span>
            </div>
            <div className="flex items-center gap-4">
              {isLoaded && user && (
                <>
                  <Link 
                    href="/dashboard"
                    className="text-sm bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                  >
                    Dashboard
                  </Link>
                  
                    href="mailto:lightlisterai@outlook.com?subject=LightLister AI - Pricing Question"
                    className="text-sm text-gray-600 hover:text-gray-900"
                  >
                    Report Issue
                  </a>
                </>
              )}
              <Link
                href="/"
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Home
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Simple, Credit-Based Pricing</h2>
          <p className="text-xl text-gray-600">
            1 credit = 1 listing analysis (up to 24 photos)
          </p>
        </div>

        {/* Subscription Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {Object.entries(PLANS).filter(([key]) => key !== 'free').map(([key, plan]) => (
            <div 
              key={key}
              className={`bg-white rounded-lg shadow-lg p-8 relative ${
                plan.popular ? 'ring-2 ring-blue-500' : ''
              }`}
            >
              {plan.popular && (
                <span className="absolute top-0 right-0 bg-blue-500 text-white px-3 py-1 text-sm rounded-bl-lg rounded-tr-lg">
                  Most Popular
                </span>
              )}
              <h3 className="text-2xl font-bold mb-4">{plan.name}</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold">£{plan.price}</span>
                <span className="text-gray-600">/month</span>
              </div>
              <div className="mb-6">
                <p className="text-3xl font-bold text-blue-600">{plan.credits} credits</p>
                <p className="text-sm text-gray-600">£{plan.perCreditCost} per credit</p>
                {plan.savings && (
                  <p className="text-sm text-green-600 font-semibold mt-2">{plan.savings}</p>
                )}
              </div>
              <p className="text-gray-600 mb-6">{plan.description}</p>
              <button
                onClick={() => handleSelectPlan(plan)}
                disabled={loading}
                className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
              >
                {loading ? 'Loading...' : 'Get Started'}
              </button>
            </div>
          ))}
        </div>

        {/* One-time Credit Pack */}
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <h3 className="text-2xl font-bold mb-4">Need Extra Credits?</h3>
          <p className="text-gray-600 mb-6">
            Running low? Get a one-time top-up without changing your plan
          </p>
          <div className="inline-block bg-white rounded-lg shadow p-6">
            <h4 className="font-bold text-lg mb-2">{CREDIT_PACKS.small.name}</h4>
            <p className="text-3xl font-bold mb-2">
              {CREDIT_PACKS.small.credits} credits for £{CREDIT_PACKS.small.price}
            </p>
            <p className="text-sm text-gray-600 mb-4">
              £{CREDIT_PACKS.small.perCreditCost} per credit
            </p>
            <button
              onClick={() => handleSelectPlan(CREDIT_PACKS.small)}
              disabled={loading}
              className="px-8 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
            >
              Buy Credits
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}