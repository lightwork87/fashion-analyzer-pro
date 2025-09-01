'use client'
import { useState } from 'react'
import Link from 'next/link'

export default function BulkProcessing() {
  const [images, setImages] = useState([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [results, setResults] = useState([])
  const [processingStatus, setProcessingStatus] = useState('')
  const [currentItem, setCurrentItem] = useState(0)
  const [totalItems, setTotalItems] = useState(0)
  const [processingStep, setProcessingStep] = useState('')
  const [pricingData, setPricingData] = useState({})
  const [researchingPricing, setResearchingPricing] = useState({})

  const handleImageUpload = (event) => {
    const files = Array.from(event.target.files)
    if (files.length > 500) {
      alert('Maximum 500 images allowed')
      return
    }
    setImages(files)
    setResults([])
    setPricingData({})
    setResearchingPricing({})
    setCurrentItem(0)
    setTotalItems(0)
    console.log(`📸 Selected ${files.length} images for bulk processing`)
  }

  const handleBulkProcessing = async () => {
    if (images.length === 0) {
      alert('Please select images first!')
      return
    }

    setIsProcessing(true)
    setResults([])
    setCurrentItem(0)
    setTotalItems(0)
    setPricingData({})
    setResearchingPricing({})
    setProcessingStep('starting')

    try {
      console.log('🚀 Starting bulk processing...')
      
      const formData = new FormData()
      images.forEach((image, index) => {
        formData.append('images', image)
      })

      const response = await fetch('/api/bulk-analyze', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              
              if (data.type === 'progress') {
                setProcessingStatus(data.message)
                setCurrentItem(data.current || 0)
                setTotalItems(data.total || 0)
                setProcessingStep(data.step || 'processing')
              } else if (data.type === 'result') {
                setResults(prev => [...prev, data.result])
              } else if (data.type === 'complete') {
                setProcessingStatus(data.message)
                setProcessingStep('complete')
              } else if (data.type === 'error') {
                console.error('Processing error:', data.error)
                setProcessingStatus(`❌ Error: ${data.error}`)
                setProcessingStep('error')
              }
            } catch (e) {
              console.error('Error parsing chunk:', e)
            }
          }
        }
      }
    } catch (error) {
      console.error('❌ Bulk processing error:', error)
      setProcessingStatus(`❌ Error: ${error.message}`)
      setProcessingStep('error')
    } finally {
      setIsProcessing(false)
    }
  }

  const handlePriceResearch = async (item, index) => {
    setResearchingPricing(prev => ({ ...prev, [index]: true }))

    try {
      const response = await fetch('/api/research-pricing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: item.title,
          item_type: item.item_type,
          brand: item.brand,
          size: item.size,
          colour: item.colour
        })
      })

      const data = await response.json()
      
      if (data.success) {
        setPricingData(prev => ({ ...prev, [index]: data.result }))
      } else {
        alert(`Price research failed for item ${index + 1}: ${data.error}`)
      }
    } catch (error) {
      alert(`Error during price research for item ${index + 1}: ${error.message}`)
    } finally {
      setResearchingPricing(prev => ({ ...prev, [index]: false }))
    }
  }

  const handleResearchAllPricing = async () => {
    if (results.length === 0) {
      alert('No items to research pricing for!')
      return
    }

    for (let i = 0; i < results.length; i++) {
      if (!pricingData[i]) {
        await handlePriceResearch(results[i], i)
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    alert('Copied to clipboard!')
  }

  const copyAllTitles = () => {
    if (results.length === 0) {
      alert('No titles to copy!')
      return
    }
    const allTitles = results.map(item => item.title).join('\n')
    copyToClipboard(allTitles)
  }

  const copyCompleteListings = () => {
    if (results.length === 0) {
      alert('No listings to copy!')
      return
    }
    
    const completeListings = results.map((item, index) => {
      let listing = `ITEM ${item.item_number}:\n`
      listing += `Title: ${item.title}\n`
      listing += `Description: ${item.description}\n`
      
      if (pricingData[index]) {
        listing += `Suggested Price: ${pricingData[index].recommendations.suggested_price}\n`
        listing += `Competitive Range: ${pricingData[index].recommendations.competitive_range}\n`
      }
      
      listing += `\n---\n`
      return listing
    }).join('\n')
    
    copyToClipboard(completeListings)
  }

  const exportCSV = () => {
    if (results.length === 0) {
      alert('No data to export!')
      return
    }

    const headers = ['Item', 'Title', 'Brand', 'Type', 'Size', 'Colour', 'Description', 'Suggested_Price', 'Price_Range']
    const csvData = results.map((item, index) => [
      item.item_number,
      item.title,
      item.brand || '',
      item.item_type || '',
      item.size || '',
      item.colour || '',
      item.description.replace(/\n/g, ' '),
      pricingData[index] ? pricingData[index].recommendations.suggested_price : '',
      pricingData[index] ? pricingData[index].recommendations.competitive_range : ''
    ])

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ebay-listings-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const handleReset = () => {
    setImages([])
    setResults([])
    setPricingData({})
    setResearchingPricing({})
    setIsProcessing(false)
    setProcessingStatus('')
    setCurrentItem(0)
    setTotalItems(0)
    setProcessingStep('')
  }

  const getProgressPercentage = () => {
    if (totalItems === 0) return 0
    return Math.round((currentItem / totalItems) * 100)
  }

  const getStepIcon = (step) => {
    switch(step) {
      case 'upload': return '📤'
      case 'grouping': return '📦'
      case 'grouped': return '✅'
      case 'preparing': return '🔄'
      case 'analyzing': return '🤖'
      case 'completed': return '✅'
      case 'complete': return '🎉'
      case 'error': return '❌'
      default: return '⏳'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Enhanced Navigation */}
        <div className="mb-8">
          <div className="flex space-x-4 justify-center">
            <Link href="/" className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-lg transition-all transform hover:scale-105">
              📸 Single Item Processing
            </Link>
            <Link href="/bulk" className="px-8 py-4 bg-green-600 text-white rounded-xl font-semibold shadow-lg">
              🚀 Bulk Processing (25 items)
            </Link>
          </div>
        </div>

        {/* Enhanced Header */}
        <div className="text-center mb-10">
          <h1 className="text-5xl font-bold text-gray-900 mb-4 bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
            🚀 Bulk eBay Title Generator
          </h1>
          <p className="text-gray-600 text-xl mb-2">
            Process up to 25 clothing items with AI-powered analysis
          </p>
          <div className="text-green-600 font-medium">
            ⚡ Fast Processing • 🎯 Smart Grouping • 💰 UK Pricing • 📊 CSV Export
          </div>
        </div>

        {/* Enhanced Image Upload */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-gray-100">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">📁 Upload Images</h2>
          
          <div className="border-3 border-dashed border-green-300 rounded-2xl p-12 text-center bg-gradient-to-br from-green-50 to-blue-50 hover:from-green-100 hover:to-blue-100 transition-all">
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              id="bulk-image-upload"
            />
            <label htmlFor="bulk-image-upload" className="cursor-pointer">
              <div className="text-6xl mb-6">📦</div>
              <div className="text-2xl font-bold text-gray-700 mb-4">
                Select Images for Bulk Processing
              </div>
              <div className="text-lg text-gray-500 mb-4">
                Upload up to 500 images (25 items × 20 photos each)
              </div>
              <div className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-semibold inline-block transition-all transform hover:scale-105">
                📁 Choose Files
              </div>
            </label>
          </div>

          {images.length > 0 && (
            <div className="mt-6 p-6 bg-gradient-to-r from-green-100 to-blue-100 rounded-xl border border-green-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-3xl">📸</span>
                  <div>
                    <div className="text-green-800 font-bold text-xl">
                      {images.length} images selected
                    </div>
                    <div className="text-green-600 text-sm">
                      Estimated {Math.ceil(images.length / 3)} items • Ready for AI processing
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleReset}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-all"
                >
                  🗑️ Clear All
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Enhanced Processing Button */}
        {images.length > 0 && !isProcessing && results.length === 0 && (
          <div className="text-center mb-8">
            <button
              onClick={handleBulkProcessing}
              className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white px-12 py-6 rounded-2xl font-bold text-2xl shadow-xl transform transition-all hover:scale-105 hover:shadow-2xl"
            >
              🚀 Start Bulk Processing
            </button>
            <p className="text-gray-500 mt-3 text-lg">
              This will analyze ~{Math.ceil(images.length / 3)} items with professional AI
            </p>
          </div>
        )}

        {/* Enhanced Processing Progress */}
        {isProcessing && (
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-gray-100">
            <div className="text-center">
              {/* Progress Ring */}
              <div className="relative inline-flex items-center justify-center mb-6">
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    className="text-gray-200"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 56}`}
                    strokeDashoffset={`${2 * Math.PI * 56 * (1 - getProgressPercentage() / 100)}`}
                    className="text-green-600 transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-4xl mb-2">{getStepIcon(processingStep)}</div>
                    <div className="text-2xl font-bold text-green-600">
                      {getProgressPercentage()}%
                    </div>
                  </div>
                </div>
              </div>

              {/* Status */}
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                🤖 AI Bulk Processing in Progress
              </h3>
              <p className="text-xl text-gray-700 mb-4">
                {processingStatus}
              </p>
              
              {/* Progress Bar */}
              {totalItems > 0 && (
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Progress</span>
                    <span>{currentItem}/{totalItems} items</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-green-500 to-blue-500 h-3 rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${getProgressPercentage()}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Processing Steps */}
              <div className="flex justify-center space-x-6 text-sm">
                <div className={`flex items-center space-x-2 ${processingStep === 'upload' ? 'text-green-600 font-bold' : 'text-gray-400'}`}>
                  <span>📤</span><span>Upload</span>
                </div>
                <div className={`flex items-center space-x-2 ${processingStep === 'grouping' ? 'text-green-600 font-bold' : 'text-gray-400'}`}>
                  <span>📦</span><span>Group</span>
                </div>
                <div className={`flex items-center space-x-2 ${processingStep === 'analyzing' ? 'text-green-600 font-bold' : 'text-gray-400'}`}>
                  <span>🤖</span><span>Analyze</span>
                </div>
                <div className={`flex items-center space-x-2 ${processingStep === 'complete' ? 'text-green-600 font-bold' : 'text-gray-400'}`}>
                  <span>✅</span><span>Complete</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Export Options */}
        {results.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-gray-100">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              📊 Export & Pricing Options
            </h3>
            <div className="flex flex-wrap gap-4 justify-center">
              <button
                onClick={copyAllTitles}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg transition-all transform hover:scale-105"
              >
                📋 Copy All Titles
              </button>
              <button
                onClick={copyCompleteListings}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg transition-all transform hover:scale-105"
              >
                📄 Copy Complete Listings
              </button>
              <button
                onClick={exportCSV}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg transition-all transform hover:scale-105"
              >
                💾 Export CSV
              </button>
              <button
                onClick={handleResearchAllPricing}
                className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg transition-all transform hover:scale-105"
              >
                💰 Research All Pricing
              </button>
            </div>
          </div>
        )}

        {/* Enhanced Results */}
        {results.length > 0 && (
          <div className="space-y-8">
            <h3 className="text-3xl font-bold text-center text-gray-900 mb-8">
              ✅ Generated eBay Listings ({results.length} items)
            </h3>
            
            {results.map((item, index) => (
              <div key={index} className="bg-white rounded-2xl shadow-xl p-8 border-l-6 border-green-500 hover:shadow-2xl transition-all">
                <div className="flex justify-between items-start mb-6">
                  <h4 className="text-2xl font-bold text-gray-900 flex items-center">
                    <span className="mr-3 text-3xl">🏷️</span>
                    Item #{item.item_number}
                  </h4>
                  <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-lg">
                    📸 {item.image_count} images
                  </div>
                </div>

                {/* eBay Title */}
                <div className="mb-6">
                  <label className="block text-lg font-bold text-gray-700 mb-3">
                    🏷️ eBay Title:
                  </label>
                  <div className="text-xl font-semibold text-blue-600 bg-gradient-to-r from-blue-50 to-green-50 p-4 rounded-xl border-2 border-blue-200 hover:border-blue-300 transition-all">
                    {item.title}
                  </div>
                  <button
                    onClick={() => copyToClipboard(item.title)}
                    className="mt-3 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition-all transform hover:scale-105"
                  >
                    📋 Copy Title
                  </button>
                </div>

                {/* Description */}
                <div className="mb-6">
                  <label className="block text-lg font-bold text-gray-700 mb-3">
                    📝 Description:
                  </label>
                  <div className="text-gray-700 bg-gray-50 p-4 rounded-xl border whitespace-pre-line hover:bg-gray-100 transition-all">
                    {item.description}
                  </div>
                  <button
                    onClick={() => copyToClipboard(item.description)}
                    className="mt-3 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition-all transform hover:scale-105"
                  >
                    📋 Copy Description
                  </button>
                </div>

                {/* Item Details */}
                <div className="grid md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <span className="text-sm text-gray-600 block">Brand:</span>
                    <div className="font-bold text-gray-800">{item.brand || 'N/A'}</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <span className="text-sm text-gray-600 block">Type:</span>
                    <div className="font-bold text-gray-800">{item.item_type || 'N/A'}</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <span className="text-sm text-gray-600 block">Size:</span>
                    <div className="font-bold text-gray-800">{item.size || 'N/A'}</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <span className="text-sm text-gray-600 block">Color:</span>
                    <div className="font-bold text-gray-800">{item.colour || 'N/A'}</div>
                  </div>
                </div>

                {/* Pricing Section */}
                <div className="border-t-2 border-gray-100 pt-6">
                  {!pricingData[index] ? (
                    <button
                      onClick={() => handlePriceResearch(item, index)}
                      disabled={researchingPricing[index]}
                      className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                      {researchingPricing[index] ? (
                        <>
                          <span className="inline-block animate-spin mr-2">🔍</span>
                          Researching Price...
                        </>
                      ) : (
                        <>💰 Research UK Pricing</>
                      )}
                    </button>
                  ) : (
                    <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-xl border-2 border-green-200">
                      <h5 className="font-bold text-green-800 text-xl mb-4 flex items-center">
                        <span className="mr-2">💰</span>
                        UK Pricing Analysis
                      </h5>
                      <div className="grid md:grid-cols-2 gap-6 text-sm">
                        <div>
                          <div className="flex justify-between mb-2">
                            <span className="text-gray-600">Suggested Price:</span>
                            <span className="font-bold text-green-600 text-lg">
                              {pricingData[index].recommendations.suggested_price}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Competitive Range:</span>
                            <span className="font-semibold">
                              {pricingData[index].recommendations.competitive_range}
                            </span>
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between mb-2">
                            <span className="text-gray-600">Brand Tier:</span>
                            <span className="font-semibold capitalize bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              {pricingData[index].price_analysis.brand_tier}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Confidence:</span>
                            <span className="font-semibold capitalize">
                              {pricingData[index].price_analysis.confidence}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 p-3 bg-blue-100 rounded-lg text-sm">
                        <div className="font-semibold text-blue-800 mb-1">💡 Strategy:</div>
                        <div className="text-blue-700">{pricingData[index].recommendations.pricing_strategy}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Enhanced Footer */}
        <div className="text-center text-gray-500 text-lg mt-12 py-8">
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <p className="font-semibold">🤖 Powered by Claude AI • Professional Fashion Analysis • UK Market Pricing</p>
            <p className="text-sm mt-2">Fast • Accurate • Professional Results</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BulkProcessing;