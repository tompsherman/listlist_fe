/**
 * Meals List Component
 * Quick meal logging + dish management with ingredients
 */

import { useState } from 'react';
import { useUser } from '../context/UserContext';
import { dishesApi } from '../services/dishes';
import { itemsApi } from '../services/items';
import { useCachedData } from '../hooks';
import { getCategoryColor, isEdible } from '../utils/categories';
import CookDishModal from './CookDishModal';
import LoadingCountdown from './LoadingCountdown';
import './MealsList.css';

export default function MealsList() {
  const { currentPod } = useUser();
  
  // Fetch dishes with cold-start handling
  const {
    data: dishes,
    loading,
    error,
    countdown,
    isStale,
    refetch: fetchDishes,
    setData: setDishes,
  } = useCachedData({
    key: currentPod ? `dishes_${currentPod.podId}` : null,
    fetchFn: async () => {
      return await dishesApi.getAll(currentPod.podId);
    },
    enabled: !!currentPod,
    coldStartMs: 30000,
  });

  const [newDishName, setNewDishName] = useState('');
  const [adding, setAdding] = useState(false);
  
  // Search/filter
  const [searchQuery, setSearchQuery] = useState('');
  
  // Expanded dish for editing
  const [expandedDish, setExpandedDish] = useState(null);
  const [ingredientSearch, setIngredientSearch] = useState('');
  const [ingredientResults, setIngredientResults] = useState([]);
  
  // Gap #6: Cook modal
  const [showCookModal, setShowCookModal] = useState(false);

  const handleAddDish = async (e) => {
    e.preventDefault();
    if (!newDishName.trim() || !currentPod) return;
    
    setAdding(true);
    try {
      const dish = await dishesApi.create({
        podId: currentPod.podId,
        name: newDishName.trim(),
      });
      setDishes(prev => [dish, ...prev]);
      setNewDishName('');
    } catch (err) {
      console.error('Failed to add dish:', err);
    } finally {
      setAdding(false);
    }
  };

  const handleCook = async (dish, e) => {
    e?.stopPropagation();
    try {
      const updated = await dishesApi.cook(dish._id);
      setDishes(prev => prev.map(d => d._id === dish._id ? updated : d));
    } catch (err) {
      console.error('Failed to log cook:', err);
    }
  };

  const handleDelete = async (dish, e) => {
    e?.stopPropagation();
    if (!confirm(`Delete "${dish.name}"?`)) return;
    
    try {
      await dishesApi.delete(dish._id);
      setDishes(prev => prev.filter(d => d._id !== dish._id));
      if (expandedDish?._id === dish._id) setExpandedDish(null);
    } catch (err) {
      console.error('Failed to delete dish:', err);
    }
  };

  // Ingredient search - filters out household (non-edible) items
  const handleIngredientSearch = async (q) => {
    setIngredientSearch(q);
    if (q.length < 2) {
      setIngredientResults([]);
      return;
    }
    
    try {
      const results = await itemsApi.search({ q, limit: 10 });
      // Filter to only edible items (exclude household)
      setIngredientResults(results.filter(isEdible));
    } catch (err) {
      console.error('Search failed:', err);
    }
  };

  // Add ingredient to dish
  const handleAddIngredient = async (item) => {
    if (!expandedDish) return;
    
    const newIngredient = {
      itemId: item._id,
      name: item.name,
      category: item.category,
      quantity: 1,
    };
    
    const updatedIngredients = [...(expandedDish.ingredients || []), newIngredient];
    
    try {
      const updated = await dishesApi.update(expandedDish._id, {
        ingredients: updatedIngredients,
      });
      setDishes(prev => prev.map(d => d._id === updated._id ? updated : d));
      setExpandedDish(updated);
      setIngredientSearch('');
      setIngredientResults([]);
    } catch (err) {
      console.error('Failed to add ingredient:', err);
    }
  };

  // Remove ingredient from dish
  const handleRemoveIngredient = async (index) => {
    if (!expandedDish) return;
    
    const updatedIngredients = expandedDish.ingredients.filter((_, i) => i !== index);
    
    try {
      const updated = await dishesApi.update(expandedDish._id, {
        ingredients: updatedIngredients,
      });
      setDishes(prev => prev.map(d => d._id === updated._id ? updated : d));
      setExpandedDish(updated);
    } catch (err) {
      console.error('Failed to remove ingredient:', err);
    }
  };

  const formatDate = (date) => {
    if (!date) return 'Never';
    const d = new Date(date);
    const now = new Date();
    const diffDays = Math.floor((now - d) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return d.toLocaleDateString();
  };

  // Show countdown when loading with no data (cold start)
  if (loading && !dishes) {
    return <LoadingCountdown countdown={countdown} />;
  }

  // Filter dishes by search (dishes is guaranteed to be array at this point)
  const dishesArray = dishes || [];
  const filteredDishes = dishesArray.filter(d => 
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.ingredients?.some(i => i.name?.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  if (error) return <div className="meals-list error">{error}</div>;

  return (
    <div className="meals-list">
      {/* Gap #6: Cook Button */}
      <button className="cook-now-btn" onClick={() => setShowCookModal(true)}>
        🍳 Cook Something
      </button>
      
      {/* Add Dish */}
      <form className="add-dish" onSubmit={handleAddDish}>
        <input
          type="text"
          placeholder="Add a dish..."
          value={newDishName}
          onChange={(e) => setNewDishName(e.target.value)}
          disabled={adding}
        />
        <button type="submit" disabled={adding || !newDishName.trim()}>
          Add
        </button>
      </form>

      {/* Search */}
      {dishesArray.length > 3 && (
        <div className="search-bar">
          <input
            type="text"
            placeholder="🔍 Search dishes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="clear-search" onClick={() => setSearchQuery('')}>×</button>
          )}
        </div>
      )}

      {/* Dishes */}
      {filteredDishes.length === 0 ? (
        <p className="empty">
          {dishesArray.length === 0 ? 'No dishes yet. Add some above!' : 'No dishes match your search.'}
        </p>
      ) : (
        <div className="dish-list">
          {filteredDishes.map(dish => (
            <div 
              key={dish._id} 
              className={`dish-card ${expandedDish?._id === dish._id ? 'expanded' : ''}`}
            >
              <div 
                className="dish-header"
                onClick={() => setExpandedDish(expandedDish?._id === dish._id ? null : dish)}
              >
                <div className="dish-info">
                  <span className="dish-name">{dish.name}</span>
                  <span className="dish-meta">
                    {dish.timesMade > 0 && `${dish.timesMade}× • `}
                    {formatDate(dish.lastMade)}
                  </span>
                  {dish.ingredients?.length > 0 && (
                    <div className="ingredient-dots">
                      {dish.ingredients.slice(0, 5).map((ing, i) => (
                        <span 
                          key={i} 
                          className="dot"
                          style={{ backgroundColor: getCategoryColor(ing.category) }}
                          title={ing.name}
                        />
                      ))}
                      {dish.ingredients.length > 5 && (
                        <span className="more-dots">+{dish.ingredients.length - 5}</span>
                      )}
                    </div>
                  )}
                </div>
                <div className="dish-actions">
                  <button 
                    className="cook-btn"
                    onClick={(e) => handleCook(dish, e)}
                    title="Log cook"
                  >
                    🍳
                  </button>
                  <span className="expand-icon">
                    {expandedDish?._id === dish._id ? '▼' : '▶'}
                  </span>
                </div>
              </div>

              {/* Expanded view - ingredients */}
              {expandedDish?._id === dish._id && (
                <div className="dish-expanded">
                  <div className="ingredients-section">
                    <h4>Ingredients</h4>
                    
                    {/* Add ingredient search */}
                    <div className="ingredient-search">
                      <input
                        type="text"
                        placeholder="Add ingredient..."
                        value={ingredientSearch}
                        onChange={(e) => handleIngredientSearch(e.target.value)}
                      />
                      {ingredientResults.length > 0 && (
                        <ul className="ingredient-results">
                          {ingredientResults.map(item => (
                            <li 
                              key={item._id}
                              onClick={() => handleAddIngredient(item)}
                              style={{ borderLeftColor: getCategoryColor(item.category) }}
                            >
                              {item.name}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    {/* Ingredient list */}
                    {dish.ingredients?.length > 0 ? (
                      <ul className="ingredients-list">
                        {dish.ingredients.map((ing, i) => (
                          <li 
                            key={i}
                            style={{ borderLeftColor: getCategoryColor(ing.category) }}
                          >
                            <span className="ing-name">{ing.name}</span>
                            <button 
                              className="remove-ing"
                              onClick={() => handleRemoveIngredient(i)}
                            >
                              ×
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="no-ingredients">No ingredients added yet</p>
                    )}
                  </div>

                  <div className="dish-footer">
                    <button 
                      className="delete-btn"
                      onClick={(e) => handleDelete(dish, e)}
                    >
                      🗑️ Delete Dish
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      
      {/* Gap #6: Cook Modal */}
      <CookDishModal 
        isOpen={showCookModal}
        onClose={() => setShowCookModal(false)}
        onCookComplete={() => {
          fetchDishes(); // Refresh dishes list
        }}
      />
    </div>
  );
}
