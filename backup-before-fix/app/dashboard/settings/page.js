// app/dashboard/settings/page.js
// FIXED SETTINGS PAGE WITH PROPER USER DATA

'use client';

import { useState, useEffect } from 'react';
import { useUser, useClerk } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, User, Bell, CreditCard, Save, LogOut } from 'lucide-react';

export default function SettingsPage() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();
  
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [autoRelist, setAutoRelist] = useState(false);
  const [defaultCategory, setDefaultCategory] = useState('Women\'s Clothing');
  const [saving, setSaving] = useState(false);

  // Redirect if not logged in
  useEffect(() => {
    if (isLoaded && !user) {
      router.push('/sign-in');
    }
  }, [isLoaded, user, router]);

  const handleSave = async () => {
    setSaving(true);
    // TODO: Save preferences to database
    setTimeout(() => {
      setSaving(false);
      alert('Settings saved!');
    }, 1000);
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Dashboard
          </Link>
          
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-2">
            Manage your account and preferences
          </p>
        </div>

        {/* Account Information */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex items-center mb-4">
            <User className="w-5 h-5 text-gray-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">
              Account Information
            </h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <p className="text-gray-900">
                {user.primaryEmailAddress?.emailAddress || 'No email set'}
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                User ID
              </label>
              <p className="text-gray-900 font-mono text-sm">
                {user.id}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Account Created
              </label>
              <p className="text-gray-900">
                {new Date(user.createdAt).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Preferences */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex items-center mb-4">
            <Bell className="w-5 h-5 text-gray-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">
              Preferences
            </h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="font-medium text-gray-900">
                  Email notifications
                </label>
                <p className="text-sm text-gray-600">
                  Receive updates about your listings
                </p>
              </div>
              <button
                onClick={() => setEmailNotifications(!emailNotifications)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                  emailNotifications ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                    emailNotifications ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="font-medium text-gray-900">
                  Auto-relist sold items
                </label>
                <p className="text-sm text-gray-600">
                  Automatically relist items when sold
                </p>
              </div>
              <button
                onClick={() => setAutoRelist(!autoRelist)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                  autoRelist ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                    autoRelist ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div>
              <label className="block font-medium text-gray-900 mb-2">
                Default category
              </label>
              <select
                value={defaultCategory}
                onChange={(e) => setDefaultCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option>Women's Clothing</option>
                <option>Men's Clothing</option>
                <option>Children's Clothing</option>
                <option>Shoes & Accessories</option>
                <option>Bags & Purses</option>
              </select>
            </div>
          </div>
        </div>

        {/* Billing */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex items-center mb-4">
            <CreditCard className="w-5 h-5 text-gray-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">
              Billing
            </h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Current plan</span>
              <span className="font-medium">Free Trial</span>
            </div>
            
            <Link
              href="/dashboard/get-credits"
              className="block w-full py-3 px-4 bg-blue-600 text-white text-center rounded-lg hover:bg-blue-700 transition"
            >
              Upgrade Plan
            </Link>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
          >
            <Save className="w-5 h-5" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          
          <button
            onClick={handleSignOut}
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition flex items-center gap-2"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}