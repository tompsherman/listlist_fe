/**
 * Meals List Component
 * Quick meal logging + dish management
 */

import { useState, useEffect, useCallback } from 'react';
import { useUser } from '../context/UserContext';
import { dishesApi } from '../services/dishes';
import './MealsList.css';

export default function MealsList() {
  const { currentPod } = useUser();
  const [dishes, setDishes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newDishName, setNewDishName] = useState('');
  const [adding, setAdding] = useState(false);

  const fetchDishes = useCallback(async () => {
    if (!currentPod) return;
    
    try {
      setLoading(true);
      const data = await dishesApi.getAll(currentPod.podId);
      setDishes(data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch dishes:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [currentPod]);

  useEffect(() => {
    fetchDishes();
  }, [fetchDishes]);

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

  const handleCook = async (dish) => {
    try {
      const updated = await dishesApi.cook(dish._id);
      setDishes(prev => prev.map(d => d._id === dish._id ? updated : d));
    } catch (err) {
      console.error('Failed to log cook:', err);
    }
  };

  const handleDelete = async (dish) => {
    if (!confirm(`Delete "${dish.name}"?`)) return;
    
    try {
      await dishesApi.delete(dish._id);
      setDishes(prev => prev.filter(d => d._id !== dish._id));
    } catch (err) {
      console.error('Failed to delete dish:', err);
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

  if (loading) return <div className="meals-list loading">Loading...</div>;
  if (error) return <div className="meals-list error">{error}</div>;

  return (
    <div className="meals-list">
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

      {/* Quick Cook */}
      <div className="section">
        <h3>Quick Cook</h3>
        <p className="hint">Tap a dish to log that you made it</p>
        
        {dishes.length === 0 ? (
          <p className="empty">No dishes yet. Add some above!</p>
        ) : (
          <div className="dish-grid">
            {dishes.map(dish => (
              <button
                key={dish._id}
                className="dish-card"
                onClick={() => handleCook(dish)}
              >
                <span className="dish-name">{dish.name}</span>
                <span className="dish-meta">
                  {dish.timesMade > 0 && `Made ${dish.timesMade}× • `}
                  {formatDate(dish.lastMade)}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Manage Dishes */}
      {dishes.length > 0 && (
        <div className="section">
          <h3>Manage Dishes</h3>
          <ul className="dish-manage-list">
            {dishes.map(dish => (
              <li key={dish._id}>
                <span className="name">{dish.name}</span>
                <button className="delete-btn" onClick={() => handleDelete(dish)}>
                  Delete
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
