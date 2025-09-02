
export const dynamic = 'force-dynamic';
// app/api/scrape-ebay-knowledge/route.js
// Build knowledge base from eBay listings

import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/app/lib/supabase-server';



// Parse eBay title patterns
function parseEbayTitle(title) {
  const patterns = {
    brand: null,
    garment: null,
    size: null,
    material: null,
    keywords: []
  };
  
  // Common eBay title structure: Brand Item Gender Size X Colour Material Keywords
  const words = title.split(' ');
  
  // First word is often brand
  patterns.brand = words[0];
  
  // Look for size indicators
  const sizeIndex = words.findIndex(w => w.toUpperCase() === 'SIZE');
  if (sizeIndex > -1 && words[sizeIndex + 1]) {
    patterns.size = words[sizeIndex + 1];
  }
  
  // Extract keywords (last few words often)
  patterns.keywords = words.slice(-3);
  
  return patterns;
}

// Store patterns in database
async function storePattern(pattern, soldPrice, viewCount) {
  await supabase.from('ebay_patterns').insert({
    brand: pattern.brand,
    garment_type: pattern.garment,
    size_format: pattern.size,
    keywords: pattern.keywords,
    sold_price: soldPrice,
    view_count: viewCount,
    created_at: new Date().toISOString()
  });
}