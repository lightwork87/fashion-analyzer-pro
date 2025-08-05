'use client'

import { useState, useCallback } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Loader2, Upload, Package, DollarSign, Camera, AlertCircle, Zap, CheckCircle2, Copy, Download, Eye, Sparkles, TrendingUp, ShoppingBag, Tag, Ruler, Award, Info } from 'lucide-react'
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/components/ui/use-toast"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import EbayIntegration from './EbayIntegration'

function AnalysisWorkspace({ user, onTokensUsed }) {
  const [images, setImages] = useState([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResults, setAnalysisResults] = useState(null)
  const [processingStatus, setProcessingStatus] = useState('')
  const [progress, setProgress] = useState(0)
  const [selectedBagNumber, setSelectedBagNumber] = useState('')
  const [customBagNumber, setCustomBagNumber] = useState('')
  const [activeTab, setActiveTab] = useState('upload')
  const { toast } = useToast()

  const handleImageUpload = useCallback((e) => {
    const files = Array.from(e.target.files)
    const validFiles = files.filter(file => {
      const isValid = file.type.startsWith('image/')
      const isUnderLimit = file.size <= 10 * 1024 * 1024 // 10MB limit
      return isValid && isUnderLimit
    })

    if (validFiles.length !== files.length) {
      toast({
        title: "Some files were skipped",
        description: "Only image files under 10MB are accepted",
        variant: "destructive"
      })
    }

    if (images.length + validFiles.length > 24) {
      toast({
        title: "Too many images",
        description: "Maximum 24 images allowed per analysis",
        variant: "destructive"
      })
      return
    }

    const newImages = validFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      name: file.name
    }))

    setImages(prev => [...prev, ...newImages])
  }, [images.length, toast])

  const removeImage = useCallback((index) => {
    setImages(prev => {
      const newImages = [...prev]
      URL.revokeObjectURL(newImages[index].preview)
      newImages.splice(index, 1)
      return newImages
    })
  }, [])

  const startAnalysis = async () => {
    if (images.length === 0) {
      toast({
        title: "No images selected",
        description: "Please upload at least one image to analyze",
        variant: "destructive"
      })
      return
    }

    const bagNumber = selectedBagNumber === 'custom' ? customBagNumber : selectedBagNumber

    setIsAnalyzing(true)
    setProgress(0)
    setActiveTab('results')
    
    const updateStatus = (message) => {
      setProcessingStatus(message)
      console.log(`[${new Date().toLocaleTimeString()}] ${message}`)
    }

    try {
      updateStatus(`Preparing ${images.length} images for analysis...`)
      setProgress(10)

      // Convert images to base64
      const base64Images = await Promise.all(
        images.map(async (img) => {
          const reader = new FileReader()
          return new Promise((resolve) => {
            reader.onloadend = () => resolve(reader.result)
            reader.readAsDataURL(img.file)
          })
        })
      )

      setProgress(30)
      updateStatus('Analyzing fashion items with AI (ruler detection, brand recognition)...')

      // Call the analysis API
      const response = await fetch(`${window.location.origin}/api/analyze-combined`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          images: base64Images,
          bagNumber: bagNumber,
          enhancementLevel: 'premium',
          generateTitle: true,
          generateDescription: true,
          suggestPrice: true,
          analyzeCondition: true,
          detectMeasurements: true,
          brandAuthenticity: true
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Analysis failed: ${response.statusText}`)
      }

      const results = await response.json()
      
      setProgress(90)
      updateStatus('Processing complete! Review your results below.')
      
      setAnalysisResults(results)
      setProgress(100)
      
      // Update tokens
      if (onTokensUsed && results.tokensUsed) {
        onTokensUsed(results.tokensUsed)
      }

      // Success message
      toast({
        title: "Analysis Complete!",
        description: `Successfully analyzed ${images.length} images`,
      })

      // Save to history
      try {
        await fetch('/api/user/analysis-history', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user?.id,
            ...results,
            imageCount: images.length,
            bagNumber: bagNumber
          })
        })
      } catch (error) {
        console.error('Failed to save to history:', error)
      }

    } catch (error) {
      console.error('Analysis error:', error)
      updateStatus(`❌ Analysis failed: ${error.message}`)
      toast({
        title: "Analysis Failed",
        description: error.message || "Please try again",
        variant: "destructive"
      })
    } finally {
      setIsAnalyzing(false)
    }
  }

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied!",
      description: `${type} copied to clipboard`,
    })
  }

  const exportResults = () => {
    if (!analysisResults) return
    
    const dataStr = JSON.stringify(analysisResults, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
    
    const exportFileDefaultName = `fashion-analysis-${new Date().toISOString().split('T')[0]}.json`
    
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-yellow-500" />
            AI Fashion Analysis Workspace
          </CardTitle>
          <CardDescription>
            Upload fashion items for professional analysis with ruler detection and brand verification
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upload" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Upload Images
              </TabsTrigger>
              <TabsTrigger value="results" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Results {analysisResults && <Badge variant="secondary">{images.length}</Badge>}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="space-y-4">
              {/* Bag Number Selection */}
              <div className="space-y-2">
                <Label>Bag Number (Optional)</Label>
                <Select value={selectedBagNumber} onValueChange={setSelectedBagNumber}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a bag number or enter custom" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No bag number</SelectItem>
                    <SelectItem value="001">Bag 001</SelectItem>
                    <SelectItem value="002">Bag 002</SelectItem>
                    <SelectItem value="003">Bag 003</SelectItem>
                    <SelectItem value="004">Bag 004</SelectItem>
                    <SelectItem value="005">Bag 005</SelectItem>
                    <SelectItem value="custom">Custom bag number</SelectItem>
                  </SelectContent>
                </Select>
                
                {selectedBagNumber === 'custom' && (
                  <Textarea
                    placeholder="Enter custom bag number or reference..."
                    value={customBagNumber}
                    onChange={(e) => setCustomBagNumber(e.target.value)}
                    className="h-20"
                  />
                )}
              </div>

              {/* Image Upload Area */}
              <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                  disabled={isAnalyzing}
                />
                <label
                  htmlFor="image-upload"
                  className="cursor-pointer flex flex-col items-center space-y-2"
                >
                  <Camera className="h-12 w-12 text-gray-400" />
                  <div className="space-y-1">
                    <p className="text-lg font-medium">Drop images here or click to upload</p>
                    <p className="text-sm text-gray-500">Support for up to 24 images (max 10MB each)</p>
                  </div>
                  <Button type="button" variant="outline" disabled={isAnalyzing}>
                    Select Images
                  </Button>
                </label>
              </div>

              {/* Image Preview Grid */}
              {images.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Selected Images ({images.length}/24)</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setImages([])}
                      disabled={isAnalyzing}
                    >
                      Clear All
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {images.map((img, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={img.preview}
                          alt={img.name}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <button
                          onClick={() => removeImage(index)}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          disabled={isAnalyzing}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Analyze Button */}
              {images.length > 0 && (
                <Button
                  onClick={startAnalysis}
                  disabled={isAnalyzing}
                  className="w-full"
                  size="lg"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Analyzing {images.length} Images...
                    </>
                  ) : (
                    <>
                      <Zap className="mr-2 h-5 w-5" />
                      Start AI Analysis ({images.length} images = {images.length * 2} tokens)
                    </>
                  )}
                </Button>
              )}
            </TabsContent>

            <TabsContent value="results" className="space-y-4">
              {isAnalyzing && (
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                          <span className="font-medium">AI Processing Status</span>
                        </div>
                        <span className="text-sm text-gray-500">{progress}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                      <p className="text-sm text-gray-600">{processingStatus}</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {analysisResults && !isAnalyzing && (
                <div className="space-y-6">
                  {/* Summary Card */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>Analysis Complete</span>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={exportResults}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Export
                          </Button>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-blue-600">
                            {analysisResults.items?.length || 0}
                          </p>
                          <p className="text-sm text-gray-600">Items Analyzed</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-green-600">
                            £{analysisResults.totalEstimatedValue || 0}
                          </p>
                          <p className="text-sm text-gray-600">Total Value</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-purple-600">
                            {analysisResults.brandsDetected || 0}
                          </p>
                          <p className="text-sm text-gray-600">Brands Found</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-orange-600">
                            {analysisResults.measurementsDetected || 0}
                          </p>
                          <p className="text-sm text-gray-600">With Measurements</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Individual Item Results */}
                  {analysisResults.items?.map((item, index) => (
                    <Card key={index} className="overflow-hidden">
                      <CardHeader className="bg-gray-50">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <CardTitle className="text-xl">{item.title}</CardTitle>
                            <div className="flex flex-wrap gap-2">
                              {item.brand && (
                                <Badge variant="secondary" className="flex items-center gap-1">
                                  <Tag className="h-3 w-3" />
                                  {item.brand}
                                </Badge>
                              )}
                              {item.condition && (
                                <Badge variant={
                                  item.condition === 'EXCELLENT' ? 'default' :
                                  item.condition === 'VERY GOOD' ? 'secondary' :
                                  'outline'
                                }>
                                  {item.condition}
                                </Badge>
                              )}
                              {item.hasMeasurements && (
                                <Badge variant="default" className="flex items-center gap-1">
                                  <Ruler className="h-3 w-3" />
                                  Measurements
                                </Badge>
                              )}
                              {item.authenticityScore && item.authenticityScore > 80 && (
                                <Badge variant="default" className="flex items-center gap-1">
                                  <Award className="h-3 w-3" />
                                  Authentic
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-green-600">
                              £{item.suggestedPrice}
                            </p>
                            <p className="text-sm text-gray-500">Suggested Price</p>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-6">
                        <div className="grid md:grid-cols-2 gap-6">
                          {/* Left Column - Images */}
                          <div>
                            {item.images && item.images.length > 0 && (
                              <div className="grid grid-cols-3 gap-2 mb-4">
                                {item.images.slice(0, 6).map((img, imgIndex) => (
                                  <img
                                    key={imgIndex}
                                    src={img}
                                    alt={`Item ${index + 1} - Image ${imgIndex + 1}`}
                                    className="w-full h-24 object-cover rounded-lg cursor-pointer hover:scale-105 transition-transform"
                                    onClick={() => window.open(img, '_blank')}
                                  />
                                ))}
                              </div>
                            )}
                            
                            {/* eBay Title */}
                            <div className="space-y-2 mb-4">
                              <Label>eBay Title</Label>
                              <div className="flex gap-2">
                                <Textarea
                                  value={item.ebayTitle || item.title}
                                  readOnly
                                  className="flex-1 h-20 resize-none"
                                />
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => copyToClipboard(item.ebayTitle || item.title, 'Title')}
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>

                          {/* Right Column - Details */}
                          <div className="space-y-4">
                            {/* Description */}
                            <div className="space-y-2">
                              <Label>Description</Label>
                              <div className="flex gap-2">
                                <Textarea
                                  value={item.description}
                                  readOnly
                                  className="flex-1 h-32 resize-none"
                                />
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => copyToClipboard(item.description, 'Description')}
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>

                            {/* Key Details */}
                            <div className="grid grid-cols-2 gap-4">
                              {item.size && (
                                <div>
                                  <Label className="text-gray-600">Size</Label>
                                  <p className="font-medium">{item.size}</p>
                                </div>
                              )}
                              {item.material && (
                                <div>
                                  <Label className="text-gray-600">Material</Label>
                                  <p className="font-medium">{item.material}</p>
                                </div>
                              )}
                              {item.color && (
                                <div>
                                  <Label className="text-gray-600">Color</Label>
                                  <p className="font-medium">{item.color}</p>
                                </div>
                              )}
                              {item.priceRange && (
                                <div>
                                  <Label className="text-gray-600">Market Range</Label>
                                  <p className="font-medium">{item.priceRange}</p>
                                </div>
                              )}
                            </div>

                            {/* Measurements if available */}
                            {item.measurements && (
                              <Alert>
                                <Ruler className="h-4 w-4" />
                                <AlertDescription>
                                  <strong>Measurements Detected:</strong><br />
                                  {item.measurements}
                                </AlertDescription>
                              </Alert>
                            )}

                            {/* eBay Integration */}
                            <EbayIntegration
                              analysisResult={item}
                              onListingCreated={(listingId) => {
                                toast({
                                  title: "Listing Created!",
                                  description: `Successfully created eBay listing: ${listingId}`,
                                })
                              }}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {!analysisResults && !isAnalyzing && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Upload images and start analysis to see results here
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

export default AnalysisWorkspace