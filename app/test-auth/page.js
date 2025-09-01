// app/test-auth/page.js
'use client';

export default function TestAuth() {
  return (
    <div style={{ padding: '50px', background: '#f0f0f0', minHeight: '100vh' }}>
      <h1>Auth Test Page</h1>
      <p>If you see this, Next.js is working</p>
      <div style={{ marginTop: '20px' }}>
        <a href="/dashboard" style={{ padding: '10px', background: 'blue', color: 'white' }}>
          Try Dashboard (will redirect if not authenticated)
        </a>
      </div>
      <div style={{ marginTop: '20px' }}>
        <p>Clerk Status: Checking...</p>
        <p>Environment: {process.env.NODE_ENV}</p>
      </div>
    </div>
  );
}

