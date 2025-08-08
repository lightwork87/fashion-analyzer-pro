import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

// Credit-based subscription plans
export const PLANS = {
  free: {
    name: 'Free Trial',
    credits: 10, // 10 free credits to start
    price: 0,
    priceId: null,
    perCreditCost: 0,
    description: 'Try Fashion Analyzer Pro'
  },
  starter: {
    name: 'Starter',
    credits: 150,
    price: 29,
    priceId: process.env.STRIPE_STARTER_PRICE_ID,
    perCreditCost: 0.19,
    description: 'Perfect for casual sellers',
    color: 'gray'
  },
  professional: {
    name: 'Professional',
    credits: 450,
    price: 69,
    priceId: process.env.STRIPE_PROFESSIONAL_PRICE_ID,
    perCreditCost: 0.15,
    description: 'For serious resellers',
    popular: true,
    savings: 'Save 20%',
    color: 'blue'
  },
  business: {
    name: 'Business',
    credits: 750,
    price: 99,
    priceId: process.env.STRIPE_BUSINESS_PRICE_ID,
    perCreditCost: 0.13,
    description: 'For high-volume operations',
    savings: 'Save 30%',
    color: 'purple'
  }
};

// One-time credit purchases
export const CREDIT_PACKS = {
  small: {
    name: 'Quick Top-up',
    credits: 100,
    price: 25,
    priceId: process.env.STRIPE_CREDIT_PACK_100_PRICE_ID,
    perCreditCost: 0.25,
    description: 'Emergency credits when you need them'
  }
};

// Calculate credits needed for analysis
export function calculateCreditsNeeded(imageCount) {
  return imageCount; // 1 credit per image
}

// Check if user has enough credits
export function canUserAnalyze(user, imageCount) {
  if (!user) return false;
  const creditsNeeded = calculateCreditsNeeded(imageCount);
  const totalCredits = (user.credits_total || 0) + (user.bonus_credits || 0);
  const creditsRemaining = totalCredits - (user.credits_used || 0);
  return creditsRemaining >= creditsNeeded;
}

// Format credit usage for display
export function formatCreditsDisplay(used, total) {
  const percentage = total > 0 ? (used / total) * 100 : 0;
  const remaining = Math.max(0, total - used);
  
  return {
    used,
    total,
    remaining,
    percentage: Math.round(percentage),
    lowCredits: remaining < 20 && remaining > 0,
    outOfCredits: remaining === 0
  };
}

// Get plan details from Stripe price ID
export function getPlanFromPriceId(priceId) {
  for (const [key, plan] of Object.entries(PLANS)) {
    if (plan.priceId === priceId) {
      return { key, ...plan };
    }
  }
  return null;
}

// Get credit pack from price ID
export function getCreditPackFromPriceId(priceId) {
  for (const [key, pack] of Object.entries(CREDIT_PACKS)) {
    if (pack.priceId === priceId) {
      return { key, ...pack };
    }
  }
  return null;
}