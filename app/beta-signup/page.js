// app/beta-signup/page.js
// COMPLETE BETA SIGNUP PAGE WITH FORM

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Loader2, 
  Check, 
  Store, 
  TrendingUp, 
  Zap,
  Users,
  Star,
  ArrowRight
} from 'lucide-react';

export default function BetaSignupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    business_type: 'individual',
    monthly_items: '0-25',
    platforms: [],
    experience_level: 'beginner',
    biggest_challenge: '',
    features_interested: [],
    referral_source: 'search',
    additional_notes: ''
  });

  const handlePlatformToggle = (platform) => {
    setFormData(prev => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter(p => p !== platform)
        : [...prev.platforms, platform]
    }));
  };

  const handleFeatureToggle = (feature) => {
    setFormData(prev => ({
      ...prev,
      features_interested: prev.features_interested.includes(feature)
        ? prev.features_interested.filter(f => f !== feature)
        : [...prev.features_interested, feature]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/beta-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to sign up');
      }
      
      setSuccess(true);
      
      // Redirect after 3 seconds
      setTimeout(() => {
        router.push('/');
      }, 3000);
      
    } catch (err) {
      console.error('Signup error:', err);
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome to the Beta!
          </h2>
          <p className="text-gray-600 mb-6">
            Thank you for signing up, {formData.name || 'there'}! We'll send you an 
            invite to {formData.email} soon.
          </p>
          <p className="text-sm text-gray-500">
            Redirecting to homepage...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </Link>
            <h1 className="text-xl font-bold text-gray-900">LightLister AI</h1>
            <div className="w-16" />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Join the LightLister AI Beta
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Be among the first to revolutionize your reselling business with AI-powered listings
          </p>
          
          {/* Benefits */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <Store className="w-10 h-10 text-blue-600 mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Early Access</h3>
              <p className="text-sm text-gray-600">
                Get exclusive early access to all features before public launch
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <TrendingUp className="w-10 h-10 text-green-600 mx-auto mb-3" />
              <h3 className="font-semibold mb-2">50% Off Forever</h3>
              <p className="text-sm text-gray-600">
                Lock in beta pricing - 50% off for life as a founding member
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <Zap className="w-10 h-10 text-purple-600 mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Shape the Product</h3>
              <p className="text-sm text-gray-600">
                Your feedback will directly influence features and development
              </p>
            </div>
          </div>
        </div>

        {/* Signup Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Reserve Your Spot
          </h2>
          
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="you@example.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="John Doe"
                />
              </div>
            </div>

            {/* Business Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Business Type
              </label>
              <select
                value={formData.business_type}
                onChange={(e) => setFormData({ ...formData, business_type: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="individual">Individual Seller</option>
                <option value="small_business">Small Business</option>
                <option value="boutique">Boutique/Store</option>
                <option value="charity">Charity Shop</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Monthly Items */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                How many items do you list per month?
              </label>
              <select
                value={formData.monthly_items}
                onChange={(e) => setFormData({ ...formData, monthly_items: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="0-25">0-25 items</option>
                <option value="26-50">26-50 items</option>
                <option value="51-100">51-100 items</option>
                <option value="101-250">101-250 items</option>
                <option value="250+">250+ items</option>
              </select>
            </div>

            {/* Platforms */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Which platforms do you sell on? (Select all that apply)
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {['eBay UK', 'Vinted', 'Depop', 'Facebook Marketplace', 'Etsy', 'Other'].map((platform) => (
                  <label
                    key={platform}
                    className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                  >
                    <input
                      type="checkbox"
                      checked={formData.platforms.includes(platform)}
                      onChange={() => handlePlatformToggle(platform)}
                      className="mr-2"
                    />
                    <span className="text-sm">{platform}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Experience Level */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Experience Level
              </label>
              <select
                value={formData.experience_level}
                onChange={(e) => setFormData({ ...formData, experience_level: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="beginner">Beginner (Less than 1 year)</option>
                <option value="intermediate">Intermediate (1-3 years)</option>
                <option value="experienced">Experienced (3-5 years)</option>
                <option value="expert">Expert (5+ years)</option>
              </select>
            </div>

            {/* Features Interested */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Which features interest you most? (Select all that apply)
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  'AI Brand Detection',
                  'Bulk Processing (25 items)',
                  'Auto-pricing',
                  'eBay Direct Listing',
                  'Vinted CSV Export',
                  'Inventory Management',
                  'Sales Analytics',
                  'Photo Enhancement'
                ].map((feature) => (
                  <label
                    key={feature}
                    className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                  >
                    <input
                      type="checkbox"
                      checked={formData.features_interested.includes(feature)}
                      onChange={() => handleFeatureToggle(feature)}
                      className="mr-2"
                    />
                    <span className="text-sm">{feature}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Additional Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Anything else you'd like us to know? (Optional)
              </label>
              <textarea
                value={formData.additional_notes}
                onChange={(e) => setFormData({ ...formData, additional_notes: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Tell us about your reselling needs..."
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-6 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Joining Beta...
                </>
              ) : (
                <>
                  Join Beta Access
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Trust Indicators */}
        <div className="mt-12 text-center">
          <p className="text-sm text-gray-600 mb-4">
            Join 500+ resellers already on the waitlist
          </p>
          <div className="flex justify-center items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
            ))}
            <span className="ml-2 text-sm text-gray-600">
              4.9/5 from early testers
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}