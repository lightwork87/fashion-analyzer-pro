// Brand database with tiers
const BRAND_DATABASE = {
  luxury: [
    'gucci', 'prada', 'louis vuitton', 'chanel', 'hermes', 'dior', 
    'burberry', 'versace', 'givenchy', 'balenciaga', 'bottega veneta',
    'saint laurent', 'ysl', 'celine', 'fendi', 'valentino', 'moncler',
    'alexander mcqueen', 'stella mccartney', 'tom ford', 'balmain'
  ],
  premium: [
    'coach', 'michael kors', 'marc jacobs', 'kate spade', 'tory burch',
    'ralph lauren', 'tommy hilfiger', 'calvin klein', 'diesel', 'guess',
    'armani exchange', 'dkny', 'hugo boss', 'lacoste', 'fred perry',
    'ted baker', 'all saints', 'acne studios', 'ganni', 'whistles'
  ],
  mid: [
    'zara', 'mango', 'cos', 'massimo dutti', 'reiss', 'karen millen',
    'french connection', 'banana republic', 'gap', 'j crew', 'anthropologie',
    'urban outfitters', 'free people', 'abercrombie', 'hollister'
  ],
  sport: [
    'nike', 'adidas', 'puma', 'under armour', 'new balance', 'reebok',
    'asics', 'fila', 'champion', 'the north face', 'patagonia', 'columbia'
  ],
  high_street: [
    'h&m', 'hm', 'primark', 'topshop', 'asos', 'boohoo', 'plt',
    'prettylittlething', 'missguided', 'shein', 'forever 21', 'new look'
  ]
};

export async function identifyBrand(detectedBrand, imageBase64) {
  const brandLower = (detectedBrand || '').toLowerCase().trim();
  
  // Check each tier
  for (const [tier, brands] of Object.entries(BRAND_DATABASE)) {
    for (const brand of brands) {
      if (brandLower.includes(brand) || brand.includes(brandLower)) {
        return {
          brand: formatBrandName(brand),
          tier: tier === 'high_street' ? 'budget' : tier,
          confidence: 0.9
        };
      }
    }
  }
  
  // Check for partial matches
  for (const [tier, brands] of Object.entries(BRAND_DATABASE)) {
    for (const brand of brands) {
      const similarity = calculateSimilarity(brandLower, brand);
      if (similarity > 0.7) {
        return {
          brand: formatBrandName(brand),
          tier: tier === 'high_street' ? 'budget' : tier,
          confidence: similarity
        };
      }
    }
  }
  
  // If no match found, return the detected brand
  return {
    brand: detectedBrand || 'Unbranded',
    tier: 'unknown',
    confidence: 0.5
  };
}

function formatBrandName(brand) {
  const specialCases = {
    'nike': 'Nike',
    'adidas': 'Adidas',
    'puma': 'Puma',
    'zara': 'Zara',
    'hm': 'H&M',
    'h&m': 'H&M',
    'cos': 'COS',
    'asos': 'ASOS',
    'dkny': 'DKNY',
    'ysl': 'YSL',
    'plt': 'PrettyLittleThing',
    'prettylittlething': 'PrettyLittleThing'
  };
  
  if (specialCases[brand]) {
    return specialCases[brand];
  }
  
  // Title case for most brands
  return brand.split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function calculateSimilarity(str1, str2) {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) {
    return 1.0;
  }
  
  const editDistance = getEditDistance(longer, shorter);
  return (longer.length - editDistance) / parseFloat(longer.length);
}

function getEditDistance(str1, str2) {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}