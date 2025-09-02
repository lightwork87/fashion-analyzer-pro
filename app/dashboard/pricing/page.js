'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { Check, CreditCard, Sparkles } from 'lucide-react';

export default function PricingPage() {
  const { user } = useUser();
  const [credits, setCredits] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch credits directly instead of using context
    const fetchCredits = async () => {
      try {
        const response = await fetch('/api/user/credits');
        if (response.ok) {
          const data = await response.json();
          setCredits(data.credits || 0);
        }
      } catch (error) {
        console.error('Error fetching credits:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchCredits();
    }
  }, [user]);

  const plans = [
    {
      name: 'Starter',
      price: 9.99,
      credits: 50,
      features: [
        '50 AI analyses per month',
        'Basic eBay integration',
        'Standard support',
        'Single item upload'
      ],
      popular: false
    },
    {
      name: 'Pro',
      price: 29.99,
      credits: 200,
      features: [
        '200 AI analyses per month',
        'Advanced eBay integration',
        'Priority support',
        'Batch upload (up to 25 items)',
        'Pricing intelligence',
        'Export to CSV'
      ],
      popular: true
    },
    {
      name: 'Business',
      price: 99.99,
      credits: 1000,
      features: [
        '1000 AI analyses per month',
        'Full marketplace integration',
        'Dedicated support',
        'Unlimited batch uploads',
        'API access',
        'Custom AI training',
        'Team collaboration'
      ],
      popular: false
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600">
            Scale your fashion reselling business with AI-powered tools
          </p>
          
          {!loading && (
            <div className="mt-6 inline-flex items-center bg-blue-50 px-4 py-2 rounded-full">
              <CreditCard className="h-5 w-5 text-blue-600 mr-2" />
              <span className="text-blue-900">
                Current credits: <strong>{credits}</strong>
              </span>
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative bg-white rounded-2xl shadow-lg overflow-hidden ${
                plan.popular ? 'ring-2 ring-blue-600' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute top-0 right-0 bg-blue-600 text-white px-3 py-1 text-sm font-semibold rounded-bl-lg">
                  Most Popular
                </div>
              )}
              
              <div className="p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  {plan.name}
                </h3>
                <div className="mb-6">
                  <span className="text-4xl font-bold">${plan.price}</span>
                  <span className="text-gray-600">/month</span>
                </div>
                <div className="mb-6 text-gray-600">
                  {plan.credits} credits included
                </div>
                
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <button
                  className={`w-full py-3 px-4 rounded-lg font-semibold transition ${
                    plan.popular
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  Get Started
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-600 mb-4">
            Need more credits? Purchase additional credits anytime
          </p>
          <Link href="/dashboard/credits">
            <button className="inline-flex items-center px-6 py-3 bg-white border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition">
              <Sparkles className="h-5 w-5 mr-2" />
              Buy Extra Credits
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}