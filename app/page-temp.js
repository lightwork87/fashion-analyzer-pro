'use client';

export default function TempPage() {
  return (
    <div>
      <h1>Test Page - No Clerk</h1>
      <p>API Key in use: {process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.substring(0, 10)}...</p>
    </div>
  );
}