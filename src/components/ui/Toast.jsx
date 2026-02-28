/**
 * Toast Component & Context
 * Notification system with stacking and auto-dismiss
 */

import { createContext, useContext, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import './Toast.css';

const ToastContext = createContext(null);

const TOAST_DURATION = 5000;

const icons = {
  success: '✓',
  error: '✕',
  warning: '⚠',
  info: 'ℹ',
};

function ToastItem({ toast, onDismiss }) {
  return (
    <div className={`toast toast-${toast.type}`} role="alert">
      <span className="toast-icon">{icons[toast.type]}</span>
      <div className="toast-content">
        {toast.title && <p className="toast-title">{toast.title}</p>}
        <p className="toast-message">{toast.message}</p>
      </div>
      <button
        className="toast-dismiss"
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss"
      >
        ✕
      </button>
    </div>
  );
}

function ToastContainer({ toasts, onDismiss }) {
  if (toasts.length === 0) return null;

  return createPortal(
    <div className="toast-container" aria-live="polite">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>,
    document.body
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(({ type = 'info', title, message, duration = TOAST_DURATION }) => {
    const id = Date.now() + Math.random();
    
    setToasts((prev) => [...prev, { id, type, title, message }]);

    if (duration > 0) {
      setTimeout(() => dismiss(id), duration);
    }

    return id;
  }, [dismiss]);

  const success = useCallback((message, title) => 
    toast({ type: 'success', message, title }), [toast]);
  
  const error = useCallback((message, title) => 
    toast({ type: 'error', message, title }), [toast]);
  
  const warning = useCallback((message, title) => 
    toast({ type: 'warning', message, title }), [toast]);
  
  const info = useCallback((message, title) => 
    toast({ type: 'info', message, title }), [toast]);

  return (
    <ToastContext.Provider value={{ toast, success, error, warning, info, dismiss }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

export default ToastProvider;
