/**
 * useCamera.js - Hook pour gérer l'accès à la caméra et au microphone
 * Utilise navigator.mediaDevices.getUserMedia() pour capturer le flux média
 */

import { useState, useEffect, useCallback, useRef } from 'react';

const useCamera = () => {
  const [stream, setStream] = useState(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState(null);
  const [devices, setDevices] = useState({ video: [], audio: [] });
  const [selectedDevices, setSelectedDevices] = useState({
    video: null,
    audio: null,
  });
  const [isPermissionGranted, setIsPermissionGranted] = useState(false);
  const streamRef = useRef(null);

  // Obtenir les périphériques disponibles
  const getDevices = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      const audioDevices = devices.filter(device => device.kind === 'audioinput');
      
      setDevices({
        video: videoDevices,
        audio: audioDevices,
      });

      // Sélectionner le premier périphérique par défaut
      if (videoDevices.length > 0 && !selectedDevices.video) {
        setSelectedDevices(prev => ({
          ...prev,
          video: videoDevices[0].deviceId,
        }));
      }
      
      if (audioDevices.length > 0 && !selectedDevices.audio) {
        setSelectedDevices(prev => ({
          ...prev,
          audio: audioDevices[0].deviceId,
        }));
      }

      return { video: videoDevices, audio: audioDevices };
    } catch (err) {
      console.error('[useCamera] Erreur lors de la récupération des périphériques:', err);
      setError('Impossible de récupérer les périphériques');
      return { video: [], audio: [] };
    }
  }, [selectedDevices]);

  // Vérifier les permissions
  const checkPermissions = useCallback(async () => {
    try {
      const cameraPermission = await navigator.permissions.query({ name: 'camera' });
      const microphonePermission = await navigator.permissions.query({ name: 'microphone' });

      const hasCameraPermission = cameraPermission.state === 'granted';
      const hasMicrophonePermission = microphonePermission.state === 'granted';

      setIsPermissionGranted(hasCameraPermission || hasMicrophonePermission);

      return {
        camera: cameraPermission.state,
        microphone: microphonePermission.state,
      };
    } catch (err) {
      console.error('[useCamera] Erreur lors de la vérification des permissions:', err);
      return { camera: 'prompt', microphone: 'prompt' };
    }
  }, []);

  // Démarrer le flux vidéo/audio
  const startStream = useCallback(async (constraints = {}) => {
    try {
      setError(null);
      
      // Arrêter le flux existant s'il y en a un
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      // Construire les contraintes
      const mediaConstraints = {
        video: constraints.video !== false ? {
          deviceId: selectedDevices.video ? { exact: selectedDevices.video } : undefined,
          width: { ideal: constraints.width || 1280 },
          height: { ideal: constraints.height || 720 },
          frameRate: { ideal: constraints.frameRate || 30 },
        } : false,
        audio: constraints.audio !== false ? {
          deviceId: selectedDevices.audio ? { exact: selectedDevices.audio } : undefined,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        } : false,
      };

      console.log('[useCamera] Démarrage du flux avec contraintes:', mediaConstraints);

      const mediaStream = await navigator.mediaDevices.getUserMedia(mediaConstraints);
      
      streamRef.current = mediaStream;
      setStream(mediaStream);
      setIsStreaming(true);
      setIsPermissionGranted(true);

      console.log('[useCamera] Flux démarré avec succès:', {
        videoTracks: mediaStream.getVideoTracks().length,
        audioTracks: mediaStream.getAudioTracks().length,
      });

      return mediaStream;
    } catch (err) {
      console.error('[useCamera] Erreur lors du démarrage du flux:', err);
      
      let errorMessage = 'Impossible d\'accéder à la caméra/microphone';
      
      if (err.name === 'NotAllowedError') {
        errorMessage = 'Permission refusée. Veuillez autoriser l\'accès à la caméra et au microphone.';
      } else if (err.name === 'NotFoundError') {
        errorMessage = 'Aucune caméra ou microphone trouvé.';
      } else if (err.name === 'NotReadableError') {
        errorMessage = 'La caméra ou le microphone est déjà utilisé par une autre application.';
      } else if (err.name === 'OverconstrainedError') {
        errorMessage = 'Les contraintes demandées ne peuvent pas être satisfaites.';
      }
      
      setError(errorMessage);
      setIsStreaming(false);
      return null;
    }
  }, [selectedDevices]);

  // Arrêter le flux vidéo/audio
  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log('[useCamera] Track arrêté:', track.kind);
      });
      streamRef.current = null;
      setStream(null);
      setIsStreaming(false);
      console.log('[useCamera] Flux arrêté');
    }
  }, []);

  // Basculer la vidéo
  const toggleVideo = useCallback(() => {
    if (streamRef.current) {
      const videoTracks = streamRef.current.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      console.log('[useCamera] Vidéo:', videoTracks[0]?.enabled ? 'activée' : 'désactivée');
    }
  }, []);

  // Basculer l'audio
  const toggleAudio = useCallback(() => {
    if (streamRef.current) {
      const audioTracks = streamRef.current.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      console.log('[useCamera] Audio:', audioTracks[0]?.enabled ? 'activé' : 'désactivé');
    }
  }, []);

  // Changer de périphérique vidéo
  const changeVideoDevice = useCallback(async (deviceId) => {
    setSelectedDevices(prev => ({ ...prev, video: deviceId }));
    
    if (isStreaming && streamRef.current) {
      // Redémarrer le flux avec le nouveau périphérique
      await startStream();
    }
  }, [isStreaming, startStream]);

  // Changer de périphérique audio
  const changeAudioDevice = useCallback(async (deviceId) => {
    setSelectedDevices(prev => ({ ...prev, audio: deviceId }));
    
    if (isStreaming && streamRef.current) {
      // Redémarrer le flux avec le nouveau périphérique
      await startStream();
    }
  }, [isStreaming, startStream]);

  // Obtenir les états des tracks
  const getTrackStates = useCallback(() => {
    if (!streamRef.current) {
      return { video: false, audio: false };
    }

    const videoTracks = streamRef.current.getVideoTracks();
    const audioTracks = streamRef.current.getAudioTracks();

    return {
      video: videoTracks.length > 0 && videoTracks[0].enabled,
      audio: audioTracks.length > 0 && audioTracks[0].enabled,
    };
  }, []);

  // Initialisation
  useEffect(() => {
    getDevices();
    checkPermissions();

    // Écouter les changements de périphériques
    const handleDeviceChange = () => {
      console.log('[useCamera] Périphériques modifiés');
      getDevices();
    };

    navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);

    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
      
      // Arrêter le flux lors du démontage
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [getDevices, checkPermissions]);

  return {
    // État
    stream,
    isStreaming,
    error,
    devices,
    selectedDevices,
    isPermissionGranted,
    
    // Actions
    startStream,
    stopStream,
    toggleVideo,
    toggleAudio,
    changeVideoDevice,
    changeAudioDevice,
    getDevices,
    checkPermissions,
    getTrackStates,
  };
};

export default useCamera;
