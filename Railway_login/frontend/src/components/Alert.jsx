import React from 'react';

export default function Alert({ type = 'error', message, onDismiss }) {
  if (!message) return null;

  return (
    <div className={`alert-box alert-${type}`} role="alert">
      <div className="alert-content">
        <span className="alert-icon">
          {type === 'error' && '✕'}
          {type === 'success' && '✓'}
          {type === 'warning' && '⚠'}
          {type === 'info' && 'ℹ'}
        </span>
        <span className="alert-message">{message}</span>
      </div>
      {onDismiss && (
        <button type="button" className="alert-dismiss" onClick={onDismiss} aria-label="Dismiss alert">
          ×
        </button>
      )}
    </div>
  );
}
