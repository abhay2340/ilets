import { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import {
  hasUserPurchasedTest,
  getUserPurchasedTests,
  getUserPurchaseHistory,
  getTestExpirationInfo,
  initializePayment
} from '../services/paymentService';
import { TEST_PRICING } from '../config/pricing';

export const usePurchases = () => {
  const { user, isAdmin } = useAuth();
  const [purchasedTests, setPurchasedTests] = useState([]);
  const [purchaseHistory, setPurchaseHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  // Local grant to make access instant right after a successful payment
  const [locallyGrantedAccess, setLocallyGrantedAccess] = useState({});

  // Load user's purchased tests
  useEffect(() => {
    const loadPurchases = async () => {
      if (!user) {
        setPurchasedTests([]);
        setPurchaseHistory([]);
        setLoading(false);
        return;
      }

      try {
        const [tests, history] = await Promise.all([
          getUserPurchasedTests(user.uid),
          getUserPurchaseHistory(user.uid)
        ]);

        setPurchasedTests(tests);
        setPurchaseHistory(history);
      } catch (error) {
        console.error('Error loading purchases:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPurchases();
  }, [user]);

  // Check if user has access to a specific test
  const hasAccess = async (testId) => {
    if (!user) return false;

    // Admin users have unrestricted access to all tests (free and paid)
    if (isAdmin) {
      return true;
    }

    // Free tests are always accessible
    if (TEST_PRICING[testId]?.isFree) {
      return true;
    }

    // If we just granted access locally (post-payment), allow immediately
    if (locallyGrantedAccess[testId]) {
      return true;
    }

    // Check if user has purchased the test and it's not expired
    return await hasUserPurchasedTest(user.uid, testId);
  };

  // Get expiration info for a specific test
  const getExpirationInfo = async (testId) => {
    if (!user) return null;

    // Free tests don't expire
    if (TEST_PRICING[testId]?.isFree) {
      return { isExpired: false, daysRemaining: null };
    }

    return await getTestExpirationInfo(user.uid, testId);
  };

  // Purchase a test
  const purchaseTest = async (testId, itemDetails = null) => {
    if (!user) {
      throw new Error('User must be logged in to purchase tests');
    }

    return new Promise((resolve, reject) => {
      initializePayment(
        testId,
        user.uid,
        async (response) => {
          try {
            // Grant local access immediately so UI can proceed without waiting
            setLocallyGrantedAccess(prev => ({ ...prev, [testId]: true }));
            // Refresh purchases and history, then resolve
            const [tests, history] = await Promise.all([
              getUserPurchasedTests(user.uid),
              getUserPurchaseHistory(user.uid)
            ]);
            setPurchasedTests(tests);
            setPurchaseHistory(history);
            resolve(response);
          } catch (err) {
            // Even if refresh fails, keep local grant and resolve
            resolve(response);
          }
        },
        (error) => {
          reject(error);
        },
        itemDetails
      );
    });
  };

  // Refresh purchases data
  const refreshPurchases = async () => {
    if (!user) return;

    try {
      const [tests, history] = await Promise.all([
        getUserPurchasedTests(user.uid),
        getUserPurchaseHistory(user.uid)
      ]);

      setPurchasedTests(tests);
      setPurchaseHistory(history);
    } catch (error) {
      console.error('Error refreshing purchases:', error);
    }
  };

  return {
    purchasedTests,
    purchaseHistory,
    loading,
    hasAccess,
    getExpirationInfo,
    purchaseTest,
    refreshPurchases,
  };
};
