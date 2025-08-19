'use client';

import { useClerk } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { LogOut, Loader2 } from 'lucide-react';
import { useState } from 'react';

export default function SignOutButton({ 
  showIcon = true, 
  showText = true, 
  className = '',
  variant = 'default' // default, dropdown, navbar
}) {
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

  // Different styles based on variant
  const getButtonClasses = () => {
    const baseClasses = 'flex items-center gap-2 transition-all';
    
    switch (variant) {
      case 'dropdown':
        return `${baseClasses} w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 ${className}`;
      
      case 'navbar':
        return `${baseClasses} px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 ${className}`;
      
      default:
        return `${baseClasses} px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 ${className}`;
    }
  };

  return (
    <button
      onClick={handleSignOut}
      disabled={isSigningOut}
      className={getButtonClasses()}
    >
      {isSigningOut ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          {showText && <span>Signing out...</span>}
        </>
      ) : (
        <>
          {showIcon && <LogOut className="w-4 h-4" />}
          {showText && <span>Sign Out</span>}
        </>
      )}
    </button>
  );
}

// Usage Examples:

// 1. In a dropdown menu (like in your dashboard header):
// <SignOutButton variant="dropdown" />

// 2. In a navbar:
// <SignOutButton variant="navbar" showText={false} />

// 3. As a standalone button:
// <SignOutButton className="mt-4" />

// 4. In settings page:
// <SignOutButton showIcon={false} className="w-full" />