import { authMiddleware } from "@clerk/nextjs";

export default authMiddleware({
  publicRoutes: [
    "/",
    "/pricing",
    "/sign-in",
    "/sign-up",
    "/api/stripe/create-checkout",
    "/api/webhook/stripe"
  ],
  ignoredRoutes: []
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};