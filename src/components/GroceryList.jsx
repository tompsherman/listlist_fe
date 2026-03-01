/**
 * Grocery List Component - V1 Logic Restored
 * 
 * Two modes:
 * - Add Mode: Search and add items, view as collapsed cards
 * - Shop Mode: Range sliders to mark quantities acquired
 * 
 * Done Shopping: Splits acquired → pantry, remainder → grocery
 */

import { useState, useEffect, useCallback } from 'react';
import { useUser } from '../context/UserContext';
import { listsApi } from '../services/lists';
import { itemsApi } from '../services/items';
import { getCached, setCache } from '../utils/cache';
import { CATEGORIES, getCategoryColor } from '../utils/categories';
import { CollapsibleCard, Button, Badge } from './ui';
import QuickAddForm from './QuickAddForm';
import ItemEditModal from './ItemEditModal';
import './GroceryList.css';

export default function GroceryList() {
  const { currentPod } = useUser();
  const [list, setList] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Mode state
  const [mode, setMode] = useState('view'); // 'view', 'add', 'shop'
  
  // Add item state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickAddName, setQuickAddName] = useState('');
  
  // Edit modal state
  const [editingItem, setEditingItem] = useState(null);
  
  // Shopping cart state (tracks slider values)
  const [cart, setCart] = useState({});

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

  // Initialize cart when entering shop mode
  useEffect(() => {
    if (mode === 'shop') {
      const initialCart = {};
      items.forEach(item => {
        initialCart[item._id] = {
          acquired: 0,
          needed: item.quantity || 1,
        };
      });
      setCart(initialCart);
    }
  }, [mode, items]);

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

  // Show quick add form for new item
  const handleShowQuickAdd = (name) => {
    setQuickAddName(name.trim());
    setShowQuickAdd(true);
    setSearchResults([]);
  };

  // Create custom item and add to list (from QuickAddForm)
  const handleCreateAndAdd = async ({ name, category, cost, quantity }) => {
    if (!list || !currentPod) return;
    
    try {
      const newItem = await itemsApi.create({
        name: name.trim(),
        category,
        cost: cost || null,
        podId: currentPod.podId,
      });
      
      // Add to list with specified quantity
      const listItem = await listsApi.addItem(list._id, {
        itemId: newItem._id,
        quantity: quantity || 1,
      });
      
      setItems(prev => [listItem, ...prev]);
      setSearchQuery('');
      setShowQuickAdd(false);
      setQuickAddName('');
    } catch (err) {
      console.error('Failed to create item:', err);
    }
  };

  // Handle item saved from edit modal
  const handleItemSaved = (savedItem) => {
    // Update items in list if the item was already there
    setItems(prev => prev.map(i => 
      (i.itemId?._id || i.itemId) === savedItem._id 
        ? { ...i, itemId: savedItem }
        : i
    ));
  };

  // Add item to list (with duplicate detection)
  const handleAddItem = async (catalogItem) => {
    if (!list) return;
    
    // Check if item already exists on the list
    const existingItem = items.find(i => 
      (i.itemId?._id || i.itemId) === catalogItem._id
    );
    
    if (existingItem) {
      // Increment quantity of existing item
      try {
        const updated = await listsApi.updateItem(list._id, existingItem._id, {
          quantity: (existingItem.quantity || 1) + 1,
        });
        setItems(prev => prev.map(i => i._id === existingItem._id ? updated : i));
        setSearchQuery('');
        setSearchResults([]);
      } catch (err) {
        console.error('Failed to update quantity:', err);
      }
      return;
    }
    
    // Add new item
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

  // Update quantity in add mode
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

  // Remove item
  const handleRemove = async (listItem) => {
    try {
      await listsApi.removeItem(list._id, listItem._id);
      setItems(prev => prev.filter(i => i._id !== listItem._id));
    } catch (err) {
      console.error('Failed to remove item:', err);
    }
  };

  // Update slider in shop mode
  const handleSliderChange = (itemId, value) => {
    setCart(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        acquired: parseInt(value, 10),
      },
    }));
  };

  // Done Shopping - split items between pantry and grocery
  const handleDoneShopping = async () => {
    if (!list) return;

    try {
      const itemsToReAdd = []; // Items with remaining qty to add back after checkout
      
      // Step 1: Mark items as checked with acquired qty
      for (const item of items) {
        const cartItem = cart[item._id];
        if (!cartItem) continue;
        
        const acquired = cartItem.acquired;
        const needed = cartItem.needed;
        
        if (acquired > 0) {
          // Track if we need to re-add remainder
          if (acquired < needed) {
            itemsToReAdd.push({
              itemId: item.itemId?._id || item.itemId,
              quantity: needed - acquired,
            });
          }
          
          // Update item: set qty to acquired amount and mark checked
          await listsApi.updateItem(list._id, item._id, {
            quantity: acquired,
            checked: true,
          });
        }
      }

      // Step 2: Checkout - moves all checked items to pantry
      await listsApi.checkout(list._id);

      // Step 3: Re-add remaining quantities back to grocery
      for (const item of itemsToReAdd) {
        await listsApi.addItem(list._id, {
          itemId: item.itemId,
          quantity: item.quantity,
        });
      }

      // Refresh list
      await fetchList();
      setMode('view');
      
    } catch (err) {
      console.error('Done shopping failed:', err);
    }
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
      category: c,
      items: groups[c],
    })).concat(
      groups.other ? [{ category: 'other', items: groups.other }] : []
    );
  };

  if (loading) {
    return <div className="grocery-list loading">Loading...</div>;
  }

  if (error) {
    return <div className="grocery-list error">{error}</div>;
  }

  const grouped = groupByCategory(items);

  return (
    <div className="grocery-list">
      {/* Mode Toggle Buttons */}
      <div className="list-header">
        <Button 
          variant={mode === 'add' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setMode(mode === 'add' ? 'view' : 'add')}
        >
          {mode === 'add' ? '✕ Close' : '+ Add Item'}
        </Button>
        <Button 
          variant={mode === 'shop' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setMode(mode === 'shop' ? 'view' : 'shop')}
        >
          {mode === 'shop' ? '✕ Cancel' : '🛒 Go Shop'}
        </Button>
        {mode === 'shop' && (
          <Button 
            variant="primary"
            size="sm"
            onClick={handleDoneShopping}
          >
            ✓ Done Shopping
          </Button>
        )}
      </div>

      {/* Add Item Search (only in add mode) */}
      {mode === 'add' && (
        <div className="add-item">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search items..."
            className="search-input"
          />
          {(searchResults.length > 0 || searchQuery.length >= 2) && (
            <ul className="search-results">
              {searchResults.map(item => {
                const existingItem = items.find(i => (i.itemId?._id || i.itemId) === item._id);
                const isOnList = !!existingItem;
                return (
                  <li 
                    key={item._id} 
                    onClick={() => handleAddItem(item)}
                    style={{ borderLeftColor: getCategoryColor(item.category) }}
                    className={isOnList ? 'on-list' : ''}
                  >
                    {item.name}
                    {isOnList ? (
                      <Badge size="sm" variant="success">+1 (have {existingItem.quantity})</Badge>
                    ) : (
                      <Badge size="sm">{item.category}</Badge>
                    )}
                  </li>
                );
              })}
              {searchQuery.length >= 2 && !searchResults.some(r => r.name.toLowerCase() === searchQuery.toLowerCase()) && !showQuickAdd && (
                <li className="create-new" onClick={() => handleShowQuickAdd(searchQuery)}>
                  + Create "{searchQuery}"
                </li>
              )}
            </ul>
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
      )}

      {/* Items */}
      {items.length === 0 ? (
        <p className="empty">Your grocery list is empty. Add some items!</p>
      ) : mode === 'shop' ? (
        /* SHOP MODE - Range Sliders */
        <div className="shop-mode">
          {grouped.map(({ category, items: catItems }) => (
            <div key={category} className="category-section">
              <h3 style={{ borderLeftColor: getCategoryColor(category) }}>
                {category}
              </h3>
              <div className="shop-items">
                {catItems.map(item => {
                  const cartItem = cart[item._id] || { acquired: 0, needed: item.quantity || 1 };
                  const isFulfilled = cartItem.acquired >= cartItem.needed;
                  
                  return (
                    <div 
                      key={item._id} 
                      className={`shop-item ${isFulfilled ? 'fulfilled' : ''}`}
                    >
                      <div className="item-info">
                        <span className={isFulfilled ? 'strikethrough' : ''}>
                          {item.itemId?.name || 'Unknown'}
                        </span>
                        <span className="qty-display">
                          {cartItem.acquired} / {cartItem.needed}
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max={cartItem.needed}
                        value={cartItem.acquired}
                        onChange={(e) => handleSliderChange(item._id, e.target.value)}
                        className="qty-slider"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* VIEW/ADD MODE - Collapsed Cards */
        <div className="view-mode">
          {grouped.map(({ category, items: catItems }) => (
            <div key={category} className="category-section">
              <h3 style={{ borderLeftColor: getCategoryColor(category) }}>
                {category} <Badge size="sm">{catItems.length}</Badge>
              </h3>
              <div className="item-cards">
                {catItems.map(item => (
                  <CollapsibleCard
                    key={item._id}
                    title={
                      <div className="card-title">
                        <span>{item.itemId?.name || 'Unknown'}</span>
                        <Badge size="sm">×{item.quantity || 1}</Badge>
                      </div>
                    }
                  >
                    <div className="card-details">
                      <div className="qty-controls">
                        <Button size="sm" variant="secondary" onClick={() => handleQuantityChange(item, -1)}>−</Button>
                        <span className="qty">{item.quantity || 1}</span>
                        <Button size="sm" variant="secondary" onClick={() => handleQuantityChange(item, 1)}>+</Button>
                      </div>
                      <div className="card-actions">
                        <Button size="sm" variant="secondary" onClick={() => setEditingItem(item.itemId)}>
                          ✏️ Edit
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleRemove(item)}>
                          Remove
                        </Button>
                      </div>
                    </div>
                  </CollapsibleCard>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

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
