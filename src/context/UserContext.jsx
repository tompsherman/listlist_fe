/**
 * User Context
 * Manages user profile, current pod, and permissions
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import api, { setTokenGetter } from '../services/api';

const UserContext = createContext(null);

export function UserProvider({ children }) {
  const { getAccessTokenSilently, user: auth0User, isAuthenticated } = useAuth0();
  
  const [user, setUser] = useState(null);
  const [currentPod, setCurrentPod] = useState(null);
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

    try {
      setLoading(true);
      const response = await api.get('/api/me');
      setUser(response);
      
      // Set first pod as current (or from localStorage)
      if (response.pods?.length > 0) {
        const savedPodId = localStorage.getItem('currentPodId');
        const pod = response.pods.find(p => p.podId === savedPodId) || response.pods[0];
        setCurrentPod(pod);
      }
      
      setError(null);
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
    switchPod,
    hasPermission,
    refetch: fetchUser,
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
