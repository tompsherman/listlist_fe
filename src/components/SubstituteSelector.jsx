import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";

const CATEGORY_COLORS = {
  vegetable: "#228B22",
  herbs: "#8B7355",
  fruit: "#9ACD32",
  grains: "#DAA520",
  meat: "#F08080",
  dairy: "#FFFAF0",
  household: "#ADD8E6",
  drinks: "#BDB76B",
  snack: "#FF6347",
  other: "#ddd",
};

/**
 * A multi-select search component for choosing substitute items.
 * 
 * Props:
 * - value: array of substitute objects [{ item_id, name }] or just names as strings
 * - onChange: callback with updated array of substitutes
 * - excludeItemName: name of current item to exclude from search results
 */
const SubstituteSelector = ({ value = [], onChange, excludeItemName = "" }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Normalize value to array of objects with at least { name }
  const substitutes = useMemo(() => {
    return Array.isArray(value) 
      ? value.map(v => typeof v === "string" ? { name: v } : v)
      : [];
  }, [value]);

  // Search items as user types
  useEffect(() => {
    if (searchTerm.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(() => {
      axios.get(`https://listlist-db.onrender.com/api/items/`)
        .then(res => {
          const filtered = res.data.filter(item => 
            item.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
            item.name.toLowerCase() !== excludeItemName.toLowerCase() &&
            !substitutes.some(s => s.name?.toLowerCase() === item.name.toLowerCase())
          );
          setSearchResults(filtered.slice(0, 8));
          setIsSearching(false);
        })
        .catch(err => {
          console.error("Error searching items:", err);
          setIsSearching(false);
        });
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, excludeItemName, substitutes]);

  const handleAddExisting = (item) => {
    const newSub = {
      item_id: item._id,
      name: item.name,
      category: item.category,
    };
    onChange([...substitutes, newSub]);
    setSearchTerm("");
    setShowResults(false);
  };

  const handleAddNew = async () => {
    const trimmedName = searchTerm.trim().toLowerCase();
    if (!trimmedName) return;

    // Check if already added
    if (substitutes.some(s => s.name?.toLowerCase() === trimmedName)) {
      setSearchTerm("");
      return;
    }

    try {
      // Create new item with defaults
      const newItem = {
        name: trimmedName,
        category: "other",
        purchase_unit: "unit",
        use_unit: "self",
        use_per_unit: 1,
        storage_space: "fridge",
        perishable: "true",
        time_to_expire: "nine_days",
      };

      const response = await axios.post("https://listlist-db.onrender.com/api/items", newItem);
      
      const newSub = {
        item_id: response.data._id || response.data.insertedId,
        name: trimmedName,
        category: "other",
      };
      
      onChange([...substitutes, newSub]);
      setSearchTerm("");
      setShowResults(false);
    } catch (error) {
      console.error("Error creating item:", error);
      // Still add it locally even if API fails
      onChange([...substitutes, { name: trimmedName }]);
      setSearchTerm("");
      setShowResults(false);
    }
  };

  const handleRemove = (indexToRemove) => {
    onChange(substitutes.filter((_, idx) => idx !== indexToRemove));
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      // If there are search results, add the first one
      if (searchResults.length > 0) {
        handleAddExisting(searchResults[0]);
      } else if (searchTerm.trim()) {
        // Otherwise create new
        handleAddNew();
      }
    }
    if (e.key === "Escape") {
      setShowResults(false);
      setSearchTerm("");
    }
  };

  const noResultsFound = searchTerm.length >= 2 && !isSearching && searchResults.length === 0;

  return (
    <div className="substitute-selector">
      {/* Selected substitutes */}
      {substitutes.length > 0 && (
        <div className="substitute-tags">
          {substitutes.map((sub, idx) => {
            const color = CATEGORY_COLORS[sub.category] || CATEGORY_COLORS.other;
            return (
              <span 
                key={idx} 
                className="substitute-tag"
                style={{ borderLeftColor: color }}
              >
                {sub.name}
                <button 
                  type="button" 
                  className="remove-tag"
                  onClick={() => handleRemove(idx)}
                >
                  ✕
                </button>
              </span>
            );
          })}
        </div>
      )}

      {/* Search input */}
      <div className="substitute-search">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setShowResults(true);
          }}
          onFocus={() => setShowResults(true)}
          onBlur={() => setTimeout(() => setShowResults(false), 200)}
          onKeyDown={handleKeyDown}
          placeholder="Search for substitute..."
        />

        {/* Search results dropdown */}
        {showResults && searchTerm.length >= 2 && (
          <div className="substitute-results">
            {isSearching && (
              <div className="substitute-result loading">Searching...</div>
            )}
            
            {!isSearching && searchResults.map(item => {
              const color = CATEGORY_COLORS[item.category] || CATEGORY_COLORS.other;
              return (
                <div
                  key={item._id}
                  className="substitute-result"
                  style={{ borderLeftColor: color }}
                  onMouseDown={() => handleAddExisting(item)}
                >
                  <span className="result-name">{item.name}</span>
                  <span className="result-category">{item.category}</span>
                </div>
              );
            })}

            {noResultsFound && (
              <div 
                className="substitute-result create-new"
                onMouseDown={handleAddNew}
              >
                <span>+ Create "{searchTerm.trim()}"</span>
                <span className="result-hint">as new item</span>
              </div>
            )}

            {!isSearching && searchResults.length > 0 && searchTerm.trim() && (
              <div 
                className="substitute-result create-new"
                onMouseDown={handleAddNew}
              >
                <span>+ Create "{searchTerm.trim()}"</span>
                <span className="result-hint">as new item</span>
              </div>
            )}
          </div>
        )}
      </div>

      {substitutes.length === 0 && (
        <p className="substitute-hint">Type to search or add new substitutes</p>
      )}
    </div>
  );
};

export default SubstituteSelector;
