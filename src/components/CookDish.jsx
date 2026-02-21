import React, { useState, useEffect } from "react";
import axios from "axios";
import CreatableSelect from "./CreatableSelect";
import useOptions from "../hooks/useOptions";
import {
  CATEGORY_COLORS,
  STORAGE_OPTIONS,
  DISH_TYPE_OPTIONS,
  MEAL_CATEGORY_OPTIONS,
  isEdible,
  getOpenTagColor,
  OPEN_TAG_COLORS,
} from "../utils/categories";
import { useUser } from "../context/UserContext";

const CookDish = ({ initialIngredient, pantryItems, pantryListId, onClose, onCooked }) => {
  const { canCook } = useUser();
  const { options, addOption } = useOptions();
  const [dishName, setDishName] = useState("");
  const [existingDishes, setExistingDishes] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [servings, setServings] = useState(1);
  const [leftoverStorage, setLeftoverStorage] = useState("none");
  const [dishType, setDishType] = useState("main");
  const [mealCategory, setMealCategory] = useState("dinner");
  const [searchIngredient, setSearchIngredient] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Quick-add state
  const [quickAddMode, setQuickAddMode] = useState(false);
  const [quickAddItem, setQuickAddItem] = useState({
    name: "",
    category: "vegetable",
    amountUsed: 1,
    useUnit: "self",
  });
  const [itemsDatabase, setItemsDatabase] = useState([]);

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

  // Fetch items database for quick-add suggestions
  useEffect(() => {
    axios.get("https://listlist-db.onrender.com/api/items/")
      .then(res => setItemsDatabase(res.data))
      .catch(err => console.error("Error fetching items:", err));
  }, []);

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
    setDishType(dish.dish_type || "main");
    setMealCategory(dish.meal_category || "dinner");
    setExistingDishes([]);
    
    // Pre-populate ingredients from the existing dish
    if (dish.ingredients && dish.ingredients.length > 0) {
      const populatedIngredients = dish.ingredients.map(dishIng => {
        // Try to find this ingredient in current pantry
        const pantryMatch = ediblePantryItems.find(pi => {
          // Match by item_id if available
          if (dishIng.item_id && pi.item_id) {
            return pi.item_id.toString() === dishIng.item_id.toString();
          }
          // Fall back to name match
          return pi.name?.toLowerCase() === dishIng.name?.toLowerCase();
        });

        if (pantryMatch) {
          // Found in pantry - use pantry item
          const usePerUnit = pantryMatch.use_per_unit || 1;
          const usesRemaining = pantryMatch.uses_remaining ?? 
            ((pantryMatch.acquired_amount || 1) * usePerUnit);
          
          return {
            listItemId: pantryMatch._id,
            name: pantryMatch.name,
            amountUsed: Math.min(dishIng.amount_used || 1, usesRemaining),
            maxAmount: usesRemaining,
            useUnit: pantryMatch.use_unit === "self" ? pantryMatch.name : pantryMatch.use_unit,
            category: pantryMatch.category,
            inPantry: true,
          };
        } else {
          // Not in pantry - add as adhoc with "missing" flag
          return {
            adhoc: true,
            name: dishIng.name,
            category: dishIng.category || "other",
            amountUsed: dishIng.amount_used || 1,
            useUnit: dishIng.use_unit === "self" ? dishIng.name : (dishIng.use_unit || "unit"),
            maxAmount: 999,
            inPantry: false,
            missing: true,
          };
        }
      });

      setIngredients(populatedIngredients);
    }
  };

  // Quick-add handlers
  const handleStartQuickAdd = () => {
    setQuickAddItem({
      name: searchIngredient,
      category: "vegetable",
      amountUsed: 1,
      useUnit: "self",
    });
    setQuickAddMode(true);
  };

  const handleQuickAddChange = (e) => {
    const { name, value } = e.target;
    setQuickAddItem(prev => ({
      ...prev,
      [name]: name === "amountUsed" ? parseInt(value) || 1 : value,
    }));
  };

  const handleQuickAddSubmit = () => {
    if (!quickAddItem.name.trim()) return;

    // Add as adhoc ingredient
    const newIngredient = {
      adhoc: true,
      name: quickAddItem.name.trim(),
      category: quickAddItem.category,
      amountUsed: quickAddItem.amountUsed,
      useUnit: quickAddItem.useUnit === "self" ? quickAddItem.name.trim() : quickAddItem.useUnit,
      maxAmount: 999, // No limit for adhoc
    };

    setIngredients([...ingredients, newIngredient]);
    setQuickAddMode(false);
    setSearchIngredient("");
    setQuickAddItem({ name: "", category: "vegetable", amountUsed: 1, useUnit: "self" });
  };

  const handleQuickAddCancel = () => {
    setQuickAddMode(false);
    setQuickAddItem({ name: "", category: "vegetable", amountUsed: 1, useUnit: "self" });
  };

  // Add adhoc item from database (item exists but not in pantry)
  const handleAddFromDatabase = (item) => {
    const newIngredient = {
      adhoc: true,
      name: item.name,
      category: item.category,
      amountUsed: 1,
      useUnit: item.use_unit === "self" ? item.name : item.use_unit,
      maxAmount: 999,
    };
    setIngredients([...ingredients, newIngredient]);
    setSearchIngredient("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!canCook()) {
      alert("You don't have permission to cook dishes");
      return;
    }
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
        ingredients: ingredients.map(ing => {
          if (ing.adhoc) {
            return {
              adhoc: true,
              name: ing.name,
              category: ing.category,
              amountUsed: ing.amountUsed,
              useUnit: ing.useUnit,
            };
          }
          return {
            listItemId: ing.listItemId,
            amountUsed: ing.amountUsed,
          };
        }),
        servings,
        leftoverStorage,
        dishType,
        mealCategory,
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

  // Filter pantry items for search - OPEN items first
  const filteredPantryItems = searchIngredient.length > 0
    ? ediblePantryItems
        .filter(item => 
          item.name.toLowerCase().includes(searchIngredient.toLowerCase()) &&
          !ingredients.some(ing => ing.listItemId === item._id)
        )
        .sort((a, b) => {
          // Open items come first
          const aOpen = !!a.opened_date;
          const bOpen = !!b.opened_date;
          if (aOpen && !bOpen) return -1;
          if (!aOpen && bOpen) return 1;
          return 0;
        })
    : [];

  // Helper to render open tag in ingredient suggestions
  const renderOpenTagSmall = (item) => {
    if (!item.opened_date) return null;
    const color = getOpenTagColor(item.opened_date, item.time_to_expire);
    if (!color) return null;
    const colorStyle = OPEN_TAG_COLORS[color];
    return (
      <span 
        className="open-tag-small"
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

  // Filter database items that aren't in pantry (for "not in pantry" suggestions)
  const filteredDatabaseItems = searchIngredient.length > 0
    ? itemsDatabase.filter(item => 
        item.name.toLowerCase().includes(searchIngredient.toLowerCase()) &&
        item.category !== "household" &&
        !ediblePantryItems.some(pi => pi.item_id?.toString() === item._id?.toString() || pi.name?.toLowerCase() === item.name?.toLowerCase()) &&
        !ingredients.some(ing => ing.name?.toLowerCase() === item.name?.toLowerCase())
      )
    : [];

  // Check if search term has no matches at all
  const noMatchesFound = searchIngredient.length >= 2 && 
    filteredPantryItems.length === 0 && 
    filteredDatabaseItems.length === 0;

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
                    <span className="dish-name">{dish.name}</span>
                    <span className="dish-meta">
                      {dish.servings} servings • {dish.ingredients?.length || 0} ingredients
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Ingredient availability summary - show when dish was loaded from template */}
          {ingredients.length > 0 && ingredients.some(ing => ing.missing) && (
            <div className="ingredient-summary">
              <span className="summary-available">
                ✓ {ingredients.filter(ing => !ing.missing).length} in pantry
              </span>
              <span className="summary-missing">
                ✗ {ingredients.filter(ing => ing.missing).length} missing
              </span>
            </div>
          )}

          {/* Ingredients */}
          <div className="cook-field">
            <label>Ingredients:</label>
            <div className="ingredients-list">
              {ingredients.map((ing, idx) => {
                const color = CATEGORY_COLORS[ing.category] || "#ddd";
                const key = ing.adhoc ? `adhoc-${idx}` : ing.listItemId;
                const isMissing = ing.missing === true;
                return (
                  <div key={key} className={`ingredient-row ${isMissing ? 'ingredient-missing' : ''}`} style={{ borderLeftColor: color }}>
                    <span className="ingredient-name">
                      {ing.name}
                      {ing.adhoc && !isMissing && <span className="adhoc-badge">quick add</span>}
                      {isMissing && <span className="missing-badge">not in pantry</span>}
                    </span>
                    <div className="ingredient-amount">
                      <button 
                        type="button"
                        onClick={() => {
                          if (ing.adhoc) {
                            setIngredients(ingredients.map((i, iIdx) => 
                              iIdx === idx ? { ...i, amountUsed: Math.max(1, i.amountUsed - 1) } : i
                            ));
                          } else {
                            handleAmountChange(ing.listItemId, ing.amountUsed - 1);
                          }
                        }}
                        disabled={ing.amountUsed <= 1}
                      >-</button>
                      <span>{ing.amountUsed}</span>
                      <button 
                        type="button"
                        onClick={() => {
                          if (ing.adhoc) {
                            setIngredients(ingredients.map((i, iIdx) => 
                              iIdx === idx ? { ...i, amountUsed: i.amountUsed + 1 } : i
                            ));
                          } else {
                            handleAmountChange(ing.listItemId, ing.amountUsed + 1);
                          }
                        }}
                        disabled={!ing.adhoc && ing.amountUsed >= ing.maxAmount}
                      >+</button>
                      <span className="use-unit">{ing.useUnit}</span>
                    </div>
                    <button 
                      type="button" 
                      className="remove-ingredient"
                      onClick={() => {
                        if (ing.adhoc) {
                          setIngredients(ingredients.filter((_, iIdx) => iIdx !== idx));
                        } else {
                          handleRemoveIngredient(ing.listItemId);
                        }
                      }}
                    >✕</button>
                  </div>
                );
              })}
            </div>

            {/* Add more ingredients */}
            <div className="add-ingredient">
              {quickAddMode ? (
                <div className="quick-add-form">
                  <h5>Quick Add Ingredient</h5>
                  <div className="quick-add-fields">
                    <div className="quick-add-field">
                      <label>Name:</label>
                      <input
                        type="text"
                        name="name"
                        value={quickAddItem.name}
                        onChange={handleQuickAddChange}
                        placeholder="Ingredient name"
                        autoFocus
                      />
                    </div>
                    <div className="quick-add-field">
                      <label>Category:</label>
                      <CreatableSelect
                        name="category"
                        value={quickAddItem.category}
                        onChange={handleQuickAddChange}
                        options={options.category}
                        onAddOption={addOption}
                      />
                    </div>
                    <div className="quick-add-field">
                      <label>Amount:</label>
                      <input
                        type="number"
                        name="amountUsed"
                        min="1"
                        value={quickAddItem.amountUsed}
                        onChange={handleQuickAddChange}
                      />
                    </div>
                    <div className="quick-add-field">
                      <label>Unit:</label>
                      <CreatableSelect
                        name="useUnit"
                        value={quickAddItem.useUnit}
                        onChange={handleQuickAddChange}
                        options={[
                          { value: "self", label: "whole item" },
                          ...options.use_unit.filter(o => o !== "self"),
                        ]}
                        onAddOption={addOption}
                      />
                    </div>
                  </div>
                  <div className="quick-add-actions">
                    <button type="button" onClick={handleQuickAddSubmit} className="quick-add-btn">
                      Add to dish
                    </button>
                    <button type="button" onClick={handleQuickAddCancel} className="quick-add-cancel">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <input
                    type="text"
                    value={searchIngredient}
                    onChange={(e) => setSearchIngredient(e.target.value)}
                    placeholder="Add another ingredient..."
                  />
                  
                  {/* Pantry items (in stock) - open items first */}
                  {filteredPantryItems.length > 0 && (
                    <div className="ingredient-suggestions">
                      <div className="suggestion-header">In Pantry:</div>
                      {filteredPantryItems.slice(0, 5).map(item => {
                        const color = CATEGORY_COLORS[item.category] || "#ddd";
                        return (
                          <div 
                            key={item._id}
                            className="ingredient-suggestion"
                            style={{ borderLeftColor: color }}
                            onClick={() => handleAddIngredient(item)}
                          >
                            {item.name} {renderOpenTagSmall(item)}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Database items not in pantry - only show when NO pantry matches */}
                  {filteredDatabaseItems.length > 0 && filteredPantryItems.length === 0 && (
                    <div className="ingredient-suggestions not-in-pantry">
                      <div className="suggestion-header">Not in Pantry:</div>
                      {filteredDatabaseItems.slice(0, 3).map(item => {
                        const color = CATEGORY_COLORS[item.category] || "#ddd";
                        return (
                          <div 
                            key={item._id}
                            className="ingredient-suggestion faded"
                            style={{ borderLeftColor: color }}
                            onClick={() => handleAddFromDatabase(item)}
                          >
                            {item.name} <span className="add-anyway">+ add anyway</span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Quick add option when no matches */}
                  {noMatchesFound && (
                    <div className="no-matches">
                      <p>"{searchIngredient}" not found</p>
                      <button type="button" onClick={handleStartQuickAdd} className="quick-add-start">
                        + Quick Add "{searchIngredient}"
                      </button>
                    </div>
                  )}

                  {/* Always show quick add option if searching */}
                  {searchIngredient.length >= 2 && !noMatchesFound && (
                    <div className="quick-add-option">
                      <button type="button" onClick={handleStartQuickAdd} className="quick-add-link">
                        + Add new ingredient...
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Dish Type */}
          <div className="cook-field">
            <label>Dish Type:</label>
            <div className="radio-group">
              {DISH_TYPE_OPTIONS.map(opt => (
                <label key={opt.value} className={`radio-option ${dishType === opt.value ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="dishType"
                    value={opt.value}
                    checked={dishType === opt.value}
                    onChange={(e) => setDishType(e.target.value)}
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>

          {/* Meal Category */}
          <div className="cook-field">
            <label>Meal Time:</label>
            <div className="radio-group">
              {MEAL_CATEGORY_OPTIONS.map(opt => (
                <label key={opt.value} className={`radio-option ${mealCategory === opt.value ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="mealCategory"
                    value={opt.value}
                    checked={mealCategory === opt.value}
                    onChange={(e) => setMealCategory(e.target.value)}
                  />
                  {opt.label}
                </label>
              ))}
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
            <p className="field-hint">Leftovers will appear in your fridge inventory</p>
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
