'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';

export default function BetaPage() {
  const { user } = useUser();
  const [formData, setFormData] = useState({
    name: '',
    email: user?.emailAddresses?.[0]?.emailAddress || '',
    ebayUsername: '',
    monthlyVolume: '',
    interests: [],
    experience: '',
    feedback: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Create mailto link with form data
    const email = 'lightlisterai@outlook.com';
    const emailSubject = `Beta Program Application - ${formData.name}`;
    const emailBody = `
Beta Program Application

Name: ${formData.name}
Email: ${formData.email}
eBay Username: ${formData.ebayUsername}
Monthly Listing Volume: ${formData.monthlyVolume}
Areas of Interest: ${formData.interests.join(', ')}
Experience Level: ${formData.experience}

Additional Feedback:
${formData.feedback}

---
Submitted from LightLister AI Beta Program
    `.trim();

    // Open email client
    window.location.href = `mailto:${email}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
    
    setSubmitted(true);
  };

  const handleInterestChange = (interest) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Beta Program Application</h1>

        {/* Beta Features */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-blue-900 dark:text-blue-300 mb-3">Beta Program Benefits</h2>
          <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-400">
            <li>✅ Early access to new features</li>
            <li>✅ Direct communication with development team</li>
            <li>✅ 50% discount on credit purchases during beta</li>
            <li>✅ Priority support</li>
            <li>✅ Influence product development</li>
          </ul>
        </div>

        {/* Application Form */}
        {!submitted ? (
          <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  eBay Username
                </label>
                <input
                  type="text"
                  value={formData.ebayUsername}
                  onChange={(e) => setFormData({...formData, ebayUsername: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Monthly Listing Volume
                </label>
                <select
                  value={formData.monthlyVolume}
                  onChange={(e) => setFormData({...formData, monthlyVolume: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">Select...</option>
                  <option value="1-10">1-10 items</option>
                  <option value="11-50">11-50 items</option>
                  <option value="51-100">51-100 items</option>
                  <option value="100+">100+ items</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Areas of Interest (Check all that apply)
              </label>
              <div className="space-y-2">
                {['AI Accuracy', 'Batch Processing', 'Pricing Suggestions', 'eBay Integration', 'Vinted Integration', 'Mobile App'].map((interest) => (
                  <label key={interest} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.interests.includes(interest)}
                      onChange={() => handleInterestChange(interest)}
                      className="mr-2"
                    />
                    <span className="text-gray-700 dark:text-gray-300">{interest}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Experience Level
              </label>
              <select
                value={formData.experience}
                onChange={(e) => setFormData({...formData, experience: e.target.value})}
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Select...</option>
                <option value="beginner">Beginner (Less than 1 year)</option>
                <option value="intermediate">Intermediate (1-3 years)</option>
                <option value="advanced">Advanced (3+ years)</option>
                <option value="professional">Professional Seller</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                What features would you like to see? (Optional)
              </label>
              <textarea
                value={formData.feedback}
                onChange={(e) => setFormData({...formData, feedback: e.target.value})}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Tell us about features you'd like to see or improvements you'd suggest..."
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition font-medium"
            >
              Submit Application
            </button>
          </form>
        ) : (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-8 text-center">
            <span className="text-4xl mb-4 block">✅</span>
            <h2 className="text-2xl font-bold text-green-900 dark:text-green-300 mb-2">Application Submitted!</h2>
            <p className="text-green-800 dark:text-green-400">
              Your email client should open with your application. Please send the email to complete your application.
            </p>
            <p className="text-sm text-green-700 dark:text-green-500 mt-4">
              We'll review your application and get back to you within 48 hours.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}