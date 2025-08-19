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
  Package,
  Grid,
  Folder,
  FolderOpen,
  Check,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Edit2,
  Trash2,
  Copy,
  Images
} from 'lucide-react';

export default function AnalyzeBatchPage() {
  const { user } = useUser();
  const router = useRouter();
  const fileInputRef = useRef(null);
  
  const [items, setItems] = useState([]);
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [credits, setCredits] = useState(100); // Mock credits
  const [expandedItems, setExpandedItems] = useState(new Set());
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [uploadMode, setUploadMode] = useState('sequential'); // sequential or folder

  // Load dark mode preference
  useState(() => {
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedDarkMode);
    if (savedDarkMode) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  const createNewItem = (index) => ({
    id: `item-${Date.now()}-${index}`,
    name: `Item ${index + 1}`,
    images: [],
    status: 'pending', // pending, analyzing, complete, error
    analysis: null
  });

  // Initialize with first item
  useState(() => {
    setItems([createNewItem(0)]);
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

    if (uploadMode === 'sequential') {
      // Add to current item
      addImagesToItem(currentItemIndex, validFiles);
    } else {
      // Folder mode - try to group by folder structure
      // For now, just add all to current item
      addImagesToItem(currentItemIndex, validFiles);
    }
  };

  const addImagesToItem = (itemIndex, files) => {
    const item = items[itemIndex];
    const remainingSlots = 24 - item.images.length;
    const filesToAdd = files.slice(0, remainingSlots);

    const newImages = filesToAdd.map(file => ({
      id: Date.now() + Math.random(),
      file: file,
      preview: URL.createObjectURL(file),
      name: file.name,
      size: file.size
    }));

    const updatedItems = [...items];
    updatedItems[itemIndex] = {
      ...item,
      images: [...item.images, ...newImages]
    };

    setItems(updatedItems);

    // If current item is full and we have more files, create new item
    if (item.images.length + newImages.length >= 24 && files.length > filesToAdd.length) {
      if (items.length < 25) {
        const newItem = createNewItem(items.length);
        setItems([...updatedItems, newItem]);
        setCurrentItemIndex(items.length);
        
        // Add remaining files to new item
        const remainingFiles = files.slice(filesToAdd.length);
        setTimeout(() => addImagesToItem(items.length, remainingFiles), 100);
      }
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  const removeImage = (itemIndex, imageId) => {
    const item = items[itemIndex];
    const image = item.images.find(img => img.id === imageId);
    if (image?.preview) {
      URL.revokeObjectURL(image.preview);
    }

    const updatedItems = [...items];
    updatedItems[itemIndex] = {
      ...item,
      images: item.images.filter(img => img.id !== imageId)
    };
    setItems(updatedItems);
  };

  const removeItem = (itemIndex) => {
    if (items.length === 1) {
      // Reset the only item instead of removing
      const item = items[0];
      item.images.forEach(img => {
        if (img.preview) URL.revokeObjectURL(img.preview);
      });
      setItems([createNewItem(0)]);
      return;
    }

    const item = items[itemIndex];
    item.images.forEach(img => {
      if (img.preview) URL.revokeObjectURL(img.preview);
    });

    const updatedItems = items.filter((_, index) => index !== itemIndex);
    setItems(updatedItems);

    // Update current index if needed
    if (currentItemIndex >= updatedItems.length) {
      setCurrentItemIndex(Math.max(0, updatedItems.length - 1));
    }
  };

  const addNewItem = () => {
    if (items.length < 25) {
      const newItem = createNewItem(items.length);
      setItems([...items, newItem]);
      setCurrentItemIndex(items.length);
      setExpandedItems(new Set([newItem.id]));
    }
  };

  const toggleItemExpanded = (itemId) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  const toggleItemSelected = (itemId) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  };

  const selectAll = () => {
    if (selectedItems.size === items.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(items.map(item => item.id)));
    }
  };

  const analyzeBatch = async () => {
    const itemsToAnalyze = selectedItems.size > 0 
      ? items.filter(item => selectedItems.has(item.id) && item.images.length > 0)
      : items.filter(item => item.images.length > 0);

    if (itemsToAnalyze.length === 0) {
      setError('Please add photos to at least one item');
      return;
    }
    
    setIsAnalyzing(true);
    setError(null);
    setUploadProgress(0);
    
    try {
      const totalImages = itemsToAnalyze.reduce((sum, item) => sum + item.images.length, 0);
      let processedImages = 0;

      // Process each item
      for (let i = 0; i < itemsToAnalyze.length; i++) {
        const item = itemsToAnalyze[i];
        
        // Update item status
        const updatedItems = [...items];
        const itemIndex = items.findIndex(it => it.id === item.id);
        updatedItems[itemIndex] = { ...item, status: 'analyzing' };
        setItems(updatedItems);

        // Upload images for this item
        const uploadedUrls = [];
        
        for (let j = 0; j < item.images.length; j++) {
          processedImages++;
          setUploadProgress(Math.round((processedImages / totalImages) * 50));
          
          const formData = new FormData();
          formData.append('file', item.images[j].file);
          
          const uploadRes = await fetch('/api/upload', {
            method: 'POST',
            body: formData
          });
          
          if (!uploadRes.ok) throw new Error('Upload failed');
          
          const { url } = await uploadRes.json();
          uploadedUrls.push(url);
        }
        
        // Analyze this item
        setUploadProgress(50 + Math.round((i / itemsToAnalyze.length) * 50));
        
        const response = await fetch('/api/analyze-ai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            imageUrls: uploadedUrls,
            analysisType: 'batch',
            itemName: item.name,
            batchId: Date.now().toString()
          })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Analysis failed');
        }
        
        // Update item with analysis results
        updatedItems[itemIndex] = { 
          ...item, 
          status: 'complete',
          analysis: data.analysis 
        };
        setItems(updatedItems);
      }
      
      setUploadProgress(100);
      
      // Navigate to batch results
      sessionStorage.setItem('batchResults', JSON.stringify({
        items: itemsToAnalyze.map(item => {
          const fullItem = items.find(it => it.id === item.id);
          return {
            id: fullItem.id,
            name: fullItem.name,
            analysis: fullItem.analysis,
            imageCount: fullItem.images.length
          };
        }),
        totalCreditsUsed: itemsToAnalyze.length
      }));
      
      router.push('/dashboard/batch-results');
      
    } catch (err) {
      setError(err.message || 'Failed to analyze items');
      
      // Reset item statuses
      const updatedItems = items.map(item => ({
        ...item,
        status: item.status === 'analyzing' ? 'error' : item.status
      }));
      setItems(updatedItems);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getItemsWithPhotos = () => items.filter(item => item.images.length > 0).length;
  const getTotalPhotos = () => items.reduce((sum, item) => sum + item.images.length, 0);

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
                  Batch Analysis
                </h1>
                <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Up to 25 items • 24 photos each
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
          <span className={darkMode ? 'text-white' : 'text-black'}>Batch Analysis</span>
        </nav>

        {/* Stats Bar */}
        <div className={`rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} p-4 mb-6`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Items with photos</p>
                <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-black'}`}>
                  {getItemsWithPhotos()} / 25
                </p>
              </div>
              <div className="h-12 w-px bg-gray-300 dark:bg-gray-700" />
              <div>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total photos</p>
                <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-black'}`}>
                  {getTotalPhotos()}
                </p>
              </div>
              <div className="h-12 w-px bg-gray-300 dark:bg-gray-700" />
              <div>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Credits needed</p>
                <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-black'}`}>
                  {getItemsWithPhotos()}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={selectAll}
                className={`px-4 py-2 rounded-lg border transition ${
                  darkMode 
                    ? 'border-gray-600 hover:bg-gray-700' 
                    : 'border-gray-300 hover:bg-gray-100'
                }`}
              >
                {selectedItems.size === items.length ? 'Deselect All' : 'Select All'}
              </button>
              
              <button
                onClick={analyzeBatch}
                disabled={isAnalyzing || getItemsWithPhotos() === 0}
                className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Analyzing {selectedItems.size > 0 ? selectedItems.size : getItemsWithPhotos()} items...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Analyze {selectedItems.size > 0 ? `${selectedItems.size} Selected` : 'All'} Items
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          {isAnalyzing && (
            <div className="mt-4">
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-black dark:bg-white h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Items List */}
          <div className="lg:col-span-2">
            {/* Upload Mode Toggle */}
            <div className={`rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} p-4 mb-4`}>
              <div className="flex items-center justify-between">
                <label className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-black'}`}>
                  Upload Mode
                </label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setUploadMode('sequential')}
                    className={`px-3 py-1 rounded text-sm transition ${
                      uploadMode === 'sequential'
                        ? 'bg-black text-white'
                        : `${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'}`
                    }`}
                  >
                    Sequential
                  </button>
                  <button
                    onClick={() => setUploadMode('folder')}
                    className={`px-3 py-1 rounded text-sm transition ${
                      uploadMode === 'folder'
                        ? 'bg-black text-white'
                        : `${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'}`
                    }`}
                  >
                    By Folder
                  </button>
                </div>
              </div>
              <p className={`text-xs mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {uploadMode === 'sequential' 
                  ? 'Add photos to current item, auto-create new items when full'
                  : 'Group photos by folder structure (coming soon)'
                }
              </p>
            </div>

            {/* Items */}
            <div className="space-y-4">
              {items.map((item, index) => (
                <div
                  key={item.id}
                  className={`rounded-lg border transition ${
                    darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                  } ${currentItemIndex === index ? 'ring-2 ring-black dark:ring-white' : ''}`}
                >
                  {/* Item Header */}
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={selectedItems.has(item.id)}
                          onChange={() => toggleItemSelected(item.id)}
                          className="w-4 h-4"
                        />
                        
                        <button
                          onClick={() => toggleItemExpanded(item.id)}
                          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                        >
                          {expandedItems.has(item.id) ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </button>
                        
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => {
                            const updatedItems = [...items];
                            updatedItems[index] = { ...item, name: e.target.value };
                            setItems(updatedItems);
                          }}
                          className={`font-medium px-2 py-1 rounded border ${
                            darkMode 
                              ? 'bg-gray-700 border-gray-600 text-white' 
                              : 'bg-gray-50 border-gray-300 text-black'
                          }`}
                        />
                        
                        <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {item.images.length} photos
                        </span>
                        
                        {item.status === 'analyzing' && (
                          <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                        )}
                        {item.status === 'complete' && (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        )}
                        {item.status === 'error' && (
                          <AlertTriangle className="w-4 h-4 text-red-500" />
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setCurrentItemIndex(index)}
                          className={`px-3 py-1 rounded text-sm transition ${
                            currentItemIndex === index
                              ? 'bg-black text-white'
                              : `${darkMode ? 'bg-gray-700' : 'bg-gray-200'} hover:bg-gray-300 dark:hover:bg-gray-600`
                          }`}
                        >
                          {currentItemIndex === index ? 'Current' : 'Select'}
                        </button>
                        
                        <button
                          onClick={() => removeItem(index)}
                          className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Expanded Content */}
                  {expandedItems.has(item.id) && (
                    <div className="px-4 pb-4">
                      {item.images.length === 0 ? (
                        <div
                          onDragEnter={handleDrag}
                          onDragLeave={handleDrag}
                          onDragOver={handleDrag}
                          onDrop={(e) => {
                            handleDrop(e);
                            setCurrentItemIndex(index);
                          }}
                          onClick={() => {
                            setCurrentItemIndex(index);
                            fileInputRef.current?.click();
                          }}
                          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition ${
                            currentItemIndex === index && dragActive
                              ? 'border-black dark:border-white bg-gray-50 dark:bg-gray-700'
                              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                          }`}
                        >
                          <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            Click or drag photos here
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-6 gap-2">
                          {item.images.map((image) => (
                            <div key={image.id} className="relative group">
                              <img
                                src={image.preview}
                                alt={image.name}
                                className="w-full aspect-square object-cover rounded"
                              />
                              <button
                                onClick={() => removeImage(index, image.id)}
                                disabled={isAnalyzing}
                                className="absolute -top-1 -right-1 p-0.5 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                          
                          {item.images.length < 24 && (
                            <button
                              onClick={() => {
                                setCurrentItemIndex(index);
                                fileInputRef.current?.click();
                              }}
                              className={`aspect-square border-2 border-dashed rounded flex items-center justify-center ${
                                darkMode 
                                  ? 'border-gray-600 hover:border-gray-500' 
                                  : 'border-gray-300 hover:border-gray-400'
                              }`}
                            >
                              <Plus className="w-5 h-5 text-gray-400" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
              
              {/* Add New Item Button */}
              {items.length < 25 && (
                <button
                  onClick={addNewItem}
                  className={`w-full p-4 border-2 border-dashed rounded-lg flex items-center justify-center gap-2 transition ${
                    darkMode 
                      ? 'border-gray-600 hover:border-gray-500 hover:bg-gray-800' 
                      : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                  }`}
                >
                  <Plus className="w-5 h-5" />
                  <span>Add New Item</span>
                </button>
              )}
            </div>
          </div>

          {/* Right Column - Tips & Info */}
          <div className="space-y-6">
            {/* Quick Tips */}
            <div className={`rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} p-6`}>
              <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-black'}`}>
                <Zap className="w-5 h-5" />
                Batch Processing Tips
              </h3>
              
              <ul className={`space-y-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                  <span>Group similar items together for better AI recognition</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                  <span>Name items clearly (e.g., "Blue Nike Hoodie")</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                  <span>First photo becomes the main listing image</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                  <span>You can analyze selected items only</span>
                </li>
              </ul>
            </div>

            {/* Credit Calculator */}
            <div className={`rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} p-6`}>
              <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-black'}`}>
                <CreditCard className="w-5 h-5" />
                Credit Calculator
              </h3>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Items to analyze
                  </span>
                  <span className={`font-medium ${darkMode ? 'text-white' : 'text-black'}`}>
                    {selectedItems.size > 0 ? selectedItems.size : getItemsWithPhotos()}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Credits per item
                  </span>
                  <span className={`font-medium ${darkMode ? 'text-white' : 'text-black'}`}>
                    1
                  </span>
                </div>
                
                <div className="h-px bg-gray-300 dark:bg-gray-700" />
                
                <div className="flex justify-between">
                  <span className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-black'}`}>
                    Total credits needed
                  </span>
                  <span className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-black'}`}>
                    {selectedItems.size > 0 ? selectedItems.size : getItemsWithPhotos()}
                  </span>
                </div>
                
                <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'} mt-4`}>
                  <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Your balance: <span className="font-medium">{credits} credits</span>
                  </p>
                  {(selectedItems.size > 0 ? selectedItems.size : getItemsWithPhotos()) > credits && (
                    <p className="text-sm text-red-500 mt-1">
                      Not enough credits. <Link href="/dashboard/credits" className="underline">Get more →</Link>
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Keyboard Shortcuts */}
            <div className={`rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} p-6`}>
              <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-black'}`}>
                <Info className="w-5 h-5" />
                Shortcuts
              </h3>
              
              <div className={`space-y-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                <div className="flex justify-between">
                  <span>Select all</span>
                  <kbd className={`px-2 py-1 rounded text-xs ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                    Cmd + A
                  </kbd>
                </div>
                <div className="flex justify-between">
                  <span>Delete item</span>
                  <kbd className={`px-2 py-1 rounded text-xs ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                    Delete
                  </kbd>
                </div>
                <div className="flex justify-between">
                  <span>Next item</span>
                  <kbd className={`px-2 py-1 rounded text-xs ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                    Tab
                  </kbd>
                </div>
              </div>
            </div>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </main>
    </div>
  );
}