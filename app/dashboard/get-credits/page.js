// app/dashboard/get-credits/page.js
// COMPLETE FILE - UPDATED TO MATCH ACTUAL STRIPE PRODUCTS

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { 
  ArrowLeft,
  CreditCard,
  CheckCircle,
  Loader2,
  Info,
  Zap,
  AlertTriangle
} from 'lucide-react';

export default function GetCreditsPage() {
  const { user } = useUser();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [userData, setUserData] = useState({
    credits: 0,
    subscription: 'free',
    isSubscribed: false
  });

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/user/billing');
      if (response.ok) {
        const data = await response.json();
        setUserData({
          credits: data.credits || 0,
          subscription: data.subscription || 'free',
          isSubscribed: data.subscription === 'pro' || data.subscription === 'active'
        });
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      setUserData({
        credits: 0,
        subscription: 'free',
        isSubscribed: false
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async () => {
    if (!user) {
      alert('Please sign in to subscribe');
      return;
    }

    setSelectedItem('subscription');
    setProcessingPayment(true);
    
    try {
      const response = await fetch('/api/checkout/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          priceId: 'price_1RtnkoPeSETpTi7Nw1Voasgc',
          planName: 'LightLister Pro',
          userEmail: user.emailAddresses[0].emailAddress,
          userId: user.id
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.url) {
          window.location.href = data.url;
        }
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to start subscription');
      }
    } catch (error) {
      console.error('Subscription error:', error);
      alert('Failed to start subscription. Please try again.');
    } finally {
      setProcessingPayment(false);
      setSelectedItem(null);
    }
  };

  const handlePurchasePack = async (packId, priceId, packName) => {
    if (!user) {
      alert('Please sign in to purchase credits');
      return;
    }

    if (!userData.isSubscribed) {
      alert('You need a LightLister Pro subscription to purchase credit packs');
      return;
    }

    setSelectedItem(packId);
    setProcessingPayment(true);
    
    try {
      const response = await fetch('/api/checkout/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          priceId: priceId,
          planName: packName,
          userEmail: user.emailAddresses[0].emailAddress,
          userId: user.id
        })
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
      alert('Failed to purchase credits. Please try again.');
    } finally {
      setProcessingPayment(false);
      setSelectedItem(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-600" />
      </div>
    );
  }

  const isSubscribed = userData.isSubscribed;

  const creditPacks = [
    {
      id: 'starter-pack',
      name: 'Starter Pack',
      credits: 10,
      price: 3.00,
      priceId: 'price_1Rve6qPeSETpTi7NWc1VcSF4',
      description: 'Perfect for trying out',
      perCredit: 0.30,
      membersOnly: true
    },
    {
      id: 'growth-pack',
      name: 'Growth Pack',
      credits: 50,
      price: 15.00,
      priceId: 'price_1Rve84PeSETpTi7NSnMTnoya',
      description: 'Great for regular sellers',
      perCredit: 0.30,
      membersOnly: true,
      popular: true
    },
    {
      id: 'pro-pack',
      name: 'Pro Pack',
      credits: 150,
      price: 45.00,
      priceId: 'price_1RtnmLPeSETpTi7NEuhiAx41',
      description: 'Best value for power users',
      perCredit: 0.30,
      membersOnly: true
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="p-2 hover:bg-gray-100 rounded-lg transition">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <h1 className="text-xl font-bold">Get Credits</h1>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg">
              <CreditCard className="w-4 h-4 text-gray-600" />
              <span className="font-medium text-gray-900">{userData.credits} Credits</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Warning for non-subscribers */}
        {!isSubscribed && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-8">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <p className="text-amber-800">
                You need a LightLister Pro membership to purchase credit packs
              </p>
            </div>
          </div>
        )}

        {/* Subscription Section */}
        {!isSubscribed && (
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-1 mb-10">
            <div className="bg-white rounded-lg p-8">
              <div className="flex flex-col lg:flex-row justify-between gap-8">
                <div className="flex-1">
                  <h2 className="text-3xl font-bold text-gray-900 mb-3">
                    LightLister Pro Monthly
                  </h2>
                  <p className="text-gray-600 mb-6 text-lg">
                    150 credits every month + unlock credit packs
                  </p>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className="text-gray-700">150 credits per month</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className="text-gray-700">Access to discounted credit packs</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className="text-gray-700">Priority support</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className="text-gray-700">Advanced features</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className="text-gray-700">Cancel anytime</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col items-center lg:items-end justify-center">
                  <div className="text-5xl font-bold text-gray-900 mb-2">£45.00</div>
                  <div className="text-gray-600 mb-6">per month</div>
                  <button
                    onClick={handleSubscribe}
                    disabled={processingPayment}
                    className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:opacity-90 transition disabled:opacity-50 font-semibold text-lg"
                  >
                    {processingPayment && selectedItem === 'subscription' ? (
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
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Credit Packs</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {creditPacks.map((pack) => (
              <div
                key={pack.id}
                className={`relative bg-white rounded-xl border-2 p-6 ${
                  pack.popular ? 'border-purple-500' : 'border-gray-200'
                } ${!isSubscribed ? 'opacity-60' : ''}`}
              >
                {pack.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="px-3 py-1 bg-purple-500 text-white text-xs font-semibold rounded-full">
                      MOST POPULAR
                    </span>
                  </div>
                )}
                
                {pack.membersOnly && !isSubscribed && (
                  <div className="absolute top-4 right-4">
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded">
                      Members Only
                    </span>
                  </div>
                )}
                
                <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-2">
                  {pack.name}
                </h3>
                
                <div className="mb-3">
                  <span className="text-3xl font-bold text-gray-900">
                    £{pack.price.toFixed(2)}
                  </span>
                </div>
                
                <p className="text-gray-600 mb-4">{pack.description}</p>
                
                <div className="space-y-1 mb-6">
                  <p className="text-lg font-medium text-gray-900">{pack.credits} credits</p>
                  <p className="text-sm text-gray-500">£{pack.perCredit.toFixed(2)} per credit</p>
                </div>
                
                <button
                  onClick={() => handlePurchasePack(pack.id, pack.priceId, pack.name)}
                  disabled={!isSubscribed || processingPayment}
                  className={`w-full py-2.5 rounded-lg font-medium transition ${
                    !isSubscribed
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : pack.popular
                      ? 'bg-purple-600 text-white hover:bg-purple-700'
                      : 'bg-gray-900 text-white hover:bg-gray-800'
                  } ${processingPayment && selectedItem === pack.id ? 'opacity-50' : ''}`}
                >
                  {processingPayment && selectedItem === pack.id ? (
                    <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                  ) : !isSubscribed ? (
                    'Members Only'
                  ) : (
                    'Buy Now'
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* How Credits Work */}
        <div className="mt-10 bg-blue-50 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <Zap className="w-6 h-6 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">How Credits Work</h3>
              <ul className="space-y-2 text-gray-700">
                <li>• 1 credit = 1 item analysis (unlimited photos per item)</li>
                <li>• Credits never expire</li>
                <li>• Monthly subscription credits refresh on billing date</li>
                <li>• Credit packs available for members only</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}