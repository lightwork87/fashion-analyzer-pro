'use client';

import { useState } from 'react';
import Link from 'next/link';

function BulkProcessing() {
    const [images, setImages] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [results, setResults] = useState([]);

    const handleImageUpload = (event) => {
        const files = Array.from(event.target.files);
        setImages(files);
    };

    const processImages = async () => {
        setIsProcessing(true);
        try {
            // Mock processing
            await new Promise(resolve => setTimeout(resolve, 3000));
            const mockResults = images.map((img, index) => ({
                id: index,
                name: img.name,
                status: 'processed'
            }));
            setResults(mockResults);
        } catch (error) {
            console.error('Processing error:', error);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-lg shadow p-8">
                    <h1 className="text-3xl font-bold mb-6">Bulk Processing</h1>
                    
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center mb-6">
                        <h3 className="text-xl font-semibold mb-4">Upload Images for Bulk Processing</h3>
                        <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="mb-4"
                        />
                        <p className="text-gray-600">
                            Select multiple images to process at once
                        </p>
                    </div>

                    {images.length > 0 && (
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold mb-4">
                                Selected Images: {images.length}
                            </h3>
                            <button
                                onClick={processImages}
                                disabled={isProcessing}
                                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                            >
                                {isProcessing ? 'Processing...' : 'Start Processing'}
                            </button>
                        </div>
                    )}

                    {results.length > 0 && (
                        <div>
                            <h3 className="text-lg font-semibold mb-4">Results</h3>
                            <div className="space-y-2">
                                {results.map((result) => (
                                    <div key={result.id} className="p-3 bg-green-50 rounded-lg">
                                        <span className="font-medium">{result.name}</span>
                                        <span className="text-green-600 ml-2">✓ {result.status}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default BulkProcessing;