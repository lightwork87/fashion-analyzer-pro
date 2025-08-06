// app/api/analyze-combined/brandDatabase.js

/**
 * Comprehensive Fashion Brand Database
 * Includes brand tiers, variations, and market values
 */

// Brand database with tiers and variations
export const BRAND_DATABASE = {
  // LUXURY TIER - £500+ retail
  luxury: {
    'Gucci': {
      variations: ['GUCCI', 'GG', 'Gucci Made in Italy'],
      category: ['bags', 'clothing', 'shoes', 'accessories'],
      priceMultiplier: 1.5
    },
    'Louis Vuitton': {
      variations: ['LV', 'LOUIS VUITTON', 'Louis Vuitton Paris'],
      category: ['bags', 'clothing', 'accessories'],
      priceMultiplier: 1.8
    },
    'Chanel': {
      variations: ['CHANEL', 'CC', 'Chanel Paris'],
      category: ['bags', 'clothing', 'jewelry', 'accessories'],
      priceMultiplier: 2.0
    },
    'Hermès': {
      variations: ['HERMÈS', 'HERMES', 'Hermès Paris'],
      category: ['bags', 'clothing', 'accessories'],
      priceMultiplier: 2.5
    },
    'Prada': {
      variations: ['PRADA', 'Prada Milano'],
      category: ['bags', 'clothing', 'shoes'],
      priceMultiplier: 1.4
    },
    'Dior': {
      variations: ['DIOR', 'Christian Dior', 'CD'],
      category: ['bags', 'clothing', 'accessories'],
      priceMultiplier: 1.6
    },
    'Saint Laurent': {
      variations: ['YSL', 'SAINT LAURENT', 'Yves Saint Laurent'],
      category: ['bags', 'clothing', 'shoes'],
      priceMultiplier: 1.5
    },
    'Balenciaga': {
      variations: ['BALENCIAGA', 'Balenciaga Paris'],
      category: ['clothing', 'shoes', 'bags'],
      priceMultiplier: 1.4
    },
    'Bottega Veneta': {
      variations: ['BOTTEGA VENETA', 'BV'],
      category: ['bags', 'clothing', 'shoes'],
      priceMultiplier: 1.5
    },
    'Burberry': {
      variations: ['BURBERRY', 'Burberry London', 'Burberry Brit'],
      category: ['clothing', 'bags', 'accessories'],
      priceMultiplier: 1.3
    },
    'Versace': {
      variations: ['VERSACE', 'Versus Versace', 'Gianni Versace'],
      category: ['clothing', 'accessories'],
      priceMultiplier: 1.3
    },
    'Fendi': {
      variations: ['FENDI', 'FF', 'Fendi Roma'],
      category: ['bags', 'clothing', 'accessories'],
      priceMultiplier: 1.4
    },
    'Givenchy': {
      variations: ['GIVENCHY', 'Givenchy Paris'],
      category: ['clothing', 'bags', 'shoes'],
      priceMultiplier: 1.4
    },
    'Valentino': {
      variations: ['VALENTINO', 'Valentino Garavani', 'V'],
      category: ['clothing', 'bags', 'shoes'],
      priceMultiplier: 1.4
    },
    'Celine': {
      variations: ['CELINE', 'CÉLINE', 'Celine Paris'],
      category: ['bags', 'clothing', 'accessories'],
      priceMultiplier: 1.5
    },
    'Loewe': {
      variations: ['LOEWE', 'Loewe Madrid'],
      category: ['bags', 'clothing'],
      priceMultiplier: 1.4
    },
    'Alexander McQueen': {
      variations: ['ALEXANDER MCQUEEN', 'McQueen', 'AMQ'],
      category: ['clothing', 'shoes', 'accessories'],
      priceMultiplier: 1.3
    },
    'Dolce & Gabbana': {
      variations: ['DOLCE & GABBANA', 'D&G', 'Dolce Gabbana'],
      category: ['clothing', 'accessories'],
      priceMultiplier: 1.3
    },
    'Tom Ford': {
      variations: ['TOM FORD', 'TF'],
      category: ['clothing', 'accessories', 'eyewear'],
      priceMultiplier: 1.5
    },
    'Moncler': {
      variations: ['MONCLER', 'Moncler Genius'],
      category: ['outerwear', 'clothing'],
      priceMultiplier: 1.4
    }
  },
  
  // DESIGNER TIER - £150-500 retail
  designer: {
    'Ralph Lauren': {
      variations: ['RALPH LAUREN', 'Polo Ralph Lauren', 'RRL', 'Purple Label', 'RL'],
      category: ['clothing', 'accessories'],
      priceMultiplier: 1.1
    },
    'Hugo Boss': {
      variations: ['HUGO BOSS', 'BOSS', 'HUGO', 'Boss Orange'],
      category: ['clothing', 'accessories'],
      priceMultiplier: 1.0
    },
    'Armani': {
      variations: ['ARMANI', 'Giorgio Armani', 'Emporio Armani', 'Armani Exchange', 'EA7'],
      category: ['clothing', 'accessories'],
      priceMultiplier: 1.1
    },
    'Michael Kors': {
      variations: ['MICHAEL KORS', 'MK', 'Michael Michael Kors', 'MICHAEL'],
      category: ['bags', 'clothing', 'accessories'],
      priceMultiplier: 0.9
    },
    'Coach': {
      variations: ['COACH', 'Coach New York', 'Coach 1941'],
      category: ['bags', 'accessories'],
      priceMultiplier: 1.0
    },
    'Marc Jacobs': {
      variations: ['MARC JACOBS', 'Marc by Marc Jacobs', 'MJ'],
      category: ['bags', 'clothing', 'accessories'],
      priceMultiplier: 1.0
    },
    'Tory Burch': {
      variations: ['TORY BURCH', 'TB'],
      category: ['bags', 'clothing', 'shoes'],
      priceMultiplier: 0.9
    },
    'Kate Spade': {
      variations: ['KATE SPADE', 'Kate Spade New York', 'KSNY'],
      category: ['bags', 'accessories', 'clothing'],
      priceMultiplier: 0.9
    },
    'Tommy Hilfiger': {
      variations: ['TOMMY HILFIGER', 'Tommy Jeans', 'Hilfiger', 'TH'],
      category: ['clothing', 'accessories'],
      priceMultiplier: 0.8
    },
    'Calvin Klein': {
      variations: ['CALVIN KLEIN', 'CK', 'Calvin Klein Jeans', 'CK Calvin Klein'],
      category: ['clothing', 'underwear', 'accessories'],
      priceMultiplier: 0.8
    },
    'Diesel': {
      variations: ['DIESEL', 'Diesel Industry'],
      category: ['denim', 'clothing'],
      priceMultiplier: 0.9
    },
    'Moschino': {
      variations: ['MOSCHINO', 'Love Moschino', 'Boutique Moschino'],
      category: ['clothing', 'bags', 'accessories'],
      priceMultiplier: 1.0
    },
    'Kenzo': {
      variations: ['KENZO', 'Kenzo Paris'],
      category: ['clothing', 'accessories'],
      priceMultiplier: 1.0
    },
    'Paul Smith': {
      variations: ['PAUL SMITH', 'PS Paul Smith', 'Paul Smith London'],
      category: ['clothing', 'accessories'],
      priceMultiplier: 1.0
    },
    'Ted Baker': {
      variations: ['TED BAKER', 'Ted Baker London', 'TB'],
      category: ['clothing', 'accessories'],
      priceMultiplier: 0.9
    },
    'AllSaints': {
      variations: ['ALLSAINTS', 'All Saints'],
      category: ['clothing', 'leather goods'],
      priceMultiplier: 0.9
    },
    'Acne Studios': {
      variations: ['ACNE STUDIOS', 'ACNE'],
      category: ['clothing', 'denim'],
      priceMultiplier: 1.1
    },
    'Ganni': {
      variations: ['GANNI', 'Ganni Copenhagen'],
      category: ['clothing', 'accessories'],
      priceMultiplier: 1.0
    },
    'Off-White': {
      variations: ['OFF-WHITE', 'Off-White c/o Virgil Abloh', 'OFF'],
      category: ['clothing', 'shoes', 'accessories'],
      priceMultiplier: 1.2
    },
    'Stone Island': {
      variations: ['STONE ISLAND', 'SI', 'Stone Island Junior'],
      category: ['clothing', 'outerwear'],
      priceMultiplier: 1.2
    }
  },
  
  // HIGH STREET TIER - £30-150 retail
  highStreet: {
    'Zara': {
      variations: ['ZARA', 'Zara Woman', 'Zara Man', 'Zara Basic'],
      category: ['clothing', 'accessories'],
      priceMultiplier: 0.6
    },
    'COS': {
      variations: ['COS', 'Collection of Style'],
      category: ['clothing', 'accessories'],
      priceMultiplier: 0.7
    },
    'Massimo Dutti': {
      variations: ['MASSIMO DUTTI', 'MD'],
      category: ['clothing', 'accessories'],
      priceMultiplier: 0.7
    },
    '& Other Stories': {
      variations: ['& OTHER STORIES', 'Other Stories', '&OS'],
      category: ['clothing', 'accessories'],
      priceMultiplier: 0.7
    },
    'Arket': {
      variations: ['ARKET'],
      category: ['clothing', 'accessories'],
      priceMultiplier: 0.7
    },
    'Mango': {
      variations: ['MANGO', 'MNG', 'Mango Man'],
      category: ['clothing', 'accessories'],
      priceMultiplier: 0.6
    },
    'H&M': {
      variations: ['H&M', 'H&M Conscious', 'HM', 'Hennes & Mauritz'],
      category: ['clothing', 'accessories'],
      priceMultiplier: 0.5
    },
    'Uniqlo': {
      variations: ['UNIQLO', 'Uniqlo U'],
      category: ['clothing', 'basics'],
      priceMultiplier: 0.6
    },
    'Gap': {
      variations: ['GAP', 'Gap Factory', 'GapKids'],
      category: ['clothing', 'denim'],
      priceMultiplier: 0.6
    },
    'Banana Republic': {
      variations: ['BANANA REPUBLIC', 'BR'],
      category: ['clothing', 'accessories'],
      priceMultiplier: 0.7
    },
    'J.Crew': {
      variations: ['J.CREW', 'JCrew', 'J.Crew Factory'],
      category: ['clothing', 'accessories'],
      priceMultiplier: 0.7
    },
    'Topshop': {
      variations: ['TOPSHOP', 'Topshop Unique', 'Topshop Boutique'],
      category: ['clothing', 'accessories'],
      priceMultiplier: 0.6
    },
    'Urban Outfitters': {
      variations: ['URBAN OUTFITTERS', 'UO', 'BDG'],
      category: ['clothing', 'accessories'],
      priceMultiplier: 0.6
    },
    'Anthropologie': {
      variations: ['ANTHROPOLOGIE', 'Anthro'],
      category: ['clothing', 'accessories'],
      priceMultiplier: 0.7
    },
    'Free People': {
      variations: ['FREE PEOPLE', 'FP'],
      category: ['clothing', 'boho'],
      priceMultiplier: 0.7
    },
    'Reiss': {
      variations: ['REISS', 'Reiss London'],
      category: ['clothing', 'formalwear'],
      priceMultiplier: 0.8
    },
    'Whistles': {
      variations: ['WHISTLES'],
      category: ['clothing', 'accessories'],
      priceMultiplier: 0.7
    },
    'Jigsaw': {
      variations: ['JIGSAW', 'Jigsaw London'],
      category: ['clothing', 'knitwear'],
      priceMultiplier: 0.7
    }
  },
  
  // SPORTSWEAR TIER
  sportswear: {
    'Nike': {
      variations: ['NIKE', 'Nike Air', 'Jordan', 'Nike SB', 'ACG'],
      category: ['sportswear', 'shoes', 'accessories'],
      priceMultiplier: 0.8
    },
    'Adidas': {
      variations: ['ADIDAS', 'Adidas Originals', 'Y-3', 'Adidas Performance'],
      category: ['sportswear', 'shoes', 'accessories'],
      priceMultiplier: 0.8
    },
    'Lululemon': {
      variations: ['LULULEMON', 'Lululemon Athletica', 'lulu'],
      category: ['activewear', 'yoga'],
      priceMultiplier: 0.9
    },
    'Under Armour': {
      variations: ['UNDER ARMOUR', 'UA', 'Under Armor'],
      category: ['sportswear', 'performance'],
      priceMultiplier: 0.7
    },
    'The North Face': {
      variations: ['THE NORTH FACE', 'TNF', 'North Face'],
      category: ['outerwear', 'sportswear'],
      priceMultiplier: 0.9
    },
    'Patagonia': {
      variations: ['PATAGONIA'],
      category: ['outerwear', 'sportswear'],
      priceMultiplier: 0.9
    },
    'Columbia': {
      variations: ['COLUMBIA', 'Columbia Sportswear'],
      category: ['outerwear', 'sportswear'],
      priceMultiplier: 0.7
    },
    'Puma': {
      variations: ['PUMA', 'Puma Sport'],
      category: ['sportswear', 'shoes'],
      priceMultiplier: 0.7
    },
    'New Balance': {
      variations: ['NEW BALANCE', 'NB'],
      category: ['shoes', 'sportswear'],
      priceMultiplier: 0.7
    },
    'ASICS': {
      variations: ['ASICS', 'Onitsuka Tiger'],
      category: ['shoes', 'sportswear'],
      priceMultiplier: 0.7
    },
    'Reebok': {
      variations: ['REEBOK', 'RBK'],
      category: ['sportswear', 'shoes'],
      priceMultiplier: 0.6
    },
    'Champion': {
      variations: ['CHAMPION', 'Champion USA'],
      category: ['sportswear', 'basics'],
      priceMultiplier: 0.6
    },
    'Fila': {
      variations: ['FILA', 'Fila Sport'],
      category: ['sportswear', 'shoes'],
      priceMultiplier: 0.6
    },
    'Gymshark': {
      variations: ['GYMSHARK', 'Gym Shark'],
      category: ['activewear', 'fitness'],
      priceMultiplier: 0.7
    },
    'Outdoor Voices': {
      variations: ['OUTDOOR VOICES', 'OV'],
      category: ['activewear'],
      priceMultiplier: 0.8
    }
  }
};

