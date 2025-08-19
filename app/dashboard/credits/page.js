'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { 
  Home,
  CreditCard,
  CheckCircle,
  X,
  PoundSterling,
  ChevronRight,
  Moon,
  Sun,
  Loader2,
  ArrowRight,
  Star,
  Shield,
  Clock,
  Award,
  Zap,
  TrendingUp,
  Package,
  Gift,
  Info,
  AlertCircle,
  Download,
  Calendar,
  RefreshCw,
  Plus,
  Minus,
  Check
} from 'lucide-react';

// Subscription Plans
const SUBSCRIPTION_PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    credits: 5,
    period: 'month',
    features: [
      '5 credits per month',
      'Single item analysis',
      'Basic AI features',
      'Email support'
    ],
    popular: false,
    current: true
  },
  {
    id: 'starter',
    name: 'Starter',
    price: 9.99,
    credits: 50,
    period: 'month',
    features: [
      '50 credits per month',
      'Single & batch analysis',
      'Advanced AI features',
      'Priority support',
      'Export to eBay & Vinted',
      'Basic analytics'
    ],
    popular: false,
    current: false
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 24.99,
    credits: 150,
    period: 'month',
    features: [
      '150 credits per month',
      'Everything in Starter',
      'Bulk operations (25 items)',
      'Advanced analytics',
      'API access',
      'Custom branding',
      'Priority processing'
    ],
    popular: true,
    current: false,
    savings: '£5.00'
  },
  {
    id: 'business',
    name: 'Business',
    price: 49.99,
    credits: 400,
    period: 'month',
    features: [
      '400 credits per month',
      'Everything in Pro',
      'Bulk operations (100 items)',
      'Team collaboration',
      'White label options',
      'Dedicated support',
      'Custom integrations'
    ],
    popular: false,
    current: false,
    savings: '£10.00'
  }
];

// Credit Packs for one-time purchase
const CREDIT_PACKS = [
  {
    id: 'pack-10',
    credits: 10,
    price: 2.99,
    unitPrice: 0.299,
    savings: null
  },
  {
    id: 'pack-50',
    credits: 50,
    price: 12.99,
    unitPrice: 0.259,
    savings: '13%'
  },
  {
    id: 'pack-100',
    credits: 100,
    price: 22.99,
    unitPrice: 0.229,
    savings: '23%'
  },
  {
    id: 'pack-250',
    credits: 250,
    price: 49.99,
    unitPrice: 0.199,
    savings: '33%'
  }
];

