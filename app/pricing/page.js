'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import Image from 'next/image';
import { loadStripe } from '@stripe/stripe-js';
import { PLANS, CREDIT_PACKS, calculateVAT } from '../lib/stripe';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

export default function PricingPage() {
  const { user, isLoaded } = useUser();
  const [loading, setLoading] = useState(null);
  const [error, setError] = useState(null);

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
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Simple, Transparent Pricing</h2>
          <p className="text-xl text-gray-600">Choose the plan that works best for your reselling business</p>
          <p className="text-sm text-gray-500 mt-2">1 credit = 1 listing (up to 24 photos) • All prices exclude VAT</p>
        </div>

        {error && (
          <div className="mb-8 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg max-w-2xl mx-auto">
            {error}
          </div>
        )}

        {/* Main Credit Bundle */}
        <div className="mb-12 max-w-md mx-auto">
          <h3 className="text-2xl font-semibold text-center mb-8">Credit Bundle</h3>
          {Object.entries(PLANS).filter(([key]) => key !== 'free').map(([key, plan]) => {
            const vatInfo = calculateVAT(plan.price);
            return (
              <div 
                key={key} 
                className="bg-white rounded-lg shadow-lg border-2 border-blue-500 relative"
              >
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                    BEST VALUE
                  </span>
                </div>
                
                <div className="p-6">
                  <h4 className="text-xl font-semibold mb-2">{plan.name}</h4>
                  <p className="text-gray-600 mb-4">{plan.description}</p>
                  
                  <div className="mb-6">
                    <div className="flex items-baseline">
                      <span className="text-4xl font-bold">£{plan.price}</span>
                      <span className="text-gray-600 ml-2">+ VAT</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Total: £{vatInfo.total} (inc. £{vatInfo.vat} VAT)
                    </p>
                  </div>
                  
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-gray-700">{plan.credits} credits</span>
                    </div>
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-gray-700">£{plan.perCreditCost.toFixed(2)} per listing</span>
                    </div>
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-green-600 font-semibold">One-time purchase</span>
                    </div>
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
                    {loading === plan.priceId ? 'Processing...' : 'Buy Credits'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Additional Credit Packs */}
        <div className="mb-12">
          <h3 className="text-2xl font-semibold text-center mb-4">Need More Credits?</h3>
          <p className="text-center text-gray-600 mb-8">Additional credit packs for flexibility</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {Object.entries(CREDIT_PACKS).map(([key, pack]) => {
              const vatInfo = calculateVAT(pack.price);
              return (
                <div key={key} className="bg-white rounded-lg shadow border border-gray-200 p-6">
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
                    onClick={() => handlePurchase(pack.priceId, pack.name)}
                    disabled={loading === pack.priceId}
                    className={`w-full py-2 px-4 border rounded-md shadow-sm text-sm font-medium ${
                      loading === pack.priceId
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200'
                        : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
                    } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                  >
                    {loading === pack.priceId ? 'Processing...' : 'Buy Credits'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Features Section */}
        <div className="bg-white rounded-lg shadow p-8 max-w-4xl mx-auto">
          <h3 className="text-2xl font-semibold text-center mb-8">All Purchases Include</h3>
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
            
            <div className="flex items-start">
              <svg className="w-6 h-6 text-green-500 mr-3 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <h4 className="font-semibold mb-1">No Expiry</h4>
                <p className="text-gray-600 text-sm">Credits never expire - use them when you need</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <svg className="w-6 h-6 text-green-500 mr-3 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <h4 className="font-semibold mb-1">Priority Support</h4>
                <p className="text-gray-600 text-sm">Get help when you need it</p>
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
              <h4 className="font-semibold mb-2">How do credits work?</h4>
              <p className="text-gray-600">1 credit = 1 complete listing analysis, regardless of how many photos you upload (up to 24). Credits never expire.</p>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <h4 className="font-semibold mb-2">Is this a subscription?</h4>
              <p className="text-gray-600">No! All our credit packs are one-time purchases. Buy credits when you need them with no recurring charges.</p>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <h4 className="font-semibold mb-2">Do credits expire?</h4>
              <p className="text-gray-600">No, your credits never expire. Use them at your own pace.</p>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <h4 className="font-semibold mb-2">Can I get a VAT invoice?</h4>
              <p className="text-gray-600">Yes, VAT invoices are automatically generated and emailed after each purchase.</p>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <h4 className="font-semibold mb-2">Is there a free trial?</h4>
              <p className="text-gray-600">Yes! New users get 10 free credits to try LightLister AI. No credit card required.</p>
            </div>
          </div>
        </div>

        {/* Footer CTA */}
        <div className="mt-16 text-center">
          <p className="text-gray-600 mb-4">Not sure which pack is right for you?</p>
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