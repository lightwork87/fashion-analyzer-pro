import { NextResponse } from 'next/server';

export function middleware(request) {
  // Apply size limit only to specific API routes
  if (request.nextUrl.pathname.startsWith('/api/analyze')) {
    const contentLength = request.headers.get('content-length');
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    
    if (contentLength && parseInt(contentLength) > MAX_SIZE) {
      return new NextResponse(
        JSON.stringify({ error: 'Request body too large' }),
        { 
          status: 413,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};