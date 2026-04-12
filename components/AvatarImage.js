'use client';

import React, { useState, useEffect } from 'react';
import { generateAvatarSVG } from '@/lib/generateAvatarSVG';

/**
 * Composant wrapper pour remplacer les <img> simples
 * Gère automatiquement les erreurs 404 avec fallback SVG
 * 
 * Usage:
 * <AvatarImage src={avatar} alt={name} name={name} />
 */
const AvatarImage = React.forwardRef(({
  src,
  alt = '',
  name = '',
  size = 48,
  className = '',
  style = {},
  onError,
  isAvatar = true, // Si false, ne pas générer SVG fallback
  fallbackColor = null,
  ...props
}, ref) => {
  const [imgSrc, setImgSrc] = useState(src);
  const [hasError, setHasError] = useState(false);

  // Mettre à jour l'image si src change
  useEffect(() => {
    setImgSrc(src);
    setHasError(false);
  }, [src]);

  const handleError = (e) => {
    if (!hasError && isAvatar && name) {
      // Générer un SVG fallback
      const svgUrl = generateAvatarSVG(name, typeof size === 'string' ? 48 : size);
      setImgSrc(svgUrl);
      setHasError(true);
    }

    // Appeler le onError callback si fourni
    if (onError) {
      onError(e);
    }
  };

  return (
    <img
      ref={ref}
      src={imgSrc || (isAvatar && name ? generateAvatarSVG(name, typeof size === 'string' ? 48 : size) : '')}
      alt={alt || name}
      className={className}
      style={{
        width: typeof size === 'number' ? `${size}px` : size,
        height: typeof size === 'number' ? `${size}px` : size,
        borderRadius: isAvatar ? '50%' : '0',
        objectFit: 'cover',
        ...style,
      }}
      onError={handleError}
      {...props}
    />
  );
});

AvatarImage.displayName = 'AvatarImage';

export default AvatarImage;
