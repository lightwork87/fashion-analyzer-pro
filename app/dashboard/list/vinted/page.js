'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { 
  ArrowLeft,
  Home,
  CreditCard,
  Tag,
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
  PoundSterling,
  RefreshCw,
  Save,
  Eye,
  Send,
  FileText,
  Heart,
  Repeat,
  Users,
  MapPin,
  Shield,
  Moon,
  Sun,
  Loader2,
  Copy,
  Edit2,
  Move,
  Ruler,
  Palette,
  Hash,
  MessageSquare,
  ShoppingBag
} from 'lucide-react';

// Vinted UK Categories (Fashion focused)
const VINTED_CATEGORIES = {
  'Women': {
    id: 'women',
    subcategories: {
      'Clothing': {
        id: 'women-clothing',
        subcategories: {
          'Dresses': { id: '1' },
          'Tops & T-shirts': { id: '2' },
          'Blouses & Shirts': { id: '3' },
          'Knitwear': { id: '4' },
          'Jumpers & Cardigans': { id: '5' },
          'Coats & Jackets': { id: '6' },
          'Jeans': { id: '7' },
          'Trousers': { id: '8' },
          'Shorts': { id: '9' },
          'Skirts': { id: '10' },
          'Activewear': { id: '11' },
          'Swimwear': { id: '12' },
          'Jumpsuits & Playsuits': { id: '13' },
          'Suits & Blazers': { id: '14' },
          'Hoodies & Sweatshirts': { id: '15' }
        }
      },
      'Shoes': {
        id: 'women-shoes',
        subcategories: {
          'Trainers': { id: '16' },
          'Boots': { id: '17' },
          'Heels': { id: '18' },
          'Flats': { id: '19' },
          'Sandals': { id: '20' },
          'Slippers': { id: '21' }
        }
      },
      'Bags': {
        id: 'women-bags',
        subcategories: {
          'Handbags': { id: '22' },
          'Shoulder Bags': { id: '23' },
          'Crossbody Bags': { id: '24' },
          'Clutches': { id: '25' },
          'Backpacks': { id: '26' },
          'Tote Bags': { id: '27' }
        }
      },
      'Accessories': {
        id: 'women-accessories',
        subcategories: {
          'Jewellery': { id: '28' },
          'Watches': { id: '29' },
          'Belts': { id: '30' },
          'Scarves & Wraps': { id: '31' },
          'Hats': { id: '32' },
          'Sunglasses': { id: '33' },
          'Wallets & Purses': { id: '34' }
        }
      }
    }
  },
  'Men': {
    id: 'men',
    subcategories: {
      'Clothing': {
        id: 'men-clothing',
        subcategories: {
          'T-shirts': { id: '35' },
          'Shirts': { id: '36' },
          'Hoodies & Sweatshirts': { id: '37' },
          'Jumpers & Cardigans': { id: '38' },
          'Coats & Jackets': { id: '39' },
          'Jeans': { id: '40' },
          'Trousers': { id: '41' },
          'Shorts': { id: '42' },
          'Activewear': { id: '43' },
          'Suits & Blazers': { id: '44' },
          'Underwear & Socks': { id: '45' }
        }
      },
      'Shoes': {
        id: 'men-shoes',
        subcategories: {
          'Trainers': { id: '46' },
          'Boots': { id: '47' },
          'Formal Shoes': { id: '48' },
          'Casual Shoes': { id: '49' },
          'Sandals': { id: '50' }
        }
      },
      'Accessories': {
        id: 'men-accessories',
        subcategories: {
          'Bags': { id: '51' },
          'Watches': { id: '52' },
          'Belts': { id: '53' },
          'Hats & Caps': { id: '54' },
          'Wallets': { id: '55' },
          'Ties': { id: '56' }
        }
      }
    }
  },
  'Kids': {
    id: 'kids',
    subcategories: {
      'Girls Clothing': { id: 'girls-clothing' },
      'Boys Clothing': { id: 'boys-clothing' },
      'Baby Clothing': { id: 'baby-clothing' },
      'Kids Shoes': { id: 'kids-shoes' },
      'Kids Accessories': { id: 'kids-accessories' }
    }
  }
};

