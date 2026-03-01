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

// Item enums
const CATEGORIES = ['vegetable', 'herbs', 'fruit', 'grains', 'meat', 'dairy', 'leftovers', 'household', 'snack', 'drinks', 'other'];
const UNITS = ['each', 'lb', 'oz', 'bunch', 'bag', 'box', 'can', 'jar', 'bottle', 'gallon', 'dozen'];
const LOCATIONS = ['fridge', 'freezer', 'pantry', 'counter'];
const TIME_TO_EXPIRE = ['three_days', 'six_days', 'nine_days', 'eighteen_days', 'thirty-six_days', 'seventy-three_days', 'three-hundred-sixty-five_days', 'never'];

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
        <button onClick={handleDeleteAll} style={{ ...btnStyle, backgroundColor: '#e53e3e' }}>🗑️ Delete All</button>
      </div>

      {message && <p style={{ padding: '0.5rem', backgroundColor: '#eee', borderRadius: '4px', marginBottom: '1rem' }}>{message}</p>}

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
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
        <label>
          Default Unit
          <select value={form.defaultUnit} onChange={(e) => setForm({ ...form, defaultUnit: e.target.value })} style={inputStyle}>
            {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
        </label>
        <label>
          Default Location
          <select value={form.defaultLocation} onChange={(e) => setForm({ ...form, defaultLocation: e.target.value })} style={inputStyle}>
            {LOCATIONS.map((l) => <option key={l} value={l}>{l}</option>)}
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
