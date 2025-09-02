const fs = require('fs');
const path = require('path');

console.log('========================================');
console.log('EXPORT DIAGNOSTIC REPORT');
console.log('========================================\n');

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

// Analyze a file's export pattern
function analyzeFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const lastLines = lines.slice(-10).join('\n');
  
  // Check for various export patterns
  const hasDefaultExport = /export\s+default\s+\w+/.test(content);
  const hasNamedExport = /export\s*{\s*\w+\s*(?:as\s+default)?\s*}/.test(content);
  const hasModuleExports = /module\.exports\s*=/.test(content);
  const hasExportFunction = /export\s+function\s+\w+/.test(content);
  const hasUseClient = content.includes("'use client'") || content.includes('"use client"');
  
  // Find component name
  const componentMatch = content.match(/(?:function|const|class)\s+([A-Z]\w+)/);
  const componentName = componentMatch ? componentMatch[1] : 'Unknown';
  
  return {
    path: filePath.replace(process.cwd(), '.'),
    componentName,
    hasDefaultExport,
    hasNamedExport,
    hasModuleExports,
    hasExportFunction,
    hasUseClient,
    lastLines,
    status: hasDefaultExport ? '✅' : '❌'
  };
}

// Main execution
const appDir = path.join(process.cwd(), 'app');
const pageFiles = findPageFiles(appDir);

console.log(`Found ${pageFiles.length} page files\n`);

const results = [];
let problemFiles = [];

for (const file of pageFiles) {
  const analysis = analyzeFile(file);
  results.push(analysis);
  
  if (analysis.status === '❌') {
    problemFiles.push(analysis);
  }
}

// Summary
console.log('SUMMARY:');
console.log('--------');
console.log(`✅ Correct exports: ${results.filter(r => r.status === '✅').length}`);
console.log(`❌ Problem exports: ${problemFiles.length}\n`);

// Show problem files
if (problemFiles.length > 0) {
  console.log('PROBLEM FILES:');
  console.log('--------------');
  for (const file of problemFiles) {
    console.log(`\n${file.status} ${file.path}`);
    console.log(`   Component: ${file.componentName}`);
    console.log(`   Has default export: ${file.hasDefaultExport}`);
    console.log(`   Has named export: ${file.hasNamedExport}`);
    console.log(`   Has module.exports: ${file.hasModuleExports}`);
    console.log('\n   Last 10 lines:');
    console.log('   ' + file.lastLines.split('\n').join('\n   '));
  }
}

// Show a few correct files for comparison
console.log('\n\nSAMPLE CORRECT FILES (for reference):');
console.log('--------------------------------------');
const correctFiles = results.filter(r => r.status === '✅').slice(0, 3);
for (const file of correctFiles) {
  console.log(`\n${file.status} ${file.path}`);
  console.log(`   Component: ${file.componentName}`);
  console.log(`   Last line: ${file.lastLines.split('\n').filter(l => l.includes('export')).join('')}`);
}

// Write full report to file
const report = {
  timestamp: new Date().toISOString(),
  totalFiles: pageFiles.length,
  correctFiles: results.filter(r => r.status === '✅').length,
  problemFiles: problemFiles.length,
  files: results
};

fs.writeFileSync('export-report.json', JSON.stringify(report, null, 2));
console.log('\n\nFull report saved to: export-report.json');

// Specific recommendations
console.log('\n\nRECOMMENDATIONS:');
console.log('----------------');
if (problemFiles.length === 0) {
  console.log('All exports look correct! The issue might be:');
  console.log('1. Clear Next.js cache: rm -rf .next');
  console.log('2. Clear node_modules: rm -rf node_modules && npm install');
  console.log('3. Check for circular dependencies');
} else {
  console.log(`Fix ${problemFiles.length} files with incorrect exports`);
  console.log('Each file should end with: export default ComponentName;');
}