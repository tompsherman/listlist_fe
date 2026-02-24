/**
 * User Context
 * Manages user profile, onboarding state, current pod, and permissions
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import api, { setTokenGetter } from '../services/api';
import { podsApi } from '../services/pods';
import { getCached, setCache, clearCache } from '../utils/cache';

const UserContext = createContext(null);

export function UserProvider({ children }) {
  const { getAccessTokenSilently, isAuthenticated, logout } = useAuth0();
  
  const [user, setUser] = useState(null);
  const [currentPod, setCurrentPod] = useState(null);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Set up token getter for API service
  useEffect(() => {
    if (isAuthenticated) {
      setTokenGetter(getAccessTokenSilently);
    }
  }, [isAuthenticated, getAccessTokenSilently]);

  // Fetch user profile when authenticated
  const fetchUser = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    // Show cached data immediately
    const cached = getCached('user');
    if (cached && !cached.needsOnboarding) {
      setUser(cached);
      setNeedsOnboarding(false);
      if (cached.pods?.length > 0) {
        const savedPodId = localStorage.getItem('currentPodId');
        const pod = cached.pods.find(p => p.podId === savedPodId) || cached.pods[0];
        setCurrentPod(pod);
      }
      setLoading(false);
    }

    try {
      if (!cached) setLoading(true);
      setError(null);
      
      let response = await api.get('/api/me');
      
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
    } catch (err) {
      console.error('Failed to fetch user:', err);
      setError(err.message);
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
