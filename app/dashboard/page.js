import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import SignOutButton from '../components/SignOutButton';

export default async function DashboardPage() {
  const { userId } = await auth();
  const user = await currentUser();

  if (!userId) {
    redirect('/sign-in');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">LL</span>
              </div>
              <h1 className="text-xl font-bold">LightLister AI</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                {user?.firstName || user?.emailAddresses?.[0]?.emailAddress}
              </span>
              <SignOutButton />
            </div>
          </div>
        </div>
      </nav>

      {/* Dashboard Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Welcome to your Dashboard</h2>
          <p className="text-gray-600 mt-2">Create AI-powered listings for eBay and Vinted</p>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link href="/dashboard/analyze-single" className="block">
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">📸</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Analyze Single Item</h3>
              <p className="text-gray-600 text-sm">Upload a photo and get an instant listing</p>
            </div>
          </Link>

          <Link href="/dashboard/analyze-batch" className="block">
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">📦</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Batch Processing</h3>
              <p className="text-gray-600 text-sm">Process multiple items at once</p>
            </div>
          </Link>

          <Link href="/dashboard/pricing-guide" className="block">
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">💷</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">UK Pricing Guide</h3>
              <p className="text-gray-600 text-sm">Get market-based pricing suggestions</p>
            </div>
          </Link>

          <Link href="/dashboard/templates" className="block">
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">📝</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Listing Templates</h3>
              <p className="text-gray-600 text-sm">Save and reuse your best templates</p>
            </div>
          </Link>

          <Link href="/dashboard/history" className="block">
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">History</h3>
              <p className="text-gray-600 text-sm">View your past listings</p>
            </div>
          </Link>

          <Link href="/dashboard/settings" className="block">
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">⚙️</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Settings</h3>
              <p className="text-gray-600 text-sm">Manage your account and preferences</p>
            </div>
          </Link>
        </div>

        {/* Stats Section */}
        <div className="mt-12 bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Stats</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-gray-600">Total Listings</p>
              <p className="text-2xl font-bold text-gray-900">0</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">This Month</p>
              <p className="text-2xl font-bold text-gray-900">0</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Credits Remaining</p>
              <p className="text-2xl font-bold text-gray-900">10</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Plan</p>
              <p className="text-2xl font-bold text-gray-900">Free</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}