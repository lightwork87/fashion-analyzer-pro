'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft,
  Star,
  PoundSterling,
  Package,
  Tag,
  Palette,
  Ruler,
  FileText,
  Download,
  ExternalLink,
  Copy,
  Check,
  Edit3,
  Share2,
  Zap,
  TrendingUp,
  Eye,
  Clock,
  AlertCircle,
  CheckCircle,
  Info,
  Sparkles
} from 'lucide-react';

export default function ResultsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedPrice, setEditedPrice] = useState('');
  const [editedDescription, setEditedDescription] = useState('');

  useEffect(() => {
    loadAnalysisData();
  }, []);

  const loadAnalysisData = async () => {
    try {
      // Try to get data from sessionStorage first
      const storedData = sessionStorage.getItem('analysisResult');
      
      if (storedData) {
        const analysisData = JSON.parse(storedData);
        setAnalysis(analysisData);
        setEditedTitle(analysisData.ebay_title);
        setEditedPrice(analysisData.suggested_price.toString());
        setEditedDescription(analysisData.description);
      } else {
        // Fallback: get ID from URL and fetch from database
        const analysisId = searchParams.get('id');
        if (analysisId) {
          const response = await fetch(`/api/analyses/${analysisId}`);
          if (response.ok) {
            const data = await response.json();
            setAnalysis(data.analysis);
            setEditedTitle(data.analysis.ebay_title);
            setEditedPrice(data.analysis.suggested_price.toString());
            setEditedDescription(data.analysis.description);
          } else {
            throw new Error('Analysis not found');
          }
        } else {
          throw new Error('No analysis data available');
        }
      }
    } catch (error) {
      console.error('Error loading analysis:', error);
      // Redirect back to dashboard if no data
      router.push('/dashboard?error=analysis-not-found');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleSaveEdits = async () => {
    if (!analysis) return;
    
    try {
      const updatedAnalysis = {
        ...analysis,
        ebay_title: editedTitle,
        suggested_price: parseFloat(editedPrice),
        description: editedDescription
      };
      
      // Update in sessionStorage
      sessionStorage.setItem('analysisResult', JSON.stringify(updatedAnalysis));
      setAnalysis(updatedAnalysis);
      setEditMode(false);
      
      // TODO: Also save to database
      
    } catch (error) {
      console.error('Error saving edits:', error);
    }
  };

  const getConditionColor = (score) => {
    if (score >= 9) return 'text-green-600 bg-green-100';
    if (score >= 7) return 'text-yellow-600 bg-yellow-100';
    if (score >= 5) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const getConditionText = (score) => {
    if (score >= 9) return 'Excellent';
    if (score >= 7) return 'Good';
    if (score >= 5) return 'Fair';
    return 'Poor';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="text-gray-600">Loading analysis results...</span>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Analysis Not Found</h2>
          <p className="text-gray-600 mb-4">The analysis data could not be loaded.</p>
          <Link
            href="/dashboard"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <Link
              href="/dashboard"
              className="flex items-center text-sm text-gray-600 hover:text-gray-900 transition"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Dashboard
            </Link>
            <div className="flex items-center space-x-2 bg-green-100 text-green-700 px-3 py-1 rounded-full">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm font-medium">Analysis Complete</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Analysis Results</h1>
              <p className="text-gray-600 mt-1">
                AI-generated listing ready for eBay UK and Vinted
              </p>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Sparkles className="w-4 h-4" />
              <span>Powered by AI</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Title and Basic Info */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Listing Details</h2>
                <button
                  onClick={() => setEditMode(!editMode)}
                  className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-700"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>{editMode ? 'Cancel' : 'Edit'}</span>
                </button>
              </div>

              {editMode ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      eBay Title (max 80 characters)
                    </label>
                    <input
                      type="text"
                      value={editedTitle}
                      onChange={(e) => setEditedTitle(e.target.value)}
                      maxLength={80}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {editedTitle.length}/80 characters
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Price (£)
                    </label>
                    <input
                      type="number"
                      value={editedPrice}
                      onChange={(e) => setEditedPrice(e.target.value)}
                      step="0.01"
                      min="0"
                      className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={editedDescription}
                      onChange={(e) => setEditedDescription(e.target.value)}
                      rows={6}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div className="flex space-x-3">
                    <button
                      onClick={handleSaveEdits}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                    >
                      <Check className="w-4 h-4" />
                      <span>Save Changes</span>
                    </button>
                    <button
                      onClick={() => setEditMode(false)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-gray-700">eBay Title</label>
                      <button
                        onClick={() => handleCopy(analysis.ebay_title)}
                        className="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-900"
                      >
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        <span>{copied ? 'Copied!' : 'Copy'}</span>
                      </button>
                    </div>
                    <p className="text-lg font-medium text-gray-900 bg-gray-50 p-3 rounded-lg">
                      {analysis.ebay_title}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Suggested Price</label>
                      <div className="flex items-center space-x-2 mt-1">
                        <PoundSterling className="w-5 h-5 text-green-600" />
                        <span className="text-xl font-bold text-green-600">
                          {analysis.suggested_price}
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Price Range</label>
                      <p className="text-gray-600 mt-1">
                        £{analysis.estimated_value_min} - £{analysis.estimated_value_max}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Item Details */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Item Information</h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <Tag className="w-6 h-6 text-gray-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-700">Brand</p>
                  <p className="text-lg font-semibold text-gray-900">{analysis.brand}</p>
                </div>
                
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <Ruler className="w-6 h-6 text-gray-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-700">Size</p>
                  <p className="text-lg font-semibold text-gray-900">{analysis.size}</p>
                </div>
                
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <Palette className="w-6 h-6 text-gray-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-700">Colour</p>
                  <p className="text-lg font-semibold text-gray-900">{analysis.color}</p>
                </div>
                
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <Star className="w-6 h-6 text-gray-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-700">Condition</p>
                  <div className="flex items-center justify-center space-x-1">
                    <span className={`px-2 py-1 rounded-full text-sm font-medium ${getConditionColor(analysis.condition_score)}`}>
                      {getConditionText(analysis.condition_score)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Category</label>
                  <p className="text-gray-900 mt-1">{analysis.category}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Style</label>
                  <p className="text-gray-900 mt-1">{analysis.style}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Gender</label>
                  <p className="text-gray-900 mt-1">{analysis.gender}</p>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Description</h3>
                <button
                  onClick={() => handleCopy(analysis.description)}
                  className="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-900"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <pre className="text-sm text-gray-900 whitespace-pre-wrap font-sans">
                  {analysis.description}
                </pre>
              </div>
            </div>

            {/* Keywords */}
            {analysis.keywords && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Keywords</h3>
                <div className="flex flex-wrap gap-2">
                  {analysis.keywords.map((keyword, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Action Buttons */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">List Your Item</h3>
              
              <div className="space-y-3">
                <Link
                  href={`/dashboard/listing/${analysis.id}/ebay`}
                  className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition"
                >
                  <ExternalLink className="w-5 h-5" />
                  <span className="font-medium">List on eBay UK</span>
                </Link>
                
                <Link
                  href={`/dashboard/listing/${analysis.id}/vinted`}
                  className="w-full flex items-center justify-center space-x-2 bg-purple-600 text-white px-4 py-3 rounded-lg hover:bg-purple-700 transition"
                >
                  <Download className="w-5 h-5" />
                  <span className="font-medium">Export for Vinted</span>
                </Link>
                
                <button className="w-full flex items-center justify-center space-x-2 border border-gray-300 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-50 transition">
                  <Share2 className="w-5 h-5" />
                  <span className="font-medium">Share Listing</span>
                </button>
              </div>
            </div>

            {/* Analysis Info */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Analysis Info</h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">SKU</span>
                  <span className="text-sm font-medium text-gray-900">{analysis.sku}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Photos</span>
                  <span className="text-sm font-medium text-gray-900">{analysis.images_count || 1}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Credits Used</span>
                  <span className="text-sm font-medium text-gray-900">1</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Credits Remaining</span>
                  <span className="text-sm font-medium text-green-600">{analysis.credits_remaining}</span>
                </div>
                
                {analysis.analyzed_at && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Analyzed</span>
                    <span className="text-sm font-medium text-gray-900">
                      {new Date(analysis.analyzed_at).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* AI Confidence */}
            {analysis.analysis_confidence !== undefined && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Analysis</h3>
                
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Confidence Score</span>
                      <span className="text-sm font-medium text-gray-900">
                        {Math.round(analysis.analysis_confidence * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${analysis.analysis_confidence * 100}%` }}
                      />
                    </div>
                  </div>
                  
                  {analysis.detection_metadata && (
                    <div className="text-xs text-gray-600 space-y-1">
                      <p>• Brands detected: {analysis.detection_metadata.brands_detected}</p>
                      <p>• Sizes found: {analysis.detection_metadata.sizes_detected}</p>
                      <p>• Items identified: {analysis.detection_metadata.items_detected}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tips */}
            <div className="bg-blue-50 rounded-xl border border-blue-200 p-6">
              <div className="flex items-center space-x-2 mb-3">
                <Info className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm font-semibold text-blue-900">Listing Tips</h3>
              </div>
              <ul className="text-sm text-blue-800 space-y-2">
                <li>• Use all photo slots on eBay (12 max)</li>
                <li>• Start with Buy It Now pricing</li>
                <li>• Include measurements in description</li>
                <li>• Set up automatic relisting</li>
                <li>• Use promoted listings for better visibility</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}