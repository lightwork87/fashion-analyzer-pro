'use client';

// app/dashboard/page.js - COMPLETE FIXED VERSION
'use client';

import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { createClient } from '@supabase/supabase-js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Camera, 
  Upload, 
  CreditCard, 
  BarChart, 
  Settings, 
  Star,
  TrendingUp,
  Users,
  Clock
} from 'lucide-react';
import Link from 'next/link';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

function DashboardPage() {
  const { user, isLoaded } = useUser();
  const [credits, setCredits] = useState(0);
  const [recentAnalyses, setRecentAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalAnalyses: 0,
    thisMonth: 0,
    avgAccuracy: 95
  });

  useEffect(() => {
    if (isLoaded && user) {
      fetchUserData();
    }
  }, [isLoaded, user]);

  const fetchUserData = async () => {
    try {
      console.log('Fetching user data for:', user.id);
      
      // Fetch user credits
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('credits_remaining')
        .eq('clerk_id', user.id)
        .single();

      if (userError && userError.code !== 'PGRST116') {
        console.error('User fetch error:', userError);
      } else if (userData) {
        setCredits(userData.credits_remaining || 0);
      }

      // Fetch recent analyses
      const { data: analysesData, error: analysesError } = await supabase
        .from('analyses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (analysesError) {
        console.error('Analyses fetch error:', analysesError);
      } else if (analysesData) {
        setRecentAnalyses(analysesData);
        setStats(prev => ({
          ...prev,
          totalAnalyses: analysesData.length,
          thisMonth: analysesData.filter(a => 
            new Date(a.created_at).getMonth() === new Date().getMonth()
          ).length
        }));
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-32 bg-gray-300 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.firstName || 'User'}! 👋
          </h1>
          <p className="text-gray-600 mt-2">
            Ready to analyze some fashion items today?
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Available Credits</p>
                  <p className="text-3xl font-bold">{credits}</p>
                </div>
                <CreditCard className="h-8 w-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Total Analyses</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalAnalyses}</p>
                </div>
                <BarChart className="h-8 w-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">This Month</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.thisMonth}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Accuracy Rate</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.avgAccuracy}%</p>
                </div>
                <Star className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <Link href="/dashboard/analyze-single">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Camera className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Single Item Analysis</h3>
                <p className="text-gray-600">
                  Upload photos of one fashion item for detailed AI analysis
                </p>
                <Button className="w-full mt-4">Start Analysis</Button>
              </CardContent>
            </Link>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <Link href="/dashboard/analyze-bulk">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Upload className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Bulk Analysis</h3>
                <p className="text-gray-600">
                  Process multiple items at once with our batch system
                </p>
                <Button className="w-full mt-4" variant="outline">
                  Coming Soon
                </Button>
              </CardContent>
            </Link>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <Link href="/dashboard/credits">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CreditCard className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Buy Credits</h3>
                <p className="text-gray-600">
                  Purchase more analysis credits for your account
                </p>
                <Button className="w-full mt-4" variant="outline">
                  View Packages
                </Button>
              </CardContent>
            </Link>
          </Card>
        </div>

        {/* Recent Analyses */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Recent Analyses
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentAnalyses.length === 0 ? (
                <div className="text-center py-8">
                  <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No analyses yet</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Start by uploading your first fashion item!
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentAnalyses.slice(0, 3).map((analysis, index) => (
                    <div key={analysis.id || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-sm">
                          {analysis.title || `Analysis #${index + 1}`}
                        </p>
                        <p className="text-xs text-gray-500">
                          {analysis.created_at ? new Date(analysis.created_at).toLocaleDateString() : 'Recently'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-green-600">
                          {analysis.credits_used || 1} credit{(analysis.credits_used || 1) !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Quick Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Link href="/dashboard/settings">
                <Button variant="outline" className="w-full justify-start">
                  <Settings className="h-4 w-4 mr-2" />
                  Account Settings
                </Button>
              </Link>
              
              <Link href="/dashboard/help">
                <Button variant="outline" className="w-full justify-start">
                  <Users className="h-4 w-4 mr-2" />
                  Help & Support
                </Button>
              </Link>

              <Link href="/dashboard/history">
                <Button variant="outline" className="w-full justify-start">
                  <BarChart className="h-4 w-4 mr-2" />
                  Analysis History
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Credit Warning */}
        {credits < 5 && (
          <Card className="mt-6 border-orange-200 bg-orange-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                  <CreditCard className="h-4 w-4 text-orange-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-orange-900">
                    Running low on credits!
                  </p>
                  <p className="text-sm text-orange-700 mt-1">
                    You have {credits} credit{credits !== 1 ? 's' : ''} remaining. 
                    Purchase more to continue analyzing items.
                  </p>
                </div>
                <Link href="/dashboard/credits">
                  <Button size="sm" className="bg-orange-600 hover:bg-orange-700">
                    Buy Credits
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default DashboardPage;