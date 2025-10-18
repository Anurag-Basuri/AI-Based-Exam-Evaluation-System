import React from 'react';

const LoadingOverlay = ({ show, label = 'Loading…' }) => {
  if (!show) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'absolute',
        inset: 0,
        background: 'color-mix(in srgb, var(--bg) 55%, transparent)',
        display: 'grid',
        placeItems: 'center',
        backdropFilter: 'blur(2px)',
        borderRadius: 12,
        zIndex: 5,
      }}
    >
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          padding: '10px 14px',
          fontWeight: 800,
          color: 'var(--text)',
          boxShadow: 'var(--shadow-md)',
        }}
      >
        ⏳ {label}
      </div>
    </div>
  );
};

export default LoadingOverlay;