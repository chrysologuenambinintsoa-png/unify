/**
 * LiveWithCamera.js - Composant principal de streaming live avec caméra
 * Supporte la capture de caméra et le streaming WebRTC via mediasoup
 * 
 * @author SuperNinja AI
 * @version 3.0.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { LiveProvider, useLive } from './context/LiveContext';
import { useReactions } from './hooks/useReactions';
import { useComments } from './hooks/useComments';
import useCamera from './hooks/useCamera';
import useWebRTC from './hooks/useWebRTC';
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
  isStreamer = false,
  autoStartCamera = true,
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
  
  // Hooks pour la caméra et WebRTC
  const {
    stream: cameraStream,
    isStreaming: isCameraStreaming,
    error: cameraError,
    devices,
    selectedDevices,
    isPermissionGranted,
    startStream: startCamera,
    stopStream: stopCamera,
    toggleVideo,
    toggleAudio,
    changeVideoDevice,
    changeAudioDevice,
    getTrackStates,
  } = useCamera();

  const {
    device: webrtcDevice,
    sendTransport,
    recvTransport,
    producers,
    consumers,
    isReady: isWebRTCReady,
    error: webrtcError,
    produce,
    consume,
    closeProducer,
    closeConsumer,
    getExistingProducers,
  } = useWebRTC(socket, liveId, isStreamer);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isLiveActive, setIsLiveActive] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showCameraSettings, setShowCameraSettings] = useState(false);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState([]);
  
  const containerRef = useRef(null);
  const controlsTimeoutRef = useRef(null);
  const videoRef = useRef(null);

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

  // Démarrer la caméra et le streaming
  const handleStartLive = useCallback(async () => {
    try {
      console.log('[Live] Démarrage du live...');
      
      // Démarrer la caméra
      const stream = await startCamera({
        video: true,
        audio: true,
        width: 1280,
        height: 720,
        frameRate: 30,
      });

      if (!stream) {
        throw new Error('Impossible de démarrer la caméra');
      }

      setLocalStream(stream);

      // Si c'est le streamer, produire les flux média
      if (isStreamer && isWebRTCReady) {
        // Produire le flux vidéo
        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack) {
          await produce(videoTrack, { source: 'camera' });
          console.log('[Live] Flux vidéo produit');
        }

        // Produire le flux audio
        const audioTrack = stream.getAudioTracks()[0];
        if (audioTrack) {
          await produce(audioTrack, { source: 'microphone' });
          console.log('[Live] Flux audio produit');
        }
      }

      // Mettre à jour l'état
      setIsLiveActive(true);
      socket?.emit('start_live', { liveId, userInfo });

      console.log('[Live] Live démarré avec succès');
    } catch (err) {
      console.error('[Live] Erreur lors du démarrage du live:', err);
      onError?.(err.message);
    }
  }, [startCamera, isStreamer, isWebRTCReady, produce, socket, liveId, userInfo, onError]);

  // Arrêter la caméra et le streaming
  const handleStopLive = useCallback(async () => {
    try {
      console.log('[Live] Arrêt du live...');
      
      // Arrêter la caméra
      stopCamera();
      
      // Fermer les producers
      if (isStreamer) {
        for (const producer of producers) {
          await closeProducer(producer.id);
        }
      }

      // Mettre à jour l'état
      setIsLiveActive(false);
      setLocalStream(null);
      socket?.emit('stop_live', { liveId, userInfo });

      console.log('[Live] Live arrêté avec succès');
    } catch (err) {
      console.error('[Live] Erreur lors de l\'arrêt du live:', err);
      onError?.(err.message);
    }
  }, [stopCamera, isStreamer, producers, closeProducer, socket, liveId, userInfo, onError]);

  // Démarrer automatiquement la caméra pour le streamer
  const hasAutoStarted = useRef(false);
  useEffect(() => {
    if (autoStartCamera && isStreamer && isConnected && !isLiveActive && !hasAutoStarted.current) {
      hasAutoStarted.current = true;
      handleStartLive();
    }
  }, [autoStartCamera, isStreamer, isConnected, isLiveActive]);

  // Consommer les flux des autres streamers (pour les viewers)
  useEffect(() => {
    if (!isStreamer && isWebRTCReady && consumers.length === 0) {
      const loadConsumers = async () => {
        try {
          const existingProducers = await getExistingProducers();
          
          for (const producerInfo of existingProducers) {
            const consumer = await consume(producerInfo.id, webrtcDevice.rtpCapabilities);
            
            if (consumer) {
              // Créer un MediaStream pour ce consumer
              const remoteStream = new MediaStream([consumer.track]);
              setRemoteStreams(prev => [...prev, { id: consumer.id, stream: remoteStream }]);
            }
          }
        } catch (err) {
          console.error('[Live] Erreur lors du chargement des consumers:', err);
        }
      };

      loadConsumers();
    }
  }, [isStreamer, isWebRTCReady, consumers, getExistingProducers, consume, webrtcDevice]);

  // Écouter les nouveaux producers (pour les viewers)
  useEffect(() => {
    if (!socket || isStreamer) return;

    const handleNewProducer = async ({ producerId, kind }) => {
      console.log('[Live] Nouveau producer disponible:', producerId, kind);
      
      if (isWebRTCReady && webrtcDevice) {
        const consumer = await consume(producerId, webrtcDevice.rtpCapabilities);
        
        if (consumer) {
          const remoteStream = new MediaStream([consumer.track]);
          setRemoteStreams(prev => [...prev, { id: consumer.id, stream: remoteStream }]);
        }
      }
    };

    socket.on('newProducer', handleNewProducer);

    return () => {
      socket.off('newProducer', handleNewProducer);
    };
  }, [socket, isStreamer, isWebRTCReady, webrtcDevice, consume]);

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

  // Afficher le flux local dans le lecteur vidéo
  useEffect(() => {
    if (videoRef.current && localStream) {
      videoRef.current.srcObject = localStream;
    }
  }, [localStream]);

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

  // Afficher les erreurs
  const error = cameraError || webrtcError;
  if (error) {
    return (
      <div className="live-error">
        <div className="live-error-icon">⚠️</div>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>
          Réessayer
        </button>
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
        {isStreamer && localStream ? (
          // Afficher le flux local pour le streamer
          <video
            ref={videoRef}
            className="video-player-element"
            autoPlay
            playsInline
            muted={true} // Muted pour éviter l'écho
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : !isStreamer && remoteStreams.length > 0 ? (
          // Afficher le flux distant pour les viewers
          <video
            className="video-player-element"
            autoPlay
            playsInline
            muted={muted}
            srcObject={remoteStreams[0].stream}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          // Afficher le lecteur vidéo par défaut
          <VideoPlayer
            src={liveData.streamUrl}
            poster={liveData.thumbnail}
            autoPlay={autoPlay}
            muted={muted}
            isLive={liveData.status === 'live'}
          />
        )}
        
        {/* Reactions Overlay */}
        {showReactions && (
          <ReactionsOverlay 
            reactions={reactions}
            onReaction={handleReaction}
          />
        )}
        
        {/* Live Badge */}
        {isLiveActive && (
          <div className="live-badge">
            <span className="live-dot"></span>
            EN DIRECT
          </div>
        )}
        
        {/* Viewer Counter */}
        {showViewerCount && (
          <ViewerCounter count={liveData.viewerCount} />
        )}

        {/* Camera Settings Button */}
        {isStreamer && showControls && (
          <button
            className="camera-settings-btn"
            onClick={() => setShowCameraSettings(!showCameraSettings)}
            style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              background: 'rgba(0, 0, 0, 0.5)',
              border: 'none',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10,
            }}
          >
            ⚙️
          </button>
        )}

        {/* Camera Settings Panel */}
        {isStreamer && showCameraSettings && (
          <div
            className="camera-settings-panel"
            style={{
              position: 'absolute',
              top: '60px',
              right: '10px',
              background: 'rgba(0, 0, 0, 0.8)',
              borderRadius: '8px',
              padding: '15px',
              zIndex: 10,
              minWidth: '200px',
            }}
          >
            <h4 style={{ margin: '0 0 10px 0', color: '#fff' }}>Paramètres Caméra</h4>
            
            {/* Sélecteur de caméra */}
            <div style={{ marginBottom: '10px' }}>
              <label style={{ color: '#fff', fontSize: '12px' }}>Caméra:</label>
              <select
                value={selectedDevices.video || ''}
                onChange={(e) => changeVideoDevice(e.target.value)}
                style={{
                  width: '100%',
                  padding: '5px',
                  borderRadius: '4px',
                  border: 'none',
                  marginTop: '5px',
                }}
              >
                {devices.video.map((device) => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.label || `Caméra ${device.deviceId.slice(0, 5)}`}
                  </option>
                ))}
              </select>
            </div>

            {/* Sélecteur de microphone */}
            <div style={{ marginBottom: '10px' }}>
              <label style={{ color: '#fff', fontSize: '12px' }}>Microphone:</label>
              <select
                value={selectedDevices.audio || ''}
                onChange={(e) => changeAudioDevice(e.target.value)}
                style={{
                  width: '100%',
                  padding: '5px',
                  borderRadius: '4px',
                  border: 'none',
                  marginTop: '5px',
                }}
              >
                {devices.audio.map((device) => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.label || `Microphone ${device.deviceId.slice(0, 5)}`}
                  </option>
                ))}
              </select>
            </div>

            {/* Boutons de contrôle */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={toggleVideo}
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: '4px',
                  border: 'none',
                  background: getTrackStates().video ? '#42b72a' : '#f02849',
                  color: '#fff',
                  cursor: 'pointer',
                }}
              >
                {getTrackStates().video ? '📹' : '🚫'}
              </button>
              <button
                onClick={toggleAudio}
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: '4px',
                  border: 'none',
                  background: getTrackStates().audio ? '#42b72a' : '#f02849',
                  color: '#fff',
                  cursor: 'pointer',
                }}
              >
                {getTrackStates().audio ? '🎤' : '🔇'}
              </button>
            </div>
          </div>
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
            enableLiveControls={isStreamer}
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

const LiveWithCamera = ({
  liveId,
  userInfo,
  socketUrl = 'http://localhost:5000',
  isStreamer = false,
  ...props
}) => {
  return (
    <LiveProvider socketUrl={socketUrl} liveId={liveId} userInfo={userInfo}>
      <LiveInner
        liveId={liveId}
        userInfo={userInfo}
        isStreamer={isStreamer}
        {...props}
      />
    </LiveProvider>
  );
};

export default LiveWithCamera;

// Export des sous-composants pour utilisation individuelle
export { default as VideoPlayer } from './components/VideoPlayer';
export { default as LiveChat } from './components/LiveChat';
export { default as ReactionsOverlay } from './components/ReactionsOverlay';
export { default as ActionBar } from './components/ActionBar';
export { default as ViewerCounter } from './components/ViewerCounter';
export { default as StreamerInfo } from './components/StreamerInfo';
export { default as useCamera } from './hooks/useCamera';
export { default as useWebRTC } from './hooks/useWebRTC';
