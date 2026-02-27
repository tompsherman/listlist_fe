/**
 * User Context
 * Manages user profile, onboarding state, current pod, and permissions
 * 
 * Cold Start Handling:
 * - Shows cached data immediately while server wakes
 * - Retries with exponential backoff on NETWORK_ERROR
 * - Only shows error if no cache AND all retries fail
 */

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import api, { setTokenGetter } from '../services/api';
import { podsApi } from '../services/pods';
import { getCached, setCache, clearCache } from '../utils/cache';

const UserContext = createContext(null);

// Retry config for cold start
const RETRY_DELAYS = [2000, 4000, 8000]; // 2s, 4s, 8s
const MAX_RETRIES = 3;

export function UserProvider({ children }) {
  const { getAccessTokenSilently, isAuthenticated, logout } = useAuth0();
  
  const [user, setUser] = useState(null);
  const [currentPod, setCurrentPod] = useState(null);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [serverWaking, setServerWaking] = useState(false);
  
  const retryCount = useRef(0);
  const retryTimeout = useRef(null);

  // Set up token getter for API service
  useEffect(() => {
    if (isAuthenticated) {
      setTokenGetter(getAccessTokenSilently);
    }
  }, [isAuthenticated, getAccessTokenSilently]);

  // Cleanup retry timeout on unmount
  useEffect(() => {
    return () => {
      if (retryTimeout.current) {
        clearTimeout(retryTimeout.current);
      }
    };
  }, []);

  // Load cached data on mount (before fetch)
  useEffect(() => {
    const cached = getCached('user');
    if (cached && !cached.needsOnboarding) {
      setUser(cached);
      setNeedsOnboarding(false);
      if (cached.pods?.length > 0) {
        const savedPodId = localStorage.getItem('currentPodId');
        const pod = cached.pods.find(p => p.podId === savedPodId) || cached.pods[0];
        setCurrentPod(pod);
      }
      // Don't set loading=false yet, let fetch complete
    }
  }, []);

  // Fetch user profile when authenticated
  const fetchUser = useCallback(async (isRetry = false) => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    const cached = getCached('user');
    
    // Only show loading spinner if no cached data
    if (!cached && !isRetry) {
      setLoading(true);
    }
    
    if (!isRetry) {
      setError(null);
      retryCount.current = 0;
    }

    try {
      let response = await api.get('/api/me');
      
      // Success! Clear retry state
      setServerWaking(false);
      retryCount.current = 0;
      
      if (response.needsOnboarding) {
        setNeedsOnboarding(true);
        setUser(null);
      } else {
        // Auto-join any pending pod invites
        try {
          const joinResult = await podsApi.join();
          if (joinResult.joined?.length > 0) {
            // Refetch user to get updated pods
            const refreshed = await api.get('/api/me');
            response = refreshed;
          }
        } catch (e) {
          console.log('No pods to join:', e.message);
        }

        setNeedsOnboarding(false);
        setUser(response);
        setCache('user', response, 10 * 60 * 1000); // 10 min
        
        // Set first pod as current (or from localStorage)
        if (response.pods?.length > 0) {
          const savedPodId = localStorage.getItem('currentPodId');
          const pod = response.pods.find(p => p.podId === savedPodId) || response.pods[0];
          setCurrentPod(pod);
        }
      }
      setError(null);
    } catch (err) {
      console.error('Failed to fetch user:', err);
      
      // Handle cold start (NETWORK_ERROR or timeout)
      const isNetworkError = err.code === 'NETWORK_ERROR' || err.status === 0;
      
      if (isNetworkError && retryCount.current < MAX_RETRIES) {
        // Server might be waking up - retry with backoff
        setServerWaking(true);
        const delay = RETRY_DELAYS[retryCount.current] || 8000;
        retryCount.current++;
        
        console.log(`Server waking, retry ${retryCount.current}/${MAX_RETRIES} in ${delay}ms`);
        
        retryTimeout.current = setTimeout(() => {
          fetchUser(true);
        }, delay);
        
        // Don't set error if we have cached data
        if (!cached) {
          setError('Server is waking up... please wait');
        }
        return;
      }
      
      // All retries failed
      setServerWaking(false);
      
      // Only set error if no cached data
      if (!cached) {
        setError(err.message || 'Unable to connect to server');
      }
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  // Called after onboarding completes
  const completeOnboarding = useCallback(() => {
    setNeedsOnboarding(false);
    fetchUser();
  }, [fetchUser]);

  // Switch to different pod
  const switchPod = useCallback((podId) => {
    const pod = user?.pods?.find(p => p.podId === podId);
    if (pod) {
      setCurrentPod(pod);
      localStorage.setItem('currentPodId', podId);
    }
  }, [user]);

  // Check if user has permission
  const hasPermission = useCallback((permission) => {
    if (!currentPod) return false;
    
    const rolePermissions = {
      admin: ['MANAGE_MEMBERS', 'MODIFY_ITEMS', 'MODIFY_LISTS', 'SHOP_ITEMS', 'COOK_DISHES', 'MOVE_ITEMS', 'VIEW'],
      unrestricted: ['MODIFY_ITEMS', 'MODIFY_LISTS', 'SHOP_ITEMS', 'COOK_DISHES', 'MOVE_ITEMS', 'VIEW'],
      helper: ['SHOP_ITEMS', 'COOK_DISHES', 'MOVE_ITEMS', 'VIEW'],
      restricted: ['VIEW'],
    };

    return rolePermissions[currentPod.role]?.includes(permission) || false;
  }, [currentPod]);

  const value = {
    user,
    currentPod,
    loading,
    error,
    serverWaking,
    needsOnboarding,
    completeOnboarding,
    switchPod,
    hasPermission,
    refetch: fetchUser,
    logout: () => {
      clearCache('user');
      logout({ logoutParams: { returnTo: window.location.origin } });
    },
    // Convenience booleans
    canModifyItems: hasPermission('MODIFY_ITEMS'),
    canShop: hasPermission('SHOP_ITEMS'),
    canCook: hasPermission('COOK_DISHES'),
    canManageMembers: hasPermission('MANAGE_MEMBERS'),
    // Cache state
    hasCachedData: !!getCached('user'),
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within UserProvider');
  }
  return context;
}
