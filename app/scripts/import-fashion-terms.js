// app/scripts/import-fashion-terms-fixed.js
// Fixed version using consistent CommonJS modules

const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') });

console.log('🚀 Starting Fashion Terms Import - Fixed Version');
console.log('================================================\n');

// Check environment variables
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.error('❌ Missing environment variables!');
  console.error('Please ensure .env.local contains:');
  console.error('NEXT_PUBLIC_SUPABASE_URL=your_url');
  console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Load the fashion data - convert ES6 export to CommonJS
async function loadFashionData() {
  try {
    // Since the data file uses ES6 exports, we need to dynamically import it
    const dataModule = await import('../data/fashion-terms-data.js');
    return dataModule.fashionTermsData;
  } catch (error) {
    console.error('❌ Error loading fashion data:', error.message);
    
    // Fallback: try to require a converted version
    try {
      // Convert the file content to CommonJS format
      const fs = require('fs');
      const dataPath = path.join(process.cwd(), 'app/data/fashion-terms-data.js');
      const fileContent = fs.readFileSync(dataPath, 'utf8');
      
      // Simple conversion: replace export with module.exports
      const convertedContent = fileContent
        .replace('export const fashionTermsData =', 'const fashionTermsData =')
        .concat('\nmodule.exports = { fashionTermsData };');
      
      // Evaluate the converted content
      const module = { exports: {} };
      eval(convertedContent);
      return module.exports.fashionTermsData;
      
    } catch (fallbackError) {
      console.error('❌ Fallback loading failed:', fallbackError.message);
      throw error;
    }
  }
}

// Main import function
async function importFashionTerms() {
  let totalImported = 0;
  let totalUpdated = 0;
  let totalErrors = 0;
  const errors = [];
  
  try {
    console.log('📁 Loading fashion terminology data...');
    const fashionTermsData = await loadFashionData();
    
    if (!fashionTermsData) {
      throw new Error('No fashion data loaded');
    }
    
    console.log('✅ Fashion data loaded successfully\n');
    
    // Test database connection
    console.log('🔗 Testing database connection...');
    const { data: testData, error: testError } = await supabase
      .from('fashion_terms')
      .select('count', { count: 'exact', head: true });
    
    if (testError) {
      console.error('❌ Database connection failed:', testError.message);
      throw testError;
    }
    
    console.log(`✅ Database connected. Current terms: ${testData || 0}\n`);
    
    // Process each category
    const categories = Object.keys(fashionTermsData);
    console.log(`📋 Found ${categories.length} categories to import:`);
    categories.forEach(cat => console.log(`   - ${cat} (${fashionTermsData[cat]?.length || 0} terms)`));
    console.log('');
    
    for (const categoryName of categories) {
      console.log(`\n🔍 Processing ${categoryName}...`);
      const terms = fashionTermsData[categoryName] || [];
      
      if (terms.length === 0) {
        console.log(`⚠️  No terms found in ${categoryName}`);
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
          
          // Check if term already exists
          const { data: existingTerm, error: checkError } = await supabase
            .from('fashion_terms')
            .select('id')
            .eq('term', term.term)
            .eq('category', term.category || categoryName)
            .maybeSingle();
          
          if (checkError && checkError.code !== 'PGRST116') {
            throw checkError;
          }
          
          if (existingTerm) {
            // Update existing term
            const { error: updateError } = await supabase
              .from('fashion_terms')
              .update({
                ...fashionTermRecord,
                updated_at: new Date().toISOString()
              })
              .eq('id', existingTerm.id);
            
            if (updateError) throw updateError;
            
            console.log(`🔄 Updated: ${term.term} (${term.category || categoryName})`);
            totalUpdated++;
          } else {
            // Insert new term
            const { error: insertError } = await supabase
              .from('fashion_terms')
              .insert(fashionTermRecord);
            
            if (insertError) throw insertError;
            
            console.log(`✅ Imported: ${term.term} (${term.category || categoryName})`);
            totalImported++;
          }
          
          // Show progress for large categories
          if (terms.length > 10 && (i + 1) % 10 === 0) {
            console.log(`   Progress: ${i + 1}/${terms.length} terms processed`);
          }
          
        } catch (termError) {
          console.error(`❌ Error with term "${term.term}":`, termError.message);
          errors.push({
            term: term.term,
            category: term.category || categoryName,
            error: termError.message
          });
          totalErrors++;
        }
      }
      
      console.log(`✅ Completed ${categoryName}: ${terms.length} terms processed`);
    }
    
  } catch (error) {
    console.error('❌ Fatal error during import:', error);
    return { success: false, error: error.message };
  }
  
  // Final report
  console.log('\n' + '='.repeat(60));
  console.log('📊 IMPORT COMPLETE');
  console.log('='.repeat(60));
  console.log(`✅ Successfully imported: ${totalImported} new terms`);
  console.log(`🔄 Successfully updated: ${totalUpdated} existing terms`);
  console.log(`❌ Errors encountered: ${totalErrors}`);
  console.log(`📈 Total processed: ${totalImported + totalUpdated + totalErrors}`);
  
  if (errors.length > 0 && errors.length <= 10) {
    console.log('\n⚠️  Failed imports:');
    errors.forEach(e => {
      console.log(`   - ${e.term} (${e.category}): ${e.error}`);
    });
  } else if (errors.length > 10) {
    console.log(`\n⚠️  ${errors.length} errors occurred (too many to display)`);
  }
  
  // Get final count
  try {
    const { count: finalCount } = await supabase
      .from('fashion_terms')
      .select('*', { count: 'exact', head: true });
    
    console.log(`\n📊 Total terms in database: ${finalCount || 'unknown'}`);
  } catch (countError) {
    console.log('⚠️  Could not get final count');
  }
  
  console.log('\n🎉 Fashion terminology import completed!');
  console.log('Your AI can now use professional fashion vocabulary.');
  
  return {
    success: true,
    totalImported,
    totalUpdated,
    totalErrors,
    errors: errors.slice(0, 10) // Limit errors in response
  };
}

// Run the import
if (require.main === module) {
  importFashionTerms()
    .then(result => {
      if (result.success) {
        console.log('\n✨ Import completed successfully!');
        process.exit(0);
      } else {
        console.error('\n❌ Import failed:', result.error);
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('\n❌ Unexpected error:', error);
      process.exit(1);
    });
}

module.exports = { importFashionTerms };