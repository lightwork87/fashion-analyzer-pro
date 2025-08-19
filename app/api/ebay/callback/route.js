import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) {
    // User declined authorization
    return NextResponse.redirect(new URL('/dashboard/settings?error=declined', request.url));
  }

  if (code) {
    // Redirect to settings with code to handle client-side
    return NextResponse.redirect(new URL(`/dashboard/settings?code=${code}`, request.url));
  }

  return NextResponse.redirect(new URL('/dashboard/settings', request.url));
}