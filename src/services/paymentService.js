import { doc, setDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';
import { TEST_PRICING, RAZORPAY_CONFIG, ACCESS_DURATION } from '../config/pricing';

// Ensure Razorpay key is configured before opening checkout
const ensureRazorpayKeyConfigured = () => {
  const keyId = RAZORPAY_CONFIG?.key_id;
  if (!keyId) {
    throw new Error('Razorpay key missing. Set VITE_RAZORPAY_KEY_ID in your .env and restart the dev server.');
  }
  return keyId;
};

// Load Razorpay script dynamically
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => {
      resolve(window.Razorpay);
    };
    script.onerror = () => {
      console.error('Failed to load Razorpay script');
      resolve(null);
    };
    document.body.appendChild(script);
  });
};

// Create payment order
export const createPaymentOrder = async (testId, userId) => {
  try {
    const testPricing = TEST_PRICING[testId];
    if (!testPricing) {
      throw new Error('Invalid test ID');
    }

    if (testPricing.isFree) {
      throw new Error('Test is free, no payment required');
    }

    // In a real application, you would create an order on your backend
    // For now, we'll create a mock order
    const orderData = {
      amount: testPricing.price * 100, // Razorpay expects amount in paise
      currency: testPricing.currency,
      receipt: `test_${testId}_${userId}_${Date.now()}`,
      notes: {
        testId,
        userId,
        testName: `IELTS Test ${testId.charAt(testId.length - 1)}`,
      },
    };

    // In production, make an API call to your backend to create the order
    // For demo purposes, we'll return mock order data
    return {
      id: `order_${Date.now()}`,
      amount: orderData.amount,
      currency: orderData.currency,
      receipt: orderData.receipt,
    };
  } catch (error) {
    console.error('Error creating payment order:', error);
    throw error;
  }
};

// Initialize Razorpay payment
export const initializePayment = async (testId, userId, onSuccess, onError) => {
  try {
    const Razorpay = await loadRazorpayScript();
    if (!Razorpay) {
      throw new Error('Failed to load Razorpay');
    }

    const testPricing = TEST_PRICING[testId];
    const keyId = ensureRazorpayKeyConfigured();

    const options = {
      key: keyId,
      // Direct payment: do not set order_id when you don't have a backend order
      amount: testPricing.price * 100,
      currency: testPricing.currency,
      name: 'Gurjant IELTS',
      description: `Payment for ${testPricing.testName || `IELTS Test ${testId.charAt(testId.length - 1)}`}`,
      // order_id: backendOrder.id, // <-- only when using your own backend Orders API
      prefill: {
        name: auth.currentUser?.displayName || '',
        email: auth.currentUser?.email || '',
      },
      theme: {
        color: '#b30000',
      },
      handler: async (response) => {
        try {
          await handlePaymentSuccess(response, testId, userId);
          onSuccess(response);
        } catch (error) {
          console.error('Payment success handler error:', error);
          onError(error);
        }
      },
      modal: {
        ondismiss: () => {
          console.log('Payment modal dismissed');
        },
      },
    };

    const razorpay = new Razorpay(options);
    razorpay.open();
  } catch (error) {
    console.error('Error initializing payment:', error);
    onError(error);
  }
};

// Handle successful payment
export const handlePaymentSuccess = async (paymentResponse, testId, userId) => {
  try {
    const purchasedAt = new Date();
    const expiresAt = new Date(purchasedAt.getTime() + ACCESS_DURATION.PAID_TEST_ACCESS_MS);

    // Save purchase record to Firestore
    const purchaseData = {
      userId,
      testId,
      paymentId: paymentResponse.razorpay_payment_id,
      orderId: paymentResponse.razorpay_order_id,
      signature: paymentResponse.razorpay_signature,
      amount: TEST_PRICING[testId].price,
      currency: TEST_PRICING[testId].currency,
      status: 'completed',
      purchasedAt,
      expiresAt,
      accessDuration: ACCESS_DURATION.PAID_TEST_ACCESS_DAYS,
    };

    const purchaseId = `${userId}_${testId}_${Date.now()}`;
    await setDoc(doc(db, 'purchases', purchaseId), purchaseData);

    // Update user's purchased tests with expiration
    await updateUserPurchasedTests(userId, testId, expiresAt);

    console.log('Payment successful and recorded:', purchaseData);
  } catch (error) {
    console.error('Error handling payment success:', error);
    throw error;
  }
};

