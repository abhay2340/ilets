// Vite apps cannot use process.env in the browser. Use import.meta.env with VITE_*

// Pricing configuration for IELTS tests
export const TEST_PRICING = {
  test1: { price: 0, currency: 'INR', isFree: true },
  test2: { price: 0, currency: 'INR', isFree: true },
};

// Package pricing for multiple tests
export const BUNDLE_ID = 'bundleAll';
export const BUNDLE_PRICING = {
  [BUNDLE_ID]: { price: 1, currency: 'INR', tests: ['test3', 'test4', 'test5', 'test6', 'test7', 'test8', 'test9'] },
};

// Access duration configuration
export const ACCESS_DURATION = {
  // 90 days in milliseconds
  PAID_TEST_ACCESS_DAYS: 90,
  PAID_TEST_ACCESS_MS: 90 * 24 * 60 * 60 * 1000,
};

// Razorpay configuration
export const RAZORPAY_CONFIG = {
  // Note: Do NOT expose secrets in frontend code. Only key_id is normally used client-side.
  key_id: import.meta.env.VITE_RAZORPAY_KEY_ID || '',
  key_secret: import.meta.env.VITE_RAZORPAY_KEY_SECRET || '',
};

// Helper functions
export const getTestPrice = (testId) => {
  // Unknown tests are considered premium (bundle-only) and not individually priced
  return TEST_PRICING[testId] || { price: null, currency: 'INR', isFree: false };
};

export const isTestFree = (testId) => {
  return getTestPrice(testId).isFree;
};

export const formatPrice = (price, currency = 'INR') => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency,
  }).format(price);
};
