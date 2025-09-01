'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { 
  Home,
  CreditCard,
  Search,
  TrendingUp,
  TrendingDown,
  PoundSterling,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Moon,
  Sun,
  Loader2,
  BarChart3,
  Calendar,
  Package,
  Tag,
  Clock,
  AlertCircle,
  Info,
  Filter,
  Download,
  RefreshCw,
  Star,
  Eye,
  ShoppingBag,
  Zap,
  CheckCircle,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react';

// Popular categories for quick access
const POPULAR_CATEGORIES = [
  { name: "Women's Dresses", icon: Package, trend: 'up' },
  { name: "Designer Handbags", icon: ShoppingBag, trend: 'up' },
  { name: "Men's Trainers", icon: Package, trend: 'stable' },
  { name: "Vintage Clothing", icon: Tag, trend: 'up' },
  { name: "Children's Clothing", icon: Package, trend: 'down' },
  { name: "Luxury Watches", icon: Clock, trend: 'up' }
];

// Mock trending brands
const TRENDING_BRANDS = [
  { name: 'Zara', change: '+15%', trend: 'up', avgPrice: 18.50 },
  { name: 'Nike', change: '+8%', trend: 'up', avgPrice: 45.00 },
  { name: 'Adidas', change: '-3%', trend: 'down', avgPrice: 42.00 },
  { name: 'H&M', change: '0%', trend: 'stable', avgPrice: 12.00 },
  { name: 'Ralph Lauren', change: '+12%', trend: 'up', avgPrice: 65.00 },
  { name: 'Burberry', change: '+20%', trend: 'up', avgPrice: 250.00 }
];

// Seasonal insights
const SEASONAL_INSIGHTS = [
  { item: 'Winter Coats', bestMonth: 'October', increase: '45%' },
  { item: 'Summer Dresses', bestMonth: 'May', increase: '60%' },
  { item: 'Boots', bestMonth: 'September', increase: '35%' },
  { item: 'Swimwear', bestMonth: 'April', increase: '80%' },
  { item: 'Christmas Jumpers', bestMonth: 'November', increase: '120%' }
];

