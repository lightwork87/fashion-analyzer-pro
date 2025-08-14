export async function analyzeImagesWithAI(images) {
  try {
    console.log('Starting AI analysis with', images.length, 'images');
    
    // First, use Google Vision API for basic detection
    const visionResults = await analyzeWithGoogleVision(images[0]);
    
    // Then enhance with Claude
    const enhancedResults = await enhanceWithClaude(images, visionResults);
    
    return enhancedResults;
  } catch (error) {
    console.error('AI Integration error:', error);
    throw error;
  }
}

async function analyzeWithGoogleVision(image) {
  try {
    const apiKey = process.env.GOOGLE_CLOUD_VISION_API_KEY;
    
    if (!apiKey) {
      throw new Error('Google Vision API key not configured');
    }

    const response = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [{
            image: {
              content: image.base64
            },
            features: [
              { type: 'LABEL_DETECTION', maxResults: 10 },
              { type: 'TEXT_DETECTION', maxResults: 10 },
              { type: 'LOGO_DETECTION', maxResults: 5 },
              { type: 'IMAGE_PROPERTIES', maxResults: 5 }
            ]
          }]
        })
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('Google Vision API error:', error);
      throw new Error('Google Vision API failed');
    }

    const data = await response.json();
    const result = data.responses[0];

    console.log('Google Vision results:', result);

    // Extract useful information
    const labels = result.labelAnnotations?.map(l => l.description) || [];
    const logos = result.logoAnnotations?.map(l => l.description) || [];
    const text = result.textAnnotations?.[0]?.description || '';
    const colors = result.imagePropertiesAnnotation?.dominantColors?.colors || [];

    return {
      labels,
      logos,
      text,
      colors: colors.slice(0, 3).map(c => {
        const rgb = c.color;
        return getColorName(rgb.red || 0, rgb.green || 0, rgb.blue || 0);
      })
    };
  } catch (error) {
    console.error('Google Vision error:', error);
    // Return basic results if Vision API fails
    return {
      labels: [],
      logos: [],
      text: '',
      colors: []
    };
  }
}

async function enhanceWithClaude(images, visionResults) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    
    if (!apiKey) {
      throw new Error('Anthropic API key not configured');
    }

    // Prepare the prompt
    const prompt = `You are an expert fashion analyst for an eBay reselling business. Analyze this fashion item and provide detailed information.

${visionResults.labels.length > 0 ? `Google Vision detected: ${visionResults.labels.join(', ')}` : ''}
${visionResults.logos.length > 0 ? `Detected brands/logos: ${visionResults.logos.join(', ')}` : ''}
${visionResults.text ? `Text found in image: ${visionResults.text}` : ''}

Please analyze this fashion item and provide the following information in JSON format:
{
  "itemType": "specific type of clothing/accessory",
  "brand": "detected brand name or Unknown Brand",
  "size": "detected size or empty string",
  "color": "primary color",
  "material": "fabric/material if visible",
  "style": "style description",
  "condition": "New with tags/New without tags/Excellent/Very Good/Good/Fair/Poor",
  "features": ["list", "of", "notable", "features"],
  "gender": "Women/Men/Unisex",
  "description": "2-3 sentence description of the item"
}

Be specific and accurate. If you cannot determine something with confidence, use reasonable defaults.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt
              },
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: images[0].mimeType || 'image/jpeg',
                  data: images[0].base64
                }
              }
            ]
          }
        ]
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Claude API error:', error);
      throw new Error('Claude API failed');
    }

    const data = await response.json();
    console.log('Claude response:', data);

    // Extract the JSON from Claude's response
    const content = data.content[0].text;
    
    // Try to parse JSON from the response
    let analysisResult;
    try {
      // Look for JSON in the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysisResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse Claude response:', parseError);
      // Fallback to basic parsing
      analysisResult = parseClaudeText(content);
    }

    // Merge with Vision results
    return {
      ...analysisResult,
      brand: analysisResult.brand || visionResults.logos[0] || 'Unknown Brand',
      color: analysisResult.color || visionResults.colors[0] || 'Multicoloured'
    };

  } catch (error) {
    console.error('Claude API error:', error);
    // Fallback to Vision results
    return generateFallbackAnalysis(visionResults);
  }
}

function parseClaudeText(text) {
  // Basic parsing if JSON extraction fails
  const result = {
    itemType: 'Fashion Item',
    brand: 'Unknown Brand',
    size: '',
    color: '',
    material: '',
    style: 'Casual',
    condition: 'Good',
    features: [],
    gender: 'Women',
    description: 'Fashion item for sale'
  };

  // Try to extract key information
  const lines = text.split('\n');
  for (const line of lines) {
    const lower = line.toLowerCase();
    if (lower.includes('type:') || lower.includes('item:')) {
      result.itemType = line.split(':')[1]?.trim() || result.itemType;
    }
    if (lower.includes('brand:')) {
      result.brand = line.split(':')[1]?.trim() || result.brand;
    }
    if (lower.includes('size:')) {
      result.size = line.split(':')[1]?.trim() || result.size;
    }
    if (lower.includes('color:') || lower.includes('colour:')) {
      result.color = line.split(':')[1]?.trim() || result.color;
    }
    if (lower.includes('condition:')) {
      result.condition = line.split(':')[1]?.trim() || result.condition;
    }
  }

  return result;
}

function generateFallbackAnalysis(visionResults) {
  // Generate basic analysis from Vision results
  const labels = visionResults.labels || [];
  
  // Detect item type from labels
  let itemType = 'Fashion Item';
  const clothingTypes = ['dress', 'shirt', 'jeans', 'jacket', 'coat', 'skirt', 'top', 'trousers', 'shoes', 'bag'];
  for (const type of clothingTypes) {
    if (labels.some(label => label.toLowerCase().includes(type))) {
      itemType = type.charAt(0).toUpperCase() + type.slice(1);
      break;
    }
  }

  return {
    itemType,
    brand: visionResults.logos[0] || 'Unknown Brand',
    size: '',
    color: visionResults.colors[0] || 'Multicoloured',
    material: '',
    style: 'Casual',
    condition: 'Good',
    features: labels.slice(0, 3),
    gender: 'Women',
    description: `${itemType} in good condition. Please see photos for details.`
  };
}

function getColorName(r, g, b) {
  // Simple color detection
  const colors = {
    'Black': [0, 0, 0],
    'White': [255, 255, 255],
    'Red': [255, 0, 0],
    'Blue': [0, 0, 255],
    'Green': [0, 255, 0],
    'Yellow': [255, 255, 0],
    'Pink': [255, 192, 203],
    'Purple': [128, 0, 128],
    'Orange': [255, 165, 0],
    'Brown': [165, 42, 42],
    'Grey': [128, 128, 128],
    'Navy': [0, 0, 128],
    'Beige': [245, 245, 220]
  };

  let closestColor = 'Multicoloured';
  let minDistance = Infinity;

  for (const [name, [cr, cg, cb]] of Object.entries(colors)) {
    const distance = Math.sqrt(
      Math.pow(r - cr, 2) + 
      Math.pow(g - cg, 2) + 
      Math.pow(b - cb, 2)
    );
    
    if (distance < minDistance) {
      minDistance = distance;
      closestColor = name;
    }
  }

  return closestColor;
}