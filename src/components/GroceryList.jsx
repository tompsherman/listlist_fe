/**
 * Grocery List Component
 * Shows items with checkboxes, add new items
 */

import { useState, useEffect, useCallback } from 'react';
import { useUser } from '../context/UserContext';
import { listsApi } from '../services/lists';
import { itemsApi } from '../services/items';
import { getCached, setCache } from '../utils/cache';
import './GroceryList.css';

export default function GroceryList() {
  const { currentPod } = useUser();
  const [list, setList] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Add item state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  // Fetch grocery list
  const fetchList = useCallback(async () => {
    if (!currentPod) return;
    
    const cacheKey = `grocery_${currentPod.podId}`;
    const cached = getCached(cacheKey);
    if (cached) {
      setList(cached);
      setItems(cached.items || []);
      setLoading(false);
    }
    
    try {
      if (!cached) setLoading(true);
      const lists = await listsApi.getAll({ podId: currentPod.podId, type: 'grocery' });
      
      if (lists.length > 0) {
        const fullList = await listsApi.getById(lists[0]._id);
        setList(fullList);
        setItems(fullList.items || []);
        setCache(cacheKey, fullList, 5 * 60 * 1000);
      }
      setError(null);
    } catch (err) {
      console.error('Failed to fetch list:', err);
      if (!cached) setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [currentPod]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  // Search catalog
  const handleSearch = async (q) => {
    setSearchQuery(q);
    if (q.length < 2) {
      setSearchResults([]);
      return;
    }
    
    setSearching(true);
    try {
      const results = await itemsApi.search({ q, limit: 10 });
      setSearchResults(results);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setSearching(false);
    }
  };

  // Create custom item and add to list
  const handleCreateAndAdd = async (name) => {
    if (!list || !currentPod) return;
    
    try {
      const newItem = await itemsApi.create({
        name: name.trim(),
        podId: currentPod.podId,
      });
      await handleAddItem(newItem);
    } catch (err) {
      console.error('Failed to create item:', err);
    }
  };

  // Add item to list
  const handleAddItem = async (catalogItem) => {
    if (!list) return;
    
    try {
      const newItem = await listsApi.addItem(list._id, {
        itemId: catalogItem._id,
        quantity: 1,
      });
      setItems(prev => [newItem, ...prev]);
      setSearchQuery('');
      setSearchResults([]);
    } catch (err) {
      console.error('Failed to add item:', err);
    }
  };

  // Toggle checked
  const handleToggle = async (listItem) => {
    try {
      const updated = await listsApi.updateItem(list._id, listItem._id, {
        checked: !listItem.checked,
      });
      setItems(prev => prev.map(i => i._id === listItem._id ? updated : i));
    } catch (err) {
      console.error('Failed to toggle item:', err);
    }
  };

  // Remove item
  const handleRemove = async (listItem) => {
    try {
      await listsApi.removeItem(list._id, listItem._id);
      setItems(prev => prev.filter(i => i._id !== listItem._id));
    } catch (err) {
      console.error('Failed to remove item:', err);
    }
  };

  // Move checked items to pantry
  const handleCheckout = async () => {
    if (!list || checked.length === 0) return;
    
    try {
      const result = await listsApi.checkout(list._id);
      // Remove checked items from local state
      setItems(prev => prev.filter(i => !i.checked));
      alert(result.message || `Moved ${checked.length} items to pantry!`);
    } catch (err) {
      console.error('Checkout failed:', err);
    }
  };

  if (loading) {
    return <div className="grocery-list loading">Loading...</div>;
  }

  if (error) {
    return <div className="grocery-list error">{error}</div>;
  }

  const unchecked = items.filter(i => !i.checked);
  const checked = items.filter(i => i.checked);

  return (
    <div className="grocery-list">
      {/* Add Item */}
      <div className="add-item">
        <input
          type="text"
          placeholder="Add item..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
        />
        {(searchResults.length > 0 || searchQuery.length >= 2) && (
          <ul className="search-results">
            {searchResults.map(item => (
              <li key={item._id} onClick={() => handleAddItem(item)}>
                {item.name}
                <span className="category">{item.category}</span>
              </li>
            ))}
            {searchQuery.length >= 2 && !searchResults.some(r => r.name.toLowerCase() === searchQuery.toLowerCase()) && (
              <li className="create-new" onClick={() => handleCreateAndAdd(searchQuery)}>
                + Create "{searchQuery}"
              </li>
            )}
          </ul>
        )}
      </div>

      {/* Unchecked Items */}
      {unchecked.length === 0 && checked.length === 0 ? (
        <p className="empty">Your grocery list is empty. Add some items!</p>
      ) : (
        <>
          <ul className="items">
            {unchecked.map(item => (
              <li key={item._id} className="item">
                <label>
                  <input
                    type="checkbox"
                    checked={false}
                    onChange={() => handleToggle(item)}
                  />
                  <span className="name">{item.itemId?.name || 'Unknown'}</span>
                  {item.quantity > 1 && <span className="qty">×{item.quantity}</span>}
                </label>
                <button className="remove" onClick={() => handleRemove(item)}>×</button>
              </li>
            ))}
          </ul>

          {/* Checked Items */}
          {checked.length > 0 && (
            <>
              <div className="checked-header">
                <span>Checked ({checked.length})</span>
                <button className="checkout-btn" onClick={handleCheckout}>
                  ✓ Add to Pantry
                </button>
              </div>
              <ul className="items checked">
                {checked.map(item => (
                  <li key={item._id} className="item">
                    <label>
                      <input
                        type="checkbox"
                        checked={true}
                        onChange={() => handleToggle(item)}
                      />
                      <span className="name">{item.itemId?.name || 'Unknown'}</span>
                    </label>
                    <button className="remove" onClick={() => handleRemove(item)}>×</button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      )}
    </div>
  );
}
