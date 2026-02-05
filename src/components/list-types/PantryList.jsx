import React, { useState } from "react";
import axios from "axios";

const PantryList = ({ array, keyword, onItemRemoved }) => {
  const [deletingItem, setDeletingItem] = useState(null); // item being deleted
  const [deleteStep, setDeleteStep] = useState(null); // "reason" | "grocery"
  const [removalReason, setRemovalReason] = useState(null); // "finished" | "expired"

  const keyList = array.filter((item) => item.category === keyword);

  const handleDeleteClick = (item) => {
    setDeletingItem(item);
    setDeleteStep("reason");
    setRemovalReason(null);
  };

  const handleReasonSelect = (reason) => {
    setRemovalReason(reason);
    setDeleteStep("grocery");
  };

  const handleGroceryDecision = async (addToGrocery) => {
    try {
      console.log("Archiving item:", deletingItem, "reason:", removalReason, "addToGrocery:", addToGrocery);
      
      await axios.post("https://listlist-db.onrender.com/api/list_items/archive", {
        listItemId: deletingItem._id,
        removalReason: removalReason,
        addToGrocery: addToGrocery,
        item_id: deletingItem.item_id,
        name: deletingItem.name,
        amount: deletingItem.acquired_amount || 1
      });

      // Reset state
      setDeletingItem(null);
      setDeleteStep(null);
      setRemovalReason(null);

      // Trigger refresh if callback provided
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

  return (
    <>
      {keyList.length ? (
        <div className={keyword}>
          <h3>{keyList[0].category}</h3>
          <div className="list_container">
            {keyList.map((item) => (
              <div className="item" key={item._id}>
                {deletingItem && deletingItem._id === item._id ? (
                  // Delete flow UI
                  <div className="delete-flow">
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
                ) : (
                  // Normal item display
                  <>
                    <p>{item.acquired_amount || item.amount_left}</p>
                    <p>{item.name}</p>
                    <p>{item.purchase_date}</p>
                    <button 
                      className="delete-x-btn"
                      onClick={() => handleDeleteClick(item)}
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
