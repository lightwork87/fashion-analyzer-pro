// app/scripts/import-fashion-terms-fixed.js
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');

console.log('Starting Fashion Terms Import');
console.log('============================\n');

// Load .env.local file manually (same as your check-env.js)
function loadEnvFile() {
  const envPath = path.join(process.cwd(), '.env.local');
  
  if (!fs.existsSync(envPath)) {
    console.log('No .env.local file found');
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
    
    return true;
  } catch (error) {
    console.log(`Error reading .env.local: ${error.message}`);
    return false;
  }
}

// Load environment variables
const envLoaded = loadEnvFile();
if (!envLoaded) {
  console.error('Failed to load .env.local file');
  process.exit(1);
}

// Check required environment variables
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.error('Missing required environment variables!');
  console.error('Need: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

console.log('Environment variables loaded successfully');

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Load the fashion data
async function loadFashionData() {
  try {
    // Try dynamic import first
    const dataModule = await import('../data/fashion-terms-data.js');
    return dataModule.fashionTermsData;
  } catch (error) {
    console.log('Dynamic import failed, trying fallback method...');
    
    // Fallback: read and evaluate the file
    try {
      const dataPath = path.join(process.cwd(), 'app/data/fashion-terms-data.js');
      const fileContent = fs.readFileSync(dataPath, 'utf8');
      
      // Convert ES6 export to CommonJS
      const convertedContent = fileContent
        .replace('export const fashionTermsData =', 'const fashionTermsData =')
        .concat('\nmodule.exports = { fashionTermsData };');
      
      // Create a temporary module context
      const tempModule = { exports: {} };
      const tempRequire = require;
      const tempProcess = process;
      const tempConsole = console;
      
      // Evaluate the converted content in a controlled context
      const evalFunction = new Function('module', 'exports', 'require', 'process', 'console', convertedContent);
      evalFunction(tempModule, tempModule.exports, tempRequire, tempProcess, tempConsole);
      
      return tempModule.exports.fashionTermsData;
      
    } catch (fallbackError) {
      console.error('Failed to load fashion data:', fallbackError.message);
      throw error;
    }
  }
}

// Main import function
async function importFashionTerms() {
  let totalImported = 0;
  let totalErrors = 0;
  const errors = [];
  
  try {
    console.log('Loading fashion terminology data...');
    const fashionTermsData = await loadFashionData();
    
    if (!fashionTermsData) {
      throw new Error('No fashion data loaded');
    }
    
    console.log('Fashion data loaded successfully\n');
    
    // Test database connection
    console.log('Testing database connection...');
    const { count: currentCount, error: countError } = await supabase
      .from('fashion_terms')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('Database connection failed:', countError.message);
      throw countError;
    }
    
    console.log(`Database connected. Current terms: ${currentCount || 0}\n`);
    
    // Process each category
    const categories = Object.keys(fashionTermsData);
    console.log(`Found ${categories.length} categories to import:`);
    categories.forEach(cat => {
      const count = fashionTermsData[cat]?.length || 0;
      console.log(`   - ${cat} (${count} terms)`);
    });
    console.log('');
    
    for (const categoryName of categories) {
      console.log(`\nProcessing ${categoryName}...`);
      const terms = fashionTermsData[categoryName] || [];
      
      if (terms.length === 0) {
        console.log(`No terms found in ${categoryName}`);
        continue;
      }
      
      for (let i = 0; i < terms.length; i++) {
        const term = terms[i];
        
        try {
          // Prepare the data for insertion
          const fashionTermRecord = {
            term: term.term || 'Unknown',
            category: term.category || categoryName,
            subcategory: term.subcategory || null,
            primary_description: term.primary_description || '',
            alternative_names: term.alternative_names || [],
            visual_features: term.visual_features || [],
            typical_measurements: term.typical_measurements || null,
            commonly_paired_with: term.commonly_paired_with || [],
            typical_garment_types: term.typical_garment_types || [],
            gender_association: term.gender_association || 'women',
            formality_level: term.formality_level || 5,
            era_associations: term.era_associations || [],
            search_keywords: term.search_keywords || [],
            uk_specific_terms: term.uk_specific_terms || [],
            us_equivalent_terms: term.us_equivalent_terms || [],
            source: 'oregon_state_fashion_guide',
            page_number: term.page_number || null,
            confidence_score: 1.0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          
          // Insert the term
          const { error: insertError } = await supabase
            .from('fashion_terms')
            .insert(fashionTermRecord);
          
          if (insertError) {
            // If it's a duplicate, that's okay
            if (insertError.code === '23505') {
              console.log(`Skipped duplicate: ${term.term}`);
            } else {
              throw insertError;
            }
          } else {
            console.log(`Imported: ${term.term} (${term.category || categoryName})`);
            totalImported++;
          }
          
          // Show progress for large categories
          if (terms.length > 20 && (i + 1) % 20 === 0) {
            console.log(`   Progress: ${i + 1}/${terms.length} terms processed`);
          }
          
        } catch (termError) {
          console.error(`Error with term "${term.term}":`, termError.message);
          errors.push({
            term: term.term,
            category: term.category || categoryName,
            error: termError.message
          });
          totalErrors++;
        }
      }
      
      console.log(`Completed ${categoryName}: ${terms.length} terms processed`);
    }
    
  } catch (error) {
    console.error('Fatal error during import:', error);
    return { success: false, error: error.message };
  }
  
  // Final report
  console.log('\n' + '='.repeat(50));
  console.log('IMPORT COMPLETE');
  console.log('='.repeat(50));
  console.log(`Successfully imported: ${totalImported} terms`);
  console.log(`Errors encountered: ${totalErrors}`);
  
  if (errors.length > 0) {
    console.log('\nFirst few errors:');
    errors.slice(0, 5).forEach(e => {
      console.log(`   - ${e.term} (${e.category}): ${e.error}`);
    });
    if (errors.length > 5) {
      console.log(`   ... and ${errors.length - 5} more errors`);
    }
  }
  
  // Get final count
  try {
    const { count: finalCount } = await supabase
      .from('fashion_terms')
      .select('*', { count: 'exact', head: true });
    
    console.log(`\nTotal terms in database: ${finalCount || 'unknown'}`);
  } catch (countError) {
    console.log('Could not get final count');
  }
  
  console.log('\nFashion terminology import completed!');
  console.log('Your AI can now use professional fashion vocabulary.');
  
  return {
    success: true,
    totalImported,
    totalErrors,
    errors: errors.slice(0, 10)
  };
}

// Run the import
if (require.main === module) {
  importFashionTerms()
    .then(result => {
      if (result.success) {
        console.log('\nImport completed successfully!');
        process.exit(0);
      } else {
        console.error('\nImport failed:', result.error);
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('\nUnexpected error:', error);
      process.exit(1);
    });
}

module.exports = { importFashionTerms };