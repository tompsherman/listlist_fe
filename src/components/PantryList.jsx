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
import { useCachedData } from '../hooks';
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
import QuickAddForm from './QuickAddForm';
import ItemEditModal from './ItemEditModal';
import ItemCard from './ItemCard';
import LoadingCountdown from './LoadingCountdown';
import './PantryList.css';

const LOCATIONS = [
  { id: 'fridge', label: '🧊 Fridge', color: '#4fc3f7' },
  { id: 'freezer', label: '❄️ Freezer', color: '#90caf9' },
  { id: 'pantry', label: '🏠 Pantry', color: '#ffb74d' },
  { id: 'counter', label: '🍌 Counter', color: '#aed581' },
];

export default function PantryList() {
  const { currentPod } = useUser();
  const [activeLocation, setActiveLocation] = useState('all');
  
  // Fetch pantry list with cold-start handling
  const {
    data: list,
    loading,
    error,
    countdown,
    isStale,
    applyChange,
    refetch: fetchList,
    setData: setList,
  } = useCachedData({
    key: currentPod ? `pantry_${currentPod.podId}` : null,
    fetchFn: async () => {
      const lists = await listsApi.getAll({ podId: currentPod.podId, type: 'pantry' });
      if (lists.length > 0) {
        return await listsApi.getById(lists[0]._id);
      }
      return null;
    },
    enabled: !!currentPod,
    coldStartMs: 30000,
  });

  // Derive items from list
  const items = list?.items || [];
  const setItems = (newItems) => {
    if (list) {
      setList({ ...list, items: typeof newItems === 'function' ? newItems(items) : newItems });
    }
  };
  
  // Add item state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [addingTo, setAddingTo] = useState(null);
  const [expiring, setExpiring] = useState([]);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickAddName, setQuickAddName] = useState('');
  const [quickAddLocation, setQuickAddLocation] = useState('pantry');
  
  // Edit modal state
  const [editingItem, setEditingItem] = useState(null);
  
  // UI state
  const [groupBy, setGroupBy] = useState('location'); // 'location' | 'category'
  const [collapsedGroups, setCollapsedGroups] = useState({});
  const [collapsedNameGroups, setCollapsedNameGroups] = useState({}); // Gap #3: name groups
  const [draggedItem, setDraggedItem] = useState(null);
  const [dropTarget, setDropTarget] = useState(null);

  // Fetch expiring items separately
  useEffect(() => {
    if (currentPod) {
      historyApi.getExpiring(7)
        .then(setExpiring)
        .catch(console.error);
    }
  }, [currentPod]);

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

  // Show quick add form
  const handleShowQuickAdd = (name, location) => {
    setQuickAddName(name.trim());
    setQuickAddLocation(location);
    setShowQuickAdd(true);
    setSearchResults([]);
  };

  // Create and add from quick form
  // Creates INDIVIDUAL entries for each unit (not 1 item with quantity=N)
  const handleCreateAndAdd = async ({ name, category, cost, quantity }) => {
    if (!list || !currentPod) return;
    
    try {
      const newItem = await itemsApi.create({
        name: name.trim(),
        category,
        cost: cost || null,
        podId: currentPod.podId,
        defaultLocation: quickAddLocation,
      });
      
      // Create individual entries for each unit
      const qty = quantity || 1;
      const newListItems = [];
      
      for (let i = 0; i < qty; i++) {
        const listItem = await listsApi.addItem(list._id, {
          itemId: newItem._id,
          quantity: 1,
          location: quickAddLocation,
        });
        newListItems.push(listItem);
      }
      
      setItems(prev => [...newListItems, ...prev]);
      setSearchQuery('');
      setShowQuickAdd(false);
      setQuickAddName('');
    } catch (err) {
      console.error('Failed to create item:', err);
    }
  };

  // Handle item saved from edit modal
  const handleItemSaved = (savedItem) => {
    setItems(prev => prev.map(i => 
      (i.itemId?._id || i.itemId) === savedItem._id 
        ? { ...i, itemId: savedItem }
        : i
    ));
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

  // #13: Build nested hierarchy with subgroups
  // Location mode: Location → Category → Name groups → Items
  // Category mode: Category → Location → Name groups → Items
  const buildNestedGroups = (itemList, primaryGroupBy) => {
    if (primaryGroupBy === 'location') {
      // Group by location first
      return LOCATIONS.map(loc => {
        const locItems = itemList.filter(i => i.location === loc.id);
        if (locItems.length === 0) return null;
        
        // Then group by category within location
        const categorySubgroups = CATEGORIES.map(cat => {
          const catItems = locItems.filter(i => i.itemId?.category === cat);
          if (catItems.length === 0) return null;
          return {
            id: cat,
            label: cat.charAt(0).toUpperCase() + cat.slice(1),
            color: getCategoryColor(cat),
            nameGroups: groupItemsByName(catItems),
            itemCount: catItems.length,
          };
        }).filter(Boolean);
        
        // Add "other" category if any items don't have a category
        const otherItems = locItems.filter(i => !CATEGORIES.includes(i.itemId?.category));
        if (otherItems.length > 0) {
          categorySubgroups.push({
            id: 'other',
            label: 'Other',
            color: '#888',
            nameGroups: groupItemsByName(otherItems),
            itemCount: otherItems.length,
          });
        }
        
        return {
          ...loc,
          subgroups: categorySubgroups,
          itemCount: locItems.length,
        };
      }).filter(Boolean);
    } else {
      // Group by category first
      const categoryGroups = CATEGORIES.map(cat => {
        const catItems = itemList.filter(i => i.itemId?.category === cat);
        if (catItems.length === 0) return null;
        
        // Then group by location within category
        const locationSubgroups = LOCATIONS.map(loc => {
          const locItems = catItems.filter(i => i.location === loc.id);
          if (locItems.length === 0) return null;
          return {
            id: loc.id,
            label: loc.label,
            color: loc.color,
            nameGroups: groupItemsByName(locItems),
            itemCount: locItems.length,
          };
        }).filter(Boolean);
        
        return {
          id: cat,
          label: cat.charAt(0).toUpperCase() + cat.slice(1),
          color: getCategoryColor(cat),
          subgroups: locationSubgroups,
          itemCount: catItems.length,
        };
      }).filter(Boolean);
      
      // Add "other" category
      const otherItems = itemList.filter(i => !CATEGORIES.includes(i.itemId?.category));
      if (otherItems.length > 0) {
        const locationSubgroups = LOCATIONS.map(loc => {
          const locItems = otherItems.filter(i => i.location === loc.id);
          if (locItems.length === 0) return null;
          return {
            id: loc.id,
            label: loc.label,
            color: loc.color,
            nameGroups: groupItemsByName(locItems),
            itemCount: locItems.length,
          };
        }).filter(Boolean);
        
        categoryGroups.push({
          id: 'other',
          label: 'Other',
          color: '#888',
          subgroups: locationSubgroups,
          itemCount: otherItems.length,
        });
      }
      
      return categoryGroups;
    }
  };
  
  // State for collapsed subgroups
  const [collapsedSubgroups, setCollapsedSubgroups] = useState({});
  
  const toggleSubgroup = (subgroupKey) => {
    setCollapsedSubgroups(prev => ({
      ...prev,
      [subgroupKey]: !prev[subgroupKey],
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

  // Show countdown when loading with no data (cold start)
  if (loading && !list) {
    return <LoadingCountdown countdown={countdown} />;
  }
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
        {(searchResults.length > 0 || searchQuery.length >= 2) && !showQuickAdd && (
          <div className="search-dropdown">
            <div className="location-hint">👆 Select location to add</div>
            <ul className="search-results">
              {searchResults.map(item => (
                <li key={item._id}>
                  <span className="item-name">{item.name}</span>
                  <div className="location-btns">
                    {LOCATIONS.map(loc => (
                      <button
                        key={loc.id}
                        onClick={() => handleAddItem(item, loc.id)}
                        title={`Add to ${loc.label}`}
                        className={`loc-btn loc-${loc.id}`}
                      >
                        {loc.label}
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
                        onClick={() => handleShowQuickAdd(searchQuery, loc.id)}
                        title={`Create and add to ${loc.label}`}
                        className={`loc-btn loc-${loc.id}`}
                      >
                        {loc.label}
                      </button>
                    ))}
                  </div>
                </li>
              )}
            </ul>
          </div>
        )}
        
        {/* Quick Add Form */}
        {showQuickAdd && (
          <QuickAddForm
            itemName={quickAddName}
            onSubmit={handleCreateAndAdd}
            onCancel={() => {
              setShowQuickAdd(false);
              setQuickAddName('');
            }}
          />
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

      {/* Items grouped - 3-level hierarchy */}
      {filteredItems.length === 0 ? (
        <p className="empty">No items here yet.</p>
      ) : (
        <div className="grouped-items">
          {buildNestedGroups(filteredItems, groupBy).map(group => {
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
              {/* Level 1: Location or Category header */}
              <button 
                className="group-header"
                onClick={() => toggleGroup(group.id)}
                style={{ borderLeftColor: group.color }}
              >
                <span className="group-name">{group.label}</span>
                <span className="group-count">{group.itemCount}</span>
                <span className="collapse-icon">
                  {collapsedGroups[group.id] ? '▶' : '▼'}
                </span>
              </button>
              
              {!collapsedGroups[group.id] && (
                <div className="subgroups">
                  {group.subgroups.map(subgroup => {
                    const subgroupKey = `${group.id}-${subgroup.id}`;
                    const isSubgroupCollapsed = collapsedSubgroups[subgroupKey];
                    
                    return (
                      <div key={subgroupKey} className="subgroup-section">
                        {/* Level 2: Category (in location mode) or Location (in category mode) */}
                        <button 
                          className="subgroup-header"
                          onClick={() => toggleSubgroup(subgroupKey)}
                          style={{ borderLeftColor: subgroup.color }}
                        >
                          <span className="subgroup-name">{subgroup.label}</span>
                          <span className="subgroup-count">{subgroup.itemCount}</span>
                          <span className="collapse-icon">
                            {isSubgroupCollapsed ? '▶' : '▼'}
                          </span>
                        </button>
                        
                        {!isSubgroupCollapsed && (
                          <div className="name-groups">
                            {subgroup.nameGroups.map(nameGroup => {
                              const nameKey = `${subgroupKey}-${nameGroup.name.toLowerCase()}`;
                              const isNameCollapsed = collapsedNameGroups[nameKey];
                              const hasMultiple = nameGroup.items.length > 1;
                              
                              return (
                                <div key={nameKey} className="name-group">
                                  {/* Level 3: Name group header (only if multiple) */}
                                  {hasMultiple && (
                                    <button 
                                      className="name-group-header"
                                      onClick={() => toggleNameGroup(nameKey)}
                                    >
                                      <span className="name-group-name">{nameGroup.name}</span>
                                      <span className="name-group-count">{nameGroup.items.length}</span>
                                      <span className="collapse-icon">
                                        {isNameCollapsed ? '▶' : '▼'}
                                      </span>
                                    </button>
                                  )}
                                  
                                  {/* Level 4: Individual items */}
                                  {(!hasMultiple || !isNameCollapsed) && (
                                    <div className={`items ${hasMultiple ? 'indented' : ''}`}>
                                      {nameGroup.items.map(listItem => (
                                        <div 
                                          key={listItem._id}
                                          className={draggedItem?._id === listItem._id ? 'dragging' : ''}
                                          draggable={groupBy === 'location'}
                                          onDragStart={(e) => handleDragStart(e, listItem)}
                                          onDragEnd={handleDragEnd}
                                        >
                                          <ItemCard
                                            item={listItem.itemId}
                                            listItem={listItem}
                                            allPantryItems={items}
                                            onOpen={handleMarkOpen}
                                            onEat={handleEatOne}
                                            onCook={handleCookIt}
                                            onUse={handleUseOne}
                                            onThrow={handleThrowOut}
                                            onEdit={setEditingItem}
                                          />
                                        </div>
                                      ))}
                                    </div>
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
      
      {/* Item Edit Modal */}
      <ItemEditModal
        isOpen={!!editingItem}
        onClose={() => setEditingItem(null)}
        item={editingItem}
        onSave={handleItemSaved}
      />
    </div>
  );
}
