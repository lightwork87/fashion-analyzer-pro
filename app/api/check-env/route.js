// app/api/check-env/route.js
export async function GET() {
  return Response.json({
    hasPublishableKey: !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    keyLength: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.length || 0,
    keyPrefix: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.substring(0, 10) || 'NOT_SET',
    hasSecretKey: !!process.env.CLERK_SECRET_KEY,
    nodeEnv: process.env.NODE_ENV
  });
}