/**
 * Grocery List Component - V1 Logic Restored
 * 
 * Two modes:
 * - Add Mode: Search and add items, view as collapsed cards
 * - Shop Mode: Range sliders to mark quantities acquired
 * 
 * Done Shopping: Splits acquired → pantry, remainder → grocery
 */

import { useState, useEffect, useRef } from 'react';
import { useUser } from '../context/UserContext';
import { listsApi } from '../services/lists';
import { itemsApi } from '../services/items';
import { useCachedData, useQueuedMutation } from '../hooks';
import { CATEGORIES, getCategoryColor } from '../utils/categories';
import { CollapsibleCard, Button, Badge, useToast } from './ui';
import QuickAddForm from './QuickAddForm';
import ItemEditModal from './ItemEditModal';
import LoadingCountdown from './LoadingCountdown';
import './GroceryList.css';

export default function GroceryList() {
  const { currentPod } = useUser();
  const { addToast } = useToast();
  
  // Fetch grocery list with cold-start handling
  const {
    data: list,
    loading,
    error,
    countdown,
    isStale,
    refetch: fetchList,
    setData: setList,
  } = useCachedData({
    key: currentPod ? `grocery_${currentPod.podId}` : null,
    fetchFn: async () => {
      const lists = await listsApi.getAll({ podId: currentPod.podId, type: 'grocery' });
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
  
  // Collapsed categories state
  const [collapsedCategories, setCollapsedCategories] = useState({});

  // Done shopping mutation - queued if backend initializing
  const { mutate: doneShoppingMutate, isPending: isDoneShoppingPending, isQueued: isDoneShoppingQueued } = useQueuedMutation({
    mutationFn: async (cartData) => {
      if (!list) throw new Error('No list');
      console.log('[DoneShopping] Sending cart:', cartData);
      console.log('[DoneShopping] List ID:', list._id);
      const result = await listsApi.doneShopping(list._id, cartData);
      console.log('[DoneShopping] Result:', result);
      return result;
    },
    onOptimistic: (cartData) => {
      // Optimistically update local state - remove/update items based on cart
      setItems(currentItems => {
        return currentItems.reduce((acc, item) => {
          const cartItem = cartData[item._id];
          if (!cartItem || cartItem.acquired <= 0) {
            // Not in cart or nothing acquired - keep as-is
            acc.push(item);
          } else if (cartItem.acquired < cartItem.needed) {
            // Partial - update with remainder
            acc.push({ ...item, quantity: cartItem.needed - cartItem.acquired });
          }
          // If acquired >= needed, item is removed (not added to acc)
          return acc;
        }, []);
      });
    },
    onSuccess: (result) => {
      console.log('Done shopping success:', result);
      addToast({
        type: 'success',
        message: `Added ${result.pantryCreated} items to pantry`,
      });
      fetchList(); // Refresh to get accurate server state
      setMode('view');
    },
    onError: (err) => {
      console.error('Done shopping failed:', err);
      addToast({
        type: 'error',
        message: err?.message || 'Failed to complete checkout. Please try again.',
      });
      fetchList(); // Refresh to revert optimistic update
    },
  });

  // Add item mutation - queued if backend initializing
  const { mutate: addItemMutate } = useQueuedMutation({
    mutationFn: async ({ listId, itemId, quantity = 1 }) => {
      return await listsApi.addItem(listId, { itemId, quantity });
    },
    onOptimistic: ({ itemId, quantity, catalogItem }) => {
      // Optimistically add to local state
      const tempItem = {
        _id: `temp_${Date.now()}`,
        itemId: catalogItem || itemId,
        quantity,
        checked: false,
      };
      setItems(prev => [tempItem, ...prev]);
    },
    onSuccess: (newItem) => {
      // Replace temp item with actual server response
      fetchList();
    },
    onError: (err) => {
      console.error('Failed to add item:', err);
      fetchList(); // Revert
    },
  });

  // Update item mutation - queued if backend initializing
  const { mutate: updateItemMutate } = useQueuedMutation({
    mutationFn: async ({ listId, itemId, data }) => {
      return await listsApi.updateItem(listId, itemId, data);
    },
    onOptimistic: ({ itemId, data }) => {
      setItems(prev => prev.map(item => 
        item._id === itemId ? { ...item, ...data } : item
      ));
    },
    onSuccess: () => fetchList(),
    onError: (err) => {
      console.error('Failed to update item:', err);
      fetchList();
    },
  });

  // Initialize cart when entering shop mode (only once per shop session)
  const shopSessionRef = useRef(false);
  
  useEffect(() => {
    if (mode === 'shop' && !shopSessionRef.current) {
      // Entering shop mode - initialize cart
      const initialCart = {};
      items.forEach(item => {
        initialCart[item._id] = {
          acquired: 0,
          needed: item.quantity || 1,
        };
      });
      setCart(initialCart);
      shopSessionRef.current = true;
    } else if (mode !== 'shop' && shopSessionRef.current) {
      // Leaving shop mode - reset
      setCart({});
      shopSessionRef.current = false;
    }
  }, [mode]); // Only react to mode changes, not items

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

  // Add item to list (with duplicate detection) - queued if backend initializing
  const handleAddItem = (catalogItem) => {
    if (!list) return;
    
    // Check if item already exists on the list
    const existingItem = items.find(i => 
      (i.itemId?._id || i.itemId) === catalogItem._id
    );
    
    if (existingItem) {
      // Increment quantity of existing item
      updateItemMutate({
        listId: list._id,
        itemId: existingItem._id,
        data: { quantity: (existingItem.quantity || 1) + 1 },
      });
      setSearchQuery('');
      setSearchResults([]);
      return;
    }
    
    // Add new item
    addItemMutate({
      listId: list._id,
      itemId: catalogItem._id,
      quantity: 1,
      catalogItem, // Pass for optimistic update
    });
    setSearchQuery('');
    setSearchResults([]);
  };

  // Update quantity in add mode - queued if backend initializing
  const handleQuantityChange = (listItem, delta) => {
    const newQty = Math.max(1, (listItem.quantity || 1) + delta);
    updateItemMutate({
      listId: list._id,
      itemId: listItem._id,
      data: { quantity: newQty },
    });
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

  // Done Shopping - atomic operation via queued mutation
  const handleDoneShopping = () => {
    if (!list) return;
    
    // Filter cart to only items with acquired > 0
    const cartData = {};
    for (const [itemId, cartItem] of Object.entries(cart)) {
      if (cartItem.acquired > 0) {
        cartData[itemId] = cartItem;
      }
    }
    
    if (Object.keys(cartData).length === 0) {
      setMode('view');
      return;
    }
    
    // Fire mutation (queued if backend initializing, immediate otherwise)
    doneShoppingMutate(cartData);
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
    return CATEGORIES.filter(c => groups[c]).map(c => ({
      category: c,
      items: groups[c],
    })).concat(
      groups.other ? [{ category: 'other', items: groups.other }] : []
    );
  };

  // Show countdown when loading with no data (cold start)
  if (loading && !list) {
    return <LoadingCountdown countdown={countdown} />;
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
          disabled={mode === 'shop'}
          title={mode === 'shop' ? 'Finish shopping first' : undefined}
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
      </div>

      {/* Estimated Cost - shown at top in shop mode and view mode */}
      {items.length > 0 && (
        <div className="estimated-cost">
          💰 Estimated: ${items.reduce((sum, item) => {
            const price = item.itemId?.cost || 0;
            const qty = item.quantity || 1;
            return sum + (price * qty);
          }, 0).toFixed(2)}
        </div>
      )}

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
              <h3 style={{ backgroundColor: getCategoryColor(category) }}>
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
          
          {/* Done Shopping - at bottom, orange */}
          <Button 
            variant="warning"
            size="lg"
            onClick={handleDoneShopping}
            disabled={isDoneShoppingPending || isDoneShoppingQueued}
            className="done-shopping-btn"
          >
            {isDoneShoppingQueued ? '⏳ Queued...' : isDoneShoppingPending ? '⏳ Saving...' : '✓ Done Shopping'}
          </Button>
        </div>
      ) : (
        /* VIEW/ADD MODE - Collapsible Category Cards */
        <div className="view-mode">
          {grouped.map(({ category, items: catItems }) => (
            <div key={category} className="category-section">
              <button 
                className="category-header"
                onClick={() => toggleCategory(category)}
                style={{ backgroundColor: getCategoryColor(category) }}
              >
                <span className="category-name">{category}</span>
                <span className="category-count">{catItems.length}</span>
                <span className="collapse-icon">
                  {collapsedCategories[category] ? '▶' : '▼'}
                </span>
              </button>
              {!collapsedCategories[category] && (
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
              )}
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
