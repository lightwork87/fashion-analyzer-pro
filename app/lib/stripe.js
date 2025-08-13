export function calculateCreditsNeeded(imageCount) {
  return 1; // 1 credit per listing, regardless of photo count
}

export function canUserAnalyze(user, imageCount) {
  if (!user) return false;
  const creditsNeeded = calculateCreditsNeeded(imageCount);
  const totalCredits = (user.credits_total || 0) + (user.bonus_credits || 0);
  const creditsRemaining = totalCredits - (user.credits_used || 0);
  return creditsRemaining >= creditsNeeded;
}

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

export const PLANS = {
  free: {
    name: 'Free Trial',
    credits: 10,
    price: 0,
    priceId: null,
    perCreditCost: 0,
    description: 'Try LightLister AI'
  },
  starter: {
    name: 'Credit Bundle',
    credits: 150,
    price: 45,
    priceId: 'price_XXXXX', // You'll replace this with LIVE price ID
    perCreditCost: 0.30,
    description: 'Best value for regular sellers',
    vat: true,
    popular: true,
    color: 'blue'
  }
};

export const CREDIT_PACKS = {
  small: {
    name: 'Starter Pack',
    credits: 10,
    price: 3,
    priceId: 'price_XXXXX', // You'll replace this with LIVE price ID
    perCreditCost: 0.30,
    description: 'Perfect for trying our service',
    vat: true
  },
  medium: {
    name: 'Growth Pack',
    credits: 50,
    price: 15,
    priceId: 'price_XXXXX', // You'll replace this with LIVE price ID
    perCreditCost: 0.30,
    description: 'Great for growing sellers',
    vat: true
  },
  large: {
    name: 'Pro Pack',
    credits: 150,
    price: 45,
    priceId: 'price_XXXXX', // You'll replace this with LIVE price ID
    perCreditCost: 0.30,
    description: 'Best value - same as subscription',
    vat: true
  }
};

// Helper function to calculate price with VAT
export function calculateVAT(price, vatRate = 0.20) {
  const vat = price * vatRate;
  const total = price + vat;
  return {
    net: price,
    vat: vat.toFixed(2),
    total: total.toFixed(2)
  };
}