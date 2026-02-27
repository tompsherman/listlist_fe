/**
 * Pantry List Component
 * Shows inventory grouped by location OR category
 * With expiration borders and Eat/Cook actions
 */

import { useState, useEffect, useCallback } from 'react';
import { useUser } from '../context/UserContext';
import { listsApi } from '../services/lists';
import { itemsApi } from '../services/items';
import { historyApi } from '../services/history';
import { getCached, setCache } from '../utils/cache';
import { 
  CATEGORIES, 
  getCategoryColor, 
  getExpirationColor,
  EXPIRATION_BORDER_COLORS,
  isEdible 
} from '../utils/categories';
import './PantryList.css';

const LOCATIONS = [
  { id: 'fridge', label: '🧊 Fridge', color: '#4fc3f7' },
  { id: 'freezer', label: '❄️ Freezer', color: '#90caf9' },
  { id: 'pantry', label: '🏠 Pantry', color: '#ffb74d' },
  { id: 'counter', label: '🍌 Counter', color: '#aed581' },
];

export default function PantryList() {
  const { currentPod } = useUser();
  const [list, setList] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeLocation, setActiveLocation] = useState('all');
  
  // Add item state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [addingTo, setAddingTo] = useState(null);
  const [expiring, setExpiring] = useState([]);
  
  // UI state
  const [groupBy, setGroupBy] = useState('location'); // 'location' | 'category'
  const [collapsedGroups, setCollapsedGroups] = useState({});

  const fetchList = useCallback(async () => {
    if (!currentPod) return;
    
    const cacheKey = `pantry_${currentPod.podId}`;
    const cached = getCached(cacheKey);
    if (cached) {
      setList(cached);
      setItems(cached.items || []);
      setLoading(false);
    }
    
    try {
      if (!cached) setLoading(true);
      const lists = await listsApi.getAll({ podId: currentPod.podId, type: 'pantry' });
      
      if (lists.length > 0) {
        const fullList = await listsApi.getById(lists[0]._id);
        setList(fullList);
        setItems(fullList.items || []);
        setCache(cacheKey, fullList, 5 * 60 * 1000);
      }
      setError(null);
    } catch (err) {
      console.error('Failed to fetch pantry:', err);
      if (!cached) setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [currentPod]);

  useEffect(() => {
    fetchList();
    // Fetch expiring items
    historyApi.getExpiring(7)
      .then(setExpiring)
      .catch(console.error);
  }, [fetchList]);

  const handleSearch = async (q) => {
    setSearchQuery(q);
    if (q.length < 2) {
      setSearchResults([]);
      return;
    }
    
    try {
      const results = await itemsApi.search({ q, limit: 10 });
      setSearchResults(results);
    } catch (err) {
      console.error('Search failed:', err);
    }
  };

  const handleCreateAndAdd = async (name, location) => {
    if (!list || !currentPod) return;
    
    try {
      const newItem = await itemsApi.create({
        name: name.trim(),
        podId: currentPod.podId,
        defaultLocation: location,
      });
      await handleAddItem(newItem, location);
    } catch (err) {
      console.error('Failed to create item:', err);
    }
  };

  const handleAddItem = async (catalogItem, location) => {
    if (!list) return;
    
    try {
      const newItem = await listsApi.addItem(list._id, {
        itemId: catalogItem._id,
        quantity: 1,
        location: location,
      });
      setItems(prev => [newItem, ...prev]);
      setSearchQuery('');
      setSearchResults([]);
      setAddingTo(null);
    } catch (err) {
      console.error('Failed to add item:', err);
    }
  };

  const handleUpdateQuantity = async (listItem, delta) => {
    const newQty = Math.max(0, listItem.quantity + delta);
    if (newQty === 0) {
      handleRemove(listItem);
      return;
    }
    
    try {
      const updated = await listsApi.updateItem(list._id, listItem._id, {
        quantity: newQty,
      });
      setItems(prev => prev.map(i => i._id === listItem._id ? updated : i));
    } catch (err) {
      console.error('Failed to update quantity:', err);
    }
  };

  const handleRemove = async (listItem) => {
    try {
      await listsApi.removeItem(list._id, listItem._id);
      setItems(prev => prev.filter(i => i._id !== listItem._id));
    } catch (err) {
      console.error('Failed to remove item:', err);
    }
  };

  // Eat one use of an item
  const handleEatOne = async (listItem) => {
    const currentUses = listItem.usesRemaining ?? listItem.quantity ?? 1;
    const newUses = currentUses - 1;
    
    if (newUses <= 0) {
      // Fully consumed - remove item
      handleRemove(listItem);
    } else {
      try {
        const updated = await listsApi.updateItem(list._id, listItem._id, {
          usesRemaining: newUses,
        });
        setItems(prev => prev.map(i => i._id === listItem._id ? updated : i));
      } catch (err) {
        console.error('Failed to eat item:', err);
      }
    }
  };

  // Use item in cooking (flags it for meal)
  const handleCookIt = async (listItem) => {
    // For now, same as eat - decrements uses
    // TODO: integrate with meals when that's built out
    handleEatOne(listItem);
  };

  // Toggle group collapse
  const toggleGroup = (groupId) => {
    setCollapsedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  // Get border color for item based on expiration
  const getItemBorderColor = (item) => {
    const expColor = getExpirationColor(item.expiresAt);
    if (expColor) return EXPIRATION_BORDER_COLORS[expColor];
    // Fallback to category color
    return getCategoryColor(item.itemId?.category);
  };

  // Group items by category
  const groupByCategory = (itemList) => {
    const groups = {};
    itemList.forEach(item => {
      const cat = item.itemId?.category || 'other';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    });
    return CATEGORIES.filter(c => groups[c]).map(c => ({
      id: c,
      label: c.charAt(0).toUpperCase() + c.slice(1),
      color: getCategoryColor(c),
      items: groups[c],
    })).concat(
      groups.other ? [{ id: 'other', label: 'Other', color: '#888', items: groups.other }] : []
    );
  };

  if (loading) return <div className="pantry-list loading">Loading...</div>;
  if (error) return <div className="pantry-list error">{error}</div>;

  const filteredItems = activeLocation === 'all' 
    ? items 
    : items.filter(i => i.location === activeLocation);

  const groupedByLocation = LOCATIONS.map(loc => ({
    ...loc,
    items: filteredItems.filter(i => i.location === loc.id),
  })).filter(g => g.items.length > 0);

  const groupedByCat = groupByCategory(filteredItems);
  
  const groups = groupBy === 'location' ? groupedByLocation : groupedByCat;

  // For location tabs count
  const groupedItems = LOCATIONS.reduce((acc, loc) => {
    acc[loc.id] = items.filter(i => i.location === loc.id);
    return acc;
  }, {});

  const formatExpiry = (date) => {
    const d = new Date(date);
    const now = new Date();
    const diffDays = Math.ceil((d - now) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return 'Expired!';
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    return `${diffDays} days`;
  };

  return (
    <div className="pantry-list">
      {/* Expiring Soon Warning */}
      {expiring.length > 0 && (
        <div className="expiring-warning">
          <span className="warning-icon">⚠️</span>
          <span>{expiring.length} item{expiring.length > 1 ? 's' : ''} expiring soon:</span>
          <div className="expiring-items">
            {expiring.slice(0, 3).map(item => (
              <span key={item._id} className="expiring-item">
                {item.itemId?.name} ({formatExpiry(item.expiresAt)})
              </span>
            ))}
            {expiring.length > 3 && <span className="more">+{expiring.length - 3} more</span>}
          </div>
        </div>
      )}

      {/* Add Item */}
      <div className="add-item">
        <input
          type="text"
          placeholder="Add to pantry..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => setAddingTo('pantry')}
        />
        {(searchResults.length > 0 || searchQuery.length >= 2) && (
          <div className="search-dropdown">
            <ul className="search-results">
              {searchResults.map(item => (
                <li key={item._id}>
                  <span className="item-name">{item.name}</span>
                  <div className="location-btns">
                    {LOCATIONS.map(loc => (
                      <button
                        key={loc.id}
                        onClick={() => handleAddItem(item, loc.id)}
                        title={loc.label}
                      >
                        {loc.label.split(' ')[0]}
                      </button>
                    ))}
                  </div>
                </li>
              ))}
              {searchQuery.length >= 2 && !searchResults.some(r => r.name.toLowerCase() === searchQuery.toLowerCase()) && (
                <li className="create-new">
                  <span className="item-name">+ "{searchQuery}"</span>
                  <div className="location-btns">
                    {LOCATIONS.map(loc => (
                      <button
                        key={loc.id}
                        onClick={() => handleCreateAndAdd(searchQuery, loc.id)}
                        title={loc.label}
                      >
                        {loc.label.split(' ')[0]}
                      </button>
                    ))}
                  </div>
                </li>
              )}
            </ul>
          </div>
        )}
      </div>

      {/* Controls row */}
      <div className="controls-row">
        {/* Group by toggle */}
        <div className="group-toggle">
          <button 
            className={groupBy === 'location' ? 'active' : ''}
            onClick={() => setGroupBy('location')}
          >
            📍 Location
          </button>
          <button 
            className={groupBy === 'category' ? 'active' : ''}
            onClick={() => setGroupBy('category')}
          >
            🏷️ Category
          </button>
        </div>

        {/* Location filter (only in location mode) */}
        {groupBy === 'location' && (
          <div className="location-tabs">
            <button
              className={activeLocation === 'all' ? 'active' : ''}
              onClick={() => setActiveLocation('all')}
            >
              All ({items.length})
            </button>
            {LOCATIONS.map(loc => (
              <button
                key={loc.id}
                className={activeLocation === loc.id ? 'active' : ''}
                onClick={() => setActiveLocation(loc.id)}
              >
                {loc.label.split(' ')[0]} {groupedItems[loc.id]?.length || 0}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Items grouped */}
      {filteredItems.length === 0 ? (
        <p className="empty">No items here yet.</p>
      ) : (
        <div className="grouped-items">
          {groups.map(group => (
            <div key={group.id} className="group-section">
              <button 
                className="group-header"
                onClick={() => toggleGroup(group.id)}
                style={{ borderLeftColor: group.color }}
              >
                <span className="group-name">{group.label}</span>
                <span className="group-count">{group.items.length}</span>
                <span className="collapse-icon">
                  {collapsedGroups[group.id] ? '▶' : '▼'}
                </span>
              </button>
              
              {!collapsedGroups[group.id] && (
                <ul className="items">
                  {group.items.map(item => {
                    const expColor = getExpirationColor(item.expiresAt);
                    const usesRemaining = item.usesRemaining ?? item.quantity ?? 1;
                    const itemIsEdible = isEdible(item.itemId);
                    
                    return (
                      <li 
                        key={item._id} 
                        className={`item ${expColor ? `exp-${expColor}` : ''}`}
                        style={{ borderLeftColor: getItemBorderColor(item) }}
                      >
                        <div className="item-info">
                          <span className="name">{item.itemId?.name || 'Unknown'}</span>
                          {groupBy === 'category' && (
                            <span className="location-badge" data-location={item.location}>
                              {LOCATIONS.find(l => l.id === item.location)?.label.split(' ')[0]}
                            </span>
                          )}
                          {item.expiresAt && (
                            <span className={`expiry-badge ${expColor || ''}`}>
                              {formatExpiry(item.expiresAt)}
                            </span>
                          )}
                          {usesRemaining > 1 && (
                            <span className="uses-badge">{usesRemaining} uses</span>
                          )}
                        </div>
                        <div className="item-actions">
                          {itemIsEdible && (
                            <div className="eat-cook-btns">
                              <button 
                                className="eat-btn" 
                                onClick={() => handleEatOne(item)}
                                title="Eat one"
                              >
                                🍴 Eat 1
                              </button>
                              <button 
                                className="cook-btn" 
                                onClick={() => handleCookIt(item)}
                                title="Use in cooking"
                              >
                                🍳 Cook
                              </button>
                            </div>
                          )}
                          <div className="qty-controls">
                            <button onClick={() => handleUpdateQuantity(item, -1)}>−</button>
                            <span className="qty">{item.quantity}</span>
                            <button onClick={() => handleUpdateQuantity(item, 1)}>+</button>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
