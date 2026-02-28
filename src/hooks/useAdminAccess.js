/**
 * useAdminAccess
 * Simple password-based admin access (no Auth0 required)
 * 
 * Extracted from NerveCenter, generalized for reuse.
 * The admin code can also be used as an API key for backend requests.
 * 
 * @example
 * const { isAdmin, verifyCode, revokeAccess } = useAdminAccess();
 * 
 * // In a login form
 * const handleSubmit = () => {
 *   if (verifyCode(inputCode)) {
 *     navigate('/admin');
 *   } else {
 *     setError('Invalid code');
 *   }
 * };
 * 
 * // Protected route check
 * if (!isAdmin) return <AdminLogin />;
 */

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'sk_admin_access';
const API_KEY_STORAGE = 'sk_admin_key';
const ADMIN_CODE = import.meta.env.VITE_ADMIN_CODE || '1234'; // Default for dev

export function useAdminAccess() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  // Check localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'granted') {
      setIsAdmin(true);
    }
    setIsChecking(false);
  }, []);

  // Verify code and grant access
  const verifyCode = useCallback((code) => {
    if (code === ADMIN_CODE) {
      localStorage.setItem(STORAGE_KEY, 'granted');
      // Store the code as the API key for backend requests
      localStorage.setItem(API_KEY_STORAGE, code);
      setIsAdmin(true);
      return true;
    }
    return false;
  }, []);

  // Revoke access
  const revokeAccess = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(API_KEY_STORAGE);
    setIsAdmin(false);
  }, []);

  return {
    isAdmin,
    isChecking,
    verifyCode,
    revokeAccess,
  };
}

/**
 * Get the stored admin API key
 * Used by API utilities for authenticated requests
 * @returns {string} - The stored admin key or empty string
 */
export function getAdminKey() {
  return localStorage.getItem(API_KEY_STORAGE) || import.meta.env.VITE_ADMIN_KEY || '';
}

export default useAdminAccess;
