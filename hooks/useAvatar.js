/**
 * Hook React pour gérer les avatars avec fallback SVG
 */
import { useState, useMemo } from 'react';
import { generateAvatarSVG } from './generateAvatarSVG';

export const useAvatar = (avatarUrl, name = 'User', size = 48) => {
  const [imageError, setImageError] = useState(false);

  const finalAvatarUrl = useMemo(() => {
    if (imageError || !avatarUrl) {
      return generateAvatarSVG(name, size);
    }
    return avatarUrl;
  }, [avatarUrl, name, size, imageError]);

  const handleImageError = () => {
    setImageError(true);
  };

  const resetError = () => {
    setImageError(false);
  };

  return {
    avatarUrl: finalAvatarUrl,
    handleImageError,
    resetError,
    hasError: imageError,
  };
};

export default useAvatar;
