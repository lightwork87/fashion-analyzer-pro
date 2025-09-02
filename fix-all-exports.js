const fs = require('fs');
const path = require('path');

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m'
};

// Find all page.js files
function findPageFiles(dir, files = []) {
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
      findPageFiles(fullPath, files);
    } else if (item === 'page.js' || item === 'page.jsx') {
      files.push(fullPath);
    }
  }
  
  return files;
}

// Fix export patterns in a file
function fixExports(filePath) {
  console.log(`${colors.blue}Fixing: ${colors.reset}${filePath}`);
  
  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;
  
  // Check if already has correct export default
  if (content.match(/export\s+default\s+(?:function\s+)?[A-Z]\w+(?:\s*\(|\s*=)/)) {
    console.log(`${colors.green}✓ Already correct${colors.reset}`);
    return false;
  }
  
  // Pattern 1: export { ComponentName as default }
  content = content.replace(
    /export\s*{\s*(\w+)\s+as\s+default\s*}[;\s]*$/gm,
    'export default $1;'
  );
  
  // Pattern 2: export ComponentName (without default)
  content = content.replace(
    /^export\s+(?!default|const|let|var|function|class|async)([A-Z]\w+)[;\s]*$/gm,
    'export default $1;'
  );
  
  // Pattern 3: module.exports = ComponentName
  content = content.replace(
    /module\.exports\s*=\s*(\w+)[;\s]*$/gm,
    'export default $1;'
  );
  
  // Pattern 4: Fix function declaration and export separately
  const functionMatch = content.match(/(?:export\s+)?function\s+([A-Z]\w+)\s*\([^)]*\)\s*{/);
  if (functionMatch) {
    const componentName = functionMatch[1];
    
    // Remove any existing incorrect export
    content = content.replace(new RegExp(`export\\s+${componentName}[;\\s]*$`, 'gm'), '');
    content = content.replace(new RegExp(`export\\s*{\\s*${componentName}\\s*(?:as\\s+default)?\\s*}[;\\s]*$`, 'gm'), '');
    
    // Add correct export if not present
    if (!content.includes(`export default ${componentName}`)) {
      // Remove 'export' from function declaration if present
      content = content.replace(/export\s+function/, 'function');
      
      // Add export default at the end
      content = content.trimEnd() + '\n\nexport default ' + componentName + ';\n';
    }
  }
  
  // Ensure 'use client' is at the top for client components
  if (!content.startsWith("'use server'") && !content.includes('async function')) {
    if (!content.startsWith("'use client'")) {
      content = "'use client';\n\n" + content.replace(/^['"]use client['"];?\s*\n*/gm, '');
    }
  }
  
  // Clean up multiple blank lines
  content = content.replace(/\n{3,}/g, '\n\n');
  
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content);
    console.log(`${colors.green}✓ Fixed export pattern${colors.reset}`);
    return true;
  }
  
  console.log(`${colors.yellow}⚠ No changes needed${colors.reset}`);
  return false;
}

// Main execution
console.log(`${colors.bright}${colors.blue}🔧 FIXING ALL PAGE EXPORTS...${colors.reset}\n`);

const appDir = path.join(process.cwd(), 'app');
if (!fs.existsSync(appDir)) {
  console.error(`${colors.red}Error: 'app' directory not found!${colors.reset}`);
  process.exit(1);
}

const pageFiles = findPageFiles(appDir);
console.log(`Found ${colors.yellow}${pageFiles.length}${colors.reset} page files\n`);

let fixedCount = 0;
for (const file of pageFiles) {
  if (fixExports(file)) {
    fixedCount++;
  }
  console.log('');
}

console.log(`${colors.bright}${colors.green}✨ COMPLETE!${colors.reset}`);
console.log(`Fixed ${colors.yellow}${fixedCount}${colors.reset} files`);
console.log(`\n${colors.blue}Next steps:${colors.reset}`);
console.log('1. Run: npm run build');
console.log('2. Deploy: git add . && git commit -m "Fix: All page export patterns" && git push\n');