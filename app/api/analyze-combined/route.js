import { NextResponse } from 'next/server';
import { detectBrand, getBrandTier } from './brandDatabase.js';
import { generateEbayTitle, generateSearchKeywords } from './titleGenerator.js';
import { analyzeCondition, getEbayConditionCode } from './conditionAnalyzer.js';

export const runtime = 'edge';
export const maxDuration = 60;

export async function OPTIONS(request) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

// Generate unique SKU
function generateSKU(bagNumber, itemIndex, brand) {
  const date = new Date();
  const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;
  const brandPrefix = brand ? brand.substring(0, 3).toUpperCase() : 'ITM';
  const bag = bagNumber || 'XX';
  
  return `${brandPrefix}-${dateStr}-${bag}-${itemIndex + 1}`;
}

export async function POST(request) {
  console.log('=== ENHANCED ANALYSIS ENDPOINT HIT ===');
  
  try {
    const contentLength = request.headers.get('content-length');
    console.log('Request size:', contentLength, 'bytes');
    
    let body;
    try {
      body = await request.json();
      console.log('Body parsed successfully');
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      return NextResponse.json(
        { error: 'Invalid JSON in request body', details: parseError.message },
        { status: 400 }
      );
    }
    
    const { images, bagNumber, manualOverrides = {} } = body;
    
    if (!images || !Array.isArray(images)) {
      return NextResponse.json(
        { error: 'No images provided or invalid format' },
        { status: 400 }
      );
    }
    
    console.log(`Processing ${images.length} images for bag ${bagNumber || 'unknown'}`);
    
    // Process each image
    const processedItems = images.map((img, index) => {
      // Mock data that would come from AI analysis
      const mockAnalysis = {
        type: 'dress',
        color: 'black',
        material: 'cotton',
        detectedText: 'ZARA WOMAN',
        visualCondition: 'excellent',
        measurements: null
      };
      
      // Apply manual overrides
      const size = manualOverrides.size?.[index] || mockAnalysis.size || 'M';
      const gender = manualOverrides.gender?.[index] || mockAnalysis.gender || 'womens';
      
      // Detect brand
      const brandInfo = detectBrand(mockAnalysis.detectedText);
      const brandTier = getBrandTier(brandInfo.brand);
      
      // Analyze condition
      const conditionAnalysis = analyzeCondition({
        description: mockAnalysis.visualCondition,
        visualAnalysis: { condition: mockAnalysis.visualCondition }
      });
      
      // Generate item data
      const itemData = {
        type: mockAnalysis.type,
        detectedBrand: brandInfo,
        color: mockAnalysis.color,
        size: size,
        gender: gender,
        material: mockAnalysis.material,
        condition: conditionAnalysis.condition,
        model: '',
        season: '',
        style: ''
      };
      
      // Generate eBay title
      const ebayTitle = generateEbayTitle(itemData);
      
      // Generate keywords
      const keywords = generateSearchKeywords(itemData);
      
      // Generate SKU
      const sku = generateSKU(bagNumber, index, brandInfo.brand);
      
      // Calculate pricing based on brand tier and condition
      const basePrice = calculatePrice(brandTier, conditionAnalysis.condition);
      
      return {
        id: `item-${Date.now()}-${index}`,
        sku: sku,
        title: `${brandInfo.brand || 'Fashion'} ${gender} ${mockAnalysis.type}`,
        ebayTitle: ebayTitle,
        description: generateDescription(itemData, conditionAnalysis),
        condition: conditionAnalysis.condition,
        conditionCode: getEbayConditionCode(conditionAnalysis.condition),
        conditionDescription: conditionAnalysis.description,
        conditionConfidence: conditionAnalysis.confidence,
        suggestedPrice: basePrice,
        priceRange: {
          min: Math.round(basePrice * 0.8),
          max: Math.round(basePrice * 1.3),
          average: basePrice
        },
        brand: brandInfo.brand || 'Unbranded',
        brandConfidence: brandInfo.confidence,
        brandTier: brandTier,
        size: size,
        gender: gender,
        color: mockAnalysis.color,
        material: mockAnalysis.material,
        category: getCategoryFromType(mockAnalysis.type),
        measurements: mockAnalysis.measurements,
        keywords: keywords,
        searchKeywords: keywords.join(', '),
        imageUrl: img.substring(0, 50) + '...',
        aiInsights: {
          brandConfidence: brandInfo.confidence,
          conditionScore: conditionAnalysis.confidence,
          marketDemand: getMarketDemand(brandTier),
          listingQuality: 'EXCELLENT',
          pricingConfidence: 0.85
        },
        manualOverrides: {
          size: manualOverrides.size?.[index] || null,
          gender: manualOverrides.gender?.[index] || null
        }
      };
    });
    
    // Calculate summary statistics
    const totalValue = processedItems.reduce((sum, item) => sum + item.suggestedPrice, 0);
    const avgConditionScore = processedItems.reduce((sum, item) => sum + item.conditionConfidence, 0) / processedItems.length;
    
    const results = {
      success: true,
      items: processedItems,
      summary: {
        totalItems: processedItems.length,
        totalEstimatedValue: totalValue,
        averageItemValue: Math.round(totalValue / processedItems.length),
        bagNumber: bagNumber || `BAG-${Date.now()}`,
        brandBreakdown: getBrandBreakdown(processedItems),
        conditionBreakdown: getConditionBreakdown(processedItems),
        averageConditionScore: avgConditionScore
      },
      tokensUsed: processedItems.length * 2,
      processingTime: 2.5,
      timestamp: new Date().toISOString()
    };
    
    console.log('=== ENHANCED ANALYSIS COMPLETE ===');
    console.log(`Processed ${results.items.length} items with SKUs`);
    
    return NextResponse.json(results);
    
  } catch (error) {
    console.error('=== ANALYSIS ERROR ===');
    console.error('Error:', error);
    
    return NextResponse.json(
      { 
        error: 'Analysis failed', 
        message: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// Helper functions
function calculatePrice(brandTier, condition) {
  const basePrices = {
    luxury: { NEW: 500, EXCELLENT: 350, VERY_GOOD: 250, GOOD: 150, FAIR: 75 },
    designer: { NEW: 250, EXCELLENT: 175, VERY_GOOD: 125, GOOD: 75, FAIR: 40 },
    highStreet: { NEW: 75, EXCELLENT: 50, VERY_GOOD: 35, GOOD: 25, FAIR: 15 },
    sportswear: { NEW: 100, EXCELLENT: 70, VERY_GOOD: 50, GOOD: 35, FAIR: 20 },
    default: { NEW: 50, EXCELLENT: 35, VERY_GOOD: 25, GOOD: 15, FAIR: 10 }
  };
  
  const tierPrices = basePrices[brandTier] || basePrices.default;
  return tierPrices[condition] || tierPrices.GOOD;
}

function getMarketDemand(brandTier) {
  const demandMap = {
    luxury: 'VERY HIGH',
    designer: 'HIGH',
    highStreet: 'MEDIUM',
    sportswear: 'HIGH',
    default: 'MEDIUM'
  };
  return demandMap[brandTier] || 'MEDIUM';
}

function getCategoryFromType(type) {
  const categoryMap = {
    dress: 'Womens Clothing > Dresses',
    shirt: 'Clothing > Shirts & Tops',
    jacket: 'Clothing > Coats & Jackets',
    jeans: 'Clothing > Jeans',
    shoes: 'Footwear',
    bag: 'Bags & Accessories',
    accessory: 'Accessories'
  };
  return categoryMap[type] || 'Clothing';
}

function generateDescription(itemData, conditionAnalysis) {
  const { detectedBrand, type, color, size, gender, material, condition } = itemData;
  
  return `${detectedBrand.brand || 'Designer'} ${gender} ${type} in ${color}.

${conditionAnalysis.description}

Key Features:
- Brand: ${detectedBrand.brand || 'High-quality brand'}
- Size: ${size}
- Color: ${color}
- Material: ${material || 'Premium fabric'}
- Gender: ${gender}

This is an authentic ${detectedBrand.brand || 'designer'} piece perfect for any wardrobe. 
${condition === 'NEW' ? 'Brand new with tags - never worn!' : 'Pre-loved item in great condition.'}

All items are carefully inspected and authenticated.
Ships within 1 business day with tracking.
Check our other listings for more ${detectedBrand.brand || 'designer'} items!`;
}

function getBrandBreakdown(items) {
  const brands = {};
  items.forEach(item => {
    const brand = item.brand || 'Unbranded';
    brands[brand] = (brands[brand] || 0) + 1;
  });
  return brands;
}

function getConditionBreakdown(items) {
  const conditions = {};
  items.forEach(item => {
    conditions[item.condition] = (conditions[item.condition] || 0) + 1;
  });
  return conditions;
}