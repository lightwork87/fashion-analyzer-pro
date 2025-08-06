// app/api/analyze-combined/titleGenerator.js

/**
 * eBay Title Generator
 * Creates optimized 80-character titles following eBay best practices
 */

// Size format preferences by region
const SIZE_FORMATS = {
  UK: (size) => `UK${size}`,
  US: (size) => `US${size}`,
  EU: (size) => `EU${size}`,
  IT: (size) => `IT${size}`,
  FR: (size) => `FR${size}`,
  NUMERIC: (size) => `Size ${size}`,
  LETTER: (size) => size // S, M, L, XL etc
};

// Condition abbreviations for titles
const CONDITION_ABBREVIATIONS = {
  'NEW': 'BNWT',
  'EXCELLENT': 'Excellent',
  'VERY_GOOD': 'VGC',
  'GOOD': 'Good',
  'FAIR': 'Used'
};

// High-value keywords by category
const CATEGORY_KEYWORDS = {
  dress: ['Dress', 'Midi', 'Maxi', 'Mini', 'Cocktail', 'Evening'],
  shirt: ['Shirt', 'Blouse', 'Top', 'Tee'],
  jacket: ['Jacket', 'Blazer', 'Coat', 'Bomber'],
  jeans: ['Jeans', 'Denim', 'Straight', 'Skinny'],
  trousers: ['Trousers', 'Pants', 'Chinos'],
  skirt: ['Skirt', 'Mini', 'Midi', 'Maxi', 'Pencil'],
  suit: ['Suit', 'Blazer', 'Formal', 'Business'],
  knitwear: ['Jumper', 'Sweater', 'Knit', 'Cardigan'],
  activewear: ['Athletic', 'Gym', 'Sports', 'Running']
};

/**
 * Generate optimized eBay title
 * @param {object} itemData - Item analysis data
 * @returns {string} Optimized title (max 80 chars)
 */
export function generateEbayTitle(itemData) {
  const {
    type,
    detectedBrand,
    color,
    size,
    gender,
    condition,
    model,
    season,
    style
  } = itemData;

  // Start with brand (if known and valuable)
  let titleParts = [];
  
  if (detectedBrand?.name && detectedBrand.confidence > 0.7) {
    titleParts.push(detectedBrand.name.toUpperCase());
  }

  // Add gender (abbreviated for space)
  const genderAbbrev = {
    'mens': "Men's",
    'womens': "Women's",
    'unisex': 'Unisex'
  };
  if (gender && gender !== 'unisex') {
    titleParts.push(genderAbbrev[gender] || gender);
  }

  // Add item type
  const itemTypeKeyword = getItemTypeKeyword(type);
  titleParts.push(itemTypeKeyword);

  // Add color (prioritize unique/searchable colors)
  if (color && !['black', 'white', 'blue'].includes(color.toLowerCase())) {
    titleParts.push(capitalizeFirst(color));
  }

  // Add size with appropriate format
  if (size) {
    const sizeFormat = determineSizeFormat(size, detectedBrand?.tier);
    titleParts.push(sizeFormat(size));
  }

  // Add condition
  const conditionText = CONDITION_ABBREVIATIONS[condition] || condition;
  if (condition === 'NEW') {
    titleParts.push(conditionText); // BNWT is high-value
  }

  // Add model/style if space allows
  if (model && titleParts.join(' ').length < 60) {
    titleParts.push(model);
  }

  // Build title and check length
  let title = titleParts.join(' ');

  // If too long, remove less important parts
  if (title.length > 80) {
    // Remove model first
    titleParts = titleParts.filter(part => part !== model);
    
    // Then remove season
    titleParts = titleParts.filter(part => part !== season);
    
    // Abbreviate condition if needed
    if (condition !== 'NEW' && title.length > 80) {
      const condIndex = titleParts.indexOf(conditionText);
      if (condIndex > -1) {
        titleParts.splice(condIndex, 1);
      }
    }
    
    title = titleParts.join(' ');
  }

  // If still too long, truncate brand name
  if (title.length > 80 && detectedBrand?.name) {
    const brandIndex = titleParts.findIndex(part => 
      part.toUpperCase() === detectedBrand.name.toUpperCase()
    );
    if (brandIndex > -1) {
      titleParts[brandIndex] = detectedBrand.name.substring(0, 8);
    }
    title = titleParts.join(' ');
  }

  // Final safety check
  if (title.length > 80) {
    title = title.substring(0, 77) + '...';
  }

  return title;
}

/**
 * Generate search keywords for the item
 * @param {object} itemData - Item analysis data
 * @returns {array} Array of keywords
 */
