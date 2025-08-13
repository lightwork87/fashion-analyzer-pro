'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import Image from 'next/image';
import { loadStripe } from '@stripe/stripe-js';
import { PLANS, CREDIT_PACKS, calculateVAT, hasActiveSubscription } from '../lib/stripe';
import { supabase, getOrCreateUser } from '../lib/supabase';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

export default function PricingPage() {
  const { user, isLoaded } = useUser();
  const [loading, setLoading] = useState(null);
  const [error, setError] = useState(null);
  const [userData, setUserData] = useState(null);
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        const { user: dbUser, error } = await getOrCreateUser(user);
        if (!error && dbUser) {
          setUserData(dbUser);
          setIsSubscribed(hasActiveSubscription(dbUser));
        }
      }
    };
    
    if (isLoaded && user) {
      fetchUserData();
    }
  }, [user, isLoaded]);

  const handlePurchase = async (priceId, planName) => {
    if (!user) {
      window.location.href = '/sign-in';
      return;
    }

    setLoading(priceId);
    setError(null);

    try {
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId,
          planName,
          userEmail: user.emailAddresses?.[0]?.emailAddress || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      const stripe = await stripePromise;
      const { error: stripeError } = await stripe.redirectToCheckout({
        sessionId: data.sessionId,
      });

      if (stripeError) {
        throw new Error(stripeError.message);
      }
    } catch (err) {
      console.error('Purchase error:', err);
      setError(err.message);
    } finally {
      setLoading(null);
    }
  };

  const handleReportIssue = () => {
    window.location.href = 'mailto:lightlisterai@outlook.com?subject=LightLister%20AI%20-%20Pricing%20Question';
  };

  return (
    <main className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/" className="flex items-center gap-3">
                <Image 
                  src="/logo.png" 
                  alt="LightLister AI" 
                  width={40} 
                  height={40}
                  className="h-10 w-auto"
                />
                <h1 className="text-2xl font-bold text-gray-900">LightLister AI</h1>
              </Link>
              <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs rounded-full font-semibold">
                PRICING
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
                  <button
                    onClick={handleReportIssue}
                    className="text-sm text-gray-600 hover:text-gray-900"
                  >
                    Report Issue
                  </button>
                </>
              )}
              <Link 
                href="/"
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        {/* Subscription Status Banner */}
        {isLoaded && user && isSubscribed && (
          <div className="mb-8 bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <p className="text-green-800">
              <strong>✓ You're a LightLister Pro member!</strong> You can purchase additional credit packs below.
            </p>
          </div>
        )}

        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Simple, Transparent Pricing</h2>
          <p className="text-xl text-gray-600">Join LightLister Pro to access all features</p>
          <p className="text-sm text-gray-500 mt-2">All prices exclude VAT (20%)</p>
        </div>

        {error && (
          <div className="mb-8 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg max-w-2xl mx-auto">
            {error}
          </div>
        )}

        {/* Monthly Subscription */}
        {!isSubscribed && (
          <div className="mb-12 max-w-md mx-auto">
            <h3 className="text-2xl font-semibold text-center mb-8">Become a Member</h3>
            {Object.entries(PLANS).filter(([key]) => key === 'subscription').map(([key, plan]) => {
              const vatInfo = calculateVAT(plan.price);
              return (
                <div 
                  key={key} 
                  className="bg-white rounded-lg shadow-lg border-2 border-blue-500 relative"
                >
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                      RECOMMENDED
                    </span>
                  </div>
                  
                  <div className="p-6">
                    <h4 className="text-xl font-semibold mb-2">{plan.name}</h4>
                    <p className="text-gray-600 mb-4">{plan.description}</p>
                    
                    <div className="mb-6">
                      <div className="flex items-baseline">
                        <span className="text-4xl font-bold">£{plan.price}</span>
                        <span className="text-gray-600 ml-2">/month + VAT</span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        Total: £{vatInfo.total}/month (inc. £{vatInfo.vat} VAT)
                      </p>
                    </div>
                    
                    <div className="space-y-3 mb-6">
                      {plan.features.map((feature, index) => (
                        <div key={index} className="flex items-center">
                          <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="text-gray-700">{feature}</span>
                        </div>
                      ))}
                    </div>
                    
                    <button
                      onClick={() => handlePurchase(plan.priceId, plan.name)}
                      disabled={loading === plan.priceId}
                      className={`w-full py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                        loading === plan.priceId
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-blue-600 hover:bg-blue-700'
                      } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                    >
                      {loading === plan.priceId ? 'Processing...' : 'Start Subscription'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Additional Credit Packs - Members Only */}
        <div className="mb-12">
          <h3 className="text-2xl font-semibold text-center mb-4">
            {isSubscribed ? 'Additional Credit Packs' : 'Member-Only Credit Packs'}
          </h3>
          <p className="text-center text-gray-600 mb-8">
            {isSubscribed 
              ? 'Need more credits? Purchase additional packs anytime'
              : 'Subscribe to LightLister Pro to unlock credit packs'
            }
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {Object.entries(CREDIT_PACKS).map(([key, pack]) => {
              const vatInfo = calculateVAT(pack.price);
              const canPurchase = isSubscribed;
              
              return (
                <div 
                  key={key} 
                  className={`bg-white rounded-lg shadow border p-6 relative ${
                    !canPurchase ? 'opacity-60' : 'border-gray-200'
                  }`}
                >
                  {!canPurchase && (
                    <div className="absolute inset-0 bg-gray-100 bg-opacity-50 rounded-lg flex items-center justify-center">
                      <div className="bg-white px-4 py-2 rounded-full shadow-lg">
                        <span className="text-sm font-semibold text-gray-700">Members Only</span>
                      </div>
                    </div>
                  )}
                  
                  <h4 className="text-lg font-semibold mb-2">{pack.name}</h4>
                  <p className="text-gray-600 text-sm mb-4">{pack.description}</p>
                  
                  <div className="mb-4">
                    <div className="flex items-baseline">
                      <span className="text-2xl font-bold">£{pack.price}</span>
                      <span className="text-gray-600 ml-1 text-sm">+ VAT</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Total: £{vatInfo.total} (inc. VAT)
                    </p>
                  </div>
                  
                  <div className="mb-4">
                    <p className="text-sm text-gray-700">{pack.credits} credits</p>
                    <p className="text-xs text-gray-500">£{pack.perCreditCost.toFixed(2)} per credit</p>
                  </div>
                  
                  <button
                    onClick={() => canPurchase && handlePurchase(pack.priceId, pack.name)}
                    disabled={!canPurchase || loading === pack.priceId}
                    className={`w-full py-2 px-4 border rounded-md shadow-sm text-sm font-medium ${
                      !canPurchase || loading === pack.priceId
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200'
                        : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
                    } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                  >
                    {!canPurchase ? 'Subscribe to Unlock' : loading === pack.priceId ? 'Processing...' : 'Buy Credits'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Not a member CTA */}
        {!isSubscribed && (
          <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-8 text-center max-w-2xl mx-auto">
            <h3 className="text-xl font-semibold mb-3">Ready to Get Started?</h3>
            <p className="text-gray-700 mb-6">
              Join LightLister Pro today and get 150 credits every month plus access to additional credit packs when you need them.
            </p>
            <button
              onClick={() => {
                const subscriptionPlan = PLANS.subscription;
                handlePurchase(subscriptionPlan.priceId, subscriptionPlan.name);
              }}
              className="inline-block px-8 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Start Your Subscription
            </button>
          </div>
        )}

        {/* Features Section */}
        <div className="bg-white rounded-lg shadow p-8 max-w-4xl mx-auto mt-12">
          <h3 className="text-2xl font-semibold text-center mb-8">What's Included</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-start">
              <svg className="w-6 h-6 text-green-500 mr-3 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <h4 className="font-semibold mb-1">AI-Powered Analysis</h4>
                <p className="text-gray-600 text-sm">Advanced brand, size, and condition detection</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <svg className="w-6 h-6 text-green-500 mr-3 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <h4 className="font-semibold mb-1">Multi-Platform Support</h4>
                <p className="text-gray-600 text-sm">Optimized for eBay and Vinted listings</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <svg className="w-6 h-6 text-green-500 mr-3 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <h4 className="font-semibold mb-1">24 Photos Per Listing</h4>
                <p className="text-gray-600 text-sm">Upload up to 24 high-quality images</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <svg className="w-6 h-6 text-green-500 mr-3 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <h4 className="font-semibold mb-1">UK-Specific Features</h4>
                <p className="text-gray-600 text-sm">Tailored for UK resellers and marketplaces</p>
              </div>
            </div>
          </div>
        </div>

        {/* VAT Notice */}
        <div className="mt-8 bg-gray-50 border border-gray-200 rounded-lg p-4 max-w-2xl mx-auto text-center">
          <p className="text-sm text-gray-600">
            <strong>VAT Information:</strong> All prices shown exclude VAT (20%). 
            VAT will be added at checkout. Business customers can enter their VAT number during checkout.
          </p>
        </div>

        {/* FAQ Section */}
        <div className="mt-12 max-w-3xl mx-auto">
          <h3 className="text-2xl font-semibold text-center mb-8">Frequently Asked Questions</h3>
          
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h4 className="font-semibold mb-2">How does the subscription work?</h4>
              <p className="text-gray-600">You'll receive 150 credits every month. Credits reset on your billing date. Cancel anytime from your dashboard.</p>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <h4 className="font-semibold mb-2">Can I buy credit packs without a subscription?</h4>
              <p className="text-gray-600">No, credit packs are exclusive to LightLister Pro members. This ensures our members get the best value and priority support.</p>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <h4 className="font-semibold mb-2">Do unused monthly credits roll over?</h4>
              <p className="text-gray-600">Monthly subscription credits don't roll over, but any credits from additional packs never expire.</p>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <h4 className="font-semibold mb-2">Can I cancel my subscription?</h4>
              <p className="text-gray-600">Yes, you can cancel anytime from your dashboard. You'll keep access until the end of your billing period.</p>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <h4 className="font-semibold mb-2">Is there a free trial?</h4>
              <p className="text-gray-600">Yes! New users get 10 free credits to try LightLister AI. No credit card required.</p>
            </div>
          </div>
        </div>

        {/* Footer CTA */}
        <div className="mt-16 text-center">
          <p className="text-gray-600 mb-4">Have questions about our pricing?</p>
          <button
            onClick={handleReportIssue}
            className="text-blue-600 hover:text-blue-800 underline"
          >
            Contact us for help
          </button>
        </div>
      </div>
    </main>
  );
}