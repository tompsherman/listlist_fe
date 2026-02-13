import React, { useState } from "react";
import axios from "axios";

const STORAGE_LOCATIONS = ["counter", "pantry", "fridge", "freezer", "closet"];

const PantryList = ({ array, keyword, onItemRemoved, groupBy = "category" }) => {
  const [deletingItem, setDeletingItem] = useState(null);
  const [deleteStep, setDeleteStep] = useState(null);
  const [removalReason, setRemovalReason] = useState(null);
  const [expandedItem, setExpandedItem] = useState(null);
  const [movingItem, setMovingItem] = useState(null);

  // Filter by category or storage_space based on groupBy prop
  // Debug: log first item to see available fields
  if (array.length > 0 && groupBy === "storage") {
    console.log("PantryList item fields:", Object.keys(array[0]), "storage_space:", array[0].storage_space);
  }
  
  const keyList = array.filter((item) => {
    if (groupBy === "storage") {
      // Handle case where storage_space might be missing or have different casing
      const itemStorage = (item.storage_space || "fridge").toLowerCase();
      return itemStorage === keyword.toLowerCase();
    }
    return item.category === keyword;
  });

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

  // Get display title based on groupBy
  const getTitle = () => {
    if (groupBy === "storage") {
      return keyword; // storage_space name
    }
    return keyList[0]?.category || keyword;
  };

  return (
    <>
      {keyList.length ? (
        <div className={groupBy === "storage" ? `storage-${keyword}` : keyword}>
          <h3>{getTitle()}</h3>
          <div className="list_container">
            {keyList.map((item) => (
              <div 
                className={`item ${expandedItem?._id === item._id ? 'item-expanded' : ''}`} 
                key={item._id}
                onClick={() => toggleExpand(item)}
              >
                {deletingItem && deletingItem._id === item._id ? (
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
                ) : expandedItem?._id === item._id ? (
                  // Expanded card view
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
                      <p><strong>Location:</strong> {item.storage_space}</p>
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
                        {STORAGE_LOCATIONS.filter(loc => loc !== item.storage_space).map(location => (
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
                ) : (
                  // Collapsed item display
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
                )}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </>
  );
};

export default PantryList;
