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
  subscription: {
    name: 'LightLister Pro',
    credits: 150,
    price: 45,
    priceId: 'price_1RtnkoPeSETpTi7Nw1Voasgc',
    perCreditCost: 0.30,
    description: '150 credits every month + access to credit packs',
    vat: true,
    popular: true,
    color: 'blue',
    recurring: true,
    interval: 'month',
    features: [
      '150 credits per month',
      'Access to additional credit packs',
      'Priority support',
      'Early access to new features',
      'Cancel anytime'
    ]
  }
};

export const CREDIT_PACKS = {
  small: {
    name: 'Starter Pack',
    credits: 10,
    price: 3,
    priceId: 'price_1Rve6qPeSETpTi7NWc1VcSF4',
    perCreditCost: 0.30,
    description: 'Quick top-up for members',
    vat: true,
    membersOnly: true
  },
  medium: {
    name: 'Growth Pack',
    credits: 50,
    price: 15,
    priceId: 'price_1Rve84PeSETpTi7NSnMTnoya',
    perCreditCost: 0.30,
    description: 'Perfect for busy periods',
    vat: true,
    membersOnly: true
  },
  large: {
    name: 'Pro Pack',
    credits: 150,
    price: 45,
    priceId: 'price_1RtnmLPeSETpTi7NEuhiAx41',
    perCreditCost: 0.30,
    description: 'Maximum value for members',
    vat: true,
    membersOnly: true
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

// Check if user has active subscription
export function hasActiveSubscription(user) {
  return user?.subscription_status === 'active';
}