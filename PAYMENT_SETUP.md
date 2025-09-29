# Razorpay Payment Integration Setup

This document explains how to set up and use the Razorpay payment integration for the IELTS test platform.

## Overview

The payment system allows you to:
- Make 7 tests (test3-test9) paid at ₹499 each
- Keep 2 tests (test1-test2) free
- Provide 30 days access for each purchased test
- Track user purchases and expiration in Firestore
- Control access to paid tests with automatic expiration

## Setup Instructions

### 1. Razorpay Account Setup

1. Create a Razorpay account at [https://razorpay.com/](https://razorpay.com/)
2. Go to your [Razorpay Dashboard](https://dashboard.razorpay.com/)
3. Navigate to Settings > API Keys
4. Generate test API keys for development
5. Generate live API keys for production

### 2. Environment Variables

For Vite, environment variables must be prefixed with `VITE_`. Create a `.env.local` file in your project root:

```env
# Razorpay Configuration (Vite)
VITE_RAZORPAY_KEY_ID=rzp_test_your_key_id_here
# Optional: not used client-side, do not expose in production
VITE_RAZORPAY_KEY_SECRET=your_key_secret_here
```

Important:
- Use test keys for development; use live keys for production
- Never commit real keys to version control
- After changing env vars, restart the dev server

### 3. Firebase Firestore Setup

The system uses two Firestore collections:

#### `users` Collection
Stores user purchase information with expiration:
```javascript
{
  userId: "user123",
  purchasedTests: [
    {
      testId: "test4",
      purchasedAt: timestamp,
      expiresAt: timestamp,
      accessDuration: 30
    }
  ],
  createdAt: timestamp,
  lastUpdated: timestamp
}
```

#### `purchases` Collection
Stores detailed purchase records with expiration:
```javascript
{
  userId: "user123",
  testId: "test4",
  paymentId: "pay_1234567890",
  orderId: "order_1234567890",
  signature: "signature_hash",
  amount: 499,
  currency: "INR",
  status: "completed",
  purchasedAt: timestamp,
  expiresAt: timestamp,
  accessDuration: 30
}
```

### 4. Pricing Configuration

Edit `src/config/pricing.js` to modify test prices:

```javascript
export const TEST_PRICING = {
  // Free tests
  test1: { price: 0, currency: 'INR', isFree: true },
  test2: { price: 0, currency: 'INR', isFree: true },
  
  // Paid tests - ₹499 each with 30 days access
  test3: { price: 499, currency: 'INR', isFree: false },
  test4: { price: 499, currency: 'INR', isFree: false },
  test5: { price: 499, currency: 'INR', isFree: false },
  // ... etc
};

export const ACCESS_DURATION = {
  PAID_TEST_ACCESS_DAYS: 30,
  PAID_TEST_ACCESS_MS: 30 * 24 * 60 * 60 * 1000,
};
```

## How It Works

### 1. Test Access Flow

1. User clicks on a test
2. System checks if test is free or user has purchased it
3. If free: Direct access to test
4. If paid and not purchased: Redirect to payment page
5. If paid and purchased: Check if access has expired
6. If expired: Show renewal option or redirect to payment
7. If not expired: Direct access to test

### 2. Payment Flow

1. User clicks "Purchase Access" on a paid test
2. System creates a payment order
3. Razorpay payment modal opens
4. User completes payment
5. Payment success is verified
6. Purchase is recorded in Firestore with 30-day expiration
7. User gains access to the test for 30 days

### 3. Access Control

- `TestPage.jsx` checks user access and expiration before allowing test start
- `usePurchases` hook manages purchase state and expiration info
- `paymentService.js` handles all payment operations and expiration tracking
- Automatic cleanup of expired tests from user's purchased list

## Key Components

### 1. Payment Service (`src/services/paymentService.js`)
- Handles Razorpay integration
- Manages payment orders
- Records purchases in Firestore
- Verifies payment success

### 2. Purchase Hook (`src/hooks/usePurchases.js`)
- Manages user purchase state
- Provides access checking functions
- Handles purchase operations

### 3. Payment Page (`src/pages/PaymentPage.jsx`)
- Displays test information and pricing
- Handles payment initiation
- Shows payment methods and security info

### 4. Test Landing Page (`src/TestLandingPage.jsx`)
- Shows free/paid status for each test
- Provides purchase buttons
- Handles quick purchase functionality

## Testing

### Test Mode
1. Use Razorpay test keys
2. Use test card numbers from Razorpay documentation
3. Test payments won't charge real money

### Production Mode
1. Use Razorpay live keys
2. Ensure proper error handling
3. Test with small amounts first

## Security Considerations

1. **Never expose secret keys** in frontend code
2. **Verify payments** on your backend (recommended)
3. **Use HTTPS** in production
4. **Validate payment signatures** server-side
5. **Implement proper error handling**

## Backend Integration (Recommended)

For production use, implement a backend to:
1. Create payment orders securely
2. Verify payment signatures
3. Handle webhooks for payment status updates
4. Manage refunds and disputes

## Troubleshooting

### Common Issues

1. **Payment modal not opening**
   - Check if Razorpay script is loaded
   - Verify API key is correct
   - Check browser console for errors
   - If you see "No key passed", set `VITE_RAZORPAY_KEY_ID` and restart the dev server

2. **Access denied for purchased tests**
   - Check Firestore permissions
   - Verify purchase record exists
   - Check user authentication

3. **Payment not recorded**
   - Check Firestore write permissions
   - Verify payment success handler
   - Check network connectivity

### Debug Mode

Enable debug logging by adding to your browser console:
```javascript
localStorage.setItem('debug', 'payment:*');
```

## Support

For issues related to:
- **Razorpay**: Check [Razorpay Documentation](https://razorpay.com/docs/)
- **Firebase**: Check [Firebase Documentation](https://firebase.google.com/docs)
- **This Implementation**: Check the code comments and error messages

## Future Enhancements

Consider implementing:
1. Bundle pricing for multiple tests
2. Subscription-based access
3. Discount codes and coupons
4. Payment analytics and reporting
5. Automated refund system
6. Payment method preferences
