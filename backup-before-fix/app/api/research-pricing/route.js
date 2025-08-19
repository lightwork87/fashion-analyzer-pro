import { NextResponse } from 'next/server';

// ========================================
// EBAY PRICING RESEARCHER WITH SMART FALLBACKS
// ========================================
class EBayPricingResearcher {
  constructor() {
    this.clientId = process.env.EBAY_CLIENT_ID;
    this.clientSecret = process.env.EBAY_CLIENT_SECRET;
    this.environment = process.env.EBAY_ENVIRONMENT || 'SANDBOX';
    this.baseUrl = this.environment === 'PRODUCTION' 
      ? 'https://api.ebay.com' 
      : 'https://api.sandbox.ebay.com';
  }

  async getAccessToken() {
    const authUrl = `${this.baseUrl}/identity/v1/oauth2/token`;
    const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');

    const response = await fetch(authUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials&scope=https://api.ebay.com/oauth/api_scope'
    });

    if (!response.ok) {
      throw new Error(`eBay auth failed: ${response.status}`);
    }

    const data = await response.json();
    return data.access_token;
  }

  async searchCompletedListings(query, category = null) {
    console.log(`🔍 Searching eBay for: "${query}"`);
    
    try {
      const accessToken = await this.getAccessToken();
      const searchUrl = `${this.baseUrl}/buy/browse/v1/item_summary/search`;
      
      const params = new URLSearchParams({
        q: query,
        filter: 'conditionIds:{3000,4000,5000},buyingOptions:{AUCTION,FIXED_PRICE},itemLocationCountry:GB',
        sort: 'price',
        limit: '20'
      });

      if (category) {
        params.append('category_ids', category);
      }

      const response = await fetch(`${searchUrl}?${params}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'X-EBAY-C-ENDUSERCTX': 'contextualLocation=country=GB,zip=SW1A1AA'
        }
      });

      if (!response.ok) {
        throw new Error(`eBay search failed: ${response.status}`);
      }

      const data = await response.json();
      return this.processEBayResults(data);
      
    } catch (error) {
      console.log('⚠️ eBay API failed, using fallback pricing...');
      throw error; // Let this bubble up to trigger fallback
    }
  }

  processEBayResults(data) {
    const items = data.itemSummaries || [];
    const prices = items
      .filter(item => item.price && item.price.value)
      .map(item => parseFloat(item.price.value));

    if (prices.length === 0) {
      return { prices: [], avgPrice: 0, minPrice: 0, maxPrice: 0, count: 0 };
    }

    prices.sort((a, b) => a - b);
    const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
    
    return {
      prices,
      avgPrice: Math.round(avgPrice * 100) / 100,
      minPrice: Math.min(...prices),
      maxPrice: Math.max(...prices),
      count: prices.length,
      currency: items[0]?.price?.currency || 'GBP'
    };
  }

  // ========================================
  // SMART FALLBACK PRICING SYSTEM
  // ========================================
  generateFallbackPricing(analysisData) {
    console.log('🧠 Generating intelligent fallback pricing recommendations...');
    
    const brand = analysisData.brand?.toLowerCase() || '';
    const itemType = analysisData.item_type?.toLowerCase() || '';
    const condition = analysisData.condition?.toLowerCase() || '';
    const marketTier = analysisData.market_tier?.toLowerCase() || 'high-street';
    const size = analysisData.size || '';
    
    // Base pricing by market tier
    const tierPricing = {
      'luxury': { min: 50, max: 300, multiplier: 1.8 },
      'designer': { min: 30, max: 200, multiplier: 1.5 },
      'high-street': { min: 8, max: 50, multiplier: 1.0 },
      'sportswear': { min: 15, max: 80, multiplier: 1.2 },
      'vintage': { min: 12, max: 60, multiplier: 1.3 }
    };
    
    // Brand multipliers (UK market focus)
    const brandMultipliers = {
      'nike': 1.4, 'adidas': 1.4, 'puma': 1.2, 'under armour': 1.2,
      'zara': 1.1, 'h&m': 0.9, 'uniqlo': 1.0, 'gap': 1.0,
      'calvin klein': 1.3, 'tommy hilfiger': 1.3, 'ralph lauren': 1.5,
      'levis': 1.3, 'converse': 1.2, 'vans': 1.1,
      'gucci': 2.5, 'prada': 2.3, 'louis vuitton': 2.8, 'chanel': 3.0,
      'dior': 2.5, 'versace': 2.2, 'armani': 1.8, 'hugo boss': 1.6,
      'burberry': 2.0, 'stone island': 1.9, 'moncler': 2.1,
      'allsaints': 1.4, 'ted baker': 1.3, 'reiss': 1.2, 'cos': 1.1,
      'other stories': 1.0, 'massimo dutti': 1.2, 'sandro': 1.6
    };
    
    // Item type adjustments
    const itemTypeAdjustments = {
      'dress': 1.2, 'coat': 1.4, 'jacket': 1.3, 'blazer': 1.2,
      'jeans': 1.1, 'trousers': 1.0, 'skirt': 0.9, 'top': 0.8,
      'shirt': 0.9, 'blouse': 1.0, 'jumper': 1.1, 'cardigan': 1.0,
      'trainers': 1.2, 'boots': 1.3, 'shoes': 1.1, 'sandals': 0.9,
      'bag': 1.3, 'handbag': 1.4, 'backpack': 1.1, 'wallet': 0.8,
      'scarf': 0.7, 'belt': 0.8, 'hat': 0.7, 'sunglasses': 1.0
    };
    
    // Condition multipliers
    const conditionMultipliers = {
      'new': 1.0, 'excellent': 0.85, 'very good': 0.75, 'good': 0.65,
      'fair': 0.45, 'poor': 0.25, 'damaged': 0.15
    };
    
    // Calculate base price range
    const basePricing = tierPricing[marketTier] || tierPricing['high-street'];
    let minPrice = basePricing.min;
    let maxPrice = basePricing.max;
    
    // Apply brand multiplier
    const brandMultiplier = this.findBrandMultiplier(brand, brandMultipliers);
    minPrice *= brandMultiplier;
    maxPrice *= brandMultiplier;
    
    // Apply item type adjustment
    const itemMultiplier = this.findItemTypeMultiplier(itemType, itemTypeAdjustments);
    minPrice *= itemMultiplier;
    maxPrice *= itemMultiplier;
    
    // Apply condition multiplier
    const conditionMultiplier = this.findConditionMultiplier(condition, conditionMultipliers);
    minPrice *= conditionMultiplier;
    maxPrice *= conditionMultiplier;
    
    // Round to reasonable values
    minPrice = Math.max(5, Math.round(minPrice));
    maxPrice = Math.max(minPrice + 5, Math.round(maxPrice));
    
    // Calculate recommended listing price (slightly above middle)
    const recommendedPrice = Math.round((minPrice + maxPrice) / 2 * 1.1);
    
    // Generate market insights
    const insights = this.generateMarketInsights(analysisData, brandMultiplier, itemMultiplier);
    
    return {
      pricing: {
        recommended_price: recommendedPrice,
        price_range: {
          min: minPrice,
          max: maxPrice
        },
        currency: 'GBP'
      },
      market_analysis: {
        demand_level: this.calculateDemandLevel(brandMultiplier, itemMultiplier),
        competition_level: this.calculateCompetitionLevel(marketTier, brand),
        seasonal_factor: this.getSeasonalFactor(itemType),
        size_popularity: this.getSizePopularity(size)
      },
      insights,
      methodology: 'Intelligent fallback pricing based on UK market data, brand positioning, and item characteristics',
      confidence: this.calculateConfidence(analysisData, brandMultiplier)
    };
  }
  
  findBrandMultiplier(brand, multipliers) {
    // Find exact match first
    if (multipliers[brand]) return multipliers[brand];
    
    // Try partial matches
    for (const [key, value] of Object.entries(multipliers)) {
      if (brand.includes(key) || key.includes(brand)) {
        return value;
      }
    }
    
    return 1.0; // Default
  }
  
  findItemTypeMultiplier(itemType, adjustments) {
    // Find exact match first
    if (adjustments[itemType]) return adjustments[itemType];
    
    // Try partial matches
    for (const [key, value] of Object.entries(adjustments)) {
      if (itemType.includes(key) || key.includes(itemType)) {
        return value;
      }
    }
    
    return 1.0; // Default
  }
  
  findConditionMultiplier(condition, multipliers) {
    // Find the best matching condition
    const conditionWords = condition.split(' ');
    
    for (const word of conditionWords) {
      if (multipliers[word]) {
        return multipliers[word];
      }
    }
    
    // Default to 'good' condition if no match
    return multipliers['good'] || 0.65;
  }
  
  calculateDemandLevel(brandMultiplier, itemMultiplier) {
    const combined = brandMultiplier * itemMultiplier;
    if (combined >= 1.5) return 'High';
    if (combined >= 1.1) return 'Medium';
    return 'Low';
  }
  
  calculateCompetitionLevel(marketTier, brand) {
    if (['luxury', 'designer'].includes(marketTier)) return 'Low';
    if (marketTier === 'high-street') return 'High';
    return 'Medium';
  }
  
  getSeasonalFactor(itemType) {
    const currentMonth = new Date().getMonth() + 1;
    const summer = [5, 6, 7, 8];
    const winter = [11, 12, 1, 2];
    
    const summerItems = ['shorts', 'sandals', 'bikini', 'swimwear', 'sundress'];
    const winterItems = ['coat', 'boots', 'jumper', 'scarf', 'gloves'];
    
    if (summer.includes(currentMonth) && summerItems.some(item => itemType.includes(item))) {
      return 'Peak Season';
    }
    if (winter.includes(currentMonth) && winterItems.some(item => itemType.includes(item))) {
      return 'Peak Season';
    }
    
    return 'Standard';
  }
  
  getSizePopularity(size) {
    const popularSizes = ['uk8', 'uk10', 'uk12', 's', 'm', 'l'];
    const sizeStr = size.toLowerCase();
    
    if (popularSizes.some(popular => sizeStr.includes(popular))) {
      return 'High';
    }
    
    return 'Medium';
  }
  
  generateMarketInsights(analysisData, brandMultiplier, itemMultiplier) {
    const insights = [];
    
    if (brandMultiplier >= 1.5) {
      insights.push(`Strong brand recognition - ${analysisData.brand} commands premium pricing in UK market`);
    }
    
    if (itemMultiplier >= 1.2) {
      insights.push(`${analysisData.item_type} is a high-demand category with good resale value`);
    }
    
    if (analysisData.size && ['uk8', 'uk10', 'uk12'].some(s => analysisData.size.toLowerCase().includes(s))) {
      insights.push('Popular UK size - expect higher demand and competitive pricing');
    }
    
    if (analysisData.uk_keywords?.includes('sustainable') || analysisData.uk_keywords?.includes('preloved')) {
      insights.push('Sustainability focus appeals to UK eco-conscious buyers - emphasize in listing');
    }
    
    const condition = analysisData.condition?.toLowerCase() || '';
    if (condition.includes('excellent') || condition.includes('new')) {
      insights.push('Excellent condition allows for premium pricing strategy');
    }
    
    if (insights.length === 0) {
      insights.push('Standard market positioning - price competitively for quick sale');
    }
    
    return insights;
  }
  
  calculateConfidence(analysisData, brandMultiplier) {
    let confidence = 0;
    
    // Brand recognition adds confidence
    if (brandMultiplier >= 1.3) confidence += 30;
    else if (brandMultiplier >= 1.1) confidence += 20;
    else confidence += 10;
    
    // Size detection adds confidence
    if (analysisData.size_confidence === 'certain') confidence += 25;
    else if (analysisData.size_confidence === 'likely') confidence += 15;
    else confidence += 5;
    
    // Overall analysis confidence
    if (analysisData.confidence === 'High') confidence += 25;
    else if (analysisData.confidence === 'Medium') confidence += 15;
    else confidence += 5;
    
    // Brand detection adds confidence
    if (analysisData.vision_data?.brands_detected?.length > 0) confidence += 20;
    
    return Math.min(confidence, 100);
  }

  async researchPricing(analysisData) {
    console.log('💰 Starting eBay pricing research...');
    
    // Extract search terms from analysis
    const searchTerms = this.buildSearchQuery(analysisData);
    console.log(`🔍 Item: ${analysisData.brand} ${analysisData.item_type} ${analysisData.size}`);
    
    try {
      // Try real eBay API first
      const results = await this.searchCompletedListings(searchTerms);
      
      return {
        success: true,
        pricing: {
          recommended_price: Math.round(results.avgPrice * 1.1),
          price_range: {
            min: results.minPrice,
            max: results.maxPrice
          },
          average_sold_price: results.avgPrice,
          currency: results.currency
        },
        market_data: {
          total_listings: results.count,
          price_distribution: this.analyzePriceDistribution(results.prices)
        },
        source: 'eBay API',
        confidence: 90
      };
      
    } catch (error) {
      console.log('⚠️ eBay API unavailable, generating intelligent fallback pricing...');
      
      // Use smart fallback system
      const fallbackResults = this.generateFallbackPricing(analysisData);
      
      return {
        success: true,
        ...fallbackResults,
        source: 'Intelligent Market Analysis',
        note: 'Pricing based on UK market analysis and brand positioning (eBay API unavailable)'
      };
    }
  }

  buildSearchQuery(analysisData) {
    const parts = [];
    
    if (analysisData.brand && analysisData.brand !== 'Unknown') {
      parts.push(analysisData.brand);
    }
    
    if (analysisData.item_type && analysisData.item_type !== 'Fashion item') {
      parts.push(analysisData.item_type);
    }
    
    if (analysisData.size && analysisData.size !== 'Unknown') {
      parts.push(analysisData.size);
    }
    
    return parts.length > 0 ? parts.join(' ') : 'fashion clothing';
  }

  analyzePriceDistribution(prices) {
    if (!prices || prices.length === 0) return null;
    
    const sorted = [...prices].sort((a, b) => a - b);
    const count = sorted.length;
    
    return {
      lowest: sorted[0],
      highest: sorted[count - 1],
      median: count % 2 === 0 
        ? (sorted[count/2 - 1] + sorted[count/2]) / 2
        : sorted[Math.floor(count/2)],
      q1: sorted[Math.floor(count * 0.25)],
      q3: sorted[Math.floor(count * 0.75)]
    };
  }
}

// ========================================
// API ROUTE HANDLER
// ========================================
export async function POST(request) {
  try {
    const analysisData = await request.json();
    console.log('💰 Starting eBay pricing research...');
    
    const researcher = new EBayPricingResearcher();
    const results = await researcher.researchPricing(analysisData);
    
    console.log('✅ Pricing research completed successfully');
    
    return NextResponse.json(results);
    
  } catch (error) {
    console.error('❌ eBay pricing research failed:', error);
    
    // Final fallback - basic pricing
    return NextResponse.json({
      success: false,
      error: 'Pricing research failed',
      fallback_pricing: {
        recommended_price: 25,
        price_range: { min: 15, max: 40 },
        currency: 'GBP'
      },
      note: 'Using basic fallback pricing - please research manually on eBay'
    });
  }
}