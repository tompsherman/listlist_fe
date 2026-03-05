/**
 * ItemEditModal Component
 * Full edit modal for all item fields
 * 
 * For global items: creates PodItemOverride (pod-specific customization)
 * For pod items: edits directly
 */

import { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { itemsApi } from '../services/items';
import { useQueuedMutation } from '../hooks';
import { 
  CATEGORIES, 
  getCategoryColor,
  EXPIRATION_OPTIONS,
  STORAGE_LOCATION_OPTIONS,
} from '../utils/categories';
import { Modal, ModalFooter, Button } from './ui';
import './ItemEditModal.css';

const CATEGORY_OPTIONS = CATEGORIES.map(cat => ({
  value: cat,
  label: cat.charAt(0).toUpperCase() + cat.slice(1),
}));

const PURCHASE_UNITS = ['each', 'lb', 'oz', 'bunch', 'bag', 'box', 'can', 'jar', 'bottle', 'gallon', 'dozen', 'carton', 'pack'];
const USE_UNITS = ['each', 'cup', 'tbsp', 'tsp', 'slice', 'serving', 'oz', 'lb', 'piece', 'self'];
const STORAGE_SIZES = ['pint', 'quart', 'half_gallon', 'gallon', 'small', 'medium', 'large'];

export default function ItemEditModal({ isOpen, onClose, item, onSave }) {
  const { currentPod } = useUser();
  
  const [form, setForm] = useState({
    name: '',
    category: 'other',
    purchaseUnit: 'each',
    useUnit: 'each',
    usePerUnit: 1,
    defaultLocation: 'pantry',
    storageSize: '',
    shelfLifeDays: '',
    timeToExpire: 'nine_days',
    cost: '',
    perishable: true,
    brandMatters: false,
    brand: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Queued mutation for editing items (handles cold start)
  const { mutate: editItemMutate, isPending, isQueued } = useQueuedMutation({
    mutationFn: async ({ itemId, podId, data }) => {
      return await itemsApi.update(itemId, { ...data, podId });
    },
    onSuccess: (saved) => {
      onSave?.(saved);
      onClose();
    },
    onError: (err) => {
      setError(err.message || 'Failed to save');
      setSaving(false);
    },
  });

  // Initialize form when item changes
  useEffect(() => {
    if (item) {
      setForm({
        name: item.name || '',
        category: item.category || 'other',
        purchaseUnit: item.purchaseUnit || item.defaultUnit || 'each',
        useUnit: item.useUnit || 'each',
        usePerUnit: item.usePerUnit || 1,
        defaultLocation: item.defaultLocation || 'pantry',
        storageSize: item.storageSize || '',
        shelfLifeDays: item.shelfLifeDays || '',
        timeToExpire: item.timeToExpire || 'nine_days',
        cost: item.cost || '',
        perishable: item.perishable !== false,
        brandMatters: item.brandMatters || false,
        brand: item.brand || '',
      });
    }
  }, [item]);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('Name is required');
      return;
    }
    if (!currentPod?.podId) {
      setError('No pod selected');
      return;
    }

    setSaving(true);
    setError('');
    
    const payload = {
      ...form,
      cost: form.cost ? parseFloat(form.cost) : null,
      shelfLifeDays: form.shelfLifeDays ? parseInt(form.shelfLifeDays) : null,
      usePerUnit: parseInt(form.usePerUnit) || 1,
      storageSize: form.storageSize || null,
    };

    if (item?._id) {
      // Update existing - use queued mutation (handles global item overrides)
      editItemMutate({
        itemId: item._id,
        podId: currentPod.podId,
        data: payload,
      });
    } else {
      // Create new - direct call (less critical, creates pod-specific item)
      try {
        const saved = await itemsApi.create({ ...payload, podId: currentPod.podId });
        onSave?.(saved);
        onClose();
      } catch (err) {
        setError(err.message || 'Failed to create');
        setSaving(false);
      }
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={item?._id ? `Edit ${item.name}` : 'Create Item'}
      className="item-edit-modal"
    >
      <form onSubmit={handleSubmit}>
        {error && <div className="error-message">{error}</div>}
        
        {/* Basic Info */}
        <section className="form-section">
          <h4>Basic Info</h4>
          <div className="form-grid">
            <label className="full-width">
              Name *
              <input
                type="text"
                value={form.name}
                onChange={(e) => handleChange('name', e.target.value)}
                required
              />
            </label>
            
            <label>
              Category *
              <select
                value={form.category}
                onChange={(e) => handleChange('category', e.target.value)}
                style={{ borderColor: getCategoryColor(form.category) }}
              >
                {CATEGORY_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </label>
            
            <label>
              Cost ($)
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.cost}
                onChange={(e) => handleChange('cost', e.target.value)}
                placeholder="0.00"
              />
            </label>
          </div>
        </section>

        {/* Units */}
        <section className="form-section">
          <h4>Units</h4>
          <div className="form-grid">
            <label>
              Purchase Unit
              <select
                value={form.purchaseUnit}
                onChange={(e) => handleChange('purchaseUnit', e.target.value)}
              >
                {PURCHASE_UNITS.map(u => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </label>
            
            <label>
              Use Unit
              <select
                value={form.useUnit}
                onChange={(e) => handleChange('useUnit', e.target.value)}
              >
                {USE_UNITS.map(u => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </label>
            
            <label>
              Uses Per Unit
              <input
                type="number"
                min="1"
                value={form.usePerUnit}
                onChange={(e) => handleChange('usePerUnit', e.target.value)}
              />
            </label>
          </div>
        </section>

        {/* Storage */}
        <section className="form-section">
          <h4>Storage</h4>
          <div className="form-grid">
            <label>
              Default Location
              <select
                value={form.defaultLocation}
                onChange={(e) => handleChange('defaultLocation', e.target.value)}
              >
                {STORAGE_LOCATION_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
                <option value="closet">Closet</option>
              </select>
            </label>
            
            <label>
              Storage Size
              <select
                value={form.storageSize}
                onChange={(e) => handleChange('storageSize', e.target.value)}
              >
                <option value="">N/A</option>
                {STORAGE_SIZES.map(s => (
                  <option key={s} value={s}>{s.replace('_', ' ')}</option>
                ))}
              </select>
            </label>
          </div>
        </section>

        {/* Expiration */}
        <section className="form-section">
          <h4>Expiration</h4>
          <div className="form-grid">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={form.perishable}
                onChange={(e) => handleChange('perishable', e.target.checked)}
              />
              Perishable
            </label>
            
            <label>
              Shelf Life (days)
              <input
                type="number"
                min="0"
                value={form.shelfLifeDays}
                onChange={(e) => handleChange('shelfLifeDays', e.target.value)}
                placeholder="e.g. 14"
              />
            </label>
            
            <label>
              Time to Expire (after opening)
              <select
                value={form.timeToExpire}
                onChange={(e) => handleChange('timeToExpire', e.target.value)}
              >
                {EXPIRATION_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </label>
          </div>
        </section>

        {/* Brand */}
        <section className="form-section">
          <h4>Brand</h4>
          <div className="form-grid">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={form.brandMatters}
                onChange={(e) => handleChange('brandMatters', e.target.checked)}
              />
              Brand Matters
            </label>
            
            {form.brandMatters && (
              <label>
                Preferred Brand
                <input
                  type="text"
                  value={form.brand}
                  onChange={(e) => handleChange('brand', e.target.value)}
                  placeholder="e.g. Heinz"
                />
              </label>
            )}
          </div>
        </section>

        <ModalFooter>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit" loading={saving || isPending} disabled={isQueued}>
            {isQueued ? '⏳ Queued...' : isPending ? 'Saving...' : item?._id ? 'Save Changes' : 'Create Item'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
