'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const { user } = useUser();
  const router = useRouter();
  const [ebayConnected, setEbayConnected] = useState(false);
  const [businessPolicies, setBusinessPolicies] = useState([]);
  const [syncing, setSyncing] = useState(false);
  const [ebayUsername, setEbayUsername] = useState('');

  // eBay OAuth Configuration
  const EBAY_CLIENT_ID = process.env.NEXT_PUBLIC_EBAY_CLIENT_ID || 'Lightwork_resel-Lightwor-Produc-cruka';
  const EBAY_REDIRECT_URI = 'https://lightlisterai.co.uk/api/ebay/callback';
  const EBAY_OAUTH_URL = 'https://auth.ebay.com/oauth2/authorize';
  
  useEffect(() => {
    // Check if returning from eBay OAuth
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    if (code) {
      handleEbayCallback(code);
    }

    // Check if already connected
    const savedToken = localStorage.getItem('ebayAccessToken');
    const savedUsername = localStorage.getItem('ebayUsername');
    if (savedToken) {
      setEbayConnected(true);
      setEbayUsername(savedUsername || '');
    }
  }, []);

  const connectEbay = () => {
    // eBay OAuth scope for selling activities
    const scope = 'https://api.ebay.com/oauth/api_scope ' +
                  'https://api.ebay.com/oauth/api_scope/sell.marketing.readonly ' +
                  'https://api.ebay.com/oauth/api_scope/sell.marketing ' +
                  'https://api.ebay.com/oauth/api_scope/sell.inventory.readonly ' +
                  'https://api.ebay.com/oauth/api_scope/sell.inventory ' +
                  'https://api.ebay.com/oauth/api_scope/sell.account.readonly ' +
                  'https://api.ebay.com/oauth/api_scope/sell.account ' +
                  'https://api.ebay.com/oauth/api_scope/sell.fulfillment.readonly ' +
                  'https://api.ebay.com/oauth/api_scope/sell.fulfillment';

    const params = new URLSearchParams({
      client_id: EBAY_CLIENT_ID,
      redirect_uri: EBAY_REDIRECT_URI,
      response_type: 'code',
      scope: scope,
      prompt: 'login'
    });

    // Redirect to eBay OAuth
    window.location.href = `${EBAY_OAUTH_URL}?${params.toString()}`;
  };

  const handleEbayCallback = async (code) => {
    try {
      // Exchange code for access token (would call your backend API)
      const response = await fetch('/api/ebay/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('ebayAccessToken', data.access_token);
        localStorage.setItem('ebayRefreshToken', data.refresh_token);
        localStorage.setItem('ebayUsername', data.username || 'eBay User');
        setEbayConnected(true);
        setEbayUsername(data.username || 'eBay User');
        
        // Clean URL
        router.push('/dashboard/settings');
      }
    } catch (error) {
      console.error('Error exchanging eBay code:', error);
      alert('Failed to connect eBay account. Please try again.');
    }
  };

  const disconnectEbay = () => {
    localStorage.removeItem('ebayAccessToken');
    localStorage.removeItem('ebayRefreshToken');
    localStorage.removeItem('ebayUsername');
    setEbayConnected(false);
    setEbayUsername('');
    setBusinessPolicies([]);
  };

  const syncBusinessPolicies = async () => {
    setSyncing(true);
    try {
      const token = localStorage.getItem('ebayAccessToken');
      
      // Call eBay API to get business policies
      const response = await fetch('/api/ebay/business-policies', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const policies = await response.json();
        setBusinessPolicies(policies);
        alert('Business policies synced successfully!');
      }
    } catch (error) {
      console.error('Error syncing policies:', error);
      alert('Failed to sync business policies.');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Settings</h1>

      {/* eBay OAuth Configuration */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">eBay Account Connection</h2>
        
        {!ebayConnected ? (
          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400">
              Connect your eBay account to enable listing creation and sync business policies.
            </p>
            
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">What you'll get:</h3>
              <ul className="space-y-1 text-sm text-blue-800 dark:text-blue-400">
                <li>• Direct listing creation to eBay</li>
                <li>• Sync your business policies</li>
                <li>• Access to your eBay categories</li>
                <li>• Inventory management</li>
              </ul>
            </div>

            <button
              onClick={connectEbay}
              className="w-full py-3 px-4 bg-[#0064d2] text-white rounded-lg hover:bg-[#0053b3] transition font-medium flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8.5 12.5c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm7 0c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm3.5 0c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2z"/>
              </svg>
              Sign in with eBay
            </button>

            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              You'll be redirected to eBay to authorize access
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="text-2xl">✅</span>
                <div>
                  <p className="font-medium text-green-900 dark:text-green-300">eBay Account Connected</p>
                  <p className="text-sm text-green-700 dark:text-green-400">Signed in as: {ebayUsername}</p>
                </div>
              </div>
              <button
                onClick={disconnectEbay}
                className="px-4 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                Disconnect
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-gray-600 dark:text-gray-400">OAuth Status</p>
                <p className="font-medium text-gray-900 dark:text-white">✅ Enabled</p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-gray-600 dark:text-gray-400">Permissions</p>
                <p className="font-medium text-gray-900 dark:text-white">Full Selling Access</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Business Policies Sync */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Business Policies</h2>
        
        {ebayConnected ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-gray-600 dark:text-gray-400">
                Sync your eBay business policies for shipping, returns, and payments.
              </p>
              <button
                onClick={syncBusinessPolicies}
                disabled={syncing}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {syncing ? 'Syncing...' : 'Sync Policies'}
              </button>
            </div>

            {businessPolicies.length > 0 && (
              <div className="space-y-2 mt-4">
                <h3 className="font-medium text-gray-700 dark:text-gray-300">Your Business Policies:</h3>
                <div className="grid gap-2">
                  {businessPolicies.map((policy, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{policy.name}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Type: {policy.type} • ID: {policy.profileId}
                        </p>
                      </div>
                      <span className="text-green-500">✓ Synced</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {businessPolicies.length === 0 && (
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg text-center">
                <p className="text-gray-600 dark:text-gray-400">
                  No policies synced yet. Click "Sync Policies" to import from eBay.
                </p>
              </div>
            )}
          </div>
        ) : (
          <p className="text-gray-600 dark:text-gray-400">
            Connect your eBay account to sync business policies
          </p>
        )}
      </div>

      {/* OAuth Redirect URLs Info */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">OAuth Configuration</h2>
        <div className="space-y-3 text-sm">
          <div>
            <p className="text-gray-600 dark:text-gray-400">Display Title</p>
            <p className="font-mono bg-gray-100 dark:bg-gray-700 p-2 rounded">LightListerAI</p>
          </div>
          <div>
            <p className="text-gray-600 dark:text-gray-400">Your auth accepted URL</p>
            <p className="font-mono bg-gray-100 dark:bg-gray-700 p-2 rounded break-all">
              https://lightlisterai.co.uk/api/ebay/callback
            </p>
          </div>
          <div>
            <p className="text-gray-600 dark:text-gray-400">Your auth declined URL</p>
            <p className="font-mono bg-gray-100 dark:bg-gray-700 p-2 rounded break-all">
              https://lightlisterai.co.uk/dashboard
            </p>
          </div>
          <div>
            <p className="text-gray-600 dark:text-gray-400">Your privacy policy URL</p>
            <p className="font-mono bg-gray-100 dark:bg-gray-700 p-2 rounded break-all">
              https://lightlisterai.co.uk/privacy
            </p>
          </div>
        </div>
      </div>

      {/* Account Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Account Information</h2>
        <div className="space-y-3">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Email</p>
            <p className="font-medium text-gray-900 dark:text-white">{user?.emailAddresses?.[0]?.emailAddress}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">User ID</p>
            <p className="font-medium text-gray-900 dark:text-white">{user?.id}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

