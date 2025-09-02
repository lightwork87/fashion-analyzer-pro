'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';

const CreditsContext = createContext();

export function CreditsProvider({ children }) {
  const { user } = useUser();
  const [credits, setCredits] = useState(5); // Start with 5 free trial credits
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      // Fetch user credits from database
      fetchUserCredits();
    } else {
      // New users get 5 free credits
      setCredits(5);
      setLoading(false);
    }
  }, [user]);

  const fetchUserCredits = async () => {
    try {
      // This would fetch from your database
      // For now, we'll use localStorage as a placeholder
      const storedCredits = localStorage.getItem(`credits_${user.id}`);
      if (storedCredits) {
        setCredits(parseInt(storedCredits));
      } else {
        // New user gets 5 free credits
        setCredits(5);
        localStorage.setItem(`credits_${user.id}`, '5');
      }
    } catch (error) {
      console.error('Error fetching credits:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateCredits = (newCredits) => {
    setCredits(newCredits);
    if (user) {
      localStorage.setItem(`credits_${user.id}`, newCredits.toString());
    }
  };

  const useCredit = () => {
    if (credits > 0) {
      const newCredits = credits - 1;
      updateCredits(newCredits);
      return true;
    }
    return false;
  };

  return (
    <CreditsContext.Provider value={{ credits, loading, updateCredits, useCredit }}>
      {children}
    </CreditsContext.Provider>
  );
}

export const useCredits = () => {
  const context = useContext(CreditsContext);
  if (!context) {
    throw new Error('useCredits must be used within CreditsProvider');
  }
  return context;
};
