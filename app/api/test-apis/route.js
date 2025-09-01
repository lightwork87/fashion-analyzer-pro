// app/api/test-apis/route.js - CREATE THIS FILE
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    hasGoogleKey: !!process.env.GOOGLE_CLOUD_VISION_API_KEY,
    hasClaudeKey: !!process.env.ANTHROPIC_API_KEY,
    googleKeyLength: process.env.GOOGLE_CLOUD_VISION_API_KEY?.length || 0,
    claudeKeyLength: process.env.ANTHROPIC_API_KEY?.length || 0,
    googleKeyFirst5: process.env.GOOGLE_CLOUD_VISION_API_KEY?.substring(0, 5) || 'MISSING',
    claudeKeyFirst5: process.env.ANTHROPIC_API_KEY?.substring(0, 5) || 'MISSING',
  });
}