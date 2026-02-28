/**
 * TagInput Component
 * Text field where Enter/comma creates tag chips, backspace removes last.
 * For search filters, content tagging, skill lists, email recipients.
 */

import { useState, useRef } from 'react';
import './TagInput.css';

export default function TagInput({
  value = [],
  onChange,
  placeholder = 'Add tags...',
  maxTags,
  allowDuplicates = false,
  disabled = false,
  className = '',
}) {
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef(null);

  const addTag = (tag) => {
    const trimmed = tag.trim();
    if (!trimmed) return;
    if (!allowDuplicates && value.includes(trimmed)) return;
    if (maxTags && value.length >= maxTags) return;

    onChange?.([...value, trimmed]);
    setInputValue('');
  };

  const removeTag = (index) => {
    const newTags = value.filter((_, i) => i !== index);
    onChange?.(newTags);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      removeTag(value.length - 1);
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text');
    // Split by comma or newline
    const tags = pasted.split(/[,\n]/).map((t) => t.trim()).filter(Boolean);
    const newTags = [...value];
    
    for (const tag of tags) {
      if (!allowDuplicates && newTags.includes(tag)) continue;
      if (maxTags && newTags.length >= maxTags) break;
      newTags.push(tag);
    }
    
    onChange?.(newTags);
  };

  const handleContainerClick = () => {
    inputRef.current?.focus();
  };

  return (
    <div
      className={`tag-input ${disabled ? 'tag-input-disabled' : ''} ${className}`}
      onClick={handleContainerClick}
    >
      <div className="tag-input-tags">
        {value.map((tag, index) => (
          <span key={`${tag}-${index}`} className="tag-input-tag">
            <span className="tag-input-tag-text">{tag}</span>
            {!disabled && (
              <button
                type="button"
                className="tag-input-tag-remove"
                onClick={(e) => {
                  e.stopPropagation();
                  removeTag(index);
                }}
                aria-label={`Remove ${tag}`}
              >
                ×
              </button>
            )}
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder={value.length === 0 ? placeholder : ''}
          disabled={disabled || (maxTags && value.length >= maxTags)}
          className="tag-input-input"
        />
      </div>
      {maxTags && (
        <span className="tag-input-count">
          {value.length}/{maxTags}
        </span>
      )}
    </div>
  );
}
