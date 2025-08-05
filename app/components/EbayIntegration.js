// app/components/EbayIntegration.js
'use client';

import { useState, useEffect } from 'react';

export default function EbayIntegration({ analysisResults, onListingComplete }) {
  const [ebayStatus, setEbayStatus] = useState({
    connected: false,
    username: null,
    loading: true,
    scopesGranted: 0
  });
  
  const [listingOptions, setListingOptions] = useState({
    startingPrice: '',
    duration: 'GTC',
    shippingCost: '3.50',
    categoryId: '15724', // Women's Clothing default
    weight: '0.5'
  });
  
  const [isListing, setIsListing] = useState(false);
  const [listingResult, setListingResult] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    checkEbayStatus();
  }, []);

  useEffect(() => {
    // Set suggested price when analysis results change
    if (analysisResults?.analysis?.suggestedPrice) {
      setListingOptions(prev => ({
        ...prev,
        startingPrice: analysisResults.analysis.suggestedPrice
      }));
    }
  }, [analysisResults]);

  const checkEbayStatus = async () => {
    try {
      console.log('🔍 Checking eBay connection status...');
      
      const response = await fetch('/api/ebay/status');
      const data = await response.json();
      
      console.log('📊 eBay status response:', data);
      
      setEbayStatus({
        connected: data.connected,
        username: data.username,
        loading: false,
        scopesGranted: data.scopesGranted || 0,
        expiresAt: data.expiresAt,
        needsRefresh: data.needsRefresh
      });
    } catch (error) {
      console.error('❌ Failed to check eBay status:', error);
      setEbayStatus(prev => ({ ...prev, loading: false }));
    }
  };

  const connectToEbay = async () => {
    try {
      setIsConnecting(true);
      console.log('🚀 Starting eBay OAuth flow...');
      
      const response = await fetch('/api/ebay/auth/start');
      const data = await response.json();
      
      if (data.authUrl) {
        console.log('🔗 Opening eBay authorization window...');
        console.log('📋 Requesting', data.scopes?.length || 10, 'permissions');
        
        // Open eBay authorization in a new window
        const authWindow = window.open(
          data.authUrl, 
          'ebay-auth', 
          'width=600,height=700,scrollbars=yes,resizable=yes'
        );
        
        // Monitor the auth window
        const checkAuthComplete = setInterval(() => {
          try {
            // Check if window is closed (user completed or cancelled auth)
            if (authWindow.closed) {
              clearInterval(checkAuthComplete);
              setIsConnecting(false);
              
              // Check connection status after a brief delay
              setTimeout(() => {
                checkEbayStatus();
              }, 2000);
            }
          } catch (error) {
            // Window might be cross-origin, ignore errors
          }
        }, 1000);
        
        // Clear interval after 10 minutes (timeout)
        setTimeout(() => {
          clearInterval(checkAuthComplete);
          setIsConnecting(false);
        }, 600000);
        
      } else {
        throw new Error('No authorization URL received');
      }
    } catch (error) {
      console.error('❌ Failed to start eBay auth:', error);
      setIsConnecting(false);
      alert('Failed to start eBay connection. Please try again.');
    }
  };

  const disconnectEbay = async () => {
    try {
      const confirmed = window.confirm(
        'Are you sure you want to disconnect your eBay account? You will need to reconnect to create new listings.'
      );
      
      if (!confirmed) return;
      
      console.log('🔌 Disconnecting eBay account...');
      
      const response = await fetch('/api/ebay/disconnect', {
        method: 'POST'
      });
      
      if (response.ok) {
        console.log('✅ eBay account disconnected successfully');
        setEbayStatus({
          connected: false,
          username: null,
          loading: false,
          scopesGranted: 0
        });
        setListingResult(null);
      } else {
        throw new Error('Failed to disconnect');
      }
    } catch (error) {
      console.error('❌ Failed to disconnect eBay:', error);
      alert('Failed to disconnect eBay account. Please try again.');
    }
  };

  const listToEbay = async () => {
    if (!analysisResults || !ebayStatus.connected) return;

    setIsListing(true);
    setListingResult(null);

    try {
      console.log('🛍️ Creating eBay listing...');
      console.log('📝 Title:', analysisResults.title);
      console.log('💰 Price:', listingOptions.startingPrice);

      const listingData = {
        title: analysisResults.title,
        description: analysisResults.description,
        images: analysisResults.images,
        analysis: analysisResults.analysis,
        condition: analysisResults.analysis?.condition,
        suggestedPrice: analysisResults.analysis?.suggestedPrice,
        ...listingOptions
      };

      const response = await fetch('/api/ebay/list-item', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(listingData)
      });

      const result = await response.json();

      if (result.success) {
        console.log('✅ eBay listing created successfully!');
        console.log('🔗 eBay URL:', result.ebayUrl);
        
        setListingResult({
          success: true,
          listingId: result.listingId,
          ebayUrl: result.ebayUrl,
          message: result.message,
          sku: result.sku
        });
        
        if (onListingComplete) {
          onListingComplete(result);
        }
      } else {
        console.error('❌ eBay listing failed:', result.error);
        
        setListingResult({
          success: false,
          error: result.error,
          needsReconnection: result.needsReconnection,
          needsConnection: result.needsConnection
        });
      }
    } catch (error) {
      console.error('❌ Failed to list item:', error);
      setListingResult({
        success: false,
        error: 'Failed to create listing - please try again'
      });
    } finally {
      setIsListing(false);
    }
  };

  if (ebayStatus.loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="text-2xl">🛍️</div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">eBay Integration</h3>
            <p className="text-sm text-gray-600">
              {ebayStatus.connected 
                ? `Connected as ${ebayStatus.username || 'eBay User'} • ${ebayStatus.scopesGranted} permissions granted` 
                : 'Connect your eBay seller account to list items directly'
              }
            </p>
          </div>
        </div>
        
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
          ebayStatus.connected 
            ? 'bg-green-100 text-green-800' 
            : 'bg-gray-100 text-gray-600'
        }`}>
          {ebayStatus.connected ? '✅ Connected' : '❌ Not Connected'}
        </div>
      </div>

      {!ebayStatus.connected ? (
        <div className="text-center py-8">
          <div className="text-4xl mb-4">🔗</div>
          <h4 className="text-lg font-medium text-gray-900 mb-2">
            Connect Your eBay Seller Account
          </h4>
          <p className="text-gray-600 mb-6">
            Connect your eBay seller account to list items directly from Fashion Analyzer Pro.<br/>
            <span className="text-sm text-gray-500">Requires 10 permissions for full listing functionality</span>
          </p>
          
          <button
            onClick={connectToEbay}
            disabled={isConnecting}
            className={`${
              isConnecting 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700'
            } text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 shadow-sm`}
          >
            {isConnecting ? (
              <span className="flex items-center">
                <div className="animate-spin mr-2 w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                Connecting...
              </span>
            ) : (
              '🚀 Connect to eBay'
            )}
          </button>
          
          <div className="mt-4 text-xs text-gray-500 space-y-1">
            <p>• Requires eBay seller account with payment method</p>
            <p>• Secure OAuth authentication</p>
            <p>• Direct listing creation with professional descriptions</p>
            <p>• Automatic image upload and category selection</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Listing Options */}
          {analysisResults && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-4 flex items-center">
                📋 Listing Options
                <span className="ml-2 text-sm text-gray-500">
                  ({analysisResults.images?.length || 0} photos ready)
                </span>
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Starting Price (£) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max="999999"
                    value={listingOptions.startingPrice}
                    onChange={(e) => setListingOptions(prev => ({
                      ...prev,
                      startingPrice: e.target.value
                    }))}
                    placeholder={analysisResults.analysis?.suggestedPrice || '9.99'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {analysisResults.analysis?.suggestedPrice && (
                    <p className="text-xs text-green-600 mt-1">
                      💡 AI suggested: £{analysisResults.analysis.suggestedPrice}
                    </p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Shipping Cost (£)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={listingOptions.shippingCost}
                    onChange={(e) => setListingOptions(prev => ({
                      ...prev,
                      shippingCost: e.target.value
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Standard UK shipping
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duration
                  </label>
                  <select
                    value={listingOptions.duration}
                    onChange={(e) => setListingOptions(prev => ({
                      ...prev,
                      duration: e.target.value
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="GTC">Good Till Cancelled (Recommended)</option>
                    <option value="DAYS_3">3 Days</option>
                    <option value="DAYS_5">5 Days</option>
                    <option value="DAYS_7">7 Days</option>
                    <option value="DAYS_10">10 Days</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Package Weight (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    max="30"
                    value={listingOptions.weight}
                    onChange={(e) => setListingOptions(prev => ({
                      ...prev,
                      weight: e.target.value
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    For shipping calculation
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* List to eBay Button */}
          {analysisResults ? (
            <div className="flex justify-between items-center">
              <button
                onClick={listToEbay}
                disabled={isListing || !listingOptions.startingPrice || parseFloat(listingOptions.startingPrice) < 0.01}
                className={`flex-1 mr-4 py-3 px-6 rounded-lg font-semibold transition-colors duration-200 ${
                  isListing || !listingOptions.startingPrice || parseFloat(listingOptions.startingPrice) < 0.01
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700 text-white shadow-sm'
                }`}
              >
                {isListing ? (
                  <span className="flex items-center justify-center">
                    <div className="animate-spin mr-2 w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                    Creating Listing...
                  </span>
                ) : (
                  '🛍️ List to eBay Now'
                )}
              </button>
              
              <button
                onClick={disconnectEbay}
                className="text-red-600 hover:text-red-700 text-sm px-4 py-2 transition-colors"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">
              📸 Analyze fashion items first to enable eBay listing
            </div>
          )}

          {/* Listing Result */}
          {listingResult && (
            <div className={`p-4 rounded-lg border ${
              listingResult.success 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              {listingResult.success ? (
                <div>
                  <div className="flex items-center mb-2">
                    <span className="text-green-600 text-lg mr-2">✅</span>
                    <span className="font-medium text-green-800">
                      Successfully Listed on eBay!
                    </span>
                  </div>
                  <p className="text-green-700 text-sm mb-3">
                    {listingResult.message}
                  </p>
                  <div className="text-xs text-green-600 mb-3 space-y-1">
                    <p>📋 Listing ID: {listingResult.listingId}</p>
                    <p>📦 SKU: {listingResult.sku}</p>
                  </div>
                  {listingResult.ebayUrl && (
                    <a
                      href={listingResult.ebayUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-blue-600 hover:text-blue-700 text-sm font-medium bg-white px-3 py-1 rounded border border-blue-200 hover:border-blue-300 transition-colors"
                    >
                      🔗 View on eBay
                      <span className="ml-1 text-xs">↗</span>
                    </a>
                  )}
                </div>
              ) : (
                <div>
                  <div className="flex items-center mb-2">
                    <span className="text-red-600 text-lg mr-2">❌</span>
                    <span className="font-medium text-red-800">
                      Listing Failed
                    </span>
                  </div>
                  <p className="text-red-700 text-sm mb-3">
                    {listingResult.error}
                  </p>
                  {(listingResult.needsReconnection || listingResult.needsConnection) && (
                    <button
                      onClick={connectToEbay}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      🔄 Reconnect eBay Account
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}