/**
 * CurrencyInput Component
 * Text input that formats as currency as you type.
 * Stores raw cents internally, displays formatted value.
 */

import { useState, useRef, useEffect } from 'react';
import './CurrencyInput.css';

/**
 * Format cents to currency string
 */
function formatCurrency(cents, locale = 'en-US', currency = 'USD') {
  const value = cents / 100;
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(value);
}

/**
 * Parse currency string to cents
 */
function parseCurrency(value) {
  // Remove all non-numeric except decimal
  const cleaned = value.replace(/[^0-9.]/g, '');
  const parsed = parseFloat(cleaned);
  if (isNaN(parsed)) return 0;
  return Math.round(parsed * 100);
}

export default function CurrencyInput({
  value = 0, // Value in cents
  onChange,
  locale = 'en-US',
  currency = 'USD',
  min,
  max,
  placeholder,
  disabled = false,
  className = '',
  ...props
}) {
  const inputRef = useRef(null);
  const [displayValue, setDisplayValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  // Update display when value prop changes (and not focused)
  useEffect(() => {
    if (!isFocused) {
      setDisplayValue(value === 0 ? '' : formatCurrency(value, locale, currency));
    }
  }, [value, locale, currency, isFocused]);

  const handleFocus = () => {
    setIsFocused(true);
    // Show raw number for editing
    if (value > 0) {
      setDisplayValue((value / 100).toFixed(2));
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    // Parse and clamp
    let cents = parseCurrency(displayValue);
    
    if (min !== undefined) cents = Math.max(min, cents);
    if (max !== undefined) cents = Math.min(max, cents);
    
    onChange?.(cents);
    setDisplayValue(cents === 0 ? '' : formatCurrency(cents, locale, currency));
  };

  const handleChange = (e) => {
    const raw = e.target.value;
    // Allow digits, decimal, and common currency chars during typing
    const cleaned = raw.replace(/[^0-9.,]/g, '');
    setDisplayValue(cleaned);
  };

  // Get currency symbol for placeholder
  const symbol = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  })
    .formatToParts(0)
    .find((p) => p.type === 'currency')?.value || '$';

  return (
    <div className={`currency-input ${className}`}>
      <span className="currency-input-symbol">{symbol}</span>
      <input
        ref={inputRef}
        type="text"
        inputMode="decimal"
        value={displayValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder || '0.00'}
        disabled={disabled}
        className="currency-input-field"
        {...props}
      />
    </div>
  );
}
