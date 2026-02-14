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

const STORAGE_OPTIONS = [
  { value: "none", label: "No leftovers" },
  { value: "pint", label: "Pint" },
  { value: "quart", label: "Quart" },
  { value: "half_gallon", label: "Half gallon" },
  { value: "gallon", label: "Gallon" },
];

// Filter out household items
const isEdible = (item) => item?.category !== "household";

const CookDish = ({ initialIngredient, pantryItems, pantryListId, onClose, onCooked }) => {
  const [dishName, setDishName] = useState("");
  const [existingDishes, setExistingDishes] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [servings, setServings] = useState(1);
  const [leftoverStorage, setLeftoverStorage] = useState("none");
  const [searchIngredient, setSearchIngredient] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter pantry items to only edible ones
  const ediblePantryItems = pantryItems.filter(isEdible);

  // Initialize with the first ingredient
  useEffect(() => {
    if (initialIngredient) {
      const usePerUnit = initialIngredient.use_per_unit || 1;
      const usesRemaining = initialIngredient.uses_remaining ?? 
        ((initialIngredient.acquired_amount || 1) * usePerUnit);
      
      setIngredients([{
        listItemId: initialIngredient._id,
        name: initialIngredient.name,
        amountUsed: 1,
        maxAmount: usesRemaining,
        useUnit: initialIngredient.use_unit === "self" ? initialIngredient.name : initialIngredient.use_unit,
        category: initialIngredient.category,
      }]);
    }
  }, [initialIngredient]);

  // Search existing dishes as user types
  useEffect(() => {
    if (dishName.length >= 2) {
      axios.get(`https://listlist-db.onrender.com/api/dishes/search?q=${encodeURIComponent(dishName)}`)
        .then(res => setExistingDishes(res.data))
        .catch(err => console.error("Error searching dishes:", err));
    } else {
      setExistingDishes([]);
    }
  }, [dishName]);

  const handleAddIngredient = (item) => {
    // Check if already added
    if (ingredients.some(ing => ing.listItemId === item._id)) {
      return;
    }

    const usePerUnit = item.use_per_unit || 1;
    const usesRemaining = item.uses_remaining ?? 
      ((item.acquired_amount || 1) * usePerUnit);

    setIngredients([...ingredients, {
      listItemId: item._id,
      name: item.name,
      amountUsed: 1,
      maxAmount: usesRemaining,
      useUnit: item.use_unit === "self" ? item.name : item.use_unit,
      category: item.category,
    }]);
    setSearchIngredient("");
  };

  const handleRemoveIngredient = (listItemId) => {
    setIngredients(ingredients.filter(ing => ing.listItemId !== listItemId));
  };

  const handleAmountChange = (listItemId, newAmount) => {
    setIngredients(ingredients.map(ing => 
      ing.listItemId === listItemId 
        ? { ...ing, amountUsed: Math.min(Math.max(1, newAmount), ing.maxAmount) }
        : ing
    ));
  };

  const handleSelectExistingDish = (dish) => {
    setDishName(dish.name);
    setServings(dish.servings || 1);
    setLeftoverStorage(dish.leftover_storage || "none");
    setExistingDishes([]);
    // Could also pre-populate ingredients based on dish recipe
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!dishName.trim()) {
      alert("Please enter a dish name");
      return;
    }
    if (ingredients.length === 0) {
      alert("Please add at least one ingredient");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await axios.post("https://listlist-db.onrender.com/api/dishes/cook", {
        name: dishName.trim(),
        ingredients: ingredients.map(ing => ({
          listItemId: ing.listItemId,
          amountUsed: ing.amountUsed,
        })),
        servings,
        leftoverStorage,
        pantryListId,
      });

      console.log("COOK response:", response.data);
      
      if (onCooked) {
        onCooked();
      }
      onClose();
    } catch (error) {
      console.error("Error cooking dish:", error);
      alert("Error cooking dish. Please try again.");
      setIsSubmitting(false);
    }
  };

  // Filter pantry items for search
  const filteredPantryItems = searchIngredient.length > 0
    ? ediblePantryItems.filter(item => 
        item.name.toLowerCase().includes(searchIngredient.toLowerCase()) &&
        !ingredients.some(ing => ing.listItemId === item._id)
      )
    : [];

  return (
    <div className="cook-dish-overlay" onClick={onClose}>
      <div className="cook-dish-modal" onClick={(e) => e.stopPropagation()}>
        <div className="cook-dish-header">
          <h2>🍳 Cook a Dish</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Dish Name */}
          <div className="cook-field">
            <label>Dish Name:</label>
            <input
              type="text"
              value={dishName}
              onChange={(e) => setDishName(e.target.value)}
              placeholder="What are you making?"
              autoFocus
            />
            {existingDishes.length > 0 && (
              <div className="existing-dishes">
                {existingDishes.map(dish => (
                  <div 
                    key={dish._id} 
                    className="existing-dish"
                    onClick={() => handleSelectExistingDish(dish)}
                  >
                    {dish.name} ({dish.servings} servings)
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Ingredients */}
          <div className="cook-field">
            <label>Ingredients:</label>
            <div className="ingredients-list">
              {ingredients.map(ing => {
                const color = CATEGORY_COLORS[ing.category] || "#ddd";
                return (
                  <div key={ing.listItemId} className="ingredient-row" style={{ borderLeftColor: color }}>
                    <span className="ingredient-name">{ing.name}</span>
                    <div className="ingredient-amount">
                      <button 
                        type="button"
                        onClick={() => handleAmountChange(ing.listItemId, ing.amountUsed - 1)}
                        disabled={ing.amountUsed <= 1}
                      >-</button>
                      <span>{ing.amountUsed}</span>
                      <button 
                        type="button"
                        onClick={() => handleAmountChange(ing.listItemId, ing.amountUsed + 1)}
                        disabled={ing.amountUsed >= ing.maxAmount}
                      >+</button>
                      <span className="use-unit">{ing.useUnit}</span>
                    </div>
                    <button 
                      type="button" 
                      className="remove-ingredient"
                      onClick={() => handleRemoveIngredient(ing.listItemId)}
                    >✕</button>
                  </div>
                );
              })}
            </div>

            {/* Add more ingredients */}
            <div className="add-ingredient">
              <input
                type="text"
                value={searchIngredient}
                onChange={(e) => setSearchIngredient(e.target.value)}
                placeholder="Add another ingredient..."
              />
              {filteredPantryItems.length > 0 && (
                <div className="ingredient-suggestions">
                  {filteredPantryItems.slice(0, 5).map(item => {
                    const color = CATEGORY_COLORS[item.category] || "#ddd";
                    return (
                      <div 
                        key={item._id}
                        className="ingredient-suggestion"
                        style={{ borderLeftColor: color }}
                        onClick={() => handleAddIngredient(item)}
                      >
                        {item.name}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Servings */}
          <div className="cook-field">
            <label>Total Servings Made:</label>
            <input
              type="number"
              min="1"
              value={servings}
              onChange={(e) => setServings(parseInt(e.target.value) || 1)}
            />
          </div>

          {/* Leftover Storage */}
          <div className="cook-field">
            <label>Leftover Storage:</label>
            <select 
              value={leftoverStorage} 
              onChange={(e) => setLeftoverStorage(e.target.value)}
            >
              {STORAGE_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Submit */}
          <div className="cook-actions">
            <button 
              type="submit" 
              className="cook-btn-submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Cooking..." : "🍳 Cook it!"}
            </button>
            <button type="button" className="cancel-btn" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CookDish;