export function generateSearchKeywords(itemData) {
  const keywords = new Set();

  // Brand variations
  if (itemData.detectedBrand?.name) {
    keywords.add(itemData.detectedBrand.name.toLowerCase());
    keywords.add(itemData.detectedBrand.name.toUpperCase());
    
    // Add common misspellings for popular brands
    const misspellings = getBrandMisspellings(itemData.detectedBrand.name);
    misspellings.forEach(spelling => keywords.add(spelling));
  }

  // Item type synonyms
  const typeSynonyms = getItemTypeSynonyms(itemData.type);
  typeSynonyms.forEach(synonym => keywords.add(synonym));

  // Color variations
  if (itemData.color) {
    keywords.add(itemData.color.toLowerCase());
    const colorSynonyms = getColorSynonyms(itemData.color);
    colorSynonyms.forEach(syn => keywords.add(syn));
  }

  // Size variations
  if (itemData.size) {
    keywords.add(itemData.size);
    keywords.add(`size ${itemData.size}`);
    keywords.add(`uk${itemData.size}`);
    keywords.add(`us${itemData.size}`);
  }

  // Gender
  if (itemData.gender) {
    keywords.add(itemData.gender);
    keywords.add(`${itemData.gender}s`);
  }

  // Condition
  keywords.add(itemData.condition.toLowerCase());
  if (itemData.condition === 'NEW') {
    keywords.add('bnwt');
    keywords.add('nwt');
    keywords.add('brand new');
    keywords.add('tags');
  }

  // Material
  if (itemData.material) {
    keywords.add(itemData.material.toLowerCase());
  }

  // Style descriptors
  if (itemData.style) {
    keywords.add(itemData.style.toLowerCase());
  }

  // Season
  if (itemData.season) {
    keywords.add(itemData.season.toLowerCase());
  }

  // Convert Set to Array and limit to 20 most relevant
  return Array.from(keywords).slice(0, 20);
}

// Helper functions

function getItemTypeKeyword(type) {
  const typeMap = {
    'dress': 'Dress',
    'shirt': 'Shirt',
    'blouse': 'Blouse',
    't-shirt': 'T-Shirt',
    'jacket': 'Jacket',
    'coat': 'Coat',
    'jeans': 'Jeans',
    'trousers': 'Trousers',
    'skirt': 'Skirt',
    'jumper': 'Jumper',
    'sweater': 'Sweater',
    'hoodie': 'Hoodie',
    'suit': 'Suit',
    'blazer': 'Blazer',
    'shorts': 'Shorts',
    'top': 'Top'
  };
  
  return typeMap[type?.toLowerCase()] || 'Item';
}

function determineSizeFormat(size, brandTier) {
  // Luxury brands often use IT/FR sizing
  if (brandTier === 'luxury' && /^\d+$/.test(size)) {
    const sizeNum = parseInt(size);
    if (sizeNum >= 36 && sizeNum <= 52) {
      return SIZE_FORMATS.IT;
    }
  }
  
  // Letter sizes (S, M, L, XL)
  if (/^[XS|S|M|L|XL|XXL|XXXL]/.test(size)) {
    return SIZE_FORMATS.LETTER;
  }
  
  // UK sizes for most items
  if (/^\d+$/.test(size)) {
    return SIZE_FORMATS.UK;
  }
  
  // Default
  return SIZE_FORMATS.NUMERIC;
}

function capitalizeFirst(str) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

function getBrandMisspellings(brand) {
  const misspellingMap = {
    'Ralph Lauren': ['ralph loren', 'ralf lauren', 'polo ralph'],
    'Tommy Hilfiger': ['tommy hillfiger', 'tommy hilfinger', 'hilfiger'],
    'Calvin Klein': ['calvin klien', 'calvin cline', 'ck'],
    'Michael Kors': ['micheal kors', 'michel kors', 'mk'],
    'Louis Vuitton': ['louis vuiton', 'louis vitton', 'lv'],
    'Yves Saint Laurent': ['ysl', 'saint laurent', 'yvs'],
    'Dolce & Gabbana': ['dolce gabbana', 'd&g', 'dolce and gabbana'],
    'Giorgio Armani': ['armani', 'georgio armani', 'emporio armani']
  };
  
  return misspellingMap[brand] || [];
}

function getItemTypeSynonyms(type) {
  const synonymMap = {
    'dress': ['dress', 'frock', 'gown'],
    'shirt': ['shirt', 'blouse', 'top'],
    'jacket': ['jacket', 'blazer', 'coat'],
    'jeans': ['jeans', 'denim', 'pants'],
    'trousers': ['trousers', 'pants', 'slacks'],
    'skirt': ['skirt', 'mini', 'midi', 'maxi'],
    'jumper': ['jumper', 'sweater', 'pullover', 'knit'],
    't-shirt': ['tshirt', 't-shirt', 'tee', 'top']
  };
  
  return synonymMap[type?.toLowerCase()] || [type];
}

function getColorSynonyms(color) {
  const colorMap = {
    'navy': ['navy', 'dark blue', 'navy blue'],
    'burgundy': ['burgundy', 'wine', 'maroon', 'bordeaux'],
    'cream': ['cream', 'ivory', 'off-white', 'beige'],
    'grey': ['grey', 'gray', 'charcoal'],
    'khaki': ['khaki', 'tan', 'beige', 'camel']
  };
  
  return colorMap[color?.toLowerCase()] || [];
}

export default {
  generateEbayTitle,
  generateSearchKeywords
};