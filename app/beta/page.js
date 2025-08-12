'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import Image from 'next/image';
import { supabase } from '../lib/supabase';

export default function BetaProgram() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [existingRequest, setExistingRequest] = useState(null);
  const [formData, setFormData] = useState({
    business_type: '',
    monthly_volume: '',
    platforms: [],
    feedback_commitment: '',
    additional_info: ''
  });

  useEffect(() => {
    if (isLoaded && !user) {
      router.push('/sign-in');
    }
    if (user) {
      checkExistingRequest();
    }
  }, [user, isLoaded]);

  const checkExistingRequest = async () => {
    try {
      const { data, error } = await supabase
        .from('beta_requests')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (data) {
        setExistingRequest(data);
      }
    } catch (err) {
      console.error('Error checking beta request:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('beta_requests')
        .insert({
          user_id: user.id,
          email: user.emailAddresses[0].emailAddress,
          business_type: formData.business_type,
          monthly_volume: formData.monthly_volume,
          platforms: formData.platforms,
          feedback_commitment: formData.feedback_commitment,
          additional_info: formData.additional_info,
          status: 'pending'
        });

      if (!error) {
        setSubmitted(true);
      } else {
        throw error;
      }
    } catch (err) {
      console.error('Error submitting beta request:', err);
      alert('Failed to submit request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePlatformToggle = (platform) => {
    setFormData(prev => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter(p => p !== platform)
        : [...prev.platforms, platform]
    }));
  };

  if (!isLoaded || !user) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (existingRequest) {
    return (
      <main className="min-h-screen bg-gray-100">
        <div className="max-w-3xl mx-auto p-6">
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="mb-6">
              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${
                existingRequest.status === 'approved' ? 'bg-green-100' : 
                existingRequest.status === 'denied' ? 'bg-red-100' : 'bg-yellow-100'
              } mb-4`}>
                {existingRequest.status === 'approved' ? (
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : existingRequest.status === 'denied' ? (
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </div>
            </div>

            <h2 className="text-2xl font-bold mb-4">
              {existingRequest.status === 'approved' ? 'Welcome to the Beta Program!' :
               existingRequest.status === 'denied' ? 'Beta Application Status' :
               'Application Under Review'}
            </h2>

            <p className="text-gray-600 mb-6">
              {existingRequest.status === 'approved' ? 
                `Congratulations! You've been approved for the beta program. You should have received ${existingRequest.credits_granted || 50} free credits to test LightLister AI.` :
               existingRequest.status === 'denied' ? 
                'Thank you for your interest. Unfortunately, we cannot accept your beta application at this time.' :
                'Thank you for applying! We\'re reviewing your application and will notify you soon.'}
            </p>

            {existingRequest.status === 'approved' && (
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-900 mb-2">Beta Tester Responsibilities:</h3>
                  <ul className="text-sm text-blue-800 space-y-1 text-left">
                    <li>• Test all features thoroughly</li>
                    <li>• Report bugs and issues</li>
                    <li>• Provide detailed feedback</li>
                    <li>• Share suggestions for improvements</li>
                  </ul>
                </div>
                
                <button
                  onClick={() => router.push('/dashboard')}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Go to Dashboard
                </button>
              </div>
            )}

            {existingRequest.status === 'pending' && (
              <p className="text-sm text-gray-500">
                Applied on: {new Date(existingRequest.created_at).toLocaleDateString('en-GB')}
              </p>
            )}
          </div>
        </div>
      </main>
    );
  }

  if (submitted) {
    return (
      <main className="min-h-screen bg-gray-100">
        <div className="max-w-3xl mx-auto p-6">
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <h2 className="text-2xl font-bold mb-4">Application Submitted!</h2>
            <p className="text-gray-600 mb-6">
              Thank you for applying to the LightLister AI beta program. We'll review your application and get back to you within 24 hours.
            </p>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Image 
                src="/logo.png" 
                alt="LightLister AI" 
                width={40} 
                height={40}
                className="h-10 w-auto"
              />
              <h1 className="text-2xl font-bold text-gray-900">LightLister AI</h1>
              <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                Beta Program
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow">
          <div className="p-8">
            <h2 className="text-3xl font-bold mb-2">Join Our Beta Testing Program</h2>
            <p className="text-gray-600 mb-8">
              Help us improve LightLister AI and get free credits to test all features!
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="text-center p-4">
                <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl font-bold text-blue-600">50</span>
                </div>
                <h3 className="font-semibold">Free Credits</h3>
                <p className="text-sm text-gray-600">Test all features extensively</p>
              </div>
              <div className="text-center p-4">
                <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="font-semibold">Early Access</h3>
                <p className="text-sm text-gray-600">Try new features first</p>
              </div>
              <div className="text-center p-4">
                <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                  <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </div>
                <h3 className="font-semibold">Beta Badge</h3>
                <p className="text-sm text-gray-600">Exclusive beta tester status</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  What type of reselling business do you run? <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.business_type}
                  onChange={(e) => handleInputChange('business_type', e.target.value)}
                  required
                  className="w-full p-2 border rounded-lg"
                >
                  <option value="">Select...</option>
                  <option value="individual">Individual Seller</option>
                  <option value="small_business">Small Business (1-5 employees)</option>
                  <option value="medium_business">Medium Business (6-20 employees)</option>
                  <option value="large_business">Large Business (20+ employees)</option>
                  <option value="charity">Charity Shop</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  How many items do you list per month? <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.monthly_volume}
                  onChange={(e) => handleInputChange('monthly_volume', e.target.value)}
                  required
                  className="w-full p-2 border rounded-lg"
                >
                  <option value="">Select...</option>
                  <option value="0-50">0-50 items</option>
                  <option value="51-200">51-200 items</option>
                  <option value="201-500">201-500 items</option>
                  <option value="501-1000">501-1000 items</option>
                  <option value="1000+">1000+ items</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Which platforms do you sell on? <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2">
                  {['eBay', 'Vinted', 'Depop', 'Facebook Marketplace', 'Mercari', 'Other'].map((platform) => (
                    <label key={platform} className="flex items-center">
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  How often can you provide feedback? <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.feedback_commitment}
                  onChange={(e) => handleInputChange('feedback_commitment', e.target.value)}
                  required
                  className="w-full p-2 border rounded-lg"
                >
                  <option value="">Select...</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="biweekly">Bi-weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Anything else you'd like us to know?
                </label>
                <textarea
                  value={formData.additional_info}
                  onChange={(e) => handleInputChange('additional_info', e.target.value)}
                  rows={4}
                  className="w-full p-2 border rounded-lg"
                  placeholder="Tell us about your experience with similar tools, specific features you're excited to test, etc."
                />
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> We're looking for active sellers who can provide detailed feedback. 
                  Selected testers will receive 50 free credits (worth £12.50) to thoroughly test all features.
                </p>
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={loading || formData.platforms.length === 0}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {loading ? 'Submitting...' : 'Apply for Beta Program'}
                </button>
                <button
                  type="button"
                  onClick={() => router.push('/dashboard')}
                  className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}