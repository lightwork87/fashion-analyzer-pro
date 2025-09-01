const fs = require('fs');
const { execSync } = require('child_process');

// Find all page.js files
const files = execSync('find app -name "page.js" -type f').toString().trim().split('\n');

console.log(`Found ${files.length} page.js files to fix`);

files.forEach(file => {
  try {
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;

    // Add 'use client' if missing and has React hooks
    if (!content.includes("'use client'") && 
        (content.includes('useState') || content.includes('useEffect') || content.includes('useRouter'))) {
      content = `'use client';\n${content}`;
      changed = true;
    }

    // Find function name
    const funcMatch = content.match(/function\s+(\w+)\s*\(/);
    if (!funcMatch) return;
    
    const funcName = funcMatch[1];

    // Remove broken exports
    content = content.replace(/export\s*\{\s*\w+\s+as\s+default\s*\}\s*;?/g, '');
    content = content.replace(/export\s+\w+\s*;/g, '');
    content = content.replace(/module\.exports\s*=\s*\w+\s*;?/g, '');

    // Add correct export if missing
    if (!content.includes(`export default ${funcName}`)) {
      content = content.trim() + `\n\nexport default ${funcName};`;
      changed = true;
    }

    if (changed) {
      fs.writeFileSync(file, content);
      console.log(`Fixed: ${file}`);
    }
  } catch (error) {
    console.log(`Error fixing ${file}: ${error.message}`);
  }
});

console.log('All files processed!');