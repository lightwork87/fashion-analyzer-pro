'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Image as ImageIcon, AlertCircle, Loader2, CheckCircle2, Package, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';

// More aggressive compression function
async function ultraCompressImage(file, maxSizeKB = 200) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        let quality = 0.7;
        let width = img.width;
        let height = img.height;
        let compressed = null;
        
        // Start with reasonable dimensions
        const maxDimension = 1000;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }
        
        // Try progressively lower quality until we meet size requirement
        const attemptCompression = () => {
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          compressed = canvas.toDataURL('image/jpeg', quality);
          const sizeKB = (compressed.length * 0.75) / 1024;
          
          console.log(`Compression attempt: ${width}x${height}, quality: ${quality}, size: ${sizeKB.toFixed(1)}KB`);
          
          if (sizeKB > maxSizeKB && quality > 0.1) {
            quality -= 0.1;
            if (quality > 0.3 && sizeKB > maxSizeKB * 2) {
              // If way too large, reduce dimensions too
              width = Math.round(width * 0.8);
              height = Math.round(height * 0.8);
            }
            attemptCompression();
          } else {
            resolve(compressed);
          }
        };
        
        attemptCompression();
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target.result;
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

export default function AnalysisWorkspace() {
  const [images, setImages] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
  const [selectedItems, setSelectedItems] = useState([]);
  const [bagNumber, setBagNumber] = useState('');
  const { toast } = useToast();
  
  // Manual override states
  const [manualSize, setManualSize] = useState({});
  const [manualGender, setManualGender] = useState({});

  const onDrop = useCallback(async (acceptedFiles) => {
    setError(null);
    const imageFiles = acceptedFiles.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length === 0) {
      setError('Please upload only image files');
      return;
    }

    // Check total size before compression
    const totalSizeMB = imageFiles.reduce((sum, file) => sum + file.size, 0) / (1024 * 1024);
    console.log(`Total size before compression: ${totalSizeMB.toFixed(2)}MB for ${imageFiles.length} images`);

    try {
      setProgress(10);
      
      // Compress images aggressively
      const compressedImages = [];
      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];
        console.log(`Compressing image ${i + 1}/${imageFiles.length}: ${file.name} (${(file.size / 1024).toFixed(1)}KB)`);
        
        try {
          const compressed = await ultraCompressImage(file, 150); // Max 150KB per image
          compressedImages.push({
            id: `${Date.now()}-${i}`,
            name: file.name,
            data: compressed,
            preview: compressed
          });
          
          setProgress(10 + (30 * (i + 1) / imageFiles.length));
        } catch (err) {
          console.error(`Failed to compress ${file.name}:`, err);
          toast({
            title: "Compression Warning",
            description: `Failed to compress ${file.name}. Skipping this image.`,
            variant: "destructive"
          });
        }
      }
      
      // Check compressed size
      const compressedSizeMB = compressedImages.reduce((sum, img) => sum + (img.data.length * 0.75), 0) / (1024 * 1024);
      console.log(`Total size after compression: ${compressedSizeMB.toFixed(2)}MB`);
      
      if (compressedSizeMB > 3) {
        toast({
          title: "Images Too Large",
          description: `Please use fewer images or smaller file sizes. Total compressed size: ${compressedSizeMB.toFixed(1)}MB (max: 3MB)`,
          variant: "destructive"
        });
        setProgress(0);
        return;
      }
      
      setImages(prev => [...prev, ...compressedImages]);
      setProgress(0);
      
      toast({
        title: "Images uploaded",
        description: `${compressedImages.length} images ready for analysis (${compressedSizeMB.toFixed(1)}MB total)`,
      });
      
    } catch (err) {
      console.error('Upload error:', err);
      setError('Failed to process images. Please try again.');
      setProgress(0);
    }
  }, [toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp']
    },
    maxSize: 10485760, // 10MB per file
  });

  const removeImage = (id) => {
    setImages(images.filter(img => img.id !== id));
  };

  const analyzeImages = async () => {
    if (images.length === 0) {
      setError('Please upload at least one image');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setProgress(0);

    try {
      // Create payload with manual overrides
      const payload = {
        images: images.map(img => img.data),
        bagNumber: bagNumber || `BAG-${Date.now()}`,
        manualOverrides: {
          size: manualSize,
          gender: manualGender
        }
      };

      // Check payload size
      const payloadSize = JSON.stringify(payload).length / (1024 * 1024);
      console.log(`API payload size: ${payloadSize.toFixed(2)}MB`);

      if (payloadSize > 4) {
        throw new Error(`Payload too large (${payloadSize.toFixed(1)}MB). Please use fewer images.`);
      }

      setProgress(50);

      const response = await fetch('/api/analyze-ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      setProgress(80);

      const responseText = await response.text();
      console.log('Response status:', response.status);
      console.log('Response text preview:', responseText.substring(0, 200));

      if (!response.ok) {
        throw new Error(responseText || `Server error: ${response.status}`);
      }

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error('JSON parse error:', e);
        throw new Error('Invalid response from server');
      }

      if (!data.success && data.error) {
        throw new Error(data.error);
      }

      setAnalysisResults(data);
      setSelectedItems(data.items?.map(item => item.id) || []);
      setProgress(100);

      toast({
        title: "Analysis complete!",
        description: `${data.items?.length || 0} items analyzed successfully`,
      });

    } catch (error) {
      console.error('Analysis error:', error);
      setError(error.message || 'Analysis failed. Please try again.');
      toast({
        title: "Analysis failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
      setTimeout(() => setProgress(0), 1000);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-black">Analysis Workspace</h1>
          <p className="text-gray-600 mt-1">Upload images to analyze and create eBay listings</p>
        </div>
        <Badge variant="secondary" className="text-lg px-4 py-2">
          {images.length} image{images.length !== 1 ? 's' : ''} uploaded
        </Badge>
      </div>

      {/* Bag Number Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-black">
            <Package className="h-5 w-5" />
            Bag Identification
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="bagNumber" className="text-black">Bag Number (Optional)</Label>
              <input
                id="bagNumber"
                type="text"
                placeholder="e.g., BAG-001, Spring Collection"
                value={bagNumber}
                onChange={(e) => setBagNumber(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upload Area */}
      <Card>
        <CardContent className="p-6">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
              ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
              ${isAnalyzing ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <input {...getInputProps()} disabled={isAnalyzing} />
            <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            {isDragActive ? (
              <p className="text-lg text-blue-600">Drop the images here...</p>
            ) : (
              <>
                <p className="text-lg text-gray-600">Drag & drop images here, or click to select</p>
                <p className="text-sm text-gray-500 mt-2">Supports PNG, JPG, JPEG, GIF, WebP (max 10MB each)</p>
                <p className="text-xs text-gray-400 mt-1">Images will be compressed automatically</p>
              </>
            )}
          </div>

          {/* Progress Bar */}
          {progress > 0 && (
            <div className="mt-4">
              <Progress value={progress} className="h-2" />
              <p className="text-sm text-gray-600 mt-1 text-center">
                {progress < 40 ? 'Compressing images...' : 
                 progress < 80 ? 'Analyzing...' : 
                 'Finalizing...'}
              </p>
            </div>
          )}

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Image Preview Grid */}
      {images.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-black">Uploaded Images</CardTitle>
            <CardDescription>Review your images before analysis</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {images.map((image) => (
                <div key={image.id} className="relative group">
                  <img
                    src={image.preview}
                    alt={image.name}
                    className="w-full h-24 object-cover rounded-lg"
                  />
                  <button
                    onClick={() => removeImage(image.id)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 rounded-b-lg truncate">
                    {image.name}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-between items-center">
              <Button
                variant="outline"
                onClick={() => setImages([])}
                disabled={isAnalyzing}
              >
                Clear All
              </Button>
              <Button
                onClick={analyzeImages}
                disabled={isAnalyzing || images.length === 0}
                size="lg"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <ImageIcon className="mr-2 h-4 w-4" />
                    Analyze {images.length} Image{images.length !== 1 ? 's' : ''}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analysis Results */}
      {analysisResults && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-black">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Analysis Complete
            </CardTitle>
            <CardDescription>
              {analysisResults.items?.length || 0} items analyzed • 
              Total value: £{analysisResults.summary?.totalEstimatedValue || 0} • 
              Tokens used: {analysisResults.tokensUsed || 0}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="0" className="w-full">
              <TabsList className="grid grid-cols-5 w-full">
                {analysisResults.items?.slice(0, 5).map((_, index) => (
                  <TabsTrigger key={index} value={index.toString()}>
                    Item {index + 1}
                  </TabsTrigger>
                ))}
              </TabsList>
              
              {analysisResults.items?.map((item, index) => (
                <TabsContent key={index} value={index.toString()} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-semibold mb-3 text-black">Item Details</h3>
                      <div className="space-y-3">
                        <div>
                          <Label className="text-black">SKU</Label>
                          <p className="text-sm font-mono bg-gray-100 p-2 rounded text-black">{item.sku}</p>
                        </div>
                        <div>
                          <Label className="text-black">Title</Label>
                          <p className="text-sm text-black">{item.title}</p>
                        </div>
                        <div>
                          <Label className="text-black">eBay Title</Label>
                          <p className="text-sm text-black font-medium">{item.ebayTitle}</p>
                          <p className="text-xs text-gray-500 mt-1">{item.ebayTitle.length}/80 characters</p>
                        </div>
                        <div>
                          <Label className="text-black">Brand</Label>
                          <div className="flex items-center gap-2">
                            <p className="text-sm text-black font-medium">{item.brand}</p>
                            <Badge variant={item.brandTier === 'luxury' ? 'default' : 'secondary'}>
                              {item.brandTier}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              ({Math.round(item.brandConfidence * 100)}% confidence)
                            </span>
                          </div>
                        </div>
                        <div>
                          <Label className="text-black">Condition</Label>
                          <div className="flex items-center gap-2">
                            <Badge variant={item.condition === 'NEW' ? 'default' : 
                                          item.condition === 'EXCELLENT' ? 'default' : 'secondary'}>
                              {item.condition}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              ({Math.round(item.conditionConfidence * 100)}% confidence)
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 mt-1">{item.conditionDescription}</p>
                        </div>
                        <div>
                          <Label className="text-black">Keywords</Label>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {item.keywords?.slice(0, 5).map((keyword, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {keyword}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="font-semibold mb-3 text-black">Pricing & Manual Overrides</h3>
                      <div className="space-y-3">
                        <div>
                          <Label className="text-black">Suggested Price</Label>
                          <p className="text-2xl font-bold text-green-600">£{item.suggestedPrice}</p>
                          <p className="text-sm text-gray-500">
                            Range: £{item.priceRange?.min || 0} - £{item.priceRange?.max || 0}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Market Demand: {item.aiInsights?.marketDemand}
                          </p>
                        </div>
                        
                        {/* Manual Size Override */}
                        <div>
                          <Label htmlFor={`size-${index}`} className="text-black">Size Override</Label>
                          <Select
                            value={manualSize[index] || item.size}
                            onValueChange={(value) => {
                              setManualSize(prev => ({ ...prev, [index]: value }));
                            }}
                          >
                            <SelectTrigger id={`size-${index}`} className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="XS">XS</SelectItem>
                              <SelectItem value="S">S</SelectItem>
                              <SelectItem value="M">M</SelectItem>
                              <SelectItem value="L">L</SelectItem>
                              <SelectItem value="XL">XL</SelectItem>
                              <SelectItem value="XXL">XXL</SelectItem>
                              <SelectItem value="One Size">One Size</SelectItem>
                              <SelectItem value="Custom">Custom</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        {/* Manual Gender Override */}
                        <div>
                          <Label htmlFor={`gender-${index}`} className="text-black">Gender Override</Label>
                          <Select
                            value={manualGender[index] || item.gender}
                            onValueChange={(value) => {
                              setManualGender(prev => ({ ...prev, [index]: value }));
                            }}
                          >
                            <SelectTrigger id={`gender-${index}`} className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="womens">Women's</SelectItem>
                              <SelectItem value="mens">Men's</SelectItem>
                              <SelectItem value="unisex">Unisex</SelectItem>
                              <SelectItem value="girls">Girls</SelectItem>
                              <SelectItem value="boys">Boys</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label className="text-black">Color</Label>
                          <p className="text-sm text-black">{item.color || 'Multi'}</p>
                        </div>
                        
                        <div>
                          <Label className="text-black">Material</Label>
                          <p className="text-sm text-black">{item.material || 'Mixed Materials'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-black">Description</Label>
                    <Textarea
                      value={item.description}
                      readOnly
                      className="min-h-[120px] mt-1 text-black"
                    />
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(item.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedItems([...selectedItems, item.id]);
                        } else {
                          setSelectedItems(selectedItems.filter(id => id !== item.id));
                        }
                      }}
                      className="h-4 w-4"
                    />
                    <Label className="cursor-pointer text-black">Include in eBay listing</Label>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
            
            <div className="mt-6 flex justify-end">
              <Button 
                size="lg"
                disabled={selectedItems.length === 0}
                onClick={() => {
                  toast({
                    title: "Ready for eBay",
                    description: `${selectedItems.length} items selected for listing`,
                  });
                }}
              >
                Create eBay Listings ({selectedItems.length} items)
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}