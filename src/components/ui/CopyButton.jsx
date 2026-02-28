/**
 * CopyButton Component
 * Small button to copy text, shows checkmark briefly after copying.
 * Powered by useCopyToClipboard hook.
 */

import { useCopyToClipboard } from '../../hooks';
import './CopyButton.css';

export default function CopyButton({
  text,
  size = 'md',
  label = 'Copy',
  copiedLabel = 'Copied!',
  showLabel = false,
  className = '',
}) {
  const { copy, copied } = useCopyToClipboard();

  return (
    <button
      type="button"
      className={`copy-button copy-button-${size} ${copied ? 'copy-button-copied' : ''} ${className}`}
      onClick={() => copy(text)}
      aria-label={copied ? copiedLabel : label}
    >
      {copied ? (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="copy-button-icon">
          <path d="M20 6L9 17l-5-5" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="copy-button-icon">
          <rect x="9" y="9" width="13" height="13" rx="2" />
          <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
        </svg>
      )}
      {showLabel && (
        <span className="copy-button-label">
          {copied ? copiedLabel : label}
        </span>
      )}
    </button>
  );
}
