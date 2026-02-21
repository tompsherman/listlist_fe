import React, { useState } from "react";
import axios from "axios";
import { useUser } from "../../context/UserContext";

const GeneralList = ({ array, keyword, onItemRemoved }) => {
  const { canModifyItems } = useUser();
  const [deletingItem, setDeletingItem] = useState(null);
  const [expandedItem, setExpandedItem] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const keyList = array.filter((item) => item.category === keyword);

  const handleDeleteClick = (item, e) => {
    e.stopPropagation();
    setDeletingItem(item);
    setExpandedItem(null);
  };

  const handleConfirmDelete = async () => {
    try {
      await axios.delete(`https://listlist-db.onrender.com/api/list_items/${deletingItem._id}`);
      setDeletingItem(null);
      if (onItemRemoved) {
        onItemRemoved();
      }
    } catch (error) {
      console.error("Error deleting item:", error);
      alert("Error deleting item. Please try again.");
    }
  };

  const handleCancelDelete = () => {
    setDeletingItem(null);
  };

  const toggleExpand = (item) => {
    if (deletingItem) return;
    setExpandedItem(expandedItem?._id === item._id ? null : item);
  };

  return (
    <>
      {keyList.length ? (
        <div className={keyword}>
          <h3 className="category-header" onClick={() => setIsCollapsed(!isCollapsed)}>
            {isCollapsed ? `${keyList[0].category} — ${keyList.length} items` : keyList[0].category}
          </h3>
          {!isCollapsed && <div className="list_container">
            {keyList.map((item) => (
              <div 
                className={`item ${expandedItem?._id === item._id ? 'item-expanded' : ''}`}
                key={item._id}
                onClick={() => toggleExpand(item)}
              >
                {deletingItem && deletingItem._id === item._id ? (
                  <div className="delete-flow" onClick={(e) => e.stopPropagation()}>
                    <p className="delete-item-name">Remove {item.name}?</p>
                    <div className="delete-buttons">
                      <button 
                        className="delete-option-btn yes-btn"
                        onClick={handleConfirmDelete}
                      >
                        yes
                      </button>
                      <button 
                        className="delete-cancel-btn"
                        onClick={handleCancelDelete}
                      >
                        cancel
                      </button>
                    </div>
                  </div>
                ) : expandedItem?._id === item._id ? (
                  // Expanded card view
                  <div className="item-card" onClick={(e) => e.stopPropagation()}>
                    <div className="item-card-header">
                      <h4>{item.name}</h4>
                      {canModifyItems() && (
                        <button 
                          className="delete-x-btn"
                          onClick={(e) => handleDeleteClick(item, e)}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                    <div className="item-card-details">
                      <p><strong>Need:</strong> {item.desired_amount} {item.purchase_unit}</p>
                      <p><strong>Use unit:</strong> {item.use_unit || "—"}</p>
                      <p><strong>Category:</strong> {item.category}</p>
                      {item.cost && <p><strong>Est. cost:</strong> ${item.cost}</p>}
                      {item.storage_space && <p><strong>Store in:</strong> {item.storage_space}</p>}
                    </div>
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
                    <p>{item.desired_amount} {item.purchase_unit} of {item.name}</p>
                    {canModifyItems() && (
                      <button 
                        className="delete-x-btn"
                        onClick={(e) => handleDeleteClick(item, e)}
                      >
                        ✕
                      </button>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>}
        </div>
      ) : null}
    </>
  );
};

export default GeneralList;
