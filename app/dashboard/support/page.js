'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { 
  MessageCircle, 
  Mail, 
  Book, 
  HelpCircle,
  Send,
  CheckCircle
} from 'lucide-react';

export default function SupportPage() {
  const { user } = useUser();
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    // TODO: Implement support ticket submission
    console.log('Support message:', message);
    setSubmitted(true);
    setTimeout(() => {
      setMessage('');
      setSubmitted(false);
    }, 3000);
  };

  const faqs = [
    {
      question: 'How do I analyze an item?',
      answer: 'Simply upload a photo of your fashion item, and our AI will automatically analyze it, providing details about the brand, condition, and suggested pricing.'
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept all major credit cards, debit cards, and PayPal through our secure payment processor Stripe.'
    },
    {
      question: 'Can I cancel my subscription?',
      answer: 'Yes, you can cancel your subscription at any time from your account settings. You\'ll continue to have access until the end of your billing period.'
    },
    {
      question: 'How accurate is the AI analysis?',
      answer: 'Our AI has been trained on millions of fashion items and achieves over 90% accuracy in identifying brands and conditions.'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Support Center</h1>
          <p className="text-gray-600 mt-2">
            Get help with Fashion Analyzer Pro
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <MessageCircle className="h-5 w-5 mr-2 text-blue-600" />
                Contact Support
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={user?.emailAddresses?.[0]?.emailAddress || ''}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subject
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                    <option>Technical Issue</option>
                    <option>Billing Question</option>
                    <option>Feature Request</option>
                    <option>Other</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Message
                  </label>
                  <textarea
                    rows={6}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Describe your issue or question..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                
                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition flex items-center justify-center"
                >
                  {submitted ? (
                    <>
                      <CheckCircle className="h-5 w-5 mr-2" />
                      Sent!
                    </>
                  ) : (
                    <>
                      <Send className="h-5 w-5 mr-2" />
                      Send Message
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* FAQs */}
            <div className="bg-white rounded-lg shadow-md p-6 mt-8">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <HelpCircle className="h-5 w-5 mr-2 text-blue-600" />
                Frequently Asked Questions
              </h2>
              
              <div className="space-y-4">
                {faqs.map((faq, index) => (
                  <details key={index} className="group">
                    <summary className="cursor-pointer font-medium text-gray-900 hover:text-blue-600">
                      {faq.question}
                    </summary>
                    <p className="mt-2 text-gray-600 pl-4">
                      {faq.answer}
                    </p>
                  </details>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              
              <div className="space-y-3">
                <a href="/dashboard/tutorial" className="flex items-center text-gray-700 hover:text-blue-600">
                  <Book className="h-5 w-5 mr-2" />
                  Getting Started Guide
                </a>
                
                <a href="mailto:support@fashionanalyzerpro.com" className="flex items-center text-gray-700 hover:text-blue-600">
                  <Mail className="h-5 w-5 mr-2" />
                  support@fashionanalyzerpro.com
                </a>
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-6 mt-6">
              <h3 className="text-lg font-semibold mb-2">Need Immediate Help?</h3>
              <p className="text-gray-700 text-sm mb-4">
                Our support team typically responds within 24 hours.
              </p>
              <p className="text-sm text-gray-600">
                Business hours: Mon-Fri, 9AM-5PM EST
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}