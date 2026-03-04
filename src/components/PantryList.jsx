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
import { Modal, Button } from './ui';
import './PantryList.css';

const LOCATIONS = [
  { id: 'fridge', label: '🧊 Fridge', color: '#4fc3f7' },
  { id: 'freezer', label: '❄️ Freezer', color: '#90caf9' },
  { id: 'outside freezer', label: '🏔️ Outside', color: '#87CEEB' },
  { id: 'pantry', label: '🏠 Pantry', color: '#ffb74d' },
  { id: 'counter', label: '🍌 Counter', color: '#aed581' },
];

// Split options based on current storage size
const SPLIT_OPTIONS = {
  gallon: [
    { targetSize: 'half_gallon', count: 2, label: '2 half-gallons' },
    { targetSize: 'quart', count: 4, label: '4 quarts' },
    { targetSize: 'pint', count: 8, label: '8 pints' },
  ],
  half_gallon: [
    { targetSize: 'quart', count: 2, label: '2 quarts' },
    { targetSize: 'pint', count: 4, label: '4 pints' },
  ],
  quart: [
    { targetSize: 'pint', count: 2, label: '2 pints' },
  ],
  large: [
    { targetSize: 'medium', count: 2, label: '2 medium' },
    { targetSize: 'small', count: 4, label: '4 small' },
  ],
  medium: [
    { targetSize: 'small', count: 2, label: '2 small' },
  ],
};

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
  
  // Removal flow state
  const [removingItem, setRemovingItem] = useState(null);
  const [removalStep, setRemovalStep] = useState('reason'); // 'reason' | 'grocery'
  const [removalReason, setRemovalReason] = useState(null);
  
  // Use-up flow state (when eating/using last unit)
  const [useUpItem, setUseUpItem] = useState(null);
  
  // Split/Breakdown state
  const [splittingItem, setSplittingItem] = useState(null);
  const [breakingDownItem, setBreakingDownItem] = useState(null);
  
  // UI state
  const [groupBy, setGroupBy] = useState('location'); // 'location' | 'category'
  const [collapsedGroups, setCollapsedGroups] = useState({});
  const [collapsedNameGroups, setCollapsedNameGroups] = useState({});
  const [collapsedSubgroups, setCollapsedSubgroups] = useState({});
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

  // Mark item as opened
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

  // Eat one use of an item
  const handleEatOne = async (listItem) => {
    const currentUses = listItem.usesRemaining ?? listItem.quantity ?? 1;
    
    if (currentUses <= 1) {
      // This will be the last use - show grocery prompt
      setUseUpItem(listItem);
      return;
    }
    
    try {
      const result = await listsApi.useItem(list._id, listItem._id, { amount: 1 });
      if (result.isEmpty) {
        setItems(prev => prev.filter(i => i._id !== listItem._id));
      } else {
        setItems(prev => prev.map(i => i._id === listItem._id ? result.item : i));
      }
    } catch (err) {
      console.error('Failed to eat item:', err);
    }
  };

  // Handle use-up confirmation (last unit)
  const handleUseUpConfirm = async (addToGrocery) => {
    if (!useUpItem) return;
    
    try {
      await listsApi.useItem(list._id, useUpItem._id, { amount: 1, addToGrocery });
      setItems(prev => prev.filter(i => i._id !== useUpItem._id));
    } catch (err) {
      console.error('Failed to use item:', err);
    }
    setUseUpItem(null);
  };

  // Use item in cooking - opens cook modal
  const [cookModalItem, setCookModalItem] = useState(null);
  
  const handleCookIt = (listItem) => {
    setCookModalItem(listItem);
  };

  // Use (for non-edible items like household)
  const handleUseOne = async (listItem) => {
    const currentUses = listItem.usesRemaining ?? listItem.quantity ?? 1;
    
    if (currentUses <= 1) {
      // This will be the last use - show grocery prompt
      setUseUpItem(listItem);
      return;
    }
    
    try {
      const result = await listsApi.useItem(list._id, listItem._id, { amount: 1 });
      if (result.isEmpty) {
        setItems(prev => prev.filter(i => i._id !== listItem._id));
      } else {
        setItems(prev => prev.map(i => i._id === listItem._id ? result.item : i));
      }
    } catch (err) {
      console.error('Failed to use item:', err);
    }
  };

  // Start removal flow (shows reason picker)
  const handleThrowOut = (listItem) => {
    setRemovingItem(listItem);
    setRemovalStep('reason');
    setRemovalReason(null);
  };

  // Select removal reason
  const handleSelectReason = (reason) => {
    setRemovalReason(reason);
    setRemovalStep('grocery');
  };

  // Complete removal with grocery decision
  const handleRemovalComplete = async (addToGrocery) => {
    if (!removingItem || !removalReason) return;
    
    try {
      await listsApi.archiveItem(list._id, removingItem._id, {
        reason: removalReason,
        addToGrocery,
      });
      setItems(prev => prev.filter(i => i._id !== removingItem._id));
    } catch (err) {
      console.error('Failed to archive item:', err);
    }
    
    setRemovingItem(null);
    setRemovalStep('reason');
    setRemovalReason(null);
  };

  // Cancel removal flow
  const handleCancelRemoval = () => {
    setRemovingItem(null);
    setRemovalStep('reason');
    setRemovalReason(null);
  };

  // Split container
  const handleSplit = async (targetSize, count) => {
    if (!splittingItem) return;
    
    try {
      const result = await listsApi.splitItem(list._id, splittingItem._id, { targetSize, count });
      // Remove old item, add new items
      setItems(prev => [
        ...result.items,
        ...prev.filter(i => i._id !== splittingItem._id),
      ]);
    } catch (err) {
      console.error('Failed to split item:', err);
    }
    setSplittingItem(null);
  };

  // Break down item
  const handleBreakdown = async () => {
    if (!breakingDownItem) return;
    
    try {
      const result = await listsApi.breakdownItem(list._id, breakingDownItem._id);
      // Remove old item, add new items
      setItems(prev => [
        ...result.items,
        ...prev.filter(i => i._id !== breakingDownItem._id),
      ]);
    } catch (err) {
      console.error('Failed to break down item:', err);
    }
    setBreakingDownItem(null);
  };

  // Toggle group collapse
  const toggleGroup = (groupId) => {
    setCollapsedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  const toggleNameGroup = (nameKey) => {
    setCollapsedNameGroups(prev => ({
      ...prev,
      [nameKey]: !prev[nameKey],
    }));
  };

  const toggleSubgroup = (subgroupKey) => {
    setCollapsedSubgroups(prev => ({
      ...prev,
      [subgroupKey]: !prev[subgroupKey],
    }));
  };

  // Group items by name within a group
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
        const aOpen = !!a.openedAt;
        const bOpen = !!b.openedAt;
        if (aOpen && !bOpen) return -1;
        if (!aOpen && bOpen) return 1;
        
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

  // Build nested hierarchy
  const buildNestedGroups = (itemList, primaryGroupBy) => {
    if (primaryGroupBy === 'location') {
      return LOCATIONS.map(loc => {
        const locItems = itemList.filter(i => i.location === loc.id);
        if (locItems.length === 0) return null;
        
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
      const categoryGroups = CATEGORIES.map(cat => {
        const catItems = itemList.filter(i => i.itemId?.category === cat);
        if (catItems.length === 0) return null;
        
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

  // Drag and drop handlers
  const handleDragStart = (e, item) => {
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', item._id);
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
                  <button 
                    className="item-name item-name-btn"
                    onClick={() => handleAddItem(item, item.defaultLocation || 'pantry')}
                    title={`Quick add to ${item.defaultLocation || 'pantry'}`}
                  >
                    {item.name}
                    <span className="default-loc-hint">→ {item.defaultLocation || 'pantry'}</span>
                  </button>
                  <div className="location-btns">
                    {LOCATIONS.map(loc => (
                      <button
                        key={loc.id}
                        onClick={() => handleAddItem(item, loc.id)}
                        title={`Add to ${loc.label}`}
                        className={`loc-btn loc-${loc.id}${loc.id === item.defaultLocation ? ' default' : ''}`}
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
              <button 
                className="group-header"
                onClick={() => toggleGroup(group.id)}
                style={{ backgroundColor: group.color }}
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
                        <button 
                          className="subgroup-header"
                          onClick={() => toggleSubgroup(subgroupKey)}
                          style={{ backgroundColor: subgroup.color }}
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
                                            onOpen={handleMarkOpen}
                                            onEat={handleEatOne}
                                            onCook={handleCookIt}
                                            onUse={handleUseOne}
                                            onThrow={handleThrowOut}
                                            onEdit={setEditingItem}
                                            onSplit={(listItem.storageSize || listItem.itemId?.storageSize) && SPLIT_OPTIONS[listItem.storageSize || listItem.itemId?.storageSize] ? setSplittingItem : undefined}
                                            onBreakdown={listItem.itemId?.breaksDown && listItem.itemId?.breaksInto?.length > 0 ? setBreakingDownItem : undefined}
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

      {/* Cook Modal */}
      <CookDishModal 
        isOpen={!!cookModalItem}
        onClose={() => setCookModalItem(null)}
        preselectedItem={cookModalItem}
        onCookComplete={() => {
          setCookModalItem(null);
          fetchList();
        }}
      />
      
      {/* Item Edit Modal */}
      <ItemEditModal
        isOpen={!!editingItem}
        onClose={() => setEditingItem(null)}
        item={editingItem}
        onSave={handleItemSaved}
      />

      {/* Removal Flow Modal */}
      <Modal
        isOpen={!!removingItem}
        onClose={handleCancelRemoval}
        title={`Remove ${removingItem?.itemId?.name || 'item'}?`}
      >
        {removalStep === 'reason' ? (
          <div className="removal-reasons">
            <p>What happened to this item?</p>
            <div className="reason-buttons">
              <Button variant="success" onClick={() => handleSelectReason('finished')}>
                ✓ Finished
              </Button>
              <Button variant="warning" onClick={() => handleSelectReason('expired')}>
                ⏰ Expired
              </Button>
              <Button variant="destructive" onClick={() => handleSelectReason('trashed')}>
                🗑️ Trashed
              </Button>
            </div>
            <Button variant="secondary" onClick={handleCancelRemoval} className="cancel-btn">
              Cancel
            </Button>
          </div>
        ) : (
          <div className="grocery-prompt">
            <p>Add <strong>{removingItem?.itemId?.name}</strong> to your grocery list?</p>
            <div className="grocery-buttons">
              <Button variant="primary" onClick={() => handleRemovalComplete(true)}>
                Yes, add to grocery
              </Button>
              <Button variant="secondary" onClick={() => handleRemovalComplete(false)}>
                No thanks
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Use-up Flow Modal (last unit) */}
      <Modal
        isOpen={!!useUpItem}
        onClose={() => setUseUpItem(null)}
        title="All used up!"
      >
        <div className="grocery-prompt">
          <p>You just used the last of <strong>{useUpItem?.itemId?.name}</strong>.</p>
          <p>Add it to your grocery list?</p>
          <div className="grocery-buttons">
            <Button variant="primary" onClick={() => handleUseUpConfirm(true)}>
              Yes, add to grocery
            </Button>
            <Button variant="secondary" onClick={() => handleUseUpConfirm(false)}>
              No thanks
            </Button>
          </div>
        </div>
      </Modal>

      {/* Split Modal */}
      <Modal
        isOpen={!!splittingItem}
        onClose={() => setSplittingItem(null)}
        title={`Split ${splittingItem?.itemId?.name || 'item'}`}
      >
        {(() => {
          const storageSize = splittingItem?.storageSize || splittingItem?.itemId?.storageSize;
          const options = storageSize ? SPLIT_OPTIONS[storageSize] : [];
          return (
            <div className="split-options">
              <p>Split this {storageSize?.replace('_', ' ')} into:</p>
              <div className="split-buttons">
                {options?.map(opt => (
                  <Button 
                    key={opt.targetSize}
                    variant="secondary"
                    onClick={() => handleSplit(opt.targetSize, opt.count)}
                  >
                    {opt.label}
                  </Button>
                ))}
              </div>
              <Button variant="secondary" onClick={() => setSplittingItem(null)} className="cancel-btn">
                Cancel
              </Button>
            </div>
          );
        })()}
      </Modal>

      {/* Breakdown Modal */}
      <Modal
        isOpen={!!breakingDownItem}
        onClose={() => setBreakingDownItem(null)}
        title={`Break down ${breakingDownItem?.itemId?.name || 'item'}`}
      >
        <div className="breakdown-confirm">
          <p>Break this down into:</p>
          <ul className="breakdown-parts">
            {breakingDownItem?.itemId?.breaksInto?.map((part, i) => (
              <li key={i}>{part.name}</li>
            ))}
          </ul>
          <div className="breakdown-buttons">
            <Button variant="primary" onClick={handleBreakdown}>
              Yes, break it down
            </Button>
            <Button variant="secondary" onClick={() => setBreakingDownItem(null)}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
