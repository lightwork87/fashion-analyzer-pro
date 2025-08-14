import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabase } from '../../lib/supabase';
import { analyzeImagesWithAI } from './aiIntegration';
import { generateProfessionalTitle } from './titleGenerator';
import { analyzeCondition } from './conditionAnalyzer';
import { identifyBrand } from './brandDatabase';

// Remove the sharp import if it's causing issues
async function compressImage(buffer) {
  // Simple compression fallback
  return buffer;
}

// Rest of the file remains the same...

export async function POST(request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Starting AI analysis for user:', userId);

    // Get form data
    const formData = await request.formData();
    const images = formData.getAll('images');
    const batchMode = formData.get('batchMode') === 'true';
    const groupNumber = formData.get('groupNumber');

    if (!images || images.length === 0) {
      return NextResponse.json({ error: 'No images provided' }, { status: 400 });
    }

    console.log(`Processing ${images.length} images`);

    // Get user from database
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('clerk_id', userId)
      .single();

    if (userError || !user) {
      console.error('User not found:', userError);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check credits
    const creditsNeeded = 1; // 1 credit per listing
    const totalCredits = (user.credits_total || 0) + (user.bonus_credits || 0);
    const creditsUsed = user.credits_used || 0;
    const creditsRemaining = totalCredits - creditsUsed;

    if (creditsRemaining < creditsNeeded) {
      return NextResponse.json({ 
        error: 'Insufficient credits', 
        creditsNeeded,
        creditsRemaining 
      }, { status: 402 });
    }

    // Process images
    const processedImages = [];
    for (const image of images) {
      try {
        // Convert to buffer
        const buffer = Buffer.from(await image.arrayBuffer());
        
        // Compress image
        const compressedBuffer = await compressImage(buffer);
        
        // Convert to base64
        const base64 = compressedBuffer.toString('base64');
        processedImages.push({
          base64,
          mimeType: image.type || 'image/jpeg'
        });
      } catch (error) {
        console.error('Error processing image:', error);
      }
    }

    if (processedImages.length === 0) {
      return NextResponse.json({ error: 'Failed to process images' }, { status: 400 });
    }

    console.log('Calling AI analysis...');

    // Analyze with AI
    const analysisResult = await analyzeImagesWithAI(processedImages);
    
    console.log('AI Analysis complete:', analysisResult);

    // Enhance the analysis with our specialized functions
    const enhancedResult = await enhanceAnalysis(analysisResult, processedImages);

    // Generate SKU
    const sku = generateSKU(enhancedResult);

    // Deduct credit
    const { error: creditError } = await supabase
      .from('users')
      .update({ 
        credits_used: creditsUsed + creditsNeeded,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (creditError) {
      console.error('Failed to update credits:', creditError);
    }

    // Record credit usage
    await supabase
      .from('credit_usage')
      .insert({
        user_id: user.id,
        credits_used: creditsNeeded,
        image_count: images.length,
        analysis_type: 'fashion',
        created_at: new Date().toISOString()
      });

    // Save analysis to database
    const { data: savedAnalysis, error: saveError } = await supabase
      .from('analyses')
      .insert({
        user_id: user.id,
        images_count: images.length,
        brand: enhancedResult.brand,
        item_type: enhancedResult.category,
        condition_score: enhancedResult.conditionScore,
        estimated_value_min: enhancedResult.priceMin,
        estimated_value_max: enhancedResult.priceMax,
        sku: sku,
        ebay_title: enhancedResult.title,
        description: enhancedResult.description,
        metadata: enhancedResult,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (saveError) {
      console.error('Failed to save analysis:', saveError);
    }

    // Return enhanced result
    return NextResponse.json({
      id: savedAnalysis?.id,
      sku,
      ...enhancedResult,
      creditsRemaining: creditsRemaining - creditsNeeded,
      analysisId: savedAnalysis?.id
    });

  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: 'Analysis failed: ' + error.message },
      { status: 500 }
    );
  }
}

// Enhanced analysis function
async function enhanceAnalysis(aiResult, images) {
  try {
    // Extract base information from AI
    const baseInfo = {
      itemType: aiResult.itemType || aiResult.category || 'Unknown Item',
      brand: aiResult.brand || 'Unknown Brand',
      size: aiResult.size || '',
      color: aiResult.color || '',
      material: aiResult.material || '',
      style: aiResult.style || '',
      features: aiResult.features || [],
      condition: aiResult.condition || 'Good'
    };

    // Enhance brand detection
    const enhancedBrand = await identifyBrand(baseInfo.brand, images[0]?.base64);
    
    // Enhance condition analysis
    const conditionAnalysis = await analyzeCondition(images, baseInfo.condition);
    
    // Generate professional title
    const professionalTitle = await generateProfessionalTitle({
      itemType: baseInfo.itemType,
      brand: enhancedBrand.brand,
      size: baseInfo.size,
      color: baseInfo.color,
      material: baseInfo.material,
      style: baseInfo.style,
      condition: conditionAnalysis.condition,
      features: baseInfo.features
    });

    // Generate detailed description
    const description = generateDescription({
      ...baseInfo,
      brand: enhancedBrand.brand,
      condition: conditionAnalysis.condition,
      conditionDetails: conditionAnalysis.details
    });

    // Estimate pricing
    const pricing = estimatePrice({
      brand: enhancedBrand.brand,
      brandTier: enhancedBrand.tier,
      itemType: baseInfo.itemType,
      condition: conditionAnalysis.condition,
      conditionScore: conditionAnalysis.score
    });

    return {
      // Basic Information
      title: professionalTitle,
      brand: enhancedBrand.brand,
      brandConfidence: enhancedBrand.confidence,
      category: categorizeItem(baseInfo.itemType),
      subcategory: baseInfo.itemType,
      
      // Size Information
      size: baseInfo.size,
      sizeType: detectSizeType(baseInfo.size, baseInfo.itemType),
      
      // Condition
      condition: conditionAnalysis.condition,
      conditionScore: conditionAnalysis.score,
      conditionNotes: conditionAnalysis.details,
      
      // Physical Attributes
      color: baseInfo.color,
      material: baseInfo.material,
      style: baseInfo.style,
      pattern: detectPattern(aiResult.description || ''),
      
      // Pricing
      price: pricing.recommended,
      priceMin: pricing.min,
      priceMax: pricing.max,
      
      // Description
      description: description,
      
      // Features & Keywords
      features: baseInfo.features,
      keywords: extractKeywords(professionalTitle, description),
      
      // eBay Specific
      itemSpecifics: generateItemSpecifics(baseInfo, enhancedBrand, conditionAnalysis),
      
      // Metadata
      confidence: calculateOverallConfidence(enhancedBrand, conditionAnalysis),
      analysisVersion: '2.0'
    };
  } catch (error) {
    console.error('Enhancement error:', error);
    // Return basic result if enhancement fails
    return {
      ...aiResult,
      title: aiResult.title || 'Fashion Item',
      description: aiResult.description || 'Item for sale'
    };
  }
}

// Helper functions
function categorizeItem(itemType) {
  const categories = {
    'dress': "Women's Clothing",
    'top': "Women's Clothing",
    'shirt': "Women's Clothing",
    'blouse': "Women's Clothing",
    'jacket': "Women's Clothing",
    'coat': "Women's Clothing",
    'jeans': "Women's Clothing",
    'trousers': "Women's Clothing",
    'skirt': "Women's Clothing",
    'shoes': "Women's Shoes",
    'trainers': "Women's Shoes",
    'boots': "Women's Shoes",
    'bag': "Women's Bags",
    'handbag': "Women's Bags",
    'purse': "Women's Bags"
  };
  
  const lowerType = itemType.toLowerCase();
  for (const [key, category] of Object.entries(categories)) {
    if (lowerType.includes(key)) {
      return category;
    }
  }
  
  return "Women's Clothing";
}

function detectSizeType(size, itemType) {
  if (!size) return 'Regular';
  
  const sizeStr = size.toString().toUpperCase();
  
  if (sizeStr.includes('PETITE') || sizeStr.includes('P')) return 'Petite';
  if (sizeStr.includes('PLUS') || sizeStr.includes('+')) return 'Plus';
  if (sizeStr.includes('TALL') || sizeStr.includes('T')) return 'Tall';
  if (sizeStr.includes('MATERNITY') || sizeStr.includes('M')) return 'Maternity';
  
  return 'Regular';
}

function detectPattern(description) {
  const patterns = [
    'floral', 'striped', 'polka dot', 'geometric', 'abstract',
    'animal print', 'leopard', 'zebra', 'checkered', 'plaid',
    'paisley', 'tie-dye', 'camouflage', 'solid'
  ];
  
  const lowerDesc = description.toLowerCase();
  for (const pattern of patterns) {
    if (lowerDesc.includes(pattern)) {
      return pattern.charAt(0).toUpperCase() + pattern.slice(1);
    }
  }
  
  return 'Solid';
}

function generateDescription(info) {
  const sections = [];
  
  // Opening
  sections.push(`Beautiful ${info.brand} ${info.itemType} in ${info.condition.toLowerCase()} condition.`);
  
  // Details
  const details = [];
  if (info.size) details.push(`Size: ${info.size}`);
  if (info.color) details.push(`Colour: ${info.color}`);
  if (info.material) details.push(`Material: ${info.material}`);
  if (info.style) details.push(`Style: ${info.style}`);
  
  if (details.length > 0) {
    sections.push('\n' + details.join('\n'));
  }
  
  // Condition details
  if (info.conditionDetails) {
    sections.push('\nCondition Notes:\n' + info.conditionDetails);
  }
  
  // Features
  if (info.features && info.features.length > 0) {
    sections.push('\nFeatures:\n' + info.features.map(f => `• ${f}`).join('\n'));
  }
  
  // Closing
  sections.push('\nFast dispatch and secure packaging. Please see photos for exact condition and measurements.');
  
  return sections.join('\n');
}

function estimatePrice(info) {
  // Base prices by brand tier
  const brandMultipliers = {
    'luxury': 3.0,
    'premium': 2.0,
    'mid': 1.5,
    'budget': 1.0,
    'unknown': 0.8
  };
  
  // Base prices by item type
  const basePrices = {
    'dress': 25,
    'jacket': 35,
    'coat': 40,
    'jeans': 20,
    'top': 15,
    'shirt': 18,
    'skirt': 18,
    'shoes': 25,
    'bag': 30,
    'default': 20
  };
  
  // Condition multipliers
  const conditionMultipliers = {
    'New with tags': 1.0,
    'New without tags': 0.85,
    'Excellent': 0.7,
    'Very Good': 0.6,
    'Good': 0.5,
    'Fair': 0.3,
    'Poor': 0.2
  };
  
  const itemKey = Object.keys(basePrices).find(key => 
    info.itemType.toLowerCase().includes(key)
  ) || 'default';
  
  const basePrice = basePrices[itemKey];
  const brandMultiplier = brandMultipliers[info.brandTier] || brandMultipliers.unknown;
  const conditionMultiplier = conditionMultipliers[info.condition] || 0.5;
  
  const calculatedPrice = Math.round(basePrice * brandMultiplier * conditionMultiplier);
  
  return {
    recommended: calculatedPrice,
    min: Math.round(calculatedPrice * 0.8),
    max: Math.round(calculatedPrice * 1.3)
  };
}

function generateItemSpecifics(info, brand, condition) {
  const specifics = {
    'Brand': brand.brand,
    'Size': info.size || 'One Size',
    'Size Type': info.sizeType || 'Regular',
    'Colour': info.color || 'Multicoloured',
    'Material': info.material || 'See Description',
    'Style': info.style || 'Casual',
    'Condition': condition.condition,
    'Department': 'Women',
    'Type': info.itemType
  };
  
  // Add pattern if detected
  if (info.pattern && info.pattern !== 'Solid') {
    specifics['Pattern'] = info.pattern;
  }
  
  return specifics;
}

function extractKeywords(title, description) {
  const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for']);
  const allText = `${title} ${description}`.toLowerCase();
  const words = allText.match(/\b\w+\b/g) || [];
  
  const keywords = [...new Set(words)]
    .filter(word => word.length > 3 && !commonWords.has(word))
    .slice(0, 20);
  
  return keywords;
}

function calculateOverallConfidence(brand, condition) {
  const brandWeight = 0.4;
  const conditionWeight = 0.6;
  
  const brandConfidence = brand.confidence || 0.5;
  const conditionConfidence = condition.confidence || 0.8;
  
  return Math.round((brandConfidence * brandWeight + conditionConfidence * conditionWeight) * 100);
}

function generateSKU(result) {
  const brand = (result.brand || 'XX').substring(0, 3).toUpperCase();
  const category = (result.category || 'XX').substring(0, 2).toUpperCase();
  const timestamp = Date.now().toString(36).toUpperCase();
  
  return `${brand}-${category}-${timestamp}`;
}