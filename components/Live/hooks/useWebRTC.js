/**
 * useWebRTC.js - Hook pour gérer les connexions WebRTC avec mediasoup
 * Gère la production et consommation de flux média en temps réel
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import * as mediasoupClient from 'mediasoup-client';

const useWebRTC = (socket, liveId, isStreamer = false) => {
  const [device, setDevice] = useState(null);
  const [sendTransport, setSendTransport] = useState(null);
  const [recvTransport, setRecvTransport] = useState(null);
  const [producers, setProducers] = useState([]);
  const [consumers, setConsumers] = useState([]);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState(null);

  const deviceRef = useRef(null);
  const sendTransportRef = useRef(null);
  const recvTransportRef = useRef(null);
  const producersRef = useRef([]);
  const consumersRef = useRef([]);

  // Initialiser le device mediasoup
  const initDevice = useCallback(async () => {
    try {
      console.log('[useWebRTC] Initialisation du device mediasoup');
      
      const newDevice = new mediasoupClient.Device();
      deviceRef.current = newDevice;
      setDevice(newDevice);

      return newDevice;
    } catch (err) {
      console.error('[useWebRTC] Erreur lors de l\'initialisation du device:', err);
      setError('Impossible d\'initialiser le device mediasoup');
      return null;
    }
  }, []);

  // Charger les capacités du router
  const loadRouterRtpCapabilities = useCallback(async () => {
    try {
      if (!deviceRef.current || !socket) return null;

      console.log('[useWebRTC] Chargement des capacités du router');

      // Demander les capacités du router au serveur
      const response = await new Promise((resolve, reject) => {
        socket.emit('getRouterRtpCapabilities', { liveId }, (response) => {
          if (response.error) {
            reject(new Error(response.error));
          } else {
            resolve(response);
          }
        });
      });

      await deviceRef.current.load({ routerRtpCapabilities: response.rtpCapabilities });
      
      console.log('[useWebRTC] Capacités du router chargées');
      return response.rtpCapabilities;
    } catch (err) {
      console.error('[useWebRTC] Erreur lors du chargement des capacités:', err);
      setError('Impossible de charger les capacités du router');
      return null;
    }
  }, [socket, liveId]);

  // Créer un transport pour envoyer (streamer)
  const createSendTransport = useCallback(async () => {
    try {
      if (!deviceRef.current || !socket) return null;

      console.log('[useWebRTC] Création du transport d\'envoi');

      // Demander la création d'un transport au serveur
      const transportInfo = await new Promise((resolve, reject) => {
        socket.emit('createTransport', { liveId, direction: 'send' }, (response) => {
          if (response.error) {
            reject(new Error(response.error));
          } else {
            resolve(response);
          }
        });
      });

      const transport = deviceRef.current.createSendTransport(transportInfo);

      // Gérer l'événement 'connect'
      transport.on('connect', ({ dtlsParameters }, callback, errback) => {
        console.log('[useWebRTC] Transport d\'envoi - connexion');
        socket.emit('connectTransport', {
          liveId,
          transportId: transport.id,
          dtlsParameters,
        }, (response) => {
          if (response.error) {
            errback(new Error(response.error));
          } else {
            callback();
          }
        });
      });

      // Gérer l'événement 'produce'
      transport.on('produce', ({ kind, rtpParameters, appData }, callback, errback) => {
        console.log('[useWebRTC] Transport d\'envoi - production:', kind);
        socket.emit('produce', {
          liveId,
          transportId: transport.id,
          kind,
          rtpParameters,
          appData,
        }, (response) => {
          if (response.error) {
            errback(new Error(response.error));
          } else {
            callback({ id: response.id });
          }
        });
      });

      // Gérer l'événement 'connectionstatechange'
      transport.on('connectionstatechange', (state) => {
        console.log('[useWebRTC] Transport d\'envoi - état de connexion:', state);
        if (state === 'failed' || state === 'closed') {
          setError('La connexion du transport d\'envoi a échoué');
        }
      });

      sendTransportRef.current = transport;
      setSendTransport(transport);

      console.log('[useWebRTC] Transport d\'envoi créé');
      return transport;
    } catch (err) {
      console.error('[useWebRTC] Erreur lors de la création du transport d\'envoi:', err);
      setError('Impossible de créer le transport d\'envoi');
      return null;
    }
  }, [socket, liveId]);

  // Créer un transport pour recevoir (viewer)
  const createRecvTransport = useCallback(async () => {
    try {
      if (!deviceRef.current || !socket) return null;

      console.log('[useWebRTC] Création du transport de réception');

      // Demander la création d'un transport au serveur
      const transportInfo = await new Promise((resolve, reject) => {
        socket.emit('createTransport', { liveId, direction: 'recv' }, (response) => {
          if (response.error) {
            reject(new Error(response.error));
          } else {
            resolve(response);
          }
        });
      });

      const transport = deviceRef.current.createRecvTransport(transportInfo);

      // Gérer l'événement 'connect'
      transport.on('connect', ({ dtlsParameters }, callback, errback) => {
        console.log('[useWebRTC] Transport de réception - connexion');
        socket.emit('connectTransport', {
          liveId,
          transportId: transport.id,
          dtlsParameters,
        }, (response) => {
          if (response.error) {
            errback(new Error(response.error));
          } else {
            callback();
          }
        });
      });

      // Gérer l'événement 'connectionstatechange'
      transport.on('connectionstatechange', (state) => {
        console.log('[useWebRTC] Transport de réception - état de connexion:', state);
        if (state === 'failed' || state === 'closed') {
          setError('La connexion du transport de réception a échoué');
        }
      });

      recvTransportRef.current = transport;
      setRecvTransport(transport);

      console.log('[useWebRTC] Transport de réception créé');
      return transport;
    } catch (err) {
      console.error('[useWebRTC] Erreur lors de la création du transport de réception:', err);
      setError('Impossible de créer le transport de réception');
      return null;
    }
  }, [socket, liveId]);

  // Produire un flux média (streamer)
  const produce = useCallback(async (track, appData = {}) => {
    try {
      if (!sendTransportRef.current) {
        throw new Error('Le transport d\'envoi n\'est pas initialisé');
      }

      console.log('[useWebRTC] Production du flux média:', track.kind);

      const producer = await sendTransportRef.current.produce({
        track,
        appData,
      });

      // Gérer l'événement 'trackended'
      producer.on('trackended', () => {
        console.log('[useWebRTC] Track du producer terminé:', producer.id);
      });

      producersRef.current.push(producer);
      setProducers([...producersRef.current]);

      console.log('[useWebRTC] Flux média produit:', producer.id);
      return producer;
    } catch (err) {
      console.error('[useWebRTC] Erreur lors de la production du flux:', err);
      setError('Impossible de produire le flux média');
      return null;
    }
  }, []);

  // Consommer un flux média (viewer)
  const consume = useCallback(async (producerId, rtpCapabilities) => {
    try {
      if (!recvTransportRef.current || !deviceRef.current) {
        throw new Error('Le transport de réception n\'est pas initialisé');
      }

      console.log('[useWebRTC] Consommation du flux média:', producerId);

      // Vérifier si le device peut consommer le producer
      if (!deviceRef.current.canConsume({ producerId, rtpCapabilities })) {
        throw new Error('Le device ne peut pas consommer ce producer');
      }

      // Demander la consommation au serveur
      const consumerInfo = await new Promise((resolve, reject) => {
        socket.emit('consume', {
          liveId,
          transportId: recvTransportRef.current.id,
          producerId,
          rtpCapabilities,
        }, (response) => {
          if (response.error) {
            reject(new Error(response.error));
          } else {
            resolve(response);
          }
        });
      });

      const consumer = await recvTransportRef.current.consume({
        id: consumerInfo.id,
        producerId: consumerInfo.producerId,
        kind: consumerInfo.kind,
        rtpParameters: consumerInfo.rtpParameters,
      });

      // Gérer l'événement 'trackended'
      consumer.on('trackended', () => {
        console.log('[useWebRTC] Track du consumer terminé:', consumer.id);
      });

      consumersRef.current.push(consumer);
      setConsumers([...consumersRef.current]);

      console.log('[useWebRTC] Flux média consommé:', consumer.id);
      return consumer;
    } catch (err) {
      console.error('[useWebRTC] Erreur lors de la consommation du flux:', err);
      setError('Impossible de consommer le flux média');
      return null;
    }
  }, [socket, liveId]);

  // Fermer un producer
  const closeProducer = useCallback(async (producerId) => {
    try {
      const producer = producersRef.current.find(p => p.id === producerId);
      if (producer) {
        producer.close();
        producersRef.current = producersRef.current.filter(p => p.id !== producerId);
        setProducers([...producersRef.current]);

        // Notifier le serveur
        socket.emit('closeProducer', { liveId, producerId });

        console.log('[useWebRTC] Producer fermé:', producerId);
      }
    } catch (err) {
      console.error('[useWebRTC] Erreur lors de la fermeture du producer:', err);
    }
  }, [socket, liveId]);

  // Fermer un consumer
  const closeConsumer = useCallback(async (consumerId) => {
    try {
      const consumer = consumersRef.current.find(c => c.id === consumerId);
      if (consumer) {
        consumer.close();
        consumersRef.current = consumersRef.current.filter(c => c.id !== consumerId);
        setConsumers([...consumersRef.current]);

        // Notifier le serveur
        socket.emit('closeConsumer', { liveId, consumerId });

        console.log('[useWebRTC] Consumer fermé:', consumerId);
      }
    } catch (err) {
      console.error('[useWebRTC] Erreur lors de la fermeture du consumer:', err);
    }
  }, [socket, liveId]);

  // Obtenir les producers existants
  const getExistingProducers = useCallback(async () => {
    try {
      if (!socket) return [];

      console.log('[useWebRTC] Récupération des producers existants');

      const response = await new Promise((resolve, reject) => {
        socket.emit('getProducers', { liveId }, (response) => {
          if (response.error) {
            reject(new Error(response.error));
          } else {
            resolve(response.producers);
          }
        });
      });

      console.log('[useWebRTC] Producers existants:', response.length);
      return response;
    } catch (err) {
      console.error('[useWebRTC] Erreur lors de la récupération des producers:', err);
      return [];
    }
  }, [socket, liveId]);

  // Initialisation
  useEffect(() => {
    if (!socket || !liveId) return;

    const init = async () => {
      // Initialiser le device
      const newDevice = await initDevice();
      if (!newDevice) return;

      // Charger les capacités du router
      await loadRouterRtpCapabilities();

      // Créer les transports selon le rôle
      if (isStreamer) {
        await createSendTransport();
      } else {
        await createRecvTransport();
      }

      setIsReady(true);
      console.log('[useWebRTC] Initialisation terminée');
    };

    init();

    // Écouter les nouveaux producers (pour les viewers)
    const handleNewProducer = ({ producerId, kind }) => {
      console.log('[useWebRTC] Nouveau producer disponible:', producerId, kind);
      // Le viewer peut maintenant consommer ce producer
    };

    socket.on('newProducer', handleNewProducer);

    return () => {
      socket.off('newProducer', handleNewProducer);

      // Fermer tous les producers
      producersRef.current.forEach(producer => producer.close());
      producersRef.current = [];

      // Fermer tous les consumers
      consumersRef.current.forEach(consumer => consumer.close());
      consumersRef.current = [];

      // Fermer les transports
      if (sendTransportRef.current) {
        sendTransportRef.current.close();
        sendTransportRef.current = null;
      }

      if (recvTransportRef.current) {
        recvTransportRef.current.close();
        recvTransportRef.current = null;
      }

      setIsReady(false);
    };
  }, [socket, liveId, isStreamer, initDevice, loadRouterRtpCapabilities, createSendTransport, createRecvTransport]);

  return {
    // État
    device,
    sendTransport,
    recvTransport,
    producers,
    consumers,
    isReady,
    error,

    // Actions
    produce,
    consume,
    closeProducer,
    closeConsumer,
    getExistingProducers,
  };
};

export default useWebRTC;
