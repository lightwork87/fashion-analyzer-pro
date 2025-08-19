'use client';
'use client'; // ✅ CRITICAL: Must be first line

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Home,
  CreditCard,
  Sparkles,
  Zap,
  Brain,
  Rocket,
  ChevronRight,
  Moon,
  Sun,
  AlertCircle,
  CheckCircle,
  Info,
  Star,
  TrendingUp,
  Shield,
  Clock,
  Users,
  MessageSquare,
  Send, // ✅ FIXED: Added Send import
  Loader2,
  ExternalLink,
  Lock,
  Unlock,
  ArrowRight
} from 'lucide-react';

export default function BetaPage() {
  const { user } = useUser();
  const router = useRouter();
  
  // ✅ FIXED: Initialize without localStorage
  const [darkMode, setDarkMode] = useState(false);
  const [credits, setCredits] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

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

  const betaFeatures = [
    {
      id: 'ai-chat',
      title: 'AI Chat Assistant',
      description: 'Get instant help with listing optimization, pricing strategies, and fashion trends',
      status: 'testing',
      releaseDate: 'January 2025',
      icon: MessageSquare,
      color: 'blue',
      available: true
    },
    {
      id: 'bulk-export',
      title: 'Bulk Export to Marketplaces',
      description: 'Export 100+ listings directly to eBay, Vinted, and Depop with one click',
      status: 'development',
      releaseDate: 'February 2025',
      icon: Rocket,
      color: 'purple',
      available: false
    },
    {
      id: 'auto-pricing',
      title: 'Smart Auto-Pricing',
      description: 'AI analyzes market trends and competitors to suggest optimal pricing in real-time',
      status: 'testing',
      releaseDate: 'January 2025',
      icon: TrendingUp,
      color: 'green',
      available: true
    },
    {
      id: 'photo-enhance',
      title: 'AI Photo Enhancement',
      description: 'Automatically improve lighting, remove backgrounds, and create professional product photos',
      status: 'planning',
      releaseDate: 'March 2025',
      icon: Sparkles,
      color: 'yellow',
      available: false
    },
    {
      id: 'inventory-sync',
      title: 'Cross-Platform Inventory Sync',
      description: 'Sync your inventory across all marketplaces automatically',
      status: 'testing',
      releaseDate: 'January 2025',
      icon: Shield,
      color: 'indigo',
      available: true
    },
    {
      id: 'analytics-pro',
      title: 'Advanced Analytics Dashboard',
      description: 'Detailed insights on sales performance, trending items, and buyer behavior',
      status: 'development',
      releaseDate: 'February 2025',
      icon: Brain,
      color: 'pink',
      available: false
    }
  ];

  const handleFeatureRequest = (featureId) => {
    setSelectedFeature(featureId);
    // Could open a modal or navigate to a feedback form
  };

  const handleFeedbackSubmit = async () => {
    if (!feedback.trim()) return;

    setIsSubmitting(true);
    
    try {
      // In production, this would send to your backend
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSubmitSuccess(true);
      setFeedback('');
      
      setTimeout(() => {
        setSubmitSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Error submitting feedback:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      testing: { bg: 'bg-blue-100 dark:bg-blue-900', text: 'text-blue-700 dark:text-blue-300', label: 'In Testing' },
      development: { bg: 'bg-purple-100 dark:bg-purple-900', text: 'text-purple-700 dark:text-purple-300', label: 'In Development' },
      planning: { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-700 dark:text-gray-300', label: 'Planning' },
      live: { bg: 'bg-green-100 dark:bg-green-900', text: 'text-green-700 dark:text-green-300', label: 'Live' }
    };
    
    return badges[status] || badges.planning;
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
                <Zap className="w-5 h-5 text-yellow-500" />
                <h1 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-black'}`}>
                  Beta Features
                </h1>
                <span className={`text-xs px-2 py-1 rounded-full ${darkMode ? 'bg-yellow-900 text-yellow-300' : 'bg-yellow-100 text-yellow-700'}`}>
                  Early Access
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
          <span className={darkMode ? 'text-white' : 'text-black'}>Beta Features</span>
        </nav>

        {/* Info Banner */}
        <div className={`rounded-lg border ${darkMode ? 'bg-gradient-to-r from-yellow-900/20 to-orange-900/20 border-yellow-800' : 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200'} p-6 mb-8`}>
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-lg ${darkMode ? 'bg-yellow-900/50' : 'bg-yellow-100'}`}>
              <Zap className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="flex-1">
              <h2 className={`text-xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Welcome to Beta Features
              </h2>
              <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-4`}>
                Get early access to cutting-edge features before they're released to everyone. 
                Help shape the future of LightLister AI by testing new capabilities and providing feedback.
              </p>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-yellow-600" />
                  <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    247 beta testers active
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-600" />
                  <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Exclusive early access
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {betaFeatures.map((feature) => {
            const Icon = feature.icon;
            const statusBadge = getStatusBadge(feature.status);
            
            return (
              <div
                key={feature.id}
                className={`rounded-lg border ${
                  darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                } p-6 relative ${
                  !feature.available ? 'opacity-75' : ''
                }`}
              >
                {/* Status Badge */}
                <div className={`absolute top-4 right-4 px-2 py-1 rounded-full text-xs font-medium ${statusBadge.bg} ${statusBadge.text}`}>
                  {statusBadge.label}
                </div>

                {/* Icon */}
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${
                  feature.color === 'blue' ? 'bg-blue-100 dark:bg-blue-900' :
                  feature.color === 'purple' ? 'bg-purple-100 dark:bg-purple-900' :
                  feature.color === 'green' ? 'bg-green-100 dark:bg-green-900' :
                  feature.color === 'yellow' ? 'bg-yellow-100 dark:bg-yellow-900' :
                  feature.color === 'indigo' ? 'bg-indigo-100 dark:bg-indigo-900' :
                  'bg-pink-100 dark:bg-pink-900'
                }`}>
                  <Icon className={`w-6 h-6 ${
                    feature.color === 'blue' ? 'text-blue-600' :
                    feature.color === 'purple' ? 'text-purple-600' :
                    feature.color === 'green' ? 'text-green-600' :
                    feature.color === 'yellow' ? 'text-yellow-600' :
                    feature.color === 'indigo' ? 'text-indigo-600' :
                    'text-pink-600'
                  }`} />
                </div>

                {/* Content */}
                <h3 className={`text-lg font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {feature.title}
                </h3>
                <p className={`text-sm mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {feature.description}
                </p>

                {/* Release Date */}
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                    Expected: {feature.releaseDate}
                  </span>
                </div>

                {/* Action Button */}
                {feature.available ? (
                  <button className="w-full px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:opacity-80 transition flex items-center justify-center gap-2">
                    <Unlock className="w-4 h-4" />
                    Try Now
                  </button>
                ) : (
                  <button
                    onClick={() => handleFeatureRequest(feature.id)}
                    className={`w-full px-4 py-2 rounded-lg border ${
                      darkMode 
                        ? 'border-gray-600 hover:bg-gray-700' 
                        : 'border-gray-300 hover:bg-gray-100'
                    } transition flex items-center justify-center gap-2`}
                  >
                    <Lock className="w-4 h-4" />
                    Request Access
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Feedback Section */}
        <div className={`rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} p-6`}>
          <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Share Your Feedback
          </h3>
          <p className={`text-sm mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Your input helps us improve these features before the official release
          </p>
          
          <div className="flex gap-4">
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Tell us what you think about the beta features..."
              className={`flex-1 px-4 py-3 rounded-lg border resize-none ${
                darkMode 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                  : 'bg-gray-50 border-gray-300 text-black placeholder-gray-500'
              }`}
              rows={3}
            />
            
            <button
              onClick={handleFeedbackSubmit}
              disabled={isSubmitting || !feedback.trim()}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Send
            </button>
          </div>

          {submitSuccess && (
            <div className="mt-4 p-3 bg-green-100 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-sm text-green-800 dark:text-green-200">
                Thank you for your feedback! We'll review it carefully.
              </span>
            </div>
          )}
        </div>

        {/* Benefits */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
            <Star className="w-6 h-6 text-yellow-600 mb-2" />
            <h4 className={`font-semibold mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Early Access
            </h4>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Be the first to try new features
            </p>
          </div>
          
          <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
            <MessageSquare className="w-6 h-6 text-blue-600 mb-2" />
            <h4 className={`font-semibold mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Direct Feedback
            </h4>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Shape the features you use
            </p>
          </div>
          
          <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
            <Zap className="w-6 h-6 text-purple-600 mb-2" />
            <h4 className={`font-semibold mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Exclusive Benefits
            </h4>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Special pricing for beta testers
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}