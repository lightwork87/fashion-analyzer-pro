import { authMiddleware } from "@clerk/nextjs";

export default authMiddleware({
  publicRoutes: [
    "/",
    "/pricing",
    "/sign-in(.*)",
    "/sign-up(.*)",
    "/api/stripe/create-checkout",
    "/api/webhook/stripe",
    "/api/test-db",
    "/test-db"
  ]
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};