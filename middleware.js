export default function middleware() {
  // Temporarily bypass all authentication
  return;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};