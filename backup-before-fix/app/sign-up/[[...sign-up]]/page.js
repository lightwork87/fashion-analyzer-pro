'use client';

import { SignUp } from '@clerk/nextjs';
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
  Users,
  Award,
  Camera
} from 'lucide-react';

const FEATURES = [
  {
    icon: Camera,
    title: 'AI-Powered Analysis',
    description: 'Instant brand, size, and value detection'
  },
  {
    icon: Package,
    title: 'Multi-Platform Listing',
    description: 'List on eBay UK and Vinted with one click'
  },
  {
    icon: TrendingUp,
    title: 'UK Price Data',
    description: 'Real eBay sold prices from last 90 days'
  },
  {
    icon: Shield,
    title: 'Secure & Private',
    description: 'Your data is encrypted and never shared'
  }
];

const TESTIMONIALS = [
  {
    name: 'Sarah M.',
    role: 'eBay PowerSeller',
    content: 'LightLister AI has transformed my reselling business. I list 3x faster now!',
    rating: 5
  },
  {
    name: 'James T.',
    role: 'Vinted Seller',
    content: 'The AI accuracy is incredible. It identifies brands I would have missed.',
    rating: 5
  },
  {
    name: 'Emma L.',
    role: 'Fashion Reseller',
    content: 'The pricing guide alone is worth it. I\'ve increased profits by 40%.',
    rating: 5
  }
];

export default function SignUpPage() {
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
        {/* Left Side - Sign Up Form */}
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

          {/* Sign Up Form */}
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="w-full max-w-md">
              <div className="text-center mb-8">
                <h1 className={`text-3xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-black'}`}>
                  Create your account
                </h1>
                <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Join thousands of UK resellers using AI to boost sales
                </p>
              </div>

              {/* Clerk SignUp Component */}
              <SignUp 
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
                afterSignUpUrl="/dashboard"
              />

              {/* Benefits */}
              <div className={`mt-8 p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                <h3 className={`font-semibold mb-3 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-black'}`}>
                  <Sparkles className="w-5 h-5 text-yellow-500" />
                  Sign up today and get:
                </h3>
                <ul className={`space-y-2 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    50 free credits (£12.50 value)
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Access to beta features
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    UK pricing guide access
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    No credit card required
                  </li>
                </ul>
              </div>

              {/* Sign In Link */}
              <p className={`text-center mt-6 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Already have an account?{' '}
                <Link href="/sign-in" className="text-blue-600 hover:text-blue-700 dark:text-blue-400">
                  Sign in
                </Link>
              </p>
            </div>
          </div>

          {/* Footer */}
          <footer className={`p-6 text-center text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            <p>
              By signing up, you agree to our{' '}
              <Link href="/terms" className="text-blue-600 hover:text-blue-700 dark:text-blue-400">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="text-blue-600 hover:text-blue-700 dark:text-blue-400">
                Privacy Policy
              </Link>
            </p>
          </footer>
        </div>

        {/* Right Side - Features */}
        <div className={`hidden lg:block w-1/2 ${darkMode ? 'bg-black' : 'bg-gray-900'} text-white p-12`}>
          <div className="max-w-xl">
            <h2 className="text-4xl font-bold mb-6">
              Start listing smarter, not harder
            </h2>
            
            <p className="text-lg text-gray-300 mb-12">
              LightLister AI uses advanced computer vision to analyze your fashion items 
              and create perfect listings in seconds.
            </p>

            {/* Features */}
            <div className="space-y-6 mb-12">
              {FEATURES.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div key={feature.title} className="flex items-start gap-4">
                    <div className="p-3 bg-white/10 rounded-lg">
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">{feature.title}</h3>
                      <p className="text-sm text-gray-400">{feature.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 mb-12">
              <div>
                <p className="text-3xl font-bold">10k+</p>
                <p className="text-sm text-gray-400">Active Users</p>
              </div>
              <div>
                <p className="text-3xl font-bold">250k+</p>
                <p className="text-sm text-gray-400">Items Analyzed</p>
              </div>
              <div>
                <p className="text-3xl font-bold">98%</p>
                <p className="text-sm text-gray-400">Accuracy Rate</p>
              </div>
            </div>

            {/* Testimonials */}
            <div className="space-y-4">
              {TESTIMONIALS.map((testimonial) => (
                <div key={testimonial.name} className="bg-white/10 rounded-lg p-4">
                  <div className="flex gap-1 mb-2">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Award key={i} className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                    ))}
                  </div>
                  <p className="text-sm mb-2">{testimonial.content}</p>
                  <p className="text-xs text-gray-400">
                    {testimonial.name} - {testimonial.role}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}