'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, Check } from 'lucide-react';

function BetaSignupPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        name: '',
        company: '',
        useCase: ''
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        
        try {
            // Mock signup process
            await new Promise(resolve => setTimeout(resolve, 2000));
            setSuccess(true);
        } catch (error) {
            console.error('Signup error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    if (success) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
                <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Check className="h-8 w-8 text-green-600" />
                    </div>
                    <h1 className="text-2xl font-bold mb-4">Welcome to the Beta!</h1>
                    <p className="text-gray-600 mb-6">
                        Thank you for signing up. We'll be in touch soon with your beta access.
                    </p>
                    <Link
                        href="/"
                        className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 inline-block"
                    >
                        Return Home
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-2xl mx-auto">
                <Link
                    href="/"
                    className="inline-flex items-center text-blue-600 hover:underline mb-6"
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Home
                </Link>

                <div className="bg-white rounded-lg shadow p-8">
                    <h1 className="text-3xl font-bold mb-6">Join the Beta Program</h1>
                    <p className="text-gray-600 mb-8">
                        Get early access to our advanced fashion analysis tools and help shape the future of AI-powered listing creation.
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Email Address *
                            </label>
                            <input
                                type="email"
                                name="email"
                                required
                                value={formData.email}
                                onChange={handleChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="your@email.com"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Full Name *
                            </label>
                            <input
                                type="text"
                                name="name"
                                required
                                value={formData.name}
                                onChange={handleChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Your name"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Company/Organization
                            </label>
                            <input
                                type="text"
                                name="company"
                                value={formData.company}
                                onChange={handleChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Your company (optional)"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                What will you use this for? *
                            </label>
                            <textarea
                                name="useCase"
                                required
                                value={formData.useCase}
                                onChange={handleChange}
                                rows={4}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Tell us about your use case..."
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    Submitting...
                                </>
                            ) : (
                                'Join Beta Program'
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default BetaSignupPage;