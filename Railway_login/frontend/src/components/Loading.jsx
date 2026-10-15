import React from 'react';

export default function Loading({ message = 'Loading data, please wait...' }) {
  return (
    <div className="loading-container">
      <div className="loading-spinner" aria-label="Loading spinner"></div>
      <p className="loading-text">{message}</p>
    </div>
  );
}
