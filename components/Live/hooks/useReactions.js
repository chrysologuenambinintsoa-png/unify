/**
 * useReactions.js - Hook pour la gestion des réactions en temps réel
 * Gère les réactions Facebook-style (like, love, haha, wow, sad, angry)
 */

import { useState, useCallback, useEffect } from 'react';
import { useLive } from '../context/LiveContext';

// Types de réactions disponibles
export const REACTION_TYPES = {
  LIKE: 'like',
  LOVE: 'love',
  HAHA: 'haha',
  WOW: 'wow',
  SAD: 'sad',
  ANGRY: 'angry',
};

// Configuration des réactions
export const REACTIONS_CONFIG = {
  [REACTION_TYPES.LIKE]: {
    emoji: '👍',
    label: 'J\'aime',
    color: '#ffffff',
  },
  [REACTION_TYPES.LOVE]: {
    emoji: '❤️',
    label: 'J\'adore',
    color: '#ffffff',
  },
  [REACTION_TYPES.HAHA]: {
    emoji: '😂',
    label: 'Haha',
    color: '#f7b928',
  },
  [REACTION_TYPES.WOW]: {
    emoji: '😮',
    label: 'Wouah',
    color: '#f7b928',
  },
  [REACTION_TYPES.SAD]: {
    emoji: '😢',
    label: 'Triste',
    color: '#f7b928',
  },
  [REACTION_TYPES.ANGRY]: {
    emoji: '😡',
    label: 'Grrr',
    color: '#e9710f',
  },
};

export const useReactions = () => {
  const { socket, isConnected } = useLive();
  const [reactions, setReactions] = useState([]);
  const [totalReactions, setTotalReactions] = useState(0);
  const [reactionCounts, setReactionCounts] = useState({});

  // Écouter les nouvelles réactions
  useEffect(() => {
    if (!socket) return;

    const handleNewReaction = (reaction) => {
      setReactions(prev => [...prev, reaction]);
      setTotalReactions(prev => prev + 1);
      setReactionCounts(prev => ({
        ...prev,
        [reaction.type]: (prev[reaction.type] || 0) + 1,
      }));

      // Supprimer la réaction après 3 secondes
      setTimeout(() => {
        setReactions(prev => prev.filter(r => r.id !== reaction.id));
      }, 3000);
    };

    socket.on('new_reaction', handleNewReaction);

    return () => {
      socket.off('new_reaction', handleNewReaction);
    };
  }, [socket]);

  // Envoyer une réaction
  const sendReaction = useCallback((type, position = null) => {
    if (!socket || !isConnected) {
      console.warn('[useReactions] Socket non connecté');
      return;
    }

    const reaction = {
      id: Date.now() + Math.random(),
      type,
      position,
      timestamp: new Date().toISOString(),
    };

    // Ajouter localement
    setReactions(prev => [...prev, reaction]);
    setTotalReactions(prev => prev + 1);
    setReactionCounts(prev => ({
      ...prev,
      [type]: (prev[type] || 0) + 1,
    }));

    // Envoyer au serveur
    socket.emit('send_reaction', reaction);

    // Supprimer après 3 secondes
    setTimeout(() => {
      setReactions(prev => prev.filter(r => r.id !== reaction.id));
    }, 3000);

    return reaction;
  }, [socket, isConnected]);

  // Réinitialiser les réactions
  const resetReactions = useCallback(() => {
    setReactions([]);
    setTotalReactions(0);
    setReactionCounts({});
  }, []);

  // Obtenir le nombre de réactions par type
  const getReactionCount = useCallback((type) => {
    return reactionCounts[type] || 0;
  }, [reactionCounts]);

  // Obtenir la réaction la plus populaire
  const getMostPopularReaction = useCallback(() => {
    let maxCount = 0;
    let mostPopular = null;

    Object.entries(reactionCounts).forEach(([type, count]) => {
      if (count > maxCount) {
        maxCount = count;
        mostPopular = type;
      }
    });

    return mostPopular ? REACTIONS_CONFIG[mostPopular] : null;
  }, [reactionCounts]);

  return {
    reactions,
    totalReactions,
    reactionCounts,
    sendReaction,
    resetReactions,
    getReactionCount,
    getMostPopularReaction,
    REACTION_TYPES,
    REACTIONS_CONFIG,
  };
};

export default useReactions;
