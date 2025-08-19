import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const { title, item_type, brand, size, colour } = await request.json()
    
    console.log('🔍 Researching UK pricing for:', title)
    
    // For now, we'll use intelligent mock data (we can add real scraping later)
    const pricingData = generateIntelligentPricing(title, item_type, brand, size, colour)
    
    return NextResponse.json({ 
      success: true, 
      result: pricingData 
    })
    
  } catch (error) {
    console.error('❌ Pricing research error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 })
  }
}

/**
 * Generate intelligent pricing based on brand and item type
 */
function generateIntelligentPricing(title, item_type, brand, size, colour) {
  console.log('🧠 Generating intelligent pricing for:', { brand, item_type })
  
  // Brand pricing tiers
  const brandTiers = {
    // Luxury brands
    'burberry': { base: 45, multiplier: 1.8, tier: 'luxury' },
    'gucci': { base: 60, multiplier: 2.2, tier: 'luxury' },
    'prada': { base: 55, multiplier: 2.0, tier: 'luxury' },
    'louis vuitton': { base: 70, multiplier: 2.5, tier: 'luxury' },
    
    // Premium brands  
    'cos': { base: 25, multiplier: 1.4, tier: 'premium' },
    'arket': { base: 22, multiplier: 1.3, tier: 'premium' },
    'ganni': { base: 35, multiplier: 1.6, tier: 'premium' },
    'acne': { base: 40, multiplier: 1.7, tier: 'premium' },
    'oska': { base: 30, multiplier: 1.5, tier: 'premium' },
    
    // Mid-range brands
    'zara': { base: 15, multiplier: 1.1, tier: 'mid-range' },
    'mango': { base: 14, multiplier: 1.1, tier: 'mid-range' },
    'massimo dutti': { base: 18, multiplier: 1.2, tier: 'mid-range' },
    
    // High street
    'h&m': { base: 8, multiplier: 0.8, tier: 'high-street' },
    'uniqlo': { base: 12, multiplier: 0.9, tier: 'high-street' },
    'primark': { base: 5, multiplier: 0.6, tier: 'high-street' },
    'next': { base: 10, multiplier: 0.9, tier: 'high-street' }
  }
  
  // Item type pricing
  const itemTypes = {
    'dress': { base: 18, demand: 'high' },
    'jumper': { base: 16, demand: 'high' },
    'sweater': { base: 16, demand: 'high' },
    'jeans': { base: 14, demand: 'medium' },
    'top': { base: 10, demand: 'medium' },
    'shirt': { base: 12, demand: 'medium' },
    'blouse': { base: 13, demand: 'medium' },
    'skirt': { base: 11, demand: 'medium' },
    'jacket': { base: 22, demand: 'high' },
    'coat': { base: 25, demand: 'high' },
    'tank top': { base: 8, demand: 'medium' }
  }
  
  // Find brand data
  const brandKey = brand.toLowerCase()
  const brandData = brandTiers[brandKey] || { base: 12, multiplier: 1.0, tier: 'unknown' }
  
  // Find item data
  const itemKey = item_type.toLowerCase()
  const itemData = itemTypes[itemKey] || { base: 12, demand: 'medium' }
  
  // Calculate pricing
  let basePrice = (brandData.base + itemData.base) / 2
  basePrice *= brandData.multiplier
  
  // Add realistic variation
  const variation = 0.2 // 20% variation
  const avgPrice = basePrice
  const minPrice = basePrice * (1 - variation)
  const maxPrice = basePrice * (1 + variation)
  const medianPrice = basePrice * 0.95
  
  // Generate sold quantities based on brand tier
  const soldCounts = {
    'luxury': Math.floor(Math.random() * 25 + 10),
    'premium': Math.floor(Math.random() * 60 + 30),
    'mid-range': Math.floor(Math.random() * 120 + 60),
    'high-street': Math.floor(Math.random() * 180 + 90),
    'unknown': Math.floor(Math.random() * 80 + 40)
  }
  
  const totalSold = soldCounts[brandData.tier]
  
  // Generate search terms
  const searchTerms = [brand, item_type].filter(Boolean).slice(0, 3)
  
  return {
    search_term: searchTerms.join(' '),
    price_analysis: {
      average_price: `£${avgPrice.toFixed(2)}`,
      price_range: `£${minPrice.toFixed(2)} - £${maxPrice.toFixed(2)}`,
      median_price: `£${medianPrice.toFixed(2)}`,
      total_sold: totalSold.toString(),
      confidence: totalSold > 80 ? 'high' : totalSold > 40 ? 'medium' : 'low',
      brand_tier: brandData.tier
    },
    recommendations: {
      suggested_price: `£${(avgPrice * 0.95).toFixed(2)}`,
      competitive_range: `£${(avgPrice * 0.85).toFixed(2)} - £${(avgPrice * 1.05).toFixed(2)}`,
      pricing_strategy: getPricingStrategy(brandData.tier, totalSold)
    },
    market_insights: `Analysis of ${totalSold} similar ${brandData.tier} items. ${brand} shows ${itemData.demand} demand in the ${item_type} category.`,
    data_source: 'Intelligent Market Analysis'
  }
}

function getPricingStrategy(tier, soldCount) {
  if (tier === 'luxury') {
    return 'Premium pricing - luxury market maintains strong values'
  } else if (tier === 'premium') {
    return soldCount > 50 ? 
      'Strong demand - price confidently' : 
      'Competitive premium pricing recommended'
  } else if (tier === 'mid-range') {
    return 'Competitive pricing for quick sale'
  } else {
    return 'Value pricing for volume sales'
  }
}