/**
 * Tabs Component
 * Horizontal tabs that swap content panels.
 * Controlled, keyboard navigable, accessible.
 */

import { useState, useRef, useEffect } from 'react';
import './Tabs.css';

export function Tabs({
  children,
  defaultValue,
  value,
  onChange,
  className = '',
}) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const activeValue = value !== undefined ? value : internalValue;

  const handleChange = (newValue) => {
    if (value === undefined) {
      setInternalValue(newValue);
    }
    onChange?.(newValue);
  };

  // Extract tabs and panels from children
  const tabs = [];
  const panels = [];

  // Process children to find TabList and TabPanels
  const processChildren = (children) => {
    return children;
  };

  return (
    <TabsContext.Provider value={{ activeValue, onChange: handleChange }}>
      <div className={`tabs ${className}`}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

import { createContext, useContext } from 'react';

const TabsContext = createContext(null);

export function TabList({ children, className = '' }) {
  const tabsRef = useRef(null);

  // Keyboard navigation
  const handleKeyDown = (e) => {
    const tabs = tabsRef.current?.querySelectorAll('[role="tab"]');
    if (!tabs) return;

    const currentIndex = Array.from(tabs).findIndex(
      (tab) => tab === document.activeElement
    );

    let nextIndex = currentIndex;

    if (e.key === 'ArrowRight') {
      nextIndex = (currentIndex + 1) % tabs.length;
    } else if (e.key === 'ArrowLeft') {
      nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    } else if (e.key === 'Home') {
      nextIndex = 0;
    } else if (e.key === 'End') {
      nextIndex = tabs.length - 1;
    } else {
      return;
    }

    e.preventDefault();
    tabs[nextIndex].focus();
    tabs[nextIndex].click();
  };

  return (
    <div
      ref={tabsRef}
      role="tablist"
      className={`tabs-list ${className}`}
      onKeyDown={handleKeyDown}
    >
      {children}
    </div>
  );
}

export function Tab({ value, children, disabled = false, className = '' }) {
  const context = useContext(TabsContext);
  if (!context) throw new Error('Tab must be used within Tabs');

  const { activeValue, onChange } = context;
  const isActive = activeValue === value;

  return (
    <button
      role="tab"
      type="button"
      aria-selected={isActive}
      tabIndex={isActive ? 0 : -1}
      disabled={disabled}
      className={`tabs-tab ${isActive ? 'tabs-tab-active' : ''} ${className}`}
      onClick={() => !disabled && onChange(value)}
    >
      {children}
    </button>
  );
}

export function TabPanel({ value, children, className = '' }) {
  const context = useContext(TabsContext);
  if (!context) throw new Error('TabPanel must be used within Tabs');

  const { activeValue } = context;
  const isActive = activeValue === value;

  if (!isActive) return null;

  return (
    <div
      role="tabpanel"
      tabIndex={0}
      className={`tabs-panel ${className}`}
    >
      {children}
    </div>
  );
}

export default Tabs;
