'use client';

import { useClerk } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { X, LogOut, Loader2 } from 'lucide-react';

export default function SignOutModal({ isOpen, onClose, darkMode = false }) {
  const { signOut } = useClerk();
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut(() => {
        router.push('/');
      });
    } catch (error) {
      console.error('Error signing out:', error);
      setIsSigningOut(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50">
        <div className={`rounded-lg p-6 w-96 ${
          darkMode ? 'bg-gray-800' : 'bg-white'
        } shadow-xl`}>
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className={`text-xl font-semibold ${
              darkMode ? 'text-white' : 'text-black'
            }`}>
              Sign Out
            </h2>
            <button
              onClick={onClose}
              className={`p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Content */}
          <p className={`mb-6 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Are you sure you want to sign out? Any unsaved work will be lost.
          </p>
          
          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isSigningOut}
              className={`flex-1 px-4 py-2 rounded-lg border ${
                darkMode 
                  ? 'border-gray-600 hover:bg-gray-700' 
                  : 'border-gray-300 hover:bg-gray-100'
              } transition`}
            >
              Cancel
            </button>
            
            <button
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSigningOut ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing out...
                </>
              ) : (
                <>
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// Usage Example in your dashboard or settings:
/*
import SignOutModal from '@/app/components/SignOutModal';

function YourComponent() {
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  return (
    <>
      <button onClick={() => setShowSignOutModal(true)}>
        Sign Out
      </button>
      
      <SignOutModal 
        isOpen={showSignOutModal}
        onClose={() => setShowSignOutModal(false)}
        darkMode={darkMode}
      />
    </>
  );
}
*/