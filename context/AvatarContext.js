'use client';

import React, { createContext, useContext } from 'react';
import { generateAvatarSVG, getAvatarUrl } from '@/lib/generateAvatarSVG';
import { enrichData } from '@/lib/enrichAvatars';

/**
 * Contexte global pour gérer les avatars dans l'application
 */
const AvatarContext = createContext({});

export const AvatarProvider = ({ children }) => {
  const value = {
    generateAvatarSVG,
    getAvatarUrl,
    enrichData,
  };

  return (
    <AvatarContext.Provider value={value}>
      {children}
    </AvatarContext.Provider>
  );
};

/**
 * Hook pour utiliser le contexte Avatar
 */
export const useAvatarContext = () => {
  const context = useContext(AvatarContext);
  if (!context) {
    console.warn('useAvatarContext doit être utilisé dans un AvatarProvider');
    return {
      generateAvatarSVG,
      getAvatarUrl,
      enrichData,
    };
  }
  return context;
};

export default AvatarContext;
