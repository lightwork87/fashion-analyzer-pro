'use client';

// app/dashboard/results/page.js
// COMPLETE RESULTS PAGE WITH AI LEARNING CORRECTIONS

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Package, 
  Tag, 
  PoundSterling, 
  Ruler, 
  Star,
  Edit2,
  Save,
  X,
  CheckCircle,
  Brain,
  AlertCircle
} from 'lucide-react';

ResultsPage() {
  const router = useRouter();
  const { userId } = useAuth();
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [corrections, setCorrections] = useState({});
  const [saving, setSaving] = useState(false);
  const [correctionSaved, setCorrectionSaved] = useState(false);

  useEffect(() => {
    loadAnalysis();
  }, []);

  const loadAnalysis = async () => {
    try {
      // Try to get from sessionStorage first
      const stored = sessionStorage.getItem('analysisResult');
      if (stored) {
        const data = JSON.parse(stored);
        setAnalysis(data);
        setCorrections({
          brand: data.brand,
          item_type: data.item_type,
          size: data.size,
          color: data.color,
          ebay_title: data.ebay_title,
          suggested_price: data.suggested_price
        });
      } else {
        // Try to get from URL parameter
        const params = new URLSearchParams(window.location.search);
        const analysisId = params.get('id');
        
        if (analysisId) {
          // Fetch from database
          const response = await fetch(`/api/analyses/${analysisId}`);
          if (response.ok) {
            const data = await response.json();
            setAnalysis(data);
            setCorrections({
              brand: data.brand,
              item_type: data.item_type,
              size: data.size,
              color: data.color,
              ebay_title: data.ebay_title,
              suggested_price: data.suggested_price
            });
          }
        }
      }
    } catch (error) {
      console.error('Error loading analysis:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCorrection = (field, value) => {
    setCorrections(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const saveCorrections = async () => {
    setSaving(true);
    let hasChanges = false;
    
    try {
      // Save each correction that changed
      for (const [field, value] of Object.entries(corrections)) {
        if (value !== analysis[field]) {
          hasChanges = true;
          
          // Send correction to learning API
          await fetch('/api/ai-learning', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              analysisId: analysis.id,
              fieldCorrected: field,
              originalValue: analysis[field],
              correctedValue: value,
              additionalContext: {
                userId: userId,
                timestamp: new Date().toISOString()
              }
            })
          });
          
          // Save learned patterns for brand corrections
          if (field === 'brand' && analysis.allText) {
            // Extract key words from the original text that should map to this brand
            const words = analysis.allText?.split(/\s+/) || [];
            for (const word of words.slice(0, 5)) {
              if (word.length > 3) {
                await fetch('/api/ai-learning', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    analysisId: analysis.id,
                    fieldCorrected: 'brand_pattern',
                    originalValue: word,
                    correctedValue: value
                  })
                });
              }
            }
          }
        }
      }
      
      if (hasChanges) {
        // Update local state
        setAnalysis(prev => ({
          ...prev,
          ...corrections
        }));
        
        setCorrectionSaved(true);
        setEditing(false);
        
        // Clear success message after 3 seconds
        setTimeout(() => setCorrectionSaved(false), 3000);
      } else {
        setEditing(false);
      }
      
    } catch (error) {
      console.error('Error saving corrections:', error);
      alert('Failed to save corrections. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading analysis results...</p>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">No analysis results found</p>
          <Link
            href="/dashboard"
            className="mt-4 inline-block text-blue-600 hover:underline"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Dashboard
          </button>
          
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">Analysis Results</h1>
            {analysis.used_learning && (
              <div className="flex items-center gap-2 px-3 py-1 bg-purple-100 rounded-full">
                <Brain className="w-4 h-4 text-purple-600" />
                <span className="text-sm text-purple-700">AI Learning Used</span>
              </div>
            )}
          </div>
        </div>

        {/* Success Message */}
        {correctionSaved && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center">
            <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
            <p className="text-green-800">
              Corrections saved! The AI will learn from your feedback to improve future detections.
            </p>
          </div>
        )}

        {/* AI Learning Panel */}
        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Brain className="w-5 h-5 text-yellow-600" />
                <h3 className="font-semibold text-yellow-900">Help AI Learn</h3>
              </div>
              <p className="text-sm text-yellow-800">
                If any details are incorrect, you can correct them to help the AI learn and improve.
                {analysis.ai_confidence && (
                  <span className="ml-2">
                    Current confidence: {Math.round(analysis.ai_confidence * 100)}%
                  </span>
                )}
              </p>
            </div>
            
            {!editing ? (
              <button
                onClick={() => setEditing(true)}
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 flex items-center gap-2"
              >
                <Edit2 className="w-4 h-4" />
                Correct Details
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={saveCorrections}
                  disabled={saving}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={() => {
                    setEditing(false);
                    setCorrections({
                      brand: analysis.brand,
                      item_type: analysis.item_type,
                      size: analysis.size,
                      color: analysis.color,
                      ebay_title: analysis.ebay_title,
                      suggested_price: analysis.suggested_price
                    });
                  }}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Main Results */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Item Details */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Item Details</h2>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-600">Brand</label>
                {editing ? (
                  <input
                    type="text"
                    value={corrections.brand}
                    onChange={(e) => handleCorrection('brand', e.target.value)}
                    className="w-full mt-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="font-medium text-gray-900">{analysis.brand}</p>
                )}
              </div>
              
              <div>
                <label className="text-sm text-gray-600">Item Type</label>
                {editing ? (
                  <input
                    type="text"
                    value={corrections.item_type}
                    onChange={(e) => handleCorrection('item_type', e.target.value)}
                    className="w-full mt-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="font-medium text-gray-900">{analysis.item_type}</p>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600">Size</label>
                  {editing ? (
                    <input
                      type="text"
                      value={corrections.size}
                      onChange={(e) => handleCorrection('size', e.target.value)}
                      className="w-full mt-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="font-medium text-gray-900">{analysis.size}</p>
                  )}
                </div>
                
                <div>
                  <label className="text-sm text-gray-600">Colour</label>
                  {editing ? (
                    <input
                      type="text"
                      value={corrections.color}
                      onChange={(e) => handleCorrection('color', e.target.value)}
                      className="w-full mt-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="font-medium text-gray-900">{analysis.color}</p>
                  )}
                </div>
              </div>
              
              <div>
                <label className="text-sm text-gray-600">Condition Score</label>
                <div className="flex items-center gap-1 mt-1">
                  {[...Array(10)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < analysis.condition_score
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                  <span className="ml-2 text-sm text-gray-600">
                    {analysis.condition_score}/10
                  </span>
                </div>
              </div>
              
              <div>
                <label className="text-sm text-gray-600">SKU</label>
                <p className="font-medium text-gray-900 font-mono">{analysis.sku}</p>
              </div>
            </div>
          </div>

          {/* Pricing & Value */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Pricing & Value</h2>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-600">Suggested Price</label>
                {editing ? (
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-gray-500">£</span>
                    <input
                      type="number"
                      value={corrections.suggested_price}
                      onChange={(e) => handleCorrection('suggested_price', parseFloat(e.target.value))}
                      className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      step="0.01"
                    />
                  </div>
                ) : (
                  <p className="text-2xl font-bold text-green-600">
                    £{analysis.suggested_price?.toFixed(2)}
                  </p>
                )}
              </div>
              
              <div>
                <label className="text-sm text-gray-600">Estimated Value Range</label>
                <p className="font-medium text-gray-900">
                  £{analysis.estimated_value_min?.toFixed(2)} - £{analysis.estimated_value_max?.toFixed(2)}
                </p>
              </div>
              
              <div>
                <label className="text-sm text-gray-600">Category</label>
                <p className="font-medium text-gray-900">{analysis.category}</p>
              </div>
              
              <div>
                <label className="text-sm text-gray-600">Style</label>
                <p className="font-medium text-gray-900">{analysis.style}</p>
              </div>
              
              <div>
                <label className="text-sm text-gray-600">Gender</label>
                <p className="font-medium text-gray-900">{analysis.gender || analysis.department}</p>
              </div>
            </div>
          </div>
        </div>

        {/* eBay Title */}
        <div className="mt-6 bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">eBay Title</h2>
          {editing ? (
            <input
              type="text"
              value={corrections.ebay_title}
              onChange={(e) => handleCorrection('ebay_title', e.target.value)}
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 text-lg"
              maxLength="80"
            />
          ) : (
            <p className="text-lg font-medium text-gray-900">{analysis.ebay_title}</p>
          )}
          <p className="text-sm text-gray-500 mt-2">
            {(editing ? corrections.ebay_title : analysis.ebay_title).length}/80 characters
          </p>
        </div>

        {/* Description */}
        <div className="mt-6 bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Description</h2>
          <div className="prose max-w-none">
            <p className="whitespace-pre-wrap text-gray-700">{analysis.description}</p>
          </div>
        </div>

        {/* Keywords */}
        {analysis.keywords && analysis.keywords.length > 0 && (
          <div className="mt-6 bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Keywords</h2>
            <div className="flex flex-wrap gap-2">
              {analysis.keywords.map((keyword, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                >
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-8 flex gap-4">
          <Link
            href={`/dashboard/listing/${analysis.id}/ebay`}
            className="flex-1 py-3 px-6 bg-blue-600 text-white text-center font-semibold rounded-lg hover:bg-blue-700"
          >
            List on eBay UK
          </Link>
          <Link
            href={`/dashboard/listing/${analysis.id}/vinted`}
            className="flex-1 py-3 px-6 bg-purple-600 text-white text-center font-semibold rounded-lg hover:bg-purple-700"
          >
            Export for Vinted
          </Link>
          <button
            onClick={() => router.push('/dashboard/analyze-single')}
            className="py-3 px-6 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700"
          >
            Analyze Another
          </button>
        </div>

        {/* Credits Remaining */}
        <div className="mt-6 text-center text-sm text-gray-600">
          {analysis.credits_remaining !== undefined && (
            <p>
              You have {analysis.credits_remaining} credits remaining.
              <Link href="/dashboard/get-credits" className="ml-2 text-blue-600 hover:underline">
                Get more credits
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default ResultsPage;