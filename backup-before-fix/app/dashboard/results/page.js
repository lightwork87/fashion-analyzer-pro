'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { 
  ArrowLeft,
  Home,
  CreditCard,
  CheckCircle,
  AlertCircle,
  Edit2,
  Save,
  Copy,
  ExternalLink,
  Package,
  Tag,
  Ruler,
  Palette,
  ShoppingBag,
  PoundSterling,
  TrendingUp,
  Camera,
  ChevronRight,
  Download,
  Share2,
  Sparkles,
  Info,
  X,
  Plus,
  Minus,
  RefreshCw,
  FileText,
  Moon,
  Sun,
  Target,
  BarChart3,
  Zap
} from 'lucide-react';

export default function ResultsPage() {
  const { user } = useUser();
  const router = useRouter();
  
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editedData, setEditedData] = useState({});
  const [darkMode, setDarkMode] = useState(false);
  const [credits, setCredits] = useState(100);
  const [activeTab, setActiveTab] = useState('overview');
  const [copiedField, setCopiedField] = useState(null);
  const [priceHistory, setPriceHistory] = useState(null);
  const [similarItems, setSimilarItems] = useState([]);

  // Load dark mode preference
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedDarkMode);
    if (savedDarkMode) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  useEffect(() => {
    // Load analysis from session storage or URL params
    const loadAnalysis = async () => {
      try {
        // Try session storage first
        const storedResult = sessionStorage.getItem('analysisResult');
        if (storedResult) {
          const data = JSON.parse(storedResult);
          setAnalysis(data);
          setEditedData(data);
          sessionStorage.removeItem('analysisResult'); // Clean up
        } else {
          // Try URL params
          const urlParams = new URLSearchParams(window.location.search);
          const analysisId = urlParams.get('id');
          
          if (analysisId) {
            // Fetch from database
            const response = await fetch(`/api/analyses/${analysisId}`);
            if (response.ok) {
              const data = await response.json();
              setAnalysis(data.analysis);
              setEditedData(data.analysis);
            }
          }
        }

        // Fetch price history
        if (analysis?.item_type && analysis?.brand) {
          fetchPriceHistory(analysis.item_type, analysis.brand);
        }

        // Fetch similar items
        if (analysis?.category) {
          fetchSimilarItems(analysis.category, analysis.brand);
        }
      } catch (error) {
        console.error('Error loading analysis:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAnalysis();
  }, []);

  const fetchPriceHistory = async (itemType, brand) => {
    try {
      const response = await fetch(`/api/pricing/history?item=${itemType}&brand=${brand}`);
      if (response.ok) {
        const data = await response.json();
        setPriceHistory(data);
      }
    } catch (error) {
      console.error('Error fetching price history:', error);
    }
  };

  const fetchSimilarItems = async (category, brand) => {
    try {
      const response = await fetch(`/api/pricing/similar?category=${category}&brand=${brand}`);
      if (response.ok) {
        const data = await response.json();
        setSimilarItems(data.items || []);
      }
    } catch (error) {
      console.error('Error fetching similar items:', error);
    }
  };

  const handleEdit = (field, value) => {
    setEditedData({
      ...editedData,
      [field]: value
    });
  };

  const saveEdits = async () => {
    try {
      const response = await fetch(`/api/analyses/${analysis.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editedData)
      });

      if (response.ok) {
        setAnalysis(editedData);
        setEditing(false);
      }
    } catch (error) {
      console.error('Error saving edits:', error);
    }
  };

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const exportToEbay = () => {
    // Store data and navigate to eBay listing page
    sessionStorage.setItem('ebayListingData', JSON.stringify(editedData));
    router.push('/dashboard/list/ebay');
  };

  const exportToVinted = () => {
    // Store data and navigate to Vinted listing page
    sessionStorage.setItem('vintedListingData', JSON.stringify(editedData));
    router.push('/dashboard/list/vinted');
  };

  const regenerateAnalysis = async () => {
    // Re-analyze with same images
    router.push('/dashboard/analyze-single');
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Loading results...</p>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className={`mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>No analysis results found</p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
        </div>
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
              
              <div className="flex items-center gap-2">
                <h1 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-black'}`}>
                  Analysis Results
                </h1>
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${
                darkMode 
                  ? 'bg-gray-800 border-gray-700' 
                  : 'bg-gray-100 border-gray-300'
              }`}>
                <CreditCard className="w-4 h-4" />
                <span className="font-medium">{credits} Credits</span>
              </div>
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
          <Link href="/dashboard/analyze-single" className={darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'}>
            Single Item Analysis
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span className={darkMode ? 'text-white' : 'text-black'}>Results</span>
        </nav>

        {/* Action Bar */}
        <div className={`rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} p-4 mb-6`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setEditing(!editing)}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 transition ${
                  editing
                    ? 'bg-black text-white'
                    : `border ${darkMode ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-300 hover:bg-gray-100'}`
                }`}
              >
                {editing ? (
                  <>
                    <Save className="w-4 h-4" />
                    Save Changes
                  </>
                ) : (
                  <>
                    <Edit2 className="w-4 h-4" />
                    Edit Details
                  </>
                )}
              </button>
              
              <button
                onClick={regenerateAnalysis}
                className={`px-4 py-2 rounded-lg border flex items-center gap-2 transition ${
                  darkMode 
                    ? 'border-gray-600 hover:bg-gray-700' 
                    : 'border-gray-300 hover:bg-gray-100'
                }`}
              >
                <RefreshCw className="w-4 h-4" />
                Re-analyze
              </button>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={exportToVinted}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2 transition"
              >
                <Tag className="w-4 h-4" />
                List on Vinted
              </button>
              
              <button
                onClick={exportToEbay}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 transition"
              >
                <ShoppingBag className="w-4 h-4" />
                List on eBay UK
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'} mb-6`}>
          <nav className="flex gap-6">
            {['overview', 'listing', 'pricing', 'keywords'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-4 px-1 capitalize font-medium transition relative ${
                  activeTab === tab
                    ? darkMode ? 'text-white' : 'text-black'
                    : darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'
                }`}
              >
                {tab}
                {activeTab === tab && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black dark:bg-white" />
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {activeTab === 'overview' && (
              <>
                {/* Item Details */}
                <div className={`rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} p-6`}>
                  <h2 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-black'}`}>
                    Item Details
                  </h2>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Brand
                      </label>
                      {editing ? (
                        <input
                          type="text"
                          value={editedData.brand || ''}
                          onChange={(e) => handleEdit('brand', e.target.value)}
                          className={`w-full mt-1 px-3 py-2 rounded-lg border ${
                            darkMode 
                              ? 'bg-gray-700 border-gray-600 text-white' 
                              : 'bg-gray-50 border-gray-300 text-black'
                          }`}
                        />
                      ) : (
                        <p className={`font-medium ${darkMode ? 'text-white' : 'text-black'}`}>
                          {editedData.brand || 'Unbranded'}
                        </p>
                      )}
                    </div>
                    
                    <div>
                      <label className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Item Type
                      </label>
                      {editing ? (
                        <input
                          type="text"
                          value={editedData.item_type || ''}
                          onChange={(e) => handleEdit('item_type', e.target.value)}
                          className={`w-full mt-1 px-3 py-2 rounded-lg border ${
                            darkMode 
                              ? 'bg-gray-700 border-gray-600 text-white' 
                              : 'bg-gray-50 border-gray-300 text-black'
                          }`}
                        />
                      ) : (
                        <p className={`font-medium ${darkMode ? 'text-white' : 'text-black'}`}>
                          {editedData.item_type}
                        </p>
                      )}
                    </div>
                    
                    <div>
                      <label className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Size
                      </label>
                      {editing ? (
                        <input
                          type="text"
                          value={editedData.size || ''}
                          onChange={(e) => handleEdit('size', e.target.value)}
                          className={`w-full mt-1 px-3 py-2 rounded-lg border ${
                            darkMode 
                              ? 'bg-gray-700 border-gray-600 text-white' 
                              : 'bg-gray-50 border-gray-300 text-black'
                          }`}
                        />
                      ) : (
                        <p className={`font-medium ${darkMode ? 'text-white' : 'text-black'}`}>
                          {editedData.size || 'One Size'}
                        </p>
                      )}
                    </div>
                    
                    <div>
                      <label className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Colour
                      </label>
                      {editing ? (
                        <input
                          type="text"
                          value={editedData.color || ''}
                          onChange={(e) => handleEdit('color', e.target.value)}
                          className={`w-full mt-1 px-3 py-2 rounded-lg border ${
                            darkMode 
                              ? 'bg-gray-700 border-gray-600 text-white' 
                              : 'bg-gray-50 border-gray-300 text-black'
                          }`}
                        />
                      ) : (
                        <p className={`font-medium ${darkMode ? 'text-white' : 'text-black'}`}>
                          {editedData.color}
                        </p>
                      )}
                    </div>
                    
                    <div>
                      <label className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Material
                      </label>
                      {editing ? (
                        <input
                          type="text"
                          value={editedData.material || ''}
                          onChange={(e) => handleEdit('material', e.target.value)}
                          className={`w-full mt-1 px-3 py-2 rounded-lg border ${
                            darkMode 
                              ? 'bg-gray-700 border-gray-600 text-white' 
                              : 'bg-gray-50 border-gray-300 text-black'
                          }`}
                        />
                      ) : (
                        <p className={`font-medium ${darkMode ? 'text-white' : 'text-black'}`}>
                          {editedData.material || 'See label'}
                        </p>
                      )}
                    </div>
                    
                    <div>
                      <label className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Condition
                      </label>
                      {editing ? (
                        <select
                          value={editedData.condition_score || 7}
                          onChange={(e) => handleEdit('condition_score', parseInt(e.target.value))}
                          className={`w-full mt-1 px-3 py-2 rounded-lg border ${
                            darkMode 
                              ? 'bg-gray-700 border-gray-600 text-white' 
                              : 'bg-gray-50 border-gray-300 text-black'
                          }`}
                        >
                          <option value="10">New with tags</option>
                          <option value="9">New without tags</option>
                          <option value="8">Like new</option>
                          <option value="7">Very good</option>
                          <option value="6">Good</option>
                          <option value="5">Fair</option>
                        </select>
                      ) : (
                        <p className={`font-medium ${darkMode ? 'text-white' : 'text-black'}`}>
                          {editedData.condition_score >= 9 ? 'New' : 
                           editedData.condition_score >= 7 ? 'Very Good' : 
                           editedData.condition_score >= 5 ? 'Good' : 'Fair'}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* SKU & Category */}
                <div className={`rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} p-6`}>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        SKU
                      </label>
                      <div className="flex items-center gap-2 mt-1">
                        <p className={`font-medium font-mono ${darkMode ? 'text-white' : 'text-black'}`}>
                          {editedData.sku}
                        </p>
                        <button
                          onClick={() => copyToClipboard(editedData.sku, 'sku')}
                          className={`p-1 rounded ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                        >
                          {copiedField === 'sku' ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                    
                    <div>
                      <label className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Category
                      </label>
                      <p className={`font-medium ${darkMode ? 'text-white' : 'text-black'}`}>
                        {editedData.category}
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'listing' && (
              <>
                {/* eBay Title */}
                <div className={`rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} p-6`}>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-black'}`}>
                      eBay UK Title
                    </h2>
                    <span className={`text-sm ${
                      editedData.ebay_title?.length > 80 ? 'text-red-500' : 'text-green-500'
                    }`}>
                      {editedData.ebay_title?.length || 0}/80 characters
                    </span>
                  </div>
                  
                  {editing ? (
                    <input
                      type="text"
                      value={editedData.ebay_title || ''}
                      onChange={(e) => handleEdit('ebay_title', e.target.value)}
                      maxLength={80}
                      className={`w-full px-3 py-2 rounded-lg border ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-gray-50 border-gray-300 text-black'
                      }`}
                    />
                  ) : (
                    <div className="flex items-center gap-2">
                      <p className={`flex-1 ${darkMode ? 'text-white' : 'text-black'}`}>
                        {editedData.ebay_title}
                      </p>
                      <button
                        onClick={() => copyToClipboard(editedData.ebay_title, 'title')}
                        className={`p-1 rounded ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                      >
                        {copiedField === 'title' ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {/* Description */}
                <div className={`rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} p-6`}>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-black'}`}>
                      Description
                    </h2>
                    <button
                      onClick={() => copyToClipboard(editedData.description, 'description')}
                      className={`p-1 rounded ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                    >
                      {copiedField === 'description' ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  
                  {editing ? (
                    <textarea
                      value={editedData.description || ''}
                      onChange={(e) => handleEdit('description', e.target.value)}
                      rows={8}
                      className={`w-full px-3 py-2 rounded-lg border ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-gray-50 border-gray-300 text-black'
                      }`}
                    />
                  ) : (
                    <div className={`whitespace-pre-wrap ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {editedData.description}
                    </div>
                  )}
                </div>
              </>
            )}

            {activeTab === 'pricing' && (
              <>
                {/* Pricing Recommendation */}
                <div className={`rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} p-6`}>
                  <h2 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-black'}`}>
                    AI Pricing Recommendation
                  </h2>
                  
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className={`text-center p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>
                        Minimum
                      </p>
                      <p className="text-2xl font-bold">
                        £{editedData.estimated_value_min || 0}
                      </p>
                    </div>
                    
                    <div className="text-center p-4 rounded-lg bg-black text-white dark:bg-white dark:text-black">
                      <p className="text-sm opacity-70 mb-1">
                        Recommended
                      </p>
                      <p className="text-3xl font-bold">
                        £{editedData.suggested_price || 0}
                      </p>
                    </div>
                    
                    <div className={`text-center p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>
                        Maximum
                      </p>
                      <p className="text-2xl font-bold">
                        £{editedData.estimated_value_max || 0}
                      </p>
                    </div>
                  </div>

                  {editing && (
                    <div>
                      <label className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Adjust Price
                      </label>
                      <div className="flex items-center gap-4 mt-2">
                        <button
                          onClick={() => handleEdit('suggested_price', Math.max(0, editedData.suggested_price - 1))}
                          className={`p-2 rounded-lg border ${darkMode ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-300 hover:bg-gray-100'}`}
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        
                        <input
                          type="number"
                          value={editedData.suggested_price || 0}
                          onChange={(e) => handleEdit('suggested_price', parseFloat(e.target.value) || 0)}
                          className={`w-24 px-3 py-2 text-center rounded-lg border ${
                            darkMode 
                              ? 'bg-gray-700 border-gray-600 text-white' 
                              : 'bg-gray-50 border-gray-300 text-black'
                          }`}
                        />
                        
                        <button
                          onClick={() => handleEdit('suggested_price', editedData.suggested_price + 1)}
                          className={`p-2 rounded-lg border ${darkMode ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-300 hover:bg-gray-100'}`}
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Price History Chart */}
                {priceHistory && (
                  <div className={`rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} p-6`}>
                    <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-black'}`}>
                      <BarChart3 className="w-5 h-5" />
                      eBay UK Sold Prices (90 Days)
                    </h3>
                    
                    <div className={`h-48 flex items-end justify-between gap-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {/* Simple bar chart visualization */}
                      {priceHistory.bars?.map((bar, index) => (
                        <div key={index} className="flex-1 flex flex-col items-center">
                          <div 
                            className="w-full bg-blue-500 rounded-t"
                            style={{ height: `${bar.percentage}%` }}
                          />
                          <span className="text-xs mt-1">£{bar.price}</span>
                        </div>
                      ))}
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 mt-4">
                      <div>
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          Average Sold
                        </p>
                        <p className={`font-medium ${darkMode ? 'text-white' : 'text-black'}`}>
                          £{priceHistory.average || 0}
                        </p>
                      </div>
                      <div>
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          Total Sold
                        </p>
                        <p className={`font-medium ${darkMode ? 'text-white' : 'text-black'}`}>
                          {priceHistory.totalSold || 0} items
                        </p>
                      </div>
                      <div>
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          Sell-through
                        </p>
                        <p className={`font-medium ${darkMode ? 'text-white' : 'text-black'}`}>
                          {priceHistory.sellThrough || 0}%
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Similar Items */}
                {similarItems.length > 0 && (
                  <div className={`rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} p-6`}>
                    <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-black'}`}>
                      Similar Items Recently Sold
                    </h3>
                    
                    <div className="space-y-3">
                      {similarItems.slice(0, 5).map((item, index) => (
                        <div key={index} className={`flex items-center justify-between p-3 rounded-lg ${
                          darkMode ? 'bg-gray-700' : 'bg-gray-100'
                        }`}>
                          <div>
                            <p className={`font-medium ${darkMode ? 'text-white' : 'text-black'}`}>
                              {item.title}
                            </p>
                            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                              Sold {item.daysAgo} days ago
                            </p>
                          </div>
                          <p className="font-bold text-lg">
                            £{item.price}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {activeTab === 'keywords' && (
              <div className={`rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} p-6`}>
                <h2 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-black'}`}>
                  Search Keywords
                </h2>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  {editedData.keywords?.map((keyword, index) => (
                    <span
                      key={index}
                      className={`px-3 py-1 rounded-full text-sm ${
                        darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
                      } ${editing ? 'pr-8 relative' : ''}`}
                    >
                      {keyword}
                      {editing && (
                        <button
                          onClick={() => {
                            const newKeywords = editedData.keywords.filter((_, i) => i !== index);
                            handleEdit('keywords', newKeywords);
                          }}
                          className="absolute right-1 top-1/2 transform -translate-y-1/2 p-1"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </span>
                  ))}
                </div>
                
                {editing && (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add keyword..."
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && e.target.value) {
                          handleEdit('keywords', [...(editedData.keywords || []), e.target.value]);
                          e.target.value = '';
                        }
                      }}
                      className={`flex-1 px-3 py-2 rounded-lg border ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-gray-50 border-gray-300 text-black'
                      }`}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className={`rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} p-6`}>
              <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-black'}`}>
                <Zap className="w-5 h-5" />
                AI Confidence
              </h3>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                      Brand Detection
                    </span>
                    <span className={darkMode ? 'text-white' : 'text-black'}>
                      {analysis.brand_confidence || 85}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${analysis.brand_confidence || 85}%` }}
                    />
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                      Size Accuracy
                    </span>
                    <span className={darkMode ? 'text-white' : 'text-black'}>
                      {analysis.size_confidence || 92}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${analysis.size_confidence || 92}%` }}
                    />
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                      Price Accuracy
                    </span>
                    <span className={darkMode ? 'text-white' : 'text-black'}>
                      {analysis.price_confidence || 78}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-purple-500 h-2 rounded-full"
                      style={{ width: `${analysis.price_confidence || 78}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Export Options */}
            <div className={`rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} p-6`}>
              <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-black'}`}>
                Export Options
              </h3>
              
              <div className="space-y-3">
                <button className={`w-full px-4 py-2 rounded-lg border flex items-center justify-center gap-2 transition ${
                  darkMode 
                    ? 'border-gray-600 hover:bg-gray-700' 
                    : 'border-gray-300 hover:bg-gray-100'
                }`}>
                  <Download className="w-4 h-4" />
                  Download CSV
                </button>
                
                <button className={`w-full px-4 py-2 rounded-lg border flex items-center justify-center gap-2 transition ${
                  darkMode 
                    ? 'border-gray-600 hover:bg-gray-700' 
                    : 'border-gray-300 hover:bg-gray-100'
                }`}>
                  <FileText className="w-4 h-4" />
                  Save as Draft
                </button>
                
                <button className={`w-full px-4 py-2 rounded-lg border flex items-center justify-center gap-2 transition ${
                  darkMode 
                    ? 'border-gray-600 hover:bg-gray-700' 
                    : 'border-gray-300 hover:bg-gray-100'
                }`}>
                  <Share2 className="w-4 h-4" />
                  Share Results
                </button>
              </div>
            </div>

            {/* Help */}
            <div className={`rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} p-6`}>
              <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-black'}`}>
                <Info className="w-5 h-5" />
                Tips
              </h3>
              
              <ul className={`space-y-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                  <span>Review and edit all details before listing</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                  <span>Add more keywords for better visibility</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                  <span>Check similar sold items for pricing</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                  <span>Use all 24 photo slots on eBay</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}