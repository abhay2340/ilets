import dotenv from 'dotenv';
dotenv.config();

// Pricing configuration for IELTS tests
export const TEST_PRICING = {
  // Free tests (test1, test2)
  test1: { price: 0, currency: 'INR', isFree: true },
  test2: { price: 0, currency: 'INR', isFree: true },
  
  // Paid tests (test3, test4, test5, test6, test7, test8, test9) - ₹499 each
  test3: { price: 499, currency: 'INR', isFree: false },
  test4: { price: 499, currency: 'INR', isFree: false },
  test5: { price: 499, currency: 'INR', isFree: false },
  test6: { price: 499, currency: 'INR', isFree: false },
  test7: { price: 499, currency: 'INR', isFree: false },
  test8: { price: 499, currency: 'INR', isFree: false },
  test9: { price: 499, currency: 'INR', isFree: false },
};

// Bundle pricing for multiple tests
export const BUNDLE_PRICING = {
  allTests: { price: 2499, currency: 'INR', tests: ['test3', 'test4', 'test5', 'test6', 'test7', 'test8', 'test9'] },
  threeTests: { price: 1299, currency: 'INR', tests: ['test3', 'test4', 'test5'] },
};

// Access duration configuration
export const ACCESS_DURATION = {
  // 30 days in milliseconds
  PAID_TEST_ACCESS_DAYS: 30,
  PAID_TEST_ACCESS_MS: 30 * 24 * 60 * 60 * 1000,
};

// Razorpay configuration
export const RAZORPAY_CONFIG = {
  key_id: process.env.REACT_APP_RAZORPAY_KEY_ID,
  key_secret: process.env.REACT_APP_RAZORPAY_KEY_SECRET,
};

// Helper functions
export const getTestPrice = (testId) => {
  return TEST_PRICING[testId] || { price: 0, currency: 'INR', isFree: true };
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
