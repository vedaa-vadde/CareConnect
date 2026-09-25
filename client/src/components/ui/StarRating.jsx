import React, { useState } from 'react';
import { Star } from 'lucide-react';

const StarRating = ({
  rating = 0,
  maxRating = 5,
  interactive = false,
  onChange,
  size = 18,
  showValue = false,
  count = null,
}) => {
  const [hoverRating, setHoverRating] = useState(0);

  const displayRating = interactive && hoverRating > 0 ? hoverRating : rating;

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
      <div style={{ display: 'inline-flex', gap: '2px' }}>
        {Array.from({ length: maxRating }).map((_, index) => {
          const starValue = index + 1;
          const isFilled = starValue <= Math.round(displayRating);

          return (
            <span
              key={index}
              style={{
                cursor: interactive ? 'pointer' : 'default',
                transition: 'transform 0.15s ease',
                display: 'inline-flex',
                alignItems: 'center',
                transform: interactive && hoverRating >= starValue ? 'scale(1.15)' : 'none',
              }}
              onMouseEnter={() => interactive && setHoverRating(starValue)}
              onMouseLeave={() => interactive && setHoverRating(0)}
              onClick={() => interactive && onChange && onChange(starValue)}
            >
              <Star
                size={size}
                fill={isFilled ? '#f59e0b' : 'none'}
                color={isFilled ? '#f59e0b' : '#cbd5e1'}
                strokeWidth={1.5}
              />
            </span>
          );
        })}
      </div>

      {showValue && (
        <span style={{ fontWeight: 600, fontSize: `${size * 0.8}px`, color: 'var(--color-text)', marginLeft: '0.25rem' }}>
          {Number(rating).toFixed(1)}
        </span>
      )}

      {count !== null && (
        <span style={{ fontSize: `${size * 0.75}px`, color: 'var(--color-ash-600)', marginLeft: '0.15rem' }}>
          ({count})
        </span>
      )}
    </div>
  );
};

export default StarRating;
