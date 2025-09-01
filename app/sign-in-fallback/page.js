'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

SignInFallback() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('This is a fallback page. Clerk authentication is not properly configured. Please check your environment variables.');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">LL</span>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Sign In - Fallback Mode</h1>
            <p className="text-gray-600 mt-2">Clerk is not configured properly</p>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-2 px-4 bg-black text-white rounded-lg hover:bg-gray-800 transition"
            >
              Sign In
            </button>
          </form>

          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800 font-semibold mb-2">⚠️ Configuration Required</p>
            <p className="text-xs text-yellow-700">
              To enable authentication, ensure these environment variables are set in Vercel:
            </p>
            <ul className="text-xs text-yellow-700 mt-2 space-y-1">
              <li>• NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY</li>
              <li>• CLERK_SECRET_KEY</li>
            </ul>
          </div>

          <div className="mt-4 text-center">
            <a href="/clerk-test" className="text-sm text-blue-600 hover:underline">
              Check Environment Variables →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SignInFallback;