import { useState, useCallback, useEffect } from 'react';

/**
 * Hook personnalisé pour gérer l'état du chat
 * @param {Array} initialConversations - Conversations initiales
 * @param {Object} initialMessages - Messages initiaux par conversation
 * @param {Object} user - Utilisateur actuel
 * @returns {Object} État et fonctions du chat
 */
const useChat = (initialConversations = [], initialMessages = {}, user = null) => {
  // Générer une clé localStorage unique par utilisateur
  const getStorageKey = useCallback((baseKey) => {
    if (user?.id) {
      return `${baseKey}_${user.id}`;
    } else if (user?.email) {
      return `${baseKey}_${user.email}`;
    }
    return baseKey;
  }, [user?.id, user?.email]);

  // État avec initialisation depuis localStorage si disponible (sans dépendre de user au init)
  // NOTE: Ne pas charger depuis localStorage ici pour éviter d'afficher les mauvaises données
  // Les conversations seront chargées correctement via l'effet useEffect qui utilise la clé utilisateur
  const [conversations, setConversations] = useState(() => {
    // Ne plus charger depuis localStorage ici - cela peut causer des bugs d'affichage de profil
    // Les données seront chargées depuis l'API via le composant parent (Navbar)
    console.log('📝 Utilisation des conversations initiales (sans localStorage pour éviter les bugs de cache)');
    return initialConversations;
  });

  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState(initialMessages);

  // Quand l'utilisateur change, charger ses conversations depuis sa clé localStorage
  // OU depuis initialConversations (données fraîches de l'API)
  useEffect(() => {
    if (!user?.email && !user?.id) {
      console.log('⚠️  User not available, not loading user-specific conversations');
      return;
    }

    const storageKey = getStorageKey('chat_conversations');
    console.log('🔄 User changed, loading conversations with key:', storageKey);
    
    // Prioriser initialConversations (données fraîches de l'API) plutôt que localStorage
    // Cela évite les bugs où l'ancien profil est affiché depuis le cache
    if (initialConversations && initialConversations.length > 0) {
      console.log('✅ Using fresh initialConversations from API:', initialConversations.slice(0, 1).map(c => ({ id: c.id, participantName: c.participant?.name, participantEmail: c.participant?.email })));
      setConversations(initialConversations);
    } else if (typeof window !== 'undefined') {
      // Fallback vers localStorage seulement si pas de données initiales
      const savedConversations = localStorage.getItem(storageKey);
      if (savedConversations) {
        try {
          const parsed = JSON.parse(savedConversations);
          console.log(`✅ Loaded from localStorage (${parsed.length} conversations):`, parsed.slice(0, 1).map(c => ({ id: c.id, participantName: c.participant?.name, participantEmail: c.participant?.email })));
          setConversations(parsed);
        } catch (e) {
          console.error('❌ Error loading user-specific conversations:', e);
          console.log('📝 Falling back to empty array');
          setConversations([]);
        }
      } else {
        console.log('📝 No conversations found, using empty array');
        setConversations([]);
      }
    }
  }, [user?.email, user?.id, initialConversations, getStorageKey]);

  // Sauvegarder les conversations dans localStorage quand elles changent
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const storageKey = getStorageKey('chat_conversations');
        localStorage.setItem(storageKey, JSON.stringify(conversations));
        console.log(`💾 Conversations sauvegardées dans localStorage (clé: ${storageKey})`);
      } catch (e) {
        console.error('❌ Erreur lors de la sauvegarde:', e);
      }
    }
  }, [conversations, getStorageKey]);

  // Sélectionner une conversation
  const selectConversation = useCallback((conversationId) => {
    const conversation = conversations.find(c => c.id === conversationId);
    setActiveConversation(conversation);
  }, [conversations]);

  // Envoyer un message
  const sendMessage = useCallback((conversationId, content, type = 'text', replyTo = null, senderId = 'current-user', senderName = 'Vous') => {
    const newMessage = {
      id: `msg-${Date.now()}`,
      content,
      type,
      senderId,
      senderName,
      timestamp: new Date().toISOString(),
      status: 'sent',
      reactions: [],
      replyTo,
    };

    setMessages(prev => ({
      ...prev,
      [conversationId]: [...(prev[conversationId] || []), newMessage]
    }));

    // Mettre à jour la dernière message de la conversation
    setConversations(prev => prev.map(conv =>
      conv.id === conversationId
        ? {
            ...conv,
            lastMessage: {
              content: type === 'text' ? content : `📎 ${type}`,
              timestamp: newMessage.timestamp,
              senderId: 'current-user'
            }
          }
        : conv
    ));
  }, []);

  // Supprimer une conversation
  const deleteConversation = useCallback((conversationId) => {
    setConversations(prev => prev.filter(c => c.id !== conversationId));
    setMessages(prev => {
      const newMessages = { ...prev };
      delete newMessages[conversationId];
      return newMessages;
    });
    if (activeConversation?.id === conversationId) {
      setActiveConversation(null);
    }
  }, [activeConversation]);

  // Bloquer un utilisateur
  const blockUser = useCallback((userId) => {
    setConversations(prev => prev.map(conv =>
      conv.participant?.id === userId
        ? { ...conv, isBlocked: true }
        : conv
    ));
    setActiveConversation(prev =>
      prev?.participant?.id === userId ? { ...prev, isBlocked: true } : prev
    );
  }, []);

  // Débloquer un utilisateur
  const unblockUser = useCallback((userId) => {
    setConversations(prev => prev.map(conv =>
      conv.participant?.id === userId
        ? { ...conv, isBlocked: false }
        : conv
    ));
    setActiveConversation(prev =>
      prev?.participant?.id === userId ? { ...prev, isBlocked: false } : prev
    );
  }, []);

  // Réagir à un message
  const reactToMessage = useCallback((conversationId, messageId, emoji) => {
    setMessages(prev => ({
      ...prev,
      [conversationId]: prev[conversationId]?.map(msg =>
        msg.id === messageId
          ? {
              ...msg,
              reactions: [...(msg.reactions || []), {
                emoji,
                userId: 'current-user',
                timestamp: new Date().toISOString()
              }]
            }
          : msg
      ) || []
    }));
  }, []);

  // Définir les conversations (pour chargement dynamique)
  const updateConversations = useCallback((newConversations) => {
    setConversations(newConversations);
  }, []);

  // Transférer un message
  const forwardMessage = useCallback((fromConversationId, toConversationId, messageId) => {
    const message = messages[fromConversationId]?.find(m => m.id === messageId);
    if (message && toConversationId) {
      const forwardedMessage = {
        ...message,
        id: `msg-${Date.now()}`,
        timestamp: new Date().toISOString(),
        status: 'sent',
      };
      setMessages(prev => ({
        ...prev,
        [toConversationId]: [...(prev[toConversationId] || []), forwardedMessage]
      }));
    }
  }, [messages]);

  // Épingler/Dépingler une conversation
  const pinConversation = useCallback((conversationId) => {
    setConversations(prev => prev.map(conv =>
      conv.id === conversationId
        ? { ...conv, isPinned: !conv.isPinned }
        : conv
    ));
    setActiveConversation(prev =>
      prev?.id === conversationId ? { ...prev, isPinned: !prev.isPinned } : prev
    );
  }, []);

  // Silencer/Activer une conversation
  const muteConversation = useCallback((conversationId) => {
    setConversations(prev => prev.map(conv =>
      conv.id === conversationId
        ? { ...conv, isMuted: !conv.isMuted }
        : conv
    ));
    setActiveConversation(prev =>
      prev?.id === conversationId ? { ...prev, isMuted: !prev.isMuted } : prev
    );
  }, []);

  // Marquer une conversation comme lue/non lue
  const markAsRead = useCallback((conversationId) => {
    console.log('🔔 Marking conversation as read:', conversationId);
    setConversations(prev => {
      const updated = prev.map(conv =>
        conv.id === conversationId
          ? { ...conv, unreadCount: 0 }
          : conv
      );
      // Log pour déboguer
      const updatedConv = updated.find(c => c.id === conversationId);
      console.log('🔔 After markAsRead, unreadCount:', updatedConv?.unreadCount);
      return updated;
    });
    setActiveConversation(prev =>
      prev?.id === conversationId ? { ...prev, unreadCount: 0 } : prev
    );
  }, []);

  // Callback pour notifier le parent des changements de conversations
  const handleConversationsChange = useCallback((updatedConversations) => {
    console.log('🔄 Conversations updated externally:', updatedConversations?.length);
    setConversations(updatedConversations);
  }, []);

  return {
    conversations,
    activeConversation,
    messages,
    selectConversation,
    sendMessage,
    deleteConversation,
    blockUser,
    unblockUser,
    reactToMessage,
    forwardMessage,
    updateConversations,
    pinConversation,
    muteConversation,
    markAsRead,
    onConversationsChange: handleConversationsChange,
  };
};

export default useChat;