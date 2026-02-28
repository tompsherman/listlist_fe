/**
 * CookDishModal Component
 * Gap #6: Full cooking flow with ingredient selection,
 * pantry deduction, and leftover creation
 */

import { useState, useEffect, useCallback } from 'react';
import { useUser } from '../context/UserContext';
import { dishesApi } from '../services/dishes';
import { listsApi } from '../services/lists';
import { itemsApi } from '../services/items';
import { 
  getCategoryColor, 
  isEdible,
  DISH_TYPE_OPTIONS,
  MEAL_CATEGORY_OPTIONS,
  STORAGE_OPTIONS,
  STORAGE_LOCATION_OPTIONS,
} from '../utils/categories';
import { Modal, ModalFooter, Button, Badge } from './ui';
import './CookDishModal.css';

export default function CookDishModal({ isOpen, onClose, onCookComplete }) {
  const { currentPod } = useUser();
  
  // Dish selection
  const [dishSearch, setDishSearch] = useState('');
  const [dishSuggestions, setDishSuggestions] = useState([]);
  const [selectedDish, setSelectedDish] = useState(null);
  const [dishName, setDishName] = useState('');
  
  // Dish details
  const [dishType, setDishType] = useState('main');
  const [mealCategory, setMealCategory] = useState('dinner');
  const [servings, setServings] = useState(4);
  
  // Ingredients
  const [ingredients, setIngredients] = useState([]);
  const [ingredientSearch, setIngredientSearch] = useState('');
  const [pantryItems, setPantryItems] = useState([]);
  const [pantrySearchResults, setPantrySearchResults] = useState([]);
  
  // Leftovers
  const [leftoverStorage, setLeftoverStorage] = useState('none');
  const [leftoverLocation, setLeftoverLocation] = useState('fridge');
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Select dish, 2: Ingredients, 3: Details
  
  // Fetch dishes and pantry on open
  useEffect(() => {
    if (isOpen && currentPod) {
      // Fetch dish history
      dishesApi.getAll(currentPod.podId)
        .then(dishes => {
          // Sort by lastMade (most recent first)
          const sorted = [...dishes].sort((a, b) => {
            if (!a.lastMade) return 1;
            if (!b.lastMade) return -1;
            return new Date(b.lastMade) - new Date(a.lastMade);
          });
          setDishSuggestions(sorted);
        })
        .catch(console.error);
      
      // Fetch pantry items
      listsApi.getAll({ podId: currentPod.podId, type: 'pantry' })
        .then(async (lists) => {
          if (lists.length > 0) {
            const fullList = await listsApi.getById(lists[0]._id);
            // Filter to edible items only
            const edible = (fullList.items || []).filter(i => isEdible(i.itemId));
            // Sort: OPEN items first
            edible.sort((a, b) => {
              const aOpen = !!a.openedAt;
              const bOpen = !!b.openedAt;
              if (aOpen && !bOpen) return -1;
              if (!aOpen && bOpen) return 1;
              return 0;
            });
            setPantryItems(edible);
          }
        })
        .catch(console.error);
    }
  }, [isOpen, currentPod]);
  
  // Filter dish suggestions as user types
  const filteredDishes = dishSearch.length >= 2
    ? dishSuggestions.filter(d => 
        d.name.toLowerCase().includes(dishSearch.toLowerCase())
      )
    : dishSuggestions.slice(0, 5); // Show recent dishes
  
  // Select an existing dish (pre-fill from template)
  const handleSelectDish = (dish) => {
    setSelectedDish(dish);
    setDishName(dish.name);
    setDishType(dish.dishType || 'main');
    setMealCategory(dish.mealCategory || 'dinner');
    
    // Pre-fill ingredients from dish template
    if (dish.ingredients?.length > 0) {
      const populatedIngredients = dish.ingredients.map(dishIng => {
        // Try to find in current pantry
        const pantryMatch = pantryItems.find(pi => {
          // Match by itemId first
          if (dishIng.itemId && pi.itemId?._id) {
            return pi.itemId._id.toString() === dishIng.itemId.toString();
          }
          // Fall back to name match
          return pi.itemId?.name?.toLowerCase() === dishIng.name?.toLowerCase();
        });
        
        if (pantryMatch) {
          const usesRemaining = pantryMatch.usesRemaining ?? pantryMatch.quantity ?? 1;
          return {
            listItemId: pantryMatch._id,
            itemId: pantryMatch.itemId?._id || pantryMatch.itemId,
            name: pantryMatch.itemId?.name || dishIng.name,
            category: pantryMatch.itemId?.category || dishIng.category,
            amountUsed: Math.min(dishIng.quantity || 1, usesRemaining),
            maxAmount: usesRemaining,
            inPantry: true,
            isOpen: !!pantryMatch.openedAt,
          };
        } else {
          // Not in pantry - mark as missing
          return {
            adhoc: true,
            name: dishIng.name,
            category: dishIng.category,
            amountUsed: dishIng.quantity || 1,
            missing: true,
          };
        }
      });
      setIngredients(populatedIngredients);
    }
    
    setDishSearch('');
    setStep(2);
  };
  
  // Create new dish
  const handleCreateNewDish = () => {
    setSelectedDish(null);
    setDishName(dishSearch);
    setIngredients([]);
    setDishSearch('');
    setStep(2);
  };
  
  // Search pantry for ingredients
  const handleIngredientSearch = (q) => {
    setIngredientSearch(q);
    if (q.length < 2) {
      setPantrySearchResults([]);
      return;
    }
    
    const results = pantryItems.filter(item =>
      item.itemId?.name?.toLowerCase().includes(q.toLowerCase()) &&
      !ingredients.some(ing => ing.listItemId === item._id)
    );
    setPantrySearchResults(results);
  };
  
  // Add ingredient from pantry
  const handleAddPantryIngredient = (pantryItem) => {
    const usesRemaining = pantryItem.usesRemaining ?? pantryItem.quantity ?? 1;
    setIngredients(prev => [...prev, {
      listItemId: pantryItem._id,
      itemId: pantryItem.itemId?._id || pantryItem.itemId,
      name: pantryItem.itemId?.name,
      category: pantryItem.itemId?.category,
      amountUsed: 1,
      maxAmount: usesRemaining,
      inPantry: true,
      isOpen: !!pantryItem.openedAt,
    }]);
    setIngredientSearch('');
    setPantrySearchResults([]);
  };
  
  // Add adhoc ingredient (not in pantry)
  const handleAddAdhocIngredient = () => {
    setIngredients(prev => [...prev, {
      adhoc: true,
      name: ingredientSearch,
      category: 'other',
      amountUsed: 1,
    }]);
    setIngredientSearch('');
    setPantrySearchResults([]);
  };
  
  // Update ingredient amount
  const handleUpdateIngredientAmount = (index, delta) => {
    setIngredients(prev => prev.map((ing, i) => {
      if (i !== index) return ing;
      const newAmount = Math.max(0, (ing.amountUsed || 1) + delta);
      const maxAmount = ing.maxAmount || Infinity;
      return { ...ing, amountUsed: Math.min(newAmount, maxAmount) };
    }));
  };
  
  // Remove ingredient
  const handleRemoveIngredient = (index) => {
    setIngredients(prev => prev.filter((_, i) => i !== index));
  };
  
  // Cook the dish
  const handleCook = async () => {
    if (!dishName.trim()) return;
    
    setLoading(true);
    try {
      // 1. Create or update dish
      let dish = selectedDish;
      if (!dish) {
        // Create new dish
        dish = await dishesApi.create({
          podId: currentPod.podId,
          name: dishName.trim(),
          dishType,
          mealCategory,
          ingredients: ingredients.map(ing => ({
            itemId: ing.itemId,
            name: ing.name,
            category: ing.category,
            quantity: ing.amountUsed,
          })),
        });
      } else {
        // Update existing dish with new ingredients
        dish = await dishesApi.update(dish._id, {
          ingredients: ingredients.map(ing => ({
            itemId: ing.itemId,
            name: ing.name,
            category: ing.category,
            quantity: ing.amountUsed,
          })),
        });
      }
      
      // 2. Log the cook
      await dishesApi.cook(dish._id);
      
      // 3. Deduct from pantry
      const pantryList = await listsApi.getAll({ podId: currentPod.podId, type: 'pantry' });
      if (pantryList.length > 0) {
        for (const ing of ingredients) {
          if (ing.inPantry && ing.listItemId && ing.amountUsed > 0) {
            // Find current pantry item
            const pantryItem = pantryItems.find(p => p._id === ing.listItemId);
            if (pantryItem) {
              const currentUses = pantryItem.usesRemaining ?? pantryItem.quantity ?? 1;
              const newUses = currentUses - ing.amountUsed;
              
              if (newUses <= 0) {
                // Fully used - remove from pantry
                await listsApi.removeItem(pantryList[0]._id, ing.listItemId);
              } else {
                // Update uses remaining
                await listsApi.updateItem(pantryList[0]._id, ing.listItemId, {
                  usesRemaining: newUses,
                });
              }
            }
          }
        }
      }
      
      // 4. Create leftover if specified
      if (leftoverStorage !== 'none' && pantryList.length > 0) {
        // Create leftover item in catalog if needed
        const leftoverName = `${dishName} (leftover)`;
        let leftoverItem;
        
        try {
          // Try to find existing leftover item
          const existing = await itemsApi.search({ q: leftoverName, limit: 1 });
          if (existing.length > 0 && existing[0].name === leftoverName) {
            leftoverItem = existing[0];
          } else {
            // Create new leftover item
            leftoverItem = await itemsApi.create({
              name: leftoverName,
              podId: currentPod.podId,
              category: 'leftovers',
            });
          }
          
          // Add to pantry
          await listsApi.addItem(pantryList[0]._id, {
            itemId: leftoverItem._id,
            quantity: 1,
            location: leftoverLocation,
            openedAt: new Date().toISOString(), // Leftovers are always "open"
          });
        } catch (err) {
          console.error('Failed to create leftover:', err);
        }
      }
      
      // Done!
      onCookComplete?.();
      handleClose();
      
    } catch (err) {
      console.error('Failed to cook dish:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // Reset and close
  const handleClose = () => {
    setDishSearch('');
    setDishSuggestions([]);
    setSelectedDish(null);
    setDishName('');
    setDishType('main');
    setMealCategory('dinner');
    setServings(4);
    setIngredients([]);
    setIngredientSearch('');
    setPantrySearchResults([]);
    setLeftoverStorage('none');
    setLeftoverLocation('fridge');
    setStep(1);
    onClose();
  };
  
  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose} 
      title={step === 1 ? "🍳 What are you cooking?" : step === 2 ? "🥗 Ingredients" : "📝 Details"}
      className="cook-dish-modal"
    >
      {/* Step 1: Select or create dish */}
      {step === 1 && (
        <div className="step step-1">
          <input
            type="text"
            placeholder="Search dishes or enter new name..."
            value={dishSearch}
            onChange={(e) => setDishSearch(e.target.value)}
            autoFocus
            className="dish-search"
          />
          
          <div className="dish-suggestions">
            {filteredDishes.length > 0 ? (
              <>
                <p className="hint">Recent dishes:</p>
                <ul>
                  {filteredDishes.map(dish => (
                    <li key={dish._id} onClick={() => handleSelectDish(dish)}>
                      <span className="dish-name">{dish.name}</span>
                      {dish.timesMade > 0 && (
                        <Badge size="sm">{dish.timesMade}× made</Badge>
                      )}
                    </li>
                  ))}
                </ul>
              </>
            ) : dishSearch.length >= 2 ? (
              <p className="no-results">No matching dishes found</p>
            ) : (
              <p className="hint">Type to search or create a new dish</p>
            )}
          </div>
          
          {dishSearch.length >= 2 && !filteredDishes.some(d => d.name.toLowerCase() === dishSearch.toLowerCase()) && (
            <Button 
              variant="primary" 
              onClick={handleCreateNewDish}
              style={{ marginTop: '1rem' }}
            >
              + Create "{dishSearch}"
            </Button>
          )}
        </div>
      )}
      
      {/* Step 2: Ingredients */}
      {step === 2 && (
        <div className="step step-2">
          <h3>{dishName}</h3>
          
          <div className="ingredient-search">
            <input
              type="text"
              placeholder="Search pantry for ingredients..."
              value={ingredientSearch}
              onChange={(e) => handleIngredientSearch(e.target.value)}
            />
            
            {pantrySearchResults.length > 0 && (
              <ul className="pantry-results">
                {pantrySearchResults.map(item => (
                  <li 
                    key={item._id}
                    onClick={() => handleAddPantryIngredient(item)}
                    style={{ borderLeftColor: getCategoryColor(item.itemId?.category) }}
                  >
                    <span className="item-name">{item.itemId?.name}</span>
                    {item.openedAt && <Badge size="sm" variant="success">OPEN</Badge>}
                    <span className="uses">{item.usesRemaining ?? item.quantity ?? 1} uses</span>
                  </li>
                ))}
              </ul>
            )}
            
            {ingredientSearch.length >= 2 && pantrySearchResults.length === 0 && (
              <Button 
                variant="secondary" 
                size="sm"
                onClick={handleAddAdhocIngredient}
                style={{ marginTop: '0.5rem' }}
              >
                + Add "{ingredientSearch}" (not in pantry)
              </Button>
            )}
          </div>
          
          {/* Ingredients list */}
          <div className="ingredients-list">
            {ingredients.length === 0 ? (
              <p className="empty">No ingredients added yet</p>
            ) : (
              <ul>
                {ingredients.map((ing, index) => (
                  <li 
                    key={index}
                    className={`ingredient ${ing.missing ? 'missing' : ''} ${ing.adhoc ? 'adhoc' : ''}`}
                    style={{ borderLeftColor: getCategoryColor(ing.category) }}
                  >
                    <span className="ing-name">
                      {ing.name}
                      {ing.isOpen && <Badge size="sm" variant="success">OPEN</Badge>}
                      {ing.missing && <Badge size="sm" variant="warning">Not in pantry</Badge>}
                      {ing.adhoc && <Badge size="sm" variant="info">Adhoc</Badge>}
                    </span>
                    <div className="ing-controls">
                      <button onClick={() => handleUpdateIngredientAmount(index, -1)}>−</button>
                      <span className="amount">{ing.amountUsed}</span>
                      <button 
                        onClick={() => handleUpdateIngredientAmount(index, 1)}
                        disabled={ing.inPantry && ing.amountUsed >= ing.maxAmount}
                      >
                        +
                      </button>
                      <button className="remove" onClick={() => handleRemoveIngredient(index)}>×</button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
      
      {/* Step 3: Details */}
      {step === 3 && (
        <div className="step step-3">
          <h3>{dishName}</h3>
          
          <div className="form-row">
            <label>Dish Type</label>
            <select value={dishType} onChange={(e) => setDishType(e.target.value)}>
              {DISH_TYPE_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          
          <div className="form-row">
            <label>Meal</label>
            <select value={mealCategory} onChange={(e) => setMealCategory(e.target.value)}>
              {MEAL_CATEGORY_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          
          <div className="form-row">
            <label>Servings</label>
            <div className="servings-input">
              <button onClick={() => setServings(s => Math.max(1, s - 1))}>−</button>
              <span>{servings}</span>
              <button onClick={() => setServings(s => s + 1)}>+</button>
            </div>
          </div>
          
          <div className="form-row">
            <label>Leftovers?</label>
            <select value={leftoverStorage} onChange={(e) => setLeftoverStorage(e.target.value)}>
              {STORAGE_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          
          {leftoverStorage !== 'none' && (
            <div className="form-row">
              <label>Store in</label>
              <select value={leftoverLocation} onChange={(e) => setLeftoverLocation(e.target.value)}>
                {STORAGE_LOCATION_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          )}
          
          {/* Summary */}
          <div className="cook-summary">
            <p><strong>Ingredients:</strong> {ingredients.length}</p>
            <p><strong>Will deduct:</strong> {ingredients.filter(i => i.inPantry).length} pantry items</p>
            {leftoverStorage !== 'none' && (
              <p><strong>Leftover:</strong> {dishName} (leftover) → {leftoverLocation}</p>
            )}
          </div>
        </div>
      )}
      
      <ModalFooter>
        {step > 1 && (
          <Button variant="secondary" onClick={() => setStep(s => s - 1)}>
            ← Back
          </Button>
        )}
        <div style={{ flex: 1 }} />
        {step < 3 ? (
          <Button 
            variant="primary" 
            onClick={() => setStep(s => s + 1)}
            disabled={step === 1 && !dishName && !dishSearch}
          >
            Next →
          </Button>
        ) : (
          <Button 
            variant="primary" 
            onClick={handleCook}
            loading={loading}
          >
            🍳 Cook It!
          </Button>
        )}
      </ModalFooter>
    </Modal>
  );
}
