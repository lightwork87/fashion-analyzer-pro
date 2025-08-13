'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import Image from 'next/image';

export default function BetaPage() {
  const { user } = useUser();
  const [formData, setFormData] = useState({
    businessType: '',
    monthlyVolume: '',
    platforms: [],
    feedbackCommitment: '',
    additionalInfo: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      const response = await fetch('/api/beta/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          userId: user?.id,
          email: user?.emailAddresses[0]?.emailAddress
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSubmitStatus({
          type: 'success',
          message: 'Application submitted successfully! We\'ll review your application and get back to you within 24-48 hours.'
        });
        setFormData({
          businessType: '',
          monthlyVolume: '',
          platforms: [],
          feedbackCommitment: '',
          additionalInfo: ''
        });
      } else {
        setSubmitStatus({
          type: 'error',
          message: data.error || 'Failed to submit application. Please try again.'
        });
      }
    } catch (error) {
      setSubmitStatus({
        type: 'error',
        message: 'An error occurred. Please try again later.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePlatformChange = (platform) => {
    setFormData(prev => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter(p => p !== platform)
        : [...prev.platforms, platform]
    }));
  };

  const handleReportIssue = () => {
    window.location.href = 'mailto:lightlisterai@outlook.com?subject=LightLister%20AI%20-%20Beta%20Feedback';
  };

  const handleContactUs = () => {
    window.location.href = 'mailto:lightlisterai@outlook.com?subject=LightLister%20AI%20-%20Beta%20Program%20Question';
  };

  return (
    <main className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/" className="flex items-center gap-3">
                <Image 
                  src="/logo.png" 
                  alt="LightLister AI" 
                  width={40} 
                  height={40}
                  className="h-10 w-auto"
                />
                <h1 className="text-2xl font-bold text-gray-900">LightLister AI</h1>
              </Link>
              <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs rounded-full font-semibold">
                BETA PROGRAM
              </span>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={handleReportIssue}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Report Issue
              </button>
              <Link 
                href="/"
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-3xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-sm border p-8">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <svg className="w-16 h-16 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold mb-2">Join Our Beta Testing Program</h2>
            <p className="text-lg text-gray-600">Get 50 free credits (worth £12.50) and help shape the future of LightLister AI</p>
          </div>

          {!user ? (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">Please sign in to apply for the beta program</p>
              <Link 
                href="/sign-in"
                className="inline-block px-6 py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
              >
                Sign In to Apply
              </Link>
            </div>
          ) : (
            <>
              {submitStatus && (
                <div className={`mb-6 p-4 rounded-md ${submitStatus.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                  {submitStatus.message}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Business Type *
                  </label>
                  <select
                    required
                    value={formData.businessType}
                    onChange={(e) => setFormData({...formData, businessType: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                  >
                    <option value="">Select your business type</option>
                    <option value="individual">Individual Seller</option>
                    <option value="small_business">Small Business (1-5 employees)</option>
                    <option value="medium_business">Medium Business (6-20 employees)</option>
                    <option value="large_business">Large Business (20+ employees)</option>
                    <option value="charity">Charity/Non-profit</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Monthly Listing Volume *
                  </label>
                  <select
                    required
                    value={formData.monthlyVolume}
                    onChange={(e) => setFormData({...formData, monthlyVolume: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                  >
                    <option value="">Select your monthly volume</option>
                    <option value="1-50">1-50 items</option>
                    <option value="51-200">51-200 items</option>
                    <option value="201-500">201-500 items</option>
                    <option value="501-1000">501-1000 items</option>
                    <option value="1000+">1000+ items</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Platforms Used * (Select all that apply)
                  </label>
                  <div className="space-y-2">
                    {['eBay', 'Vinted', 'Depop', 'Facebook Marketplace', 'Other'].map((platform) => (
                      <label key={platform} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.platforms.includes(platform)}
                          onChange={() => handlePlatformChange(platform)}
                          className="mr-2 h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                        />
                        <span className="text-sm text-gray-700">{platform}</span>
                      </label>
                    ))}
                  </div>
                  {formData.platforms.length === 0 && (
                    <p className="text-sm text-red-600 mt-1">Please select at least one platform</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    How often can you provide feedback? *
                  </label>
                  <select
                    required
                    value={formData.feedbackCommitment}
                    onChange={(e) => setFormData({...formData, feedbackCommitment: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                  >
                    <option value="">Select frequency</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="biweekly">Bi-weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Information (Optional)
                  </label>
                  <textarea
                    value={formData.additionalInfo}
                    onChange={(e) => setFormData({...formData, additionalInfo: e.target.value})}
                    rows={4}
                    placeholder="Tell us about your experience with fashion reselling, specific features you'd like to test, or any other relevant information..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-md p-4">
                  <h4 className="font-semibold text-purple-900 mb-2">Beta Tester Benefits:</h4>
                  <ul className="list-disc list-inside text-sm text-purple-800 space-y-1">
                    <li>50 free credits (worth £12.50)</li>
                    <li>Early access to new features</li>
                    <li>Direct input on product development</li>
                    <li>Priority support</li>
                    <li>Special beta tester badge</li>
                  </ul>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Beta Tester Expectations:</h4>
                  <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                    <li>Provide regular feedback on features</li>
                    <li>Report bugs and issues promptly</li>
                    <li>Test new features as they're released</li>
                    <li>Maintain confidentiality about unreleased features</li>
                  </ul>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || formData.platforms.length === 0}
                  className={`w-full py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                    isSubmitting || formData.platforms.length === 0
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-purple-600 hover:bg-purple-700'
                  } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500`}
                >
                  {isSubmitting ? 'Submitting Application...' : 'Submit Beta Application'}
                </button>
              </form>
            </>
          )}
        </div>

        <div className="mt-8 text-center text-sm text-gray-600">
          <p>Questions about the beta program?</p>
          <button
            onClick={handleContactUs}
            className="text-purple-600 hover:text-purple-800 underline"
          >
            Contact us
          </button>
        </div>
      </div>
    </main>
  );
}