// app/dashboard/get-credits/page.js
// GET CREDITS PAGE

'use client';

import Link from 'next/link';
import { ArrowLeft, CreditCard, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function GetCreditsPage() {
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState('starter');

  const plans = [
    {
      id: 'starter',
      name: 'Starter Pack',
      credits: 50,
      price: 4.99,
      perCredit: 0.10,
      popular: false
    },
    {
      id: 'pro',
      name: 'Pro Pack',
      credits: 200,
      price: 14.99,
      perCredit: 0.075,
      popular: true,
      savings: '25% off'
    },
    {
      id: 'business',
      name: 'Business Pack',
      credits: 500,
      price: 29.99,
      perCredit: 0.06,
      popular: false,
      savings: '40% off'
    }
  ];

  const handlePurchase = async (planId) => {
    // TODO: Implement Stripe checkout
    console.log('Purchase plan:', planId);
    alert('Payment integration coming soon!');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Dashboard
          </Link>
          
          <h1 className="text-3xl font-bold text-gray-900">Get More Credits</h1>
          <p className="text-gray-600 mt-2">
            Choose a credit pack to continue analyzing items
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative bg-white rounded-lg shadow-sm border-2 p-6 cursor-pointer transition ${
                selectedPlan === plan.id
                  ? 'border-blue-500 shadow-md'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setSelectedPlan(plan.id)}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-blue-600 text-white text-xs px-3 py-1 rounded-full">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="text-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {plan.name}
                </h3>
                <p className="text-3xl font-bold text-gray-900">
                  £{plan.price}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {plan.credits} credits
                </p>
                {plan.savings && (
                  <p className="text-sm text-green-600 font-medium mt-2">
                    {plan.savings}
                  </p>
                )}
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  £{plan.perCredit.toFixed(3)} per analysis
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  Never expires
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  Instant delivery
                </div>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePurchase(plan.id);
                }}
                className={`w-full py-2 px-4 rounded-lg font-medium transition ${
                  selectedPlan === plan.id
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Select Plan
              </button>
            </div>
          ))}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-2">
            How credits work
          </h3>
          <ul className="space-y-1 text-sm text-blue-800">
            <li>• 1 credit = 1 item analysis (up to 24 photos)</li>
            <li>• Credits never expire</li>
            <li>• Use for both single and bulk analysis</li>
            <li>• Instant AI-powered listings for eBay & Vinted</li>
          </ul>
        </div>
      </div>
    </div>
  );
}