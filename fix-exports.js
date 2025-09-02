const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Get all page.js files
const pageFiles = execSync('find app -name "page.js" -type f', { encoding: 'utf8' })
  .split('\n')
  .filter(file => file.trim());

console.log(`Found ${pageFiles.length} page files to fix:`);

pageFiles.forEach(filePath => {
  if (!filePath.trim()) return;
  
  console.log(`Fixing: ${filePath}`);
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Remove problematic export patterns
    content = content.replace(/export\s*{\s*\w+\s+as\s+default\s*};\s*/g, '');
    content = content.replace(/export\s+{\s*\w+\s*};\s*$/gm, '');
    
    // Look for existing function names
    const functionMatch = content.match(/(?:function\s+(\w+)|const\s+(\w+)\s*=.*?function|(\w+)Page)/);
    const componentName = functionMatch ? (functionMatch[1] || functionMatch[2] || functionMatch[3]) : 'PageComponent';
    
    // Check if export default already exists
    if (!content.includes('export default')) {
      content += `\nexport default ${componentName};`;
    }
    
    // Ensure 'use client' is at the top if component uses hooks
    if ((content.includes('useState') || content.includes('useEffect') || content.includes('useUser')) && 
        !content.includes("'use client'")) {
      content = "'use client';\n\n" + content;
    }
    
    fs.writeFileSync(filePath, content);
    console.log(`✓ Fixed: ${filePath}`);
    
  } catch (error) {
    console.error(`✗ Error fixing ${filePath}:`, error.message);
  }
});

console.log('\n✅ All page files processed!');
console.log('📝 Manual review recommended for complex components.');
console.log('🚀 Ready to deploy: npm run build && git add . && git commit -m "fix: page component exports" && git push');