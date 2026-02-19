import React, { useState, useEffect } from "react";
import axios from "axios";
import { CATEGORY_COLORS } from "../utils/categories";

const PantrySearch = ({ pantryItems, pantryListId, onItemAdded, onAddItem }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [itemDatabase, setItemDatabase] = useState([]);
  const [expandedItem, setExpandedItem] = useState(null);
  
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
  const matchingPantryItems = searchTerm.length > 0
    ? pantryItems.filter(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

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

  const toggleExpandItem = (item) => {
    setExpandedItem(expandedItem?._id === item._id ? null : item);
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
            return (
              <div
                key={item._id}
                className="search-result-item"
                style={{ borderLeft: `4px solid ${categoryColor}` }}
                onClick={() => toggleExpandItem(item)}
              >
                <span className="result-name">{item.name}</span>
                <span className="result-amount">
                  {item.acquired_amount || item.amount_left} {item.purchase_unit}
                </span>
                <span className="result-location">{item.storage_space || "fridge"}</span>
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