function PricingGuidePage() {
  const { user } = useUser();
  const router = useRouter();
  
  const [darkMode, setDarkMode] = useState(false);
  const [credits, setCredits] = useState(100);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [dateRange, setDateRange] = useState('30'); // days
  const [condition, setCondition] = useState('all');
  const [expandedSections, setExpandedSections] = useState(new Set(['search', 'results']));
  
  // Search results state
  const [searchResults, setSearchResults] = useState(null);
  const [priceData, setPriceData] = useState(null);
  const [similarItems, setSimilarItems] = useState([]);
  const [priceHistory, setPriceHistory] = useState([]);

  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedDarkMode);
    if (savedDarkMode) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    
    try {
      const params = new URLSearchParams({
        q: searchQuery,
        category: selectedCategory,
        brand: selectedBrand,
        days: dateRange,
        condition
      });
      
      const response = await fetch(`/api/pricing/search?${params}`);
      
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.summary);
        setPriceData(data.priceData);
        setSimilarItems(data.similarItems);
        setPriceHistory(data.priceHistory);
      }
    } catch (error) {
      console.error('Error searching prices:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportData = () => {
    if (!searchResults) return;
    
    const csv = [
      ['Item', 'Average Price', 'Min Price', 'Max Price', 'Total Sold', 'Sell-Through Rate'],
      [
        searchQuery,
        `£${searchResults.avgPrice}`,
        `£${searchResults.minPrice}`,
        `£${searchResults.maxPrice}`,
        searchResults.totalSold,
        `${searchResults.sellThrough}%`
      ]
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pricing-guide-${searchQuery.replace(/\s+/g, '-')}.csv`;
    a.click();
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

  const getTrendIcon = (trend) => {
    switch(trend) {
      case 'up':
        return <ArrowUp className="w-4 h-4 text-green-500" />;
      case 'down':
        return <ArrowDown className="w-4 h-4 text-red-500" />;
      default:
        return <Minus className="w-4 h-4 text-gray-500" />;
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
                  UK Pricing Guide
                </h1>
                <span className={`text-xs px-2 py-1 rounded ${darkMode ? 'bg-gray-800' : 'bg-gray-200'}`}>
                  eBay Sold Data
                </span>
              </div>
            </div>

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
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-sm mb-8">
          <Link href="/dashboard" className={darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'}>
            Dashboard
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span className={darkMode ? 'text-white' : 'text-black'}>UK Pricing Guide</span>
        </nav>

        {/* Info Banner */}
        <div className={`rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-blue-50 border-blue-200'} p-4 mb-8`}>
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className={`font-semibold mb-1 ${darkMode ? 'text-white' : 'text-blue-900'}`}>
                Real eBay UK Sold Data
              </h3>
              <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-blue-800'}`}>
                Pricing recommendations based on actual sold listings from the last 90 days. 
                All prices include final selling fees and shipping costs where applicable.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Search Section */}
            <div className={`rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <button
                onClick={() => toggleSection('search')}
                className={`w-full p-4 flex items-center justify-between ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}
              >
                <h2 className={`text-lg font-semibold flex items-center gap-2 ${darkMode ? 'text-white' : 'text-black'}`}>
                  <Search className="w-5 h-5" />
                  Search Pricing Data
                </h2>
                {expandedSections.has('search') ? <ChevronUp /> : <ChevronDown />}
              </button>
              
              {expandedSections.has('search') && (
                <div className="p-4 pt-0 space-y-4">
                  {/* Search Input */}
                  <div>
                    <label className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Search for an item
                    </label>
                    <div className="relative mt-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                        placeholder="e.g. Zara dress size 12, Nike Air Max 90"
                        className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                          darkMode 
                            ? 'bg-gray-700 border-gray-600 text-white' 
                            : 'bg-gray-50 border-gray-300 text-black'
                        }`}
                      />
                    </div>
                  </div>
                  
                  {/* Filters */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <label className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Category
                      </label>
                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className={`w-full mt-1 px-3 py-2 rounded-lg border ${
                          darkMode 
                            ? 'bg-gray-700 border-gray-600 text-white' 
                            : 'bg-gray-50 border-gray-300 text-black'
                        }`}
                      >
                        <option value="all">All Categories</option>
                        <option value="womens-clothing">Women's Clothing</option>
                        <option value="mens-clothing">Men's Clothing</option>
                        <option value="shoes">Shoes</option>
                        <option value="bags">Bags & Accessories</option>
                        <option value="kids">Children's</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Brand
                      </label>
                      <select
                        value={selectedBrand}
                        onChange={(e) => setSelectedBrand(e.target.value)}
                        className={`w-full mt-1 px-3 py-2 rounded-lg border ${
                          darkMode 
                            ? 'bg-gray-700 border-gray-600 text-white' 
                            : 'bg-gray-50 border-gray-300 text-black'
                        }`}
                      >
                        <option value="all">All Brands</option>
                        <option value="zara">Zara</option>
                        <option value="hm">H&M</option>
                        <option value="nike">Nike</option>
                        <option value="adidas">Adidas</option>
                        <option value="next">Next</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Date Range
                      </label>
                      <select
                        value={dateRange}
                        onChange={(e) => setDateRange(e.target.value)}
                        className={`w-full mt-1 px-3 py-2 rounded-lg border ${
                          darkMode 
                            ? 'bg-gray-700 border-gray-600 text-white' 
                            : 'bg-gray-50 border-gray-300 text-black'
                        }`}
                      >
                        <option value="7">Last 7 days</option>
                        <option value="30">Last 30 days</option>
                        <option value="60">Last 60 days</option>
                        <option value="90">Last 90 days</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Condition
                      </label>
                      <select
                        value={condition}
                        onChange={(e) => setCondition(e.target.value)}
                        className={`w-full mt-1 px-3 py-2 rounded-lg border ${
                          darkMode 
                            ? 'bg-gray-700 border-gray-600 text-white' 
                            : 'bg-gray-50 border-gray-300 text-black'
                        }`}
                      >
                        <option value="all">All Conditions</option>
                        <option value="new">New with tags</option>
                        <option value="new-without">New without tags</option>
                        <option value="used">Used</option>
                      </select>
                    </div>
                  </div>
                  
                  {/* Search Button */}
                  <button
                    onClick={handleSearch}
                    disabled={loading || !searchQuery}
                    className="w-full px-4 py-2 bg-black text-white dark:bg-white dark:text-black rounded-lg hover:opacity-80 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Searching eBay data...
                      </>
                    ) : (
                      <>
                        <Search className="w-4 h-4" />
                        Search Sold Prices
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Search Results */}
            {searchResults && (
              <div className={`rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <button
                  onClick={() => toggleSection('results')}
                  className={`w-full p-4 flex items-center justify-between ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}
                >
                  <h2 className={`text-lg font-semibold flex items-center gap-2 ${darkMode ? 'text-white' : 'text-black'}`}>
                    <BarChart3 className="w-5 h-5" />
                    Pricing Analysis
                  </h2>
                  {expandedSections.has('results') ? <ChevronUp /> : <ChevronDown />}
                </button>
                
                {expandedSections.has('results') && (
                  <div className="p-4 pt-0">
                    {/* Summary Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          Average Price
                        </p>
                        <p className="text-2xl font-bold">
                          £{searchResults.avgPrice}
                        </p>
                      </div>
                      
                      <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          Price Range
                        </p>
                        <p className="text-2xl font-bold">
                          £{searchResults.minPrice} - £{searchResults.maxPrice}
                        </p>
                      </div>
                      
                      <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          Items Sold
                        </p>
                        <p className="text-2xl font-bold">
                          {searchResults.totalSold}
                        </p>
                      </div>
                      
                      <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          Sell-Through
                        </p>
                        <p className="text-2xl font-bold">
                          {searchResults.sellThrough}%
                        </p>
                      </div>
                    </div>
                    
                    {/* Price Distribution Chart */}
                    {priceData && (
                      <div className="mb-6">
                        <h3 className={`text-sm font-medium mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          Price Distribution
                        </h3>
                        <div className="h-48 flex items-end justify-between gap-1">
                          {priceData.distribution.map((bar, index) => (
                            <div
                              key={index}
                              className="flex-1 bg-blue-500 rounded-t relative group"
                              style={{ height: `${bar.percentage}%` }}
                            >
                              <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap">
                                £{bar.price}: {bar.count} sold
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="flex justify-between mt-2 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}">
                          <span>£{searchResults.minPrice}</span>
                          <span>£{searchResults.maxPrice}</span>
                        </div>
                      </div>
                    )}
                    
                    {/* Price Trend */}
                    {priceHistory.length > 0 && (
                      <div>
                        <h3 className={`text-sm font-medium mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          Price Trend (Last {dateRange} Days)
                        </h3>
                        <div className="h-32 flex items-end justify-between gap-1">
                          {priceHistory.map((day, index) => (
                            <div
                              key={index}
                              className="flex-1 bg-green-500 rounded-t"
                              style={{ height: `${(day.avgPrice / searchResults.maxPrice) * 100}%` }}
                              title={`${day.date}: £${day.avgPrice}`}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Export Button */}
                    <div className="mt-6 flex justify-end">
                      <button
                        onClick={exportData}
                        className={`px-4 py-2 rounded-lg border flex items-center gap-2 ${
                          darkMode 
                            ? 'border-gray-600 hover:bg-gray-700' 
                            : 'border-gray-300 hover:bg-gray-100'
                        }`}
                      >
                        <Download className="w-4 h-4" />
                        Export Data
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Similar Items */}
            {similarItems.length > 0 && (
              <div className={`rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <div className="p-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}">
                  <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-black'}`}>
                    Recently Sold Similar Items
                  </h3>
                </div>
                
                <div className="divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}">
                  {similarItems.slice(0, 10).map((item, index) => (
                    <div key={index} className="p-4 flex items-center justify-between">
                      <div className="flex-1">
                        <p className={`font-medium ${darkMode ? 'text-white' : 'text-black'}`}>
                          {item.title}
                        </p>
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          Sold {item.daysAgo} days ago • {item.condition}
                        </p>
                      </div>
                      
                      <div className="text-right">
                        <p className="text-xl font-bold">
                          £{item.soldPrice}
                        </p>
                        {item.shipping > 0 && (
                          <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            + £{item.shipping} shipping
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Popular Categories */}
            <div className={`rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} p-6`}>
              <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-black'}`}>
                Popular Categories
              </h3>
              
              <div className="space-y-3">
                {POPULAR_CATEGORIES.map((category) => {
                  const Icon = category.icon;
                  return (
                    <button
                      key={category.name}
                      onClick={() => {
                        setSearchQuery(category.name);
                        handleSearch();
                      }}
                      className={`w-full flex items-center justify-between p-3 rounded-lg transition ${
                        darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-5 h-5 text-gray-500" />
                        <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          {category.name}
                        </span>
                      </div>
                      {getTrendIcon(category.trend)}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Trending Brands */}
            <div className={`rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} p-6`}>
              <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-black'}`}>
                <TrendingUp className="w-5 h-5" />
                Trending Brands
              </h3>
              
              <div className="space-y-3">
                {TRENDING_BRANDS.map((brand) => (
                  <div
                    key={brand.name}
                    className="flex items-center justify-between"
                  >
                    <div>
                      <p className={`font-medium ${darkMode ? 'text-white' : 'text-black'}`}>
                        {brand.name}
                      </p>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Avg: £{brand.avgPrice}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-medium ${
                        brand.trend === 'up' ? 'text-green-500' : 
                        brand.trend === 'down' ? 'text-red-500' : 
                        'text-gray-500'
                      }`}>
                        {brand.change}
                      </span>
                      {getTrendIcon(brand.trend)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Seasonal Insights */}
            <div className={`rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} p-6`}>
              <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-black'}`}>
                <Calendar className="w-5 h-5" />
                Seasonal Insights
              </h3>
              
              <div className="space-y-3">
                {SEASONAL_INSIGHTS.map((insight) => (
                  <div key={insight.item} className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                      <ArrowUp className="w-4 h-4 text-green-500" />
                    </div>
                    <div>
                      <p className={`font-medium text-sm ${darkMode ? 'text-white' : 'text-black'}`}>
                        {insight.item}
                      </p>
                      <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Best in {insight.bestMonth} (+{insight.increase})
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tips */}
            <div className={`rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} p-6`}>
              <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-black'}`}>
                <Info className="w-5 h-5" />
                Pricing Tips
              </h3>
              
              <ul className={`space-y-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                  <span>Price 10-15% below average for faster sales</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                  <span>Include shipping in your price analysis</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                  <span>Check completed listings, not active ones</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                  <span>Consider condition heavily in pricing</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                  <span>Seasonal items sell for 2-3x in season</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default PricingGuidePage;