/**
 * DatePicker Component
 * Three controlled inputs (month/day/year), outputs ISO string
 * Designed for React Hook Form Controller integration
 */

import { useState, useEffect } from 'react';
import './DatePicker.css';

const MONTHS_WITH_30_DAYS = [4, 6, 9, 11];
const MONTHS_WITH_31_DAYS = [1, 3, 5, 7, 8, 10, 12];

function isLeapYear(year) {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function getDaysInMonth(month, year) {
  if (!month) return 31;
  const m = parseInt(month, 10);
  if (m === 2) {
    return year && isLeapYear(parseInt(year, 10)) ? 29 : 28;
  }
  return MONTHS_WITH_30_DAYS.includes(m) ? 30 : 31;
}

function isValidDate(month, day, year) {
  const m = parseInt(month, 10);
  const d = parseInt(day, 10);
  const y = parseInt(year, 10);

  if (!m || !d || !y) return false;
  if (m < 1 || m > 12) return false;
  if (y < 1900 || y > 2100) return false;

  const maxDays = getDaysInMonth(m, y);
  if (d < 1 || d > maxDays) return false;

  return true;
}

function toISOString(month, day, year) {
  const m = String(month).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
}

function parseISOString(isoString) {
  if (!isoString) return { month: '', day: '', year: '' };
  const [year, month, day] = isoString.split('-');
  return {
    month: month ? String(parseInt(month, 10)) : '',
    day: day ? String(parseInt(day, 10)) : '',
    year: year || '',
  };
}

export default function DatePicker({
  value,
  onChange,
  disabled = false,
  error = false,
  placeholder = { month: 'MM', day: 'DD', year: 'YYYY' },
  className = '',
  id,
}) {
  const [dateValue, setDateValue] = useState(() => parseISOString(value));

  // Sync with external value
  useEffect(() => {
    setDateValue(parseISOString(value));
  }, [value]);

  const handleFieldChange = (field, inputValue) => {
    // Only allow digits
    const cleaned = inputValue.replace(/\D/g, '');

    // Limit length
    const maxLength = field === 'year' ? 4 : 2;
    const newValue = cleaned.slice(0, maxLength);

    const updated = { ...dateValue, [field]: newValue };
    setDateValue(updated);

    // Validate and propagate if complete
    if (isValidDate(updated.month, updated.day, updated.year)) {
      onChange?.(toISOString(updated.month, updated.day, updated.year));
    } else if (!updated.month && !updated.day && !updated.year) {
      // Clear the value if all fields are empty
      onChange?.('');
    }
  };

  const handleBlur = () => {
    // On blur, validate and propagate or clear invalid
    if (isValidDate(dateValue.month, dateValue.day, dateValue.year)) {
      onChange?.(toISOString(dateValue.month, dateValue.day, dateValue.year));
    } else if (dateValue.month || dateValue.day || dateValue.year) {
      // Partial input - don't propagate invalid dates
      // Could show validation error here
    }
  };

  const baseId = id || `datepicker-${Math.random().toString(36).slice(2, 9)}`;

  return (
    <div className={`date-picker ${error ? 'date-picker-error' : ''} ${className}`}>
      <div className="date-picker-field">
        <label htmlFor={`${baseId}-month`} className="date-picker-label">
          Month
        </label>
        <input
          id={`${baseId}-month`}
          type="text"
          inputMode="numeric"
          value={dateValue.month}
          onChange={(e) => handleFieldChange('month', e.target.value)}
          onBlur={handleBlur}
          placeholder={placeholder.month}
          disabled={disabled}
          maxLength={2}
          className="date-picker-input"
          aria-invalid={error}
        />
      </div>

      <span className="date-picker-separator" aria-hidden="true">/</span>

      <div className="date-picker-field">
        <label htmlFor={`${baseId}-day`} className="date-picker-label">
          Day
        </label>
        <input
          id={`${baseId}-day`}
          type="text"
          inputMode="numeric"
          value={dateValue.day}
          onChange={(e) => handleFieldChange('day', e.target.value)}
          onBlur={handleBlur}
          placeholder={placeholder.day}
          disabled={disabled}
          maxLength={2}
          className="date-picker-input"
          aria-invalid={error}
        />
      </div>

      <span className="date-picker-separator" aria-hidden="true">/</span>

      <div className="date-picker-field date-picker-field-year">
        <label htmlFor={`${baseId}-year`} className="date-picker-label">
          Year
        </label>
        <input
          id={`${baseId}-year`}
          type="text"
          inputMode="numeric"
          value={dateValue.year}
          onChange={(e) => handleFieldChange('year', e.target.value)}
          onBlur={handleBlur}
          placeholder={placeholder.year}
          disabled={disabled}
          maxLength={4}
          className="date-picker-input date-picker-input-year"
          aria-invalid={error}
        />
      </div>
    </div>
  );
}
