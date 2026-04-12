'use client';

import React from 'react';
import { useAvatar } from '../hooks/useAvatar';

/**
 * Composant pour afficher un avatar avec fallback SVG automatique
 */
const Avatar = React.forwardRef(({
  src,
  name = 'User',
  size = 48,
  className = '',
  alt = '',
  style = {},
  ...props
}, ref) => {
  const { avatarUrl, handleImageError } = useAvatar(src, name, size);

  return (
    <img
      ref={ref}
      src={avatarUrl}
      alt={alt || name}
      className={className}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '50%',
        objectFit: 'cover',
        ...style,
      }}
      onError={handleImageError}
      {...props}
    />
  );
});

Avatar.displayName = 'Avatar';

export default Avatar;
