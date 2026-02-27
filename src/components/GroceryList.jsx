/**
 * Grocery List Component
 * Shows items with checkboxes, add new items
 * Grouped by category with v1 color system
 */

import { useState, useEffect, useCallback } from 'react';
import { useUser } from '../context/UserContext';
import { listsApi } from '../services/lists';
import { itemsApi } from '../services/items';
import { getCached, setCache } from '../utils/cache';
import { CATEGORIES, getCategoryColor } from '../utils/categories';
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
  
  // UI state
  const [shoppingMode, setShoppingMode] = useState(false);
  const [collapsedCategories, setCollapsedCategories] = useState({});

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

  // Update quantity
  const handleQuantityChange = async (listItem, delta) => {
    const newQty = Math.max(1, (listItem.quantity || 1) + delta);
    try {
      const updated = await listsApi.updateItem(list._id, listItem._id, {
        quantity: newQty,
      });
      setItems(prev => prev.map(i => i._id === listItem._id ? updated : i));
    } catch (err) {
      console.error('Failed to update quantity:', err);
    }
  };

  // Toggle category collapse
  const toggleCategory = (category) => {
    setCollapsedCategories(prev => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  // Group items by category
  const groupByCategory = (itemList) => {
    const groups = {};
    itemList.forEach(item => {
      const cat = item.itemId?.category || 'other';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    });
    // Sort categories in standard order
    return CATEGORIES.filter(c => groups[c]).map(c => ({
      category: c,
      items: groups[c],
    })).concat(
      groups.other ? [{ category: 'other', items: groups.other }] : []
    );
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
  const groupedUnchecked = groupByCategory(unchecked);

  return (
    <div className="grocery-list">
      {/* Header with mode toggle */}
      <div className="list-header">
        <button 
          className={`mode-toggle ${shoppingMode ? 'shopping' : ''}`}
          onClick={() => setShoppingMode(!shoppingMode)}
        >
          {shoppingMode ? '🛒 Shopping' : '📝 Edit'}
        </button>
        {checked.length > 0 && (
          <button className="checkout-btn" onClick={handleCheckout}>
            ✓ Add {checked.length} to Pantry
          </button>
        )}
      </div>

      {/* Add Item (hide in shopping mode) */}
      {!shoppingMode && (
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
                <li 
                  key={item._id} 
                  onClick={() => handleAddItem(item)}
                  style={{ borderLeftColor: getCategoryColor(item.category) }}
                >
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
      )}

      {/* Items grouped by category */}
      {unchecked.length === 0 && checked.length === 0 ? (
        <p className="empty">Your grocery list is empty. Add some items!</p>
      ) : (
        <>
          {groupedUnchecked.map(({ category, items: catItems }) => (
            <div key={category} className="category-section">
              <button 
                className="category-header"
                onClick={() => toggleCategory(category)}
                style={{ borderLeftColor: getCategoryColor(category) }}
              >
                <span className="category-name">{category}</span>
                <span className="category-count">{catItems.length}</span>
                <span className="collapse-icon">
                  {collapsedCategories[category] ? '▶' : '▼'}
                </span>
              </button>
              
              {!collapsedCategories[category] && (
                <ul className="items">
                  {catItems.map(item => (
                    <li 
                      key={item._id} 
                      className="item"
                      style={{ borderLeftColor: getCategoryColor(item.itemId?.category) }}
                    >
                      <label>
                        <input
                          type="checkbox"
                          checked={false}
                          onChange={() => handleToggle(item)}
                        />
                        <span className="name">{item.itemId?.name || 'Unknown'}</span>
                      </label>
                      <div className="item-controls">
                        {!shoppingMode && (
                          <div className="qty-controls">
                            <button onClick={() => handleQuantityChange(item, -1)}>−</button>
                            <span className="qty">{item.quantity || 1}</span>
                            <button onClick={() => handleQuantityChange(item, 1)}>+</button>
                          </div>
                        )}
                        {shoppingMode && item.quantity > 1 && (
                          <span className="qty-badge">×{item.quantity}</span>
                        )}
                        {!shoppingMode && (
                          <button className="remove" onClick={() => handleRemove(item)}>×</button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}

          {/* Checked Items */}
          {checked.length > 0 && (
            <div className="category-section checked-section">
              <button 
                className="category-header checked"
                onClick={() => toggleCategory('_checked')}
              >
                <span className="category-name">✓ In Cart</span>
                <span className="category-count">{checked.length}</span>
                <span className="collapse-icon">
                  {collapsedCategories['_checked'] ? '▶' : '▼'}
                </span>
              </button>
              
              {!collapsedCategories['_checked'] && (
                <ul className="items checked">
                  {checked.map(item => (
                    <li 
                      key={item._id} 
                      className="item"
                      style={{ borderLeftColor: getCategoryColor(item.itemId?.category) }}
                    >
                      <label>
                        <input
                          type="checkbox"
                          checked={true}
                          onChange={() => handleToggle(item)}
                        />
                        <span className="name">{item.itemId?.name || 'Unknown'}</span>
                      </label>
                      {!shoppingMode && (
                        <button className="remove" onClick={() => handleRemove(item)}>×</button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
