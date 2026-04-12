/**
 * ProfessionalLiveVideo.js - Composant de streaming live professionnel
 * FonctionnalitÃ©s complÃ¨tes : chat, rÃ©actions, partage, contrÃ´les avancÃ©s
 * 
 * @author SuperNinja AI
 * @version 1.0.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlay,
  faPause,
  faVolumeUp,
  faVolumeMute,
  faExpand,
  faCompress,
  faCog,
  faTimes,
  faHeart,
  faThumbsUp,
  faLaugh,
  faSurprise,
  faSadTear,
  faAngry,
  faPaperPlane,
  faSmile,
  faEye,
  faVideo,
  faStop,
  faShare,
  faLink,
  faComment,
  faUsers,
  faSpinner,
  faBroadcastTower
} from '@fortawesome/free-solid-svg-icons';

// ============================================
// COMPOSANT PRINCIPAL
// ============================================

const ProfessionalLiveVideo = ({
  liveId,
  userInfo,
  socketUrl = 'http://localhost:5000',
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
  onViewerLeave,
  onStartLive,
  onStopLive
}) => {
  // Ã‰tats principaux
  const [isConnected, setIsConnected] = useState(false);
  const [isLiveActive, setIsLiveActive] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isMuted, setIsMuted] = useState(muted);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isBuffering, setIsBuffering] = useState(false);
  const [quality, setQuality] = useState('auto');
  const [showSettings, setShowSettings] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const [isCameraLoading, setIsCameraLoading] = useState(false);
  
  // Ã‰tats du live
  const [liveData, setLiveData] = useState({
    title: 'Live en direct',
    streamer: userInfo?.name || 'Utilisateur',
    category: 'GÃ©nÃ©ral',
    viewerCount: 0,
    status: 'waiting',
    streamUrl: null,
    thumbnail: null
  });
  
  // Ã‰tats des interactions
  const [reactions, setReactions] = useState([]);
  const [comments, setComments] = useState([]);
  const [pinnedComment, setPinnedComment] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedReaction, setSelectedReaction] = useState(null);
  
  // Refs
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const chatRef = useRef(null);
  const controlsTimeoutRef = useRef(null);
  const socketRef = useRef(null);
  const streamRef = useRef(null);
  
  // Emojis et rÃ©actions
  const quickEmojis = ['ðŸ˜€', 'ðŸ˜‚', 'â¤ï¸', 'ðŸ‘', 'ðŸ˜®', 'ðŸ˜¢', 'ðŸ˜¡', 'ðŸŽ‰', 'ðŸ”¥', 'ðŸ’¯'];
  const reactionTypes = [
    { type: 'like', icon: faThumbsUp, label: 'J\'aime', color: '#003d5c' },
    { type: 'love', icon: faHeart, label: 'J\'adore', color: '#f3425f' },
    { type: 'haha', icon: faLaugh, label: 'Haha', color: '#f7b928' },
    { type: 'wow', icon: faSurprise, label: 'Wow', color: '#f7b928' },
    { type: 'sad', icon: faSadTear, label: 'Triste', color: '#f7b928' },
    { type: 'angry', icon: faAngry, label: 'Grr', color: '#e74c3c' }
  ];
  
  const qualityOptions = [
    { value: 'auto', label: 'Automatique' },
    { value: '1080p', label: '1080p HD' },
    { value: '720p', label: '720p' },
    { value: '480p', label: '480p' },
    { value: '360p', label: '360p' }
  ];

  // ============================================
  // EFFETS
  // ============================================

  // DÃ©tecter si on est sur mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Connexion WebSocket
  useEffect(() => {
    if (!socketUrl) return;
    
    try {
      // Simulation de connexion WebSocket
      const connectSocket = () => {
        setIsConnected(true);
        console.log('WebSocket connectÃ© Ã :', socketUrl);
      };
      
      connectSocket();
      
      return () => {
        setIsConnected(false);
        console.log('WebSocket dÃ©connectÃ©');
      };
    } catch (error) {
      console.error('Erreur de connexion WebSocket:', error);
      onError?.(error);
    }
  }, [socketUrl, onError]);

  // Rejoindre le live
  useEffect(() => {
    if (isConnected && liveId) {
      setLiveData(prev => ({
        ...prev,
        status: 'live',
        viewerCount: Math.floor(Math.random() * 100) + 10
      }));
      setIsLiveActive(true);
      onViewerJoin?.();
      
      // Simuler des viewers qui rejoignent
      const viewerInterval = setInterval(() => {
        setLiveData(prev => ({
          ...prev,
          viewerCount: prev.viewerCount + Math.floor(Math.random() * 3)
        }));
      }, 5000);
      
      return () => {
        clearInterval(viewerInterval);
        onViewerLeave?.();
      };
    }
  }, [isConnected, liveId, onViewerJoin, onViewerLeave]);

  // GÃ©rer l'affichage des contrÃ´les
  useEffect(() => {
    const handleMouseMove = () => {
      setShowControls(true);
      clearTimeout(controlsTimeoutRef.current);
      
      const timeout = isMobile ? 5000 : 3000;
      
      controlsTimeoutRef.current = setTimeout(() => {
        if (!isFullscreen && !isMobile) {
          setShowControls(false);
        }
      }, timeout);
    };
    
    const container = containerRef.current;
    if (container) {
      container.addEventListener('mousemove', handleMouseMove);
      container.addEventListener('touchstart', handleMouseMove);
    }
    
    return () => {
      if (container) {
        container.removeEventListener('mousemove', handleMouseMove);
        container.removeEventListener('touchstart', handleMouseMove);
      }
      clearTimeout(controlsTimeoutRef.current);
    };
  }, [isFullscreen, isMobile]);

  // Ã‰couter les changements de fullscreen
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Scroll automatique du chat
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [comments]);

  // ============================================
  // GESTIONNAIRES D'Ã‰VÃ‰NEMENTS
  // ============================================

  // GÃ©rer les rÃ©actions
  const handleReaction = useCallback((reactionType) => {
    const reaction = {
      id: Date.now(),
      type: reactionType,
      user: userInfo?.name || 'Utilisateur',
      timestamp: new Date().toISOString()
    };
    
    setReactions(prev => [...prev, reaction]);
    setSelectedReaction(reactionType);
    
    // Animation de la rÃ©action
    setTimeout(() => setSelectedReaction(null), 1000);
    
    onReaction?.(reaction);
  }, [userInfo, onReaction]);

  // GÃ©rer les commentaires
  const handleSendComment = useCallback(() => {
    if (!newComment.trim()) return;
    
    const comment = {
      id: Date.now(),
      text: newComment.trim(),
      user: userInfo?.name || 'Utilisateur',
      avatar: userInfo?.avatar || null,
      timestamp: new Date().toISOString()
    };
    
    setComments(prev => [...prev, comment]);
    setNewComment('');
    
    onComment?.(comment);
  }, [newComment, userInfo, onComment]);

  // GÃ©rer le partage
  const handleShare = useCallback((platform) => {
    const shareData = {
      liveId,
      platform,
      title: liveData.title,
      streamer: liveData.streamer
    };
    
    onShare?.(shareData);
    
    // Feedback visuel
    alert(`PartagÃ© sur ${platform} !`);
  }, [liveId, liveData, onShare]);

  // GÃ©rer le dÃ©marrage du live
  const handleStartLive = useCallback(async () => {
    setIsCameraLoading(true);
    setCameraError(null);
    
    try {
      // Demander l'accÃ¨s Ã  la camÃ©ra
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: true
      });
      
      streamRef.current = stream;
      setCameraStream(stream);
      
      // Attacher le stream Ã  l'Ã©lÃ©ment vidÃ©o
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      setIsLiveActive(true);
      setLiveData(prev => ({ ...prev, status: 'live' }));
      onStartLive?.();
    } catch (error) {
      console.error('Erreur d\'accÃ¨s Ã  la camÃ©ra:', error);
      setCameraError(
        error.name === 'NotAllowedError'
          ? 'AccÃ¨s Ã  la camÃ©ra refusÃ©. Veuillez autoriser l\'accÃ¨s dans les paramÃ¨tres de votre navigateur.'
          : error.name === 'NotFoundError'
          ? 'Aucune camÃ©ra dÃ©tectÃ©e sur votre appareil.'
          : 'Erreur lors de l\'accÃ¨s Ã  la camÃ©ra: ' + error.message
      );
    } finally {
      setIsCameraLoading(false);
    }
  }, [onStartLive]);

  // GÃ©rer l'arrÃªt du live
  const handleStopLive = useCallback(() => {
    setIsLiveActive(false);
    setLiveData(prev => ({ ...prev, status: 'ended' }));
    
    // ArrÃªter le stream camÃ©ra
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraStream(null);
    
    onStopLive?.();
  }, [onStopLive]);

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

  // Toggle mute
  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
    }
  }, [isMuted]);

  // Changer le volume
  const handleVolumeChange = useCallback((e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
  }, []);

  // GÃ©rer la lecture/pause
  const handlePlayPause = useCallback(() => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
    }
  }, []);

  // Ajouter un emoji au commentaire
  const addEmoji = useCallback((emoji) => {
    setNewComment(prev => prev + emoji);
    setShowEmojiPicker(false);
  }, []);

  // ============================================
  // RENDU
  // ============================================

  return (
    <div 
      ref={containerRef}
      className={`plv-container ${isFullscreen ? 'plv-fullscreen' : ''} ${isMobile ? 'plv-mobile' : ''}`}
    >
      {/* Video Player */}
      <div className="plv-video-wrapper">
        {cameraStream ? (
          <video
            ref={videoRef}
            className="plv-video"
            autoPlay
            muted={isMuted}
            playsInline
            onTimeUpdate={(e) => setCurrentTime(e.target.currentTime)}
            onDurationChange={(e) => setDuration(e.target.duration)}
            onWaiting={() => setIsBuffering(true)}
            onPlaying={() => setIsBuffering(false)}
            onError={(e) => onError?.(e)}
          />
        ) : liveData.streamUrl ? (
          <video
            ref={videoRef}
            className="plv-video"
            autoPlay={autoPlay}
            muted={isMuted}
            playsInline
            onTimeUpdate={(e) => setCurrentTime(e.target.currentTime)}
            onDurationChange={(e) => setDuration(e.target.duration)}
            onWaiting={() => setIsBuffering(true)}
            onPlaying={() => setIsBuffering(false)}
            onError={(e) => onError?.(e)}
          >
            <source src={liveData.streamUrl} type="video/mp4" />
            Votre navigateur ne supporte pas la vidÃ©o HTML5.
          </video>
        ) : (
          <div className="plv-placeholder">
            <div className="plv-placeholder-icon">
              <FontAwesomeIcon icon={faBroadcastTower} />
            </div>
            <div className="plv-placeholder-title">
              {cameraError ? 'Erreur camÃ©ra' : liveData.status === 'live' ? 'Live en cours' : 'En attente du live'}
            </div>
            <div className="plv-placeholder-subtitle">
              {cameraError ? (
                <span className="plv-camera-error">{cameraError}</span>
              ) : isCameraLoading ? (
                <span>
                  <FontAwesomeIcon icon={faSpinner} spin /> Chargement de la camÃ©ra...
                </span>
              ) : liveData.status === 'live' 
                ? 'Le streaming est actif' 
                : 'Cliquez sur \'DÃ©marrer le live\' pour activer la camÃ©ra'}
            </div>
            {liveData.status === 'live' && !cameraError && (
              <div className="plv-live-badge">
                <FontAwesomeIcon icon={faBroadcastTower} className="plv-live-icon" />
                <span className="plv-live-dot"></span>
                EN DIRECT
              </div>
            )}
          </div>
        )}
        
        {/* Buffering Indicator */}
        {isBuffering && (
          <div className="plv-buffering">
            <div className="plv-spinner"></div>
          </div>
        )}
        
        {/* Reactions Overlay */}
        {showReactions && reactions.length > 0 && (
          <div className="plv-reactions-overlay">
            {reactions.slice(-10).map((reaction) => (
              <div 
                key={reaction.id} 
                className="plv-floating-reaction"
                style={{
                  left: `${Math.random() * 80 + 10}%`,
                  animationDelay: `${Math.random() * 0.5}s`
                }}
              >
                {reactionTypes.find(r => r.type === reaction.type)?.emoji || 'ðŸ‘'}
              </div>
            ))}
          </div>
        )}
        
        {/* Live Badge */}
        {liveData.status === 'live' && (
          <div className="plv-live-badge">
            <FontAwesomeIcon icon={faBroadcastTower} className="plv-live-icon" />
            <span className="plv-live-dot"></span>
            EN DIRECT
          </div>
        )}
        
        {/* Viewer Counter */}
        {showViewerCount && (
          <div className="plv-viewer-count">
            <FontAwesomeIcon icon={faEye} className="plv-viewer-icon" />
            <span className="plv-viewer-number">{liveData.viewerCount}</span>
          </div>
        )}
        
        {/* Video Controls */}
        {showControls && (
          <div className="plv-video-controls">
            <button className="plv-control-btn" onClick={handlePlayPause}>
              <FontAwesomeIcon icon={videoRef.current?.paused ? faPlay : faPause} />
            </button>
            
            <div className="plv-progress-bar">
              <div 
                className="plv-progress-fill"
                style={{ width: `${(currentTime / duration) * 100}%` }}
              />
            </div>
            
            <span className="plv-time">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
            
            <button className="plv-control-btn" onClick={toggleMute}>
              <FontAwesomeIcon icon={isMuted ? faVolumeMute : faVolumeUp} />
            </button>
            
            {!isMobile && (
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={handleVolumeChange}
                className="plv-volume-slider"
              />
            )}
            
            <button 
              className="plv-control-btn plv-settings-btn"
              onClick={() => setShowSettings(!showSettings)}
            >
              <FontAwesomeIcon icon={faCog} />
            </button>
            
            <button className="plv-control-btn" onClick={toggleFullscreen}>
              <FontAwesomeIcon icon={isFullscreen ? faCompress : faExpand} />
            </button>
          </div>
        )}
        
        {/* Settings Panel */}
        {showSettings && (
          <div className="plv-settings-panel">
            <div className="plv-settings-header">
              <span>ParamÃ¨tres</span>
              <button onClick={() => setShowSettings(false)}>
              <FontAwesomeIcon icon={faTimes} />
            </button>
            </div>
            <div className="plv-settings-content">
              <div className="plv-setting-item">
                <label>QualitÃ©</label>
                <select 
                  value={quality} 
                  onChange={(e) => setQuality(e.target.value)}
                >
                  {qualityOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Streamer Info */}
      {showControls && (
        <div className="plv-streamer-info">
          <div className="plv-streamer-avatar">
            {liveData.streamer?.[0] || 'U'}
          </div>
          <div className="plv-streamer-details">
            <div className="plv-streamer-name">{liveData.streamer}</div>
            <div className="plv-streamer-category">{liveData.category}</div>
          </div>
          <div className="plv-live-title">{liveData.title}</div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="plv-content">
        {/* Action Bar */}
        {showActionBar && showControls && (
          <div className="plv-action-bar">
            <div className="plv-reaction-buttons">
              {reactionTypes.map((reaction) => (
                <button
                  key={reaction.type}
                  className={`plv-reaction-btn ${selectedReaction === reaction.type ? 'active' : ''}`}
                  onClick={() => handleReaction(reaction.type)}
                  title={reaction.label}
                  style={{ '--reaction-color': reaction.color }}
                >
                  <FontAwesomeIcon icon={reaction.icon} />
                </button>
              ))}
            </div>
            
            <div className="plv-action-buttons">
              {!isLiveActive ? (
                <button 
                  className="plv-action-btn plv-start-btn"
                  onClick={handleStartLive}
                >
                  <FontAwesomeIcon icon={faPlay} />
                  DÃ©marrer le live
                </button>
              ) : (
                <button 
                  className="plv-action-btn plv-stop-btn"
                  onClick={handleStopLive}
                >
                  <FontAwesomeIcon icon={faStop} />
                  ArrÃªter le live
                </button>
              )}
              
              <div className="plv-share-buttons">
                <button 
                  className="plv-share-btn"
                  onClick={() => handleShare('facebook')}
                  title="Partager sur Facebook"
                >
                  <FontAwesomeIcon icon={faShare} />
                </button>
                <button 
                  className="plv-share-btn"
                  onClick={() => handleShare('twitter')}
                  title="Partager sur Twitter"
                >
                  <FontAwesomeIcon icon={faShare} />
                </button>
                <button 
                  className="plv-share-btn"
                  onClick={() => handleShare('copy')}
                  title="Copier le lien"
                >
                  <FontAwesomeIcon icon={faLink} />
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Chat */}
        {showChat && (
          <div className="plv-chat">
            <div className="plv-chat-header">
              <span className="plv-chat-title">
              <FontAwesomeIcon icon={faComment} />
              Chat en direct
            </span>
              <span className="plv-chat-count">
              <FontAwesomeIcon icon={faUsers} />
              {comments.length} messages
            </span>
            </div>
            
            {pinnedComment && (
              <div className="plv-pinned-comment">
                <span className="plv-pinned-badge">ðŸ“Œ Ã‰pinglÃ©</span>
                <div className="plv-pinned-content">
                  <strong>{pinnedComment.user}:</strong> {pinnedComment.text}
                </div>
              </div>
            )}
            
            <div className="plv-chat-messages" ref={chatRef}>
              {comments.length === 0 ? (
                <div className="plv-chat-empty">
                  Aucun message pour le moment.<br/>
                  Soyez le premier Ã  commenter !
                </div>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="plv-chat-message">
                    <div className="plv-message-avatar">
                      {comment.avatar ? (
                        <img src={comment.avatar} alt="avatar" />
                      ) : (
                        <span>{comment.user?.[0] || 'U'}</span>
                      )}
                    </div>
                    <div className="plv-message-content">
                      <div className="plv-message-user">{comment.user}</div>
                      <div className="plv-message-text">{comment.text}</div>
                      <div className="plv-message-time">
                        {new Date(comment.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            <div className="plv-chat-input-wrapper">
              {showEmojiPicker && (
                <div className="plv-emoji-picker">
                  {quickEmojis.map((emoji) => (
                    <button
                      key={emoji}
                      className="plv-emoji-btn"
                      onClick={() => addEmoji(emoji)}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
              
              <div className="plv-chat-input-container">
                <button 
                  className="plv-emoji-toggle"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                >
                  <FontAwesomeIcon icon={faSmile} />
                </button>
                
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendComment()}
                  placeholder="Ã‰crire un commentaire..."
                  className="plv-chat-input"
                />
                
                <button 
                  className="plv-send-btn"
                  onClick={handleSendComment}
                  disabled={!newComment.trim()}
                >
                  <FontAwesomeIcon icon={faPaperPlane} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Styles */}
      <style jsx>{`
        .plv-container {
          display: flex;
          flex-direction: column;
          background: #000;
          border-radius: 12px;
          overflow: hidden;
          max-width: 100%;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
        }
        
        .plv-fullscreen {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          border-radius: 0;
          z-index: 9999;
        }
        
        .plv-mobile {
          border-radius: 0;
        }
        
        /* Video Wrapper */
        .plv-video-wrapper {
          position: relative;
          width: 100%;
          aspect-ratio: 16 / 9;
          background: #000;
          overflow: hidden;
        }
        
        .plv-fullscreen .plv-video-wrapper {
          aspect-ratio: auto;
          height: 100%;
        }
        
        .plv-video {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .plv-placeholder {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
          color: white;
          text-align: center;
          padding: 20px;
        }
        
        .plv-placeholder-icon {
          font-size: 64px;
          margin-bottom: 20px;
          animation: pulse 2s infinite;
          color: #f3425f;
        }
        
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.8; }
        }
        
        .plv-placeholder-title {
          font-size: 24px;
          font-weight: 700;
          margin-bottom: 10px;
        }
        
        .plv-placeholder-subtitle {
          font-size: 16px;
          color: #aaa;
          margin-bottom: 20px;
          max-width: 400px;
          line-height: 1.5;
        }
        
        .plv-camera-error {
          color: #f3425f;
          font-weight: 500;
        }
        
        .plv-buffering {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          z-index: 10;
        }
        
        .plv-spinner {
          width: 50px;
          height: 50px;
          border: 4px solid rgba(255, 255, 255, 0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        /* Live Badge */
        .plv-live-badge {
          position: absolute;
          top: 16px;
          left: 16px;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: #f3425f;
          color: white;
          font-size: 14px;
          font-weight: 700;
          border-radius: 6px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          z-index: 5;
        }
        
        .plv-live-icon {
          font-size: 12px;
        }

        .plv-live-dot {
          width: 8px;
          height: 8px;
          background: white;
          border-radius: 50%;
          animation: blink 1s infinite;
        }
        
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        
        /* Viewer Counter */
        .plv-viewer-count {
          position: absolute;
          top: 16px;
          right: 16px;
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          background: rgba(0, 0, 0, 0.7);
          color: white;
          font-size: 14px;
          font-weight: 600;
          border-radius: 6px;
          z-index: 5;
        }
        
        .plv-viewer-icon {
          font-size: 14px;
        }
        
        /* Video Controls */
        .plv-video-controls {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          background: linear-gradient(transparent, rgba(0, 0, 0, 0.8));
          z-index: 5;
        }
        
        .plv-control-btn {
          background: none;
          border: none;
          color: white;
          font-size: 20px;
          cursor: pointer;
          padding: 8px;
          border-radius: 6px;
          transition: all 0.2s ease;
        }
        
        .plv-control-btn:hover {
          background: rgba(255, 255, 255, 0.2);
        }
        
        .plv-progress-bar {
          flex: 1;
          height: 4px;
          background: rgba(255, 255, 255, 0.3);
          border-radius: 2px;
          overflow: hidden;
          cursor: pointer;
        }
        
        .plv-progress-fill {
          height: 100%;
          background: #f3425f;
          transition: width 0.1s linear;
        }
        
        .plv-time {
          color: white;
          font-size: 12px;
          font-weight: 500;
          white-space: nowrap;
        }
        
        .plv-volume-slider {
          width: 80px;
          height: 4px;
          -webkit-appearance: none;
          background: rgba(255, 255, 255, 0.3);
          border-radius: 2px;
          outline: none;
        }
        
        .plv-volume-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 12px;
          height: 12px;
          background: white;
          border-radius: 50%;
          cursor: pointer;
        }
        
        .plv-settings-btn {
          margin-left: auto;
        }
        
        /* Settings Panel */
        .plv-settings-panel {
          position: absolute;
          bottom: 60px;
          right: 16px;
          width: 200px;
          background: rgba(0, 0, 0, 0.9);
          border-radius: 10px;
          overflow: hidden;
          z-index: 10;
        }
        
        .plv-settings-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          background: rgba(255, 255, 255, 0.1);
          color: white;
          font-weight: 600;
        }
        
        .plv-settings-header button {
          background: none;
          border: none;
          color: white;
          cursor: pointer;
          font-size: 16px;
        }
        
        .plv-settings-content {
          padding: 16px;
        }
        
        .plv-setting-item {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        .plv-setting-item label {
          color: #aaa;
          font-size: 12px;
        }
        
        .plv-setting-item select {
          padding: 8px 12px;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 6px;
          color: white;
          font-size: 14px;
          cursor: pointer;
        }
        
        /* Reactions Overlay */
        .plv-reactions-overlay {
          position: absolute;
          bottom: 80px;
          left: 0;
          right: 0;
          pointer-events: none;
          z-index: 4;
        }
        
        .plv-floating-reaction {
          position: absolute;
          font-size: 32px;
          animation: floatUp 3s ease-out forwards;
        }
        
        @keyframes floatUp {
          0% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          100% {
            opacity: 0;
            transform: translateY(-200px) scale(0.5);
          }
        }
        
        /* Streamer Info */
        .plv-streamer-info {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          background: #1a1a2e;
          color: white;
        }
        
        .plv-streamer-avatar {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: linear-gradient(135deg, #f3425f 0%, #ff6b6b 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          font-weight: 700;
          color: white;
        }
        
        .plv-streamer-details {
          flex: 1;
        }
        
        .plv-streamer-name {
          font-size: 16px;
          font-weight: 700;
          margin-bottom: 4px;
        }
        
        .plv-streamer-category {
          font-size: 12px;
          color: #aaa;
        }
        
        .plv-live-title {
          font-size: 14px;
          color: #ddd;
          text-align: right;
        }
        
        /* Content Area */
        .plv-content {
          display: flex;
          flex-direction: column;
          background: #1a1a2e;
        }
        
        .plv-fullscreen .plv-content {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          max-height: 50%;
          overflow: hidden;
        }
        
        /* Action Bar */
        .plv-action-bar {
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding: 16px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .plv-reaction-buttons {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        
        .plv-reaction-btn {
          width: 44px;
          height: 44px;
          border: none;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 50%;
          font-size: 20px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .plv-reaction-btn:hover {
          background: rgba(255, 255, 255, 0.2);
          transform: scale(1.1);
        }
        
        .plv-reaction-btn.active {
          background: var(--reaction-color, #f3425f);
          animation: bounce 0.3s ease;
        }
        
        @keyframes bounce {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.2); }
        }
        
        .plv-action-buttons {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .plv-action-btn {
          padding: 10px 20px;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .plv-start-btn {
          background: #42b72a;
          color: white;
        }
        
        .plv-start-btn:hover {
          background: #36a420;
        }
        
        .plv-stop-btn {
          background: #f3425f;
          color: white;
        }
        
        .plv-stop-btn:hover {
          background: #e0334f;
        }
        
        .plv-share-buttons {
          display: flex;
          gap: 8px;
          margin-left: auto;
        }
        
        .plv-share-btn {
          width: 40px;
          height: 40px;
          border: none;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 50%;
          font-size: 18px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .plv-share-btn:hover {
          background: rgba(255, 255, 255, 0.2);
          transform: scale(1.1);
        }
        
        /* Chat */
        .plv-chat {
          display: flex;
          flex-direction: column;
          height: 300px;
          background: #16213e;
        }
        
        .plv-fullscreen .plv-chat {
          height: 200px;
        }
        
        .plv-chat-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          background: rgba(0, 0, 0, 0.3);
          color: white;
        }
        
        .plv-chat-title {
          font-size: 14px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .plv-chat-count {
          font-size: 12px;
          color: #aaa;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        
        .plv-pinned-comment {
          padding: 12px 16px;
          background: rgba(243, 66, 95, 0.2);
          border-left: 3px solid #f3425f;
        }
        
        .plv-pinned-badge {
          font-size: 10px;
          color: #f3425f;
          font-weight: 600;
          text-transform: uppercase;
        }
        
        .plv-pinned-content {
          margin-top: 4px;
          color: white;
          font-size: 13px;
        }
        
        .plv-chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 12px 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        
        .plv-chat-empty {
          text-align: center;
          color: #aaa;
          font-size: 14px;
          padding: 40px 20px;
        }
        
        .plv-chat-message {
          display: flex;
          gap: 10px;
        }
        
        .plv-message-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: linear-gradient(135deg, #f3425f 0%, #ff6b6b 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          overflow: hidden;
        }
        
        .plv-message-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .plv-message-avatar span {
          color: white;
          font-size: 14px;
          font-weight: 700;
        }
        
        .plv-message-content {
          flex: 1;
          min-width: 0;
        }
        
        .plv-message-user {
          font-size: 12px;
          font-weight: 600;
          color: #ddd;
          margin-bottom: 2px;
        }
        
        .plv-message-text {
          font-size: 14px;
          color: white;
          word-wrap: break-word;
        }
        
        .plv-message-time {
          font-size: 10px;
          color: #666;
          margin-top: 4px;
        }
        
        .plv-chat-input-wrapper {
          position: relative;
          padding: 12px 16px;
          background: rgba(0, 0, 0, 0.3);
        }
        
        .plv-emoji-picker {
          position: absolute;
          bottom: 100%;
          left: 16px;
          right: 16px;
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
          padding: 12px;
          background: #1a1a2e;
          border-radius: 10px;
          margin-bottom: 8px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        }
        
        .plv-emoji-btn {
          width: 36px;
          height: 36px;
          border: none;
          background: transparent;
          font-size: 20px;
          cursor: pointer;
          border-radius: 6px;
          transition: all 0.2s ease;
        }
        
        .plv-emoji-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          transform: scale(1.1);
        }
        
        .plv-chat-input-container {
          display: flex;
          gap: 8px;
        }
        
        .plv-emoji-toggle {
          width: 40px;
          height: 40px;
          border: none;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 50%;
          font-size: 18px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .plv-emoji-toggle:hover {
          background: rgba(255, 255, 255, 0.2);
        }
        
        .plv-chat-input {
          flex: 1;
          padding: 10px 16px;
          border: none;
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.1);
          color: white;
          font-size: 14px;
          outline: none;
        }
        
        .plv-chat-input::placeholder {
          color: #666;
        }
        
        .plv-send-btn {
          width: 40px;
          height: 40px;
          border: none;
          background: #f3425f;
          border-radius: 50%;
          color: white;
          font-size: 18px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .plv-send-btn:hover:not(:disabled) {
          background: #e0334f;
          transform: scale(1.05);
        }
        
        .plv-send-btn:disabled {
          background: #666;
          cursor: not-allowed;
        }
        
        /* Responsive */
        @media (max-width: 768px) {
          .plv-video-wrapper {
            aspect-ratio: 16 / 9;
          }
          
          .plv-streamer-info {
            padding: 12px;
          }
          
          .plv-streamer-avatar {
            width: 40px;
            height: 40px;
            font-size: 16px;
          }
          
          .plv-streamer-name {
            font-size: 14px;
          }
          
          .plv-action-bar {
            padding: 12px;
          }
          
          .plv-reaction-btn {
            width: 40px;
            height: 40px;
            font-size: 18px;
          }
          
          .plv-action-btn {
            padding: 8px 16px;
            font-size: 13px;
          }
          
          .plv-chat {
            height: 250px;
          }
          
          .plv-video-controls {
            padding: 8px 12px;
            gap: 8px;
          }
          
          .plv-control-btn {
            font-size: 18px;
            padding: 6px;
          }
          
          .plv-time {
            font-size: 11px;
          }
        }
        
        @media (max-width: 480px) {
          .plv-streamer-info {
            flex-wrap: wrap;
          }
          
          .plv-live-title {
            width: 100%;
            text-align: left;
            margin-top: 8px;
          }
          
          .plv-action-buttons {
            flex-wrap: wrap;
          }
          
          .plv-share-buttons {
            margin-left: 0;
            width: 100%;
            justify-content: flex-start;
          }
          
          .plv-chat {
            height: 200px;
          }
        }
      `}</style>
    </div>
  );
};

// ============================================
// FONCTIONS UTILITAIRES
// ============================================

function formatTime(seconds) {
  if (isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default ProfessionalLiveVideo;

