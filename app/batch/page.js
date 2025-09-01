'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { useUserData } from '../hooks/useUserData';
import { Upload, FileImage, Loader2, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

function BatchProcessing() {
    const router = useRouter();
    const { user: clerkUser, isLoaded } = useUser();
    const { user, loading: userLoading } = useUserData();
    const [files, setFiles] = useState([]);
    const [processing, setProcessing] = useState(false);
    const [results, setResults] = useState([]);

    const handleFileUpload = (event) => {
        const selectedFiles = Array.from(event.target.files);
        setFiles(selectedFiles);
    };

    const processFiles = async () => {
        if (files.length === 0) return;
        
        setProcessing(true);
        try {
            // Mock processing for now
            const mockResults = files.map((file, index) => ({
                id: index,
                filename: file.name,
                title: `Fashion Item ${index + 1}`,
                category: 'Clothing',
                status: 'processed'
            }));
            
            setResults(mockResults);
        } catch (error) {
            console.error('Processing error:', error);
        } finally {
            setProcessing(false);
        }
    };

    if (!isLoaded || userLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!clerkUser) {
        router.push('/');
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-lg shadow p-8">
                    <h1 className="text-3xl font-bold mb-6">Batch Processing</h1>
                    
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center mb-6">
                        <FileImage className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold mb-2">Upload Multiple Images</h3>
                        <p className="text-gray-600 mb-4">Upload up to 25 items with 24 photos each</p>
                        
                        <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={handleFileUpload}
                            className="hidden"
                            id="file-upload"
                        />
                        <label
                            htmlFor="file-upload"
                            className="bg-blue-600 text-white px-6 py-3 rounded-lg cursor-pointer hover:bg-blue-700 inline-flex items-center gap-2"
                        >
                            <Upload className="h-5 w-5" />
                            Choose Files
                        </label>
                    </div>

                    {files.length > 0 && (
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold mb-4">Selected Files ({files.length})</h3>
                            <div className="grid grid-cols-4 gap-4">
                                {files.slice(0, 8).map((file, index) => (
                                    <div key={index} className="bg-gray-100 rounded-lg p-2 text-center">
                                        <div className="aspect-square bg-gray-200 rounded mb-2 flex items-center justify-center">
                                            <FileImage className="h-8 w-8 text-gray-400" />
                                        </div>
                                        <p className="text-xs truncate">{file.name}</p>
                                    </div>
                                ))}
                                {files.length > 8 && (
                                    <div className="bg-gray-100 rounded-lg p-2 text-center flex items-center justify-center">
                                        <span className="text-sm text-gray-600">+{files.length - 8} more</span>
                                    </div>
                                )}
                            </div>
                            
                            <button
                                onClick={processFiles}
                                disabled={processing}
                                className="mt-4 bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 disabled:bg-gray-400 inline-flex items-center gap-2"
                            >
                                {processing ? (
                                    <>
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <Upload className="h-5 w-5" />
                                        Start Processing
                                    </>
                                )}
                            </button>
                        </div>
                    )}

                    {results.length > 0 && (
                        <div>
                            <h3 className="text-lg font-semibold mb-4">Processing Results</h3>
                            <div className="space-y-3">
                                {results.map((result) => (
                                    <div key={result.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                                        <div>
                                            <p className="font-medium">{result.title}</p>
                                            <p className="text-sm text-gray-600">{result.filename}</p>
                                        </div>
                                        <span className="text-green-600 font-medium">Processed</span>
                                    </div>
                                ))}
                            </div>
                            
                            <Link
                                href="/batch/results"
                                className="mt-4 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 inline-block"
                            >
                                View All Results
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default BatchProcessing;