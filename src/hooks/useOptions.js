import { useState, useEffect, useCallback } from "react";
import axios from "axios";

const API_URL = "https://listlist-db.onrender.com/api/options";

/**
 * Hook to fetch and manage custom options for item fields.
 * Returns { options, isLoading, addOption, refreshOptions }
 */
const useOptions = () => {
  const [options, setOptions] = useState({
    category: [],
    purchase_unit: [],
    use_unit: [],
    storage_space: [],
    storage_size: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchOptions = useCallback(async () => {
    try {
      const response = await axios.get(API_URL);
      const data = response.data;
      
      // Extract the "all" array from each field
      const formatted = {};
      for (const field of Object.keys(data)) {
        formatted[field] = data[field].all || [];
      }
      setOptions(formatted);
    } catch (error) {
      console.error("Error fetching options:", error);
      // Fall back to empty arrays (component will use defaults)
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOptions();
  }, [fetchOptions]);

  const addOption = useCallback(async (field, value) => {
    const response = await axios.post(`${API_URL}/${field}`, { value });
    
    // Update local state with new options
    setOptions(prev => ({
      ...prev,
      [field]: response.data.all || [...prev[field], value],
    }));
    
    return response.data;
  }, []);

  return {
    options,
    isLoading,
    addOption,
    refreshOptions: fetchOptions,
  };
};

export default useOptions;
