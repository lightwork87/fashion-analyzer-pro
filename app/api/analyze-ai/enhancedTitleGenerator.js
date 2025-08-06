/**
 * COPY THIS TO: lib/enhancedTitleGenerator.js
 */

class EnhancedTitleGenerator {
  constructor() {
    this.claudeApiUrl = 'https://api.anthropic.com/v1/messages';
    this.model = 'claude-sonnet-4-20250514';
  }

  async generateEnhancedTitle(processedImages, apiKey) {
    try {
      console.log(`🤖 Starting AI analysis for ${processedImages.length} images`);

      if (!apiKey) {
        throw new Error('No API key provided');
      }

      const response = await fetch(this.claudeApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: 800,
          messages: [{
            role: 'user',
            content: [
              ...processedImages,
              {
                type: "text",
                text: `Analyze these clothing images and create a professional eBay UK title.

Look for these details:
1. Brand name (from labels/tags)
2. Item type (dress, top, jeans, trainers, etc.)
3. Gender (from style/cut)
4. Size (from labels)
5. Color (main color visible)
6. Material (from labels or texture)

Create an eBay title in this format:
[BRAND] [ITEM] [GENDER] [SIZE] [COLOR] [MATERIAL] [FEATURES]

Examples:
- "Nike Air Max Trainers Mens Size 9 White Leather Running"
- "Zara Midi Dress Womens Size S Navy Blue Polyester Party"
- "Levi's 501 Jeans Mens Size 32 Dark Blue Denim Straight"

Rules:
- Maximum 80 characters
- Title Case (Every Word Capitalized)
- Only include what you can clearly see
- Use specific brand names if visible
- Be accurate with sizes and colors

Respond with JSON only:
{
  "title": "Exact eBay title here",
  "brand": "Brand name seen or 'Brand'",
  "item_type": "dress/top/jeans/trainers/etc",
  "gender": "Mens/Womens/Unisex",
  "size": "Size seen or 'One Size'",
  "color": "Main color",
  "material": "Material or 'Cotton'",
  "confidence": "high/medium/low",
  "description": "Brief eBay description"
}`
              }
            ]
          }]
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      let responseText = data.content[0].text.trim();

      // Extract JSON from response
      if (responseText.includes('```json')) {
        responseText = responseText.split('```json')[1].split('```')[0];
      } else if (responseText.includes('```')) {
        responseText = responseText.split('```')[1].split('```')[0];
      }

      const result = JSON.parse(responseText.trim());
      
      // Clean up the title
      let cleanTitle = result.title;
      
      // Apply title case
      cleanTitle = cleanTitle.replace(/\b\w+/g, (word) => {
        if (word.includes('%')) return word;
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      });
      
      // Ensure 80 character limit
      if (cleanTitle.length > 80) {
        cleanTitle = cleanTitle.substring(0, 80).trim();
        const lastSpace = cleanTitle.lastIndexOf(' ');
        if (lastSpace > 60) {
          cleanTitle = cleanTitle.substring(0, lastSpace);
        }
      }

      console.log(`✅ AI generated title: "${cleanTitle}"`);

      return {
        title: cleanTitle,
        character_count: cleanTitle.length,
        structure_breakdown: {
          brand: result.brand || 'Brand',
          item: result.item_type || 'Item',
          gender: result.gender || 'Unisex',
          size: result.size || 'One Size',
          colour: result.color || 'Black',
          material: result.material || 'Cotton',
          confidence: result.confidence || 'medium'
        },
        description: result.description || `Quality ${result.item_type || 'item'} in good condition.\n\nPlease see photos for full details.\n\nFrom smoke-free home.\n\nHappy to answer any questions.`,
        condition: {
          category: 'Pre-owned - Very Good',
          details: 'Condition assessed from images',
          confidence: result.confidence || 'medium'
        },
        visual_analysis: `AI successfully analyzed ${processedImages.length} images and detected: ${result.item_type || 'clothing item'} by ${result.brand || 'unidentified brand'}`,
        ai_powered: true,
        source: 'Claude AI Analysis'
      };

    } catch (error) {
      console.error('❌ Enhanced title generation failed:', error);
      throw error;
    }
  }
}

export { EnhancedTitleGenerator };