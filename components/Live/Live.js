/**
 * Live.js - Composant principal de streaming live
 * Inspiré de Facebook Live avec fonctionnalités complètes
 * 
 * @author SuperNinja AI
 * @version 2.0.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { LiveProvider, useLive } from './context/LiveContext';
import { useReactions } from './hooks/useReactions';
import { useComments } from './hooks/useComments';
import VideoPlayer from './components/VideoPlayer';
import LiveChat from './components/LiveChat';
import ReactionsOverlay from './components/ReactionsOverlay';
import ActionBar from './components/ActionBar';
import ViewerCounter from './components/ViewerCounter';
import StreamerInfo from './components/StreamerInfo';

// ============================================
// COMPOSANT INTERNE (avec contexte)
// ============================================

const LiveInner = ({
  liveId,
  userInfo,
  showChat = true,
  showReactions = true,
  showActionBar = true,
  showViewerCount = true,
  autoPlay = true,
  muted = false,
  onReaction,
  onComment,
  onShare,
  onError,
  onViewerJoin,
  onViewerLeave
}) => {
  const { socket, isConnected, liveData, joinLive, leaveLive } = useLive();
  const { reactions, totalReactions, sendReaction } = useReactions();
  const { comments, sendMessage, pinnedComment } = useComments();
  
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isLiveActive, setIsLiveActive] = useState(liveId === 'demo-live');
  const [isMobile, setIsMobile] = useState(false);
  const containerRef = useRef(null);
  const controlsTimeoutRef = useRef(null);

  // Détecter si on est sur mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Rejoindre le live au montage
  useEffect(() => {
    if (liveId && isConnected) {
      joinLive(liveId, userInfo);
      onViewerJoin?.();
    }

    return () => {
      if (liveId) {
        leaveLive(liveId);
        onViewerLeave?.();
      }
    };
  }, [liveId, isConnected]);

  // Gérer l'affichage des contrôles
  const handleMouseMove = useCallback(() => {
    setShowControls(true);
    clearTimeout(controlsTimeoutRef.current);
    
    const timeout = isMobile ? 5000 : 3000;
    
    controlsTimeoutRef.current = setTimeout(() => {
      if (!isFullscreen && !isMobile) {
        setShowControls(false);
      }
    }, timeout);
  }, [isFullscreen, isMobile]);

  // Gérer les réactions
  const handleReaction = useCallback((reactionType, position) => {
    sendReaction(reactionType, position);
    onReaction?.({ type: reactionType, position });
  }, [sendReaction, onReaction]);

  // Gérer les commentaires
  const handleComment = useCallback((message) => {
    sendMessage(message);
    onComment?.({ message });
  }, [sendMessage, onComment]);

  // Gérer le partage
  const handleShare = useCallback((platform) => {
    socket?.emit('share_live', { liveId, platform, userInfo });
    onShare?.({ platform });
  }, [socket, liveId, userInfo, onShare]);

  // Gérer le démarrage du live
  const handleStartLive = useCallback(() => {
    setIsLiveActive(true);
    socket?.emit('start_live', { liveId, userInfo });
  }, [socket, liveId, userInfo]);

  // Gérer l'arrêt du live
  const handleStopLive = useCallback(() => {
    setIsLiveActive(false);
    socket?.emit('stop_live', { liveId, userInfo });
  }, [socket, liveId, userInfo]);

  // Toggle fullscreen
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  // Écouter les changements de fullscreen
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Rendu conditionnel si non connecté
  if (!isConnected) {
    return (
      <div className="live-loading">
        <div className="live-loader"></div>
        <p>Connexion au live en cours...</p>
      </div>
    );
  }

  // Rendu conditionnel si pas de données
  if (!liveData) {
    // Mode démo pour test
    if (liveId === 'demo-live') {
      return (
        <div className="live-container">
          <div className="live-video-wrapper">
            <div className="live-demo-placeholder">
              <div className="live-demo-icon">🎥</div>
              <div className="live-demo-title">Vidéo Live Démo</div>
              <div className="live-demo-subtitle">
                Fonctionnalité en développement<br/>
                Le bouton vidéo en direct est maintenant fonctionnel !
              </div>
              <div className="live-badge">
                <span className="live-dot"></span>
                EN DIRECT
              </div>
            </div>
            
            {/* Streamer Info */}
            <div className="live-streamer-info-demo">
              <div className="live-streamer-avatar">
                {userInfo?.name?.[0] || 'U'}
              </div>
              <div className="live-streamer-details">
                <div className="live-streamer-name">
                  {userInfo?.name || 'Utilisateur Démo'}
                </div>
                <div className="live-streamer-status">
                  Live streaming en développement
                </div>
              </div>
            </div>
          </div>
          
          {/* Action Bar */}
          <div className="live-action-bar-demo">
            <button className="live-action-btn live-action-btn-primary">
              👍 J'aime
            </button>
            <button className="live-action-btn">
              💬 Commenter
            </button>
            <button className="live-action-btn">
              ➤ Partager
            </button>
          </div>
        </div>
      );
    }
    
    return (
      <div className="live-error">
        <div className="live-error-icon">⚠️</div>
        <p>Live non trouvé ou terminé</p>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={`live-container ${isFullscreen ? 'live-fullscreen' : ''} ${isMobile ? 'live-mobile' : ''}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isFullscreen && !isMobile && setShowControls(false)}
    >
      {/* Video Player */}
      <div className="live-video-wrapper">
        <VideoPlayer
          src={liveData.streamUrl}
          poster={liveData.thumbnail}
          autoPlay={autoPlay}
          muted={muted}
          isLive={liveData.status === 'live'}
        />
        
        {/* Reactions Overlay */}
        {showReactions && (
          <ReactionsOverlay 
            reactions={reactions}
            onReaction={handleReaction}
          />
        )}
        
        {/* Live Badge */}
        {liveData.status === 'live' && (
          <div className="live-badge">
            <span className="live-dot"></span>
            EN DIRECT
          </div>
        )}
        
        {/* Viewer Counter */}
        {showViewerCount && (
          <ViewerCounter count={liveData.viewerCount} />
        )}
      </div>

      {/* Streamer Info */}
      {showControls && (
        <StreamerInfo 
          streamer={liveData.streamer}
          title={liveData.title}
          category={liveData.category}
        />
      )}

      {/* Main Content Area */}
      <div className="live-content">
        {/* Action Bar */}
        {showActionBar && showControls && (
          <ActionBar
            onReaction={handleReaction}
            onShare={handleShare}
            onFullscreen={toggleFullscreen}
            onStartLive={handleStartLive}
            onStopLive={handleStopLive}
            isLiveActive={isLiveActive}
            isFullscreen={isFullscreen}
            totalReactions={totalReactions}
            enableLiveControls={true}
          />
        )}
        
        {/* Chat */}
        {showChat && (
          <LiveChat
            comments={comments}
            pinnedComment={pinnedComment}
            onSendMessage={handleComment}
            userInfo={userInfo}
            isEnabled={liveData.settings?.enableChat !== false}
          />
        )}
      </div>
    </div>
  );
};

// ============================================
// COMPOSANT PRINCIPAL (avec Provider)
// ============================================

const Live = ({
  liveId,
  userInfo,
  socketUrl = 'http://localhost:5000',
  ...props
}) => {
  return (
    <LiveProvider socketUrl={socketUrl} liveId={liveId} userInfo={userInfo}>
      <LiveInner
        liveId={liveId}
        userInfo={userInfo}
        {...props}
      />
    </LiveProvider>
  );
};

export default Live;

// Export des sous-composants pour utilisation individuelle
export { default as VideoPlayer } from './components/VideoPlayer';
export { default as LiveChat } from './components/LiveChat';
export { default as ReactionsOverlay } from './components/ReactionsOverlay';
export { default as ActionBar } from './components/ActionBar';
export { default as ViewerCounter } from './components/ViewerCounter';
export { default as StreamerInfo } from './components/StreamerInfo';
