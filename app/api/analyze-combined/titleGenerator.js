import { detectBrand, getBrandTier } from './brandDatabase.js';

// Title structure templates based on category
const titleTemplates = {
  clothing: {
    luxury: "{BRAND} {GENDER} {TYPE} {COLOR} {MATERIAL} Size {SIZE} {CONDITION}",
    designer: "{BRAND} {GENDER} {TYPE} {COLOR} Size {SIZE} {CONDITION} {SEASON}",
    highStreet: "{GENDER} {BRAND} {TYPE} {COLOR} Size {SIZE} {CONDITION} {STYLE}",
    default: "{GENDER} {TYPE} {BRAND} {COLOR} Size {SIZE} {CONDITION}"
  },
  bags: {
    luxury: "{BRAND} {MODEL} {TYPE} Bag {COLOR} {MATERIAL} {CONDITION} Authentic",
    designer: "{BRAND} {GENDER} {TYPE} Bag {COLOR} {SIZE_DESC} {CONDITION}",
    default: "{GENDER} {BRAND} {TYPE} Bag {COLOR} {CONDITION}"
  },
  shoes: {
    luxury: "{BRAND} {GENDER} {TYPE} {COLOR} {MATERIAL} Size {SIZE} {CONDITION}",
    sportswear: "{BRAND} {MODEL} {TYPE} Trainers Size {SIZE} {COLOR} {CONDITION}",
    default: "{GENDER} {BRAND} {TYPE} Shoes {COLOR} Size {SIZE} {CONDITION}"
  },
  accessories: {
    luxury: "{BRAND} {TYPE} {MATERIAL} {COLOR} {CONDITION} Authentic",
    designer: "{BRAND} {GENDER} {TYPE} {COLOR} {CONDITION}",
    default: "{BRAND} {TYPE} {COLOR} {CONDITION}"
  }
};

// Enhanced keyword database
const keywordEnhancements = {
  conditions: {
    'NEW': ['BNWT', 'Tags', 'Unworn', 'Brand New'],
    'EXCELLENT': ['Mint', 'Pristine', 'Like New', 'Barely Worn'],
    'VERY_GOOD': ['Great Condition', 'Well Maintained', 'Light Wear'],
    'GOOD': ['Good Used', 'Some Wear', 'Pre-loved'],
    'FAIR': ['Vintage', 'Distressed', 'Well Worn', 'Signs of Wear']
  },
  materials: {
    'LEATHER': ['Genuine Leather', 'Soft Leather', 'Premium Leather'],
    'COTTON': ['100% Cotton', 'Pure Cotton', 'Cotton Blend'],
    'WOOL': ['Pure Wool', 'Merino Wool', 'Wool Blend'],
    'SILK': ['100% Silk', 'Pure Silk', 'Silk Blend'],
    'DENIM': ['Denim', 'Jean', 'Raw Denim'],
    'CASHMERE': ['Cashmere', 'Cashmere Blend', 'Luxury Cashmere']
  },
  styles: {
    'VINTAGE': ['Vintage', 'Retro', 'Y2K', '90s', '80s', 'Classic'],
    'MODERN': ['Contemporary', 'Current Season', 'Trendy', 'Fashion Forward'],
    'CASUAL': ['Casual', 'Everyday', 'Relaxed', 'Comfortable'],
    'FORMAL': ['Formal', 'Business', 'Office', 'Smart', 'Professional'],
    'STREETWEAR': ['Street Style', 'Urban', 'Hip Hop', 'Skate']
  },
  features: {
    'RARE': ['Rare', 'Hard to Find', 'Discontinued', 'Limited Edition'],
    'COLLAB': ['Collaboration', 'Collab', 'Special Edition', 'Exclusive'],
    'SEASONAL': ['Spring/Summer', 'Fall/Winter', 'SS', 'FW', 'Resort'],
    'SUSTAINABLE': ['Sustainable', 'Eco-Friendly', 'Organic', 'Conscious']
  }
};

