import React, { useState, useEffect } from "react";
import axios from "axios";
import { CATEGORY_COLORS, STORAGE_LOCATION_OPTIONS, isEdible, getOpenTagColor, OPEN_TAG_COLORS } from "../utils/categories";

const PantrySearch = ({ pantryItems, pantryListId, onItemAdded, onAddItem, onCookItem }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [itemDatabase, setItemDatabase] = useState([]);
  const [expandedItemId, setExpandedItemId] = useState(null);
  const [movingItemId, setMovingItemId] = useState(null);
  
  // For inline add flow on DB items
  const [addingItem, setAddingItem] = useState(null); // { item, mode: 'pantry' | 'grocery' }
  const [amount, setAmount] = useState(1);

  // Load item database for checking if item exists
  useEffect(() => {
    axios
      .get("https://listlist-db.onrender.com/api/items")
      .then((response) => setItemDatabase(response.data))
      .catch((error) => console.error("Error loading items:", error));
  }, []);

  // Filter pantry items based on search term (case insensitive)
  // Sort: OPEN items first, then edible before household
  const matchingPantryItems = searchTerm.length > 0
    ? pantryItems
        .filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()))
        .sort((a, b) => {
          // Open items come first
          const aOpen = !!a.opened_date;
          const bOpen = !!b.opened_date;
          if (aOpen && !bOpen) return -1;
          if (!aOpen && bOpen) return 1;
          
          // Then edible items before household
          const aEdible = isEdible(a);
          const bEdible = isEdible(b);
          if (aEdible && !bEdible) return -1;
          if (!aEdible && bEdible) return 1;
          return 0;
        })
    : [];

  // Helper to render open tag
  const renderOpenTag = (item) => {
    if (!item.opened_date) return null;
    const color = getOpenTagColor(item.opened_date, item.time_to_expire);
    if (!color) return null;
    const colorStyle = OPEN_TAG_COLORS[color];
    return (
      <span 
        className="open-tag-small"
        style={{
          border: `1px solid ${colorStyle.border}`,
          backgroundColor: colorStyle.background,
          color: colorStyle.text,
        }}
      >
        open
      </span>
    );
  };

  // Filter DB items that are NOT in pantry
  const matchingDbItems = searchTerm.length > 0
    ? itemDatabase.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !pantryItems.some(pi => 
          pi.item_id?.toString() === item._id?.toString() || 
          pi.name?.toLowerCase() === item.name?.toLowerCase()
        )
      )
    : [];

  // Determine what state we're in
  const hasPantryMatches = matchingPantryItems.length > 0;
  const hasDbMatches = matchingDbItems.length > 0;
  const isSearching = searchTerm.length >= 2;
  const noMatchesAtAll = isSearching && !hasPantryMatches && !hasDbMatches;

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setAddingItem(null);
    setAmount(1);
    setExpandedItemId(null);
    setMovingItemId(null);
  };

  const formatDate = () => {
    const now = new Date();
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${months[now.getMonth()]} ${now.getDate().toString().padStart(2, '0')}`;
  };

  const handleStartAddToPantry = (item) => {
    setAddingItem({ item, mode: 'pantry' });
    setAmount(1);
  };

  const handleStartAddToGrocery = (item) => {
    setAddingItem({ item, mode: 'grocery' });
    setAmount(1);
  };

  const handleCancelAdd = () => {
    setAddingItem(null);
    setAmount(1);
  };

  const submitToPantry = async () => {
    if (!addingItem?.item) return;
    const item = addingItem.item;
    
    try {
      const acquiredAmount = parseInt(amount);
      const usePerUnit = item.use_per_unit || 1;
      
      const listItem = {
        list_id: pantryListId,
        item_id: item._id || item.item_id,
        desired_amount: 0,
        acquired_amount: acquiredAmount,
        uses_remaining: acquiredAmount * usePerUnit,
        purchase_date: formatDate(),
        storage_space: item.storage_space || "fridge",
      };

      await axios.post("https://listlist-db.onrender.com/api/list_items", listItem);
      
      // Reset and refresh
      setSearchTerm("");
      setAddingItem(null);
      setAmount(1);
      if (onItemAdded) onItemAdded();
    } catch (error) {
      console.error("Error adding to pantry:", error);
      alert("Error adding item. Please try again.");
    }
  };

  const submitToGrocery = async () => {
    if (!addingItem?.item) return;
    const item = addingItem.item;
    
    try {
      // Find the most recent starred grocery list
      const listsResponse = await axios.get("https://listlist-db.onrender.com/api/lists");
      const groceryLists = listsResponse.data.filter(l => l.type === "grocery" && l.starred === "*");
      
      if (groceryLists.length === 0) {
        alert("No grocery list found. Please create one first.");
        return;
      }

      // Sort by _id descending (most recent first)
      groceryLists.sort((a, b) => b._id.localeCompare(a._id));
      const groceryListId = groceryLists[0].list_id || groceryLists[0]._id;

      const listItem = {
        list_id: groceryListId,
        item_id: item._id || item.item_id,
        desired_amount: parseInt(amount),
        acquired_amount: 0,
      };

      await axios.post("https://listlist-db.onrender.com/api/list_items", listItem);
      
      // Reset
      setSearchTerm("");
      setAddingItem(null);
      setAmount(1);
      alert(`Added ${amount} ${item.name} to grocery list!`);
    } catch (error) {
      console.error("Error adding to grocery:", error);
      alert("Error adding item. Please try again.");
    }
  };

  const toggleExpandItem = (itemId) => {
    setExpandedItemId(expandedItemId === itemId ? null : itemId);
    setMovingItemId(null);
  };

  // Use 1 - decrement uses_remaining
  const handleUseOne = async (item, e) => {
    e.stopPropagation();
    
    const currentUses = item.uses_remaining ?? (item.acquired_amount || 1);
    if (currentUses <= 0) return;
    
    try {
      await axios.patch(`https://listlist-db.onrender.com/api/list_items/${item._id}`, {
        uses_remaining: currentUses - 1
      });
      if (onItemAdded) onItemAdded(); // Refresh the list
    } catch (error) {
      console.error("Error using item:", error);
      alert("Error updating item. Please try again.");
    }
  };

  // Cook it - open CookDish with this item
  const handleCookIt = (item, e) => {
    e.stopPropagation();
    if (onCookItem) {
      onCookItem(item);
    }
    setSearchTerm("");
    setExpandedItemId(null);
  };

  // Move to - change storage location
  const handleStartMove = (itemId, e) => {
    e.stopPropagation();
    setMovingItemId(movingItemId === itemId ? null : itemId);
  };

  const handleMoveTo = async (item, newLocation, e) => {
    e.stopPropagation();
    
    try {
      await axios.patch(`https://listlist-db.onrender.com/api/list_items/${item._id}`, {
        storage_space: newLocation
      });
      setMovingItemId(null);
      if (onItemAdded) onItemAdded(); // Refresh the list
    } catch (error) {
      console.error("Error moving item:", error);
      alert("Error moving item. Please try again.");
    }
  };

  return (
    <div className="pantry-search">
      <div className="search-bar">
        <input
          type="text"
          value={searchTerm}
          onChange={handleSearchChange}
          placeholder="search pantry..."
          className="pantry-search-input"
        />
      </div>

      {/* Show matching pantry items */}
      {hasPantryMatches && (
        <div className="search-results">
          {matchingPantryItems.map((item) => {
            const categoryColor = CATEGORY_COLORS[item.category] || "#ddd";
            const isExpanded = expandedItemId === item._id;
            const isMoving = movingItemId === item._id;
            const usesRemaining = item.uses_remaining ?? (item.acquired_amount || 1);
            const useUnit = item.use_unit === "self" ? item.name : (item.use_unit || "use");
            
            return (
              <div
                key={item._id}
                className={`search-result-item ${isExpanded ? 'expanded' : ''}`}
                style={{ borderLeft: `4px solid ${categoryColor}` }}
              >
                {/* Main row - clickable to expand */}
                <div className="result-main-row" onClick={() => toggleExpandItem(item._id)}>
                  <span className="result-name">{item.name} {renderOpenTag(item)}</span>
                  <span className="result-amount">
                    {item.acquired_amount || item.amount_left} {item.purchase_unit}
                  </span>
                  <span className="result-location">{item.storage_space || "fridge"}</span>
                  <span className="expand-icon">{isExpanded ? '▼' : '▶'}</span>
                </div>

                {/* Action buttons - always visible */}
                <div className="result-actions">
                  <button 
                    className="result-action-btn use"
                    onClick={(e) => handleUseOne(item, e)}
                    disabled={usesRemaining <= 0}
                    title={`${usesRemaining} ${useUnit}${usesRemaining !== 1 ? 's' : ''} remaining`}
                  >
                    use 1
                  </button>
                  {isEdible(item) && (
                    <button 
                      className="result-action-btn cook"
                      onClick={(e) => handleCookIt(item, e)}
                    >
                      cook it
                    </button>
                  )}
                  <button 
                    className={`result-action-btn move ${isMoving ? 'active' : ''}`}
                    onClick={(e) => handleStartMove(item._id, e)}
                  >
                    move to
                  </button>
                </div>

                {/* Move to dropdown */}
                {isMoving && (
                  <div className="move-options" onClick={(e) => e.stopPropagation()}>
                    {STORAGE_LOCATION_OPTIONS.filter(opt => opt.value !== item.storage_space).map(opt => (
                      <button
                        key={opt.value}
                        className="move-option-btn"
                        onClick={(e) => handleMoveTo(item, opt.value, e)}
                      >
                        → {opt.label}
                      </button>
                    ))}
                  </div>
                )}

                {/* Expanded details */}
                {isExpanded && (
                  <div className="result-details" onClick={(e) => e.stopPropagation()}>
                    <div className="detail-row">
                      <span className="detail-label">Category:</span>
                      <span className="detail-value">{item.category}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Uses remaining:</span>
                      <span className="detail-value">{usesRemaining} {useUnit}{usesRemaining !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Purchased:</span>
                      <span className="detail-value">{item.purchase_date || "Unknown"}</span>
                    </div>
                    {item.expiration_date && (
                      <div className="detail-row">
                        <span className="detail-label">Expires:</span>
                        <span className="detail-value">{item.expiration_date}</span>
                      </div>
                    )}
                    <div className="detail-row">
                      <span className="detail-label">Storage:</span>
                      <span className="detail-value">{item.storage_space || "fridge"}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Show DB matches when no pantry matches - orange cards with buttons */}
      {isSearching && !hasPantryMatches && hasDbMatches && (
        <div className="db-suggestions">
          <p className="db-suggestions-header">Not in pantry — add from database:</p>
          <div className="db-item-cards">
            {matchingDbItems.slice(0, 5).map((item) => {
              const categoryColor = CATEGORY_COLORS[item.category] || "#ddd";
              const isAddingThis = addingItem?.item?._id === item._id;
              
              return (
                <div
                  key={item._id}
                  className={`db-item-card ${isAddingThis ? 'adding' : ''}`}
                  style={{ borderLeftColor: categoryColor }}
                >
                  <div className="db-item-card-header">
                    <span className="db-item-name">{item.name}</span>
                    <span className="db-item-unit">{item.purchase_unit}</span>
                  </div>
                  
                  {isAddingThis ? (
                    <div className="db-item-add-form">
                      <div className="amount-row">
                        <label>How many?</label>
                        <input
                          type="number"
                          min="1"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          autoFocus
                        />
                      </div>
                      <div className="add-form-actions">
                        {addingItem.mode === 'pantry' ? (
                          <button className="confirm-btn pantry" onClick={submitToPantry}>
                            add to pantry
                          </button>
                        ) : (
                          <button className="confirm-btn grocery" onClick={submitToGrocery}>
                            add to grocery
                          </button>
                        )}
                        <button className="cancel-btn-small" onClick={handleCancelAdd}>
                          cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="db-item-card-actions">
                      <button 
                        className="db-card-btn pantry"
                        onClick={() => handleStartAddToPantry(item)}
                      >
                        + pantry
                      </button>
                      <button 
                        className="db-card-btn grocery"
                        onClick={() => handleStartAddToGrocery(item)}
                      >
                        + grocery
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* No matches at all - offer to create new item */}
      {noMatchesAtAll && (
        <div className="not-in-db">
          <p className="not-found-message">"{searchTerm}" not found in pantry or database</p>
          <button className="add-new-item-btn" onClick={onAddItem}>
            + Add "{searchTerm}" as new item
          </button>
        </div>
      )}
    </div>
  );
};

export default PantrySearch;
