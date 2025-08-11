// Brand database for fashion items
const brands = {
  // Luxury brands
  'gucci': { name: 'Gucci', tier: 'luxury', priceMultiplier: 3.0 },
  'louis vuitton': { name: 'Louis Vuitton', tier: 'luxury', priceMultiplier: 3.5 },
  'chanel': { name: 'Chanel', tier: 'luxury', priceMultiplier: 3.2 },
  'prada': { name: 'Prada', tier: 'luxury', priceMultiplier: 2.8 },
  'versace': { name: 'Versace', tier: 'luxury', priceMultiplier: 2.5 },
  'balenciaga': { name: 'Balenciaga', tier: 'luxury', priceMultiplier: 2.7 },
  'burberry': { name: 'Burberry', tier: 'luxury', priceMultiplier: 2.4 },
  
  // Premium brands
  'ralph lauren': { name: 'Ralph Lauren', tier: 'premium', priceMultiplier: 1.8 },
  'tommy hilfiger': { name: 'Tommy Hilfiger', tier: 'premium', priceMultiplier: 1.5 },
  'calvin klein': { name: 'Calvin Klein', tier: 'premium', priceMultiplier: 1.5 },
  'michael kors': { name: 'Michael Kors', tier: 'premium', priceMultiplier: 1.6 },
  'coach': { name: 'Coach', tier: 'premium', priceMultiplier: 1.7 },
  'hugo boss': { name: 'Hugo Boss', tier: 'premium', priceMultiplier: 1.6 },
  
  // High street UK brands
  'ted baker': { name: 'Ted Baker', tier: 'high-street', priceMultiplier: 1.4 },
  'all saints': { name: 'AllSaints', tier: 'high-street', priceMultiplier: 1.3 },
  'cos': { name: 'COS', tier: 'high-street', priceMultiplier: 1.2 },
  'reiss': { name: 'Reiss', tier: 'high-street', priceMultiplier: 1.3 },
  'whistles': { name: 'Whistles', tier: 'high-street', priceMultiplier: 1.2 },
  'jigsaw': { name: 'Jigsaw', tier: 'high-street', priceMultiplier: 1.2 },
  
  // Popular UK brands
  'next': { name: 'Next', tier: 'mid-range', priceMultiplier: 1.0 },
  'marks & spencer': { name: 'Marks & Spencer', tier: 'mid-range', priceMultiplier: 1.0 },
  'm&s': { name: 'Marks & Spencer', tier: 'mid-range', priceMultiplier: 1.0 },
  'john lewis': { name: 'John Lewis', tier: 'mid-range', priceMultiplier: 1.1 },
  'zara': { name: 'Zara', tier: 'fast-fashion', priceMultiplier: 0.9 },
  'h&m': { name: 'H&M', tier: 'fast-fashion', priceMultiplier: 0.7 },
  'uniqlo': { name: 'Uniqlo', tier: 'fast-fashion', priceMultiplier: 0.8 },
  'mango': { name: 'Mango', tier: 'fast-fashion', priceMultiplier: 0.8 },
  
  // UK budget brands
  'primark': { name: 'Primark', tier: 'budget', priceMultiplier: 0.5 },
  'george': { name: 'George (ASDA)', tier: 'budget', priceMultiplier: 0.5 },
  'tu': { name: 'Tu (Sainsbury\'s)', tier: 'budget', priceMultiplier: 0.5 },
  'f&f': { name: 'F&F (Tesco)', tier: 'budget', priceMultiplier: 0.5 },
  
  // Sports brands
  'nike': { name: 'Nike', tier: 'premium', priceMultiplier: 1.5 },
  'adidas': { name: 'Adidas', tier: 'premium', priceMultiplier: 1.4 },
  'puma': { name: 'Puma', tier: 'mid-range', priceMultiplier: 1.1 },
  'under armour': { name: 'Under Armour', tier: 'premium', priceMultiplier: 1.3 },
  'reebok': { name: 'Reebok', tier: 'mid-range', priceMultiplier: 1.0 },
  'new balance': { name: 'New Balance', tier: 'premium', priceMultiplier: 1.3 },
  
  // Outdoor brands
  'north face': { name: 'The North Face', tier: 'premium', priceMultiplier: 1.6 },
  'patagonia': { name: 'Patagonia', tier: 'premium', priceMultiplier: 1.7 },
  'columbia': { name: 'Columbia', tier: 'mid-range', priceMultiplier: 1.2 },
  'berghaus': { name: 'Berghaus', tier: 'mid-range', priceMultiplier: 1.2 },
};

export const brandDatabase = {
  searchBrand: function(brandName) {
    if (!brandName) return null;
    
    const normalized = brandName.toLowerCase().trim();
    
    // Direct match
    if (brands[normalized]) {
      return brands[normalized];
    }
    
    // Partial match
    for (const [key, value] of Object.entries(brands)) {
      if (normalized.includes(key) || key.includes(normalized)) {
        return value;
      }
    }
    
    return null;
  },
  
  getAllBrands: function() {
    return Object.values(brands);
  },
  
  getBrandsByTier: function(tier) {
    return Object.values(brands).filter(brand => brand.tier === tier);
  }
};