export default function CreditsBillingPage() {
  const { user } = useUser();
  const router = useRouter();
  
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [selectedPack, setSelectedPack] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [billingCycle, setBillingCycle] = useState('monthly'); // monthly or yearly
  const [activeTab, setActiveTab] = useState('subscription'); // subscription or credits
  
  // User data
  const [userData, setUserData] = useState({
    credits: 0,
    subscription: 'free',
    nextBillingDate: null,
    creditHistory: []
  });

  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedDarkMode);
    if (savedDarkMode) {
      document.documentElement.classList.add('dark');
    }
    
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      // Fetch user credits and subscription
      const response = await fetch('/api/user/billing');
      if (response.ok) {
        const data = await response.json();
        setUserData(data);
        
        // Find current plan
        const currentPlan = SUBSCRIPTION_PLANS.find(p => p.id === data.subscription);
        if (currentPlan) {
          setSelectedPlan(currentPlan.id);
        }
      }
      
      // Fetch payment method
      const paymentRes = await fetch('/api/user/payment-method');
      if (paymentRes.ok) {
        const paymentData = await paymentRes.json();
        setPaymentMethod(paymentData.paymentMethod);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscriptionChange = async (planId) => {
    setSelectedPlan(planId);
    setProcessingPayment(true);
    
    try {
      const response = await fetch('/api/stripe/create-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId,
          billingCycle
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.url) {
          // Redirect to Stripe Checkout
          window.location.href = data.url;
        } else {
          // Subscription updated successfully
          await fetchUserData();
          alert('Subscription updated successfully!');
        }
      }
    } catch (error) {
      console.error('Error updating subscription:', error);
      alert('Failed to update subscription');
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleCreditPurchase = async (packId) => {
    setSelectedPack(packId);
    setProcessingPayment(true);
    
    try {
      const pack = CREDIT_PACKS.find(p => p.id === packId);
      
      const response = await fetch('/api/stripe/purchase-credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packId,
          credits: pack.credits,
          amount: pack.price
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.url) {
          // Redirect to Stripe Checkout
          window.location.href = data.url;
        }
      }
    } catch (error) {
      console.error('Error purchasing credits:', error);
      alert('Failed to purchase credits');
    } finally {
      setProcessingPayment(false);
    }
  };

  const cancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your subscription? You will keep your credits until the end of the billing period.')) {
      return;
    }
    
    try {
      const response = await fetch('/api/stripe/cancel-subscription', {
        method: 'POST'
      });
      
      if (response.ok) {
        await fetchUserData();
        alert('Subscription cancelled successfully');
      }
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      alert('Failed to cancel subscription');
    }
  };

  const downloadInvoice = async (invoiceId) => {
    try {
      const response = await fetch(`/api/invoices/${invoiceId}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `invoice-${invoiceId}.pdf`;
        a.click();
      }
    } catch (error) {
      console.error('Error downloading invoice:', error);
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <header className={`${darkMode ? 'bg-black border-gray-800' : 'bg-white border-gray-200'} border-b sticky top-0 z-50`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link 
                href="/dashboard"
                className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'} transition`}
              >
                <Home className="w-5 h-5" />
              </Link>
              
              <h1 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-black'}`}>
                Credits & Billing
              </h1>
            </div>

            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${
              darkMode 
                ? 'bg-gray-800 border-gray-700' 
                : 'bg-gray-100 border-gray-300'
            }`}>
              <CreditCard className="w-4 h-4" />
              <span className="font-medium">{userData.credits} Credits</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-sm mb-8">
          <Link href="/dashboard" className={darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'}>
            Dashboard
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span className={darkMode ? 'text-white' : 'text-black'}>Credits & Billing</span>
        </nav>

        {/* Current Status */}
        <div className={`rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} p-6 mb-8`}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Current Plan
              </p>
              <p className={`text-xl font-bold mt-1 ${darkMode ? 'text-white' : 'text-black'}`}>
                {SUBSCRIPTION_PLANS.find(p => p.id === userData.subscription)?.name || 'Free'}
              </p>
              {userData.nextBillingDate && (
                <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Next billing: {new Date(userData.nextBillingDate).toLocaleDateString('en-GB')}
                </p>
              )}
            </div>
            
            <div>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Available Credits
              </p>
              <p className={`text-xl font-bold mt-1 ${darkMode ? 'text-white' : 'text-black'}`}>
                {userData.credits}
              </p>
              <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                1 credit = 1 analysis
              </p>
            </div>
            
            <div>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                This Month's Usage
              </p>
              <p className={`text-xl font-bold mt-1 ${darkMode ? 'text-white' : 'text-black'}`}>
                {userData.creditHistory.filter(h => {
                  const date = new Date(h.date);
                  const now = new Date();
                  return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
                }).reduce((sum, h) => sum + h.credits, 0)}
              </p>
              <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Credits used
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'} mb-6`}>
          <nav className="flex gap-6">
            <button
              onClick={() => setActiveTab('subscription')}
              className={`pb-4 px-1 font-medium transition relative ${
                activeTab === 'subscription'
                  ? darkMode ? 'text-white' : 'text-black'
                  : darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'
              }`}
            >
              Subscription Plans
              {activeTab === 'subscription' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black dark:bg-white" />
              )}
            </button>
            
            <button
              onClick={() => setActiveTab('credits')}
              className={`pb-4 px-1 font-medium transition relative ${
                activeTab === 'credits'
                  ? darkMode ? 'text-white' : 'text-black'
                  : darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'
              }`}
            >
              Buy Credits
              {activeTab === 'credits' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black dark:bg-white" />
              )}
            </button>
            
            <button
              onClick={() => setActiveTab('history')}
              className={`pb-4 px-1 font-medium transition relative ${
                activeTab === 'history'
                  ? darkMode ? 'text-white' : 'text-black'
                  : darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'
              }`}
            >
              Usage History
              {activeTab === 'history' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black dark:bg-white" />
              )}
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'subscription' && (
          <div>
            {/* Billing Toggle */}
            <div className="flex justify-center mb-8">
              <div className={`inline-flex items-center gap-3 p-1 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-200'}`}>
                <button
                  onClick={() => setBillingCycle('monthly')}
                  className={`px-4 py-2 rounded-md transition ${
                    billingCycle === 'monthly'
                      ? 'bg-black text-white dark:bg-white dark:text-black'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBillingCycle('yearly')}
                  className={`px-4 py-2 rounded-md transition ${
                    billingCycle === 'yearly'
                      ? 'bg-black text-white dark:bg-white dark:text-black'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}
                >
                  Yearly
                  <span className="ml-2 text-xs bg-green-500 text-white px-2 py-0.5 rounded">
                    Save 20%
                  </span>
                </button>
              </div>
            </div>

            {/* Subscription Plans Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {SUBSCRIPTION_PLANS.map((plan) => {
                const isCurrentPlan = userData.subscription === plan.id;
                const yearlyPrice = billingCycle === 'yearly' ? plan.price * 12 * 0.8 : plan.price;
                const yearlyCredits = billingCycle === 'yearly' ? plan.credits * 12 : plan.credits;
                
                return (
                  <div
                    key={plan.id}
                    className={`rounded-lg border-2 p-6 relative ${
                      plan.popular
                        ? 'border-purple-500 dark:border-purple-400'
                        : darkMode ? 'border-gray-700' : 'border-gray-200'
                    } ${darkMode ? 'bg-gray-800' : 'bg-white'}`}
                  >
                    {plan.popular && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 px-3 py-1 bg-purple-500 text-white text-xs rounded-full">
                        Most Popular
                      </div>
                    )}
                    
                    <h3 className={`text-xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-black'}`}>
                      {plan.name}
                    </h3>
                    
                    <div className="mb-4">
                      <span className="text-3xl font-bold">
                        £{billingCycle === 'yearly' ? yearlyPrice.toFixed(2) : plan.price}
                      </span>
                      <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        /{billingCycle === 'yearly' ? 'year' : 'month'}
                      </span>
                    </div>
                    
                    <p className={`text-sm mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {billingCycle === 'yearly' ? yearlyCredits : plan.credits} credits
                      {billingCycle === 'yearly' ? ' per year' : ' per month'}
                    </p>
                    
                    {plan.savings && (
                      <p className="text-sm text-green-600 mb-4">
                        Save {plan.savings} vs pay-as-you-go
                      </p>
                    )}
                    
                    <ul className="space-y-2 mb-6">
                      {plan.features.map((feature) => (
                        <li key={feature} className={`flex items-start gap-2 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    
                    {isCurrentPlan ? (
                      <button
                        disabled
                        className="w-full py-2 bg-gray-200 dark:bg-gray-700 text-gray-500 rounded-lg cursor-not-allowed"
                      >
                        Current Plan
                      </button>
                    ) : (
                      <button
                        onClick={() => handleSubscriptionChange(plan.id)}
                        disabled={processingPayment}
                        className={`w-full py-2 rounded-lg transition ${
                          plan.popular
                            ? 'bg-purple-600 text-white hover:bg-purple-700'
                            : 'bg-black text-white dark:bg-white dark:text-black hover:opacity-80'
                        } disabled:opacity-50`}
                      >
                        {processingPayment && selectedPlan === plan.id ? (
                          <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                        ) : (
                          'Upgrade'
                        )}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Cancel Subscription */}
            {userData.subscription !== 'free' && (
              <div className="mt-8 text-center">
                <button
                  onClick={cancelSubscription}
                  className="text-sm text-red-600 hover:text-red-700"
                >
                  Cancel Subscription
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'credits' && (
          <div>
            <div className="text-center mb-8">
              <h2 className={`text-2xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-black'}`}>
                Need More Credits?
              </h2>
              <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Purchase credits anytime - no subscription required
              </p>
            </div>

            {/* Credit Packs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {CREDIT_PACKS.map((pack) => (
                <div
                  key={pack.id}
                  className={`rounded-lg border p-6 ${
                    darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="text-center mb-4">
                    <p className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-black'}`}>
                      {pack.credits}
                    </p>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      credits
                    </p>
                  </div>
                  
                  <div className="text-center mb-4">
                    <p className="text-2xl font-bold">
                      £{pack.price}
                    </p>
                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      £{pack.unitPrice} per credit
                    </p>
                    {pack.savings && (
                      <p className="text-sm text-green-600 mt-1">
                        Save {pack.savings}
                      </p>
                    )}
                  </div>
                  
                  <button
                    onClick={() => handleCreditPurchase(pack.id)}
                    disabled={processingPayment}
                    className="w-full py-2 bg-black text-white dark:bg-white dark:text-black rounded-lg hover:opacity-80 disabled:opacity-50"
                  >
                    {processingPayment && selectedPack === pack.id ? (
                      <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                    ) : (
                      'Buy Now'
                    )}
                  </button>
                </div>
              ))}
            </div>

            {/* Info Box */}
            <div className={`mt-8 p-6 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-500 mt-0.5" />
                <div>
                  <h3 className={`font-semibold mb-2 ${darkMode ? 'text-white' : 'text-black'}`}>
                    How Credits Work
                  </h3>
                  <ul className={`space-y-1 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    <li>• 1 credit = 1 item analysis (single or batch)</li>
                    <li>• Credits never expire</li>
                    <li>• Use credits across all features</li>
                    <li>• Unused subscription credits don't roll over</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div>
            {/* Usage Chart */}
            <div className={`rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} p-6 mb-6`}>
              <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-black'}`}>
                Credit Usage (Last 30 Days)
              </h3>
              
              {/* Simple bar chart */}
              <div className="h-48 flex items-end justify-between gap-2">
                {[...Array(30)].map((_, i) => {
                  const date = new Date();
                  date.setDate(date.getDate() - (29 - i));
                  const usage = userData.creditHistory.filter(h => {
                    const hDate = new Date(h.date);
                    return hDate.toDateString() === date.toDateString();
                  }).reduce((sum, h) => sum + h.credits, 0);
                  
                  return (
                    <div
                      key={i}
                      className="flex-1 bg-blue-500 rounded-t"
                      style={{ height: `${Math.min(100, usage * 10)}%` }}
                      title={`${date.toLocaleDateString('en-GB')}: ${usage} credits`}
                    />
                  );
                })}
              </div>
            </div>

            {/* Transaction History */}
            <div className={`rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <div className="p-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}">
                <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-black'}`}>
                  Transaction History
                </h3>
              </div>
              
              <div className="divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}">
                {userData.creditHistory.length === 0 ? (
                  <div className="p-8 text-center">
                    <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                      No transactions yet
                    </p>
                  </div>
                ) : (
                  userData.creditHistory.slice(0, 20).map((transaction) => (
                    <div key={transaction.id} className="p-4 flex items-center justify-between">
                      <div>
                        <p className={`font-medium ${darkMode ? 'text-white' : 'text-black'}`}>
                          {transaction.description}
                        </p>
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {new Date(transaction.date).toLocaleString('en-GB')}
                        </p>
                      </div>
                      
                      <div className="text-right">
                        <p className={`font-medium ${
                          transaction.type === 'purchase' || transaction.type === 'subscription'
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}>
                          {transaction.type === 'purchase' || transaction.type === 'subscription' ? '+' : '-'}
                          {transaction.credits}
                        </p>
                        {transaction.amount && (
                          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            £{transaction.amount.toFixed(2)}
                          </p>
                        )}
                      </div>
                      
                      {transaction.invoice && (
                        <button
                          onClick={() => downloadInvoice(transaction.invoice)}
                          className={`ml-4 p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700`}
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Payment Method */}
        <div className={`mt-8 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} p-6`}>
          <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-black'}`}>
            Payment Method
          </h3>
          
          {paymentMethod ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CreditCard className="w-8 h-8 text-gray-400" />
                <div>
                  <p className={`font-medium ${darkMode ? 'text-white' : 'text-black'}`}>
                    •••• •••• •••• {paymentMethod.last4}
                  </p>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Expires {paymentMethod.exp_month}/{paymentMethod.exp_year}
                  </p>
                </div>
              </div>
              
              <button className={`text-sm ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'}`}>
                Update
              </button>
            </div>
          ) : (
            <div>
              <p className={`mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                No payment method on file
              </p>
              <button className="px-4 py-2 bg-black text-white dark:bg-white dark:text-black rounded-lg hover:opacity-80">
                Add Payment Method
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}