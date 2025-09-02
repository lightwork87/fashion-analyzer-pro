'use client';

import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
      <SignIn 
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "bg-white shadow-xl",
          }
        }}
        fallbackRedirectUrl="/dashboard"  // UPDATED PROP
        signUpUrl="/sign-up"
      />
    </div>
  );
}