'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { 
  ArrowLeft,
  Home,
  CreditCard,
  ShoppingBag,
  Camera,
  Plus,
  X,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Search,
  Info,
  AlertCircle,
  CheckCircle,
  Package,
  Truck,
  Clock,
  Calendar,
  PoundSterling,
  RefreshCw,
  Save,
  Eye,
  Send,
  Settings,
  FileText,
  Shield,
  Globe,
  MapPin,
  Tag,
  DollarSign,
  Percent,
  Moon,
  Sun,
  Loader2,
  Copy,
  Edit2,
  Move
} from 'lucide-react';

// eBay UK Categories (Fashion focused)
const EBAY_CATEGORIES = {
  'Clothes, Shoes & Accessories': {
    id: '11450',
    subcategories: {
      'Women\'s Clothing': {
        id: '15724',
        subcategories: {
          'Dresses': { id: '63861' },
          'Coats, Jackets & Waistcoats': { id: '63862' },
          'Tops & Shirts': { id: '53159' },
          'Jeans': { id: '11554' },
          'Trousers': { id: '63863' },
          'Skirts': { id: '63864' },
          'Shorts': { id: '11555' },
          'Jumpers & Cardigans': { id: '63866' },
          'Activewear': { id: '137084' },
          'Hoodies & Sweatshirts': { id: '155183' }
        }
      },
      'Men\'s Clothing': {
        id: '1059',
        subcategories: {
          'Shirts': { id: '185100' },
          'T-Shirts': { id: '15687' },
          'Jeans': { id: '11483' },
          'Trousers': { id: '57989' },
          'Coats & Jackets': { id: '57988' },
          'Hoodies & Sweatshirts': { id: '155183' },
          'Jumpers & Cardigans': { id: '11484' },
          'Shorts': { id: '15689' },
          'Activewear': { id: '137084' },
          'Suits & Tailoring': { id: '3001' }
        }
      },
      'Women\'s Shoes': {
        id: '3034',
        subcategories: {
          'Trainers': { id: '95672' },
          'Boots': { id: '53557' },
          'Heels': { id: '55793' },
          'Flats': { id: '45333' },
          'Sandals': { id: '62107' }
        }
      },
      'Men\'s Shoes': {
        id: '93427',
        subcategories: {
          'Trainers': { id: '15709' },
          'Boots': { id: '11498' },
          'Formal Shoes': { id: '53120' },
          'Casual Shoes': { id: '24087' }
        }
      },
      'Women\'s Bags & Handbags': { id: '169291' },
      'Men\'s Accessories': { id: '4250' },
      'Women\'s Accessories': { id: '4251' }
    }
  }
};

// Item specifics based on category
const ITEM_SPECIFICS = {
  'Women\'s Clothing': {
    required: ['Brand', 'Size', 'Colour', 'Condition'],
    optional: ['Style', 'Material', 'Pattern', 'Occasion', 'Season', 'Fit', 'Size Type', 'Garment Care']
  },
  'Men\'s Clothing': {
    required: ['Brand', 'Size', 'Colour', 'Condition'],
    optional: ['Style', 'Material', 'Pattern', 'Fit', 'Season', 'Collar Style', 'Sleeve Length']
  },
  'Shoes': {
    required: ['Brand', 'UK Shoe Size', 'Colour', 'Condition'],
    optional: ['Style', 'Upper Material', 'Width', 'Fastening', 'Heel Type', 'Toe Shape']
  },
  'Bags': {
    required: ['Brand', 'Colour', 'Condition'],
    optional: ['Style', 'Material', 'Size', 'Closure', 'Pattern', 'Features']
  }
};

