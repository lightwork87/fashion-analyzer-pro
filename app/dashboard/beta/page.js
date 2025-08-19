'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { 
  Home,
  CreditCard,
  AlertCircle,
  CheckCircle,
  Sparkles,
  Gift,
  Users,
  Zap,
  Target,
  TrendingUp,
  MessageSquare,
  ChevronRight,
  Moon,
  Sun,
  Loader2,
  ArrowRight,
  Star,
  Shield,
  Clock,
  Award,
  X,
  Rocket,
  Brain,
  Database,
  Globe,
  Smartphone,
  BarChart3,
  FileText,
  Camera
} from 'lucide-react';

const BETA_FEATURES = [
  {
    title: 'Early Access',
    description: 'Get new features before general release',
    icon: Rocket,
    available: true
  },
  {
    title: 'Advanced AI Models',
    description: 'Test cutting-edge AI improvements',
    icon: Brain,
    available: true
  },
  {
    title: 'Bulk Operations Pro',
    description: 'Process up to 100 items at once',
    icon: Database,
    available: false,
    coming: 'Q2 2025'
  },
  {
    title: 'Multi-Platform Sync',
    description: 'List to eBay, Vinted, Depop simultaneously',
    icon: Globe,
    available: false,
    coming: 'Q2 2025'
  },
  {
    title: 'Mobile App Beta',
    description: 'iOS and Android apps for on-the-go listing',
    icon: Smartphone,
    available: false,
    coming: 'Q3 2025'
  },
  {
    title: 'Advanced Analytics',
    description: 'Deep insights into your sales performance',
    icon: BarChart3,
    available: true
  }
];

const BETA_BENEFITS = [
  {
    title: '50 Bonus Credits',
    value: '£12.50 value',
    icon: Gift
  },
  {
    title: 'Priority Support',
    value: '24/7 dedicated help',
    icon: MessageSquare
  },
  {
    title: 'Feature Requests',
    value: 'Direct input on roadmap',
    icon: Target
  },
  {
    title: 'Exclusive Community',
    value: 'Private Discord access',
    icon: Users
  }
];

const BETA_REQUIREMENTS = [
  'Active UK-based reseller',
  'List at least 10 items per month',
  'Provide regular feedback',
  'Test new features within 48 hours',
  'Join our Discord community'
];

