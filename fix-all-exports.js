// fix-all-exports.js - CREATE THIS FILE IN ROOT
const fs = require('fs');
const path = require('path');

function fixPageExports() {
  const appDir = './app';
  const pagePaths = [];
  
  // Recursively find all page.js files
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
      
      // Extract component name from file
      const componentMatch = content.match(/function\s+(\w+)\s*\(/);
      if (!componentMatch) {
        console.log(`⚠️  No function found in ${filePath}`);
        return;
      }
      
      const componentName = componentMatch[1];
      
      // Remove any existing problematic exports
      content = content.replace(/export\s*\{\s*\w+\s*as\s*default\s*\}\s*;?/g, '');
      content = content.replace(/export\s*\{\s*\w+\s*\}\s*;?/g, '');
      content = content.replace(/export\s+default\s+\w+\s*;?/g, '');
      
      // Add correct default export at the end
      content = content.trim();
      if (!content.endsWith(`export default ${componentName};`)) {
        content += `\n\nexport default ${componentName};`;
      }
      
      // Ensure 'use client' is at the top if component uses hooks
      const usesHooks = /use(State|Effect|User|Router|SearchParams)/g.test(content);
      if (usesHooks && !content.startsWith("'use client'")) {
        content = "'use client';\n\n" + content;
      }
      
      fs.writeFileSync(filePath, content);
      console.log(`✅ Fixed ${filePath} - Component: ${componentName}`);
      
    } catch (error) {
      console.error(`❌ Error fixing ${filePath}:`, error.message);
    }
  });
  
  console.log('🎉 Export fixing complete!');
}

fixPageExports();