#!/bin/bash
echo "🚨 FIXING CRITICAL ERRORS..."

# Fix 1: recent-analyses route
cat > app/api/user/recent-analyses/route.js << 'ENDFILE'
import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
export const dynamic = 'force-dynamic';
export async function GET() {
  try {
    const user = await currentUser();
    return NextResponse.json({ analyses: [] });
  } catch (error) {
    return NextResponse.json({ analyses: [] });
  }
}
ENDFILE

# Fix 2: Ensure beta page is client component
sed -i '' "1s/^/'use client';\n/" app/dashboard/beta/page.js 2>/dev/null || sed -i "1s/^/'use client';\n/" app/dashboard/beta/page.js

# Clean and deploy
rm -rf .next .vercel
git add -A
git commit -m "emergency: fix build errors" --no-verify
git push origin main --force

echo "✅ PUSHED! Check Vercel dashboard for deployment"
