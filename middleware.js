// middleware.js
// Updated for Clerk v5 and Next.js 14+

import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Define which routes are protected (require authentication)
const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/api/analyze-ai(.*)',
  '/api/user(.*)',
  '/api/listings(.*)',
  '/api/ai-learning(.*)',
  '/api/debug-credits(.*)',
  '/account(.*)',
  '/settings(.*)'
]);

// Define which routes are public (no authentication required)
const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/beta(.*)',
  '/beta-signup(.*)',
  '/pricing(.*)',
  '/api/beta-signup(.*)',
  '/api/webhooks(.*)'
]);

export default clerkMiddleware((auth, req) => {
  // Allow public routes without authentication
  if (isPublicRoute(req)) {
    return;
  }
  
  // Protect dashboard and API routes
  if (isProtectedRoute(req)) {
    auth().protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};