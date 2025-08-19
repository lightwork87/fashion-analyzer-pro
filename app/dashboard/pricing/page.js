'use client';

import Link from 'next/link';
import { useCredits } from '../../contexts/CreditsContext';
import CreditsDisplay from '../../components/CreditsDisplay';
import ThemeToggle from '../../components/ThemeToggle';

export default function PricingPage() {
  const { credits, updateCredits } = useCredits();

  const handlePurchase = (pack) => {
    // This would integrate with Stripe
    alert(`Purchasing ${pack.name} - Stripe integration coming soon!`);
    // For demo, add credits
    if (pack.credits) {
      updateCredits(credits + pack.credits);
    }
  };

  const pricingPlans = [
    {
      name: 'Starter Pack',
      credits: 10,
      price: '£3.00',
      description: 'Perfect for trying out the service',
      badge: 'Members Only',
      popular: false
    },
    {
      name: 'Growth Pack',
      credits: 50,
      price: '£15.00',
      description: 'Great for regular sellers',
      badge: null,
      popular: true
    },
    {
      name: 'Pro Pack',
      credits: 150,
      price: '£45.00',
      description: 'Best value for power users',
      badge: null,
      popular: false
    },
    {
      name: 'LightLister Pro Monthly',
      credits: null,
      price: '£45.00/month',
      description: 'Unlimited analyses per month',
      badge: 'Subscription',
      popular: false
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Navigation */}
      <nav className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="flex items-center gap-2 hover:opacity-80">
                <div className="w-8 h-8 bg-black dark:bg-white rounded-lg flex items-center justify-center">
                  <span className="text-white dark:text-black font-bold text-sm">LL</span>
                </div>
                <h1 className="text-xl font-bold dark:text-white">LightLister AI</h1>
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <CreditsDisplay />
              <ThemeToggle />
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/dashboard" className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6">
          ← Back to Dashboard
        </Link>

        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Choose Your Plan</h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Get more credits to create perfect listings faster
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            New users get 5 free credits to start!
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {pricingPlans.map((plan) => (
            <div
              key={plan.name}
              className={`relative bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden ${
                plan.popular ? 'ring-2 ring-blue-500' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute top-0 right-0 bg-blue-500 text-white px-3 py-1 text-sm font-semibold">
                  Popular
                </div>
              )}
              {plan.badge && !plan.popular && (
                <div className="absolute top-0 right-0 bg-purple-500 text-white px-3 py-1 text-sm font-semibold">
                  {plan.badge}
                </div>
              )}
              
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {plan.name}
                </h3>
                <div className="mb-4">
                  <span className="text-3xl font-bold text-gray-900 dark:text-white">
                    {plan.price.split('/')[0]}
                  </span>
                  {plan.price.includes('/') && (
                    <span className="text-gray-600 dark:text-gray-400">
                      /{plan.price.split('/')[1]}
                    </span>
                  )}
                </div>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  {plan.description}
                </p>
                {plan.credits && (
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                    {plan.credits} credits
                  </p>
                )}
                <button
                  onClick={() => handlePurchase(plan)}
                  className={`w-full py-2 px-4 rounded-lg font-medium transition ${
                    plan.popular
                      ? 'bg-blue-500 text-white hover:bg-blue-600'
                      : 'bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200'
                  }`}
                >
                  {plan.credits ? 'Buy Now' : 'Subscribe'}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center text-sm text-gray-600 dark:text-gray-400">
          <p>💳 Secure payment via Stripe</p>
          <p className="mt-2">All prices include VAT</p>
        </div>
      </div>
    </div>
  );
}