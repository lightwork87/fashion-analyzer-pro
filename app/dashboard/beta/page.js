'use client';

// app/dashboard/beta/page.js
// COMPLETE BETA PROGRAM PAGE WITH SIGNUP FORM

'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Zap,
  CheckCircle,
  Loader2,
  Star,
  Users,
  MessageSquare,
  Gift,
  TrendingUp,
  Shield
} from 'lucide-react';

function BetaProgramPage() {
  const { user } = useUser();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [enrolled, setEnrolled] = useState(false);
  const [formData, setFormData] = useState({
    email: user?.emailAddresses?.[0]?.emailAddress || '',
    name: user?.fullName || '',
    businessType: '',
    monthlyVolume: '',
    feedback: ''
  });

  useEffect(() => {
    checkBetaStatus();
  }, []);

  const checkBetaStatus = async () => {
    try {
      const response = await fetch('/api/beta-signup');
      if (response.ok) {
        const data = await response.json();
        setEnrolled(data.enrolled);
      }
    } catch (error) {
      console.error('Error checking beta status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch('/api/beta-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        setEnrolled(true);
        alert('Welcome to the beta program! We\'ll be in touch soon.');
      } else {
        alert(data.error || 'Failed to sign up for beta');
      }
    } catch (error) {
      console.error('Beta signup error:', error);
      alert('Failed to sign up. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const benefits = [
    {
      icon: Zap,
      title: 'Early Access',
      description: 'Be the first to try new features before they go live'
    },
    {
      icon: Gift,
      title: 'Exclusive Credits',
      description: '50 bonus credits for beta testers'
    },
    {
      icon: MessageSquare,
      title: 'Direct Feedback',
      description: 'Shape the future of LightLister with your input'
    },
    {
      icon: Shield,
      title: 'Priority Support',
      description: 'Get help faster with dedicated beta support'
    },
    {
      icon: TrendingUp,
      title: 'Special Pricing',
      description: 'Lock in discounted rates as an early adopter'
    },
    {
      icon: Users,
      title: 'Community Access',
      description: 'Join our exclusive beta tester community'
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-600 dark:text-gray-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link 
                href="/dashboard" 
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </Link>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                Beta Program
              </h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {enrolled ? (
          // Already enrolled view
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              You're in the Beta Program!
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Thank you for being an early adopter. We'll notify you about new features and updates.
            </p>
            <Link
              href="/dashboard"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Back to Dashboard
            </Link>
          </div>
        ) : (
          <>
            {/* Hero Section */}
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-8 mb-8 text-white">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-6 h-6" />
                <span className="text-sm font-semibold uppercase tracking-wide">
                  Limited Spots Available
                </span>
              </div>
              <h2 className="text-3xl font-bold mb-4">
                Join the LightLister Beta Program
              </h2>
              <p className="text-lg opacity-90">
                Help shape the future of AI-powered listing creation and get exclusive benefits
              </p>
            </div>

            {/* Benefits Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {benefits.map((benefit) => {
                const Icon = benefit.icon;
                return (
                  <div
                    key={benefit.title}
                    className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700"
                  >
                    <Icon className="w-10 h-10 text-blue-600 dark:text-blue-400 mb-3" />
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                      {benefit.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {benefit.description}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Signup Form */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                Sign Up for Beta Access
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Name
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Business Type
                    </label>
                    <select
                      value={formData.businessType}
                      onChange={(e) => setFormData({...formData, businessType: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="">Select...</option>
                      <option value="individual">Individual Seller</option>
                      <option value="small_business">Small Business</option>
                      <option value="medium_business">Medium Business</option>
                      <option value="enterprise">Enterprise</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Monthly Listing Volume
                    </label>
                    <select
                      value={formData.monthlyVolume}
                      onChange={(e) => setFormData({...formData, monthlyVolume: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="">Select...</option>
                      <option value="1-10">1-10 items</option>
                      <option value="11-50">11-50 items</option>
                      <option value="51-100">51-100 items</option>
                      <option value="100+">100+ items</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    What features are you most interested in?
                  </label>
                  <textarea
                    rows={3}
                    value={formData.feedback}
                    onChange={(e) => setFormData({...formData, feedback: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Tell us what you'd like to see..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:opacity-90 disabled:opacity-50 font-semibold flex items-center justify-center"
                >
                  {submitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    'Join Beta Program'
                  )}
                </button>
              </form>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default BetaProgramPage;