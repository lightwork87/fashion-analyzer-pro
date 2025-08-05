// app/api/bulk-analyze/route.js
import { NextResponse } from 'next/server'
import sharp from 'sharp'

export async function POST(request) {
  const encoder = new TextEncoder()
  
  const stream = new ReadableStream({
    async start(controller) {
      // Debug: Check if API key is loaded
      const API_KEY = process.env.ANTHROPIC_API_KEY
      console.log('🔑 BULK API DEBUG - API Key loaded:', API_KEY ? 'YES (length: ' + API_KEY.length + ')' : 'NO - MISSING!')
      
      if (!API_KEY) {
        console.error('❌ ANTHROPIC_API_KEY not found in environment variables')
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          type: 'error',
          error: 'Server configuration error: API key not found'
        })}\n\n`))
        controller.close()
        return
      }

      try {
        console.log('🚀 BULK PROCESSING STARTED')
        
        const formData = await request.formData()
        const images = formData.getAll('images')
        
        console.log(`📸 Received ${images.length} images for bulk processing`)
        
        // Send initial progress
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          type: 'progress',
          message: `📸 Uploaded ${images.length} images successfully`,
          current: 0,
          total: 0,
          step: 'upload'
        })}\n\n`))

        await new Promise(resolve => setTimeout(resolve, 1000))

        // Step 1: Group images
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          type: 'progress',
          message: `🔄 Grouping images into items...`,
          current: 0,
          total: 0,
          step: 'grouping'
        })}\n\n`))

        // Create groups of 3 images each (smaller groups for reliability)
        const groups = []
        const imagesPerGroup = 3
        
        for (let i = 0; i < images.length; i += imagesPerGroup) {
          const groupImages = images.slice(i, i + imagesPerGroup)
          groups.push({
            id: Math.floor(i / imagesPerGroup) + 1,
            images: groupImages
          })
        }
        
        console.log(`📦 Created ${groups.length} groups from ${images.length} images`)
        
        await new Promise(resolve => setTimeout(resolve, 1000))

        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          type: 'progress',
          message: `✅ Grouped into ${groups.length} items`,
          current: 0,
          total: groups.length,
          step: 'grouped'
        })}\n\n`))

        await new Promise(resolve => setTimeout(resolve, 1000))

        // Step 2: Process each group with detailed progress
        for (let i = 0; i < groups.length; i++) {
          const group = groups[i]
          const itemNumber = i + 1
          
          // Pre-processing step
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'progress',
            message: `🔄 Preparing item ${itemNumber}/${groups.length} (${group.images.length} images)`,
            current: itemNumber,
            total: groups.length,
            step: 'preparing'
          })}\n\n`))

          await new Promise(resolve => setTimeout(resolve, 800))

          // AI Analysis step
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'progress',
            message: `🤖 AI analyzing item ${itemNumber}/${groups.length}...`,
            current: itemNumber,
            total: groups.length,
            step: 'analyzing'
          })}\n\n`))

          try {
            const result = await analyzeGroup(group, itemNumber, API_KEY)
            
            // Success step
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
              type: 'progress',
              message: `✅ Completed item ${itemNumber}/${groups.length}: "${result.title}"`,
              current: itemNumber,
              total: groups.length,
              step: 'completed'
            })}\n\n`))

            // Send result
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
              type: 'result',
              result: result
            })}\n\n`))
            
            // Delay between items
            await new Promise(resolve => setTimeout(resolve, 1500))
            
          } catch (error) {
            console.error(`❌ Error processing group ${itemNumber}:`, error)
            
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
              type: 'progress',
              message: `❌ Error processing item ${itemNumber}: ${error.message}`,
              current: itemNumber,
              total: groups.length,
              step: 'error'
            })}\n\n`))

            // Create fallback result
            const fallbackResult = {
              item_number: itemNumber,
              image_count: group.images.length,
              title: `Womens Clothing Item ${itemNumber} - Good Condition`,
              description: `Womens clothing item in good condition from smoke-free home. Measurements available upon request.`,
              brand: 'Unknown',
              item_type: 'Clothing',
              size: 'Various',
              colour: 'Multi',
              confidence: 'low',
              error: true
            }

            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
              type: 'result',
              result: fallbackResult
            })}\n\n`))
          }
        }

        // Final completion
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          type: 'complete',
          message: `🎉 Successfully processed all ${groups.length} items!`,
          total_items: groups.length
        })}\n\n`))

      } catch (error) {
        console.error('❌ BULK PROCESSING ERROR:', error)
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          type: 'error',
          error: `System error: ${error.message}`
        })}\n\n`))
      } finally {
        controller.close()
      }
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}

