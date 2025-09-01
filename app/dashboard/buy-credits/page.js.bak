// app/dashboard/buy-credits/page.js
// COMPLETE FILE - BUY CREDITS PAGE

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
  Star,
  Zap,
  TrendingUp,
  Lock,
  AlertTriangle
} from 'lucide-react';

export default function BuyCreditsPage() {
  const { user } = useUser();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [selectedPack, setSelectedPack] = useState(null);
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
      // Use fallback data
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

    setProcessingPayment(true);
    try {
      const response = await fetch('/api/checkout/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          priceId: 'price_1RtnkoPeSETpTi7Nw1Voasgc', // LightLister Pro subscription
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
    }
  };

  const handlePurchasePack = async (packId, priceId, packName) => {
    if (!user) {
      alert('Please sign in to purchase credits');
      return;
    }

    // Check if subscription required
    if (!userData.isSubscribed && packId === 'starter-pack') {
      alert('You need a LightLister Pro subscription to purchase this pack');
      return;
    }

    setSelectedPack(packId);
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
      setSelectedPack(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a1f2e] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    );
  }

  const isSubscribed = userData.isSubscribed;

  // Credit packs configuration
  const creditPacks = [
    {
      id: 'starter-pack',
      name: 'Starter Pack',
      credits: 10,
      price: 3.00,
      priceId: 'price_1Rve6qPeSETpTi7NWc1VcSF4',
      description: 'Perfect for trying out the service',
      perCredit: '£0.30',
      membersOnly: true,
      color: 'purple'
    },
    {
      id: 'growth-pack',
      name: 'Growth Pack',
      credits: 50,
      price: 15.00,
      priceId: 'price_1Rve84PeSETpTi7NSnMTnoya',
      description: 'Great for regular sellers',
      perCredit: '£0.30',
      membersOnly: true,
      color: 'purple'
    },
    {
      id: 'pro-pack',
      name: 'Pro Pack',
      credits: 150,
      price: 45.00,
      priceId: 'price_1RtnmLPeSETpTi7NEuhiAx41',
      description: 'Best value for power users',
      perCredit: '£0.30',
      membersOnly: true,
      color: 'purple'
    }
  ];

  return (
    <div className="min-h-screen bg-[#1a1f2e] text-white">
      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        
        {/* Warning Banner for Non-Subscribers */}
        {!isSubscribed && (
          <div className="bg-yellow-900/30 border border-yellow-600/50 rounded-lg p-4 mb-8 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0" />
            <p className="text-yellow-200">
              You need a LightLister Pro membership to purchase credit packs
            </p>
          </div>
        )}

        {/* LightLister Pro Subscription Card */}
        {!isSubscribed && (
          <div className="bg-gradient-to-br from-purple-900/30 to-purple-900/10 border-2 border-purple-500/50 rounded-2xl p-8 mb-10">
            <div className="flex flex-col lg:flex-row justify-between gap-8">
              <div className="flex-1">
                <h2 className="text-3xl font-bold mb-4">LightLister Pro Monthly</h2>
                <p className="text-gray-300 mb-6 text-lg">
                  Unlimited analyses + member benefits
                </p>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                      <CheckCircle className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-gray-200">Unlimited analyses per month</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                      <CheckCircle className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-gray-200">Access to credit packs</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                      <CheckCircle className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-gray-200">Priority support</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                      <CheckCircle className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-gray-200">Advanced features</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                      <CheckCircle className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-gray-200">Bulk processing</span>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col items-center lg:items-end justify-center">
                <div className="text-5xl font-bold mb-2">£45.00</div>
                <div className="text-gray-400 mb-6 text-lg">per month</div>
                <button
                  onClick={handleSubscribe}
                  disabled={processingPayment}
                  className="px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold text-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
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
        )}

        {/* Credit Packs Section */}
        <div className="mb-10">
          <h2 className="text-2xl font-bold mb-6">Credit Packs</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {creditPacks.map((pack) => {
              const isLocked = pack.membersOnly && !isSubscribed;
              
              return (
                <div
                  key={pack.id}
                  className={`relative bg-[#232938] border border-gray-700 rounded-xl p-6 ${
                    isLocked ? 'opacity-60' : ''
                  }`}
                >
                  {/* Members Only Badge */}
                  {pack.membersOnly && (
                    <div className="absolute -top-3 left-6">
                      <span className="px-3 py-1 bg-purple-600 text-white text-xs font-semibold rounded-full">
                        Members Only
                      </span>
                    </div>
                  )}
                  
                  <div className="pt-2">
                    <h3 className="text-xl font-semibold mb-4">{pack.name}</h3>
                    
                    <div className="mb-2">
                      <span className="text-4xl font-bold">£{pack.price.toFixed(2)}</span>
                    </div>
                    
                    <p className="text-gray-400 mb-4">{pack.description}</p>
                    
                    <div className="space-y-2 mb-6">
                      <div className="text-lg text-gray-300">
                        {pack.credits} credits
                      </div>
                      <div className="text-sm text-gray-500">
                        {pack.perCredit} per credit
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handlePurchasePack(pack.id, pack.priceId, pack.name)}
                      disabled={isLocked || processingPayment}
                      className={`w-full py-3 rounded-lg font-medium transition ${
                        isLocked
                          ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                          : 'bg-gray-600 hover:bg-gray-500 text-white'
                      } ${processingPayment && selectedPack === pack.id ? 'opacity-50' : ''}`}
                    >
                      {processingPayment && selectedPack === pack.id ? (
                        <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                      ) : isLocked ? (
                        'Members Only'
                      ) : (
                        'Buy Now'
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* How Credits Work Info Box */}
        <div className="bg-[#232938] border border-gray-700 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Zap className="w-6 h-6 text-blue-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold mb-3">How Credits Work</h3>
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-gray-500">•</span>
                  <span>1 credit = 1 item analysis (unlimited photos per item)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gray-500">•</span>
                  <span>Credits never expire</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gray-500">•</span>
                  <span>Bulk analysis uses 1 credit per item</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gray-500">•</span>
                  <span>Failed analyses don't consume credits</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BuyCreditsPage;