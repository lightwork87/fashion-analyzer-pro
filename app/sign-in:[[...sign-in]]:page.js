'use client';

import { SignIn } from '@clerk/nextjs';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { 
  ArrowLeft,
  Moon,
  Sun,
  Sparkles,
  CheckCircle,
  Package,
  TrendingUp,
  Shield,
  Zap,
  Clock,
  BarChart3,
  Gift,
  ArrowRight
} from 'lucide-react';

const WELCOME_BACK_FEATURES = [
  {
    icon: Clock,
    title: 'Quick Access',
    description: 'Jump right back into your listings'
  },
  {
    icon: BarChart3,
    title: 'Track Progress',
    description: 'See your sales analytics and insights'
  },
  {
    icon: Package,
    title: 'Saved Drafts',
    description: 'Continue where you left off'
  },
  {
    icon: Gift,
    title: 'Member Benefits',
    description: 'Exclusive features and updates'
  }
];

const RECENT_UPDATES = [
  {
    date: 'January 2025',
    title: 'Batch Processing Live',
    description: 'Process up to 25 items at once with our new batch analysis feature'
  },
  {
    date: 'December 2024',
    title: 'Vinted Integration',
    description: 'Now supporting direct listing to Vinted UK'
  },
  {
    date: 'November 2024',
    title: 'Enhanced AI Model',
    description: 'Improved brand detection accuracy to 98%'
  }
];

export default function SignInPage() {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedDarkMode);
    if (savedDarkMode) {
      document.documentElement.classList.add('dark');
    }
  }, []);

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

  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      <div className="flex">
        {/* Left Side - Sign In Form */}
        <div className="w-full lg:w-1/2 flex flex-col">
          {/* Header */}
          <header className={`p-6 ${darkMode ? 'bg-black' : 'bg-white'}`}>
            <div className="flex items-center justify-between">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-black dark:bg-white rounded-lg flex items-center justify-center">
                  <span className="text-white dark:text-black font-bold text-sm">LL</span>
                </div>
                <span className={`font-bold text-lg ${darkMode ? 'text-white' : 'text-black'}`}>
                  LightLister AI
                </span>
              </Link>
              
              <button
                onClick={toggleDarkMode}
                className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
              >
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
            </div>
          </header>

          {/* Sign In Form */}
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="w-full max-w-md">
              <div className="text-center mb-8">
                <h1 className={`text-3xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-black'}`}>
                  Welcome back
                </h1>
                <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Sign in to continue listing with AI
                </p>
              </div>

              {/* Clerk SignIn Component */}
              <SignIn 
                appearance={{
                  baseTheme: darkMode ? 'dark' : undefined,
                  elements: {
                    formButtonPrimary: 
                      'bg-black hover:bg-gray-800 text-white dark:bg-white dark:hover:bg-gray-200 dark:text-black',
                    card: 'shadow-none',
                    headerTitle: 'hidden',
                    headerSubtitle: 'hidden',
                    socialButtonsBlockButton: 
                      'border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800',
                    formFieldInput:
                      'border-gray-300 dark:border-gray-600 dark:bg-gray-800',
                    footerActionLink:
                      'text-blue-600 hover:text-blue-700 dark:text-blue-400'
                  },
                  layout: {
                    socialButtonsPlacement: 'top',
                    socialButtonsVariant: 'blockButton'
                  }
                }}
                redirectUrl="/dashboard"
                afterSignInUrl="/dashboard"
              />

              {/* Quick Stats */}
              <div className={`mt-8 grid grid-cols-2 gap-4`}>
                <div className={`p-4 rounded-lg text-center ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                  <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-black'}`}>
                    250k+
                  </p>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Items Analyzed
                  </p>
                </div>
                <div className={`p-4 rounded-lg text-center ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                  <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-black'}`}>
                    98%
                  </p>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    AI Accuracy
                  </p>
                </div>
              </div>

              {/* Sign Up Link */}
              <p className={`text-center mt-6 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Don't have an account?{' '}
                <Link href="/sign-up" className="text-blue-600 hover:text-blue-700 dark:text-blue-400">
                  Sign up for free
                </Link>
              </p>

              {/* Demo Account */}
              <div className={`mt-6 p-4 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-300'}`}>
                <p className={`text-sm font-medium mb-2 ${darkMode ? 'text-white' : 'text-black'}`}>
                  Want to try first?
                </p>
                <p className={`text-sm mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Use our demo account to explore features
                </p>
                <button className={`w-full px-4 py-2 rounded-lg border ${
                  darkMode 
                    ? 'border-gray-600 hover:bg-gray-700' 
                    : 'border-gray-300 hover:bg-gray-200'
                } transition flex items-center justify-center gap-2`}>
                  View Demo
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <footer className={`p-6 text-center text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            <div className="flex items-center justify-center gap-4">
              <Link href="/help" className="hover:text-gray-900 dark:hover:text-gray-200">
                Help
              </Link>
              <span>•</span>
              <Link href="/privacy" className="hover:text-gray-900 dark:hover:text-gray-200">
                Privacy
              </Link>
              <span>•</span>
              <Link href="/terms" className="hover:text-gray-900 dark:hover:text-gray-200">
                Terms
              </Link>
            </div>
          </footer>
        </div>

        {/* Right Side - Welcome Back */}
        <div className={`hidden lg:block w-1/2 ${darkMode ? 'bg-black' : 'bg-gray-900'} text-white p-12`}>
          <div className="max-w-xl">
            <div className="flex items-center gap-2 mb-6">
              <Sparkles className="w-8 h-8 text-yellow-500" />
              <h2 className="text-4xl font-bold">
                Welcome back!
              </h2>
            </div>
            
            <p className="text-lg text-gray-300 mb-12">
              Your AI-powered listing assistant is ready to help you sell more, faster.
            </p>

            {/* Features */}
            <div className="grid grid-cols-2 gap-6 mb-12">
              {WELCOME_BACK_FEATURES.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div key={feature.title} className="flex items-start gap-3">
                    <div className="p-2 bg-white/10 rounded-lg">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1 text-sm">{feature.title}</h3>
                      <p className="text-xs text-gray-400">{feature.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Recent Updates */}
            <div>
              <h3 className="text-xl font-semibold mb-6">What's New</h3>
              <div className="space-y-6">
                {RECENT_UPDATES.map((update) => (
                  <div key={update.title} className="border-l-2 border-white/20 pl-4">
                    <p className="text-xs text-gray-400 mb-1">{update.date}</p>
                    <h4 className="font-semibold mb-1">{update.title}</h4>
                    <p className="text-sm text-gray-400">{update.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div className="mt-12 p-6 bg-white/10 rounded-lg">
              <h3 className="font-semibold mb-2">Need help getting started?</h3>
              <p className="text-sm text-gray-400 mb-4">
                Check out our quick start guide or join the community
              </p>
              <div className="flex gap-3">
                <Link 
                  href="/help"
                  className="px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition text-sm"
                >
                  View Guide
                </Link>
                <Link 
                  href="/community"
                  className="px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-200 transition text-sm"
                >
                  Join Discord
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}