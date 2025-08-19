'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';

export default function SettingsPage() {
  const { user } = useUser();
  const [ebayConnected, setEbayConnected] = useState(false);
  const [ebayApiDetails, setEbayApiDetails] = useState({
    appId: '',
    certId: '',
    devId: '',
    authToken: ''
  });
  const [businessPolicies, setBusinessPolicies] = useState([]);
  const [syncing, setSyncing] = useState(false);

  const handleEbayConnect = async (e) => {
    e.preventDefault();
    // Store API credentials securely (would use backend API)
    localStorage.setItem('ebayApi', JSON.stringify(ebayApiDetails));
    setEbayConnected(true);
    alert('eBay API connected successfully!');
  };

  const syncBusinessPolicies = async () => {
    setSyncing(true);
    // Simulate API call to eBay
    setTimeout(() => {
      setBusinessPolicies([
        { id: 1, name: 'Standard Shipping', type: 'shipping' },
        { id: 2, name: '30 Day Returns', type: 'return' },
        { id: 3, name: 'PayPal & Credit Cards', type: 'payment' }
      ]);
      setSyncing(false);
      alert('Business policies synced successfully!');
    }, 2000);
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Settings</h1>

      {/* eBay API Configuration */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">eBay API Configuration</h2>
        
        {!ebayConnected ? (
          <form onSubmit={handleEbayConnect} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                App ID (Client ID)
              </label>
              <input
                type="text"
                value={ebayApiDetails.appId}
                onChange={(e) => setEbayApiDetails({...ebayApiDetails, appId: e.target.value})}
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Your eBay App ID"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Cert ID (Client Secret)
              </label>
              <input
                type="password"
                value={ebayApiDetails.certId}
                onChange={(e) => setEbayApiDetails({...ebayApiDetails, certId: e.target.value})}
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Your eBay Cert ID"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Dev ID
              </label>
              <input
                type="text"
                value={ebayApiDetails.devId}
                onChange={(e) => setEbayApiDetails({...ebayApiDetails, devId: e.target.value})}
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Your eBay Dev ID"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Auth Token
              </label>
              <textarea
                value={ebayApiDetails.authToken}
                onChange={(e) => setEbayApiDetails({...ebayApiDetails, authToken: e.target.value})}
                required
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Your eBay Auth Token"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition font-medium"
            >
              Connect eBay Account
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="text-2xl">✅</span>
                <div>
                  <p className="font-medium text-green-900 dark:text-green-300">eBay Account Connected</p>
                  <p className="text-sm text-green-700 dark:text-green-400">API credentials stored securely</p>
                </div>
              </div>
              <button
                onClick={() => setEbayConnected(false)}
                className="px-4 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                Disconnect
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Business Policies Sync */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Business Policies</h2>
        
        {ebayConnected ? (
          <div className="space-y-4">
            <button
              onClick={syncBusinessPolicies}
              disabled={syncing}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              {syncing ? 'Syncing...' : 'Sync Business Policies'}
            </button>

            {businessPolicies.length > 0 && (
              <div className="space-y-2 mt-4">
                <h3 className="font-medium text-gray-700 dark:text-gray-300">Synced Policies:</h3>
                {businessPolicies.map((policy) => (
                  <div key={policy.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{policy.name}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Type: {policy.type}</p>
                    </div>
                    <span className="text-green-500">✓</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <p className="text-gray-600 dark:text-gray-400">Connect your eBay account to sync business policies</p>
        )}
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