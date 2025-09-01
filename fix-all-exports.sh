#!/bin/bash

echo "🔧 Fixing duplicate exports in all page.js files..."

# Find all page.js files and remove duplicate export default lines
find app -name "page.js" -type f -exec sed -i.bak '/^export default [A-Za-z][A-Za-z0-9]*;$/d' {} \;

echo "✅ Fixed all duplicate exports!"
echo "📋 Files processed:"
find app -name "page.js" -type f

echo ""
echo "🚀 Now run: npm run build"
echo "   If successful, then: git add . && git commit -m 'Fix: Remove duplicate exports' && git push"