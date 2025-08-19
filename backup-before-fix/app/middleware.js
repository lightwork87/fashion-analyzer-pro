import { authMiddleware } from "@clerk/nextjs";

export default authMiddleware({
  // Make API routes public (no authentication required)
  publicRoutes: [
    "/",
    "/api/analyze-combined",
    "/api/bulk-analyze", 
    "/api/research-pricing",
    "/api/(.*)",  // All API routes public
    "/sign-in(.*)",
    "/sign-up(.*)"
  ],
  
  // Ignore these routes completely
  ignoredRoutes: [
    "/api/analyze-combined",
    "/api/bulk-analyze",
    "/api/research-pricing"
  ]
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};