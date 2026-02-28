import { useState, useCallback, useRef } from 'react';

/**
 * useCopyToClipboard
 * Returns a function to copy any string to clipboard.
 * Tracks copied state that auto-resets after a delay.
 *
 * @param {Object} options
 * @param {number} options.resetDelay - Ms before copied resets to false (default: 2000)
 *
 * @returns {{ copy: (text: string) => Promise<boolean>, copied: boolean, error: Error | null }}
 *
 * @example
 * const { copy, copied } = useCopyToClipboard();
 *
 * <button onClick={() => copy(apiKey)}>
 *   {copied ? '✓ Copied!' : 'Copy API Key'}
 * </button>
 *
 * @example
 * // With error handling
 * const { copy, copied, error } = useCopyToClipboard();
 *
 * const handleCopy = async () => {
 *   const success = await copy(text);
 *   if (!success) console.error('Copy failed:', error);
 * };
 */
export default function useCopyToClipboard(options = {}) {
  const { resetDelay = 2000 } = options;

  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(null);
  const timeoutRef = useRef(null);

  const copy = useCallback(
    async (text) => {
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Reset state
      setCopied(false);
      setError(null);

      if (!navigator?.clipboard) {
        const err = new Error('Clipboard API not available');
        setError(err);
        return false;
      }

      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);

        // Auto-reset after delay
        timeoutRef.current = setTimeout(() => {
          setCopied(false);
        }, resetDelay);

        return true;
      } catch (err) {
        setError(err);
        return false;
      }
    },
    [resetDelay]
  );

  return { copy, copied, error };
}
