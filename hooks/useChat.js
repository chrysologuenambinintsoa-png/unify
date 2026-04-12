import { useState, useCallback, useEffect } from 'react';

/**
 * Hook personnalisé pour gérer l'état du chat avec persistance
 * @param {Array} initialConversations - Conversations initiales
 * @param {Object} initialMessages - Messages initiaux par conversation
 * @param {Object} user - Utilisateur actuel
 * @returns {Object} État et fonctions du chat
 */
const useChat = (initialConversations = [], initialMessages = {}, user = null, initialActiveConversation = null) => {
  console.log('useChat called with initialMessages:', initialMessages);
  // Charger les données depuis localStorage ou utiliser les valeurs initiales
  const loadFromStorage = (key, defaultValue) => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : defaultValue;
    } catch (error) {
      console.warn(`Erreur lors du chargement de ${key} depuis localStorage:`, error);
      return defaultValue;
    }
  };

  // Always use initialConversations when provided, don't load from localStorage initially
  // This ensures we use fresh data from the parent component
  const [conversations, setConversations] = useState(initialConversations);
  // Handle initialActiveConversation - use prop if provided, otherwise load from localStorage or use null
  // The prop takes precedence to support opening specific conversations from the parent
  const getInitialActiveConv = () => {
    if (initialActiveConversation) {
      console.log('🎯 Using initialActiveConversation prop:', initialActiveConversation.id);
      return initialActiveConversation;
    }
    return loadFromStorage('chat_activeConversation', null);
  };
  
  const [activeConversation, setActiveConversation] = useState(() => getInitialActiveConv());
  const [messages, setMessages] = useState(() => {
    const loaded = loadFromStorage('chat_messages', initialMessages);
    const hasLoadedMessages = loaded && Object.keys(loaded).length > 0;
    const initial = hasLoadedMessages ? loaded : initialMessages;
    console.log('Loaded messages from storage:', loaded, '-> using:', initial);
    return initial;
  });
  const [loading, setLoading] = useState(false);

  // Update conversations when the prop changes (for fresh data from API)
  useEffect(() => {
    if (initialConversations && initialConversations.length > 0) {
      console.log('🔄 Updating conversations from prop:', initialConversations.length);
      setConversations(initialConversations);
    }
  }, [initialConversations]);

  useEffect(() => {
    if (activeConversation?.id) {
      console.log('🔄 Fetching messages for conversation:', activeConversation.id);
      const fetchMessages = async () => {
        console.log('Starting fetch for', activeConversation.id);
        setLoading(true);
        try {
          const res = await fetch(`/api/messages/${activeConversation.id}`);
          console.log('Fetch response status:', res.status);
          if (res.ok) {
            const data = await res.json();
            console.log('✅ API messages loaded:', data.messages?.length || 0);
            // Map senderId to 'current-user' for current user
const mappedMessages = data.messages?.map(msg => ({
              ...msg,
              senderId: msg.senderEmail === user?.email ? 'current-user' : msg.senderEmail
            })) || [];
            setMessages(prev => ({ 
              ...prev, 
              [activeConversation.id]: mappedMessages 
            }));
            console.log('Messages set for', activeConversation.id);
          } else {
            console.warn(`API /messages/${activeConversation.id} failed: ${res.status}`);
            const errorText = await res.text();
            console.warn('Error response:', errorText);
            // Fallback to empty array
            setMessages(prev => ({ 
              ...prev, 
              [activeConversation.id]: [] 
            }));
          }
        } catch (error) {
          console.error('❌ Failed to fetch messages:', error);
          // Fallback to initialMessages or empty array
          setMessages(prev => ({ 
            ...prev, 
            [activeConversation.id]: initialMessages[activeConversation.id] || [] 
          }));
        } finally {
          setLoading(false);
        }
      };
      fetchMessages();
    }
  }, [activeConversation?.id]);

  // Vérifier que la conversation active existe encore après chargement
  useEffect(() => {
    if (activeConversation && !conversations.find(c => c.id === activeConversation.id)) {
      setActiveConversation(null);
    }
  }, [conversations, activeConversation]);

  // Track when initialActiveConversation prop changes from parent
  // This effect ensures the active conversation updates when parent passes a new prop
  useEffect(() => {
    if (initialActiveConversation && activeConversation?.id !== initialActiveConversation.id) {
      console.log('🎯 Updating activeConversation from prop change:', initialActiveConversation.id);
      setActiveConversation(initialActiveConversation);
    }
  }, [initialActiveConversation]);

  // Si aucune conversation active et pas de prop, sélectionner la première
  useEffect(() => {
    const hasConversations = conversations.length > 0
    const needsInitialSelection = !activeConversation && !initialActiveConversation
    
    if (needsInitialSelection && hasConversations) {
      setActiveConversation(conversations[0]);
    }
  }, [conversations, activeConversation, initialActiveConversation]);

  // Si la conversation active existe et n'a pas de messages encore,
  // utiliser initialMessages si disponible (DEMO_MESSAGES) avant fetch
  useEffect(() => {
    if (
      activeConversation?.id &&
      !(messages[activeConversation.id] && messages[activeConversation.id].length > 0) &&
      initialMessages[activeConversation.id]
    ) {
      setMessages(prev => ({
        ...prev,
        [activeConversation.id]: initialMessages[activeConversation.id],
      }));
    }
  }, [activeConversation, initialMessages, messages]);

  useEffect(() => {
    try {
      localStorage.setItem('chat_activeConversation', JSON.stringify(activeConversation));
    } catch (error) {
      console.warn('Erreur lors de la sauvegarde de la conversation active:', error);
    }
  }, [activeConversation]);

  useEffect(() => {
    try {
      localStorage.setItem('chat_messages', JSON.stringify(messages));
    } catch (error) {
      console.warn('Erreur lors de la sauvegarde des messages:', error);
    }
  }, [messages]);

  // Sélectionner une conversation
  const selectConversation = useCallback((conversationId) => {
    console.log('🎯 useChat selectConversation called with ID:', conversationId, 'type:', typeof conversationId)
    console.log('📋 Available conversations count:', conversations.length)
    
    // Debug: Log first few conversations IDs
    if (conversations.length > 0) {
      console.log('📋 Sample conv IDs:', conversations.slice(0, 3).map(c => ({ id: c.id, type: typeof c.id, strId: String(c.id) })))
    }
    
    // Try to find by both exact match and string conversion
    const conversation = conversations.find(c => 
      c.id === conversationId || 
      c.id.toString() === conversationId.toString() ||
      String(c.id) === String(conversationId)
    );
    
    if (conversation) {
      console.log('✅ Found conversation:', conversation.participant?.name)
      setActiveConversation(conversation);
    } else {
      console.warn('⚠️ No conversation found for ID:', conversationId)
    }
  }, [conversations]);

  // Envoyer un message
  const sendMessage = useCallback((conversationId, content, type = 'text', replyTo = null, attachments = null, senderId = 'current-user', senderName = 'Vous') => {
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
      attachments,
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

  // Marquer conversation comme lue
  const markAsRead = useCallback(async (conversationId) => {
    setConversations(prev => prev.map(conv =>
      conv.id === conversationId
        ? { ...conv, unreadCount: 0 }
        : conv
    ));

    setActiveConversation(prev =>
      prev?.id === conversationId ? { ...prev, unreadCount: 0 } : prev
    );

    if (user?.email) {
      try {
        await fetch('/api/messages/mark-read', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ conversationId, userEmail: user.email }),
        });
      } catch (error) {
        console.warn('Erreur API mark-read:', error);
      }
    }
  }, [user]);

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
  const forwardMessage = useCallback(async (fromConversationId, toConversationId, messageId) => {
    const message = messages[fromConversationId]?.find(m => m.id === messageId);
    if (message && toConversationId) {
      // First update local state for immediate feedback
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

      // Then persist to database via API
      try {
        const userEmail = user?.email || localStorage.getItem('user_email') || 'demo@user.com';
        // The API expects: /api/messages/{conversationId}/transfer?messageId={messageId}
        const response = await fetch(`/api/messages/${fromConversationId}/transfer?messageId=${messageId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            targetConversationId: toConversationId,
            userEmail: userEmail
          })
        });
        if (response.ok) {
          const data = await response.json();
          console.log('Message transferred successfully:', data);
        } else {
          console.error('Failed to transfer message:', response.statusText);
        }
      } catch (error) {
        console.error('Error transferring message:', error);
      }
    }
  }, [messages, user]);

  // Effacer toutes les données (pour reset)
  const clearData = useCallback(() => {
    setConversations(initialConversations);
    setActiveConversation(null);
    setMessages(initialMessages);
    localStorage.removeItem('chat_conversations');
    localStorage.removeItem('chat_activeConversation');
    localStorage.removeItem('chat_messages');
  }, [initialConversations, initialMessages]);

  return {
    conversations,
    activeConversation,
    messages,
    selectConversation,
    sendMessage,
    deleteConversation,
    blockUser,
    unblockUser,
    markAsRead,
    reactToMessage,
    forwardMessage,
    updateConversations,
    clearData,
  };
};

export default useChat;