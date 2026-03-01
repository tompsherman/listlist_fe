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
  getOpenTagColor,
  EXPIRATION_BORDER_COLORS,
  OPEN_TAG_COLORS,
  isEdible 
} from '../utils/categories';
import CookDishModal from './CookDishModal';
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
  const [collapsedNameGroups, setCollapsedNameGroups] = useState({}); // Gap #3: name groups
  const [draggedItem, setDraggedItem] = useState(null);
  const [dropTarget, setDropTarget] = useState(null);

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

  // Use item in cooking - opens cook modal
  const [cookModalItem, setCookModalItem] = useState(null);
  
  const handleCookIt = (listItem) => {
    setCookModalItem(listItem);
  };

  // Use (for non-edible items like household)
  const handleUseOne = async (listItem) => {
    const currentUses = listItem.usesRemaining ?? listItem.quantity ?? 1;
    const newUses = currentUses - 1;
    
    if (newUses <= 0) {
      handleRemove(listItem);
    } else {
      try {
        const updated = await listsApi.updateItem(list._id, listItem._id, {
          usesRemaining: newUses,
        });
        setItems(prev => prev.map(i => i._id === listItem._id ? updated : i));
      } catch (err) {
        console.error('Failed to use item:', err);
      }
    }
  };

  // Throw out item
  const handleThrowOut = async (listItem) => {
    if (!confirm(`Throw out ${listItem.itemId?.name || 'this item'}?`)) return;
    handleRemove(listItem);
  };

  // Toggle group collapse
  const toggleGroup = (groupId) => {
    setCollapsedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  // Gap #3: Toggle name group collapse
  const toggleNameGroup = (nameKey) => {
    setCollapsedNameGroups(prev => ({
      ...prev,
      [nameKey]: !prev[nameKey],
    }));
  };

  // Gap #5: Mark item as opened
  const handleMarkOpen = async (listItem) => {
    try {
      const updated = await listsApi.updateItem(list._id, listItem._id, {
        openedAt: new Date().toISOString(),
      });
      setItems(prev => prev.map(i => i._id === listItem._id ? updated : i));
    } catch (err) {
      console.error('Failed to mark item as open:', err);
    }
  };

  // Gap #3: Group items by name within a group
  const groupItemsByName = (itemList) => {
    const nameGroups = {};
    itemList.forEach(item => {
      const name = (item.itemId?.name || 'Unknown').toLowerCase();
      if (!nameGroups[name]) {
        nameGroups[name] = {
          name: item.itemId?.name || 'Unknown',
          items: [],
        };
      }
      nameGroups[name].items.push(item);
    });

    // Sort each name group: OPEN items first, then by expiresAt/purchasedAt
    Object.values(nameGroups).forEach(group => {
      group.items.sort((a, b) => {
        // Open items come first
        const aOpen = !!a.openedAt;
        const bOpen = !!b.openedAt;
        if (aOpen && !bOpen) return -1;
        if (!aOpen && bOpen) return 1;
        
        // Then sort by expiresAt (soonest first)
        if (a.expiresAt && b.expiresAt) {
          return new Date(a.expiresAt) - new Date(b.expiresAt);
        }
        if (a.expiresAt) return -1;
        if (b.expiresAt) return 1;
        
        return 0;
      });
    });

    return Object.values(nameGroups);
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

  // Drag and drop handlers
  const handleDragStart = (e, item) => {
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', item._id);
    // Add dragging class after a tick
    setTimeout(() => {
      e.target.classList.add('dragging');
    }, 0);
  };

  const handleDragEnd = (e) => {
    e.target.classList.remove('dragging');
    setDraggedItem(null);
    setDropTarget(null);
  };

  const handleDragOver = (e, locationId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dropTarget !== locationId) {
      setDropTarget(locationId);
    }
  };

  const handleDragLeave = (e) => {
    // Only clear if leaving the group entirely
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDropTarget(null);
    }
  };

  const handleDrop = async (e, targetLocation) => {
    e.preventDefault();
    setDropTarget(null);
    
    if (!draggedItem || draggedItem.location === targetLocation) {
      setDraggedItem(null);
      return;
    }

    try {
      const updated = await listsApi.updateItem(list._id, draggedItem._id, {
        location: targetLocation,
      });
      setItems(prev => prev.map(i => i._id === draggedItem._id ? updated : i));
    } catch (err) {
      console.error('Failed to move item:', err);
    }
    
    setDraggedItem(null);
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
          {groups.map(group => {
            const isLocationGroup = groupBy === 'location';
            const isDropTarget = isLocationGroup && dropTarget === group.id;
            
            return (
            <div 
              key={group.id} 
              className={`group-section ${isDropTarget ? 'drop-target' : ''}`}
              onDragOver={isLocationGroup ? (e) => handleDragOver(e, group.id) : undefined}
              onDragLeave={isLocationGroup ? handleDragLeave : undefined}
              onDrop={isLocationGroup ? (e) => handleDrop(e, group.id) : undefined}
            >
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
                <div className="name-groups">
                  {groupItemsByName(group.items).map(nameGroup => {
                    const nameKey = `${group.id}-${nameGroup.name.toLowerCase()}`;
                    const isNameCollapsed = collapsedNameGroups[nameKey];
                    const hasMultiple = nameGroup.items.length > 1;
                    
                    return (
                      <div key={nameKey} className="name-group">
                        {/* Gap #3: Collapsible name header when multiple items */}
                        {hasMultiple && (
                          <button 
                            className="name-group-header"
                            onClick={() => toggleNameGroup(nameKey)}
                          >
                            <span className="name-group-name">{nameGroup.name}</span>
                            <span className="name-group-count">{nameGroup.items.length} items</span>
                            <span className="collapse-icon">
                              {isNameCollapsed ? '▶' : '▼'}
                            </span>
                          </button>
                        )}
                        
                        {/* Items (collapsed if multiple and collapsed state) */}
                        {(!hasMultiple || !isNameCollapsed) && (
                          <ul className={`items ${hasMultiple ? 'indented' : ''}`}>
                            {nameGroup.items.map(item => {
                              const expColor = getExpirationColor(item.expiresAt);
                              const openColor = getOpenTagColor(item.openedAt, item.itemId?.timeToExpire);
                              const usesRemaining = item.usesRemaining ?? item.quantity ?? 1;
                              const itemIsEdible = isEdible(item.itemId);
                              const isOpen = !!item.openedAt;
                              
                              return (
                                <li 
                                  key={item._id} 
                                  className={`item ${expColor ? `exp-${expColor}` : ''} ${draggedItem?._id === item._id ? 'dragging' : ''}`}
                                  style={{ borderLeftColor: getItemBorderColor(item) }}
                                  draggable={groupBy === 'location'}
                                  onDragStart={(e) => handleDragStart(e, item)}
                                  onDragEnd={handleDragEnd}
                                >
                                  <div className="item-info">
                                    {/* Only show name if not in a multi-item name group */}
                                    {!hasMultiple && (
                                      <span className="name">{item.itemId?.name || 'Unknown'}</span>
                                    )}
                                    {/* Gap #5: Open tag with color */}
                                    {isOpen && (
                                      <span 
                                        className={`open-tag open-${openColor || 'green'}`}
                                        style={openColor ? {
                                          borderColor: OPEN_TAG_COLORS[openColor]?.border,
                                          backgroundColor: OPEN_TAG_COLORS[openColor]?.background,
                                          color: OPEN_TAG_COLORS[openColor]?.text,
                                        } : undefined}
                                      >
                                        OPEN
                                      </span>
                                    )}
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
                                    {/* Gap #5: Mark as Open button */}
                                    {!isOpen && (
                                      <button 
                                        className="open-btn"
                                        onClick={() => handleMarkOpen(item)}
                                        title="Mark as opened"
                                      >
                                        📦 Open
                                      </button>
                                    )}
                                    {/* Edible items: Eat and Cook buttons */}
                                    {itemIsEdible && (
                                      <div className="eat-cook-btns">
                                        <button 
                                          className="eat-btn" 
                                          onClick={() => handleEatOne(item)}
                                          title="Eat one"
                                        >
                                          🍴 Eat
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
                                    {/* Non-edible items: Use button */}
                                    {!itemIsEdible && (
                                      <button 
                                        className="use-btn" 
                                        onClick={() => handleUseOne(item)}
                                        title="Use one"
                                      >
                                        ✓ Use
                                      </button>
                                    )}
                                    {/* Throw out button for all items */}
                                    <button 
                                      className="throw-btn" 
                                      onClick={() => handleThrowOut(item)}
                                      title="Throw out"
                                    >
                                      🗑️
                                    </button>
                                    {/* Show quantity badge (no manual controls) */}
                                    <span className="qty-badge">×{item.quantity}</span>
                                  </div>
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
          })}
        </div>
      )}

      {/* Cook Modal - opens when Cook button clicked */}
      <CookDishModal 
        isOpen={!!cookModalItem}
        onClose={() => setCookModalItem(null)}
        preselectedItem={cookModalItem}
        onCookComplete={() => {
          setCookModalItem(null);
          fetchList(); // Refresh pantry
        }}
      />
    </div>
  );
}
