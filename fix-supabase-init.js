const fs = require('fs');
const path = require('path');

const filesToFix = [
  'app/api/analyze-ai/route.js',
  'app/api/scrape-ebay-knowledge/route.js',
  'app/api/ai-learning/route.js',
  'app/api/user/grant-credits/route.js',
  'app/api/user/listings/route.js',
  'app/api/user/stats/route.js',
  'app/api/user/billing/route.js',
  'app/api/beta-signup/route.js',
  'app/api/analyses/recent/route.js',
  'app/api/analyze/route.js',
  'app/api/add-credits/route.js',
  'app/api/stripe/purchase-credits/route.js'
];

filesToFix.forEach(filePath => {
  const fullPath = path.join(process.cwd(), filePath);
  
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Check if file has module-level createClient
    if (content.includes('const supabase = createClient(')) {
      console.log(`Fixing: ${filePath}`);
      
      // Replace the import
      content = content.replace(
        "import { createClient } from '@supabase/supabase-js';",
        "import { getSupabaseClient } from '@/app/lib/supabase-server';"
      );
      
      // Remove module-level initialization
      content = content.replace(
        /const supabase = createClient\([^)]*\);?/g,
        ''
      );
      
      // Add supabase initialization in each exported function
      content = content.replace(
        /export async function (GET|POST|PUT|DELETE|PATCH)\(request\) {/g,
        `export async function $1(request) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  }`
      );
      
      // Make sure we have the right import for auth
      if (!content.includes("from '@clerk/nextjs/server'")) {
        content = content.replace(
          "from '@clerk/nextjs'",
          "from '@clerk/nextjs/server'"
        );
      }
      
      // Add dynamic export if not present
      if (!content.includes("export const dynamic")) {
        const lines = content.split('\n');
        const importEndIndex = lines.findIndex(line => !line.startsWith('import') && line.trim() !== '');
        lines.splice(importEndIndex, 0, "\nexport const dynamic = 'force-dynamic';");
        content = lines.join('\n');
      }
      
      fs.writeFileSync(fullPath, content);
      console.log(`✅ Fixed: ${filePath}`);
    }
  }
});

console.log('Done! Please review the changes.');