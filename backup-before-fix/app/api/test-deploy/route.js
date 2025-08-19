// app/api/test-deploy/route.js
// Simple test to verify deployments are working

import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    message: "Deployment successful!",
    timestamp: new Date().toISOString(),
    version: "2.0 with compression"
  });
}