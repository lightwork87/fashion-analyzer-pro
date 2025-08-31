// /Users/chrislatham/my-ebay-app/app/scripts/check-env.js
// Simple Environment Variables Checker - NO DEPENDENCIES

const fs = require('fs');
const path = require('path');

console.log('🔍 LightLister AI - Environment Check');
console.log('=====================================\n');

// Load .env.local file manually
function loadEnvFile() {
  const envPath = path.join(process.cwd(), '.env.local');
  
  if (!fs.existsSync(envPath)) {
    console.log('❌ .env.local file not found');
    console.log(`📍 Looking for: ${envPath}\n`);
    return false;
  }
  
  try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');
    
    lines.forEach(line => {
      line = line.trim();
      if (line && !line.startsWith('#')) {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').replace(/^["']|["']$/g, '');
          process.env[key] = value;
        }
      }
    });
    
    console.log('✅ .env.local file loaded successfully\n');
    return true;
  } catch (error) {
    console.log(`❌ Error reading .env.local: ${error.message}`);
    return false;
  }
}

// Check if file exists and load it
const envLoaded = loadEnvFile();

if (!envLoaded) {
  console.log('🚨 CRITICAL: No .env.local file found!');
  console.log('\nTo fix this, create .env.local with:');
  console.log('=====================================');
  console.log('# Critical for AI detection');
  console.log('GOOGLE_CLOUD_VISION_API_KEY=AIzaSyxxxxx');
  console.log('ANTHROPIC_API_KEY=sk-ant-xxxxx');
  console.log('');
  console.log('# Authentication');
  console.log('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_xxx');
  console.log('CLERK_SECRET_KEY=sk_xxx');
  console.log('');
  console.log('# Database');
  console.log('NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co');
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx');
  console.log('');
  console.log('# Payments');
  console.log('STRIPE_SECRET_KEY=sk_xxx');
  console.log('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_xxx');
  console.log('=====================================');
  process.exit(1);
}

// Required variables for your app
const criticalVars = [
  'GOOGLE_CLOUD_VISION_API_KEY',
  'ANTHROPIC_API_KEY', 
  'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
  'CLERK_SECRET_KEY',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY'
];

const optionalVars = [
  'STRIPE_SECRET_KEY',
  'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'EBAY_CLIENT_ID',
  'EBAY_CLIENT_SECRET',
  'NEXT_PUBLIC_BASE_URL'
];

console.log('🔍 Checking Critical Variables:');
console.log('===============================');

let missingCritical = [];
let foundCritical = [];

criticalVars.forEach(key => {
  const value = process.env[key];
  const status = value ? '✅' : '❌';
  const display = value ? 
    `${value.substring(0, 8)}...${value.slice(-4)}` : 
    'MISSING';
    
  console.log(`${status} ${key}: ${display}`);
  
  if (value) {
    foundCritical.push(key);
  } else {
    missingCritical.push(key);
  }
});

console.log('\n🔍 Checking Optional Variables:');
console.log('===============================');

let missingOptional = [];
let foundOptional = [];

optionalVars.forEach(key => {
  const value = process.env[key];
  const status = value ? '✅' : '⚠️';
  const display = value ? 
    `${value.substring(0, 8)}...${value.slice(-4)}` : 
    'NOT SET';
    
  console.log(`${status} ${key}: ${display}`);
  
  if (value) {
    foundOptional.push(key);
  } else {
    missingOptional.push(key);
  }
});

// Summary
console.log('\n📊 SUMMARY');
console.log('===========');
console.log(`✅ Critical Found: ${foundCritical.length}/${criticalVars.length}`);
console.log(`⚠️  Optional Found: ${foundOptional.length}/${optionalVars.length}`);

if (missingCritical.length > 0) {
  console.log('\n🚨 MISSING CRITICAL VARIABLES:');
  missingCritical.forEach(key => {
    console.log(`   ❌ ${key}`);
  });
  
  console.log('\n🔧 THIS IS WHY YOUR AI ISN\'T WORKING!');
  console.log('Get these API keys:');
  console.log('1. Google Vision: https://console.cloud.google.com');
  console.log('2. Claude API: https://console.anthropic.com');
  console.log('3. Add them to .env.local');
  console.log('4. Restart: npm run dev\n');
  
  process.exit(1);
} else {
  console.log('\n🎉 All critical variables found!');
  console.log('✅ Your AI detection should be working');
  console.log('🚀 Ready to process fashion items');
  
  if (missingOptional.length > 0) {
    console.log('\n💡 Optional features missing:');
    missingOptional.forEach(key => {
      console.log(`   ⚠️  ${key} - needed for payments/eBay integration`);
    });
  }
}

console.log('\n🎯 NEXT STEPS:');
console.log('1. Fix any missing variables above');
console.log('2. Run: npm run dev');
console.log('3. Test AI analysis with clear brand photos');
console.log('4. Check browser console for any errors');
console.log('\n📧 If you need help getting API keys, just ask!');