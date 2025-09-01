'use client';

import Link from 'next/link';
import CreditsDisplay from '../../components/CreditsDisplay';
import ThemeToggle from '../../components/ThemeToggle';

export default function SupportPage() {
  const handleEmailClick = () => {
    window.location.href = 'mailto:lightlisterai@outlook.com?subject=Support Request';
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Support Center</h1>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <button
              onClick={handleEmailClick}
              className="block p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition text-left"
            >
              <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">📧 Email Support</h3>
              <p className="text-sm text-blue-800 dark:text-blue-400">
                Get help via email at lightlisterai@outlook.com
              </p>
            </button>

            <Link href="/dashboard/beta" className="block p-6 bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition">
              <h3 className="font-semibold text-purple-900 dark:text-purple-300 mb-2">🐛 Report an Issue</h3>
              <p className="text-sm text-purple-800 dark:text-purple-400">
                Found a bug? Let us know through our beta program
              </p>
            </Link>
          </div>

          {/* FAQs */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Frequently Asked Questions</h2>
            
            <div className="space-y-4">
              <details className="group">
                <summary className="cursor-pointer list-none p-4 bg-gray-50 dark:bg-gray-900 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                  <span className="font-medium text-gray-900 dark:text-white">How do credits work?</span>
                </summary>
                <div className="mt-2 px-4 pb-4 text-gray-600 dark:text-gray-300">
                  Each analysis uses 1 credit. New users get 5 free credits to try the service. You can purchase more credits or subscribe to a monthly plan.
                </div>
              </details>

              <details className="group">
                <summary className="cursor-pointer list-none p-4 bg-gray-50 dark:bg-gray-900 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                  <span className="font-medium text-gray-900 dark:text-white">What images can I upload?</span>
                </summary>
                <div className="mt-2 px-4 pb-4 text-gray-600 dark:text-gray-300">
                  You can upload JPG, PNG, or WEBP images up to 10MB. For best results, use clear, well-lit photos of your items.
                </div>
              </details>

              <details className="group">
                <summary className="cursor-pointer list-none p-4 bg-gray-50 dark:bg-gray-900 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                  <span className="font-medium text-gray-900 dark:text-white">How accurate is the AI?</span>
                </summary>
                <div className="mt-2 px-4 pb-4 text-gray-600 dark:text-gray-300">
                  Our AI is trained on thousands of successful listings. While highly accurate, we recommend reviewing and adjusting the generated content to match your specific item.
                </div>
              </details>
            </div>
          </div>

          <div className="mt-8 p-6 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Contact Us</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Email: <a href="mailto:lightlisterai@outlook.com" className="text-blue-600 dark:text-blue-400 hover:underline">lightlisterai@outlook.com</a>
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Response time: Within 24-48 hours
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SupportPage;