/**
 * Detect brand from text using fuzzy matching
 * @param {string} text - Text to search for brands
 * @returns {object} Detected brand info
 */
export function detectBrand(text) {
  if (!text) {
    return { brand: null, confidence: 0, tier: 'unknown' };
  }
  
  const upperText = text.toUpperCase();
  let bestMatch = null;
  let highestConfidence = 0;
  let detectedTier = 'unknown';
  
  // Search through all tiers
  for (const [tier, brands] of Object.entries(BRAND_DATABASE)) {
    for (const [brandName, brandData] of Object.entries(brands)) {
      // Check main brand name
      if (upperText.includes(brandName.toUpperCase())) {
        const confidence = 0.95;
        if (confidence > highestConfidence) {
          highestConfidence = confidence;
          bestMatch = brandName;
          detectedTier = tier;
        }
      }
      
      // Check variations
      for (const variation of brandData.variations) {
        if (upperText.includes(variation.toUpperCase())) {
          const confidence = 0.9;
          if (confidence > highestConfidence) {
            highestConfidence = confidence;
            bestMatch = brandName;
            detectedTier = tier;
          }
        }
      }
    }
  }
  
  // Check for partial matches if no exact match
  if (!bestMatch) {
    const words = upperText.split(/\s+/);
    for (const [tier, brands] of Object.entries(BRAND_DATABASE)) {
      for (const [brandName, brandData] of Object.entries(brands)) {
        const brandWords = brandName.toUpperCase().split(/\s+/);
        const matchingWords = brandWords.filter(word => words.includes(word));
        
        if (matchingWords.length >= brandWords.length * 0.5) {
          const confidence = 0.7 * (matchingWords.length / brandWords.length);
          if (confidence > highestConfidence) {
            highestConfidence = confidence;
            bestMatch = brandName;
            detectedTier = tier;
          }
        }
      }
    }
  }
  
  return {
    brand: bestMatch,
    confidence: highestConfidence,
    tier: detectedTier
  };
}

