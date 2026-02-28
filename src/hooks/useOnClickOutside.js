import { useEffect } from 'react';

/**
 * useOnClickOutside
 * Fires a callback when user clicks outside a referenced element.
 * Powers modal dismissal, dropdown closing, "click away to close" patterns.
 *
 * @param {React.RefObject} ref - Ref to the element to detect outside clicks for
 * @param {Function} handler - Callback fired on outside click
 * @param {boolean} enabled - Whether the listener is active (default: true)
 *
 * @example
 * const dropdownRef = useRef(null);
 * const [isOpen, setIsOpen] = useState(false);
 *
 * useOnClickOutside(dropdownRef, () => setIsOpen(false), isOpen);
 *
 * return (
 *   <div ref={dropdownRef}>
 *     {isOpen && <DropdownMenu />}
 *   </div>
 * );
 */
export default function useOnClickOutside(ref, handler, enabled = true) {
  useEffect(() => {
    if (!enabled) return;

    const listener = (event) => {
      // Do nothing if clicking ref's element or its descendants
      if (!ref.current || ref.current.contains(event.target)) {
        return;
      }
      handler(event);
    };

    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);

    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler, enabled]);
}