EbayListingPage() {
  const { user } = useUser();
  const router = useRouter();
  
  const [listingData, setListingData] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSubcategory, setSelectedSubcategory] = useState('');
  const [selectedLeafCategory, setSelectedLeafCategory] = useState('');
  const [itemSpecifics, setItemSpecifics] = useState({});
  const [businessPolicies, setBusinessPolicies] = useState({
    payment: null,
    shipping: null,
    returns: null
  });
  const [listingFormat, setListingFormat] = useState('fixed'); // fixed or auction
  const [duration, setDuration] = useState('GTC'); // Good Till Cancelled
  const [quantity, setQuantity] = useState(1);
  const [photos, setPhotos] = useState([]);
  const [darkMode, setDarkMode] = useState(false);
  const [credits, setCredits] = useState(100);
  const [loading, setLoading] = useState(true);
  const [categorySearch, setCategorySearch] = useState('');
  const [expandedSections, setExpandedSections] = useState(new Set(['category', 'details', 'photos']));
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [ebayConnected, setEbayConnected] = useState(false);

  useEffect(() => {
    // Load dark mode
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedDarkMode);
    if (savedDarkMode) {
      document.documentElement.classList.add('dark');
    }

    // Load listing data from session storage
    const storedData = sessionStorage.getItem('ebayListingData');
    if (storedData) {
      const data = JSON.parse(storedData);
      setListingData(data);
      
      // Auto-select category based on item type
      suggestCategory(data.item_type, data.gender);
      
      // Set initial item specifics
      setItemSpecifics({
        Brand: data.brand || 'Unbranded',
        Size: data.size || '',
        Colour: data.color || '',
        Condition: getConditionText(data.condition_score),
        Style: data.style || '',
        Material: data.material || ''
      });
      
      sessionStorage.removeItem('ebayListingData');
    }

    // Check eBay connection
    checkEbayConnection();
    
    // Load business policies
    loadBusinessPolicies();
    
    setLoading(false);
  }, []);

  const checkEbayConnection = async () => {
    try {
      const response = await fetch('/api/ebay/status');
      if (response.ok) {
        const data = await response.json();
        setEbayConnected(data.connected);
      }
    } catch (error) {
      console.error('Error checking eBay connection:', error);
    }
  };

  const loadBusinessPolicies = async () => {
    try {
      const response = await fetch('/api/ebay/business-policies');
      if (response.ok) {
        const data = await response.json();
        setBusinessPolicies(data.policies || {});
      }
    } catch (error) {
      console.error('Error loading business policies:', error);
    }
  };

  const getConditionText = (score) => {
    if (score >= 10) return 'New with tags';
    if (score >= 9) return 'New without tags';
    if (score >= 8) return 'New with defects';
    if (score >= 7) return 'Used - Like new';
    if (score >= 6) return 'Used - Very good';
    if (score >= 5) return 'Used - Good';
    return 'Used - Acceptable';
  };

  const suggestCategory = (itemType, gender) => {
    // Auto-suggest category based on item type
    const genderCategory = gender === 'Men\'s' ? 'Men\'s Clothing' : 'Women\'s Clothing';
    
    if (itemType?.toLowerCase().includes('dress')) {
      setSelectedCategory('Clothes, Shoes & Accessories');
      setSelectedSubcategory('Women\'s Clothing');
      setSelectedLeafCategory('Dresses');
    } else if (itemType?.toLowerCase().includes('shirt')) {
      setSelectedCategory('Clothes, Shoes & Accessories');
      setSelectedSubcategory(genderCategory);
      setSelectedLeafCategory(gender === 'Men\'s' ? 'Shirts' : 'Tops & Shirts');
    } else if (itemType?.toLowerCase().includes('jean')) {
      setSelectedCategory('Clothes, Shoes & Accessories');
      setSelectedSubcategory(genderCategory);
      setSelectedLeafCategory('Jeans');
    } else if (itemType?.toLowerCase().includes('shoe') || itemType?.toLowerCase().includes('trainer')) {
      setSelectedCategory('Clothes, Shoes & Accessories');
      setSelectedSubcategory(gender === 'Men\'s' ? 'Men\'s Shoes' : 'Women\'s Shoes');
      setSelectedLeafCategory('Trainers');
    }
  };

  const toggleSection = (section) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const validateListing = () => {
    const newErrors = {};
    
    if (!selectedLeafCategory) {
      newErrors.category = 'Please select a category';
    }
    
    if (!listingData?.ebay_title || listingData.ebay_title.length > 80) {
      newErrors.title = 'Title is required and must be under 80 characters';
    }
    
    if (!listingData?.description) {
      newErrors.description = 'Description is required';
    }
    
    if (!listingData?.suggested_price || listingData.suggested_price <= 0) {
      newErrors.price = 'Price must be greater than 0';
    }
    
    if (photos.length === 0) {
      newErrors.photos = 'At least one photo is required';
    }
    
    // Check required item specifics
    const categoryType = selectedSubcategory.includes('Clothing') ? 'Women\'s Clothing' : 
                        selectedSubcategory.includes('Shoes') ? 'Shoes' : 'Bags';
    const requiredSpecs = ITEM_SPECIFICS[categoryType]?.required || [];
    
    for (const spec of requiredSpecs) {
      if (!itemSpecifics[spec]) {
        newErrors[`specific_${spec}`] = `${spec} is required`;
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const submitListing = async () => {
    if (!validateListing()) return;
    
    setSubmitting(true);
    
    try {
      const listingPayload = {
        title: listingData.ebay_title,
        description: listingData.description,
        categoryId: selectedLeafCategory,
        price: listingData.suggested_price,
        quantity: quantity,
        condition: itemSpecifics.Condition,
        itemSpecifics: itemSpecifics,
        photos: photos,
        listingFormat: listingFormat,
        duration: duration,
        businessPolicies: businessPolicies,
        sku: listingData.sku
      };
      
      const response = await fetch('/api/ebay/create-listing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(listingPayload)
      });
      
      if (response.ok) {
        const data = await response.json();
        // Success - redirect to success page or dashboard
        router.push(`/dashboard/listing-success?id=${data.listingId}&platform=ebay`);
      } else {
        const error = await response.json();
        setErrors({ submit: error.message || 'Failed to create listing' });
      }
    } catch (error) {
      console.error('Error submitting listing:', error);
      setErrors({ submit: 'An error occurred while creating the listing' });
    } finally {
      setSubmitting(false);
    }
  };

  const saveDraft = async () => {
    const draftData = {
      platform: 'ebay',
      title: listingData?.ebay_title,
      category: selectedLeafCategory,
      itemSpecifics,
      photos,
      listingFormat,
      businessPolicies,
      createdAt: new Date().toISOString()
    };
    
    // Save to local storage or API
    localStorage.setItem('ebayDraft', JSON.stringify(draftData));
    alert('Draft saved successfully!');
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <Loader2 className="w-8 h-8 animate-spin" />
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
                <ShoppingBag className="w-5 h-5 text-blue-600" />
                <h1 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-black'}`}>
                  List on eBay UK
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {ebayConnected ? (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm">eBay Connected</span>
                </div>
              ) : (
                <Link
                  href="/dashboard/connect-ebay"
                  className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Settings className="w-4 h-4" />
                  Connect eBay
                </Link>
              )}
              
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
          <Link href="/dashboard/results" className={darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'}>
            Results
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span className={darkMode ? 'text-white' : 'text-black'}>List on eBay</span>
        </nav>

        {/* Error Alert */}
        {errors.submit && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <p className="text-sm text-red-600 dark:text-red-400">{errors.submit}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Category Selection */}
            <div className={`rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <button
                onClick={() => toggleSection('category')}
                className={`w-full p-4 flex items-center justify-between ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}
              >
                <h2 className={`text-lg font-semibold flex items-center gap-2 ${darkMode ? 'text-white' : 'text-black'}`}>
                  <Package className="w-5 h-5" />
                  Category
                  {selectedLeafCategory && (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  )}
                </h2>
                {expandedSections.has('category') ? <ChevronUp /> : <ChevronDown />}
              </button>
              
              {expandedSections.has('category') && (
                <div className="p-4 pt-0">
                  {errors.category && (
                    <p className="text-sm text-red-500 mb-2">{errors.category}</p>
                  )}
                  
                  {/* Category Search */}
                  <div className="mb-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search categories..."
                        value={categorySearch}
                        onChange={(e) => setCategorySearch(e.target.value)}
                        className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                          darkMode 
                            ? 'bg-gray-700 border-gray-600 text-white' 
                            : 'bg-gray-50 border-gray-300 text-black'
                        }`}
                      />
                    </div>
                  </div>
                  
                  {/* Category Path */}
                  {selectedCategory && (
                    <div className="mb-4 flex items-center gap-2 text-sm">
                      <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                        {selectedCategory}
                      </span>
                      {selectedSubcategory && (
                        <>
                          <ChevronRight className="w-4 h-4" />
                          <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                            {selectedSubcategory}
                          </span>
                        </>
                      )}
                      {selectedLeafCategory && (
                        <>
                          <ChevronRight className="w-4 h-4" />
                          <span className={darkMode ? 'text-white' : 'text-black'}>
                            {Object.keys(EBAY_CATEGORIES[selectedCategory].subcategories[selectedSubcategory].subcategories || {})
                              .find(key => EBAY_CATEGORIES[selectedCategory].subcategories[selectedSubcategory].subcategories[key].id === selectedLeafCategory) || selectedLeafCategory}
                          </span>
                        </>
                      )}
                    </div>
                  )}
                  
                  {/* Category Selection */}
                  <div className="space-y-2">
                    {/* Main Categories */}
                    {!selectedCategory && Object.keys(EBAY_CATEGORIES).map(cat => (
                      <button
                        key={cat}
                        onClick={() => {
                          setSelectedCategory(cat);
                          setSelectedSubcategory('');
                          setSelectedLeafCategory('');
                        }}
                        className={`w-full text-left px-4 py-2 rounded-lg transition ${
                          darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                    
                    {/* Subcategories */}
                    {selectedCategory && !selectedSubcategory && (
                      <>
                        <button
                          onClick={() => setSelectedCategory('')}
                          className="text-sm text-blue-600 hover:text-blue-700 mb-2"
                        >
                          ← Back
                        </button>
                        {Object.keys(EBAY_CATEGORIES[selectedCategory].subcategories).map(subcat => (
                          <button
                            key={subcat}
                            onClick={() => {
                              setSelectedSubcategory(subcat);
                              setSelectedLeafCategory('');
                            }}
                            className={`w-full text-left px-4 py-2 rounded-lg transition ${
                              darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                            }`}
                          >
                            {subcat}
                          </button>
                        ))}
                      </>
                    )}
                    
                    {/* Leaf Categories */}
                    {selectedSubcategory && EBAY_CATEGORIES[selectedCategory].subcategories[selectedSubcategory].subcategories && (
                      <>
                        <button
                          onClick={() => setSelectedSubcategory('')}
                          className="text-sm text-blue-600 hover:text-blue-700 mb-2"
                        >
                          ← Back
                        </button>
                        {Object.entries(EBAY_CATEGORIES[selectedCategory].subcategories[selectedSubcategory].subcategories).map(([name, data]) => (
                          <button
                            key={name}
                            onClick={() => setSelectedLeafCategory(data.id)}
                            className={`w-full text-left px-4 py-2 rounded-lg transition ${
                              selectedLeafCategory === data.id
                                ? 'bg-black text-white dark:bg-white dark:text-black'
                                : darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                            }`}
                          >
                            {name}
                          </button>
                        ))}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Listing Details */}
            <div className={`rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <button
                onClick={() => toggleSection('details')}
                className={`w-full p-4 flex items-center justify-between ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}
              >
                <h2 className={`text-lg font-semibold flex items-center gap-2 ${darkMode ? 'text-white' : 'text-black'}`}>
                  <FileText className="w-5 h-5" />
                  Listing Details
                </h2>
                {expandedSections.has('details') ? <ChevronUp /> : <ChevronDown />}
              </button>
              
              {expandedSections.has('details') && (
                <div className="p-4 pt-0 space-y-4">
                  {/* Title */}
                  <div>
                    <label className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Title
                    </label>
                    <input
                      type="text"
                      value={listingData?.ebay_title || ''}
                      onChange={(e) => setListingData({...listingData, ebay_title: e.target.value})}
                      maxLength={80}
                      className={`w-full mt-1 px-3 py-2 rounded-lg border ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-gray-50 border-gray-300 text-black'
                      } ${errors.title ? 'border-red-500' : ''}`}
                    />
                    <div className="flex justify-between mt-1">
                      {errors.title && (
                        <p className="text-sm text-red-500">{errors.title}</p>
                      )}
                      <span className={`text-sm ${
                        listingData?.ebay_title?.length > 80 ? 'text-red-500' : 'text-gray-500'
                      }`}>
                        {listingData?.ebay_title?.length || 0}/80
                      </span>
                    </div>
                  </div>
                  
                  {/* Item Specifics */}
                  <div>
                    <h3 className={`text-sm font-medium mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Item Specifics
                    </h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                      {/* Required Specifics */}
                      {(ITEM_SPECIFICS[selectedSubcategory?.includes('Clothing') ? 'Women\'s Clothing' : 
                        selectedSubcategory?.includes('Shoes') ? 'Shoes' : 'Bags']?.required || []).map(spec => (
                        <div key={spec}>
                          <label className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            {spec} *
                          </label>
                          <input
                            type="text"
                            value={itemSpecifics[spec] || ''}
                            onChange={(e) => setItemSpecifics({...itemSpecifics, [spec]: e.target.value})}
                            className={`w-full mt-1 px-3 py-2 rounded-lg border ${
                              darkMode 
                                ? 'bg-gray-700 border-gray-600 text-white' 
                                : 'bg-gray-50 border-gray-300 text-black'
                            } ${errors[`specific_${spec}`] ? 'border-red-500' : ''}`}
                          />
                          {errors[`specific_${spec}`] && (
                            <p className="text-sm text-red-500 mt-1">{errors[`specific_${spec}`]}</p>
                          )}
                        </div>
                      ))}
                      
                      {/* Optional Specifics */}
                      {(ITEM_SPECIFICS[selectedSubcategory?.includes('Clothing') ? 'Women\'s Clothing' : 
                        selectedSubcategory?.includes('Shoes') ? 'Shoes' : 'Bags']?.optional || []).map(spec => (
                        <div key={spec}>
                          <label className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            {spec}
                          </label>
                          <input
                            type="text"
                            value={itemSpecifics[spec] || ''}
                            onChange={(e) => setItemSpecifics({...itemSpecifics, [spec]: e.target.value})}
                            className={`w-full mt-1 px-3 py-2 rounded-lg border ${
                              darkMode 
                                ? 'bg-gray-700 border-gray-600 text-white' 
                                : 'bg-gray-50 border-gray-300 text-black'
                            }`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Description */}
                  <div>
                    <label className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Description
                    </label>
                    <textarea
                      value={listingData?.description || ''}
                      onChange={(e) => setListingData({...listingData, description: e.target.value})}
                      rows={8}
                      className={`w-full mt-1 px-3 py-2 rounded-lg border ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-gray-50 border-gray-300 text-black'
                      } ${errors.description ? 'border-red-500' : ''}`}
                    />
                    {errors.description && (
                      <p className="text-sm text-red-500 mt-1">{errors.description}</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Photos */}
            <div className={`rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <button
                onClick={() => toggleSection('photos')}
                className={`w-full p-4 flex items-center justify-between ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}
              >
                <h2 className={`text-lg font-semibold flex items-center gap-2 ${darkMode ? 'text-white' : 'text-black'}`}>
                  <Camera className="w-5 h-5" />
                  Photos ({photos.length}/24)
                  {photos.length > 0 && (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  )}
                </h2>
                {expandedSections.has('photos') ? <ChevronUp /> : <ChevronDown />}
              </button>
              
              {expandedSections.has('photos') && (
                <div className="p-4 pt-0">
                  {errors.photos && (
                    <p className="text-sm text-red-500 mb-2">{errors.photos}</p>
                  )}
                  
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                    {photos.map((photo, index) => (
                      <div
                        key={photo.id}
                        draggable
                        className="relative group cursor-move"
                      >
                        <img
                          src={photo.url}
                          alt={`Photo ${index + 1}`}
                          className="w-full aspect-square object-cover rounded-lg"
                        />
                        {index === 0 && (
                          <span className="absolute top-1 left-1 px-2 py-0.5 bg-black text-white text-xs rounded">
                            Main
                          </span>
                        )}
                        <button
                          onClick={() => setPhotos(photos.filter(p => p.id !== photo.id))}
                          className="absolute -top-2 -right-2 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    
                    {photos.length < 24 && (
                      <button
                        onClick={() => {/* Open photo selector */}}
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
                  
                  <p className={`text-sm mt-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Drag to reorder. First photo will be the main listing image.
                  </p>
                </div>
              )}
            </div>

            {/* Pricing & Format */}
            <div className={`rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <button
                onClick={() => toggleSection('pricing')}
                className={`w-full p-4 flex items-center justify-between ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}
              >
                <h2 className={`text-lg font-semibold flex items-center gap-2 ${darkMode ? 'text-white' : 'text-black'}`}>
                  <PoundSterling className="w-5 h-5" />
                  Pricing & Format
                </h2>
                {expandedSections.has('pricing') ? <ChevronUp /> : <ChevronDown />}
              </button>
              
              {expandedSections.has('pricing') && (
                <div className="p-4 pt-0 space-y-4">
                  {/* Listing Format */}
                  <div>
                    <label className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Listing Format
                    </label>
                    <div className="grid grid-cols-2 gap-3 mt-2">
                      <button
                        onClick={() => setListingFormat('fixed')}
                        className={`p-3 rounded-lg border transition ${
                          listingFormat === 'fixed'
                            ? 'bg-black text-white dark:bg-white dark:text-black'
                            : darkMode ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-300 hover:bg-gray-100'
                        }`}
                      >
                        <PoundSterling className="w-5 h-5 mx-auto mb-1" />
                        <span className="text-sm">Fixed Price</span>
                      </button>
                      
                      <button
                        onClick={() => setListingFormat('auction')}
                        className={`p-3 rounded-lg border transition ${
                          listingFormat === 'auction'
                            ? 'bg-black text-white dark:bg-white dark:text-black'
                            : darkMode ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-300 hover:bg-gray-100'
                        }`}
                      >
                        <Clock className="w-5 h-5 mx-auto mb-1" />
                        <span className="text-sm">Auction</span>
                      </button>
                    </div>
                  </div>
                  
                  {/* Price */}
                  <div>
                    <label className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {listingFormat === 'fixed' ? 'Price' : 'Starting Price'}
                    </label>
                    <div className="relative mt-1">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2">£</span>
                      <input
                        type="number"
                        step="0.01"
                        value={listingData?.suggested_price || ''}
                        onChange={(e) => setListingData({...listingData, suggested_price: parseFloat(e.target.value) || 0})}
                        className={`w-full pl-8 pr-3 py-2 rounded-lg border ${
                          darkMode 
                            ? 'bg-gray-700 border-gray-600 text-white' 
                            : 'bg-gray-50 border-gray-300 text-black'
                        } ${errors.price ? 'border-red-500' : ''}`}
                      />
                    </div>
                    {errors.price && (
                      <p className="text-sm text-red-500 mt-1">{errors.price}</p>
                    )}
                  </div>
                  
                  {/* Quantity */}
                  <div>
                    <label className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Quantity
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                      className={`w-full mt-1 px-3 py-2 rounded-lg border ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-gray-50 border-gray-300 text-black'
                      }`}
                    />
                  </div>
                  
                  {/* Duration */}
                  <div>
                    <label className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Duration
                    </label>
                    <select
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      className={`w-full mt-1 px-3 py-2 rounded-lg border ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-gray-50 border-gray-300 text-black'
                      }`}
                    >
                      <option value="GTC">Good Till Cancelled</option>
                      <option value="Days_3">3 Days</option>
                      <option value="Days_5">5 Days</option>
                      <option value="Days_7">7 Days</option>
                      <option value="Days_10">10 Days</option>
                      <option value="Days_30">30 Days</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Business Policies */}
            {businessPolicies.payment && (
              <div className={`rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <button
                  onClick={() => toggleSection('policies')}
                  className={`w-full p-4 flex items-center justify-between ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}
                >
                  <h2 className={`text-lg font-semibold flex items-center gap-2 ${darkMode ? 'text-white' : 'text-black'}`}>
                    <Shield className="w-5 h-5" />
                    Business Policies
                  </h2>
                  {expandedSections.has('policies') ? <ChevronUp /> : <ChevronDown />}
                </button>
                
                {expandedSections.has('policies') && (
                  <div className="p-4 pt-0 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                        <p className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          Payment
                        </p>
                        <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {businessPolicies.payment.name}
                        </p>
                      </div>
                      
                      <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                        <p className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          Shipping
                        </p>
                        <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {businessPolicies.shipping.name}
                        </p>
                      </div>
                      
                      <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                        <p className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          Returns
                        </p>
                        <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {businessPolicies.returns.name}
                        </p>
                      </div>
                    </div>
                    
                    <Link
                      href="/dashboard/ebay-settings"
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      Manage Business Policies →
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Preview Card */}
            <div className={`rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} p-6`}>
              <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-black'}`}>
                <Eye className="w-5 h-5" />
                Listing Preview
              </h3>
              
              {photos.length > 0 && (
                <img
                  src={photos[0].url}
                  alt="Main photo"
                  className="w-full aspect-square object-cover rounded-lg mb-4"
                />
              )}
              
              <h4 className={`font-medium mb-2 ${darkMode ? 'text-white' : 'text-black'}`}>
                {listingData?.ebay_title || 'Your item title'}
              </h4>
              
              <p className="text-2xl font-bold mb-4">
                £{listingData?.suggested_price || '0.00'}
              </p>
              
              <div className={`space-y-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                <div className="flex justify-between">
                  <span>Condition:</span>
                  <span>{itemSpecifics.Condition || 'Not specified'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Brand:</span>
                  <span>{itemSpecifics.Brand || 'Not specified'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Size:</span>
                  <span>{itemSpecifics.Size || 'Not specified'}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <button
                onClick={submitListing}
                disabled={submitting || !ebayConnected}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating Listing...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    List on eBay UK
                  </>
                )}
              </button>
              
              <button
                onClick={saveDraft}
                className={`w-full px-4 py-2 rounded-lg border flex items-center justify-center gap-2 transition ${
                  darkMode 
                    ? 'border-gray-600 hover:bg-gray-700' 
                    : 'border-gray-300 hover:bg-gray-100'
                }`}
              >
                <Save className="w-4 h-4" />
                Save as Draft
              </button>
            </div>

            {/* Fees Estimate */}
            <div className={`rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} p-6`}>
              <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-black'}`}>
                eBay Fees Estimate
              </h3>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                    Insertion Fee
                  </span>
                  <span>Free</span>
                </div>
                <div className="flex justify-between">
                  <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                    Final Value Fee (12.8%)
                  </span>
                  <span>£{((listingData?.suggested_price || 0) * 0.128).toFixed(2)}</span>
                </div>
                <div className="h-px bg-gray-300 dark:bg-gray-700 my-2" />
                <div className="flex justify-between font-medium">
                  <span>You'll receive</span>
                  <span>£{((listingData?.suggested_price || 0) * 0.872).toFixed(2)}</span>
                </div>
              </div>
              
              <p className={`text-xs mt-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                * Estimates based on standard UK seller fees
              </p>
            </div>

            {/* Help */}
            <div className={`rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} p-6`}>
              <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-black'}`}>
                <Info className="w-5 h-5" />
                Listing Tips
              </h3>
              
              <ul className={`space-y-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                  <span>Use all available photo slots</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                  <span>Fill in all item specifics</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                  <span>Price competitively based on sold items</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                  <span>Offer free postage when possible</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default EbayListingPage;