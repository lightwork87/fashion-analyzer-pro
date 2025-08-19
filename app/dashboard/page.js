import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import SignOutButton from '../components/SignOutButton';
import CreditsDisplay from '../components/CreditsDisplay';
import ThemeToggle from '../components/ThemeToggle';

export default async function DashboardPage() {
  const { userId } = await auth();
  const user = await currentUser();

  if (!userId) {
    redirect('/sign-in');
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Navigation */}
      <nav className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-black dark:bg-white rounded-lg flex items-center justify-center">
                <span className="text-white dark:text-black font-bold text-sm">LL</span>
              </div>
              <h1 className="text-xl font-bold dark:text-white">LightLister AI</h1>
            </div>
            <div className="flex items-center gap-4">
              <CreditsDisplay />
              <ThemeToggle />
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {user?.firstName || user?.emailAddresses?.[0]?.emailAddress}
              </span>
              <SignOutButton />
            </div>
          </div>
        </div>
      </nav>

      {/* Beta Banner */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
          <p className="text-sm text-blue-800 dark:text-blue-300">
            🚀 Welcome to LightLister AI Beta! Help us improve by reporting issues and sharing ideas.
          </p>
          <Link href="/dashboard/beta" className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">
            Join Beta Program →
          </Link>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Welcome to your Dashboard</h2>
          <p className="text-gray-600 dark:text-gray-300 mt-2">Create AI-powered listings for eBay and Vinted</p>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link href="/dashboard/analyze-single" className="block">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">📸</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Analyze Single Item</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">Upload a photo and get an instant listing (1 credit)</p>
            </div>
          </Link>

          <Link href="/dashboard/analyze-batch" className="block">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">📦</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Batch Processing</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">Process multiple items at once (1 credit per item)</p>
            </div>
          </Link>

          <Link href="/dashboard/pricing" className="block">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">💳</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Buy Credits</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">Purchase credit packs or subscribe monthly</p>
            </div>
          </Link>

          <Link href="/dashboard/beta" className="block">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">🚀</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Beta Program</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">Report issues and suggest features</p>
            </div>
          </Link>

          <Link href="/dashboard/support" className="block">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">💬</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Contact Support</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">Get help or report issues</p>
            </div>
          </Link>

          <Link href="/dashboard/settings" className="block">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">⚙️</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Settings</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">Manage your account and preferences</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}