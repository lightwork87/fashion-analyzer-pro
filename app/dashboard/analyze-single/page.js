'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { 
  Camera, 
  Upload, 
  X, 
  Loader2, 
  ArrowLeft, 
  Info,
  CheckCircle,
  AlertCircle,
  Image as ImageIcon,
  Plus,
  Sparkles,
  Home,
  CreditCard,
  Moon,
  Sun,
  ChevronRight,
  Zap,
  Target,
  TrendingUp,
  Package
} from 'lucide-react';

export default function AnalyzeSinglePage() {
  const { user } = useUser();
  const router = useRouter();
  const fileInputRef = useRef(null);
  
  const [images, setImages] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [credits, setCredits] = useState(100); // Mock credits

  // Load dark mode preference
  useState(() => {
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedDarkMode);
    if (savedDarkMode) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  }, []);

  const handleFiles = (files) => {
    const fileArray = Array.from(files);
    const validFiles = fileArray.filter(file => 
      file.type.startsWith('image/') && file.size <= 10 * 1024 * 1024
    );

    if (validFiles.length !== fileArray.length) {
      setError('Some files were skipped. Only images under 10MB are allowed.');
      setTimeout(() => setError(null), 5000);
    }

    const newImages = validFiles.slice(0, 24 - images.length).map(file => ({
      id: Date.now() + Math.random(),
      file: file,
      preview: URL.createObjectURL(file),
      name: file.name,
      size: file.size
    }));

    setImages(prev => [...prev, ...newImages]);
  };

  const handleFileSelect = (e) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  const removeImage = (id) => {
    const image = images.find(img => img.id === id);
    if (image?.preview) {
      URL.revokeObjectURL(image.preview);
    }
    setImages(images.filter(img => img.id !== id));
  };

  const reorderImages = (dragIndex, dropIndex) => {
    const draggedImage = images[dragIndex];
    const newImages = [...images];
    newImages.splice(dragIndex, 1);
    newImages.splice(dropIndex, 0, draggedImage);
    setImages(newImages);
  };

  const analyzeItem = async () => {
    if (!images.length) return;
    
    setIsAnalyzing(true);
    setError(null);
    setUploadProgress(0);
    
    try {
      // Upload images
      const uploadedUrls = [];
      
      for (let i = 0; i < images.length; i++) {
        setUploadProgress(Math.round((i / images.length) * 50));
        
        // Upload to storage
        const formData = new FormData();
        formData.append('file', images[i].file);
        
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });
        
        if (!uploadRes.ok) throw new Error('Upload failed');
        
        const { url } = await uploadRes.json();
        uploadedUrls.push(url);
      }
      
      setUploadProgress(75);
      
      // Call AI analysis
      const response = await fetch('/api/analyze-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          imageUrls: uploadedUrls,
          analysisType: 'single'
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Analysis failed');
      }
      
      if (data.success && data.analysis) {
        setUploadProgress(100);
        
        // Save to session storage
        sessionStorage.setItem('analysisResult', JSON.stringify(data.analysis));
        
        // Navigate to results
        router.push('/dashboard/results');
      }
    } catch (err) {
      setError(err.message || 'Failed to analyze item');
    } finally {
      setIsAnalyzing(false);
    }
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
                <h1 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-black'}`}>
                  Single Item Analysis
                </h1>
                <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Up to 24 photos
                </span>
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
          <span className={darkMode ? 'text-white' : 'text-black'}>Single Item Analysis</span>
        </nav>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Upload Area */}
          <div className="lg:col-span-2">
            <div className={`rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} p-6`}>
              <h2 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-black'}`}>
                Upload Photos
              </h2>

              {error && (
                <div className="mb-4 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                  </div>
                </div>
              )}

              {images.length === 0 ? (
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all ${
                    dragActive 
                      ? 'border-black dark:border-white bg-gray-50 dark:bg-gray-700' 
                      : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                  }`}
                >
                  <div className="mx-auto w-24 h-24 mb-4 relative">
                    <Camera className={`w-24 h-24 ${darkMode ? 'text-gray-600' : 'text-gray-300'}`} />
                    <Plus className="absolute bottom-0 right-0 w-8 h-8 bg-black text-white rounded-full p-1" />
                  </div>
                  
                  <h3 className={`text-lg font-medium mb-2 ${darkMode ? 'text-white' : 'text-black'}`}>
                    {dragActive ? 'Drop your images here' : 'Click or drag photos to upload'}
                  </h3>
                  
                  <p className={`text-sm mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    PNG, JPG, HEIC up to 10MB each • Maximum 24 photos
                  </p>
                  
                  <button className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition">
                    Select Photos
                  </button>
                </div>
              ) : (
                <>
                  {/* Image Grid */}
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 mb-6">
                    {images.map((image, index) => (
                      <div
                        key={image.id}
                        draggable
                        onDragStart={(e) => e.dataTransfer.setData('dragIndex', index)}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          const dragIndex = parseInt(e.dataTransfer.getData('dragIndex'));
                          reorderImages(dragIndex, index);
                        }}
                        className="relative group cursor-move"
                      >
                        <img
                          src={image.preview}
                          alt={image.name}
                          className="w-full aspect-square object-cover rounded-lg"
                        />
                        {index === 0 && (
                          <span className="absolute top-1 left-1 px-2 py-0.5 bg-black text-white text-xs rounded">
                            Main
                          </span>
                        )}
                        <button
                          onClick={() => removeImage(image.id)}
                          disabled={isAnalyzing}
                          className="absolute -top-2 -right-2 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition disabled:opacity-50"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    
                    {images.length < 24 && !isAnalyzing && (
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className={`aspect-square border-2 border-dashed rounded-lg flex items-center justify-center transition ${
                          darkMode 
                            ? 'border-gray-600 hover:border-gray-500 hover:bg-gray-700' 
                            : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                        }`}
                      >
                        <Plus className="w-6 h-6 text-gray-400" />
                      </button>
                    )}
                  </div>

                  {/* Progress Bar */}
                  {isAnalyzing && (
                    <div className="mb-6">
                      <div className="flex justify-between text-sm mb-2">
                        <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                          {uploadProgress < 50 ? 'Uploading photos...' : uploadProgress < 100 ? 'Analyzing with AI...' : 'Complete!'}
                        </span>
                        <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                          {uploadProgress}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                        <div 
                          className="bg-black dark:bg-white h-2 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between">
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {images.length} photo{images.length !== 1 ? 's' : ''} selected
                    </p>
                    
                    <div className="flex gap-3">
                      <button
                        onClick={() => setImages([])}
                        disabled={isAnalyzing}
                        className={`px-4 py-2 rounded-lg border transition disabled:opacity-50 ${
                          darkMode 
                            ? 'border-gray-600 hover:bg-gray-700' 
                            : 'border-gray-300 hover:bg-gray-100'
                        }`}
                      >
                        Clear All
                      </button>
                      
                      <button
                        onClick={analyzeItem}
                        disabled={isAnalyzing || images.length === 0}
                        className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition"
                      >
                        {isAnalyzing ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Analyzing...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4" />
                            Analyze with AI
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </>
              )}
              
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          </div>

          {/* Right Column - Tips & Info */}
          <div className="space-y-6">
            {/* AI Features */}
            <div className={`rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} p-6`}>
              <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-black'}`}>
                <Zap className="w-5 h-5" />
                AI Analysis Features
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Target className="w-5 h-5 text-green-500 mt-0.5" />
                  <div>
                    <p className={`font-medium ${darkMode ? 'text-white' : 'text-black'}`}>
                      Brand Detection
                    </p>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Identifies brands from logos, labels, and style
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Package className="w-5 h-5 text-blue-500 mt-0.5" />
                  <div>
                    <p className={`font-medium ${darkMode ? 'text-white' : 'text-black'}`}>
                      Size & Measurements
                    </p>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Extracts UK sizes from labels and tags
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <TrendingUp className="w-5 h-5 text-purple-500 mt-0.5" />
                  <div>
                    <p className={`font-medium ${darkMode ? 'text-white' : 'text-black'}`}>
                      UK Price Estimation
                    </p>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Based on eBay UK sold listings (90 days)
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Photo Tips */}
            <div className={`rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} p-6`}>
              <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-black'}`}>
                <Camera className="w-5 h-5" />
                Photo Tips
              </h3>
              
              <ul className={`space-y-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                  <span>Include clear photos of brand labels and tags</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                  <span>Show size labels and care instructions</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                  <span>Capture any flaws or wear from multiple angles</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                  <span>Use good lighting and neutral backgrounds</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                  <span>First photo will be your main listing image</span>
                </li>
              </ul>
            </div>

            {/* Credit Usage */}
            <div className={`rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} p-6`}>
              <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-black'}`}>
                <Info className="w-5 h-5" />
                Credit Usage
              </h3>
              
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-3`}>
                Single item analysis uses <span className="font-semibold">1 credit</span> regardless of photo count.
              </p>
              
              <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-black'}`}>
                  Your balance: {credits} credits
                </p>
                <Link 
                  href="/dashboard/credits"
                  className="text-sm text-blue-500 hover:text-blue-600 mt-1 inline-block"
                >
                  Get more credits →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}