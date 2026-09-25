import React from 'react';

const EmptyState = ({
  icon: Icon,
  emoji,
  title,
  message,
  actionText,
  onAction,
}) => {
  return (
    <div
      style={{
        padding: '3rem 1.5rem',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--color-bg-card)',
        borderRadius: '16px',
        border: '1px dashed var(--color-ash-300)',
      }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          backgroundColor: 'var(--color-primary-50)',
          color: 'var(--color-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1rem',
          fontSize: emoji ? '2rem' : '1.5rem',
        }}
      >
        {emoji ? emoji : Icon ? <Icon size={28} /> : '📦'}
      </div>
      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 0.5rem', color: 'var(--color-text)' }}>
        {title}
      </h3>
      <p style={{ margin: '0 0 1.25rem', fontSize: '0.875rem', color: 'var(--color-ash-600)', maxWidth: 400 }}>
        {message}
      </p>
      {actionText && onAction && (
        <button className="btn btn-primary" onClick={onAction}>
          {actionText}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
