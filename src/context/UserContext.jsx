import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import axios from "axios";

const API_URL = "https://listlist-db.onrender.com/api";

const UserContext = createContext(null);

export const UserProvider = ({ children }) => {
  const { isAuthenticated, isLoading: authLoading, getAccessTokenSilently, user: auth0User } = useAuth0();
  
  const [user, setUser] = useState(null);
  const [currentPod, setCurrentPod] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get access token for API calls
  const getToken = useCallback(async () => {
    try {
      return await getAccessTokenSilently();
    } catch (e) {
      console.error("Error getting token:", e);
      return null;
    }
  }, [getAccessTokenSilently]);

  // Authenticated API call helper
  const apiCall = useCallback(async (method, endpoint, data = null) => {
    const token = await getToken();
    if (!token) {
      throw new Error("Not authenticated");
    }

    const config = {
      method,
      url: `${API_URL}${endpoint}`,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return response.data;
  }, [getToken]);

  // Fetch user profile from our backend
  const fetchUserProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const profile = await apiCall("GET", "/me");
      setUser(profile);
      
      // Set current pod to first pod if not set
      if (profile.pods?.length > 0 && !currentPod) {
        setCurrentPod(profile.pods[0]);
      }
    } catch (e) {
      console.error("Error fetching user profile:", e);
      if (e.response?.data?.code === "USER_NOT_FOUND") {
        setError("You need to be invited to a pod first.");
      } else {
        setError(e.response?.data?.message || "Error loading profile");
      }
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [apiCall, currentPod]);

  // Fetch profile when authenticated
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      fetchUserProfile();
    } else if (!authLoading) {
      setIsLoading(false);
      setUser(null);
    }
  }, [isAuthenticated, authLoading, fetchUserProfile]);

  // Switch current pod
  const switchPod = (podId) => {
    const pod = user?.pods?.find(p => p.pod_id.toString() === podId.toString());
    if (pod) {
      setCurrentPod(pod);
      localStorage.setItem("currentPodId", podId);
    }
  };

  // Restore pod selection from localStorage
  useEffect(() => {
    if (user?.pods?.length > 0) {
      const savedPodId = localStorage.getItem("currentPodId");
      if (savedPodId) {
        const savedPod = user.pods.find(p => p.pod_id.toString() === savedPodId);
        if (savedPod) {
          setCurrentPod(savedPod);
          return;
        }
      }
      // Default to first pod
      setCurrentPod(user.pods[0]);
    }
  }, [user]);

  // Permission helpers
  const hasPermission = (permission) => {
    if (!currentPod) return false;
    // Default to "unrestricted" if role is missing - new users should have full access
    const role = currentPod.role || "unrestricted";
    
    const permissions = {
      MANAGE_MEMBERS: ["admin"],
      MODIFY_ITEMS: ["admin", "unrestricted"],
      MODIFY_LISTS: ["admin", "unrestricted"],
      SHOP_ITEMS: ["admin", "unrestricted", "helper"],
      COOK_DISHES: ["admin", "unrestricted", "helper"],
      MOVE_ITEMS: ["admin", "unrestricted", "helper"],
      VIEW: ["admin", "unrestricted", "helper", "restricted"],
    };

    return permissions[permission]?.includes(role) || false;
  };

  const canModifyItems = () => hasPermission("MODIFY_ITEMS");
  const canShop = () => hasPermission("SHOP_ITEMS");
  const canCook = () => hasPermission("COOK_DISHES");
  const canManageMembers = () => hasPermission("MANAGE_MEMBERS");
  const isAdmin = () => currentPod?.role === "admin";

  const value = {
    user,
    currentPod,
    isLoading: isLoading || authLoading,
    error,
    isAuthenticated,
    auth0User,
    
    // Actions
    switchPod,
    refreshProfile: fetchUserProfile,
    apiCall,
    getToken,
    
    // Permission helpers
    hasPermission,
    canModifyItems,
    canShop,
    canCook,
    canManageMembers,
    isAdmin,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};

export default UserContext;
