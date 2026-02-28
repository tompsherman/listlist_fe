/**
 * SearchBar Component
 * Debounced input with clear button
 */

import { useState, useEffect, useRef } from 'react';
import './SearchBar.css';

export default function SearchBar({
  value = '',
  onChange,
  placeholder = 'Search...',
  debounceMs = 300,
  loading = false,
  disabled = false,
  className = '',
  ...props
}) {
  const [localValue, setLocalValue] = useState(value);
  const debounceTimer = useRef(null);

  // Sync external value changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = (e) => {
    const newValue = e.target.value;
    setLocalValue(newValue);

    // Clear existing timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Debounce the onChange callback
    debounceTimer.current = setTimeout(() => {
      onChange?.(newValue);
    }, debounceMs);
  };

  const handleClear = () => {
    setLocalValue('');
    onChange?.('');
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  return (
    <div className={`search-bar ${className}`}>
      <span className="search-bar-icon" aria-hidden="true">
        {loading ? (
          <span className="search-bar-spinner" />
        ) : (
          '🔍'
        )}
      </span>
      <input
        type="text"
        value={localValue}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        className="search-bar-input"
        {...props}
      />
      {localValue && !disabled && (
        <button
          type="button"
          onClick={handleClear}
          className="search-bar-clear"
          aria-label="Clear search"
        >
          ✕
        </button>
      )}
    </div>
  );
}
