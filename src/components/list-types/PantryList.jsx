import React, { useState } from "react";
import axios from "axios";
import {
  STORAGE_LOCATIONS,
  CATEGORIES,
  CATEGORY_COLORS,
  STORAGE_COLORS,
  isEdible,
  getOpenTagColor,
  OPEN_TAG_COLORS,
  formatExpiration,
  EXPIRATION_OPTIONS,
} from "../../utils/categories";
import useOptions from "../../hooks/useOptions";
import CreatableSelect from "../CreatableSelect";

// Split options based on storage size
const SPLIT_OPTIONS = {
  gallon: [
    { targetSize: "half_gallon", count: 2, label: "2 half-gallons" },
    { targetSize: "quart", count: 4, label: "4 quarts" },
    { targetSize: "pint", count: 8, label: "8 pints" },
  ],
  half_gallon: [
    { targetSize: "quart", count: 2, label: "2 quarts" },
    { targetSize: "pint", count: 4, label: "4 pints" },
  ],
  quart: [
    { targetSize: "pint", count: 2, label: "2 pints" },
  ],
  pint: [], // Can't split further
};

const PantryList = ({ array, keyword, onItemRemoved, groupBy = "category", allPantryItems, pantryListId, onCookItem }) => {
  const { options, addOption } = useOptions();
  const [deletingItem, setDeletingItem] = useState(null);
  const [deleteStep, setDeleteStep] = useState(null);
  const [removalReason, setRemovalReason] = useState(null);
  const [expandedItem, setExpandedItem] = useState(null);
  const [movingItem, setMovingItem] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [collapsedSubgroups, setCollapsedSubgroups] = useState({});
  const [collapsedItemGroups, setCollapsedItemGroups] = useState({});
  const [usingItem, setUsingItem] = useState(null);
  const [splittingItem, setSplittingItem] = useState(null);
  const [openingItem, setOpeningItem] = useState(null);
  const [editingExpiration, setEditingExpiration] = useState(null); // item_id being edited
  const [newExpiration, setNewExpiration] = useState("");
  const [editingItem, setEditingItem] = useState(null); // Full item edit mode
  const [editMode, setEditMode] = useState("quick"); // "quick" or "full"
  const [editForm, setEditForm] = useState({});

  // Handle editing expiration
  const handleStartEditExpiration = (item, e) => {
    e.stopPropagation();
    setEditingExpiration(item.item_id);
    setNewExpiration(item.time_to_expire || "nine_days");
  };

  const handleSaveExpiration = async (item, e) => {
    e.stopPropagation();
    
    try {
      // Update the item's time_to_expire
      await axios.put(`https://listlist-db.onrender.com/api/items/${item.item_id}`, {
        time_to_expire: newExpiration
      });
      
      setEditingExpiration(null);
      setNewExpiration("");
      if (onItemRemoved) {
        onItemRemoved(); // Refresh the list
      }
    } catch (error) {
      console.error("Error updating expiration:", error);
      alert("Error updating expiration. Please try again.");
    }
  };

  const handleCancelEditExpiration = (e) => {
    e.stopPropagation();
    setEditingExpiration(null);
    setNewExpiration("");
  };

  // Full item edit handlers
  const handleStartEditItem = (item, e) => {
    e.stopPropagation();
    setEditingItem(item.item_id);
    setEditMode("quick");
    setEditForm({
      name: item.name || "",
      category: item.category || "vegetable",
      purchase_unit: item.purchase_unit || "unit",
      cost: item.cost || "",
      storage_space: item.storage_space || "fridge",
      use_unit: item.use_unit || "self",
      use_per_unit: item.use_per_unit || 1,
      perishable: item.perishable || "true",
      time_to_expire: item.time_to_expire || "nine_days",
      storage_size: item.storage_size || "",
      brand_matters: item.brand_matters || "no",
      brand: item.brand || "",
      has_substitutes: item.has_substitutes || "no",
      breaks_down: item.breaks_down || "no",
      breaks_into_1: item.breaks_into_1 || "",
      breaks_into_2: item.breaks_into_2 || "",
    });
  };

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditForm({ ...editForm, [name]: value });
  };

  const handleSaveEditItem = async (item, e) => {
    e.stopPropagation();
    
    try {
      await axios.put(`https://listlist-db.onrender.com/api/items/${item.item_id}`, editForm);
      
      setEditingItem(null);
      setEditForm({});
      if (onItemRemoved) {
        onItemRemoved(); // Refresh the list
      }
    } catch (error) {
      console.error("Error updating item:", error);
      alert("Error updating item. Please try again.");
    }
  };

  const handleCancelEditItem = (e) => {
    e.stopPropagation();
    setEditingItem(null);
    setEditForm({});
  };

  // Handle marking an item as "open"
  const handleOpenItem = async (item, e) => {
    e.stopPropagation();
    setOpeningItem(item._id);
    
    try {
      await axios.patch(`https://listlist-db.onrender.com/api/list_items/${item._id}`, {
        opened_date: new Date().toISOString()
      });
      
      setOpeningItem(null);
      if (onItemRemoved) {
        onItemRemoved(); // Refresh the list
      }
    } catch (error) {
      console.error("Error opening item:", error);
      setOpeningItem(null);
      alert("Error marking item as open. Please try again.");
    }
  };

  // Render the "open" tag with appropriate color
  const renderOpenTag = (item) => {
    if (!item.opened_date) return null;
    
    const color = getOpenTagColor(item.opened_date, item.time_to_expire);
    if (!color) return null;
    
    const colorStyle = OPEN_TAG_COLORS[color];
    
    return (
      <span 
        className="open-tag"
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

  // Calculate uses remaining for an item
  const getUsesRemaining = (item) => {
    if (item.uses_remaining !== undefined && item.uses_remaining !== null) {
      return item.uses_remaining;
    }
    // Calculate from acquired_amount * use_per_unit
    const usePerUnit = item.use_per_unit || 1;
    return (item.acquired_amount || 1) * usePerUnit;
  };

  // Handle using an item (decrement)
  const handleUseItem = async (item, e) => {
    e.stopPropagation();
    setUsingItem(item._id);
    
    try {
      const response = await axios.post(`https://listlist-db.onrender.com/api/list_items/${item._id}/use`, {
        amount: 1
      });
      
      console.log("USE response:", response.data);
      
      if (response.data.is_empty) {
        // Item is empty - trigger delete flow with "used" reason
        setUsingItem(null);
        setDeletingItem(item);
        setRemovalReason("used");
        setDeleteStep("empty");
      } else {
        setUsingItem(null);
        if (onItemRemoved) {
          onItemRemoved(); // Refresh the list
        }
      }
    } catch (error) {
      console.error("Error using item:", error);
      setUsingItem(null);
      alert("Error using item. Please try again.");
    }
  };

  // Handle splitting an item into smaller storage sizes
  const handleSplitClick = (item, e) => {
    e.stopPropagation();
    setSplittingItem(splittingItem?._id === item._id ? null : item);
    setMovingItem(null);
  };

  const handleSplitItem = async (item, targetSize, count) => {
    try {
      const response = await axios.post(`https://listlist-db.onrender.com/api/list_items/${item._id}/split`, {
        targetSize,
        count
      });
      
      console.log("SPLIT response:", response.data);
      setSplittingItem(null);
      setExpandedItem(null);
      if (onItemRemoved) {
        onItemRemoved(); // Refresh the list
      }
    } catch (error) {
      console.error("Error splitting item:", error);
      alert("Error splitting item. Please try again.");
    }
  };

  // Get split options for an item
  const getSplitOptions = (item) => {
    const size = item.storage_size;
    return SPLIT_OPTIONS[size] || [];
  };

  // Check if item can be broken down
  const canBreakDown = (item) => {
    return item.breaks_down === "yes" && (item.breaks_into_1 || item.breaks_into_2);
  };

  // Get what item breaks into
  const getBreakdownComponents = (item) => {
    return [item.breaks_into_1, item.breaks_into_2].filter(c => c && c.trim());
  };

  // Handle breaking down an item
  const handleBreakDown = async (item, e) => {
    e.stopPropagation();
    const components = getBreakdownComponents(item);
    
    if (!window.confirm(`Break down ${item.name} into ${components.join(" + ")}?`)) {
      return;
    }

    try {
      const response = await axios.post(`https://listlist-db.onrender.com/api/list_items/${item._id}/breakdown`);
      
      console.log("BREAKDOWN response:", response.data);
      setExpandedItem(null);
      if (onItemRemoved) {
        onItemRemoved(); // Refresh the list
      }
    } catch (error) {
      console.error("Error breaking down item:", error);
      alert("Error breaking down item. Please try again.");
    }
  };

  // Filter by category or storage_space based on groupBy prop
  const keyList = array.filter((item) => {
    if (groupBy === "storage") {
      const itemStorage = (item.storage_space || "fridge").toLowerCase();
      return itemStorage === keyword.toLowerCase();
    }
    return item.category === keyword;
  });

  // Get subgroups based on the opposite grouping
  const getSubgroups = () => {
    if (groupBy === "storage") {
      return CATEGORIES.filter(cat => keyList.some(item => item.category === cat));
    } else {
      return STORAGE_LOCATIONS.filter(loc => 
        keyList.some(item => (item.storage_space || "fridge").toLowerCase() === loc)
      );
    }
  };

  const getItemsForSubgroup = (subgroup) => {
    if (groupBy === "storage") {
      return keyList.filter(item => item.category === subgroup);
    } else {
      return keyList.filter(item => (item.storage_space || "fridge").toLowerCase() === subgroup);
    }
  };

  // Group items by name within a subgroup
  const groupItemsByName = (items) => {
    const groups = {};
    items.forEach(item => {
      const name = item.name.toLowerCase();
      if (!groups[name]) {
        groups[name] = [];
      }
      groups[name].push(item);
    });
    
    // Sort each group: OPEN items first, then by purchase_date (oldest first)
    Object.keys(groups).forEach(name => {
      groups[name].sort((a, b) => {
        // Open items come first
        const aOpen = !!a.opened_date;
        const bOpen = !!b.opened_date;
        if (aOpen && !bOpen) return -1;
        if (!aOpen && bOpen) return 1;
        
        // Then sort by purchase_date (oldest first)
        const parseDate = (dateStr) => {
          if (!dateStr) return new Date(0);
          const months = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };
          const parts = dateStr.split(' ');
          if (parts.length >= 2) {
            const month = months[parts[0]] || 0;
            const day = parseInt(parts[1]) || 1;
            return new Date(2026, month, day);
          }
          return new Date(0);
        };
        return parseDate(a.purchase_date) - parseDate(b.purchase_date);
      });
    });
    
    return groups;
  };

  const toggleSubgroup = (subgroup) => {
    setCollapsedSubgroups(prev => ({
      ...prev,
      [subgroup]: !prev[subgroup]
    }));
  };

  const toggleItemGroup = (groupKey) => {
    setCollapsedItemGroups(prev => ({
      ...prev,
      [groupKey]: prev[groupKey] === false ? true : false
    }));
  };

  const handleDeleteClick = (item, e) => {
    e.stopPropagation();
    setDeletingItem(item);
    setDeleteStep("reason");
    setRemovalReason(null);
    setExpandedItem(null);
  };

  const handleReasonSelect = (reason) => {
    setRemovalReason(reason);
    setDeleteStep("grocery");
  };

  const handleGroceryDecision = async (addToGrocery) => {
    try {
      await axios.post("https://listlist-db.onrender.com/api/list_items/archive", {
        listItemId: deletingItem._id,
        removalReason: removalReason,
        addToGrocery: addToGrocery,
        item_id: deletingItem.item_id,
        name: deletingItem.name,
        amount: deletingItem.acquired_amount || 1
      });

      setDeletingItem(null);
      setDeleteStep(null);
      setRemovalReason(null);

      if (onItemRemoved) {
        onItemRemoved();
      }
    } catch (error) {
      console.error("Error archiving item:", error);
      alert("Error removing item. Please try again.");
    }
  };

  const handleCancel = () => {
    setDeletingItem(null);
    setDeleteStep(null);
    setRemovalReason(null);
  };

  const toggleExpand = (item) => {
    if (deletingItem) return;
    setExpandedItem(expandedItem?._id === item._id ? null : item);
    setMovingItem(null);
  };

  const handleMoveClick = (item, e) => {
    e.stopPropagation();
    setMovingItem(movingItem?._id === item._id ? null : item);
  };

  const handleMoveToLocation = async (item, newLocation) => {
    try {
      await axios.patch(`https://listlist-db.onrender.com/api/list_items/${item._id}`, {
        storage_space: newLocation
      });
      setMovingItem(null);
      setExpandedItem(null);
      if (onItemRemoved) {
        onItemRemoved();
      }
    } catch (error) {
      console.error("Error moving item:", error);
      alert("Error moving item. Please try again.");
    }
  };

  const getTitle = () => {
    if (groupBy === "storage") {
      return keyword;
    }
    return keyList[0]?.category || keyword;
  };

  const renderItem = (item) => {
    if (deletingItem && deletingItem._id === item._id) {
      return (
        <div className="delete-flow" onClick={(e) => e.stopPropagation()}>
          <p className="delete-item-name">{item.name}</p>
          
          {deleteStep === "reason" && (
            <div className="delete-buttons">
              <button 
                className="delete-option-btn finished-btn"
                onClick={() => handleReasonSelect("finished")}
              >
                finished?
              </button>
              <button 
                className="delete-option-btn expired-btn"
                onClick={() => handleReasonSelect("expired")}
              >
                expired?
              </button>
              <button 
                className="delete-option-btn trashed-btn"
                onClick={() => handleReasonSelect("trashed")}
              >
                trashed?
              </button>
              <button 
                className="delete-cancel-btn"
                onClick={handleCancel}
              >
                cancel
              </button>
            </div>
          )}

          {deleteStep === "grocery" && (
            <div className="delete-buttons">
              <p>add to grocery list?</p>
              <button 
                className="delete-option-btn yes-btn"
                onClick={() => handleGroceryDecision(true)}
              >
                yes
              </button>
              <button 
                className="delete-option-btn no-btn"
                onClick={() => handleGroceryDecision(false)}
              >
                no
              </button>
            </div>
          )}

          {deleteStep === "empty" && (
            <div className="delete-buttons">
              <p>All used up! Add to grocery list?</p>
              <button 
                className="delete-option-btn yes-btn"
                onClick={() => handleGroceryDecision(true)}
              >
                yes
              </button>
              <button 
                className="delete-option-btn no-btn"
                onClick={() => handleGroceryDecision(false)}
              >
                no
              </button>
            </div>
          )}
        </div>
      );
    }
    
    if (expandedItem?._id === item._id) {
      const usesRemaining = getUsesRemaining(item);
      const useUnitDisplay = item.use_unit === "self" ? item.name : item.use_unit;
      const isOpen = !!item.opened_date;
      const isEditing = editingItem === item.item_id;
      
      // Edit mode - show form
      if (isEditing) {
        return (
          <div className="item-card item-edit-card" onClick={(e) => e.stopPropagation()}>
            <div className="item-card-header">
              <h4>Edit: {item.name}</h4>
              <button className="delete-x-btn" onClick={handleCancelEditItem}>✕</button>
            </div>
            
            <div className="edit-mode-toggle">
              <button 
                className={`mode-btn ${editMode === "quick" ? "active" : ""}`}
                onClick={() => setEditMode("quick")}
              >
                Quick Edit
              </button>
              <button 
                className={`mode-btn ${editMode === "full" ? "active" : ""}`}
                onClick={() => setEditMode("full")}
              >
                Full Details
              </button>
            </div>

            <div className="item-edit-form">
              {/* Quick Edit Fields */}
              <div className="edit-field">
                <label>Name</label>
                <input
                  name="name"
                  type="text"
                  value={editForm.name}
                  onChange={handleEditFormChange}
                />
              </div>

              <div className="edit-row">
                <div className="edit-field half">
                  <label>Category</label>
                  <CreatableSelect
                    name="category"
                    value={editForm.category}
                    onChange={handleEditFormChange}
                    options={options.category}
                    onAddOption={addOption}
                  />
                </div>
                <div className="edit-field half">
                  <label>Purchase Unit</label>
                  <CreatableSelect
                    name="purchase_unit"
                    value={editForm.purchase_unit}
                    onChange={handleEditFormChange}
                    options={options.purchase_unit}
                    onAddOption={addOption}
                  />
                </div>
              </div>

              <div className="edit-row">
                <div className="edit-field half">
                  <label>Cost ($)</label>
                  <input
                    name="cost"
                    type="number"
                    step="0.01"
                    value={editForm.cost}
                    onChange={handleEditFormChange}
                  />
                </div>
                <div className="edit-field half">
                  <label>Storage</label>
                  <CreatableSelect
                    name="storage_space"
                    value={editForm.storage_space}
                    onChange={handleEditFormChange}
                    options={options.storage_space}
                    onAddOption={addOption}
                  />
                </div>
              </div>

              {/* Full Details Fields */}
              {editMode === "full" && (
                <>
                  <hr className="edit-divider" />
                  
                  <div className="edit-row">
                    <div className="edit-field half">
                      <label>Use Unit</label>
                      <CreatableSelect
                        name="use_unit"
                        value={editForm.use_unit}
                        onChange={handleEditFormChange}
                        options={[
                          { value: "self", label: "whole item" },
                          ...options.use_unit.filter(o => o !== "self"),
                        ]}
                        onAddOption={addOption}
                      />
                    </div>
                    <div className="edit-field half">
                      <label>Uses per {editForm.purchase_unit}</label>
                      <input
                        name="use_per_unit"
                        type="number"
                        min="1"
                        value={editForm.use_per_unit}
                        onChange={handleEditFormChange}
                      />
                    </div>
                  </div>

                  <div className="edit-row">
                    <div className="edit-field half">
                      <label>Perishable?</label>
                      <select name="perishable" value={editForm.perishable} onChange={handleEditFormChange}>
                        <option value="true">Yes</option>
                        <option value="false">No</option>
                      </select>
                    </div>
                    <div className="edit-field half">
                      <label>Expires after</label>
                      <select name="time_to_expire" value={editForm.time_to_expire} onChange={handleEditFormChange}>
                        {EXPIRATION_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="edit-row">
                    <div className="edit-field half">
                      <label>Storage Size</label>
                      <select name="storage_size" value={editForm.storage_size} onChange={handleEditFormChange}>
                        <option value="">— none —</option>
                        <option value="pint">pint</option>
                        <option value="quart">quart</option>
                        <option value="half_gallon">half gallon</option>
                        <option value="gallon">gallon</option>
                      </select>
                    </div>
                    <div className="edit-field half">
                      <label>Brand matters?</label>
                      <select name="brand_matters" value={editForm.brand_matters} onChange={handleEditFormChange}>
                        <option value="no">No</option>
                        <option value="yes">Yes</option>
                      </select>
                    </div>
                  </div>

                  {editForm.brand_matters === "yes" && (
                    <div className="edit-field">
                      <label>Preferred Brand</label>
                      <input
                        name="brand"
                        type="text"
                        value={editForm.brand}
                        onChange={handleEditFormChange}
                      />
                    </div>
                  )}

                  <div className="edit-row">
                    <div className="edit-field half">
                      <label>Breaks down?</label>
                      <select name="breaks_down" value={editForm.breaks_down} onChange={handleEditFormChange}>
                        <option value="no">No</option>
                        <option value="yes">Yes</option>
                      </select>
                    </div>
                    <div className="edit-field half">
                      {/* Placeholder for alignment */}
                    </div>
                  </div>

                  {editForm.breaks_down === "yes" && (
                    <div className="edit-row">
                      <div className="edit-field half">
                        <label>Breaks into #1</label>
                        <input
                          name="breaks_into_1"
                          type="text"
                          value={editForm.breaks_into_1}
                          onChange={handleEditFormChange}
                        />
                      </div>
                      <div className="edit-field half">
                        <label>Breaks into #2</label>
                        <input
                          name="breaks_into_2"
                          type="text"
                          value={editForm.breaks_into_2}
                          onChange={handleEditFormChange}
                        />
                      </div>
                    </div>
                  )}
                </>
              )}

              <div className="edit-actions">
                <button className="save-edit-btn" onClick={(e) => handleSaveEditItem(item, e)}>
                  Save Changes
                </button>
                <button className="cancel-edit-btn" onClick={handleCancelEditItem}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        );
      }
      
      // View mode - show details
      return (
        <div className="item-card" onClick={(e) => e.stopPropagation()}>
          <div className="item-card-header">
            <h4>{item.name} {renderOpenTag(item)}</h4>
            <button 
              className="delete-x-btn"
              onClick={(e) => handleDeleteClick(item, e)}
            >
              ✕
            </button>
          </div>
          <div className="item-card-details">
            <p><strong>Amount:</strong> {item.acquired_amount || item.amount_left} {item.purchase_unit}</p>
            <p><strong>Uses remaining:</strong> {usesRemaining} {useUnitDisplay}{usesRemaining !== 1 ? 's' : ''}</p>
            <p><strong>Category:</strong> {item.category}</p>
            <p><strong>Location:</strong> {item.storage_space || "fridge"}</p>
            {item.storage_size && <p><strong>Container:</strong> {item.storage_size.replace('_', ' ')}</p>}
            <p><strong>Purchased:</strong> {item.purchase_date}</p>
            {item.time_to_expire && (
              <p><strong>Expires:</strong> {formatExpiration(item.time_to_expire, item.opened_date)}</p>
            )}
          </div>
          <div className="item-card-actions">
            {!isOpen && (
              <button 
                className="open-btn"
                onClick={(e) => handleOpenItem(item, e)}
                disabled={openingItem === item._id}
              >
                {openingItem === item._id ? "opening..." : "mark as open"}
              </button>
            )}
            <button 
              className="use-btn"
              onClick={(e) => handleUseItem(item, e)}
              disabled={usingItem === item._id}
            >
              {usingItem === item._id ? "using..." : `use 1 ${useUnitDisplay}`}
            </button>
            {isEdible(item) && onCookItem && (
              <button 
                className="cook-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onCookItem(item);
                }}
              >
                cook with this
              </button>
            )}
            {getSplitOptions(item).length > 0 && (
              <button 
                className="split-btn"
                onClick={(e) => handleSplitClick(item, e)}
              >
                split...
              </button>
            )}
            {canBreakDown(item) && (
              <button 
                className="breakdown-btn"
                onClick={(e) => handleBreakDown(item, e)}
              >
                break down
              </button>
            )}
            <button 
              className="move-btn"
              onClick={(e) => handleMoveClick(item, e)}
            >
              move to...
            </button>
            <button 
              className="edit-item-btn"
              onClick={(e) => handleStartEditItem(item, e)}
            >
              edit item
            </button>
          </div>
          {splittingItem?._id === item._id && (
            <div className="split-options">
              <p className="split-label">Split into:</p>
              {getSplitOptions(item).map(option => (
                <button
                  key={option.targetSize}
                  className="split-option-btn"
                  onClick={() => handleSplitItem(item, option.targetSize, option.count)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
          {movingItem?._id === item._id && (
            <div className="move-options">
              {STORAGE_LOCATIONS.filter(loc => loc !== (item.storage_space || "fridge").toLowerCase()).map(location => (
                <button
                  key={location}
                  className="move-location-btn"
                  onClick={() => handleMoveToLocation(item, location)}
                >
                  {location}
                </button>
              ))}
            </div>
          )}
          <button 
            className="collapse-btn"
            onClick={() => setExpandedItem(null)}
          >
            collapse
          </button>
        </div>
      );
    }
    
    return (
      <>
        <p>
          {item.acquired_amount || item.amount_left} {item.purchase_unit} of {item.name}
          {renderOpenTag(item)}
        </p>
        <p>{item.purchase_date}</p>
        <button 
          className="delete-x-btn"
          onClick={(e) => handleDeleteClick(item, e)}
        >
          ✕
        </button>
      </>
    );
  };

  const subgroups = getSubgroups();

  return (
    <>
      {keyList.length ? (
        <div className={groupBy === "storage" ? `storage-${keyword}` : keyword}>
          <h3 className="category-header" onClick={() => setIsCollapsed(!isCollapsed)}>
            {isCollapsed ? `${getTitle()} — ${keyList.length} items` : getTitle()}
          </h3>
          {!isCollapsed && (
            <div className="list_container">
              {subgroups.map(subgroup => {
                const subItems = getItemsForSubgroup(subgroup);
                const isSubCollapsed = collapsedSubgroups[subgroup];
                const subgroupLabel = subgroup;
                const subgroupColor = groupBy === "category" 
                  ? STORAGE_COLORS[subgroup] || "#f5f5f5"
                  : CATEGORY_COLORS[subgroup] || "#f5f5f5";
                
                const itemGroups = groupItemsByName(subItems);
                const itemGroupNames = Object.keys(itemGroups).sort();
                
                return (
                  <div key={subgroup} className="subgroup">
                    <h4 
                      className="subgroup-header" 
                      onClick={() => toggleSubgroup(subgroup)}
                      style={{ backgroundColor: subgroupColor }}
                    >
                      {isSubCollapsed 
                        ? `${subgroupLabel} — ${subItems.length} items` 
                        : subgroupLabel}
                    </h4>
                    {!isSubCollapsed && itemGroupNames.map(itemName => {
                      const itemsInGroup = itemGroups[itemName];
                      const groupKey = `${subgroup}-${itemName}`;
                      const isItemGroupCollapsed = collapsedItemGroups[groupKey] !== false; // Default to collapsed
                      const categoryColor = CATEGORY_COLORS[itemsInGroup[0]?.category] || "#ddd";
                      const displayName = itemsInGroup[0]?.name || itemName;
                      
                      // Calculate total amount
                      const totalAmount = itemsInGroup.reduce((sum, item) => 
                        sum + (item.acquired_amount || item.amount_left || 1), 0
                      );
                      const unit = itemsInGroup[0]?.purchase_unit || "items";
                      
                      return (
                        <div key={groupKey} className="item-group">
                          <div 
                            className="item-group-header"
                            onClick={() => toggleItemGroup(groupKey)}
                            style={{ borderLeftColor: categoryColor }}
                          >
                            {isItemGroupCollapsed 
                              ? `${displayName} — ${totalAmount} ${unit}` 
                              : displayName}
                          </div>
                          {!isItemGroupCollapsed && itemsInGroup.map((item) => {
                            return (
                              <div 
                                className={`item ${expandedItem?._id === item._id ? 'item-expanded' : ''}`} 
                                key={item._id}
                                onClick={() => toggleExpand(item)}
                                style={{ borderLeft: `4px solid ${categoryColor}` }}
                              >
                                {renderItem(item)}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : null}

    </>
  );
};

export default PantryList;
