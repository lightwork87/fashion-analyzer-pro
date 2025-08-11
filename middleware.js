import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isPublicRoute = createRouteMatcher([
  '/',
  '/pricing',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/stripe/create-checkout',
  '/api/webhook/stripe',
  '/api/test-db',
  '/test-db'
]);

export default clerkMiddleware((auth, req) => {
  if (!isPublicRoute(req)) {
    auth.protect();  // Changed from auth().protect() to auth.protect()
  }
});

export const config = {
  matcher: [
    '/((?!.*\\..*|_next).*)',
    '/',
    '/(api|trpc)(.*)'
  ],
};