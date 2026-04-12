/**
 * ActionBar.js - Barre d'actions pour le live
 * Inclut les réactions, partage, et contrôles de diffusion
 */

import React, { useState, useCallback } from 'react';
import { REACTIONS_CONFIG, REACTION_TYPES } from '../hooks/useReactions';


const ActionBar = ({
  onReaction,
  onShare,
  onFullscreen,
  onStartLive,
  onStopLive,
  isLiveActive = false,
  isFullscreen = false,
  totalReactions = 0,
  enableLiveControls = false,
}) => {
  const [showReactions, setShowReactions] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);

  // Gérer le clic sur une réaction
  const handleReactionClick = useCallback((type) => {
    onReaction?.(type);
    setShowReactions(false);
  }, [onReaction]);

  // Gérer le partage
  const handleShare = useCallback((platform) => {
    onShare?.(platform);
    setShowShareMenu(false);
  }, [onShare]);

  // Gérer le démarrage/arrêt du live
  const handleLiveToggle = useCallback(() => {
    if (isLiveActive) {
      onStopLive?.();
    } else {
      onStartLive?.();
    }
  }, [isLiveActive, onStartLive, onStopLive]);

  return (
    <div className={styles['action-bar-container']}>
      {/* Reactions Section */}
      <div className={styles['action-bar-reactions']}>
        {/* Main Reaction Button */}
        <button
          className={`${styles['action-bar-btn']} ${styles['action-bar-btn-reaction']}`}
          onClick={() => setShowReactions(!showReactions)}
          aria-label="Réagir"
        >
          <span className={styles['action-bar-reaction-emoji']}>👍</span>
          <span className={styles['action-bar-reaction-count']}>
            {totalReactions > 0 ? totalReactions : 'Réagir'}
          </span>
        </button>

        {/* Reactions Popup */}
        {showReactions && (
          <div className={styles['action-bar-reactions-popup']}>
            {Object.entries(REACTIONS_CONFIG).map(([type, config]) => (
              <button
                key={type}
                className={styles['action-bar-reaction-option']}
                onClick={() => handleReactionClick(type)}
                aria-label={config.label}
              >
                <span className={styles['action-bar-reaction-option-emoji']}>
                  {config.emoji}
                </span>
                <span className={styles['action-bar-reaction-option-label']}>
                  {config.label}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Comment Button */}
      <button className={styles['action-bar-btn']} aria-label="Commenter">
        <svg viewBox="0 0 24 24" fill="currentColor" className={styles['action-bar-icon']}>
          <path d="M21.99 4c0-1.1-.89-2-1.99-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4-.01-18zM18 14H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
        </svg>
        <span>Commenter</span>
      </button>

      {/* Share Section */}
      <div className={styles['action-bar-share']}>
        <button
          className={styles['action-bar-btn']}
          onClick={() => setShowShareMenu(!showShareMenu)}
          aria-label="Partager"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className={styles['action-bar-icon']}>
            <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z"/>
          </svg>
          <span>Partager</span>
        </button>

        {/* Share Menu */}
        {showShareMenu && (
          <div className={styles['action-bar-share-menu']}>
            <button
              className={styles['action-bar-share-option']}
              onClick={() => handleShare('facebook')}
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c5.05-.5 9-4.76 9-9.95z"/>
              </svg>
              <span>Facebook</span>
            </button>
            <button
              className={styles['action-bar-share-option']}
              onClick={() => handleShare('twitter')}
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.46 6c-.85.38-1.78.64-2.75.76 1-.6 1.76-1.55 2.12-2.68-.93.55-1.96.95-3.06 1.17-.88-.94-2.13-1.53-3.51-1.53-2.66 0-4.81 2.16-4.81 4.81 0 .38.04.75.13 1.1-4-.2-7.58-2.11-9.96-5.02-.42.72-.66 1.56-.66 2.46 0 1.68.85 3.16 2.14 4.02-.79-.02-1.53-.24-2.18-.6v.06c0 2.35 1.67 4.31 3.88 4.76-.4.1-.83.16-1.27.16-.31 0-.62-.03-.92-.08.63 1.96 2.45 3.39 4.61 3.43-1.69 1.32-3.83 2.1-6.15 2.1-.4 0-.8-.02-1.19-.07 2.19 1.4 4.78 2.22 7.57 2.22 9.07 0 14.02-7.52 14.02-14.02 0-.21 0-.42-.01-.63.96-.69 1.79-1.56 2.45-2.55z"/>
              </svg>
              <span>Twitter</span>
            </button>
            <button
              className={styles['action-bar-share-option']}
              onClick={() => handleShare('copy')}
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
              </svg>
              <span>Copier le lien</span>
            </button>
          </div>
        )}
      </div>

      {/* Spacer */}
      <div className={styles['action-bar-spacer']}></div>

      {/* Live Controls */}
      {enableLiveControls && (
        <button
          className={`${styles['action-bar-btn']} ${styles['action-bar-btn-live']} ${isLiveActive ? styles['active'] : ''}`}
          onClick={handleLiveToggle}
          aria-label={isLiveActive ? 'Arrêter le live' : 'Démarrer le live'}
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className={styles['action-bar-icon']}>
            {isLiveActive ? (
              <path d="M6 6h12v12H6z"/>
            ) : (
              <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
            )}
          </svg>
          <span>{isLiveActive ? 'Arrêter' : 'Démarrer'}</span>
        </button>
      )}

      {/* Fullscreen Button */}
      <button
        className={styles['action-bar-btn']}
        onClick={onFullscreen}
        aria-label={isFullscreen ? 'Quitter le plein écran' : 'Plein écran'}
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className={styles['action-bar-icon']}>
          {isFullscreen ? (
            <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/>
          ) : (
            <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
          )}
        </svg>
      </button>
    </div>
  );
};

export default ActionBar;
