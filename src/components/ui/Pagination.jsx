/**
 * Pagination Component
 * Previous/next navigation with page display.
 * Consumes meta.page and meta.total from standardized API response.
 */

import { useState } from 'react';
import Button from './Button';
import './Pagination.css';

export default function Pagination({
  page = 1,
  totalPages = 1,
  onPageChange,
  showJumpTo = false,
  disabled = false,
  size = 'md',
  className = '',
}) {
  const [jumpValue, setJumpValue] = useState('');

  const canGoPrev = page > 1;
  const canGoNext = page < totalPages;

  const handlePrev = () => {
    if (canGoPrev) {
      onPageChange?.(page - 1);
    }
  };

  const handleNext = () => {
    if (canGoNext) {
      onPageChange?.(page + 1);
    }
  };

  const handleJump = (e) => {
    e.preventDefault();
    const targetPage = parseInt(jumpValue, 10);
    if (!isNaN(targetPage) && targetPage >= 1 && targetPage <= totalPages) {
      onPageChange?.(targetPage);
      setJumpValue('');
    }
  };

  // Don't render if only one page
  if (totalPages <= 1) {
    return null;
  }

  return (
    <nav
      className={`pagination pagination-${size} ${className}`}
      aria-label="Pagination"
    >
      <Button
        variant="secondary"
        size={size}
        onClick={handlePrev}
        disabled={disabled || !canGoPrev}
        aria-label="Previous page"
      >
        ← Prev
      </Button>

      <span className="pagination-info">
        Page <strong>{page}</strong> of <strong>{totalPages}</strong>
      </span>

      <Button
        variant="secondary"
        size={size}
        onClick={handleNext}
        disabled={disabled || !canGoNext}
        aria-label="Next page"
      >
        Next →
      </Button>

      {showJumpTo && (
        <form className="pagination-jump" onSubmit={handleJump}>
          <input
            type="number"
            min={1}
            max={totalPages}
            value={jumpValue}
            onChange={(e) => setJumpValue(e.target.value)}
            placeholder="#"
            disabled={disabled}
            className="pagination-jump-input"
            aria-label="Jump to page"
          />
          <Button
            type="submit"
            variant="ghost"
            size="sm"
            disabled={disabled || !jumpValue}
          >
            Go
          </Button>
        </form>
      )}
    </nav>
  );
}
