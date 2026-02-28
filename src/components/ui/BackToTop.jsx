/**
 * BackToTop Component
 * Floating button that appears after scrolling, smooth scrolls to top.
 * Powered by useScrollPosition hook.
 */

import { useScrollPosition, scrollToTop } from '../../hooks';
import './BackToTop.css';

export default function BackToTop({
  threshold = 300,
  className = '',
}) {
  const { scrollY } = useScrollPosition();
  const visible = scrollY > threshold;

  if (!visible) return null;

  return (
    <button
      type="button"
      className={`back-to-top ${className}`}
      onClick={scrollToTop}
      aria-label="Back to top"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M18 15l-6-6-6 6" />
      </svg>
    </button>
  );
}
