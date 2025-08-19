import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/pricing',
  '/features',
  '/demo',
  '/privacy',
  '/terms',
  '/contact',
  '/api/webhooks(.*)',
]);

// Define routes that should be protected
const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/api/user(.*)',
  '/api/analyze(.*)',
  '/api/analyses(.*)',
]);

export default clerkMiddleware((auth, req) => {
  try {
    // Check if it's a protected route
    if (isProtectedRoute(req)) {
      // Get the auth state
      const { userId } = auth();
      
      // If no user, redirect to sign-in
      if (!userId) {
        const signInUrl = new URL('/sign-in', req.url);
        signInUrl.searchParams.set('redirect_url', req.url);
        return NextResponse.redirect(signInUrl);
      }
    }
    
    // Allow the request to continue
    return NextResponse.next();
  } catch (error) {
    console.error('Middleware error:', error);
    
    // In case of error, allow public routes through
    if (isPublicRoute(req)) {
      return NextResponse.next();
    }
    
    // For protected routes with errors, redirect to home
    return NextResponse.redirect(new URL('/', req.url));
  }
});

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};