// Generate eBay optimized title
export function generateEbayTitle(itemData) {
  const {
    type = 'clothing',
    detectedBrand,
    color = '',
    size = '',
    gender = '',
    material = '',
    condition = 'GOOD',
    model = '',
    season = '',
    style = ''
  } = itemData;
  
  // Get brand info
  const brandInfo = detectedBrand || { brand: '', category: 'unknown' };
  const brandTier = getBrandTier(brandInfo.brand);
  
  // Select appropriate template
  const templates = titleTemplates[type] || titleTemplates.clothing;
  const template = templates[brandTier] || templates.default;
  
  // Build title components
  const components = {
    BRAND: brandInfo.brand || '',
    GENDER: gender ? gender.charAt(0).toUpperCase() + gender.slice(1) : '',
    TYPE: type.charAt(0).toUpperCase() + type.slice(1),
    COLOR: color ? color.charAt(0).toUpperCase() + color.slice(1) : '',
    SIZE: size || 'One Size',
    SIZE_DESC: getSizeDescription(size),
    MATERIAL: material ? material.charAt(0).toUpperCase() + material.slice(1) : '',
    CONDITION: getConditionKeyword(condition),
    MODEL: model || '',
    SEASON: season || getCurrentSeason(),
    STYLE: style || getDefaultStyle(type)
  };
  
  // Generate base title
  let title = template;
  for (const [key, value] of Object.entries(components)) {
    title = title.replace(`{${key}}`, value);
  }
  
  // Clean up extra spaces and format
  title = title.replace(/\s+/g, ' ').trim();
  
  // Add relevant keywords if under 80 chars
  if (title.length < 60) {
    const keywords = getRelevantKeywords(itemData);
    for (const keyword of keywords) {
      if (title.length + keyword.length + 1 <= 80) {
        title += ` ${keyword}`;
      }
    }
  }
  
  // Ensure title is within eBay's 80 character limit
  if (title.length > 80) {
    title = title.substring(0, 77) + '...';
  }
  
  return title;
}

// Helper functions
function getConditionKeyword(condition) {
  const conditionMap = {
    'NEW': 'BNWT',
    'EXCELLENT': 'Excellent',
    'VERY_GOOD': 'VGC',
    'GOOD': 'Good',
    'FAIR': 'Used'
  };
  return conditionMap[condition] || 'Pre-owned';
}

function getSizeDescription(size) {
  if (!size) return '';
  if (size.includes('-')) return size; // Already a range
  
  const sizeMap = {
    'XS': 'Extra Small',
    'S': 'Small',
    'M': 'Medium',
    'L': 'Large',
    'XL': 'Extra Large',
    'XXL': '2XL'
  };
  
  return sizeMap[size] || size;
}

function getCurrentSeason() {
  const month = new Date().getMonth();
  if (month >= 2 && month <= 5) return 'SS24'; // Spring/Summer
  if (month >= 8 && month <= 11) return 'FW24'; // Fall/Winter
  return '';
}

function getDefaultStyle(type) {
  const styleMap = {
    'dress': 'Cocktail',
    'jeans': 'Straight',
    'jacket': 'Bomber',
    'shirt': 'Button-up',
    'shoes': 'Casual',
    'bag': 'Shoulder'
  };
  return styleMap[type] || '';
}

function getRelevantKeywords(itemData) {
  const keywords = [];
  
  // Add condition keywords
  if (keywordEnhancements.conditions[itemData.condition]) {
    keywords.push(...keywordEnhancements.conditions[itemData.condition]);
  }
  
  // Add material keywords
  if (itemData.material && keywordEnhancements.materials[itemData.material.toUpperCase()]) {
    keywords.push(...keywordEnhancements.materials[itemData.material.toUpperCase()]);
  }
  
  // Add style keywords
  if (itemData.style && keywordEnhancements.styles[itemData.style.toUpperCase()]) {
    keywords.push(...keywordEnhancements.styles[itemData.style.toUpperCase()]);
  }
  
  // Shuffle and return top keywords
  return keywords.sort(() => 0.5 - Math.random()).slice(0, 3);
}

// Generate eBay keywords for search
export function generateSearchKeywords(itemData) {
  const keywords = new Set();
  
  // Add brand variations
  if (itemData.detectedBrand?.brand) {
    keywords.add(itemData.detectedBrand.brand);
    keywords.add(itemData.detectedBrand.brand.toLowerCase());
  }
  
  // Add type variations
  if (itemData.type) {
    keywords.add(itemData.type);
    keywords.add(itemData.type + 's'); // Plural
  }
  
  // Add all condition keywords
  if (itemData.condition) {
    const conditionKeys = keywordEnhancements.conditions[itemData.condition] || [];
    conditionKeys.forEach(k => keywords.add(k.toLowerCase()));
  }
  
  // Add color variations
  if (itemData.color) {
    keywords.add(itemData.color);
    keywords.add(itemData.color.toLowerCase());
  }
  
  // Add size variations
  if (itemData.size) {
    keywords.add(`size ${itemData.size}`);
    keywords.add(itemData.size);
  }
  
  // Add gender
  if (itemData.gender) {
    keywords.add(itemData.gender);
    keywords.add(`${itemData.gender}s`);
  }
  
  return Array.from(keywords).filter(k => k.length > 2);
}