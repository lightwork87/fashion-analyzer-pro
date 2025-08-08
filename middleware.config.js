import { authMiddleware } from "@clerk/nextjs";

export default authMiddleware({
  publicRoutes: [
    "/",
    "/pricing",
    "/sign-in",
    "/sign-up",
    "/api/stripe/create-checkout"
  ],
  ignoredRoutes: [
    "/api/webhook/stripe"
  ]
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};