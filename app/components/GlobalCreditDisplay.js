'use client';

import { useUser } from '@clerk/nextjs';
import { useUserData } from '../hooks/useUserData';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function GlobalCreditDisplay() {
  const { isSignedIn } = useUser();
  const { user, loading } = useUserData();
  const pathname = usePathname();

  // Don't show on sign-in/sign-up pages
  if (!isSignedIn || pathname.includes('/sign-') || loading) {
    return null;
  }

  const totalCredits = (user?.credits_total || 0) + (user?.bonus_credits || 0);
  const usedCredits = user?.credits_used || 0;
  const remainingCredits = totalCredits - usedCredits;
  const percentage = totalCredits > 0 ? (remainingCredits / totalCredits) * 100 : 0;

  return (
    <div className="fixed top-4 right-4 z-50">
      <Link 
        href="/pricing"
        className="bg-white shadow-lg rounded-lg p-4 flex items-center gap-3 hover:shadow-xl transition-shadow cursor-pointer"
      >
        <div className="text-right">
          <p className="text-xs text-gray-600 font-medium">Credits Remaining</p>
          <p className="text-2xl font-bold text-gray-900">{remainingCredits}</p>
          <p className="text-xs text-gray-500">{usedCredits} / {totalCredits} used</p>
        </div>
        <div className="relative w-16 h-16">
          <svg className="w-16 h-16 transform -rotate-90">
            <circle
              cx="32"
              cy="32"
              r="28"
              stroke="#E5E7EB"
              strokeWidth="8"
              fill="none"
            />
            <circle
              cx="32"
              cy="32"
              r="28"
              stroke={percentage > 20 ? '#3B82F6' : '#EF4444'}
              strokeWidth="8"
              fill="none"
              strokeDasharray={`${2 * Math.PI * 28}`}
              strokeDashoffset={`${2 * Math.PI * 28 * (1 - percentage / 100)}`}
              className="transition-all duration-500"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-bold">{Math.round(percentage)}%</span>
          </div>
        </div>
      </Link>
      {remainingCredits < 10 && remainingCredits > 0 && (
        <p className="text-xs text-orange-600 mt-2 text-center">Running low on credits!</p>
      )}
      {remainingCredits === 0 && (
        <p className="text-xs text-red-600 mt-2 text-center font-medium">No credits remaining!</p>
      )}
    </div>
  );
}