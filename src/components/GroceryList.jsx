/**
 * Grocery List Component
 * Shows items with checkboxes, add new items
 */

import { useState, useEffect, useCallback } from 'react';
import { useUser } from '../context/UserContext';
import { listsApi } from '../services/lists';
import { itemsApi } from '../services/items';
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
    
    try {
      setLoading(true);
      const lists = await listsApi.getAll({ podId: currentPod.podId, type: 'grocery' });
      
      if (lists.length > 0) {
        const fullList = await listsApi.getById(lists[0]._id);
        setList(fullList);
        setItems(fullList.items || []);
      }
      setError(null);
    } catch (err) {
      console.error('Failed to fetch list:', err);
      setError(err.message);
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
        {searchResults.length > 0 && (
          <ul className="search-results">
            {searchResults.map(item => (
              <li key={item._id} onClick={() => handleAddItem(item)}>
                {item.name}
                <span className="category">{item.category}</span>
              </li>
            ))}
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
              <h3 className="checked-header">Checked ({checked.length})</h3>
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
