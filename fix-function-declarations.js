// fix-function-declarations.js - CREATE THIS FILE IN ROOT
const fs = require('fs');
const path = require('path');

function fixAllPages() {
  const appDir = './app';
  const pagePaths = [];
  let fixedCount = 0;
  let errorCount = 0;
  
  function findPageFiles(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        findPageFiles(fullPath);
      } else if (entry.name === 'page.js') {
        pagePaths.push(fullPath);
      }
    }
  }
  
  findPageFiles(appDir);
  console.log(`Found ${pagePaths.length} page files to fix...`);
  
  pagePaths.forEach(filePath => {
    try {
      let content = fs.readFileSync(filePath, 'utf8');
      let hasChanges = false;
      
      // Fix missing function keywords - look for patterns like "ComponentName() {"
      const missingFunctionPattern = /^(\s*)([A-Z][a-zA-Z0-9]*)\(\s*\)\s*\{/gm;
      if (missingFunctionPattern.test(content)) {
        content = content.replace(missingFunctionPattern, '$1function $2() {');
        hasChanges = true;
        console.log(`✅ Fixed missing function keyword in ${filePath}`);
      }
      
      // Ensure 'use client' is at top for client components
      const usesClientFeatures = /use(State|Effect|User|Router|SearchParams|Params)/g.test(content);
      if (usesClientFeatures && !content.trim().startsWith("'use client'")) {
        content = "'use client';\n\n" + content.trim();
        hasChanges = true;
      }
      
      // Fix export patterns - remove problematic exports and add correct default export
      const componentMatch = content.match(/function\s+(\w+)\s*\(/);
      if (componentMatch) {
        const componentName = componentMatch[1];
        
        // Remove any existing problematic exports
        content = content.replace(/export\s*\{\s*\w+\s*as\s*default\s*\}\s*;?\s*$/gm, '');
        content = content.replace(/export\s*\{\s*\w+\s*\}\s*;?\s*$/gm, '');
        
        // Add correct default export if missing
        if (!content.includes(`export default ${componentName};`)) {
          content = content.trim() + `\n\nexport default ${componentName};`;
          hasChanges = true;
        }
      }
      
      if (hasChanges) {
        fs.writeFileSync(filePath, content);
        fixedCount++;
      }
      
    } catch (error) {
      console.error(`❌ Error fixing ${filePath}:`, error.message);
      errorCount++;
    }
  });
  
  console.log(`\n📊 Summary:`);
  console.log(`✅ Fixed: ${fixedCount} files`);
  console.log(`❌ Errors: ${errorCount} files`);
  console.log(`📁 Total processed: ${pagePaths.length} files`);
}

fixAllPages();