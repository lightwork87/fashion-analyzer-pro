import { auth } from '@clerk/nextjs/server';

export async function GET() {
  await auth().signOut();
  return Response.redirect(new URL('/', process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'));
}