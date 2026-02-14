import React, { useState, useEffect } from "react";
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
};

const PantrySearch = ({ pantryItems, pantryListId, onItemAdded }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [itemDatabase, setItemDatabase] = useState([]);
  const [mode, setMode] = useState("search"); // "search" | "addToPantry" | "addToGrocery" | "addNewItem"
  const [selectedDbItem, setSelectedDbItem] = useState(null);
  const [amount, setAmount] = useState(1);
  const [expandedItem, setExpandedItem] = useState(null);

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

  // Check if search term matches any items in the database (for add flow)
  const matchingDbItems = searchTerm.length > 0
    ? itemDatabase.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  // Check if item is NOT in pantry but IS in database
  const notInPantry = searchTerm.length > 0 && matchingPantryItems.length === 0;

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setMode("search");
    setSelectedDbItem(null);
    setAmount(1);
  };

  const handleAddToPantry = () => {
    if (matchingDbItems.length > 0) {
      // Item exists in DB - show selection or go straight to amount
      setMode("addToPantry");
    } else {
      // Item doesn't exist - need to create it first
      setMode("addNewItem");
    }
  };

  const handleAddToGrocery = () => {
    if (matchingDbItems.length > 0) {
      setMode("addToGrocery");
    } else {
      // Need to create item first, then add to grocery
      setMode("addNewItem");
    }
  };

  const handleSelectDbItem = (item) => {
    setSelectedDbItem(item);
  };

  const formatDate = () => {
    const now = new Date();
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${months[now.getMonth()]} ${now.getDate().toString().padStart(2, '0')}`;
  };

  const submitToPantry = async () => {
    if (!selectedDbItem) return;
    
    try {
      const listItem = {
        list_id: pantryListId,
        item_id: selectedDbItem._id || selectedDbItem.item_id,
        desired_amount: 0,
        acquired_amount: parseInt(amount),
        purchase_date: formatDate(),
        storage_space: selectedDbItem.storage_space || "fridge",
      };

      await axios.post("https://listlist-db.onrender.com/api/list_items", listItem);
      
      // Reset and refresh
      setSearchTerm("");
      setMode("search");
      setSelectedDbItem(null);
      setAmount(1);
      if (onItemAdded) onItemAdded();
    } catch (error) {
      console.error("Error adding to pantry:", error);
      alert("Error adding item. Please try again.");
    }
  };

  const submitToGrocery = async () => {
    if (!selectedDbItem) return;
    
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
        item_id: selectedDbItem._id || selectedDbItem.item_id,
        desired_amount: parseInt(amount),
        acquired_amount: 0,
      };

      await axios.post("https://listlist-db.onrender.com/api/list_items", listItem);
      
      // Reset
      setSearchTerm("");
      setMode("search");
      setSelectedDbItem(null);
      setAmount(1);
      alert(`Added ${amount} ${selectedDbItem.name} to grocery list!`);
    } catch (error) {
      console.error("Error adding to grocery:", error);
      alert("Error adding item. Please try again.");
    }
  };

  const handleCancel = () => {
    setMode("search");
    setSelectedDbItem(null);
    setAmount(1);
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
      {mode === "search" && matchingPantryItems.length > 0 && (
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

      {/* Not in pantry message */}
      {mode === "search" && notInPantry && (
        <div className="not-in-pantry">
          <p className="not-found-message">"{searchTerm}" is not in pantry</p>
          <div className="not-found-actions">
            <button className="action-btn pantry-btn" onClick={handleAddToPantry}>
              add to pantry?
            </button>
            <button className="action-btn grocery-btn" onClick={handleAddToGrocery}>
              add to grocery list?
            </button>
          </div>
        </div>
      )}

      {/* Add to pantry flow - select from DB or show not found */}
      {mode === "addToPantry" && (
        <div className="add-flow">
          {matchingDbItems.length > 0 ? (
            <>
              <p className="flow-title">Select item to add to pantry:</p>
              <div className="db-item-list">
                {matchingDbItems.map((item) => {
                  const categoryColor = CATEGORY_COLORS[item.category] || "#ddd";
                  const isSelected = selectedDbItem?._id === item._id || selectedDbItem?.item_id === item.item_id;
                  return (
                    <div
                      key={item._id || item.item_id}
                      className={`db-item ${isSelected ? "selected" : ""}`}
                      style={{ borderLeft: `4px solid ${categoryColor}` }}
                      onClick={() => handleSelectDbItem(item)}
                    >
                      <span>{item.name}</span>
                      <span className="db-item-unit">{item.purchase_unit}</span>
                    </div>
                  );
                })}
              </div>
              {selectedDbItem && (
                <div className="amount-input">
                  <label>How many {selectedDbItem.purchase_unit}?</label>
                  <input
                    type="number"
                    min="1"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                  <div className="amount-actions">
                    <button className="submit-btn" onClick={submitToPantry}>
                      add to pantry
                    </button>
                    <button className="cancel-btn" onClick={handleCancel}>
                      cancel
                    </button>
                  </div>
                </div>
              )}
              {!selectedDbItem && (
                <button className="cancel-btn" onClick={handleCancel}>cancel</button>
              )}
            </>
          ) : (
            <div className="item-not-in-db">
              <p>"{searchTerm}" is not in your item database.</p>
              <p>Add it through the "Add Item" flow first, then you can add it to your pantry.</p>
              <button className="cancel-btn" onClick={handleCancel}>back</button>
            </div>
          )}
        </div>
      )}

      {/* Add to grocery flow */}
      {mode === "addToGrocery" && (
        <div className="add-flow">
          {matchingDbItems.length > 0 ? (
            <>
              <p className="flow-title">Select item to add to grocery list:</p>
              <div className="db-item-list">
                {matchingDbItems.map((item) => {
                  const categoryColor = CATEGORY_COLORS[item.category] || "#ddd";
                  const isSelected = selectedDbItem?._id === item._id || selectedDbItem?.item_id === item.item_id;
                  return (
                    <div
                      key={item._id || item.item_id}
                      className={`db-item ${isSelected ? "selected" : ""}`}
                      style={{ borderLeft: `4px solid ${categoryColor}` }}
                      onClick={() => handleSelectDbItem(item)}
                    >
                      <span>{item.name}</span>
                      <span className="db-item-unit">{item.purchase_unit}</span>
                    </div>
                  );
                })}
              </div>
              {selectedDbItem && (
                <div className="amount-input">
                  <label>How many {selectedDbItem.purchase_unit}?</label>
                  <input
                    type="number"
                    min="1"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                  <div className="amount-actions">
                    <button className="submit-btn" onClick={submitToGrocery}>
                      add to grocery
                    </button>
                    <button className="cancel-btn" onClick={handleCancel}>
                      cancel
                    </button>
                  </div>
                </div>
              )}
              {!selectedDbItem && (
                <button className="cancel-btn" onClick={handleCancel}>cancel</button>
              )}
            </>
          ) : (
            <div className="item-not-in-db">
              <p>"{searchTerm}" is not in your item database.</p>
              <p>Add it through the "Add Item" flow first.</p>
              <button className="cancel-btn" onClick={handleCancel}>back</button>
            </div>
          )}
        </div>
      )}

      {/* Add new item flow - redirect to AddItem */}
      {mode === "addNewItem" && (
        <div className="add-flow">
          <div className="item-not-in-db">
            <p>"{searchTerm}" is not in your item database.</p>
            <p>Use the "Add Item" tab to create this item first, then you can add it to your pantry or grocery list.</p>
            <button className="cancel-btn" onClick={handleCancel}>back</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PantrySearch;
