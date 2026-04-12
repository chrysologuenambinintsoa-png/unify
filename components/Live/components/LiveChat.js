/**
 * LiveChat.js - Composant de chat en temps réel pour le live
 * Design professionnel avec badges et indicateurs
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import styles from './LiveChat.module.css';

const LiveChat = ({
  comments = [],
  pinnedComment = null,
  onSendMessage,
  userInfo,
  isEnabled = true,
  maxHeight = 400,
}) => {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatContainerRef = useRef(null);
  const inputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [comments]);

  const handleSendMessage = useCallback((e) => {
    e.preventDefault();
    
    if (!message.trim() || !isEnabled) return;

    onSendMessage(message, userInfo);
    setMessage('');
    setIsTyping(false);
    
    inputRef.current?.focus();
  }, [message, isEnabled, onSendMessage, userInfo]);

  const handleInputChange = useCallback((e) => {
    setMessage(e.target.value);
    
    if (!isTyping) {
      setIsTyping(true);
    }
    
    clearTimeout(typingTimeoutRef.current);
    
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 2000);
  }, [isTyping]);

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getAvatarColor = (userId) => {
    const colors = [
      '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
      '#f59e0b', '#10b981', '#06b6d4', '#3b82f6',
    ];
    const index = userId ? userId.charCodeAt(0) % colors.length : 0;
    return colors[index];
  };

  const getUserBadge = (user) => {
    if (!user?.role) return null;
    const badges = {
      host: { label: 'Host', className: styles['live-chat-badge-host'] },
      mod: { label: 'Mod', className: styles['live-chat-badge-mod'] },
      vip: { label: 'VIP', className: styles['live-chat-badge-vip'] },
    };
    return badges[user.role] || null;
  };

  return (
    <div className={styles['live-chat-container']}>
      {/* Header */}
      <div className={styles['live-chat-header']}>
        <div className={styles['live-chat-title']}>
          <svg viewBox="0 0 24 24" fill="currentColor" className={styles['live-chat-icon']}>
            <path d="M12 2C6.48 2 2 6.48 2 12c0 1.33.26 2.6.73 3.76L2 22l6.24-1.23C9.4 21.74 10.67 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm0 18c-1.08 0-2.13-.17-3.1-.5l-.22-.1-2.54.5.5-2.54-.1-.22A7.963 7.963 0 014 12c0-4.41 3.59-8 8-8s8 3.59 8 8-3.59 8-8 8z"/>
          </svg>
          <span>Commentaires</span>
        </div>
        <div className={styles['live-chat-count']}>
          {comments.length}
        </div>
      </div>

      {/* Pinned Comment */}
      {pinnedComment && (
        <div className={styles['live-chat-pinned']}>
          <div className={styles['live-chat-pinned-badge']}>
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z"/>
            </svg>
            Épinglé
          </div>
          <div className={styles['live-chat-pinned-content']}>
            <div 
              className={styles['live-chat-avatar']}
              style={{ background: getAvatarColor(pinnedComment.user?.id) }}
            >
              {pinnedComment.user?.name?.[0] || 'U'}
            </div>
            <div className={styles['live-chat-pinned-message']}>
              <div className={styles['live-chat-pinned-author']}>
                {pinnedComment.user?.name || 'Utilisateur'}
              </div>
              <div className={styles['live-chat-pinned-text']}>
                {pinnedComment.message}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Comments List */}
      <div 
        ref={chatContainerRef}
        className={styles['live-chat-messages']}
        style={{ maxHeight: `${maxHeight}px` }}
      >
        {comments.length === 0 ? (
          <div className={styles['live-chat-empty']}>
            <div className={styles['live-chat-empty-icon']}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
              </svg>
            </div>
            <div className={styles['live-chat-empty-text']}>
              Aucun commentaire pour le moment
            </div>
          </div>
        ) : (
          comments.map((comment) => {
            const badge = getUserBadge(comment.user);
            return (
              <div key={comment.id} className={styles['live-chat-message']}>
                <div 
                  className={styles['live-chat-avatar']}
                  style={{ background: getAvatarColor(comment.user?.id) }}
                >
                  {comment.user?.name?.[0] || 'U'}
                </div>
                <div className={styles['live-chat-message-content']}>
                  <div className={styles['live-chat-message-header']}>
                    <span className={styles['live-chat-message-author']}>
                      {comment.user?.name || 'Utilisateur'}
                      {badge && (
                        <span className={`${styles['live-chat-badge']} ${badge.className}`}>
                          {badge.label}
                        </span>
                      )}
                    </span>
                    <span className={styles['live-chat-message-time']}>
                      {formatTime(comment.timestamp)}
                    </span>
                  </div>
                  <div className={styles['live-chat-message-text']}>
                    {comment.message}
                  </div>
                </div>
              </div>
            );
          })
        )}
        
        {/* Typing Indicator */}
        {isTyping && (
          <div className={styles['live-chat-typing']}>
            <div className={styles['live-chat-typing-dots']}>
              <span></span>
              <span></span>
              <span></span>
            </div>
            <span>En cours de rédaction...</span>
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className={styles['live-chat-input-container']}>
        <div className={styles['live-chat-input-wrapper']}>
          <input
            ref={inputRef}
            type="text"
            className={styles['live-chat-input']}
            placeholder={isEnabled ? "Ajouter un commentaire..." : "Chat désactivé"}
            value={message}
            onChange={handleInputChange}
            disabled={!isEnabled}
            maxLength={500}
          />
          <button 
            type="submit"
            className={styles['live-chat-send-btn']}
            disabled={!message.trim() || !isEnabled}
            aria-label="Envoyer"
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
            </svg>
          </button>
        </div>
        <div className={styles['live-chat-char-count']}>
          {message.length}/500
        </div>
      </form>
    </div>
  );
};

export default LiveChat;
