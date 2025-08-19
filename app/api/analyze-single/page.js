'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Home,
  Upload,
  Camera,
  X,
  ChevronRight,
  Loader2,
  AlertCircle,
  CheckCircle,
  Info,
  Image as ImageIcon,
  Zap,
  Moon,
  Sun,
  CreditCard,
  Copy,
  Download,
  Eye,
  ShoppingBag,
  Tag,
  PoundSterling,
  Package,
  BarChart3,
  FileText,
  Sparkles
} from 'lucide-react';

export default function AnalyzeSinglePage() {
  const { user } = useUser();
  const router = useRouter();
  
  // ✅ FIXED: Initialize without localStorage
  const [darkMode, setDarkMode] = useState(false);
  const [credits, setCredits] = useState(0);
  const [images, setImages] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [error, setError] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);

  // ✅ FIXED: Access localStorage only in useEffect
  useEffect(() => {
    // Check for dark mode preference
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedDarkMode);
    if (savedDarkMode) {
      document.documentElement.classList.add('dark');
    }

    // Fetch user credits
    fetchCredits();
  }, []);

  const fetchCredits = async () => {
    try {
      const response = await fetch('/api/user/credits');
      if (response.ok) {
        const data = await response.json();
        setCredits(data.available || 0);
      }
    } catch (error) {
      console.error('Error fetching credits:', error);
    }
  };

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', String(newDarkMode));
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFiles = (fileList) => {
    const validFiles = [];
    const maxSize = 10 * 1024 * 1024; // 10MB
    
    Array.from(fileList).forEach(file => {
      if (!file.type.startsWith('image/')) {
        setError(`${file.name} is not an image file`);
        return;
      }
      
      if (file.size > maxSize) {
        setError(`${file.name} is too large (max 10MB)`);
        return;
      }
      
      validFiles.push(file);
    });

    if (validFiles.length > 0) {
      const newImages = validFiles.map(file => ({
        id: Math.random().toString(36).substr(2, 9),
        file,
        preview: URL.createObjectURL(file),
        name: file.name,
        size: file.size
      }));
      
      setImages(prev => [...prev, ...newImages].slice(0, 24)); // Max 24 images
      setError(null);
    }
  };

  const removeImage = (id) => {
    setImages(prev => {
      const image = prev.find(img => img.id === id);
      if (image) {
        URL.revokeObjectURL(image.preview);
      }
      return prev.filter(img => img.id !== id);
    });
  };

  const handleAnalyze = async () => {
    if (images.length === 0) {
      setError('Please upload at least one image');
      return;
    }

    if (credits < 1) {
      setError('Insufficient credits. Please purchase more credits to continue.');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      images.forEach(img => {
        formData.append('images', img.file);
      });

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const response = await fetch('/api/analyze-single', {
        method: 'POST',
        body: formData
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      const result = await response.json();
      setAnalysisResult(result);
      
      // Refresh credits after analysis
      fetchCredits();
      
    } catch (error) {
      console.error('Analysis error:', error);
      setError('Failed to analyze images. Please try again.');
    } finally {
      setIsAnalyzing(false);
      setUploadProgress(0);
    }
  };

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  const downloadResults = () => {
    if (!analysisResult) return;
    
    const data = {
      ebayTitle: analysisResult.ebayTitle,
      vintedTitle: analysisResult.vintedTitle,
      description: analysisResult.description,
      suggestedPrice: analysisResult.suggestedPrice,
      brand: analysisResult.brand,
      size: analysisResult.size,
      color: analysisResult.color,
      condition: analysisResult.condition,
      material: analysisResult.material,
      category: analysisResult.category,
      keywords: analysisResult.keywords
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `listing-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

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
                <Camera className="w-5 h-5 text-blue-600" />
                <h1 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-black'}`}>
                  Single Item Analysis
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={toggleDarkMode}
                className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
              >
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>

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

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-sm mb-8">
          <Link href="/dashboard" className={darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'}>
            Dashboard
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span className={darkMode ? 'text-white' : 'text-black'}>Single Item Analysis</span>
        </nav>

        {/* Info Banner */}
        <div className={`rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-blue-50 border-blue-200'} p-4 mb-8`}>
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className={`font-semibold mb-1 ${darkMode ? 'text-white' : 'text-blue-900'}`}>
                AI-Powered Listing Creation
              </h3>
              <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-blue-800'}`}>
                Upload up to 24 photos of a single item. Our AI will analyze them to create optimized titles, 
                descriptions, and pricing suggestions for eBay UK and Vinted.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upload Section */}
          <div>
            <div className={`rounded-lg border-2 border-dashed ${
              dragActive 
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                : darkMode 
                  ? 'border-gray-700 bg-gray-800' 
                  : 'border-gray-300 bg-white'
            } transition-all`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <div className="p-8">
                <div className="text-center">
                  <Upload className={`mx-auto w-12 h-12 ${darkMode ? 'text-gray-400' : 'text-gray-400'}`} />
                  <h3 className={`mt-4 text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Drop images here or click to upload
                  </h3>
                  <p className={`mt-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Support for JPG, PNG, WEBP (max 10MB each, up to 24 images)
                  </p>
                  
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => handleFiles(e.target.files)}
                    className="hidden"
                    id="file-upload"
                  />
                  
                  <label
                    htmlFor="file-upload"
                    className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Choose Files
                  </label>
                </div>

                {/* Image Preview Grid */}
                {images.length > 0 && (
                  <div className="mt-6 grid grid-cols-3 gap-2">
                    {images.map(image => (
                      <div key={image.id} className="relative group">
                        <img
                          src={image.preview}
                          alt={image.name}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                        <button
                          onClick={() => removeImage(image.id)}
                          className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Upload Progress */}
                {isAnalyzing && uploadProgress > 0 && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span>Uploading...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Error Message */}
                {error && (
                  <div className="mt-4 p-3 bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                    <span className="text-sm text-red-800 dark:text-red-200">{error}</span>
                  </div>
                )}

                {/* Analyze Button */}
                <button
                  onClick={handleAnalyze}
                  disabled={images.length === 0 || isAnalyzing}
                  className={`mt-6 w-full px-4 py-3 rounded-lg font-medium transition flex items-center justify-center gap-2 ${
                    images.length === 0 || isAnalyzing
                      ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                      : 'bg-black dark:bg-white text-white dark:text-black hover:opacity-80'
                  }`}
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Analyzing {images.length} {images.length === 1 ? 'image' : 'images'}...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Analyze {images.length > 0 && `${images.length} ${images.length === 1 ? 'Image' : 'Images'}`}
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Tips */}
            <div className={`mt-6 p-4 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
              <h4 className={`font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Photography Tips
              </h4>
              <ul className={`space-y-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                  <span>Use natural lighting or bright, even light</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                  <span>Include photos of labels, tags, and brand marks</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                  <span>Show any flaws or wear clearly</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                  <span>Multiple angles improve AI accuracy</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Results Section */}
          <div>
            {analysisResult ? (
              <div className={`space-y-6`}>
                {/* eBay Title */}
                <div className={`p-6 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className={`font-semibold flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      <ShoppingBag className="w-5 h-5" />
                      eBay UK Title
                    </h3>
                    <button
                      onClick={() => copyToClipboard(analysisResult.ebayTitle, 'ebay')}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                  <p className={`text-lg ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                    {analysisResult.ebayTitle}
                  </p>
                  <p className={`mt-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {analysisResult.ebayTitle.length}/80 characters
                  </p>
                </div>

                {/* Vinted Title */}
                <div className={`p-6 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className={`font-semibold flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      <Tag className="w-5 h-5" />
                      Vinted Title
                    </h3>
                    <button
                      onClick={() => copyToClipboard(analysisResult.vintedTitle, 'vinted')}
                      className="text-purple-600 hover:text-purple-700"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                  <p className={`text-lg ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                    {analysisResult.vintedTitle}
                  </p>
                </div>

                {/* Price Suggestion */}
                <div className={`p-6 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                  <h3 className={`font-semibold mb-4 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    <PoundSterling className="w-5 h-5" />
                    Suggested Pricing
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>eBay UK</p>
                      <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        £{analysisResult.suggestedPrice}
                      </p>
                    </div>
                    <div>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Vinted</p>
                      <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        £{(analysisResult.suggestedPrice * 0.9).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Item Details */}
                <div className={`p-6 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                  <h3 className={`font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Item Details
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Brand</p>
                      <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {analysisResult.brand || 'Unbranded'}
                      </p>
                    </div>
                    <div>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Size</p>
                      <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {analysisResult.size || 'One Size'}
                      </p>
                    </div>
                    <div>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Color</p>
                      <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {analysisResult.color || 'Multicolor'}
                      </p>
                    </div>
                    <div>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Condition</p>
                      <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {analysisResult.condition || 'Used - Good'}
                      </p>
                    </div>
                    <div>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Material</p>
                      <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {analysisResult.material || 'Not specified'}
                      </p>
                    </div>
                    <div>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Category</p>
                      <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {analysisResult.category || 'Fashion'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className={`p-6 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      Description
                    </h3>
                    <button
                      onClick={() => copyToClipboard(analysisResult.description, 'description')}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                  <p className={`whitespace-pre-wrap ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {analysisResult.description}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4">
                  <button
                    onClick={downloadResults}
                    className={`flex-1 px-4 py-3 rounded-lg border font-medium transition flex items-center justify-center gap-2 ${
                      darkMode 
                        ? 'border-gray-700 hover:bg-gray-800' 
                        : 'border-gray-300 hover:bg-gray-100'
                    }`}
                  >
                    <Download className="w-4 h-4" />
                    Download Results
                  </button>
                  
                  <button
                    onClick={() => {
                      setAnalysisResult(null);
                      setImages([]);
                    }}
                    className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition flex items-center justify-center gap-2"
                  >
                    <Camera className="w-4 h-4" />
                    Analyze New Item
                  </button>
                </div>
              </div>
            ) : (
              // Placeholder when no results
              <div className={`h-full flex items-center justify-center rounded-lg border-2 border-dashed ${
                darkMode ? 'border-gray-700' : 'border-gray-300'
              }`}>
                <div className="text-center p-8">
                  <BarChart3 className={`mx-auto w-12 h-12 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                  <h3 className={`mt-4 text-lg font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Analysis Results
                  </h3>
                  <p className={`mt-2 text-sm ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                    Upload images and click analyze to see AI-generated listing details here
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}