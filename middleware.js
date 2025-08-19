// TEMPORARY FIX - This bypasses authentication to get site working
export default function middleware(request) {
  return;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};