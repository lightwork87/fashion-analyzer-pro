export async function generateProfessionalTitle(info) {
  // Title components in order of importance
  const components = [];
  
  // 1. Brand (always first if known)
  if (info.brand && info.brand !== 'Unknown Brand') {
    components.push(info.brand);
  }
  
  // 2. Gender/Department
  const department = detectDepartment(info.itemType);
  if (department) {
    components.push(department);
  }
  
  // 3. Item Type
  components.push(capitalizeWords(info.itemType));
  
  // 4. Key Features (pick most important)
  const keyFeatures = [];
  
  // Material is important for certain items
  if (info.material && shouldIncludeMaterial(info.itemType, info.material)) {
    keyFeatures.push(info.material);
  }
  
  // Style is important
  if (info.style && info.style !== 'Casual') {
    keyFeatures.push(info.style);
  }
  
  // Color (always include if known)
  if (info.color && info.color !== 'Multicoloured') {
    keyFeatures.push(info.color);
  }
  
  // Add up to 2 key features
  components.push(...keyFeatures.slice(0, 2));
  
  // 5. Size (crucial for clothing)
  if (info.size) {
    components.push(`Size ${info.size}`);
  }
  
  // 6. Condition (if not "Good" which is default)
  if (info.condition && info.condition !== 'Good') {
    if (info.condition === 'New with tags') {
      components.push('BNWT'); // Brand New With Tags
    } else if (info.condition === 'New without tags') {
      components.push('BNWOT'); // Brand New Without Tags
    }
  }
  
  // Join components and ensure under 80 characters
  let title = components.join(' ');
  
  // If too long, remove features one by one
  while (title.length > 80 && components.length > 3) {
    components.splice(-2, 1); // Remove second to last (keep size last)
    title = components.join(' ');
  }
  
  // If still too long, truncate
  if (title.length > 80) {
    title = title.substring(0, 77) + '...';
  }
  
  return title;
}

function detectDepartment(itemType) {
  const type = itemType.toLowerCase();
  
  if (type.includes('dress') || type.includes('skirt') || type.includes('blouse')) {
    return "Women's";
  }
  if (type.includes('shirt') && !type.includes('t-shirt')) {
    return "Men's";
  }
  if (type.includes('unisex')) {
    return "Unisex";
  }
  
  // Default to Women's for fashion items
  return "Women's";
}

function shouldIncludeMaterial(itemType, material) {
  const importantMaterials = [
    'leather', 'suede', 'silk', 'cashmere', 'wool',
    'linen', 'velvet', 'satin', 'lace', 'fur'
  ];
  
  return importantMaterials.some(m => 
    material.toLowerCase().includes(m)
  );
}

function capitalizeWords(str) {
  return str.split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}