'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import CreditsDisplay from '../../components/CreditsDisplay';
import ThemeToggle from '../../components/ThemeToggle';

export default function BetaPage() {
  const { user } = useUser();
  const [feedbackType, setFeedbackType] = useState('bug');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Create mailto link
    const email = 'lightlisterai@outlook.com';
    const emailSubject = `[Beta ${feedbackType === 'bug' ? 'Bug Report' : 'Feature Request'}] ${subject}`;
    const emailBody = `
User: ${user?.emailAddresses?.[0]?.emailAddress || 'Unknown'}
Type: ${feedbackType === 'bug' ? 'Bug Report' : 'Feature Request'}

Subject: ${subject}

Description:
${description}

---
Sent from LightLister AI Beta Program
    `.trim();

    // Open email client
    window.location.href = `mailto:${email}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
    
    setSubmitted(true);
    setTimeout(() => {
      setSubject('');
      setDescription('');
      setSubmitted(false);
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Navigation */}
      <nav className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="flex items-center gap-2 hover:opacity-80">
                <div className="w-8 h-8 bg-black dark:bg-white rounded-lg flex items-center justify-center">
                  <span className="text-white dark:text-black font-bold text-sm">LL</span>
                </div>
                <h1 className="text-xl font-bold dark:text-white">LightLister AI</h1>
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <CreditsDisplay />
              <ThemeToggle />
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/dashboard" className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6">
          ← Back to Dashboard
        </Link>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Beta Program</h1>
            <p className="text-gray-600 dark:text-gray-300">
              Thank you for being an early adopter! Your feedback helps us build a better product.
            </p>
          </div>

          {/* Beta Features */}
          <div className="mb-8 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h2 className="text-lg font-semibold text-blue-900 dark:text-blue-300 mb-3">Current Beta Features</h2>
            <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-400">
              <li>✅ AI-powered listing generation</li>
              <li>✅ Single item analysis</li>
              <li>✅ 5 free trial credits for new users</li>
              <li>🚧 Batch processing (Coming soon)</li>
              <li>🚧 eBay/Vinted API integration (Coming soon)</li>
              <li>🚧 Advanced pricing suggestions (Coming soon)</li>
            </ul>
          </div>

          {/* Feedback Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Feedback Type
              </label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="bug"
                    checked={feedbackType === 'bug'}
                    onChange={(e) => setFeedbackType(e.target.value)}
                    className="mr-2"
                  />
                  <span className="text-gray-700 dark:text-gray-300">Bug Report</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="feature"
                    checked={feedbackType === 'feature'}
                    onChange={(e) => setFeedbackType(e.target.value)}
                    className="mr-2"
                  />
                  <span className="text-gray-700 dark:text-gray-300">Feature Request</span>
                </label>
              </div>
            </div>

            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Subject
              </label>
              <input
                type="text"
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder={feedbackType === 'bug' ? 'Brief description of the issue' : 'Brief description of your idea'}
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={6}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder={feedbackType === 'bug' ? 'Please describe the issue in detail. Include steps to reproduce if possible.' : 'Please describe your feature idea and how it would help you.'}
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition font-medium"
            >
              Send Feedback via Email
            </button>

            {submitted && (
              <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <p className="text-green-800 dark:text-green-300 text-sm">
                  Thank you! Your email client should open with your feedback ready to send.
                </p>
              </div>
            )}
          </form>

          <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              You can also email us directly at{' '}
              <a href="mailto:lightlisterai@outlook.com" className="text-blue-600 dark:text-blue-400 hover:underline">
                lightlisterai@outlook.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}