import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Define protected routes
const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/api/user(.*)',
  '/api/analyze(.*)',
  '/api/analyze-single',
  '/api/batch(.*)',
  '/api/listings(.*)',
  '/api/ebay(.*)',
  '/settings(.*)',
  '/account(.*)',
  '/history(.*)'
]);

// Define public routes
const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/pricing',
  '/api/webhooks(.*)',
  '/api/stripe/webhook',
  '/api/test-apis'
]);

export default clerkMiddleware(async (auth, req) => {
  // Protect routes that need authentication
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};