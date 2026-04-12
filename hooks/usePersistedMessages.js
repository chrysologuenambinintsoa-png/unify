/**
 * VERSION CORRIGÉE de ChatWindow avec Persistance
 * 
 * Changements:
 * 1. ✅ Sync localMessages avec props.messages au montage
 * 2. ✅ Sauvegarder les messages en localStorage
 * 3. ✅ Charger les messages du localStorage à l'ouverture
 * 4. ✅ Envoyer au serveur quand on ajoute un message
 * 5. ✅ Rafraîchir depuis le serveur quand la conversation change
 */

'use client';

import React, { useState, useRef, useEffect, useMemo, forwardRef, useImperativeHandle, useCallback } from 'react';

// À intégrer dans le ChatWindow.js existant
// Ces imports et hooks sont les SEULS changements nécessaires

/**
 * Hook personnalisé pour gérer les messages persistants
 */
const usePersistedMessages = (conversationId, initialMessages = []) => {
  const [messages, setMessages] = useState(initialMessages);
  const storageKey = `messages_${conversationId}`;

  // Au montage ou quand la convId change: charger du cache
  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      return;
    }

    // 1. Charger du cache localStorage
    const cached = localStorage.getItem(storageKey);
    if (cached) {
      try {
        setMessages(JSON.parse(cached));
      } catch (err) {
        console.error('Erreur parsing cache:', err);
      }
    } else if (initialMessages.length > 0) {
      setMessages(initialMessages);
    }

    // 2. Essayer de charger du serveur
    loadFromServer();
  }, [conversationId]);

  // Charger du serveur
  const loadFromServer = useCallback(async () => {
    if (!conversationId) return;

    try {
      const response = await fetch(`/api/messages?conversationId=${conversationId}`);
      if (response.ok) {
        const serverMessages = await response.json();
        setMessages(serverMessages);
        // Mettre à jour le cache
        localStorage.setItem(storageKey, JSON.stringify(serverMessages));
      }
    } catch (error) {
      console.warn('Erreur chargement serveur:', error);
      // Fallback sur le cache
    }
  }, [conversationId, storageKey]);

  // Ajouter et persister un message
  const addMessage = useCallback((message) => {
    const newMessage = {
      ...message,
      id: message.id || `msg_${Date.now()}`,
    };

    setMessages(prev => {
      const updated = [...prev, newMessage];
      // Persister le cache
      localStorage.setItem(storageKey, JSON.stringify(updated));
      return updated;
    });

    // Envoyer au serveur
    fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversationId,
        message: newMessage,
      }),
    }).catch(err => console.warn('Erreur save serveur:', err));

    return newMessage;
  }, [conversationId, storageKey]);

  return { messages, setMessages, addMessage, loadFromServer };
};

/**
 * MODIFICATION à apporter dans ChatWindow:
 * 
 * AVANT:
 * const [localMessages, setLocalMessages] = useState([]);
 * 
 * APRÈS:
 * const { messages: localMessages, addMessage } = usePersistedMessages(
 *   conversation?.id,
 *   messages
 * );
 * 
 * ET dans handleSendMessage:
 * 
 * AVANT:
 * setLocalMessages((prev) => [...prev, newMessage]);
 * if (onSendMessage) onSendMessage(conversation.id, newMessage);
 * 
 * APRÈS:
 * addMessage(newMessage);  // Cela fait tout: persist + serveur
 * if (onSendMessage) onSendMessage(conversation.id, newMessage);
 */

export { usePersistedMessages };
