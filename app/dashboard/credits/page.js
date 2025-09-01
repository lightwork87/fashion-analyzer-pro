// app/dashboard/credits/page.js
// FIXED TO MATCH YOUR ACTUAL STRIPE PRODUCTS

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { 
  Home, CreditCard, CheckCircle, PoundSterling, 
  ChevronRight, Loader2, Star, Package, Info
} from 'lucide-react';

export default function CreditsPage() {
  const { user } = useUser();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [userData, setUserData] = useState({
    credits: 0,
    subscription: 'free',
    nextBillingDate: null
  });

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/user/billing');
      if (response.ok) {
        const data = await response.json();
        setUserData(data);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async () => {
    setProcessingPayment(true);
    try {
      const response = await fetch('/api/stripe/create-subscription', {
        method: 'POST'
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.url) {
          window.location.href = data.url;
        }
      }
    } catch (error) {
      console.error('Subscription error:', error);
      alert('Failed to start subscription');
    } finally {
      setProcessingPayment(false);
    }
  };

  const handlePurchasePack = async (packId) => {
    setProcessingPayment(true);
    try {
      const response = await fetch('/api/stripe/purchase-credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packId })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.url) {
          window.location.href = data.url;
        }
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to purchase credits');
      }
    } catch (error) {
      console.error('Purchase error:', error);
      alert('Failed to purchase credits');
    } finally {
      setProcessingPayment(false);
    }
  };

  const isSubscribed = userData.subscription === 'pro';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="p-2 hover:bg-gray-100 rounded-lg">
                <Home className="w-5 h-5" />
              </Link>
              <h1 className="text-xl font-bold">Credits & Billing</h1>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100">
              <CreditCard className="w-4 h-4" />
              <span className="font-medium">{userData.credits} Credits</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Current Status */}
        <div className="bg-white rounded-lg border p-6 mb-8">
          <div className="grid grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-600">Current Plan</p>
              <p className="text-xl font-bold">{isSubscribed ? 'LightLister Pro' : 'Free'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Available Credits</p>
              <p className="text-xl font-bold">{userData.credits}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Next Billing</p>
              <p className="text-xl font-bold">
                {userData.nextBillingDate 
                  ? new Date(userData.nextBillingDate).toLocaleDateString('en-GB')
                  : 'N/A'}
              </p>
            </div>
          </div>
        </div>

        {/* Subscription Section */}
        {!isSubscribed && (
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg p-1 mb-8">
            <div className="bg-white rounded-lg p-8">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold mb-2">LightLister Pro Monthly</h2>
                  <p className="text-gray-600 mb-4">Get 150 credits every month + unlock credit packs</p>
                  <ul className="space-y-2 mb-6">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span>150 credits per month</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span>Access to discounted credit packs</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span>Priority support</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span>Cancel anytime</span>
                    </li>
                  </ul>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold">£45.00</div>
                  <div className="text-gray-600 mb-4">per month</div>
                  <button
                    onClick={handleSubscribe}
                    disabled={processingPayment}
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:opacity-90 disabled:opacity-50"
                  >
                    {processingPayment ? (
                      <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                    ) : (
                      'Subscribe Now'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Credit Packs */}
        <div>
          <h2 className="text-2xl font-bold mb-6">Credit Packs</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Starter Pack - Members Only */}
            <div className={`bg-white rounded-lg border p-6 ${!isSubscribed ? 'opacity-60' : ''}`}>
              {isSubscribed && (
                <div className="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded mb-4">
                  MEMBERS ONLY
                </div>
              )}
              <h3 className="text-lg font-semibold mb-2">Starter Pack</h3>
              <p className="text-3xl font-bold mb-1">£3.00</p>
              <p className="text-gray-600 mb-4">10 credits</p>
              <button
                onClick={() => handlePurchasePack('pack-10')}
                disabled={!isSubscribed || processingPayment}
                className={`w-full py-2 rounded-lg font-medium ${
                  isSubscribed 
                    ? 'bg-black text-white hover:bg-gray-800' 
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {isSubscribed ? 'Buy Now' : 'Subscription Required'}
              </button>
            </div>

            {/* Growth Pack */}
            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-lg font-semibold mb-2">Growth Pack</h3>
              <p className="text-3xl font-bold mb-1">£15.00</p>
              <p className="text-gray-600 mb-4">50 credits</p>
              <button
                onClick={() => handlePurchasePack('pack-50')}
                disabled={processingPayment}
                className="w-full py-2 bg-black text-white rounded-lg hover:bg-gray-800 font-medium"
              >
                Buy Now
              </button>
            </div>

            {/* Pro Pack */}
            <div className="bg-white rounded-lg border-2 border-blue-500 p-6 relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 px-3 py-1 bg-blue-500 text-white text-xs rounded-full">
                BEST VALUE
              </div>
              <h3 className="text-lg font-semibold mb-2">Pro Pack</h3>
              <p className="text-3xl font-bold mb-1">£45.00</p>
              <p className="text-gray-600 mb-4">150 credits</p>
              <button
                onClick={() => handlePurchasePack('pack-150')}
                disabled={processingPayment}
                className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Buy Now
              </button>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-8 p-6 bg-blue-50 rounded-lg">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-semibold mb-2">How Credits Work</h3>
              <ul className="space-y-1 text-sm text-gray-700">
                <li>• 1 credit = 1 item analysis (unlimited photos)</li>
                <li>• Credits never expire</li>
                <li>• Subscription credits refresh monthly</li>
                <li>• Credit packs can be purchased anytime</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default CreditsPage;