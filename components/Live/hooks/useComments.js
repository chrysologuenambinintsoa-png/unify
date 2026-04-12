/**
 * useComments.js - Hook pour la gestion des commentaires en temps réel
 * Gère le chat live avec fonctionnalités de mise en évidence et d'épinglage
 */

import { useState, useCallback, useEffect } from 'react';
import { useLive } from '../context/LiveContext';

export const useComments = () => {
  const { socket, isConnected } = useLive();
  const [comments, setComments] = useState([]);
  const [pinnedComment, setPinnedComment] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);

  // Écouter les nouveaux commentaires
  useEffect(() => {
    if (!socket) return;

    const handleNewComment = (comment) => {
      setComments(prev => [...prev, comment]);
    };

    const handlePinnedComment = (comment) => {
      setPinnedComment(comment);
    };

    const handleUnpinnedComment = () => {
      setPinnedComment(null);
    };

    const handleCommentDeleted = (commentId) => {
      setComments(prev => prev.filter(c => c.id !== commentId));
      if (pinnedComment?.id === commentId) {
        setPinnedComment(null);
      }
    };

    const handleTypingStart = (user) => {
      setTypingUsers(prev => {
        if (!prev.find(u => u.id === user.id)) {
          return [...prev, user];
        }
        return prev;
      });
    };

    const handleTypingStop = (userId) => {
      setTypingUsers(prev => prev.filter(u => u.id !== userId));
    };

    socket.on('new_comment', handleNewComment);
    socket.on('comment_pinned', handlePinnedComment);
    socket.on('comment_unpinned', handleUnpinnedComment);
    socket.on('comment_deleted', handleCommentDeleted);
    socket.on('typing_start', handleTypingStart);
    socket.on('typing_stop', handleTypingStop);

    return () => {
      socket.off('new_comment', handleNewComment);
      socket.off('comment_pinned', handlePinnedComment);
      socket.off('comment_unpinned', handleUnpinnedComment);
      socket.off('comment_deleted', handleCommentDeleted);
      socket.off('typing_start', handleTypingStart);
      socket.off('typing_stop', handleTypingStop);
    };
  }, [socket, pinnedComment]);

  // Envoyer un commentaire
  const sendMessage = useCallback((message, userInfo) => {
    if (!socket || !isConnected) {
      console.warn('[useComments] Socket non connecté');
      return;
    }

    if (!message || message.trim() === '') {
      return;
    }

    const comment = {
      id: Date.now() + Math.random(),
      message: message.trim(),
      user: userInfo,
      timestamp: new Date().toISOString(),
      isPinned: false,
    };

    // Ajouter localement
    setComments(prev => [...prev, comment]);

    // Envoyer au serveur
    socket.emit('send_comment', comment);

    return comment;
  }, [socket, isConnected]);

  // Épingle un commentaire
  const pinComment = useCallback((commentId) => {
    if (!socket || !isConnected) return;

    socket.emit('pin_comment', { commentId });
  }, [socket, isConnected]);

  // Désépingler un commentaire
  const unpinComment = useCallback(() => {
    if (!socket || !isConnected) return;

    socket.emit('unpin_comment');
  }, [socket, isConnected]);

  // Supprimer un commentaire
  const deleteComment = useCallback((commentId) => {
    if (!socket || !isConnected) return;

    socket.emit('delete_comment', { commentId });
  }, [socket, isConnected]);

  // Signaler le début de la saisie
  const startTyping = useCallback((userInfo) => {
    if (!socket || !isConnected) return;

    socket.emit('typing_start', { user: userInfo });
    setIsTyping(true);
  }, [socket, isConnected]);

  // Signaler la fin de la saisie
  const stopTyping = useCallback(() => {
    if (!socket || !isConnected) return;

    socket.emit('typing_stop');
    setIsTyping(false);
  }, [socket, isConnected]);

  // Effacer tous les commentaires
  const clearComments = useCallback(() => {
    setComments([]);
    setPinnedComment(null);
  }, []);

  // Obtenir le nombre de commentaires
  const getCommentCount = useCallback(() => {
    return comments.length;
  }, [comments]);

  // Rechercher dans les commentaires
  const searchComments = useCallback((query) => {
    if (!query) return comments;

    const lowerQuery = query.toLowerCase();
    return comments.filter(comment => 
      comment.message.toLowerCase().includes(lowerQuery) ||
      comment.user?.name?.toLowerCase().includes(lowerQuery)
    );
  }, [comments]);

  return {
    comments,
    pinnedComment,
    isTyping,
    typingUsers,
    sendMessage,
    pinComment,
    unpinComment,
    deleteComment,
    startTyping,
    stopTyping,
    clearComments,
    getCommentCount,
    searchComments,
  };
};

export default useComments;
