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

const MealsList = () => {
  const [dishes, setDishes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [groupBy, setGroupBy] = useState("dish_type"); // "dish_type" or "meal_category"
  const [expandedDish, setExpandedDish] = useState(null);

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
  const calculateDishCost = (dish) => {
    if (!dish.ingredients) return 0;
    return dish.ingredients.reduce((total, ing) => {
      return total + (ing.cost || 0) * (ing.amount_used || 1);
    }, 0);
  };

  // Group dishes by selected criteria
  const groupDishes = () => {
    const groups = {};
    
    if (groupBy === "dish_type") {
      // Initialize groups
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
      // Group by meal category
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

  const formatDate = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    return date.toLocaleDateString("en-US", { 
      month: "short", 
      day: "numeric",
      year: "numeric"
    });
  };

  const toggleExpand = (dishId) => {
    setExpandedDish(expandedDish === dishId ? null : dishId);
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
  const labels = groupBy === "dish_type" ? DISH_TYPE_LABELS : MEAL_CATEGORY_LABELS;

  return (
    <div className="meals-list-container">
      <h2 className="centered">🍳 Meals</h2>
      
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

      {dishes.length === 0 ? (
        <div className="empty-meals">
          <p>No dishes cooked yet!</p>
          <p className="hint">Go to Inventory and cook something 🍳</p>
        </div>
      ) : (
        Object.entries(groupedDishes).map(([groupKey, groupDishes]) => {
          if (groupDishes.length === 0 && groupKey !== "uncategorized") return null;
          if (groupKey === "uncategorized" && groupDishes.length === 0) return null;
          
          const label = labels[groupKey] || "📋 Other";
          
          return (
            <div key={groupKey} className="meals-group">
              <h3 className="meals-group-header">{label}</h3>
              <div className="meals-cards">
                {groupDishes.map(dish => {
                  const cost = calculateDishCost(dish);
                  const isExpanded = expandedDish === dish._id;
                  
                  return (
                    <div 
                      key={dish._id} 
                      className={`dish-card ${isExpanded ? 'expanded' : ''}`}
                      onClick={() => toggleExpand(dish._id)}
                    >
                      <div className="dish-card-header">
                        <h4 className="dish-name">{dish.name}</h4>
                        <span className="dish-servings">{dish.servings} servings</span>
                      </div>
                      
                      <div className="dish-card-meta">
                        <span className="dish-date">{formatDate(dish.created_timestamp)}</span>
                        {cost > 0 && <span className="dish-cost">${cost.toFixed(2)}</span>}
                      </div>

                      {/* Expanded view - ingredients */}
                      {isExpanded && dish.ingredients && (
                        <div className="dish-ingredients">
                          <h5>Ingredients:</h5>
                          <ul>
                            {dish.ingredients.map((ing, idx) => {
                              const color = CATEGORY_COLORS[ing.category] || "#ddd";
                              return (
                                <li 
                                  key={idx} 
                                  className="dish-ingredient"
                                  style={{ borderLeftColor: color }}
                                >
                                  <span className="ing-name">{ing.name}</span>
                                  <span className="ing-amount">
                                    {ing.amount_used} {ing.use_unit}
                                  </span>
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      )}

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
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

export default MealsList;
