'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { supabase, getOrCreateUser } from '../lib/supabase';

function TestDBPage() {
  const { user, isLoaded } = useUser();
  const [status, setStatus] = useState('Checking...');
  const [dbUser, setDbUser] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function testConnection() {
      try {
        // Test 1: Basic Supabase connection
        const { data, error: pingError } = await supabase
          .from('users')
          .select('count')
          .limit(1);
        
        if (pingError) {
          setStatus('❌ Cannot connect to Supabase');
          setError(pingError.message);
          return;
        }
        
        setStatus('✅ Connected to Supabase');
        
        // Test 2: Try to create/get user if logged in
        if (isLoaded && user) {
          const { user: dbUserData, error: userError } = await getOrCreateUser(user);
          
          if (userError) {
            setError(`User creation error: ${userError.message}`);
          } else {
            setDbUser(dbUserData);
            setStatus('✅ User created/found in database');
          }
        }
      } catch (err) {
        setError(err.message);
      }
    }
    
    testConnection();
  }, [user, isLoaded]);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-6">Database Connection Test</h1>
        
        <div className="space-y-4">
          <div>
            <h2 className="font-semibold">Connection Status:</h2>
            <p className={status.includes('✅') ? 'text-green-600' : 'text-red-600'}>
              {status}
            </p>
          </div>
          
          <div>
            <h2 className="font-semibold">Clerk User:</h2>
            <pre className="bg-gray-100 p-2 rounded text-sm">
              {user ? JSON.stringify({
                id: user.id,
                email: user.emailAddresses[0]?.emailAddress
              }, null, 2) : 'Not logged in'}
            </pre>
          </div>
          
          <div>
            <h2 className="font-semibold">Database User:</h2>
            <pre className="bg-gray-100 p-2 rounded text-sm">
              {dbUser ? JSON.stringify(dbUser, null, 2) : 'No database user'}
            </pre>
          </div>
          
          {error && (
            <div>
              <h2 className="font-semibold text-red-600">Error:</h2>
              <p className="text-red-600">{error}</p>
            </div>
          )}
          
          <div>
            <h2 className="font-semibold">Environment Variables:</h2>
            <ul className="text-sm">
              <li>NEXT_PUBLIC_SUPABASE_URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing'}</li>
              <li>NEXT_PUBLIC_SUPABASE_ANON_KEY: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}</li>
            </ul>
          </div>
        </div>
        
        <button
          onClick={() => window.location.reload()}
          className="mt-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Refresh
        </button>
      </div>
    </div>
  );
}

export default TestDBPage;