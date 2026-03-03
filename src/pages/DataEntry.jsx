/**
 * Data Entry Page
 * Admin interface for managing Items and Dishes
 * Protected by DATA_SECRET env var
 */

import { useState, useEffect, useCallback } from 'react';
import SEO from '../components/SEO';
import api from '../services/api';

const DATA_SECRET = import.meta.env.VITE_DATA_SECRET || '';
const STORAGE_KEY = 'data_entry_unlocked';

// Item enums - extensible via localStorage
const DEFAULT_CATEGORIES = ['vegetable', 'herbs', 'fruit', 'grains', 'meat', 'dairy', 'leftovers', 'household', 'snack', 'drinks', 'other'];
const DEFAULT_UNITS = ['each', 'lb', 'oz', 'bunch', 'bag', 'box', 'can', 'jar', 'bottle', 'gallon', 'dozen'];
const DEFAULT_LOCATIONS = ['fridge', 'freezer', 'pantry', 'counter'];
const TIME_TO_EXPIRE = ['three_days', 'six_days', 'nine_days', 'eighteen_days', 'thirty-six_days', 'seventy-three_days', 'three-hundred-sixty-five_days', 'never'];

// Load custom options from localStorage
const getCustomOptions = (key, defaults) => {
  try {
    const stored = localStorage.getItem(`listlist_custom_${key}`);
    if (stored) {
      const custom = JSON.parse(stored);
      return [...new Set([...defaults, ...custom])];
    }
  } catch (e) {}
  return defaults;
};

const saveCustomOption = (key, value, defaults) => {
  try {
    const stored = localStorage.getItem(`listlist_custom_${key}`);
    const custom = stored ? JSON.parse(stored) : [];
    if (!defaults.includes(value) && !custom.includes(value)) {
      custom.push(value);
      localStorage.setItem(`listlist_custom_${key}`, JSON.stringify(custom));
    }
  } catch (e) {}
};

// Dynamic getters
const getCategories = () => getCustomOptions('categories', DEFAULT_CATEGORIES);
const getUnits = () => getCustomOptions('units', DEFAULT_UNITS);
const getLocations = () => getCustomOptions('locations', DEFAULT_LOCATIONS);

// Dish enums
const DISH_TYPES = ['main', 'side', 'dessert'];
const MEAL_CATEGORIES = ['breakfast', 'lunch', 'dinner', 'snack'];

export default function DataEntry() {
  const [secret, setSecret] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('items'); // 'items' or 'dishes'

  // Check if already unlocked
  useEffect(() => {
    if (sessionStorage.getItem(STORAGE_KEY) === 'true') {
      setUnlocked(true);
    }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (secret === DATA_SECRET) {
      sessionStorage.setItem(STORAGE_KEY, 'true');
      setUnlocked(true);
      setError('');
    } else {
      setError('Invalid secret');
      setSecret('');
    }
  };

  // Password gate
  if (!unlocked) {
    return (
      <>
        <SEO title="Data Entry" description="Admin data entry" path="/data/entry" noIndex />
        <div className="container" style={{ textAlign: 'center', paddingTop: '4rem' }}>
          <h1>📝 Data Entry</h1>
          <p style={{ color: '#666', marginTop: '1rem' }}>Enter the data secret to continue.</p>
          <form onSubmit={handleSubmit} style={{ marginTop: '2rem', maxWidth: '400px', margin: '2rem auto 0' }}>
            <input
              type="password"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              placeholder="Enter secret..."
              autoFocus
              style={{
                width: '100%',
                padding: '0.75rem',
                fontSize: '1rem',
                border: `2px solid ${error ? '#e53e3e' : '#ccc'}`,
                borderRadius: '8px',
              }}
            />
            {error && <p style={{ color: '#e53e3e', marginTop: '0.5rem', fontSize: '0.875rem' }}>{error}</p>}
            <button
              type="submit"
              style={{
                width: '100%',
                marginTop: '1rem',
                padding: '0.75rem',
                backgroundColor: '#3182ce',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '1rem',
              }}
              disabled={!secret}
            >
              Enter
            </button>
          </form>
        </div>
      </>
    );
  }

  return (
    <>
      <SEO title="Data Entry" description="Admin data entry" path="/data/entry" noIndex />
      <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
        <h1>📝 Data Entry</h1>
        <p style={{ color: '#666', marginBottom: '2rem' }}>Manage Items and Dishes for alpha testing</p>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '2px solid #eee', paddingBottom: '1rem' }}>
          <button
            onClick={() => setActiveTab('items')}
            style={{
              padding: '0.75rem 1.5rem',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              backgroundColor: activeTab === 'items' ? '#3182ce' : '#eee',
              color: activeTab === 'items' ? 'white' : '#333',
              fontWeight: 'bold',
            }}
          >
            🥕 Items
          </button>
          <button
            onClick={() => setActiveTab('dishes')}
            style={{
              padding: '0.75rem 1.5rem',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              backgroundColor: activeTab === 'dishes' ? '#3182ce' : '#eee',
              color: activeTab === 'dishes' ? 'white' : '#333',
              fontWeight: 'bold',
            }}
          >
            🍽️ Dishes
          </button>
        </div>

        {activeTab === 'items' && <ItemsManager />}
        {activeTab === 'dishes' && <DishesManager />}
      </div>
    </>
  );
}

