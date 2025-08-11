export function generateEbayTitle(item) {
  const parts = [];
  
  // Brand
  if (item.brand && item.brand !== 'Unknown') {
    parts.push(item.brand);
  }
  
  // Gender/Department
  if (item.department) {
    parts.push(item.department);
  }
  
  // Item Type
  if (item.itemType) {
    parts.push(item.itemType);
  }
  
  // Key features
  if (item.style) {
    parts.push(item.style);
  }
  
  if (item.color) {
    parts.push(item.color);
  }
  
  // Size
  if (item.size && item.size !== 'Not Visible') {
    parts.push(`Size ${item.size}`);
  }
  
  // Material
  if (item.material && item.material !== 'Not Specified') {
    parts.push(item.material);
  }
  
  // Pattern
  if (item.pattern) {
    parts.push(item.pattern);
  }
  
  // Join and ensure under 80 characters
  let title = parts.filter(Boolean).join(' ');
  
  // Trim if too long
  if (title.length > 80) {
    title = title.substring(0, 77) + '...';
  }
  
  return title || 'Fashion Item';
}