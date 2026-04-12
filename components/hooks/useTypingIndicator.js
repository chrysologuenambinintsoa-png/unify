import { useState, useCallback, useRef } from 'react';

/**
 * Hook personnalisé pour gérer les indicateurs de frappe
 * @returns {Object} Fonctions pour gérer la frappe
 */
const useTypingIndicator = () => {
  const [typingStates, setTypingStates] = useState({});
  const timeoutRefs = useRef({});

  // Gérer la frappe locale
  const handleTyping = useCallback((conversationId, isTyping) => {
    // Pour la démo, on peut simuler ou ignorer
    // En production, cela enverrait un événement au serveur
  }, []);

  // Obtenir le texte de frappe pour une conversation
  const getTypingText = useCallback((conversationId) => {
    const typing = typingStates[conversationId];
    if (!typing || !typing.users.length) return null;

    if (typing.users.length === 1) {
      return `${typing.users[0].name} est en train d'écrire...`;
    } else if (typing.users.length === 2) {
      return `${typing.users[0].name} et ${typing.users[1].name} sont en train d'écrire...`;
    } else {
      return `${typing.users[0].name} et ${typing.users.length - 1} autres sont en train d'écrire...`;
    }
  }, [typingStates]);

  // Définir la frappe distante (simulé)
  const setRemoteTyping = useCallback((conversationId, userId, userName) => {
    setTypingStates(prev => ({
      ...prev,
      [conversationId]: {
        users: [{ id: userId, name: userName }],
        timestamp: Date.now(),
      }
    }));

    // Effacer après 3 secondes
    if (timeoutRefs.current[conversationId]) {
      clearTimeout(timeoutRefs.current[conversationId]);
    }

    timeoutRefs.current[conversationId] = setTimeout(() => {
      setTypingStates(prev => {
        const newState = { ...prev };
        delete newState[conversationId];
        return newState;
      });
    }, 3000);
  }, []);

  // Vérifier si quelqu'un tape dans une conversation
  const isSomeoneTyping = useCallback((conversationId) => {
    return !!(typingStates[conversationId]?.users.length);
  }, [typingStates]);

  return {
    handleTyping,
    getTypingText,
    setRemoteTyping,
    isSomeoneTyping,
  };
};

export default useTypingIndicator;