// Package sizes for Vinted
const PACKAGE_SIZES = [
  { id: 'small', name: 'Small', description: 'Fits in an envelope', maxWeight: '0.5kg', price: '£2.99' },
  { id: 'medium', name: 'Medium', description: 'Shoe box size', maxWeight: '1kg', price: '£3.99' },
  { id: 'large', name: 'Large', description: 'Fits coats, boots', maxWeight: '2kg', price: '£5.99' },
  { id: 'xlarge', name: 'Extra Large', description: 'Multiple items', maxWeight: '5kg', price: '£7.99' }
];

// Vinted conditions
const CONDITIONS = [
  { value: 'new_with_tags', label: 'New with tags', description: 'Brand new, never worn, with original tags' },
  { value: 'new_without_tags', label: 'New without tags', description: 'Brand new, never worn, tags removed' },
  { value: 'very_good', label: 'Very good', description: 'Worn once or twice, excellent condition' },
  { value: 'good', label: 'Good', description: 'Worn a few times, minor signs of wear' },
  { value: 'satisfactory', label: 'Satisfactory', description: 'Worn frequently, visible signs of wear' }
];

VintedListingPage() {
  const { user } = useUser();
  const router = useRouter();
  
  const [listingData, setListingData] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSubcategory, setSelectedSubcategory] = useState('');
  const [selectedLeafCategory, setSelectedLeafCategory] = useState('');
  const [packageSize, setPackageSize] = useState('medium');
  const [condition, setCondition] = useState('very_good');
  const [photos, setPhotos] = useState([]);
  const [darkMode, setDarkMode] = useState(false);
  const [credits, setCredits] = useState(100);
  const [loading, setLoading] = useState(true);
  const [categorySearch, setCategorySearch] = useState('');
  const [expandedSections, setExpandedSections] = useState(new Set(['category', 'details', 'photos']));
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [allowSwap, setAllowSwap] = useState(false);
  const [hashtagInput, setHashtagInput] = useState('');
  const [hashtags, setHashtags] = useState([]);
  const [customShipping, setCustomShipping] = useState(false);
  const [shippingPrice, setShippingPrice] = useState('');

  // Vinted-specific fields
  const [brand, setBrand] = useState('');
  const [size, setSize] = useState('');
  const [color, setColor] = useState('');
  const [material, setMaterial] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');

  useEffect(() => {
    // Load dark mode
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedDarkMode);
    if (savedDarkMode) {
      document.documentElement.classList.add('dark');
    }

    // Load listing data from session storage
    const storedData = sessionStorage.getItem('vintedListingData');
    if (storedData) {
      const data = JSON.parse(storedData);
      setListingData(data);
      
      // Set fields from AI analysis
      setBrand(data.brand || '');
      setSize(data.size || '');
      setColor(data.color || '');
      setMaterial(data.material || '');
      setTitle(data.ebay_title || ''); // Use same title
      setDescription(data.description || '');
      setPrice(data.suggested_price || '');
      setCondition(getVintedCondition(data.condition_score));
      
      // Auto-select category
      suggestCategory(data.item_type, data.gender);
      
      // Extract hashtags from keywords
      if (data.keywords) {
        setHashtags(data.keywords.map(k => k.toLowerCase().replace(/\s+/g, '')));
      }
      
      sessionStorage.removeItem('vintedListingData');
    }
    
    setLoading(false);
  }, []);

  const getVintedCondition = (score) => {
    if (score >= 10) return 'new_with_tags';
    if (score >= 9) return 'new_without_tags';
    if (score >= 7) return 'very_good';
    if (score >= 5) return 'good';
    return 'satisfactory';
  };

  const suggestCategory = (itemType, gender) => {
    // Auto-suggest category based on item type
    const mainCategory = gender === 'Men\'s' ? 'Men' : 'Women';
    
    if (itemType?.toLowerCase().includes('dress')) {
      setSelectedCategory('Women');
      setSelectedSubcategory('Clothing');
      setSelectedLeafCategory('1'); // Dresses
    } else if (itemType?.toLowerCase().includes('shirt')) {
      setSelectedCategory(mainCategory);
      setSelectedSubcategory('Clothing');
      setSelectedLeafCategory(gender === 'Men\'s' ? '36' : '3'); // Shirts
    } else if (itemType?.toLowerCase().includes('jean')) {
      setSelectedCategory(mainCategory);
      setSelectedSubcategory('Clothing');
      setSelectedLeafCategory(gender === 'Men\'s' ? '40' : '7'); // Jeans
    } else if (itemType?.toLowerCase().includes('shoe') || itemType?.toLowerCase().includes('trainer')) {
      setSelectedCategory(mainCategory);
      setSelectedSubcategory(gender === 'Men\'s' ? 'Shoes' : 'Shoes');
      setSelectedLeafCategory(gender === 'Men\'s' ? '46' : '16'); // Trainers
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

  const addHashtag = () => {
    if (hashtagInput && hashtags.length < 5) {
      const tag = hashtagInput.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (tag && !hashtags.includes(tag)) {
        setHashtags([...hashtags, tag]);
        setHashtagInput('');
      }
    }
  };

  const removeHashtag = (tag) => {
    setHashtags(hashtags.filter(h => h !== tag));
  };

  const validateListing = () => {
    const newErrors = {};
    
    if (!selectedLeafCategory) {
      newErrors.category = 'Please select a category';
    }
    
    if (!title || title.length < 5) {
      newErrors.title = 'Title must be at least 5 characters';
    }
    
    if (!description || description.length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    }
    
    if (!price || parseFloat(price) < 1) {
      newErrors.price = 'Price must be at least £1';
    }
    
    if (!brand) {
      newErrors.brand = 'Brand is required';
    }
    
    if (!size) {
      newErrors.size = 'Size is required';
    }
    
    if (!color) {
      newErrors.color = 'Colour is required';
    }
    
    if (photos.length === 0) {
      newErrors.photos = 'At least one photo is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const submitListing = async () => {
    if (!validateListing()) return;
    
    setSubmitting(true);
    
    try {
      const listingPayload = {
        title,
        description,
        categoryId: selectedLeafCategory,
        price: parseFloat(price),
        brand,
        size,
        color,
        material,
        condition,
        packageSize,
        photos,
        hashtags,
        allowSwap,
        customShipping,
        shippingPrice: customShipping ? parseFloat(shippingPrice) : null
      };
      
      const response = await fetch('/api/vinted/create-listing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(listingPayload)
      });
      
      if (response.ok) {
        const data = await response.json();
        // Success - redirect to success page
        router.push(`/dashboard/listing-success?id=${data.listingId}&platform=vinted`);
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
      platform: 'vinted',
      title,
      category: selectedLeafCategory,
      brand,
      size,
      color,
      material,
      condition,
      packageSize,
      photos,
      hashtags,
      createdAt: new Date().toISOString()
    };
    
    localStorage.setItem('vintedDraft', JSON.stringify(draftData));
    alert('Draft saved successfully!');
  };

  const exportCSV = () => {
    const csvData = {
      title,
      description,
      brand,
      size,
      color,
      condition: CONDITIONS.find(c => c.value === condition)?.label,
      price,
      category: selectedLeafCategory
    };
    
    const csv = Object.entries(csvData).map(([key, value]) => `"${key}","${value}"`).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'vinted-listing.csv';
    a.click();
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
                <Tag className="w-5 h-5 text-purple-600" />
                <h1 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-black'}`}>
                  List on Vinted
                </h1>
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
          <Link href="/dashboard/results" className={darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'}>
            Results
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span className={darkMode ? 'text-white' : 'text-black'}>List on Vinted</span>
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
                            {Object.entries(VINTED_CATEGORIES[selectedCategory].subcategories[selectedSubcategory].subcategories || {})
                              .find(([name, data]) => data.id === selectedLeafCategory)?.[0] || selectedLeafCategory}
                          </span>
                        </>
                      )}
                    </div>
                  )}
                  
                  {/* Category Selection */}
                  <div className="space-y-2">
                    {/* Main Categories */}
                    {!selectedCategory && Object.keys(VINTED_CATEGORIES).map(cat => (
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
                          className="text-sm text-purple-600 hover:text-purple-700 mb-2"
                        >
                          ← Back
                        </button>
                        {Object.keys(VINTED_CATEGORIES[selectedCategory].subcategories).map(subcat => (
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
                    {selectedSubcategory && VINTED_CATEGORIES[selectedCategory].subcategories[selectedSubcategory].subcategories && (
                      <>
                        <button
                          onClick={() => setSelectedSubcategory('')}
                          className="text-sm text-purple-600 hover:text-purple-700 mb-2"
                        >
                          ← Back
                        </button>
                        {Object.entries(VINTED_CATEGORIES[selectedCategory].subcategories[selectedSubcategory].subcategories).map(([name, data]) => (
                          <button
                            key={name}
                            onClick={() => setSelectedLeafCategory(data.id)}
                            className={`w-full text-left px-4 py-2 rounded-lg transition ${
                              selectedLeafCategory === data.id
                                ? 'bg-purple-600 text-white'
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

            {/* Item Details */}
            <div className={`rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <button
                onClick={() => toggleSection('details')}
                className={`w-full p-4 flex items-center justify-between ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}
              >
                <h2 className={`text-lg font-semibold flex items-center gap-2 ${darkMode ? 'text-white' : 'text-black'}`}>
                  <FileText className="w-5 h-5" />
                  Item Details
                </h2>
                {expandedSections.has('details') ? <ChevronUp /> : <ChevronDown />}
              </button>
              
              {expandedSections.has('details') && (
                <div className="p-4 pt-0 space-y-4">
                  {/* Title */}
                  <div>
                    <label className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Title *
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Blue Zara Dress Size M"
                      className={`w-full mt-1 px-3 py-2 rounded-lg border ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-gray-50 border-gray-300 text-black'
                      } ${errors.title ? 'border-red-500' : ''}`}
                    />
                    {errors.title && (
                      <p className="text-sm text-red-500 mt-1">{errors.title}</p>
                    )}
                  </div>
                  
                  {/* Brand & Size */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Brand *
                      </label>
                      <input
                        type="text"
                        value={brand}
                        onChange={(e) => setBrand(e.target.value)}
                        placeholder="e.g. Zara"
                        className={`w-full mt-1 px-3 py-2 rounded-lg border ${
                          darkMode 
                            ? 'bg-gray-700 border-gray-600 text-white' 
                            : 'bg-gray-50 border-gray-300 text-black'
                        } ${errors.brand ? 'border-red-500' : ''}`}
                      />
                      {errors.brand && (
                        <p className="text-sm text-red-500 mt-1">{errors.brand}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Size *
                      </label>
                      <input
                        type="text"
                        value={size}
                        onChange={(e) => setSize(e.target.value)}
                        placeholder="e.g. M or UK 12"
                        className={`w-full mt-1 px-3 py-2 rounded-lg border ${
                          darkMode 
                            ? 'bg-gray-700 border-gray-600 text-white' 
                            : 'bg-gray-50 border-gray-300 text-black'
                        } ${errors.size ? 'border-red-500' : ''}`}
                      />
                      {errors.size && (
                        <p className="text-sm text-red-500 mt-1">{errors.size}</p>
                      )}
                    </div>
                  </div>
                  
                  {/* Color & Material */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Colour *
                      </label>
                      <input
                        type="text"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        placeholder="e.g. Blue"
                        className={`w-full mt-1 px-3 py-2 rounded-lg border ${
                          darkMode 
                            ? 'bg-gray-700 border-gray-600 text-white' 
                            : 'bg-gray-50 border-gray-300 text-black'
                        } ${errors.color ? 'border-red-500' : ''}`}
                      />
                      {errors.color && (
                        <p className="text-sm text-red-500 mt-1">{errors.color}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Material
                      </label>
                      <input
                        type="text"
                        value={material}
                        onChange={(e) => setMaterial(e.target.value)}
                        placeholder="e.g. Cotton"
                        className={`w-full mt-1 px-3 py-2 rounded-lg border ${
                          darkMode 
                            ? 'bg-gray-700 border-gray-600 text-white' 
                            : 'bg-gray-50 border-gray-300 text-black'
                        }`}
                      />
                    </div>
                  </div>
                  
                  {/* Condition */}
                  <div>
                    <label className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Condition *
                    </label>
                    <div className="mt-2 space-y-2">
                      {CONDITIONS.map((cond) => (
                        <label
                          key={cond.value}
                          className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition ${
                            condition === cond.value
                              ? darkMode ? 'border-purple-500 bg-purple-900/20' : 'border-purple-500 bg-purple-50'
                              : darkMode ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <input
                            type="radio"
                            value={cond.value}
                            checked={condition === cond.value}
                            onChange={(e) => setCondition(e.target.value)}
                            className="mt-1"
                          />
                          <div>
                            <p className={`font-medium ${darkMode ? 'text-white' : 'text-black'}`}>
                              {cond.label}
                            </p>
                            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                              {cond.description}
                            </p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                  
                  {/* Description */}
                  <div>
                    <label className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Description *
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={6}
                      placeholder="Describe your item, including any flaws..."
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
                  
                  {/* Hashtags */}
                  <div>
                    <label className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Hashtags (up to 5)
                    </label>
                    <div className="flex flex-wrap gap-2 mt-2 mb-2">
                      {hashtags.map((tag) => (
                        <span
                          key={tag}
                          className={`px-3 py-1 rounded-full text-sm flex items-center gap-1 ${
                            darkMode ? 'bg-purple-900/30 text-purple-400' : 'bg-purple-100 text-purple-700'
                          }`}
                        >
                          #{tag}
                          <button
                            onClick={() => removeHashtag(tag)}
                            className="ml-1 hover:text-red-500"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                    {hashtags.length < 5 && (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={hashtagInput}
                          onChange={(e) => setHashtagInput(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addHashtag())}
                          placeholder="Add hashtag..."
                          className={`flex-1 px-3 py-2 rounded-lg border ${
                            darkMode 
                              ? 'bg-gray-700 border-gray-600 text-white' 
                              : 'bg-gray-50 border-gray-300 text-black'
                          }`}
                        />
                        <button
                          onClick={addHashtag}
                          className={`px-4 py-2 rounded-lg border ${
                            darkMode ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-300 hover:bg-gray-100'
                          }`}
                        >
                          Add
                        </button>
                      </div>
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
                  Photos ({photos.length}/20)
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
                  
                  <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
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
                          <span className="absolute top-1 left-1 px-2 py-0.5 bg-purple-600 text-white text-xs rounded">
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
                    
                    {photos.length < 20 && (
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
                    Drag to reorder. First photo will be the main listing image. Maximum 20 photos.
                  </p>
                </div>
              )}
            </div>

            {/* Pricing & Shipping */}
            <div className={`rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <button
                onClick={() => toggleSection('pricing')}
                className={`w-full p-4 flex items-center justify-between ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}
              >
                <h2 className={`text-lg font-semibold flex items-center gap-2 ${darkMode ? 'text-white' : 'text-black'}`}>
                  <PoundSterling className="w-5 h-5" />
                  Pricing & Shipping
                </h2>
                {expandedSections.has('pricing') ? <ChevronUp /> : <ChevronDown />}
              </button>
              
              {expandedSections.has('pricing') && (
                <div className="p-4 pt-0 space-y-4">
                  {/* Price */}
                  <div>
                    <label className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Price *
                    </label>
                    <div className="relative mt-1">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2">£</span>
                      <input
                        type="number"
                        step="0.50"
                        min="1"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
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
                    <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Buyer pays: £{(parseFloat(price || 0) * 1.05 + 0.70).toFixed(2)} (includes Vinted fees)
                    </p>
                  </div>
                  
                  {/* Package Size */}
                  <div>
                    <label className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Package Size *
                    </label>
                    <div className="mt-2 space-y-2">
                      {PACKAGE_SIZES.map((pkg) => (
                        <label
                          key={pkg.id}
                          className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition ${
                            packageSize === pkg.id
                              ? darkMode ? 'border-purple-500 bg-purple-900/20' : 'border-purple-500 bg-purple-50'
                              : darkMode ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <input
                              type="radio"
                              value={pkg.id}
                              checked={packageSize === pkg.id}
                              onChange={(e) => setPackageSize(e.target.value)}
                              className="mt-1"
                            />
                            <div>
                              <p className={`font-medium ${darkMode ? 'text-white' : 'text-black'}`}>
                                {pkg.name}
                              </p>
                              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                {pkg.description} • Up to {pkg.maxWeight}
                              </p>
                            </div>
                          </div>
                          <span className="font-medium">{pkg.price}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  
                  {/* Custom Shipping */}
                  <div>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={customShipping}
                        onChange={(e) => setCustomShipping(e.target.checked)}
                        className="rounded"
                      />
                      <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Use custom shipping price
                      </span>
                    </label>
                    
                    {customShipping && (
                      <div className="relative mt-2">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2">£</span>
                        <input
                          type="number"
                          step="0.50"
                          min="0"
                          value={shippingPrice}
                          onChange={(e) => setShippingPrice(e.target.value)}
                          placeholder="0.00"
                          className={`w-full pl-8 pr-3 py-2 rounded-lg border ${
                            darkMode 
                              ? 'bg-gray-700 border-gray-600 text-white' 
                              : 'bg-gray-50 border-gray-300 text-black'
                          }`}
                        />
                      </div>
                    )}
                  </div>
                  
                  {/* Swap Option */}
                  <div>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={allowSwap}
                        onChange={(e) => setAllowSwap(e.target.checked)}
                        className="rounded"
                      />
                      <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Open to swaps
                      </span>
                    </label>
                    <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Allow buyers to offer items in exchange
                    </p>
                  </div>
                </div>
              )}
            </div>
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
                {title || 'Your item title'}
              </h4>
              
              <p className="text-2xl font-bold mb-2">
                £{price || '0.00'}
              </p>
              
              <div className="flex items-center gap-4 mb-4 text-sm">
                <span className={`flex items-center gap-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  <Tag className="w-4 h-4" />
                  {brand || 'Brand'}
                </span>
                <span className={`flex items-center gap-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  <Ruler className="w-4 h-4" />
                  {size || 'Size'}
                </span>
              </div>
              
              <div className="flex gap-2 mb-4">
                {allowSwap && (
                  <span className={`px-2 py-1 rounded text-xs ${
                    darkMode ? 'bg-purple-900/30 text-purple-400' : 'bg-purple-100 text-purple-700'
                  }`}>
                    <Repeat className="w-3 h-3 inline mr-1" />
                    Swap
                  </span>
                )}
                {hashtags.slice(0, 3).map(tag => (
                  <span key={tag} className={`px-2 py-1 rounded text-xs ${
                    darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
                  }`}>
                    #{tag}
                  </span>
                ))}
              </div>
              
              <div className={`pt-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {CONDITIONS.find(c => c.value === condition)?.label || 'Condition'}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <button
                onClick={submitListing}
                disabled={submitting}
                className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating Listing...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    List on Vinted
                  </>
                )}
              </button>
              
              <button
                onClick={exportCSV}
                className={`w-full px-4 py-2 rounded-lg border flex items-center justify-center gap-2 transition ${
                  darkMode 
                    ? 'border-gray-600 hover:bg-gray-700' 
                    : 'border-gray-300 hover:bg-gray-100'
                }`}
              >
                <Download className="w-4 h-4" />
                Export CSV
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

            {/* Vinted Benefits */}
            <div className={`rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} p-6`}>
              <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-black'}`}>
                Why Vinted?
              </h3>
              
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <Shield className="w-4 h-4 text-green-500 mt-0.5" />
                  <div>
                    <p className={`font-medium ${darkMode ? 'text-white' : 'text-black'}`}>
                      No selling fees
                    </p>
                    <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                      Keep 100% of your sale price
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-2">
                  <Users className="w-4 h-4 text-purple-500 mt-0.5" />
                  <div>
                    <p className={`font-medium ${darkMode ? 'text-white' : 'text-black'}`}>
                      65M+ members
                    </p>
                    <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                      Huge UK fashion community
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-2">
                  <MessageSquare className="w-4 h-4 text-blue-500 mt-0.5" />
                  <div>
                    <p className={`font-medium ${darkMode ? 'text-white' : 'text-black'}`}>
                      Direct messaging
                    </p>
                    <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                      Chat with buyers easily
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tips */}
            <div className={`rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} p-6`}>
              <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-black'}`}>
                <Info className="w-5 h-5" />
                Vinted Tips
              </h3>
              
              <ul className={`space-y-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                  <span>Price competitively - check similar items</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                  <span>Use all 20 photo slots</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                  <span>Add trending hashtags</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                  <span>Choose correct package size</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                  <span>Mention any flaws clearly</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default VintedListingPage;