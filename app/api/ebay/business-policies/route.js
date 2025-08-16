// app/api/ebay/business-policies/route.js
// FIXED - Added dynamic export

export const dynamic = 'force-dynamic'; // Add this line

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Return empty policies for now
    return NextResponse.json({
      policies: {
        paymentPolicies: [],
        returnPolicies: [],
        shippingPolicies: []
      }
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch policies' }, { status: 500 });
  }
}