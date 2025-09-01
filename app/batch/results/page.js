'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Download, Eye, Edit } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

function BatchResults() {
    const router = useRouter();
    const [results, setResults] = useState([]);
    const [selectedItems, setSelectedItems] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchResults();
    }, []);

    const fetchResults = async () => {
        try {
            // Mock data for now
            const mockResults = [
                {
                    id: 1,
                    title: 'Women\'s Blue Dress',
                    category: 'Dresses',
                    price: '£25.00',
                    image: '/placeholder-image.jpg',
                    status: 'ready'
                },
                {
                    id: 2,
                    title: 'Men\'s Black Jacket',
                    category: 'Jackets',
                    price: '£45.00',
                    image: '/placeholder-image.jpg',
                    status: 'ready'
                }
            ];
            setResults(mockResults);
        } catch (error) {
            console.error('Error fetching results:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleSelection = (itemId) => {
        setSelectedItems(prev => 
            prev.includes(itemId) 
                ? prev.filter(id => id !== itemId)
                : [...prev, itemId]
        );
    };

    const exportSelected = () => {
        console.log('Exporting items:', selectedItems);
        // Implementation for export functionality
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-6xl mx-auto">
                <div className="bg-white rounded-lg shadow">
                    <div className="p-6 border-b">
                        <div className="flex justify-between items-center">
                            <h1 className="text-2xl font-bold">Batch Processing Results</h1>
                            <div className="flex gap-3">
                                <button
                                    onClick={exportSelected}
                                    disabled={selectedItems.length === 0}
                                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 inline-flex items-center gap-2"
                                >
                                    <Download className="h-4 w-4" />
                                    Export Selected ({selectedItems.length})
                                </button>
                                <Link
                                    href="/batch"
                                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                                >
                                    Process More
                                </Link>
                            </div>
                        </div>
                    </div>

                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {results.map((item) => (
                                <div key={item.id} className="border rounded-lg overflow-hidden">
                                    <div className="aspect-square bg-gray-100 flex items-center justify-center">
                                        <Image
                                            src={item.image}
                                            alt={item.title}
                                            width={300}
                                            height={300}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    
                                    <div className="p-4">
                                        <div className="flex items-start justify-between mb-2">
                                            <input
                                                type="checkbox"
                                                checked={selectedItems.includes(item.id)}
                                                onChange={() => toggleSelection(item.id)}
                                                className="mt-1"
                                            />
                                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                                                {item.status}
                                            </span>
                                        </div>
                                        
                                        <h3 className="font-semibold text-sm mb-1">{item.title}</h3>
                                        <p className="text-xs text-gray-600 mb-2">{item.category}</p>
                                        <p className="text-lg font-bold text-green-600 mb-3">{item.price}</p>
                                        
                                        <div className="flex gap-2">
                                            <Link
                                                href={`/batch/item/${item.id}`}
                                                className="flex-1 bg-blue-100 text-blue-700 px-3 py-2 rounded text-xs hover:bg-blue-200 inline-flex items-center justify-center gap-1"
                                            >
                                                <Eye className="h-3 w-3" />
                                                View
                                            </Link>
                                            <button className="flex-1 bg-gray-100 text-gray-700 px-3 py-2 rounded text-xs hover:bg-gray-200 inline-flex items-center justify-center gap-1">
                                                <Edit className="h-3 w-3" />
                                                Edit
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default BatchResults;