/**
 * Items Manager Component
 */
function ItemsManager() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [showCustomOptions, setShowCustomOptions] = useState(false);
  const [message, setMessage] = useState('');

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/items/all', {
        params: { limit: 200, q: search || undefined },
        headers: { 'x-data-secret': DATA_SECRET },
      });
      setItems(response);
    } catch (err) {
      setMessage('Error: ' + (err.message || 'Failed to fetch'));
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleDelete = async (id) => {
    if (!confirm('Delete this item?')) return;
    try {
      await api.delete(`/api/items/${id}`, {
        headers: { 'x-data-secret': DATA_SECRET },
      });
      setMessage('Item deleted');
      fetchItems();
    } catch (err) {
      setMessage('Error: ' + err.message);
    }
  };

  const handleDeleteAll = async () => {
    if (!confirm('DELETE ALL ITEMS? This cannot be undone!')) return;
    if (!confirm('Are you REALLY sure?')) return;
    try {
      const response = await api.delete('/api/items/all?confirm=yes', {
        headers: { 'x-data-secret': DATA_SECRET },
      });
      setMessage(`Deleted ${response.count} items`);
      fetchItems();
    } catch (err) {
      setMessage('Error: ' + err.message);
    }
  };

  return (
    <div>
      {/* Search and Actions */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search items..."
          style={{ flex: 1, minWidth: '200px', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
        />
        <button onClick={() => { setEditingItem(null); setShowForm(true); }} style={btnStyle}>+ Add Item</button>
        <button onClick={() => setShowBulkImport(true)} style={{ ...btnStyle, backgroundColor: '#38a169' }}>📋 Bulk Import</button>
        <button onClick={() => setShowCustomOptions(true)} style={{ ...btnStyle, backgroundColor: '#805ad5' }}>⚙️ Options</button>
        <button onClick={handleDeleteAll} style={{ ...btnStyle, backgroundColor: '#e53e3e' }}>🗑️ Delete All</button>
      </div>

      {message && <p style={{ padding: '0.5rem', backgroundColor: '#eee', borderRadius: '4px', marginBottom: '1rem' }}>{message}</p>}

      {/* Bulk Import */}
      {showBulkImport && (
        <BulkImportForm
          onImport={(count) => { setShowBulkImport(false); fetchItems(); setMessage(`Imported ${count} items!`); }}
          onCancel={() => setShowBulkImport(false)}
        />
      )}

      {/* Custom Options Manager */}
      {showCustomOptions && (
        <CustomOptionsManager
          onClose={() => setShowCustomOptions(false)}
        />
      )}

      {/* Form */}
      {showForm && (
        <ItemForm
          item={editingItem}
          onSave={() => { setShowForm(false); setEditingItem(null); fetchItems(); setMessage('Saved!'); }}
          onCancel={() => { setShowForm(false); setEditingItem(null); }}
        />
      )}

      {/* List */}
      {loading ? (
        <p>Loading...</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #333', textAlign: 'left' }}>
              <th style={thStyle}>Name</th>
              <th style={thStyle}>Category</th>
              <th style={thStyle}>Unit</th>
              <th style={thStyle}>Location</th>
              <th style={thStyle}>Shelf Life</th>
              <th style={thStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item._id || item.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={tdStyle}>{item.name}</td>
                <td style={tdStyle}>{item.category}</td>
                <td style={tdStyle}>{item.defaultUnit}</td>
                <td style={tdStyle}>{item.defaultLocation}</td>
                <td style={tdStyle}>{item.shelfLifeDays || '—'}</td>
                <td style={tdStyle}>
                  <button onClick={() => { setEditingItem(item); setShowForm(true); }} style={smallBtnStyle}>Edit</button>
                  <button onClick={() => handleDelete(item._id || item.id)} style={{ ...smallBtnStyle, backgroundColor: '#e53e3e' }}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <p style={{ marginTop: '1rem', color: '#666' }}>{items.length} items</p>
    </div>
  );
}

/**
 * Item Form Component
 */
function ItemForm({ item, onSave, onCancel }) {
  const [form, setForm] = useState({
    name: item?.name || '',
    category: item?.category || 'other',
    defaultUnit: item?.defaultUnit || 'each',
    defaultLocation: item?.defaultLocation || 'pantry',
    shelfLifeDays: item?.shelfLifeDays || '',
    usePerUnit: item?.usePerUnit || 1,
    timeToExpire: item?.timeToExpire || 'nine_days',
    isGlobal: item?.isGlobal !== false,
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, shelfLifeDays: form.shelfLifeDays ? parseInt(form.shelfLifeDays) : null };
      if (item) {
        await api.patch(`/api/items/${item._id || item.id}`, payload, {
          headers: { 'x-data-secret': DATA_SECRET },
        });
      } else {
        await api.post('/api/items/admin', payload, {
          headers: { 'x-data-secret': DATA_SECRET },
        });
      }
      onSave();
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ backgroundColor: '#f5f5f5', padding: '1.5rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
      <h3>{item ? 'Edit Item' : 'Add Item'}</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
        <label>
          Name *
          <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required style={inputStyle} />
        </label>
        <label>
          Category
          <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} style={inputStyle}>
            {getCategories().map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
        <label>
          Default Unit
          <select value={form.defaultUnit} onChange={(e) => setForm({ ...form, defaultUnit: e.target.value })} style={inputStyle}>
            {getUnits().map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
        </label>
        <label>
          Default Location
          <select value={form.defaultLocation} onChange={(e) => setForm({ ...form, defaultLocation: e.target.value })} style={inputStyle}>
            {getLocations().map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
        </label>
        <label>
          Shelf Life (days)
          <input type="number" value={form.shelfLifeDays} onChange={(e) => setForm({ ...form, shelfLifeDays: e.target.value })} style={inputStyle} />
        </label>
        <label>
          Uses Per Unit
          <input type="number" value={form.usePerUnit} onChange={(e) => setForm({ ...form, usePerUnit: parseInt(e.target.value) || 1 })} style={inputStyle} />
        </label>
        <label>
          Time to Expire
          <select value={form.timeToExpire} onChange={(e) => setForm({ ...form, timeToExpire: e.target.value })} style={inputStyle}>
            {TIME_TO_EXPIRE.map((t) => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
          </select>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <input type="checkbox" checked={form.isGlobal} onChange={(e) => setForm({ ...form, isGlobal: e.target.checked })} />
          Global Item
        </label>
      </div>
      <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
        <button type="submit" disabled={saving} style={btnStyle}>{saving ? 'Saving...' : 'Save'}</button>
        <button type="button" onClick={onCancel} style={{ ...btnStyle, backgroundColor: '#666' }}>Cancel</button>
      </div>
    </form>
  );
}

/**
 * Bulk Import Form Component
 * Paste CSV/TSV data to import multiple items at once
 */
function BulkImportForm({ onImport, onCancel }) {
  const [bulkData, setBulkData] = useState('');
  const [preview, setPreview] = useState([]);
  const [importing, setImporting] = useState(false);

  const parseData = (text) => {
    const lines = text.trim().split('\n');
    if (lines.length === 0) return [];
    
    // Detect delimiter (tab or comma)
    const delimiter = lines[0].includes('\t') ? '\t' : ',';
    
    // Parse header
    const headers = lines[0].split(delimiter).map(h => h.trim().toLowerCase());
    
    // Map common header names
    const headerMap = {
      'name': 'name',
      'item': 'name',
      'item name': 'name',
      'category': 'category',
      'type': 'category',
      'unit': 'defaultUnit',
      'default unit': 'defaultUnit',
      'location': 'defaultLocation',
      'default location': 'defaultLocation',
      'storage': 'defaultLocation',
      'shelf life': 'shelfLifeDays',
      'shelf life days': 'shelfLifeDays',
      'days': 'shelfLifeDays',
      'uses': 'usePerUnit',
      'uses per unit': 'usePerUnit',
      'portions': 'usePerUnit',
    };
    
    const mappedHeaders = headers.map(h => headerMap[h] || h);
    
    // Parse rows
    const items = [];
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      const values = lines[i].split(delimiter).map(v => v.trim());
      const item = {};
      mappedHeaders.forEach((header, idx) => {
        if (values[idx]) {
          item[header] = values[idx];
        }
      });
      if (item.name) {
        // Apply defaults
        item.category = item.category || 'other';
        item.defaultUnit = item.defaultUnit || 'each';
        item.defaultLocation = item.defaultLocation || 'pantry';
        item.usePerUnit = parseInt(item.usePerUnit) || 1;
        item.shelfLifeDays = parseInt(item.shelfLifeDays) || null;
        item.isGlobal = true;
        items.push(item);
      }
    }
    return items;
  };

  const handlePreview = () => {
    const parsed = parseData(bulkData);
    setPreview(parsed);
  };

  const handleImport = async () => {
    if (preview.length === 0) return;
    setImporting(true);
    
    let successCount = 0;
    for (const item of preview) {
      try {
        await api.post('/api/items/admin', item, {
          headers: { 'x-data-secret': DATA_SECRET },
        });
        successCount++;
      } catch (err) {
        console.error(`Failed to import ${item.name}:`, err);
      }
    }
    
    setImporting(false);
    onImport(successCount);
  };

  return (
    <div style={{ backgroundColor: '#f0fff4', padding: '1.5rem', borderRadius: '8px', marginBottom: '1.5rem', border: '2px solid #38a169' }}>
      <h3>📋 Bulk Import Items</h3>
      <p style={{ fontSize: '0.875rem', color: '#666', marginBottom: '1rem' }}>
        Paste CSV or tab-separated data. First row should be headers.<br/>
        Supported columns: name, category, unit, location, shelf life, uses
      </p>
      <textarea
        value={bulkData}
        onChange={(e) => setBulkData(e.target.value)}
        placeholder="name&#9;category&#9;location&#9;uses
Milk&#9;dairy&#9;fridge&#9;8
Chicken Breast&#9;meat&#9;freezer&#9;4
Rice&#9;grains&#9;pantry&#9;20"
        rows={8}
        style={{ ...inputStyle, fontFamily: 'monospace', fontSize: '0.75rem', whiteSpace: 'pre' }}
      />
      
      <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
        <button type="button" onClick={handlePreview} style={btnStyle}>Preview ({parseData(bulkData).length} items)</button>
        <button type="button" onClick={handleImport} disabled={preview.length === 0 || importing} style={{ ...btnStyle, backgroundColor: '#38a169' }}>
          {importing ? 'Importing...' : `Import ${preview.length} Items`}
        </button>
        <button type="button" onClick={onCancel} style={{ ...btnStyle, backgroundColor: '#666' }}>Cancel</button>
      </div>
      
      {preview.length > 0 && (
        <div style={{ marginTop: '1rem', maxHeight: '200px', overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#e2e8f0' }}>
                <th style={thStyle}>Name</th>
                <th style={thStyle}>Category</th>
                <th style={thStyle}>Location</th>
                <th style={thStyle}>Uses</th>
              </tr>
            </thead>
            <tbody>
              {preview.slice(0, 10).map((item, i) => (
                <tr key={i}>
                  <td style={tdStyle}>{item.name}</td>
                  <td style={tdStyle}>{item.category}</td>
                  <td style={tdStyle}>{item.defaultLocation}</td>
                  <td style={tdStyle}>{item.usePerUnit}</td>
                </tr>
              ))}
              {preview.length > 10 && (
                <tr><td colSpan={4} style={{ ...tdStyle, textAlign: 'center', color: '#666' }}>... and {preview.length - 10} more</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/**
 * Custom Options Manager
 * Add new categories, units, and locations
 */
function CustomOptionsManager({ onClose }) {
  const [newCategory, setNewCategory] = useState('');
  const [newUnit, setNewUnit] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [, forceUpdate] = useState(0);

  const handleAddCategory = () => {
    if (newCategory.trim()) {
      saveCustomOption('categories', newCategory.trim().toLowerCase(), DEFAULT_CATEGORIES);
      setNewCategory('');
      forceUpdate(n => n + 1);
    }
  };

  const handleAddUnit = () => {
    if (newUnit.trim()) {
      saveCustomOption('units', newUnit.trim().toLowerCase(), DEFAULT_UNITS);
      setNewUnit('');
      forceUpdate(n => n + 1);
    }
  };

  const handleAddLocation = () => {
    if (newLocation.trim()) {
      saveCustomOption('locations', newLocation.trim().toLowerCase(), DEFAULT_LOCATIONS);
      setNewLocation('');
      forceUpdate(n => n + 1);
    }
  };

  return (
    <div style={{ backgroundColor: '#faf5ff', padding: '1.5rem', borderRadius: '8px', marginBottom: '1.5rem', border: '2px solid #805ad5' }}>
      <h3>⚙️ Custom Options</h3>
      <p style={{ fontSize: '0.875rem', color: '#666', marginBottom: '1rem' }}>
        Add custom categories, units, and locations. These are stored locally in your browser.
      </p>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
        {/* Categories */}
        <div>
          <h4 style={{ marginBottom: '0.5rem' }}>Categories</h4>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <input
              type="text"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="e.g., seeds"
              style={{ ...inputStyle, flex: 1 }}
              onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
            />
            <button onClick={handleAddCategory} style={{ ...btnStyle, backgroundColor: '#805ad5' }}>+</button>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#666' }}>
            Current: {getCategories().join(', ')}
          </div>
        </div>
        
        {/* Units */}
        <div>
          <h4 style={{ marginBottom: '0.5rem' }}>Units</h4>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <input
              type="text"
              value={newUnit}
              onChange={(e) => setNewUnit(e.target.value)}
              placeholder="e.g., packet"
              style={{ ...inputStyle, flex: 1 }}
              onKeyDown={(e) => e.key === 'Enter' && handleAddUnit()}
            />
            <button onClick={handleAddUnit} style={{ ...btnStyle, backgroundColor: '#805ad5' }}>+</button>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#666' }}>
            Current: {getUnits().join(', ')}
          </div>
        </div>
        
        {/* Locations */}
        <div>
          <h4 style={{ marginBottom: '0.5rem' }}>Locations</h4>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <input
              type="text"
              value={newLocation}
              onChange={(e) => setNewLocation(e.target.value)}
              placeholder="e.g., outside fridge"
              style={{ ...inputStyle, flex: 1 }}
              onKeyDown={(e) => e.key === 'Enter' && handleAddLocation()}
            />
            <button onClick={handleAddLocation} style={{ ...btnStyle, backgroundColor: '#805ad5' }}>+</button>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#666' }}>
            Current: {getLocations().join(', ')}
          </div>
        </div>
      </div>
      
      <div style={{ marginTop: '1rem' }}>
        <button onClick={onClose} style={btnStyle}>Done</button>
      </div>
    </div>
  );
}

/**
 * Dishes Manager Component
 */
function DishesManager() {
  const [dishes, setDishes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingDish, setEditingDish] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState('');

  const fetchDishes = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/dishes/all', {
        params: { limit: 200, q: search || undefined },
        headers: { 'x-data-secret': DATA_SECRET },
      });
      setDishes(response);
    } catch (err) {
      setMessage('Error: ' + (err.message || 'Failed to fetch'));
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchDishes();
  }, [fetchDishes]);

  const handleDelete = async (id) => {
    if (!confirm('Delete this dish?')) return;
    try {
      await api.delete(`/api/dishes/admin/${id}`, {
        headers: { 'x-data-secret': DATA_SECRET },
      });
      setMessage('Dish deleted');
      fetchDishes();
    } catch (err) {
      setMessage('Error: ' + err.message);
    }
  };

  const handleDeleteAll = async () => {
    if (!confirm('DELETE ALL DISHES? This cannot be undone!')) return;
    if (!confirm('Are you REALLY sure?')) return;
    try {
      const response = await api.delete('/api/dishes/all?confirm=yes', {
        headers: { 'x-data-secret': DATA_SECRET },
      });
      setMessage(`Deleted ${response.count} dishes`);
      fetchDishes();
    } catch (err) {
      setMessage('Error: ' + err.message);
    }
  };

  return (
    <div>
      {/* Search and Actions */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search dishes..."
          style={{ flex: 1, minWidth: '200px', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
        />
        <button onClick={() => { setEditingDish(null); setShowForm(true); }} style={btnStyle}>+ Add Dish</button>
        <button onClick={handleDeleteAll} style={{ ...btnStyle, backgroundColor: '#e53e3e' }}>🗑️ Delete All</button>
      </div>

      {message && <p style={{ padding: '0.5rem', backgroundColor: '#eee', borderRadius: '4px', marginBottom: '1rem' }}>{message}</p>}

      {/* Form */}
      {showForm && (
        <DishForm
          dish={editingDish}
          onSave={() => { setShowForm(false); setEditingDish(null); fetchDishes(); setMessage('Saved!'); }}
          onCancel={() => { setShowForm(false); setEditingDish(null); }}
        />
      )}

      {/* List */}
      {loading ? (
        <p>Loading...</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #333', textAlign: 'left' }}>
              <th style={thStyle}>Name</th>
              <th style={thStyle}>Type</th>
              <th style={thStyle}>Meal</th>
              <th style={thStyle}>Ingredients</th>
              <th style={thStyle}>Tags</th>
              <th style={thStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {dishes.map((dish) => (
              <tr key={dish._id || dish.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={tdStyle}>{dish.name}</td>
                <td style={tdStyle}>{dish.dishType}</td>
                <td style={tdStyle}>{dish.mealCategory}</td>
                <td style={tdStyle}>{dish.ingredients?.length || 0}</td>
                <td style={tdStyle}>{dish.tags?.join(', ') || '—'}</td>
                <td style={tdStyle}>
                  <button onClick={() => { setEditingDish(dish); setShowForm(true); }} style={smallBtnStyle}>Edit</button>
                  <button onClick={() => handleDelete(dish._id || dish.id)} style={{ ...smallBtnStyle, backgroundColor: '#e53e3e' }}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <p style={{ marginTop: '1rem', color: '#666' }}>{dishes.length} dishes</p>
    </div>
  );
}

/**
 * Dish Form Component
 */
function DishForm({ dish, onSave, onCancel }) {
  const [form, setForm] = useState({
    name: dish?.name || '',
    dishType: dish?.dishType || 'main',
    mealCategory: dish?.mealCategory || 'dinner',
    tags: dish?.tags?.join(', ') || '',
    ingredients: JSON.stringify(dish?.ingredients || [], null, 2),
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      let ingredients = [];
      try {
        ingredients = JSON.parse(form.ingredients);
      } catch {
        alert('Invalid ingredients JSON');
        setSaving(false);
        return;
      }

      const payload = {
        name: form.name,
        dishType: form.dishType,
        mealCategory: form.mealCategory,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
        ingredients,
      };

      if (dish) {
        await api.patch(`/api/dishes/admin/${dish._id || dish.id}`, payload, {
          headers: { 'x-data-secret': DATA_SECRET },
        });
      } else {
        await api.post('/api/dishes/admin', payload, {
          headers: { 'x-data-secret': DATA_SECRET },
        });
      }
      onSave();
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ backgroundColor: '#f5f5f5', padding: '1.5rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
      <h3>{dish ? 'Edit Dish' : 'Add Dish'}</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
        <label>
          Name *
          <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required style={inputStyle} />
        </label>
        <label>
          Dish Type
          <select value={form.dishType} onChange={(e) => setForm({ ...form, dishType: e.target.value })} style={inputStyle}>
            {DISH_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>
        <label>
          Meal Category
          <select value={form.mealCategory} onChange={(e) => setForm({ ...form, mealCategory: e.target.value })} style={inputStyle}>
            {MEAL_CATEGORIES.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </label>
        <label>
          Tags (comma separated)
          <input type="text" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="quick, vegetarian, family" style={inputStyle} />
        </label>
      </div>
      <label style={{ display: 'block', marginTop: '1rem' }}>
        Ingredients (JSON)
        <textarea
          value={form.ingredients}
          onChange={(e) => setForm({ ...form, ingredients: e.target.value })}
          rows={6}
          style={{ ...inputStyle, fontFamily: 'monospace', fontSize: '0.875rem' }}
          placeholder='[{"name": "chicken", "quantity": 2, "unit": "lb"}]'
        />
      </label>
      <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
        <button type="submit" disabled={saving} style={btnStyle}>{saving ? 'Saving...' : 'Save'}</button>
        <button type="button" onClick={onCancel} style={{ ...btnStyle, backgroundColor: '#666' }}>Cancel</button>
      </div>
    </form>
  );
}

// Shared styles
const btnStyle = { padding: '0.5rem 1rem', backgroundColor: '#3182ce', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' };
const smallBtnStyle = { padding: '0.25rem 0.5rem', marginRight: '0.25rem', backgroundColor: '#3182ce', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' };
const inputStyle = { display: 'block', width: '100%', padding: '0.5rem', marginTop: '0.25rem', border: '1px solid #ccc', borderRadius: '4px' };
const thStyle = { padding: '0.75rem 0.5rem' };
const tdStyle = { padding: '0.5rem' };