// Update user's purchased tests with expiration
export const updateUserPurchasedTests = async (userId, testId, expiresAt) => {
  try {
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      const userData = userDoc.data();
      const purchasedTests = userData.purchasedTests || [];

      // Check if test is already purchased and update expiration
      const existingTestIndex = purchasedTests.findIndex(test => test.testId === testId);

      if (existingTestIndex >= 0) {
        // Update existing test expiration
        purchasedTests[existingTestIndex] = {
          testId,
          purchasedAt: new Date(),
          expiresAt,
          accessDuration: ACCESS_DURATION.PAID_TEST_ACCESS_DAYS
        };
      } else {
        // Add new test
        purchasedTests.push({
          testId,
          purchasedAt: new Date(),
          expiresAt,
          accessDuration: ACCESS_DURATION.PAID_TEST_ACCESS_DAYS
        });
      }

      await setDoc(userDocRef, {
        ...userData,
        purchasedTests,
        lastUpdated: new Date(),
      }, { merge: true });
    } else {
      // Create new user document
      await setDoc(userDocRef, {
        purchasedTests: [{
          testId,
          purchasedAt: new Date(),
          expiresAt,
          accessDuration: ACCESS_DURATION.PAID_TEST_ACCESS_DAYS
        }],
        createdAt: new Date(),
        lastUpdated: new Date(),
      });
    }
  } catch (error) {
    console.error('Error updating user purchased tests:', error);
    throw error;
  }
};

// Check if user has purchased a test and it's not expired
export const hasUserPurchasedTest = async (userId, testId) => {
  try {
    if (TEST_PRICING[testId]?.isFree) {
      return true; // Free tests are always accessible
    }

    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      const userData = userDoc.data();
      const purchasedTests = userData.purchasedTests || [];

      // Find the test in purchased tests
      const testPurchase = purchasedTests.find(test => test.testId === testId);

      if (testPurchase) {
        // Check if the test access has expired
        const now = new Date();
        const expiresAt = testPurchase.expiresAt?.toDate ? testPurchase.expiresAt.toDate() : new Date(testPurchase.expiresAt);

        if (now < expiresAt) {
          return true; // Test is purchased and not expired
        } else {
          // Test has expired, remove it from purchased tests
          await removeExpiredTest(userId, testId);
          return false;
        }
      }
    }

    return false;
  } catch (error) {
    console.error('Error checking user purchase:', error);
    return false;
  }
};

// Remove expired test from user's purchased tests
export const removeExpiredTest = async (userId, testId) => {
  try {
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      const userData = userDoc.data();
      const purchasedTests = userData.purchasedTests || [];

      // Filter out the expired test
      const updatedTests = purchasedTests.filter(test => test.testId !== testId);

      await setDoc(userDocRef, {
        ...userData,
        purchasedTests: updatedTests,
        lastUpdated: new Date(),
      }, { merge: true });
    }
  } catch (error) {
    console.error('Error removing expired test:', error);
  }
};

// Get user's purchased tests with expiration info
export const getUserPurchasedTests = async (userId) => {
  try {
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      const userData = userDoc.data();
      const purchasedTests = userData.purchasedTests || [];

      // Filter out expired tests and return active ones
      const now = new Date();
      const activeTests = purchasedTests.filter(test => {
        const expiresAt = test.expiresAt?.toDate ? test.expiresAt.toDate() : new Date(test.expiresAt);
        return now < expiresAt;
      });

      return activeTests;
    }

    return [];
  } catch (error) {
    console.error('Error getting user purchased tests:', error);
    return [];
  }
};

// Get test expiration info for a specific test
export const getTestExpirationInfo = async (userId, testId) => {
  try {
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      const userData = userDoc.data();
      const purchasedTests = userData.purchasedTests || [];

      const testPurchase = purchasedTests.find(test => test.testId === testId);

      if (testPurchase) {
        const now = new Date();
        const expiresAt = testPurchase.expiresAt?.toDate ? testPurchase.expiresAt.toDate() : new Date(testPurchase.expiresAt);
        const isExpired = now >= expiresAt;
        const daysRemaining = Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24));

        return {
          isExpired,
          expiresAt,
          daysRemaining: isExpired ? 0 : Math.max(0, daysRemaining),
          purchasedAt: testPurchase.purchasedAt
        };
      }
    }

    return null;
  } catch (error) {
    console.error('Error getting test expiration info:', error);
    return null;
  }
};

// Get user's purchase history
export const getUserPurchaseHistory = async (userId) => {
  try {
    const purchasesRef = collection(db, 'purchases');
    const q = query(purchasesRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);

    const purchases = [];
    querySnapshot.forEach((doc) => {
      purchases.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return purchases.sort((a, b) => b.purchasedAt - a.purchasedAt);
  } catch (error) {
    console.error('Error getting purchase history:', error);
    return [];
  }
};
