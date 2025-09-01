'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

function BatchItemDetail() {
    const params = useParams();
    const router = useRouter();
    const [item, setItem] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (params.id) {
            // Fetch item details
            fetchItemDetails(params.id);
        }
    }, [params.id]);

    const fetchItemDetails = async (itemId) => {
        try {
            setLoading(true);
            // Mock data for now
            const mockItem = {
                id: itemId,
                title: 'Fashion Item',
                description: 'Item description',
                images: ['/placeholder-image.jpg'],
                price: '£25.00'
            };
            setItem(mockItem);
        } catch (error) {
            console.error('Error fetching item:', error);
        } finally {
            setLoading(false);
        }
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
            <div className="max-w-4xl mx-auto">
                <Link href="/batch" className="text-blue-600 hover:underline mb-6 inline-block">
                    ← Back to Batch Processing
                </Link>
                
                {item ? (
                    <div className="bg-white rounded-lg shadow p-6">
                        <h1 className="text-2xl font-bold mb-4">{item.title}</h1>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <Image
                                    src={item.images[0]}
                                    alt={item.title}
                                    width={400}
                                    height={400}
                                    className="w-full h-auto rounded-lg"
                                />
                            </div>
                            <div>
                                <p className="text-gray-600 mb-4">{item.description}</p>
                                <p className="text-2xl font-bold text-green-600">{item.price}</p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="text-center">
                        <p>Item not found</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default BatchItemDetail;