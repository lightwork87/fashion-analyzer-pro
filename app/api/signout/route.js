import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export async function GET() {
  // In Clerk, signout is handled client-side
  // This route just redirects to the homepage
  redirect('/');
}