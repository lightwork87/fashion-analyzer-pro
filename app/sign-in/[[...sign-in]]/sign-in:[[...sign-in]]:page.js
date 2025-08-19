cat > app/sign-in/[[...sign-in]]/page.js << 'ENDOFFILE'
'use client';

import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  const key = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  
  console.log('Clerk Key exists:', !!key);
  console.log('Key prefix:', key?.substring(0, 7));
  
  if (!key) {
    return (
      <div style={{ padding: '50px', background: 'white', color: 'black' }}>
        <h1>Configuration Error</h1>
        <p>NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is not set</p>
        <p>Please check Vercel environment variables</p>
      </div>
    );
  }
  
  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: '#f5f5f5'
    }}>
      <div style={{ background: 'white', padding: '20px', borderRadius: '8px' }}>
        <h2 style={{ color: 'black', marginBottom: '20px' }}>Sign In to LightLister AI</h2>
        <SignIn />
      </div>
    </div>
  );
}
ENDOFFILE

git add app/sign-in/[[...sign-in]]/page.js
git commit -m "add debug info to sign-in page"
git push origin main