/**
 * Get brand tier information
 * @param {string} brand - Brand name
 * @returns {string} Brand tier
 */
export function getBrandTier(brand) {
  if (!brand) return 'unknown';
  
  for (const [tier, brands] of Object.entries(BRAND_DATABASE)) {
    if (brands[brand]) {
      return tier;
    }
    // Check if it's a variation
    for (const [brandName, brandData] of Object.entries(brands)) {
      if (brandData.variations.some(v => v.toUpperCase() === brand.toUpperCase())) {
        return tier;
      }
    }
  }
  
  return 'unknown';
}

/**
 * Get brand pricing multiplier
 * @param {string} brand - Brand name
 * @returns {number} Price multiplier
 */
export function getBrandPriceMultiplier(brand) {
  if (!brand) return 1.0;
  
  for (const [tier, brands] of Object.entries(BRAND_DATABASE)) {
    if (brands[brand]) {
      return brands[brand].priceMultiplier || 1.0;
    }
  }
  
  return 1.0;
}

/**
 * Get suggested retail price range for brand
 * @param {string} brand - Brand name
 * @param {string} itemType - Type of item
 * @returns {object} Price range
 */
export function getBrandPriceRange(brand, itemType) {
  const tier = getBrandTier(brand);
  
  // Base price ranges by tier and item type
  const priceRanges = {
    luxury: {
      dress: { min: 800, max: 3000 },
      jacket: { min: 1200, max: 4000 },
      bag: { min: 1500, max: 8000 },
      shoes: { min: 600, max: 1500 },
      default: { min: 500, max: 2000 }
    },
    designer: {
      dress: { min: 200, max: 600 },
      jacket: { min: 300, max: 800 },
      bag: { min: 250, max: 600 },
      shoes: { min: 150, max: 400 },
      default: { min: 150, max: 500 }
    },
    highStreet: {
      dress: { min: 40, max: 120 },
      jacket: { min: 60, max: 150 },
      bag: { min: 30, max: 80 },
      shoes: { min: 30, max: 80 },
      default: { min: 30, max: 100 }
    },
    sportswear: {
      jacket: { min: 80, max: 200 },
      shoes: { min: 60, max: 150 },
      default: { min: 40, max: 120 }
    },
    unknown: {
      default: { min: 20, max: 80 }
    }
  };
  
  const tierPrices = priceRanges[tier] || priceRanges.unknown;
  const itemPrices = tierPrices[itemType] || tierPrices.default;
  
  return itemPrices;
}

export default {
  BRAND_DATABASE,
  detectBrand,
  getBrandTier,
  getBrandPriceMultiplier,
  getBrandPriceRange
};