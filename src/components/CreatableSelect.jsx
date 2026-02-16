import React, { useState } from "react";

/**
 * A select dropdown that allows adding new custom options.
 * 
 * Props:
 * - name: field name for form handling
 * - value: current selected value
 * - onChange: handler for value changes (receives synthetic event)
 * - options: array of { value, label } or just strings
 * - onAddOption: async function to add new option, receives (fieldName, newValue)
 * - placeholder: optional placeholder for "select" state
 * - allowEmpty: whether to show an empty/none option
 * - emptyLabel: label for the empty option (default: "-- select --")
 */
const CreatableSelect = ({
  name,
  value,
  onChange,
  options = [],
  onAddOption,
  placeholder,
  allowEmpty = false,
  emptyLabel = "-- select --",
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newValue, setNewValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Normalize options to { value, label } format
  const normalizedOptions = options.map(opt => 
    typeof opt === "string" ? { value: opt, label: opt } : opt
  );

  const handleSelectChange = (e) => {
    if (e.target.value === "__add_new__") {
      setIsAdding(true);
      setError("");
    } else {
      onChange(e);
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    
    const trimmed = newValue.trim().toLowerCase();
    if (!trimmed) {
      setError("Please enter a value");
      return;
    }

    // Check if already exists
    if (normalizedOptions.some(opt => opt.value.toLowerCase() === trimmed)) {
      setError("This option already exists");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      if (onAddOption) {
        await onAddOption(name, trimmed);
      }
      
      // Create synthetic event to update the form
      const syntheticEvent = {
        target: { name, value: trimmed },
        preventDefault: () => {},
      };
      onChange(syntheticEvent);
      
      setIsAdding(false);
      setNewValue("");
    } catch (err) {
      setError(err.message || "Failed to add option");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setIsAdding(false);
    setNewValue("");
    setError("");
  };

  if (isAdding) {
    return (
      <div className="creatable-select-add">
        <form onSubmit={handleAddSubmit} className="creatable-add-form">
          <input
            type="text"
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            placeholder={`New ${name.replace(/_/g, " ")}...`}
            autoFocus
            disabled={isSubmitting}
          />
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "..." : "add"}
          </button>
          <button type="button" onClick={handleCancel} disabled={isSubmitting}>
            cancel
          </button>
        </form>
        {error && <span className="creatable-error">{error}</span>}
      </div>
    );
  }

  return (
    <select name={name} value={value} onChange={handleSelectChange}>
      {allowEmpty && <option value="">{emptyLabel}</option>}
      {placeholder && !value && <option value="" disabled>{placeholder}</option>}
      {normalizedOptions.map(opt => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
      <option value="__add_new__">+ Add new...</option>
    </select>
  );
};

export default CreatableSelect;
