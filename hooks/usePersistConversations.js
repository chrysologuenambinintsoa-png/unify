/**
 * Hook personnalisé pour gérer la persistance des conversations
 */

import { useState, useEffect, useCallback } from 'react';

/**
 * Hook pour sauvegarder et charger les conversations de manière persistente
 * @param {array} initialConversations - Conversations initiales du serveur
 * @returns {object} { conversations, addConversation, updateConversation, isLoading }
 */
export const usePersistConversations = (initialConversations = []) => {
  const [conversations, setConversations] = useState(initialConversations);
  const [isLoading, setIsLoading] = useState(false);

  const storageKey = 'conversations_cache';

  // Charger les conversations au montage
  useEffect(() => {
    loadConversations();
  }, []);

  /**
   * Charger les conversations depuis localStorage OU serveur
   */
  const loadConversations = useCallback(async () => {
    setIsLoading(true);

    try {
      // D'abord, vérifier localStorage
      const cached = localStorage.getItem(storageKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        setConversations(parsed);
      } else if (initialConversations.length > 0) {
        setConversations(initialConversations);
      }

      // Ensuite, essayer de charger du serveur pour la dernière version
      const response = await fetch('/api/conversations', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        const serverConversations = await response.json();
        setConversations(serverConversations);
        // Mettre à jour le cache
        localStorage.setItem(storageKey, JSON.stringify(serverConversations));
      }
    } catch (error) {
      console.warn('Erreur lors du chargement des conversations:', error);
      // Fallback sur le cache
      const cached = localStorage.getItem(storageKey);
      if (cached) {
        setConversations(JSON.parse(cached));
      }
    } finally {
      setIsLoading(false);
    }
  }, [initialConversations]);

  /**
   * Ajouter une conversation
   */
  const addConversation = useCallback((conversation) => {
    const newConversation = {
      ...conversation,
      id: conversation.id || `temp_${Date.now()}`,
      createdAt: conversation.createdAt || new Date().toISOString(),
    };

    setConversations(prev => {
      const updated = [newConversation, ...prev];
      localStorage.setItem(storageKey, JSON.stringify(updated));
      return updated;
    });

    return newConversation;
  }, [storageKey]);

  /**
   * Mettre à jour une conversation
   */
  const updateConversation = useCallback((conversationId, updates) => {
    setConversations(prev => {
      const updated = prev.map(conv =>
        conv.id === conversationId ? { ...conv, ...updates } : conv
      );
      localStorage.setItem(storageKey, JSON.stringify(updated));
      return updated;
    });
  }, [storageKey]);

  /**
   * Rafraîchir les conversations depuis le serveur
   */
  const refreshConversations = useCallback(() => {
    return loadConversations();
  }, [loadConversations]);

  return {
    conversations,
    setConversations,
    addConversation,
    updateConversation,
    refreshConversations,
    isLoading,
  };
};

export default usePersistConversations;