export default function BetaApplicationPage() {
  const { user } = useUser();
  const router = useRouter();
  
  const [darkMode, setDarkMode] = useState(false);
  const [credits, setCredits] = useState(100);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [betaStatus, setBetaStatus] = useState(null); // null, 'pending', 'approved', 'rejected'
  const [errors, setErrors] = useState({});
  
  // Form fields
  const [formData, setFormData] = useState({
    businessName: '',
    monthlyVolume: '',
    platforms: [],
    experience: '',
    interests: [],
    feedback: '',
    discord: '',
    agreement: false
  });

  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedDarkMode);
    if (savedDarkMode) {
      document.documentElement.classList.add('dark');
    }
    
    // Check existing beta status
    checkBetaStatus();
  }, []);

  const checkBetaStatus = async () => {
    try {
      const response = await fetch('/api/beta/status');
      if (response.ok) {
        const data = await response.json();
        setBetaStatus(data.status);
        if (data.status === 'approved') {
          setSubmitted(true);
        }
      }
    } catch (error) {
      console.error('Error checking beta status:', error);
    }
  };

  const handlePlatformToggle = (platform) => {
    const platforms = [...formData.platforms];
    const index = platforms.indexOf(platform);
    if (index > -1) {
      platforms.splice(index, 1);
    } else {
      platforms.push(platform);
    }
    setFormData({ ...formData, platforms });
  };

  const handleInterestToggle = (interest) => {
    const interests = [...formData.interests];
    const index = interests.indexOf(interest);
    if (index > -1) {
      interests.splice(index, 1);
    } else {
      interests.push(interest);
    }
    setFormData({ ...formData, interests });
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.businessName) {
      newErrors.businessName = 'Business name is required';
    }
    
    if (!formData.monthlyVolume) {
      newErrors.monthlyVolume = 'Please select your monthly volume';
    }
    
    if (formData.platforms.length === 0) {
      newErrors.platforms = 'Select at least one platform';
    }
    
    if (!formData.experience) {
      newErrors.experience = 'Please describe your experience';
    }
    
    if (formData.interests.length === 0) {
      newErrors.interests = 'Select at least one area of interest';
    }
    
    if (!formData.discord) {
      newErrors.discord = 'Discord username is required for community access';
    }
    
    if (!formData.agreement) {
      newErrors.agreement = 'You must agree to the beta terms';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      const response = await fetch('/api/beta/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        setSubmitted(true);
        setBetaStatus('pending');
      } else {
        const error = await response.json();
        setErrors({ submit: error.message || 'Failed to submit application' });
      }
    } catch (error) {
      console.error('Error submitting application:', error);
      setErrors({ submit: 'An error occurred while submitting' });
    } finally {
      setLoading(false);
    }
  };

  // Success state
  if (submitted && betaStatus === 'approved') {
    return (
      <div className={`min-h-screen ${darkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
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
                <h1 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-black'}`}>
                  Beta Program
                </h1>
              </div>
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${
                darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-300'
              }`}>
                <CreditCard className="w-4 h-4" />
                <span className="font-medium">{credits} Credits</span>
              </div>
            </div>
          </div>
        </header>
        
        <main className="max-w-4xl mx-auto px-4 py-16">
          <div className={`text-center rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} p-12`}>
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            
            <h2 className={`text-3xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-black'}`}>
              Welcome to the Beta Program!
            </h2>
            
            <p className={`text-lg mb-8 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              You're now part of an exclusive group shaping the future of LightLister AI
            </p>
            
            <div className="space-y-4 max-w-md mx-auto">
              <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <p className={`font-medium ${darkMode ? 'text-white' : 'text-black'}`}>
                  50 bonus credits have been added to your account
                </p>
              </div>
              
              <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <p className={`font-medium mb-2 ${darkMode ? 'text-white' : 'text-black'}`}>
                  Join our Discord community:
                </p>
                <a 
                  href="https://discord.gg/lightlister"
                  target="_blank"
                  className="text-blue-600 hover:text-blue-700"
                >
                  discord.gg/lightlister
                </a>
              </div>
            </div>
            
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 mt-8"
            >
              Go to Dashboard
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </main>
      </div>
    );
  }

  // Pending state
  if (submitted || betaStatus === 'pending') {
    return (
      <div className={`min-h-screen ${darkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
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
                <h1 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-black'}`}>
                  Beta Program
                </h1>
              </div>
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${
                darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-300'
              }`}>
                <CreditCard className="w-4 h-4" />
                <span className="font-medium">{credits} Credits</span>
              </div>
            </div>
          </div>
        </header>
        
        <main className="max-w-4xl mx-auto px-4 py-16">
          <div className={`text-center rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} p-12`}>
            <div className="w-20 h-20 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <Clock className="w-10 h-10 text-yellow-600" />
            </div>
            
            <h2 className={`text-3xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-black'}`}>
              Application Under Review
            </h2>
            
            <p className={`text-lg mb-8 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Thank you for applying! We're reviewing your application and will notify you within 24-48 hours.
            </p>
            
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800"
            >
              Back to Dashboard
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </main>
      </div>
    );
  }

  // Application form
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
              
              <h1 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-black'}`}>
                Beta Program Application
              </h1>
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
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="w-8 h-8 text-yellow-500" />
            <h2 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-black'}`}>
              Join the LightLister AI Beta Program
            </h2>
            <Sparkles className="w-8 h-8 text-yellow-500" />
          </div>
          
          <p className={`text-lg ${darkMode ? 'text-gray-300' : 'text-gray-700'} max-w-2xl mx-auto`}>
            Be among the first to test new features, shape our roadmap, and get exclusive benefits
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {BETA_BENEFITS.map((benefit) => {
            const Icon = benefit.icon;
            return (
              <div
                key={benefit.title}
                className={`rounded-lg border p-6 text-center ${
                  darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                }`}
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${
                  darkMode ? 'bg-gray-700' : 'bg-gray-100'
                }`}>
                  <Icon className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className={`font-semibold mb-1 ${darkMode ? 'text-white' : 'text-black'}`}>
                  {benefit.title}
                </h3>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {benefit.value}
                </p>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Business Information */}
              <div className={`rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} p-6`}>
                <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-black'}`}>
                  Business Information
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Business Name *
                    </label>
                    <input
                      type="text"
                      value={formData.businessName}
                      onChange={(e) => setFormData({...formData, businessName: e.target.value})}
                      placeholder="Your eBay/Vinted store name"
                      className={`w-full mt-1 px-3 py-2 rounded-lg border ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-gray-50 border-gray-300 text-black'
                      } ${errors.businessName ? 'border-red-500' : ''}`}
                    />
                    {errors.businessName && (
                      <p className="text-sm text-red-500 mt-1">{errors.businessName}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Monthly Listing Volume *
                    </label>
                    <select
                      value={formData.monthlyVolume}
                      onChange={(e) => setFormData({...formData, monthlyVolume: e.target.value})}
                      className={`w-full mt-1 px-3 py-2 rounded-lg border ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-gray-50 border-gray-300 text-black'
                      } ${errors.monthlyVolume ? 'border-red-500' : ''}`}
                    >
                      <option value="">Select volume</option>
                      <option value="10-50">10-50 items</option>
                      <option value="50-100">50-100 items</option>
                      <option value="100-500">100-500 items</option>
                      <option value="500+">500+ items</option>
                    </select>
                    {errors.monthlyVolume && (
                      <p className="text-sm text-red-500 mt-1">{errors.monthlyVolume}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Platforms You Use *
                    </label>
                    <div className="mt-2 space-y-2">
                      {['eBay', 'Vinted', 'Depop', 'Mercari', 'Facebook Marketplace', 'Other'].map((platform) => (
                        <label key={platform} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={formData.platforms.includes(platform)}
                            onChange={() => handlePlatformToggle(platform)}
                            className="rounded"
                          />
                          <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            {platform}
                          </span>
                        </label>
                      ))}
                    </div>
                    {errors.platforms && (
                      <p className="text-sm text-red-500 mt-1">{errors.platforms}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Experience */}
              <div className={`rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} p-6`}>
                <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-black'}`}>
                  Your Experience
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Tell us about your reselling experience *
                    </label>
                    <textarea
                      value={formData.experience}
                      onChange={(e) => setFormData({...formData, experience: e.target.value})}
                      rows={4}
                      placeholder="How long have you been reselling? What types of items do you specialize in?"
                      className={`w-full mt-1 px-3 py-2 rounded-lg border ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-gray-50 border-gray-300 text-black'
                      } ${errors.experience ? 'border-red-500' : ''}`}
                    />
                    {errors.experience && (
                      <p className="text-sm text-red-500 mt-1">{errors.experience}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Features You're Most Interested In *
                    </label>
                    <div className="mt-2 space-y-2">
                      {BETA_FEATURES.map((feature) => (
                        <label key={feature.title} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={formData.interests.includes(feature.title)}
                            onChange={() => handleInterestToggle(feature.title)}
                            disabled={!feature.available}
                            className="rounded"
                          />
                          <span className={`text-sm ${
                            !feature.available 
                              ? 'text-gray-400' 
                              : darkMode ? 'text-gray-300' : 'text-gray-700'
                          }`}>
                            {feature.title}
                            {feature.coming && (
                              <span className="text-xs ml-2">({feature.coming})</span>
                            )}
                          </span>
                        </label>
                      ))}
                    </div>
                    {errors.interests && (
                      <p className="text-sm text-red-500 mt-1">{errors.interests}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Additional Feedback
                    </label>
                    <textarea
                      value={formData.feedback}
                      onChange={(e) => setFormData({...formData, feedback: e.target.value})}
                      rows={3}
                      placeholder="Any specific features you'd like to see? Pain points with current tools?"
                      className={`w-full mt-1 px-3 py-2 rounded-lg border ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-gray-50 border-gray-300 text-black'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Community */}
              <div className={`rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} p-6`}>
                <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-black'}`}>
                  Community Access
                </h3>
                
                <div>
                  <label className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Discord Username *
                  </label>
                  <input
                    type="text"
                    value={formData.discord}
                    onChange={(e) => setFormData({...formData, discord: e.target.value})}
                    placeholder="username#1234"
                    className={`w-full mt-1 px-3 py-2 rounded-lg border ${
                      darkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-gray-50 border-gray-300 text-black'
                    } ${errors.discord ? 'border-red-500' : ''}`}
                  />
                  {errors.discord && (
                    <p className="text-sm text-red-500 mt-1">{errors.discord}</p>
                  )}
                  <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    We'll send you an invite to our private Discord server
                  </p>
                </div>
              </div>

              {/* Agreement */}
              <div className={`rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} p-6`}>
                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={formData.agreement}
                    onChange={(e) => setFormData({...formData, agreement: e.target.checked})}
                    className="mt-1 rounded"
                  />
                  <div>
                    <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      I agree to actively participate in the beta program, provide constructive feedback, 
                      and understand that beta features may change or be removed. I commit to testing new 
                      features within 48 hours of release and maintaining confidentiality about unreleased features.
                    </p>
                  </div>
                </label>
                {errors.agreement && (
                  <p className="text-sm text-red-500 mt-2">{errors.agreement}</p>
                )}
              </div>

              {/* Error message */}
              {errors.submit && (
                <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                  <p className="text-sm text-red-600 dark:text-red-400">{errors.submit}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting Application...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Submit Beta Application
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Requirements */}
            <div className={`rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} p-6`}>
              <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-black'}`}>
                <Shield className="w-5 h-5" />
                Beta Requirements
              </h3>
              
              <ul className="space-y-2">
                {BETA_REQUIREMENTS.map((req) => (
                  <li key={req} className={`flex items-start gap-2 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Current Features */}
            <div className={`rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} p-6`}>
              <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-black'}`}>
                Available Beta Features
              </h3>
              
              <div className="space-y-3">
                {BETA_FEATURES.filter(f => f.available).map((feature) => {
                  const Icon = feature.icon;
                  return (
                    <div key={feature.title} className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                        <Icon className="w-4 h-4 text-purple-600" />
                      </div>
                      <div>
                        <p className={`font-medium text-sm ${darkMode ? 'text-white' : 'text-black'}`}>
                          {feature.title}
                        </p>
                        <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* FAQ */}
            <div className={`rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} p-6`}>
              <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-black'}`}>
                Beta FAQ
              </h3>
              
              <div className="space-y-4">
                <div>
                  <p className={`font-medium text-sm mb-1 ${darkMode ? 'text-white' : 'text-black'}`}>
                    How long is the beta period?
                  </p>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    The beta program is ongoing with new features added monthly.
                  </p>
                </div>
                
                <div>
                  <p className={`font-medium text-sm mb-1 ${darkMode ? 'text-white' : 'text-black'}`}>
                    Is there a cost?
                  </p>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    No! Beta testers get 50 free credits and early access at no charge.
                  </p>
                </div>
                
                <div>
                  <p className={`font-medium text-sm mb-1 ${darkMode ? 'text-white' : 'text-black'}`}>
                    Can I leave the program?
                  </p>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Yes, you can opt out anytime from your settings.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}