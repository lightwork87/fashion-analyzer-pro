import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const { images } = body;
    
    return NextResponse.json({
      success: true,
      message: `Received ${images?.length || 0} images`,
      firstImageSize: images?.[0]?.length || 0
    });
  } catch (error) {
    return NextResponse.json({ 
      error: error.message 
    }, { status: 500 });
  }
}