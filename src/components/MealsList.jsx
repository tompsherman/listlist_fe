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
  other: "#ddd",
};

const DISH_TYPE_LABELS = {
  main: "🍽️ Main Dish",
  side: "🥗 Side Dish",
  dessert: "🍰 Dessert",
};

const MEAL_CATEGORY_LABELS = {
  breakfast: "🌅 Breakfast",
  lunch: "☀️ Lunch",
  dinner: "🌙 Dinner",
  snack: "🍿 Snack",
};

const STORAGE_OPTIONS = [
  { value: "none", label: "No leftovers" },
  { value: "pint", label: "Pint" },
  { value: "quart", label: "Quart" },
  { value: "half_gallon", label: "Half gallon" },
  { value: "gallon", label: "Gallon" },
];

const STORAGE_LOCATIONS = [
  { value: "fridge", label: "Fridge" },
  { value: "freezer", label: "Freezer" },
  { value: "counter", label: "Counter" },
];

const MealsList = () => {
  const [dishes, setDishes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState("grouped"); // "grouped" or "tracker"
  const [groupBy, setGroupBy] = useState("dish_type"); // "dish_type" or "meal_category"
  const [expandedDish, setExpandedDish] = useState(null);
  const [editingDish, setEditingDish] = useState(null);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    fetchDishes();
  }, []);

  const fetchDishes = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get("https://listlist-db.onrender.com/api/dishes/");
      setDishes(response.data);
    } catch (error) {
      console.error("Error fetching dishes:", error);
    }
    setIsLoading(false);
  };

  // Calculate total ingredient cost for a dish
  // Note: ing.cost is already the cost for the amount used (calculated on backend)
  const calculateDishCost = (dish) => {
    if (!dish.ingredients) return 0;
    return dish.ingredients.reduce((total, ing) => {
      return total + (parseFloat(ing.cost) || 0);
    }, 0);
  };

  // Format use_unit - handle "self" case
  const formatUseUnit = (useUnit, name, amount) => {
    if (useUnit === "self" || !useUnit) {
      // Pluralize if amount > 1
      if (amount > 1 && !name.endsWith("s")) {
        return name + "s";
      }
      return name;
    }
    return useUnit;
  };

  // Group dishes by selected criteria
  const groupDishes = () => {
    const groups = {};
    
    if (groupBy === "dish_type") {
      Object.keys(DISH_TYPE_LABELS).forEach(type => {
        groups[type] = [];
      });
      groups["uncategorized"] = [];
      
      dishes.forEach(dish => {
        const type = dish.dish_type || "uncategorized";
        if (groups[type]) {
          groups[type].push(dish);
        } else {
          groups["uncategorized"].push(dish);
        }
      });
    } else {
      Object.keys(MEAL_CATEGORY_LABELS).forEach(cat => {
        groups[cat] = [];
      });
      groups["uncategorized"] = [];
      
      dishes.forEach(dish => {
        const cat = dish.meal_category || "uncategorized";
        if (groups[cat]) {
          groups[cat].push(dish);
        } else {
          groups["uncategorized"].push(dish);
        }
      });
    }
    
    return groups;
  };

  // Get dishes sorted by most recent for tracker view
  const getTrackerDishes = () => {
    return [...dishes].sort((a, b) => {
      return (b.created_timestamp || 0) - (a.created_timestamp || 0);
    });
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    return date.toLocaleDateString("en-US", { 
      month: "short", 
      day: "numeric",
      year: "numeric"
    });
  };

  const formatDateTime = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    return date.toLocaleDateString("en-US", { 
      weekday: "short",
      month: "short", 
      day: "numeric",
      hour: "numeric",
      minute: "2-digit"
    });
  };

  const toggleExpand = (dishId) => {
    setExpandedDish(expandedDish === dishId ? null : dishId);
  };

  // Edit dish handlers
  const handleEditClick = (e, dish) => {
    e.stopPropagation();
    setEditingDish(dish._id);
    setEditForm({
      name: dish.name || "",
      servings: dish.servings || 1,
      leftover_storage: dish.leftover_storage || "none",
      storage_space: dish.storage_space || "fridge",
      dish_type: dish.dish_type || "main",
      meal_category: dish.meal_category || "dinner",
    });
  };

  const handleEditSave = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`https://listlist-db.onrender.com/api/dishes/${editingDish}`, editForm);
      setEditingDish(null);
      fetchDishes();
    } catch (error) {
      console.error("Error updating dish:", error);
      alert("Error saving changes");
    }
  };

  const handleEditCancel = () => {
    setEditingDish(null);
    setEditForm({});
  };

  // Delete dish
  const handleDelete = async (e, dishId) => {
    e.stopPropagation();
    if (!window.confirm("Delete this dish from your history?")) return;
    
    try {
      await axios.delete(`https://listlist-db.onrender.com/api/dishes/${dishId}`);
      fetchDishes();
      if (expandedDish === dishId) setExpandedDish(null);
    } catch (error) {
      console.error("Error deleting dish:", error);
      alert("Error deleting dish");
    }
  };

  // Render a dish card
  const renderDishCard = (dish, showDate = false) => {
    const cost = calculateDishCost(dish);
    const isExpanded = expandedDish === dish._id;
    const isEditing = editingDish === dish._id;
    
    return (
      <div 
        key={dish._id} 
        className={`dish-card ${isExpanded ? 'expanded' : ''}`}
        onClick={() => !isEditing && toggleExpand(dish._id)}
      >
        {/* Edit Modal */}
        {isEditing ? (
          <form className="dish-edit-form" onClick={(e) => e.stopPropagation()} onSubmit={handleEditSave}>
            <div className="edit-field">
              <label>Name:</label>
              <input 
                type="text" 
                value={editForm.name} 
                onChange={(e) => setEditForm({...editForm, name: e.target.value})}
              />
            </div>
            <div className="edit-field">
              <label>Servings:</label>
              <input 
                type="number" 
                min="1"
                value={editForm.servings} 
                onChange={(e) => setEditForm({...editForm, servings: parseInt(e.target.value) || 1})}
              />
            </div>
            <div className="edit-field">
              <label>Dish Type:</label>
              <select 
                value={editForm.dish_type} 
                onChange={(e) => setEditForm({...editForm, dish_type: e.target.value})}
              >
                {Object.entries(DISH_TYPE_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
            <div className="edit-field">
              <label>Meal Time:</label>
              <select 
                value={editForm.meal_category} 
                onChange={(e) => setEditForm({...editForm, meal_category: e.target.value})}
              >
                {Object.entries(MEAL_CATEGORY_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
            <div className="edit-field">
              <label>Leftover Size:</label>
              <select 
                value={editForm.leftover_storage} 
                onChange={(e) => setEditForm({...editForm, leftover_storage: e.target.value})}
              >
                {STORAGE_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div className="edit-field">
              <label>Storage Location:</label>
              <select 
                value={editForm.storage_space} 
                onChange={(e) => setEditForm({...editForm, storage_space: e.target.value})}
              >
                {STORAGE_LOCATIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div className="edit-actions">
              <button type="submit" className="save-btn">Save</button>
              <button type="button" className="cancel-btn" onClick={handleEditCancel}>Cancel</button>
            </div>
          </form>
        ) : (
          <>
            <div className="dish-card-header">
              <h4 className="dish-name">{dish.name}</h4>
              <div className="dish-actions">
                <button className="edit-btn" onClick={(e) => handleEditClick(e, dish)}>✏️</button>
                <button className="delete-btn" onClick={(e) => handleDelete(e, dish._id)}>🗑️</button>
              </div>
            </div>
            
            <div className="dish-card-meta">
              <span className="dish-servings">{dish.servings} servings</span>
              <span className="dish-date">{showDate ? formatDateTime(dish.created_timestamp) : formatDate(dish.created_timestamp)}</span>
              {cost > 0 && <span className="dish-cost">${cost.toFixed(2)}</span>}
            </div>

            {/* Dish type/category badges */}
            <div className="dish-badges">
              {dish.dish_type && (
                <span className={`badge badge-${dish.dish_type}`}>
                  {dish.dish_type}
                </span>
              )}
              {dish.meal_category && (
                <span className={`badge badge-${dish.meal_category}`}>
                  {dish.meal_category}
                </span>
              )}
              {dish.leftover_storage && dish.leftover_storage !== "none" && (
                <span className="badge badge-leftover">
                  🥡 {dish.leftover_storage.replace("_", " ")}
                </span>
              )}
              {dish.storage_space && dish.storage_space !== "fridge" && (
                <span className="badge badge-storage">
                  📍 {dish.storage_space}
                </span>
              )}
            </div>

            {/* Expanded view - ingredients */}
            {isExpanded && dish.ingredients && dish.ingredients.length > 0 && (
              <div className="dish-ingredients">
                <h5>Ingredients:</h5>
                <ul>
                  {dish.ingredients.map((ing, idx) => {
                    const color = CATEGORY_COLORS[ing.category] || CATEGORY_COLORS.other;
                    const unitDisplay = formatUseUnit(ing.use_unit, ing.name, ing.amount_used);
                    return (
                      <li 
                        key={idx} 
                        className="dish-ingredient"
                        style={{ borderLeftColor: color }}
                      >
                        <span className="ing-name">{ing.name}</span>
                        <span className="ing-amount">
                          {ing.amount_used} {unitDisplay}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="meals-list-container">
        <h2 className="centered">🍳 Meals</h2>
        <div className="loading-screen">
          <p>Loading dishes...</p>
        </div>
      </div>
    );
  }

  const groupedDishes = groupDishes();
  const trackerDishes = getTrackerDishes();
  const labels = groupBy === "dish_type" ? DISH_TYPE_LABELS : MEAL_CATEGORY_LABELS;

  return (
    <div className="meals-list-container">
      <h2 className="centered">🍳 Meals</h2>
      
      {/* View mode toggle */}
      <div className="view-toggle">
        <button 
          className={`toggle-btn ${viewMode === "grouped" ? "active" : ""}`}
          onClick={() => setViewMode("grouped")}
        >
          📋 Grouped
        </button>
        <button 
          className={`toggle-btn ${viewMode === "tracker" ? "active" : ""}`}
          onClick={() => setViewMode("tracker")}
        >
          📅 Tracker
        </button>
      </div>

      {dishes.length === 0 ? (
        <div className="empty-meals">
          <p>No dishes cooked yet!</p>
          <p className="hint">Go to Inventory and cook something 🍳</p>
        </div>
      ) : viewMode === "tracker" ? (
        /* Tracker View - Chronological */
        <div className="tracker-view">
          <h3 className="tracker-header">📅 Recent Meals</h3>
          <div className="meals-cards">
            {trackerDishes.map(dish => renderDishCard(dish, true))}
          </div>
        </div>
      ) : (
        /* Grouped View */
        <>
          {/* Group by toggle */}
          <div className="group-toggle">
            <span>Group by: </span>
            <button 
              className={`toggle-btn ${groupBy === "dish_type" ? "active" : ""}`}
              onClick={() => setGroupBy("dish_type")}
            >
              dish type
            </button>
            <button 
              className={`toggle-btn ${groupBy === "meal_category" ? "active" : ""}`}
              onClick={() => setGroupBy("meal_category")}
            >
              meal time
            </button>
          </div>

          {Object.entries(groupedDishes).map(([groupKey, groupDishes]) => {
            if (groupDishes.length === 0 && groupKey !== "uncategorized") return null;
            if (groupKey === "uncategorized" && groupDishes.length === 0) return null;
            
            const label = labels[groupKey] || "📋 Other";
            
            return (
              <div key={groupKey} className="meals-group">
                <h3 className="meals-group-header">{label}</h3>
                <div className="meals-cards">
                  {groupDishes.map(dish => renderDishCard(dish, false))}
                </div>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
};

export default MealsList;
