import { authMiddleware } from '@clerk/nextjs';

export default authMiddleware({
  // Public routes that don't require authentication
  publicRoutes: [
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
  ],
  // Routes that require authentication
  ignoredRoutes: [
    '/api/webhooks(.*)',
    '/_next(.*)',
    '/favicon.ico',
  ],
});

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
};