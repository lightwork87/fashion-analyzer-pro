import { authMiddleware } from '@clerk/nextjs';

export default authMiddleware({
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
  ignoredRoutes: [
    '/((?!api|trpc))(_next.*|.+\.[\w]+$)',
    '/api/webhooks(.*)',
  ],
  afterAuth(auth, req) {
    // Handle users who aren't authenticated
    if (!auth.userId && !auth.isPublicRoute) {
      const signInUrl = new URL('/sign-in', req.url);
      signInUrl.searchParams.set('redirect_url', req.url);
      return Response.redirect(signInUrl);
    }
  },
  debug: false, // Set to true to see debug logs
});

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
};