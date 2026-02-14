import React, { useState } from "react";
import axios from "axios";

const STORAGE_LOCATIONS = ["counter", "pantry", "fridge", "freezer", "closet"];
const CATEGORIES = ["vegetable", "herbs", "fruit", "grains", "meat", "dairy", "household", "snack", "drinks"];

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

const PantryList = ({ array, keyword, onItemRemoved, groupBy = "category" }) => {
  const [deletingItem, setDeletingItem] = useState(null);
  const [deleteStep, setDeleteStep] = useState(null);
  const [removalReason, setRemovalReason] = useState(null);
  const [expandedItem, setExpandedItem] = useState(null);
  const [movingItem, setMovingItem] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [collapsedSubgroups, setCollapsedSubgroups] = useState({});

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
      // Grouped by location, subgroup by category
      return CATEGORIES.filter(cat => keyList.some(item => item.category === cat));
    } else {
      // Grouped by category, subgroup by location
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

  const toggleSubgroup = (subgroup) => {
    setCollapsedSubgroups(prev => ({
      ...prev,
      [subgroup]: !prev[subgroup]
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
    const categoryColor = CATEGORY_COLORS[item.category] || "#ddd";
    
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
        </div>
      );
    }
    
    if (expandedItem?._id === item._id) {
      return (
        <div className="item-card" onClick={(e) => e.stopPropagation()}>
          <div className="item-card-header">
            <h4>{item.name}</h4>
            <button 
              className="delete-x-btn"
              onClick={(e) => handleDeleteClick(item, e)}
            >
              ✕
            </button>
          </div>
          <div className="item-card-details">
            <p><strong>Amount:</strong> {item.acquired_amount || item.amount_left} {item.purchase_unit}</p>
            <p><strong>Category:</strong> {item.category}</p>
            <p><strong>Location:</strong> {item.storage_space || "fridge"}</p>
            <p><strong>Purchased:</strong> {item.purchase_date}</p>
            {item.time_to_expire && <p><strong>Expires:</strong> {item.time_to_expire}</p>}
          </div>
          <div className="item-card-actions">
            <button 
              className="move-btn"
              onClick={(e) => handleMoveClick(item, e)}
            >
              move to...
            </button>
          </div>
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
        <p>{item.acquired_amount || item.amount_left} {item.purchase_unit} of {item.name}</p>
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
                const subgroupLabel = groupBy === "storage" ? subgroup : subgroup;
                
                return (
                  <div key={subgroup} className="subgroup">
                    <h4 
                      className="subgroup-header" 
                      onClick={() => toggleSubgroup(subgroup)}
                    >
                      {isSubCollapsed 
                        ? `${subgroupLabel} — ${subItems.length} items` 
                        : subgroupLabel}
                    </h4>
                    {!isSubCollapsed && subItems.map((item) => {
                      const categoryColor = CATEGORY_COLORS[item.category] || "#ddd";
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
          )}
        </div>
      ) : null}
    </>
  );
};

export default PantryList;
