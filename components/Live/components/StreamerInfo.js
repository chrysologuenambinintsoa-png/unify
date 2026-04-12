/**
 * StreamerInfo.js - Informations sur le streamer
 * Affiche le nom, la catÃ©gorie et le titre du live
 */

import React from 'react';


const StreamerInfo = ({
  streamer = {},
  title = '',
  category = '',
  showFollowButton = true,
  onFollow,
}) => {
  // Obtenir la couleur de l'avatar
  const getAvatarColor = (name) => {
    const colors = [
      '#003d5c', '#42b72a', '#f02849', '#f7b928',
      '#8b5cf6', '#ec4899', '#14b8a6', '#f97316',
    ];
    const index = name ? name.charCodeAt(0) % colors.length : 0;
    return colors[index];
  };

  return (
    <div className={styles['streamer-info-container']}>
      {/* Avatar */}
      <div 
        className={styles['streamer-info-avatar']}
        style={{ background: getAvatarColor(streamer.name) }}
      >
        {streamer.avatar ? (
          <img 
            src={streamer.avatar} 
            alt={streamer.name}
            className={styles['streamer-info-avatar-img']}
          />
        ) : (
          <span className={styles['streamer-info-avatar-letter']}>
            {streamer.name?.[0] || 'U'}
          </span>
        )}
      </div>

      {/* Details */}
      <div className={styles['streamer-info-details']}>
        {/* Name */}
        <div className={styles['streamer-info-name']}>
          {streamer.name || 'Utilisateur'}
          {streamer.verified && (
            <svg 
              viewBox="0 0 24 24" 
              fill="currentColor" 
              className={styles['streamer-info-verified']}
            >
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          )}
        </div>

        {/* Title */}
        {title && (
          <div className={styles['streamer-info-title']}>
            {title}
          </div>
        )}

        {/* Category */}
        {category && (
          <div className={styles['streamer-info-category']}>
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.63 5.84C17.27 5.33 16.67 5 16 5L5 5.01C3.9 5.01 3 5.9 3 7v10c0 1.1.9 1.99 2 1.99L16 19c.67 0 1.27-.33 1.63-.84L22 12l-4.37-6.16z"/>
            </svg>
            <span>{category}</span>
          </div>
        )}
      </div>

      {/* Follow Button */}
      {showFollowButton && (
        <button 
          className={styles['streamer-info-follow-btn']}
          onClick={onFollow}
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V7H4v3H1v2h3v3h2v-3h3v-2H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
          </svg>
          <span>Suivre</span>
        </button>
      )}
    </div>
  );
};

export default StreamerInfo;

