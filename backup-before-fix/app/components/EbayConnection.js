'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function EbayConnection({ userId }) {
  const router = useRouter();
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);
  
  // Check connection status on mount
  useEffect(() => {
    checkEbayConnection();
    
    // Check URL params for connection result
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('ebay_connected') === 'true') {
      setIsConnected(true);
      showSuccessMessage('eBay account connected successfully!');
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (urlParams.get('ebay_error')) {
      setError('Failed to connect eBay account. Please try again.');
    }
  }, []);
  
  const checkEbayConnection = async () => {
    try {
      const response = await fetch('/api/ebay/status');
      const data = await response.json();
      setIsConnected(data.connected || false);
    } catch (error) {
      console.error('Error checking eBay connection:', error);
    }
  };
  
  const connectEbay = async () => {
    setIsConnecting(true);
    setError(null);
    
    try {
      const response = await fetch('/api/ebay/auth');
      const data = await response.json();
      
      if (data.authUrl) {
        // Redirect to eBay OAuth
        window.location.href = data.authUrl;
      } else {
        throw new Error('Failed to get eBay authorization URL');
      }
    } catch (error) {
      console.error('Error connecting to eBay:', error);
      setError('Failed to connect to eBay. Please try again.');
      setIsConnecting(false);
    }
  };
  
  const disconnectEbay = async () => {
    if (!confirm('Are you sure you want to disconnect your eBay account?')) {
      return;
    }
    
    try {
      const response = await fetch('/api/ebay/disconnect', {
        method: 'POST'
      });
      
      if (response.ok) {
        setIsConnected(false);
        showSuccessMessage('eBay account disconnected');
      }
    } catch (error) {
      console.error('Error disconnecting eBay:', error);
      setError('Failed to disconnect eBay account');
    }
  };
  
  const showSuccessMessage = (message) => {
    const messageEl = document.createElement('div');
    messageEl.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
    messageEl.textContent = message;
    document.body.appendChild(messageEl);
    setTimeout(() => messageEl.remove(), 5000);
  };
  
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">eBay Integration</h3>
        <div className="flex items-center">
          <div className={`w-3 h-3 rounded-full mr-2 ${isConnected ? 'bg-green-500' : 'bg-gray-300'}`}></div>
          <span className="text-sm text-gray-600">
            {isConnected ? 'Connected' : 'Not Connected'}
          </span>
        </div>
      </div>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">
          {error}
        </div>
      )}
      
      {isConnected ? (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Your eBay account is connected. You can now list items directly to eBay.
          </p>
          <div className="flex gap-3">
            <button
              onClick={disconnectEbay}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm"
            >
              Disconnect
            </button>
            <button
              onClick={() => router.push('/settings/ebay')}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
            >
              Manage Settings
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Connect your eBay account to list items directly from LightLister AI.
          </p>
          <button
            onClick={connectEbay}
            disabled={isConnecting}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
          >
            {isConnecting ? 'Connecting...' : 'Connect eBay Account'}
          </button>
        </div>
      )}
    </div>
  );
}