/**
 * LiveContext.js - Contexte pour la gestion du state du live
 * Gère la connexion WebSocket et les données du live
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import io from 'socket.io-client';

// Créer le contexte
const LiveContext = createContext(null);

// ============================================
// PROVIDER
// ============================================

export const LiveProvider = ({ 
  children, 
  socketUrl = 'http://localhost:5000',
  liveId,
  userInfo 
}) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [liveData, setLiveData] = useState(null);
  const [viewers, setViewers] = useState([]);
  const [error, setError] = useState(null);

  // Initialiser la connexion Socket.IO
  useEffect(() => {
    const newSocket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    newSocket.on('connect', () => {
      console.log('[Live] Connecté au serveur WebSocket');
      setIsConnected(true);
      setError(null);
    });

    newSocket.on('disconnect', () => {
      console.log('[Live] Déconnecté du serveur WebSocket');
      setIsConnected(false);
    });

    newSocket.on('connect_error', (err) => {
      console.error('[Live] Erreur de connexion:', err);
      setError('Impossible de se connecter au serveur');
    });

    newSocket.on('live_data', (data) => {
      console.log('[Live] Données reçues:', data);
      setLiveData(data);
    });

    newSocket.on('viewer_joined', (viewer) => {
      console.log('[Live] Spectateur rejoint:', viewer);
      setViewers(prev => [...prev, viewer]);
    });

    newSocket.on('viewer_left', (viewerId) => {
      console.log('[Live] Spectateur parti:', viewerId);
      setViewers(prev => prev.filter(v => v.id !== viewerId));
    });

    newSocket.on('live_started', (data) => {
      console.log('[Live] Live démarré:', data);
      setLiveData(prev => ({ ...prev, status: 'live' }));
    });

    newSocket.on('live_stopped', (data) => {
      console.log('[Live] Live arrêté:', data);
      setLiveData(prev => ({ ...prev, status: 'ended' }));
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [socketUrl]);

  // Rejoindre un live
  const joinLive = useCallback((id, user) => {
    if (socket && isConnected) {
      console.log('[Live] Rejoindre le live:', id);
      socket.emit('join_live', { liveId: id, userInfo: user });
    }
  }, [socket, isConnected]);

  // Quitter un live
  const leaveLive = useCallback((id) => {
    if (socket && isConnected) {
      console.log('[Live] Quitter le live:', id);
      socket.emit('leave_live', { liveId: id });
    }
  }, [socket, isConnected]);

  // Mettre à jour les données du live
  const updateLiveData = useCallback((data) => {
    setLiveData(prev => ({ ...prev, ...data }));
  }, []);

  // Valeur du contexte
  const value = {
    socket,
    isConnected,
    liveData,
    viewers,
    error,
    joinLive,
    leaveLive,
    updateLiveData,
  };

  return (
    <LiveContext.Provider value={value}>
      {children}
    </LiveContext.Provider>
  );
};

// ============================================
// HOOK PERSONNALISÉ
// ============================================

export const useLive = () => {
  const context = useContext(LiveContext);
  if (!context) {
    throw new Error('useLive doit être utilisé à l\'intérieur d\'un LiveProvider');
  }
  return context;
};

export default LiveContext;
