// app/dashboard/get-credits/page.js - NEW FILE
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CreditCard, Check, Zap } from 'lucide-react';

export default function GetCreditsPage() {
  const [selectedPlan, setSelectedPlan] = useState('starter');
  const [loading, setLoading] = useState(false);

  const plans = [
    {
      id: 'starter',
      name: 'Starter Pack',
      credits: 10,
      price: 10,
      perCredit: 1.00,
      popular: false
    },
    {
      id: 'popular',
      name: 'Popular Pack',
      credits: 50,
      price: 40,
      perCredit: 0.80,
      popular: true,
      savings: '20% off'
    },
    {
      id: 'pro',
      name: 'Pro Pack',
      credits: 100,
      price: 70,
      perCredit: 0.70,
      popular: false,
      savings: '30% off'
    },
    {
      id: 'business',
      name: 'Business Pack',
      credits: 500,
      price: 300,
      perCredit: 0.60,
      popular: false,
      savings: '40% off'
    }
  ];

  const handlePurchase = async () => {
    setLoading(true);
    // TODO: Implement Stripe payment
    alert('Payment integration coming soon! Contact support for manual top-up.');
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard" className="text-blue-600 hover:text-blue-700 text-sm mb-4 inline-block">
            ← Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Get More Credits</h1>
          <p className="text-gray-600 mt-1">Choose a credit pack that suits your needs</p>
        </div>

        {/* How Credits Work */}
        <div className="bg-blue-50 rounded-lg p-6 mb-8">
          <h2 className="font-semibold text-gray-900 mb-2 flex items-center">
            <Zap className="h-5 w-5 mr-2 text-blue-600" />
            How Credits Work
          </h2>
          <ul className="text-sm text-gray-700 space-y-1">
            <li>• 1 credit = 1 item analysis (unlimited photos per item)</li>
            <li>• Credits never expire</li>
            <li>• Bulk analysis uses 1 credit per item</li>
            <li>• Failed analyses don't consume credits</li>
          </ul>
        </div>

        {/* Pricing Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative bg-white rounded-lg shadow-lg p-6 cursor-pointer transition-all
                ${selectedPlan === plan.id ? 'ring-2 ring-blue-600' : 'hover:shadow-xl'}
                ${plan.popular ? 'transform scale-105' : ''}`}
              onClick={() => setSelectedPlan(plan.id)}
            >
              {plan.popular && (
                <div className="absolute top-0 right-0 bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-lg">
                  MOST POPULAR
                </div>
              )}
              
              <div className="text-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
                <div className="mt-4">
                  <span className="text-3xl font-bold text-gray-900">£{plan.price}</span>
                </div>
                <p className="text-gray-600 mt-1">{plan.credits} credits</p>
                {plan.savings && (
                  <span className="inline-block mt-2 px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                    {plan.savings}
                  </span>
                )}
              </div>
              
              <div className="border-t pt-4">
                <p className="text-sm text-gray-600 text-center">
                  £{plan.perCredit.toFixed(2)} per credit
                </p>
              </div>
              
              {selectedPlan === plan.id && (
                <div className="absolute top-2 left-2">
                  <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                    <Check className="h-4 w-4 text-white" />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Payment Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Complete Your Purchase</h3>
          
          <div className="mb-6">
            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">
                  {plans.find(p => p.id === selectedPlan)?.name}
                </p>
                <p className="text-sm text-gray-600">
                  {plans.find(p => p.id === selectedPlan)?.credits} credits
                </p>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                £{plans.find(p => p.id === selectedPlan)?.price}
              </p>
            </div>
          </div>

          <button
            onClick={handlePurchase}
            disabled={loading}
            className="w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-400 flex items-center justify-center"
          >
            <CreditCard className="h-5 w-5 mr-2" />
            {loading ? 'Processing...' : 'Purchase Credits'}
          </button>
          
          <p className="text-xs text-gray-500 text-center mt-4">
            Secure payment powered by Stripe. VAT included where applicable.
          </p>
        </div>

        {/* FAQ */}
        <div className="mt-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div className="bg-white rounded-lg p-6">
              <h3 className="font-medium text-gray-900 mb-2">Do credits expire?</h3>
              <p className="text-gray-600">No, credits never expire. Use them whenever you need.</p>
            </div>
            <div className="bg-white rounded-lg p-6">
              <h3 className="font-medium text-gray-900 mb-2">Can I get a refund?</h3>
              <p className="text-gray-600">We offer a 14-day money-back guarantee on unused credits.</p>
            </div>
            <div className="bg-white rounded-lg p-6">
              <h3 className="font-medium text-gray-900 mb-2">Need more credits?</h3>
              <p className="text-gray-600">Contact us for custom enterprise packages with volume discounts.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}