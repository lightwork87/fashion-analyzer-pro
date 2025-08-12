import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const fileCount = Array.from(formData.entries()).length;
    
    return NextResponse.json({
      success: true,
      message: `Received ${fileCount} files`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}