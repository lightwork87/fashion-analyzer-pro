'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useCredits } from '../../contexts/CreditsContext';

export default function PricingPage() {
  const { user } = useUser();
  const { credits, updateCredits } = useCredits();
  const [isMember, setIsMember] = useState(false); // Would check actual membership status

  const handlePurchase = (pack) => {
    if (!isMember && pack.requiresMembership) {
      alert('You need to be a member to purchase credit packs. Subscribe to LightLister Pro first!');
      return;
    }
    
    // Stripe integration would go here
    alert(`Purchasing ${pack.name} - Stripe integration coming soon!`);
    
    // For demo, add credits
    if (pack.credits) {
      updateCredits(credits + pack.credits);
    }
  };

  const handleSubscribe = () => {
    // Stripe subscription would go here
    alert('Subscribing to LightLister Pro - Stripe integration coming soon!');
    setIsMember(true);
  };

  const pricingPlans = [
    {
      name: 'Free Trial',
      credits: 5,
      price: 'Free',
      description: 'Get started with 5 free credits',
      badge: 'New Users',
      popular: false,
      requiresMembership: false,
      oneTime: true
    },
    {
      name: 'LightLister Pro Monthly',
      credits: null,
      price: '£45.00',
      period: 'month',
      description: 'Unlimited analyses + member benefits',
      badge: 'Subscription',
      popular: true,
      requiresMembership: false,
      features: [
        'Unlimited analyses per month',
        'Access to credit packs',
        'Priority support',
        'Advanced features',
        'Bulk processing'
      ]
    },
    {
      name: 'Starter Pack',
      credits: 10,
      price: '£3.00',
      description: 'Perfect for trying out the service',
      badge: 'Members Only',
      popular: false,
      requiresMembership: true
    },
    {
      name: 'Growth Pack',
      credits: 50,
      price: '£15.00',
      description: 'Great for regular sellers',
      badge: 'Members Only',
      popular: false,
      requiresMembership: true
    },
    {
      name: 'Pro Pack',
      credits: 150,
      price: '£45.00',
      description: 'Best value for power users',
      badge: 'Members Only',
      popular: false,
      requiresMembership: true
    }
  ];

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Choose Your Plan</h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Subscribe to unlock credit packs and unlimited features
          </p>
        </div>

        {/* Membership Status */}
        {!isMember && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-8 text-center">
            <p className="text-yellow-800 dark:text-yellow-300">
              ⚠️ You need a LightLister Pro membership to purchase credit packs
            </p>
          </div>
        )}

        {/* Subscription Plan - Featured */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg shadow-xl p-1">
            <div className="bg-white dark:bg-gray-900 rounded-lg p-8">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    LightLister Pro Monthly
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    Unlimited analyses + member benefits
                  </p>
                  <div className="space-y-2 mb-6">
                    {['Unlimited analyses per month', 'Access to credit packs', 'Priority support', 'Advanced features', 'Bulk processing'].map((feature) => (
                      <div key={feature} className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-gray-900 dark:text-white">£45.00</div>
                  <div className="text-gray-600 dark:text-gray-400">per month</div>
                  <button
                    onClick={handleSubscribe}
                    className="mt-4 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition font-medium"
                  >
                    {isMember ? 'Current Plan' : 'Subscribe Now'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Credit Packs */}
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Credit Packs</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {pricingPlans.filter(plan => plan.requiresMembership !== false && plan.credits).map((plan) => (
            <div
              key={plan.name}
              className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 ${
                !isMember ? 'opacity-60' : ''
              }`}
            >
              {plan.badge && (
                <div className="inline-block px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 text-sm font-semibold rounded-full mb-4">
                  {plan.badge}
                </div>
              )}
              
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {plan.name}
              </h3>
              <div className="mb-4">
                <span className="text-3xl font-bold text-gray-900 dark:text-white">
                  {plan.price}
                </span>
              </div>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                {plan.description}
              </p>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                {plan.credits} credits
              </p>
              <button
                onClick={() => handlePurchase(plan)}
                disabled={!isMember}
                className={`w-full py-2 px-4 rounded-lg font-medium transition ${
                  isMember
                    ? 'bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200'
                    : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                }`}
              >
                {isMember ? 'Buy Now' : 'Members Only'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}