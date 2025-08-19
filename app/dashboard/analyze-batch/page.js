'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Home,
  Upload,
  Images,
  X,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Loader2,
  AlertCircle,
  CheckCircle,
  Info,
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
  Sparkles,
  Plus,
  Trash2,
  FolderOpen,
  Grid,
  List,
  Filter,
  Search,
  Calendar,
  Clock
} from 'lucide-react';

export default function AnalyzeBatchPage() {
  const { user } = useUser();
  const router = useRouter();
  
  // ✅ FIXED: Initialize without localStorage
  const [darkMode, setDarkMode] = useState(false);
  const [credits, setCredits] = useState(0);
  const [items, setItems] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentAnalyzing, setCurrentAnalyzing] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [expandedItems, setExpandedItems] = useState(new Set());
  const [viewMode, setViewMode] = useState('grid'); // grid or list
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0 });

  // ✅ FIXED: Access localStorage only in useEffect
  useEffect(() => {
    // Check for dark mode preference
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedDarkMode);
    if (savedDarkMode) {
      document.documentElement.classList.add('dark');
    }

    // Check for saved view mode
    const savedViewMode = localStorage.getItem('batchViewMode') || 'grid';
    setViewMode(savedViewMode);

    // Fetch user credits
    fetchCredits();
    
    // Load any saved batch data
    loadSavedBatch();
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

  const loadSavedBatch = () => {
    try {
      const savedBatch = localStorage.getItem('batchAnalysis');
      if (savedBatch) {
        const parsed = JSON.parse(savedBatch);
        if (parsed.items && Array.isArray(parsed.items)) {
          setItems(parsed.items);
        }
      }
    } catch (error) {
      console.error('Error loading saved batch:', error);
    }
  };

  const saveBatch = (itemsToSave) => {
    try {
      localStorage.setItem('batchAnalysis', JSON.stringify({
        items: itemsToSave,
        savedAt: new Date().toISOString()
      }));
    } catch (error) {
      console.error('Error saving batch:', error);
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

  const toggleViewMode = () => {
    const newMode = viewMode === 'grid' ? 'list' : 'grid';
    setViewMode(newMode);
    localStorage.setItem('batchViewMode', newMode);
  };

  const addNewItem = () => {
    if (items.length >= 25) {
      setError('Maximum 25 items per batch');
      return;
    }

    const newItem = {
      id: Math.random().toString(36).substr(2, 9),
      name: `Item ${items.length + 1}`,
      images: [],
      status: 'pending',
      result: null,
      createdAt: new Date().toISOString()
    };

    const updatedItems = [...items, newItem];
    setItems(updatedItems);
    saveBatch(updatedItems);
    setError(null);
  };

  const removeItem = (itemId) => {
    const updatedItems = items.filter(item => item.id !== itemId);
    setItems(updatedItems);
    saveBatch(updatedItems);
    
    // Remove from expanded and selected sets
    const newExpanded = new Set(expandedItems);
    newExpanded.delete(itemId);
    setExpandedItems(newExpanded);
    
    const newSelected = new Set(selectedItems);
    newSelected.delete(itemId);
    setSelectedItems(newSelected);
  };

  const handleImageUpload = (itemId, files) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    const validFiles = [];
    const maxSize = 10 * 1024 * 1024; // 10MB

    Array.from(files).forEach(file => {
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

      const updatedItems = items.map(i => {
        if (i.id === itemId) {
          return {
            ...i,
            images: [...(i.images || []), ...newImages].slice(0, 24) // Max 24 images per item
          };
        }
        return i;
      });

      setItems(updatedItems);
      saveBatch(updatedItems);
      setError(null);
    }
  };

  const removeImage = (itemId, imageId) => {
    const updatedItems = items.map(item => {
      if (item.id === itemId) {
        const image = item.images.find(img => img.id === imageId);
        if (image && image.preview) {
          URL.revokeObjectURL(image.preview);
        }
        return {
          ...item,
          images: item.images.filter(img => img.id !== imageId)
        };
      }
      return item;
    });

    setItems(updatedItems);
    saveBatch(updatedItems);
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
      setSelectedItems(new Set(items.map(i => i.id)));
    }
  };

  const analyzeItem = async (item) => {
    if (!item.images || item.images.length === 0) {
      return { error: 'No images uploaded' };
    }

    try {
      const formData = new FormData();
      item.images.forEach(img => {
        formData.append('images', img.file);
      });

      const response = await fetch('/api/analyze-single', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      const result = await response.json();
      return { success: true, result };
      
    } catch (error) {
      console.error('Analysis error:', error);
      return { error: error.message };
    }
  };

  const analyzeBatch = async () => {
    const itemsToAnalyze = selectedItems.size > 0 
      ? items.filter(i => selectedItems.has(i.id))
      : items.filter(i => i.images && i.images.length > 0);

    if (itemsToAnalyze.length === 0) {
      setError('No items with images to analyze');
      return;
    }

    const requiredCredits = itemsToAnalyze.length;
    if (credits < requiredCredits) {
      setError(`Insufficient credits. You need ${requiredCredits} credits but only have ${credits}.`);
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setBatchProgress({ current: 0, total: itemsToAnalyze.length });

    const updatedItems = [...items];

    for (let i = 0; i < itemsToAnalyze.length; i++) {
      const item = itemsToAnalyze[i];
      setCurrentAnalyzing(item.id);
      setBatchProgress({ current: i + 1, total: itemsToAnalyze.length });

      // Update item status to analyzing
      const itemIndex = updatedItems.findIndex(it => it.id === item.id);
      updatedItems[itemIndex] = { ...updatedItems[itemIndex], status: 'analyzing' };
      setItems([...updatedItems]);

      const result = await analyzeItem(item);

      if (result.success) {
        updatedItems[itemIndex] = {
          ...updatedItems[itemIndex],
          status: 'completed',
          result: result.result,
          analyzedAt: new Date().toISOString()
        };
      } else {
        updatedItems[itemIndex] = {
          ...updatedItems[itemIndex],
          status: 'error',
          error: result.error
        };
      }

      setItems([...updatedItems]);
      saveBatch(updatedItems);
    }

    setIsAnalyzing(false);
    setCurrentAnalyzing(null);
    setBatchProgress({ current: 0, total: 0 });
    setSuccess(`Successfully analyzed ${itemsToAnalyze.length} items`);
    
    // Refresh credits
    fetchCredits();
    
    // Clear selection
    setSelectedItems(new Set());
  };

  const exportResults = () => {
    const completedItems = items.filter(i => i.status === 'completed' && i.result);
    
    if (completedItems.length === 0) {
      setError('No completed analyses to export');
      return;
    }

    const exportData = completedItems.map(item => ({
      itemName: item.name,
      ebayTitle: item.result.ebayTitle,
      vintedTitle: item.result.vintedTitle,
      description: item.result.description,
      suggestedPrice: item.result.suggestedPrice,
      brand: item.result.brand,
      size: item.result.size,
      color: item.result.color,
      condition: item.result.condition,
      material: item.result.material,
      category: item.result.category,
      keywords: item.result.keywords,
      analyzedAt: item.analyzedAt
    }));

    const csv = [
      Object.keys(exportData[0]).join(','),
      ...exportData.map(item => Object.values(item).map(v => `"${v || ''}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `batch-analysis-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    setSuccess('Results exported successfully');
  };

  const clearBatch = () => {
    if (confirm('Are you sure you want to clear all items? This cannot be undone.')) {
      // Clean up image URLs
      items.forEach(item => {
        if (item.images) {
          item.images.forEach(img => {
            if (img.preview) {
              URL.revokeObjectURL(img.preview);
            }
          });
        }
      });
      
      setItems([]);
      setSelectedItems(new Set());
      setExpandedItems(new Set());
      localStorage.removeItem('batchAnalysis');
      setSuccess('Batch cleared successfully');
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
                <Images className="w-5 h-5 text-purple-600" />
                <h1 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-black'}`}>
                  Batch Analysis
                </h1>
                <span className={`text-xs px-2 py-1 rounded ${darkMode ? 'bg-gray-800' : 'bg-gray-200'}`}>
                  Up to 25 items
                </span>
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
          <span className={darkMode ? 'text-white' : 'text-black'}>Batch Analysis</span>
        </nav>

        {/* Info Banner */}
        <div className={`rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-blue-50 border-blue-200'} p-4 mb-8`}>
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className={`font-semibold mb-1 ${darkMode ? 'text-white' : 'text-blue-900'}`}>
                Batch Processing Mode
              </h3>
              <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-blue-800'}`}>
                Process up to 25 items in one batch. Each item can have up to 24 photos. 
                Perfect for bulk listing creation. 1 credit per item analyzed.
              </p>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        {isAnalyzing && batchProgress.total > 0 && (
          <div className={`mb-8 p-4 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Analyzing batch...
              </span>
              <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {batchProgress.current} of {batchProgress.total}
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-purple-600 h-2 rounded-full transition-all"
                style={{ width: `${(batchProgress.current / batchProgress.total) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Messages */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
            <span className="text-sm text-red-800 dark:text-red-200">{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-100 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-start gap-2">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
            <span className="text-sm text-green-800 dark:text-green-200">{success}</span>
          </div>
        )}

        {/* Toolbar */}
        <div className={`mb-6 p-4 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={addNewItem}
                disabled={items.length >= 25}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Item
              </button>

              <button
                onClick={selectAll}
                className={`px-4 py-2 rounded-lg border flex items-center gap-2 ${
                  darkMode 
                    ? 'border-gray-600 hover:bg-gray-700' 
                    : 'border-gray-300 hover:bg-gray-100'
                }`}
              >
                <CheckCircle className="w-4 h-4" />
                {selectedItems.size === items.length ? 'Deselect All' : 'Select All'}
              </button>

              <button
                onClick={clearBatch}
                disabled={items.length === 0}
                className={`px-4 py-2 rounded-lg border flex items-center gap-2 ${
                  darkMode 
                    ? 'border-gray-600 hover:bg-gray-700' 
                    : 'border-gray-300 hover:bg-gray-100'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <Trash2 className="w-4 h-4" />
                Clear All
              </button>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={toggleViewMode}
                className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
              >
                {viewMode === 'grid' ? <List className="w-5 h-5" /> : <Grid className="w-5 h-5" />}
              </button>

              <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {items.length} / 25 items
              </span>
            </div>
          </div>
        </div>

        {/* Items List/Grid */}
        {items.length > 0 ? (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-4'}>
            {items.map(item => (
              <div
                key={item.id}
                className={`rounded-lg border ${
                  currentAnalyzing === item.id 
                    ? 'ring-2 ring-purple-500' 
                    : selectedItems.has(item.id)
                      ? 'ring-2 ring-blue-500'
                      : ''
                } ${
                  darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                }`}
              >
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedItems.has(item.id)}
                        onChange={() => toggleItemSelected(item.id)}
                        className="w-4 h-4"
                      />
                      
                      <div>
                        <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          {item.name}
                        </h3>
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {item.images?.length || 0} images
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {item.status === 'completed' && (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      )}
                      {item.status === 'analyzing' && (
                        <Loader2 className="w-5 h-5 animate-spin text-purple-600" />
                      )}
                      {item.status === 'error' && (
                        <AlertCircle className="w-5 h-5 text-red-500" />
                      )}
                      
                      <button
                        onClick={() => toggleItemExpanded(item.id)}
                        className={`p-1 rounded ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                      >
                        {expandedItems.has(item.id) ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                      
                      <button
                        onClick={() => removeItem(item.id)}
                        className="p-1 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/20 rounded"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Collapsed View - Image Preview */}
                  {!expandedItems.has(item.id) && item.images && item.images.length > 0 && (
                    <div className="grid grid-cols-4 gap-1 mb-3">
                      {item.images.slice(0, 4).map((img, idx) => (
                        <img
                          key={img.id}
                          src={img.preview}
                          alt={`Preview ${idx + 1}`}
                          className="w-full h-16 object-cover rounded"
                        />
                      ))}
                      {item.images.length > 4 && (
                        <div className={`flex items-center justify-center h-16 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                          <span className="text-sm">+{item.images.length - 4}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Upload Area */}
                  {(!item.images || item.images.length === 0) && !expandedItems.has(item.id) && (
                    <div className={`border-2 border-dashed rounded-lg p-4 text-center ${
                      darkMode ? 'border-gray-600' : 'border-gray-300'
                    }`}>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={(e) => handleImageUpload(item.id, e.target.files)}
                        className="hidden"
                        id={`upload-${item.id}`}
                      />
                      <label
                        htmlFor={`upload-${item.id}`}
                        className="cursor-pointer"
                      >
                        <Upload className={`mx-auto w-8 h-8 mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-400'}`} />
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          Click to upload images
                        </p>
                      </label>
                    </div>
                  )}

                  {/* Expanded View */}
                  {expandedItems.has(item.id) && (
                    <div className="mt-4 space-y-4">
                      {/* Images Grid */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            Images ({item.images?.length || 0}/24)
                          </h4>
                          <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={(e) => handleImageUpload(item.id, e.target.files)}
                            className="hidden"
                            id={`upload-expanded-${item.id}`}
                          />
                          <label
                            htmlFor={`upload-expanded-${item.id}`}
                            className="text-sm text-blue-600 hover:text-blue-700 cursor-pointer"
                          >
                            Add Images
                          </label>
                        </div>
                        
                        {item.images && item.images.length > 0 ? (
                          <div className="grid grid-cols-4 gap-2">
                            {item.images.map(img => (
                              <div key={img.id} className="relative group">
                                <img
                                  src={img.preview}
                                  alt={img.name}
                                  className="w-full h-20 object-cover rounded"
                                />
                                <button
                                  onClick={() => removeImage(item.id, img.id)}
                                  className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className={`border-2 border-dashed rounded-lg p-4 text-center ${
                            darkMode ? 'border-gray-600' : 'border-gray-300'
                          }`}>
                            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                              No images uploaded yet
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Results */}
                      {item.status === 'completed' && item.result && (
                        <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                          <h4 className={`text-sm font-medium mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            Analysis Results
                          </h4>
                          
                          <div className="space-y-2 text-sm">
                            <div>
                              <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>eBay Title:</span>
                              <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                {item.result.ebayTitle}
                              </p>
                            </div>
                            
                            <div>
                              <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Suggested Price:</span>
                              <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                £{item.result.suggestedPrice}
                              </p>
                            </div>
                            
                            <div className="flex gap-4">
                              <div>
                                <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Brand:</span>
                                <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                  {item.result.brand || 'Unbranded'}
                                </p>
                              </div>
                              <div>
                                <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Size:</span>
                                <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                  {item.result.size || 'One Size'}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Error Message */}
                      {item.status === 'error' && item.error && (
                        <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-lg">
                          <p className="text-sm text-red-800 dark:text-red-200">{item.error}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Empty State
          <div className={`rounded-lg border-2 border-dashed ${
            darkMode ? 'border-gray-700' : 'border-gray-300'
          } p-12`}>
            <div className="text-center">
              <FolderOpen className={`mx-auto w-12 h-12 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`} />
              <h3 className={`mt-4 text-lg font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                No items yet
              </h3>
              <p className={`mt-2 text-sm ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                Click "Add Item" to start building your batch
              </p>
              <button
                onClick={addNewItem}
                className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add First Item
              </button>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {items.length > 0 && (
          <div className="mt-8 flex justify-between">
            <button
              onClick={exportResults}
              disabled={!items.some(i => i.status === 'completed')}
              className={`px-6 py-3 rounded-lg border font-medium flex items-center gap-2 ${
                darkMode 
                  ? 'border-gray-700 hover:bg-gray-800' 
                  : 'border-gray-300 hover:bg-gray-100'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <Download className="w-5 h-5" />
              Export Results
            </button>

            <button
              onClick={analyzeBatch}
              disabled={isAnalyzing || !items.some(i => i.images && i.images.length > 0)}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Analyze {selectedItems.size > 0 ? `${selectedItems.size} Selected` : 'All Items'}
                </>
              )}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}