'use client';
import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Camera, 
  Package, 
  TrendingUp, 
  Clock, 
  DollarSign,
  Users,
  BarChart3,
  Plus,
  ArrowRight,
  Zap,
  CreditCard,
  History,
  Settings,
  HelpCircle
} from 'lucide-react';

function DashboardPage() {
  const { user, isSignedIn, isLoaded } = useUser();
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState({
    credits: 0,
    totalAnalyses: 0,
    thisMonthAnalyses: 0,
    averageAccuracy: 0,
    recentAnalyses: [],
    quickStats: {
      pendingListings: 0,
      totalRevenue: 0,
      successRate: 0
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Redirect if not authenticated
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/sign-in');
    }
  }, [isSignedIn, isLoaded, router]);

  // Fetch dashboard data
  useEffect(() => {
    if (isSignedIn && user) {
      fetchDashboardData();
    }
  }, [isSignedIn, user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch user credits
      const creditsResponse = await fetch('/api/user/credits');
      const creditsData = await creditsResponse.json();
      
      // Fetch dashboard stats
      const statsResponse = await fetch('/api/dashboard/stats');
      const statsData = await statsResponse.json();
      
      // Fetch recent analyses
      const recentResponse = await fetch('/api/dashboard/recent-analyses');
      const recentData = await recentResponse.json();

      setDashboardData({
        credits: creditsData.credits || 0,
        totalAnalyses: statsData.totalAnalyses || 0,
        thisMonthAnalyses: statsData.thisMonthAnalyses || 0,
        averageAccuracy: statsData.averageAccuracy || 0,
        recentAnalyses: recentData.analyses || [],
        quickStats: {
          pendingListings: statsData.pendingListings || 0,
          totalRevenue: statsData.totalRevenue || 0,
          successRate: statsData.successRate || 0
        }
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Show loading state
  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
          <div className="text-center">
            <div className="text-red-500 mb-4">
              <AlertCircle className="h-12 w-12 mx-auto" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Something went wrong</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={fetchDashboardData}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome back, {user?.firstName || 'User'}!
              </h1>
              <p className="text-gray-600 mt-1">Here's what's happening with your fashion analysis business.</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-blue-50 text-blue-700 px-3 py-2 rounded-lg font-medium">
                <CreditCard className="inline h-4 w-4 mr-1" />
                {dashboardData.credits} Credits
              </div>
              <Link href="/dashboard/credits" className="text-blue-600 hover:text-blue-700 font-medium">
                Add Credits
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3

