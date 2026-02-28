import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * useFormPersist
 * Saves form state to sessionStorage as user types.
 * Restores on page refresh. Generic - works with any form.
 *
 * @param {string} formId - Unique identifier for this form
 * @param {Object} options
 * @param {Object} options.initialValues - Default form values
 * @param {number} options.debounceMs - Debounce save delay (default: 500)
 * @param {boolean} options.clearOnSubmit - Clear storage on submit (default: true)
 *
 * @returns {{ values: Object, setValues: Function, setValue: Function, clear: Function, isDirty: boolean }}
 *
 * @example
 * // Basic usage
 * const { values, setValue, clear } = useFormPersist('contact-form', {
 *   initialValues: { name: '', email: '', message: '' }
 * });
 *
 * <input
 *   value={values.name}
 *   onChange={(e) => setValue('name', e.target.value)}
 * />
 *
 * const handleSubmit = () => {
 *   submitForm(values);
 *   clear(); // Clear persisted data
 * };
 *
 * @example
 * // With React Hook Form - use watch() to feed values
 * const { watch, reset } = useForm();
 * const { clear } = useFormPersist('my-form', {
 *   initialValues: watch()
 * });
 */
export default function useFormPersist(formId, options = {}) {
  const { initialValues = {}, debounceMs = 500, clearOnSubmit = true } = options;

  const storageKey = `form-persist:${formId}`;

  // Initialize from sessionStorage or initial values
  const [values, setValuesState] = useState(() => {
    try {
      const stored = sessionStorage.getItem(storageKey);
      if (stored) {
        return { ...initialValues, ...JSON.parse(stored) };
      }
    } catch {
      // sessionStorage might be unavailable
    }
    return initialValues;
  });

  const [isDirty, setIsDirty] = useState(false);
  const debounceTimer = useRef(null);
  const initialRef = useRef(initialValues);

  // Save to sessionStorage (debounced)
  useEffect(() => {
    if (!isDirty) return;

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      try {
        sessionStorage.setItem(storageKey, JSON.stringify(values));
      } catch {
        // sessionStorage might be full or unavailable
      }
    }, debounceMs);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [values, isDirty, storageKey, debounceMs]);

  // Set all values
  const setValues = useCallback((newValues) => {
    setValuesState(newValues);
    setIsDirty(true);
  }, []);

  // Set single value
  const setValue = useCallback((key, value) => {
    setValuesState((prev) => ({ ...prev, [key]: value }));
    setIsDirty(true);
  }, []);

  // Clear persisted data
  const clear = useCallback(() => {
    try {
      sessionStorage.removeItem(storageKey);
    } catch {
      // Ignore
    }
    setValuesState(initialRef.current);
    setIsDirty(false);
  }, [storageKey]);

  return { values, setValues, setValue, clear, isDirty };
}
