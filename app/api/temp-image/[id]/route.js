// app/api/temp-image/[id]/route.js
// Serve temporary images from sessionStorage fallback

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request, { params }) {
  try {
    const { id } = params;
    
    if (!id || !id.startsWith('temp_')) {
      return NextResponse.json({ error: 'Invalid temporary image ID' }, { status: 400 });
    }
    
    // In a real implementation, you'd get this from the client
    // For now, return a placeholder response that indicates the fallback system is working
    
    return NextResponse.json({ 
      message: 'Temporary image endpoint working',
      id: id,
      note: 'This endpoint would serve base64 image data from sessionStorage in the client'
    });
    
  } catch (error) {
    console.error('Temp image API error:', error);
    return NextResponse.json({ error: 'Failed to serve image' }, { status: 500 });
  }
}