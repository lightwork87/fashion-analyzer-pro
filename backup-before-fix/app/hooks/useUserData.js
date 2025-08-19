import { useUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import { getOrCreateUser, checkUserCredits } from '../lib/supabase';

export function useUserData() {
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser();
  const [userData, setUserData] = useState(null);
  const [creditInfo, setCreditInfo] = useState({
    creditsRemaining: 0,
    totalCredits: 0,
    creditsUsed: 0,
    subscription: 'free'
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadUserData() {
      if (!clerkLoaded) return;
      
      if (!clerkUser) {
        setLoading(false);
        return;
      }

      try {
        // Get or create user in database
        const { user, error: userError } = await getOrCreateUser(clerkUser);
        
        if (userError) {
          setError(userError);
          setLoading(false);
          return;
        }

        setUserData(user);

        // Get credit info
        const creditCheck = await checkUserCredits(clerkUser.id);
        
        setCreditInfo({
          creditsRemaining: creditCheck.creditsAvailable || 0,
          totalCredits: creditCheck.totalCredits || 0,
          creditsUsed: creditCheck.creditsUsed || 0,
          subscription: user?.subscription_plan || 'free'
        });
      } catch (err) {
        console.error('Error loading user data:', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    }

    loadUserData();
  }, [clerkUser, clerkLoaded]);

  const refreshCredits = async () => {
    if (!clerkUser) return;
    
    const creditCheck = await checkUserCredits(clerkUser.id);
    setCreditInfo({
      creditsRemaining: creditCheck.creditsAvailable || 0,
      totalCredits: creditCheck.totalCredits || 0,
      creditsUsed: creditCheck.creditsUsed || 0,
      subscription: userData?.subscription_plan || 'free'
    });
  };

  return {
    user: userData,
    creditInfo,
    loading,
    error,
    refreshCredits
  };
}