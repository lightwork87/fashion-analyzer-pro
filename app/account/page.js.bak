'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';

function AccountPage() {
  const { user, isLoaded } = useUser();
  const [credits, setCredits] = useState(0);
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchAccountData();
    }
  }, [user]);

  const fetchAccountData = async () => {
    try {
      const response = await fetch('/api/user/credits');
      const data = await response.json();
      setCredits(data.credits || 0);
      setSubscriptionData({
        status: data.subscriptionStatus,
        credits: data.subscriptionCredits || 0
      });
    } catch (error) {
      console.error('Failed to fetch account data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Account Settings</h1>
        <p className="text-gray-600 mt-2">
          Manage your account, subscription, and billing information
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h2 className="text-xl font-semibold mb-4">Profile Information</h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-600">Full Name</label>
                <p className="text-gray-900">{user?.fullName || 'Not provided'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Email Address</label>
                <p className="text-gray-900">{user?.primaryEmailAddress?.emailAddress || 'Not provided'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Member Since</label>
                <p className="text-gray-900">
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h2 className="text-xl font-semibold mb-4">Credits & Usage</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Available Credits</span>
                <span className="text-2xl font-bold text-blue-600">{credits}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Analyses</span>
                <span className="text-gray-900">0</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">This Month</span>
                <span className="text-gray-900">0</span>
              </div>
            </div>
            <Link href="/dashboard/buy-credits">
              <button className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium">
                Buy More Credits
              </button>
            </Link>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h2 className="text-xl font-semibold mb-4">Subscription</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Current Plan</span>
                <span className="text-gray-900">
                  {subscriptionData?.status === 'active' ? 'Pro Plan' : 'Free Plan'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Status</span>
                <span className={`px-2 py-1 rounded text-sm ${
                  subscriptionData?.status === 'active' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {subscriptionData?.status === 'active' ? 'Active' : 'Inactive'}
                </span>
              </div>
              {subscriptionData?.status === 'active' && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Monthly Credits</span>
                  <span className="text-gray-900">{subscriptionData.credits}</span>
                </div>
              )}
            </div>
            <Link href="/dashboard/pricing">
              <button className="w-full mt-4 border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-md font-medium">
                {subscriptionData?.status === 'active' ? 'Manage Subscription' : 'Upgrade Plan'}
              </button>
            </Link>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <Link href="/dashboard/analyze-single">
                <button className="w-full text-left p-3 border rounded-lg hover:bg-gray-50">
                  <div className="font-medium text-gray-900">Analyze Item</div>
                  <div className="text-sm text-gray-600">Upload photos for AI analysis</div>
                </button>
              </Link>
              <Link href="/dashboard/history">
                <button className="w-full text-left p-3 border rounded-lg hover:bg-gray-50">
                  <div className="font-medium text-gray-900">View History</div>
                  <div className="text-sm text-gray-600">See your past analyses</div>
                </button>
              </Link>
              <Link href="/dashboard/settings">
                <button className="w-full text-left p-3 border rounded-lg hover:bg-gray-50">
                  <div className="font-medium text-gray-900">Settings</div>
                  <div className="text-sm text-gray-600">Configure preferences</div>
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AccountPage;