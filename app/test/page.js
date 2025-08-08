export default function TestPage() {
  return (
    <div style={{ padding: '50px', fontFamily: 'Arial' }}>
      <h1>Fashion Analyzer Pro - Test Page</h1>
      <p>If you can see this, Vercel deployment is working!</p>
      <p>Current time: {new Date().toLocaleString()}</p>
      <div style={{ marginTop: '20px' }}>
        <h2>Environment Check:</h2>
        <ul>
          <li>Node Environment: {process.env.NODE_ENV}</li>
          <li>Has Stripe Key: {process.env.STRIPE_SECRET_KEY ? 'Yes' : 'No'}</li>
          <li>Has AI Keys: {
            process.env.ANTHROPIC_API_KEY && process.env.GOOGLE_CLOUD_VISION_API_KEY 
              ? 'Yes' : 'No'
          }</li>
        </ul>
      </div>
    </div>
  );
}