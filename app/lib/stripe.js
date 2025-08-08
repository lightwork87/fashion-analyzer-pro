// Credit-based pricing calculations
export function calculateCreditsNeeded(imageCount) {
  // 1 credit per listing, regardless of photo count
  return 1;
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

// Credit-based subscription plans
export const PLANS = {
  free: {
    name: 'Free Trial',
    credits: 10,
    price: 0,
    priceId: null,
    perCreditCost: 0,
    description: 'Try Fashion Analyzer Pro'
  },
  starter: {
    name: 'Starter',
    credits: 150,
    price: 29,
    priceId: 'price_1RtoYQPeSETpTi7Nlzhu1KyO',
    perCreditCost: 0.19,
    description: 'Perfect for casual sellers',
    color: 'gray'
  },
  professional: {
    name: 'Professional',
    credits: 450,
    price: 69,
    priceId: 'price_1RtoYkPeSETpTi7Nq4SBhCku',
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
    priceId: 'price_1RtoZ1PeSETpTi7NmQezM39F',
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
    priceId: 'price_1RtoZOPeSETpTi7Ns8eIk36d',
    perCreditCost: 0.25,
    description: 'Emergency credits when you need them'
  }
};