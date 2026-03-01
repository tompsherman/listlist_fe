/**
 * QuickAddForm Component
 * Toggle-down form for creating new items with category, cost, and quantity
 */

import { useState } from 'react';
import { CATEGORIES, getCategoryColor } from '../utils/categories';
import './QuickAddForm.css';

const CATEGORY_OPTIONS = CATEGORIES.map(cat => ({
  value: cat,
  label: cat.charAt(0).toUpperCase() + cat.slice(1),
}));

export default function QuickAddForm({ itemName, onSubmit, onCancel }) {
  const [category, setCategory] = useState('');
  const [cost, setCost] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!category) return; // Category is required
    
    setSubmitting(true);
    try {
      await onSubmit({
        name: itemName,
        category,
        cost: cost ? parseFloat(cost) : null,
        quantity,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="quick-add-form" onSubmit={handleSubmit}>
      <div className="form-header">
        <span className="item-name">Create "{itemName}"</span>
        <button type="button" className="close-btn" onClick={onCancel}>×</button>
      </div>
      
      <div className="form-row">
        <label>
          Category *
          <select 
            value={category} 
            onChange={(e) => setCategory(e.target.value)}
            required
            style={category ? { borderColor: getCategoryColor(category) } : {}}
          >
            <option value="">Select category...</option>
            {CATEGORY_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </label>
        
        <label>
          Est. Cost
          <div className="cost-input">
            <span className="currency">$</span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              placeholder="0.00"
            />
          </div>
        </label>
        
        <label>
          Add
          <div className="qty-selector">
            <button type="button" onClick={() => setQuantity(q => Math.max(1, q - 1))}>−</button>
            <span className="qty">{quantity}</span>
            <button type="button" onClick={() => setQuantity(q => q + 1)}>+</button>
          </div>
        </label>
      </div>
      
      <div className="form-actions">
        <button 
          type="submit" 
          className="create-btn"
          disabled={!category || submitting}
        >
          {submitting ? 'Creating...' : `+ Add ${quantity} to list`}
        </button>
      </div>
    </form>
  );
}