async function analyzeGroup(group, itemNumber, API_KEY) {
  console.log(`🤖 Starting analysis for item ${itemNumber} with ${group.images.length} images`)

  // Process only the first 2 images to avoid API limits
  const imageContents = []
  const maxImages = Math.min(group.images.length, 2)
  
  for (let i = 0; i < maxImages; i++) {
    const image = group.images[i]
    try {
      console.log(`📷 Processing image ${i + 1}/${maxImages} for item ${itemNumber}`)
      
      const buffer = Buffer.from(await image.arrayBuffer())
      
      // Optimize image size
      const resizedBuffer = await sharp(buffer)
        .resize(400, 400, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 65 })
        .toBuffer()
      
      // Skip if too large
      if (resizedBuffer.length > 500 * 1024) {
        console.log(`⚠️ Skipping large image ${i + 1} in item ${itemNumber}`)
        continue
      }
      
      const base64 = resizedBuffer.toString('base64')
      
      imageContents.push({
        type: "image",
        source: {
          type: "base64",
          media_type: "image/jpeg",
          data: base64
        }
      })
      
      console.log(`✅ Image ${i + 1} processed successfully for item ${itemNumber}`)
      
    } catch (error) {
      console.error(`❌ Error processing image ${i + 1} in item ${itemNumber}:`, error.message)
    }
  }

  if (imageContents.length === 0) {
    throw new Error(`No images could be processed for item ${itemNumber}`)
  }

  console.log(`📸 Successfully processed ${imageContents.length} images for item ${itemNumber}`)

  // Simple, reliable prompt
  const prompt = `Analyze these clothing images and create an eBay title and description.

IMPORTANT DETECTION RULES:
- If you see Roman numerals (I, II, III, IV, V) = Size and brand is likely Oska
- If you see clear size labels = use exact size
- Look for brand labels and care labels

Create a professional eBay listing.

Respond with ONLY this JSON format:
{
  "title": "Brand ItemType Womens Size Color StyleKeywords",
  "brand": "exact brand name or Unknown",
  "item_type": "dress/top/shirt/jumper/trousers/skirt/jacket etc",
  "size": "exact size or Various",
  "colour": "main color",
  "description": "Professional eBay description with fabric details, condition, smoke-free home note",
  "confidence": "high/medium/low"
}`

  try {
    console.log(`📡 Making Claude API request for item ${itemNumber}`)

    const requestBody = {
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: [
            ...imageContents,
            {
              type: 'text',
              text: prompt
            }
          ]
        }
      ]
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
      },
      body: JSON.stringify(requestBody)
    })

    console.log(`📡 Claude API response status: ${response.status} for item ${itemNumber}`)

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`❌ Claude API error for item ${itemNumber}:`, response.status, errorText)
      throw new Error(`Claude API returned ${response.status}`)
    }

    const data = await response.json()
    const responseText = data.content[0].text

    console.log(`📝 Claude response for item ${itemNumber}:`, responseText.substring(0, 200) + '...')

    // Parse response
    let analysisResult
    try {
      const cleanedResponse = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      analysisResult = JSON.parse(cleanedResponse)
      console.log(`✅ Successfully parsed JSON for item ${itemNumber}`)
    } catch (parseError) {
      console.error(`❌ JSON parsing error for item ${itemNumber}:`, parseError.message)
      throw new Error(`Could not parse Claude response for item ${itemNumber}`)
    }

    // Return structured result
    const result = {
      item_number: itemNumber,
      image_count: group.images.length,
      title: analysisResult.title || `Womens Clothing Item ${itemNumber}`,
      description: analysisResult.description || `Womens clothing item in good condition from smoke-free home.`,
      brand: analysisResult.brand || 'Unknown',
      item_type: analysisResult.item_type || 'Clothing',
      size: analysisResult.size || 'Various',
      colour: analysisResult.colour || 'Multi',
      confidence: analysisResult.confidence || 'medium'
    }

    console.log(`✅ Analysis complete for item ${itemNumber}: "${result.title}"`)
    return result

  } catch (error) {
    console.error(`❌ Analysis failed for item ${itemNumber}:`, error.message)
    throw error
  }
}