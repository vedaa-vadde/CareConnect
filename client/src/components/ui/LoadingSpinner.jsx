import React from 'react';

const LoadingSpinner = ({ fullPage = false, size = 'md', text = '' }) => {
  const sizeClass = size === 'sm' ? 'spinner-sm' : size === 'lg' ? 'spinner-lg' : '';

  if (fullPage) {
    return (
      <div className="page-loading">
        <div className="intro-icon-ring" style={{ width: 64, height: 64, fontSize: '1.5rem', background: 'linear-gradient(135deg, #4a7c59, #6aaa7e)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          🏠
        </div>
        <div className={`spinner ${sizeClass}`} />
        {text && <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>{text}</p>}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <div className={`spinner ${sizeClass}`} />
      {text && <span style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>{text}</span>}
    </div>
  );
};

export default LoadingSpinner;
