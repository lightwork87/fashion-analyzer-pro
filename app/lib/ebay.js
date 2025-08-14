// eBay API Configuration
export const EBAY_CONFIG = {
  // Production endpoints
  PRODUCTION: {
    authUrl: 'https://auth.ebay.com/oauth2/authorize',
    tokenUrl: 'https://api.ebay.com/identity/v1/oauth2/token',
    apiUrl: 'https://api.ebay.com',
    redirectUri: process.env.NEXT_PUBLIC_BASE_URL + '/api/ebay/callback'
  },
  // Sandbox endpoints for testing
  SANDBOX: {
    authUrl: 'https://auth.sandbox.ebay.com/oauth2/authorize',
    tokenUrl: 'https://api.sandbox.ebay.com/identity/v1/oauth2/token',
    apiUrl: 'https://api.sandbox.ebay.com',
    redirectUri: process.env.NEXT_PUBLIC_BASE_URL + '/api/ebay/callback'
  }
};

// Use production or sandbox based on environment
export const EBAY_ENV = process.env.EBAY_ENVIRONMENT === 'PRODUCTION' ? 'PRODUCTION' : 'SANDBOX';
export const EBAY_ENDPOINTS = EBAY_CONFIG[EBAY_ENV];

// Scopes needed for listing
export const EBAY_SCOPES = [
  'https://api.ebay.com/oauth/api_scope',
  'https://api.ebay.com/oauth/api_scope/sell.inventory',
  'https://api.ebay.com/oauth/api_scope/sell.marketing',
  'https://api.ebay.com/oauth/api_scope/sell.account',
  'https://api.ebay.com/oauth/api_scope/sell.fulfillment'
];

// Map our categories to eBay category IDs
export const EBAY_CATEGORIES = {
  'dress': '63861',      // Women's Dresses
  'top': '53159',        // Women's Tops
  'jeans': '11554',      // Women's Jeans
  'shoes': '3034',       // Women's Shoes
  'bag': '63852',        // Women's Bags
  'jacket': '63862',     // Women's Coats & Jackets
  'skirt': '63864',      // Women's Skirts
  'default': '15724'     // Women's Clothing (general)
};

// Map our conditions to eBay condition IDs
export const EBAY_CONDITIONS = {
  'New with tags': 1000,
  'New without tags': 1500,
  'New with defects': 1750,
  'Excellent': 3000,
  'Very Good': 3000,
  'Good': 3000,
  'Fair': 7000,
  'Poor': 7000
};

// Convert our listing to eBay format
export function convertToEbayListing(listing) {
  const conditionId = EBAY_CONDITIONS[listing.condition] || 3000;
  const categoryId = EBAY_CATEGORIES[listing.category?.toLowerCase()] || EBAY_CATEGORIES.default;
  
  return {
    product: {
      title: listing.title.substring(0, 80), // eBay title limit
      description: listing.description || '',
      aspects: {
        Brand: [listing.brand || 'Unbranded'],
        Size: [listing.size || 'One Size'],
        'Size Type': [listing.sizeType || 'Regular'],
        Colour: [listing.color || 'Multicoloured'],
        Style: [listing.style || 'Casual'],
        Material: [listing.material || 'Mixed Materials']
      },
      imageUrls: listing.images?.map(img => img.url || img.preview) || []
    },
    condition: conditionId,
    conditionDescription: listing.conditionNotes || '',
    availability: {
      shipToLocationAvailability: {
        quantity: 1
      }
    },
    pricingSummary: {
      price: {
        value: listing.price || '0.00',
        currency: 'GBP'
      }
    },
    listingPolicies: {
      fulfillmentPolicyId: listing.shippingPolicyId,
      paymentPolicyId: listing.paymentPolicyId,
      returnPolicyId: listing.returnPolicyId
    }
  };
}