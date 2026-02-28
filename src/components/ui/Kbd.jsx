/**
 * Kbd Component
 * Renders keyboard keys styled like physical keys.
 * For keyboard shortcuts, help modals, documentation.
 */

import './Kbd.css';

// Common key symbols
const KEY_SYMBOLS = {
  cmd: '⌘',
  command: '⌘',
  meta: '⌘',
  ctrl: '⌃',
  control: '⌃',
  alt: '⌥',
  option: '⌥',
  shift: '⇧',
  enter: '↵',
  return: '↵',
  backspace: '⌫',
  delete: '⌦',
  tab: '⇥',
  esc: 'Esc',
  escape: 'Esc',
  space: '␣',
  up: '↑',
  down: '↓',
  left: '←',
  right: '→',
  arrowup: '↑',
  arrowdown: '↓',
  arrowleft: '←',
  arrowright: '→',
};

/**
 * Format a key for display
 */
function formatKey(key) {
  const lower = key.toLowerCase();
  return KEY_SYMBOLS[lower] || key.toUpperCase();
}

export default function Kbd({
  children,
  keys,
  separator = '',
  size = 'md',
  className = '',
}) {
  // If keys array provided, render multiple keys
  if (keys) {
    return (
      <span className={`kbd-group ${className}`}>
        {keys.map((key, i) => (
          <span key={i}>
            <kbd className={`kbd kbd-${size}`}>{formatKey(key)}</kbd>
            {i < keys.length - 1 && separator && (
              <span className="kbd-separator">{separator}</span>
            )}
          </span>
        ))}
      </span>
    );
  }

  // Single key from children
  return (
    <kbd className={`kbd kbd-${size} ${className}`}>
      {typeof children === 'string' ? formatKey(children) : children}
    </kbd>
  );
}
