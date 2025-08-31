// middleware.js
// COMPLETE REWRITE - Copy this entire file and replace your existing middleware.js

import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Define public routes that don't need authentication
const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/pricing(.*)',
  '/beta(.*)',
  '/api/webhooks/stripe(.*)',
  '/_next(.*)',
  '/favicon.ico'
]);

// Define protected routes that need authentication
const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/api/analyze(.*)',
  '/api/user(.*)',
  '/api/credits(.*)',
  '/api/listings(.*)'
]);

export default clerkMiddleware((auth, req) => {
  // If it's a protected route and user is not signed in, redirect to sign-in
  if (isProtectedRoute(req) && !auth().userId) {
    const signInUrl = new URL('/sign-in', req.url);
    signInUrl.searchParams.set('redirect_url', req.url);
    return Response.redirect(signInUrl);
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