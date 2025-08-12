'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { supabase } from '../../lib/supabase';

// Add your admin email here
const ADMIN_EMAILS = [lightlisterai@outlook.com']; // CHANGE THIS TO YOUR EMAIL

export default function BetaAdmin() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');

  useEffect(() => {
    if (isLoaded && !user) {
      router.push('/sign-in');
    }
    if (user && !ADMIN_EMAILS.includes(user.emailAddresses[0].emailAddress)) {
      router.push('/dashboard');
    }
    if (user && ADMIN_EMAILS.includes(user.emailAddresses[0].emailAddress)) {
      loadRequests();
    }
  }, [user, isLoaded, filter]);

  const loadRequests = async () => {
    try {
      let query = supabase.from('beta_requests_admin').select('*');
      
      if (filter !== 'all') {
        query = query.eq('status', filter);
      }
      
      const { data, error } = await query;
      
      if (!error && data) {
        setRequests(data);
      }
    } catch (err) {
      console.error('Error loading requests:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId, userId, email) => {
    if (!confirm('Approve this beta tester and grant 50 credits?')) return;
    
    try {
      // Update request status
      await supabase
        .from('beta_requests')
        .update({
          status: 'approved',
          credits_granted: 50,
          approved_at: new Date().toISOString(),
          approved_by: user.id
        })
        .eq('id', requestId);

      // Grant credits to user
      await supabase.rpc('grant_beta_credits', {
        p_user_id: userId,
        p_credits: 50
      });

      // Reload requests
      loadRequests();
      alert(`Beta access approved for ${email}. 50 credits granted.`);
    } catch (err) {
      console.error('Error approving request:', err);
      alert('Failed to approve request');
    }
  };

  const handleDeny = async (requestId, email) => {
    if (!confirm('Deny this beta application?')) return;
    
    try {
      await supabase
        .from('beta_requests')
        .update({
          status: 'denied',
          approved_at: new Date().toISOString(),
          approved_by: user.id
        })
        .eq('id', requestId);

      loadRequests();
      alert(`Beta access denied for ${email}`);
    } catch (err) {
      console.error('Error denying request:', err);
      alert('Failed to deny request');
    }
  };

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user || !ADMIN_EMAILS.includes(user.emailAddresses[0].emailAddress)) {
    return null;
  }

  return (
    <main className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold">Beta Program Admin</h1>
              <button
                onClick={() => router.push('/dashboard')}
                className="text-gray-600 hover:text-gray-900"
              >
                Back to Dashboard
              </button>
            </div>
          </div>

          <div className="p-6">
            {/* Filter Tabs */}
            <div className="flex gap-4 mb-6 border-b">
              {['pending', 'approved', 'denied', 'all'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`pb-2 px-4 capitalize ${
                    filter === status 
                      ? 'border-b-2 border-blue-600 text-blue-600' 
                      : 'text-gray-600'
                  }`}
                >
                  {status} ({requests.filter(r => status === 'all' || r.status === status).length})
                </button>
              ))}
            </div>

            {/* Requests Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Business</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Volume</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Platforms</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Feedback</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Credits</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {requests.map((request) => (
                    <tr key={request.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">
                        {new Date(request.created_at).toLocaleDateString('en-GB')}
                      </td>
                      <td className="px-4 py-3 text-sm">{request.email}</td>
                      <td className="px-4 py-3 text-sm">{request.business_type}</td>
                      <td className="px-4 py-3 text-sm">{request.monthly_volume}</td>
                      <td className="px-4 py-3 text-sm">
                        {request.platforms?.join(', ')}
                      </td>
                      <td className="px-4 py-3 text-sm">{request.feedback_commitment}</td>
                      <td className="px-4 py-3 text-sm">
                        {request.credits_used || 0}/{request.credits_total || 0}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          request.status === 'approved' ? 'bg-green-100 text-green-700' :
                          request.status === 'denied' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {request.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {request.status === 'pending' && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleApprove(request.id, request.user_id, request.email)}
                              className="text-green-600 hover:text-green-700"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleDeny(request.id, request.email)}
                              className="text-red-600 hover:text-red-700"
                            >
                              Deny
                            </button>
                          </div>
                        )}
                        {request.additional_info && (
                          <button
                            onClick={() => alert(request.additional_info)}
                            className="text-blue-600 hover:text-blue-700 text-xs"
                          >
                            View Notes
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {requests.length === 0 && (
              <p className="text-center text-gray-500 py-8">
                No {filter === 'all' ? '' : filter} requests found
              </p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}