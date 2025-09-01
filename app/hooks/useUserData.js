// app/hooks/useUserData.js - COMPLETE REWRITE
'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { getOrCreateUser, checkUserCredits } from '../lib/supabase';

export function useUserData() {
  const { user, isLoaded } = useUser();
  const [userData, setUserData] = useState(null);
  const [credits, setCredits] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchUserData() {
      if (!isLoaded || !user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Get or create user
        const dbUser = await getOrCreateUser(user.id, user.emailAddresses[0]?.emailAddress);
        setUserData(dbUser);
        
        // Check credits
        const userCredits = await checkUserCredits(user.id);
        setCredits(userCredits);
        
      } catch (error) {
        console.error('Error fetching user data:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    }

    fetchUserData();
  }, [user, isLoaded]);

  const refreshCredits = async () => {
    if (!user) return;
    
    try {
      const userCredits = await checkUserCredits(user.id);
      setCredits(userCredits);
    } catch (error) {
      console.error('Error refreshing credits:', error);
    }
  };

  return {
    userData,
    credits,
    loading,
    error,
    refreshCredits,
    user
  };
}