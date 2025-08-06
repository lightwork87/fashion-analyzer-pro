// titleGenerator.js - Updated to clean brand names
export function generateEbayTitle(item) {
  const parts = [];
  
  // Clean brand name helper
  const cleanForTitle = (text) => {
    if (!text) return '';
    return text
      .replace(/[,!?']/g, '') // Remove unwanted punctuation
      .replace(/\s+/g, ' ')   // Clean up spaces
      .trim();
  };
  
  // 1. Brand (if known and not "Unknown")
  if (item.brand && item.brand !== 'Unknown' && item.brand !== 'unknown') {
    parts.push(cleanForTitle(item.brand));
  }
  
  // 2. Gender (prioritize if specified)
  if (item.gender && item.gender !== 'Unisex') {
    parts.push(item.gender);
  }
  
  // 3. Item Type (essential)
  if (item.itemType) {
    parts.push(cleanForTitle(item.itemType));
  }
  
  // 4. Size (if visible)
  if (item.size && item.size !== 'Not Visible') {
    parts.push(`Size ${item.size}`);
  }
  
  // 5. Color (simplified)
  if (item.color) {
    // If color is very long, take first color only
    const colorParts = item.color.split(',');
    const primaryColor = colorParts[0].replace(/[()]/g, '').trim();
    
    // Handle multi-colored items
    if (colorParts.length > 2) {
      parts.push('Multicoloured');
    } else if (colorParts.length === 2) {
      const secondColor = colorParts[1].replace(/[()]/g, '').trim();
      parts.push(`${primaryColor}/${secondColor}`);
    } else {
      parts.push(primaryColor);
    }
  }
  
  // 6. Key features (add most important ones that fit)
  const importantKeywords = [];
  if (item.keyFeatures && Array.isArray(item.keyFeatures)) {
    // Priority keywords for eBay
    const priorityTerms = [
      'vintage', 'designer', 'limited edition', 'rare',
      'new', 'bnwt', 'nwt', 'bnib', 'wool', 'cashmere',
      'leather', 'silk', 'cotton', '100%', 'pure',
      'italian', 'french', 'british', 'japanese'
    ];
    
    item.keyFeatures.forEach(feature => {
      const lowerFeature = feature.toLowerCase();
      priorityTerms.forEach(term => {
        if (lowerFeature.includes(term) && !importantKeywords.includes(term)) {
          importantKeywords.push(term.charAt(0).toUpperCase() + term.slice(1));
        }
      });
    });
    
    // Also check for pattern types
    if (item.keyFeatures.some(f => f.toLowerCase().includes('pattern'))) {
      const patterns = ['geometric', 'tribal', 'floral', 'striped', 'checked'];
      patterns.forEach(pattern => {
        if (item.keyFeatures.some(f => f.toLowerCase().includes(pattern))) {
          importantKeywords.push(pattern.charAt(0).toUpperCase() + pattern.slice(1));
        }
      });
    }
  }
  
  // 7. Material (if high-value)
  const valuableMaterials = ['wool', 'cashmere', 'silk', 'leather', 'linen', 'mohair'];
  if (item.material && valuableMaterials.some(m => item.material.toLowerCase().includes(m))) {
    if (!importantKeywords.some(k => k.toLowerCase() === item.material.toLowerCase())) {
      importantKeywords.push(cleanForTitle(item.material));
    }
  }
  
  // Add important keywords that fit
  importantKeywords.forEach(keyword => {
    parts.push(keyword);
  });
  
  // Build title with 80 character limit
  let title = '';
  for (const part of parts) {
    const testTitle = title ? `${title} ${part}` : part;
    if (testTitle.length <= 80) {
      title = testTitle;
    } else {
      break; // Stop adding parts if we'd exceed 80 chars
    }
  }
  
  // If title is too short, add more descriptive terms
  if (title.length < 40 && item.keyFeatures) {
    const additionalTerms = item.keyFeatures
      .filter(f => !title.toLowerCase().includes(f.toLowerCase()))
      .sort((a, b) => a.length - b.length); // Shorter terms first
    
    for (const term of additionalTerms) {
      const cleanedTerm = cleanForTitle(term);
      const words = cleanedTerm.split(' ').slice(0, 2).join(' '); // Take first 2 words
      const testTitle = `${title} ${words}`;
      if (testTitle.length <= 80) {
        title = testTitle;
      }
    }
  }
  
  // Ensure we don't exceed 80 characters
  if (title.length > 80) {
    title = title.substring(0, 80);
    // Clean up any partial words
    const lastSpace = title.lastIndexOf(' ');
    if (lastSpace > 60) {
      title = title.substring(0, lastSpace);
    }
  }
  
  return title || 'Fashion Item';
}