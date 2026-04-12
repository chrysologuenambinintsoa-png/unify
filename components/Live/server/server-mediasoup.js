/**
 * server-mediasoup.js - Serveur backend avec support mediasoup pour le streaming WebRTC
 * Gère les connexions WebSocket, les événements en temps réel et le streaming média
 */

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const mediasoup = require('mediasoup');

const app = express();
const server = http.createServer(app);

// Configuration CORS
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  methods: ['GET', 'POST'],
  credentials: true,
}));

// Configuration Socket.IO
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
});

// Configuration mediasoup
const mediaCodecs = [
  {
    kind: 'audio',
    mimeType: 'audio/opus',
    clockRate: 48000,
    channels: 2,
  },
  {
    kind: 'video',
    mimeType: 'video/VP8',
    clockRate: 90000,
    parameters: {
      'x-google-start-bitrate': 1000,
    },
  },
  {
    kind: 'video',
    mimeType: 'video/VP9',
    clockRate: 90000,
    parameters: {
      'profile-id': 2,
      'x-google-start-bitrate': 1000,
    },
  },
  {
    kind: 'video',
    mimeType: 'video/h264',
    clockRate: 90000,
    parameters: {
      'packetization-mode': 1,
      'profile-level-id': '4d0032',
      'level-asymmetry-allowed': 1,
      'x-google-start-bitrate': 1000,
    },
  },
];

// Stockage des données en mémoire
const liveRooms = new Map();
const viewers = new Map();
const comments = new Map();
const reactions = new Map();

// Stockage mediasoup
const workers = [];
const routers = new Map();
const transports = new Map();
const producers = new Map();
const consumers = new Map();

// ============================================
// MEDIASOUP WORKERS
// ============================================

// Créer les workers mediasoup
async function createWorkers() {
  const numWorkers = require('os').cpus().length;
  
  console.log(`[mediasoup] Création de ${numWorkers} workers`);

  for (let i = 0; i < numWorkers; i++) {
    const worker = await mediasoup.createWorker({
      rtcMinPort: 10000 + (i * 1000),
      rtcMaxPort: 10000 + (i * 1000) + 999,
    });

    worker.on('died', () => {
      console.error('[mediasoup] Worker mort:', worker.pid);
      // Redémarrer le worker
      setTimeout(() => createWorkers(), 2000);
    });

    workers.push(worker);
    console.log('[mediasoup] Worker créé:', worker.pid);
  }
}

// Obtenir un worker disponible
function getWorker() {
  return workers[Math.floor(Math.random() * workers.length)];
}

// Créer un router pour un live
async function createRouter(liveId) {
  try {
    const worker = getWorker();
    const router = await worker.createRouter({ mediaCodecs });
    
    routers.set(liveId, router);
    console.log('[mediasoup] Router créé pour le live:', liveId);
    
    return router;
  } catch (err) {
    console.error('[mediasoup] Erreur lors de la création du router:', err);
    throw err;
  }
}

// Obtenir ou créer un router pour un live
async function getOrCreateRouter(liveId) {
  if (routers.has(liveId)) {
    return routers.get(liveId);
  }
  
  return await createRouter(liveId);
}

// ============================================
// SOCKET.IO EVENTS
// ============================================

io.on('connection', (socket) => {
  console.log(`[Socket] Nouvelle connexion: ${socket.id}`);

  // Obtenir les capacités du router
  socket.on('getRouterRtpCapabilities', async ({ liveId }, callback) => {
    try {
      const router = await getOrCreateRouter(liveId);
      callback({ rtpCapabilities: router.rtpCapabilities });
    } catch (err) {
      console.error('[Socket] Erreur lors de la récupération des capacités:', err);
      callback({ error: err.message });
    }
  });

  // Créer un transport
  socket.on('createTransport', async ({ liveId, direction }, callback) => {
    try {
      const router = await getOrCreateRouter(liveId);
      
      const transport = await router.createWebRtcTransport({
        listenIps: [
          {
            ip: '0.0.0.0',
            announcedIp: process.env.ANNOUNCED_IP || '127.0.0.1',
          },
        ],
        enableUdp: true,
        enableTcp: true,
        preferUdp: true,
      });

      // Stocker le transport
      if (!transports.has(liveId)) {
        transports.set(liveId, new Map());
      }
      transports.get(liveId).set(transport.id, {
        transport,
        socketId: socket.id,
        direction,
      });

      console.log('[mediasoup] Transport créé:', transport.id, 'pour le live:', liveId);

      callback({
        id: transport.id,
        iceParameters: transport.iceParameters,
        iceCandidates: transport.iceCandidates,
        dtlsParameters: transport.dtlsParameters,
      });
    } catch (err) {
      console.error('[Socket] Erreur lors de la création du transport:', err);
      callback({ error: err.message });
    }
  });

  // Connecter un transport
  socket.on('connectTransport', async ({ liveId, transportId, dtlsParameters }, callback) => {
    try {
      const transportData = transports.get(liveId)?.get(transportId);
      
      if (!transportData) {
        throw new Error('Transport non trouvé');
      }

      await transportData.transport.connect({ dtlsParameters });
      
      console.log('[mediasoup] Transport connecté:', transportId);
      callback({ success: true });
    } catch (err) {
      console.error('[Socket] Erreur lors de la connexion du transport:', err);
      callback({ error: err.message });
    }
  });

  // Produire un flux média
  socket.on('produce', async ({ liveId, transportId, kind, rtpParameters, appData }, callback) => {
    try {
      const transportData = transports.get(liveId)?.get(transportId);
      
      if (!transportData) {
        throw new Error('Transport non trouvé');
      }

      const producer = await transportData.transport.produce({
        kind,
        rtpParameters,
        appData,
      });

      // Stocker le producer
      if (!producers.has(liveId)) {
        producers.set(liveId, new Map());
      }
      producers.get(liveId).set(producer.id, {
        producer,
        socketId: socket.id,
      });

      console.log('[mediasoup] Producer créé:', producer.id, 'pour le live:', liveId);

      // Notifier les autres viewers du nouveau producer
      socket.to(liveId).emit('newProducer', {
        producerId: producer.id,
        kind,
      });

      callback({ id: producer.id });
    } catch (err) {
      console.error('[Socket] Erreur lors de la production:', err);
      callback({ error: err.message });
    }
  });

  // Consommer un flux média
  socket.on('consume', async ({ liveId, transportId, producerId, rtpCapabilities }, callback) => {
    try {
      const router = await getOrCreateRouter(liveId);
      const transportData = transports.get(liveId)?.get(transportId);
      
      if (!transportData) {
        throw new Error('Transport non trouvé');
      }

      // Vérifier si le router peut consommer le producer
      if (!router.canConsume({ producerId, rtpCapabilities })) {
        throw new Error('Le router ne peut pas consommer ce producer');
      }

      const consumer = await transportData.transport.consume({
        producerId,
        rtpCapabilities,
        paused: true,
      });

      // Stocker le consumer
      if (!consumers.has(liveId)) {
        consumers.set(liveId, new Map());
      }
      consumers.get(liveId).set(consumer.id, {
        consumer,
        socketId: socket.id,
      });

      console.log('[mediasoup] Consumer créé:', consumer.id, 'pour le live:', liveId);

      callback({
        id: consumer.id,
        producerId: consumer.producerId,
        kind: consumer.kind,
        rtpParameters: consumer.rtpParameters,
      });

      // Reprendre le consumer après un court délai
      setTimeout(async () => {
        try {
          await consumer.resume();
          console.log('[mediasoup] Consumer repris:', consumer.id);
        } catch (err) {
          console.error('[mediasoup] Erreur lors de la reprise du consumer:', err);
        }
      }, 100);
    } catch (err) {
      console.error('[Socket] Erreur lors de la consommation:', err);
      callback({ error: err.message });
    }
  });

  // Obtenir les producers existants
  socket.on('getProducers', async ({ liveId }, callback) => {
    try {
      const liveProducers = producers.get(liveId);
      
      if (!liveProducers) {
        callback({ producers: [] });
        return;
      }

      const producerList = Array.from(liveProducers.values()).map(({ producer }) => ({
        id: producer.id,
        kind: producer.kind,
      }));

      callback({ producers: producerList });
    } catch (err) {
      console.error('[Socket] Erreur lors de la récupération des producers:', err);
      callback({ error: err.message });
    }
  });

  // Fermer un producer
  socket.on('closeProducer', async ({ liveId, producerId }) => {
    try {
      const liveProducers = producers.get(liveId);
      
      if (liveProducers && liveProducers.has(producerId)) {
        const { producer } = liveProducers.get(producerId);
        producer.close();
        liveProducers.delete(producerId);
        
        console.log('[mediasoup] Producer fermé:', producerId);
      }
    } catch (err) {
      console.error('[Socket] Erreur lors de la fermeture du producer:', err);
    }
  });

  // Fermer un consumer
  socket.on('closeConsumer', async ({ liveId, consumerId }) => {
    try {
      const liveConsumers = consumers.get(liveId);
      
      if (liveConsumers && liveConsumers.has(consumerId)) {
        const { consumer } = liveConsumers.get(consumerId);
        consumer.close();
        liveConsumers.delete(consumerId);
        
        console.log('[mediasoup] Consumer fermé:', consumerId);
      }
    } catch (err) {
      console.error('[Socket] Erreur lors de la fermeture du consumer:', err);
    }
  });

  // Rejoindre un live
  socket.on('join_live', ({ liveId, userInfo }) => {
    console.log(`[Socket] ${userInfo?.name || 'Utilisateur'} rejoint le live: ${liveId}`);
    
    // Rejoindre la room
    socket.join(liveId);
    
    // Stocker les informations du viewer
    viewers.set(socket.id, {
      id: socket.id,
      liveId,
      userInfo,
      joinedAt: new Date().toISOString(),
    });
    
    // Initialiser la room si elle n'existe pas
    if (!liveRooms.has(liveId)) {
      liveRooms.set(liveId, {
        id: liveId,
        viewers: new Set(),
        comments: [],
        reactions: [],
        status: 'live',
        startedAt: new Date().toISOString(),
      });
    }
    
    // Ajouter le viewer à la room
    const room = liveRooms.get(liveId);
    room.viewers.add(socket.id);
    
    // Envoyer les données du live au viewer
    socket.emit('live_data', {
      liveId,
      status: room.status,
      viewerCount: room.viewers.size,
      comments: room.comments.slice(-50),
      reactions: room.reactions.slice(-100),
    });
    
    // Notifier les autres viewers
    socket.to(liveId).emit('viewer_joined', {
      id: socket.id,
      userInfo,
      viewerCount: room.viewers.size,
    });
  });

  // Quitter un live
  socket.on('leave_live', ({ liveId }) => {
    console.log(`[Socket] Viewer quitte le live: ${liveId}`);
    
    socket.leave(liveId);
    
    // Retirer le viewer de la room
    if (liveRooms.has(liveId)) {
      const room = liveRooms.get(liveId);
      room.viewers.delete(socket.id);
      
      // Notifier les autres viewers
      socket.to(liveId).emit('viewer_left', {
        viewerId: socket.id,
        viewerCount: room.viewers.size,
      });
    }
    
    // Supprimer le viewer
    viewers.delete(socket.id);
  });

  // Envoyer un commentaire
  socket.on('send_comment', (comment) => {
    console.log(`[Socket] Commentaire reçu:`, comment);
    
    const viewer = viewers.get(socket.id);
    if (!viewer) return;
    
    const { liveId } = viewer;
    
    // Ajouter le commentaire à la room
    if (liveRooms.has(liveId)) {
      const room = liveRooms.get(liveId);
      room.comments.push(comment);
      
      // Limiter à 1000 commentaires
      if (room.comments.length > 1000) {
        room.comments = room.comments.slice(-1000);
      }
    }
    
    // Diffuser le commentaire à tous les viewers du live
    io.to(liveId).emit('new_comment', comment);
  });

  // Épingler un commentaire
  socket.on('pin_comment', ({ commentId }) => {
    console.log(`[Socket] Épingler le commentaire: ${commentId}`);
    
    const viewer = viewers.get(socket.id);
    if (!viewer) return;
    
    const { liveId } = viewer;
    
    // Trouver et épingler le commentaire
    if (liveRooms.has(liveId)) {
      const room = liveRooms.get(liveId);
      const comment = room.comments.find(c => c.id === commentId);
      
      if (comment) {
        comment.isPinned = true;
        io.to(liveId).emit('comment_pinned', comment);
      }
    }
  });

  // Désépingler un commentaire
  socket.on('unpin_comment', () => {
    console.log(`[Socket] Désépingler le commentaire`);
    
    const viewer = viewers.get(socket.id);
    if (!viewer) return;
    
    const { liveId } = viewer;
    
    // Désépingler tous les commentaires
    if (liveRooms.has(liveId)) {
      const room = liveRooms.get(liveId);
      room.comments.forEach(c => c.isPinned = false);
      io.to(liveId).emit('comment_unpinned');
    }
  });

  // Supprimer un commentaire
  socket.on('delete_comment', ({ commentId }) => {
    console.log(`[Socket] Supprimer le commentaire: ${commentId}`);
    
    const viewer = viewers.get(socket.id);
    if (!viewer) return;
    
    const { liveId } = viewer;
    
    // Supprimer le commentaire
    if (liveRooms.has(liveId)) {
      const room = liveRooms.get(liveId);
      room.comments = room.comments.filter(c => c.id !== commentId);
      io.to(liveId).emit('comment_deleted', commentId);
    }
  });

  // Envoyer une réaction
  socket.on('send_reaction', (reaction) => {
    console.log(`[Socket] Réaction reçue:`, reaction);
    
    const viewer = viewers.get(socket.id);
    if (!viewer) return;
    
    const { liveId } = viewer;
    
    // Ajouter la réaction à la room
    if (liveRooms.has(liveId)) {
      const room = liveRooms.get(liveId);
      room.reactions.push(reaction);
      
      // Limiter à 500 réactions
      if (room.reactions.length > 500) {
        room.reactions = room.reactions.slice(-500);
      }
    }
    
    // Diffuser la réaction à tous les viewers du live
    io.to(liveId).emit('new_reaction', reaction);
  });

  // Partager le live
  socket.on('share_live', ({ liveId, platform, userInfo }) => {
    console.log(`[Socket] Live partagé sur ${platform}:`, liveId);
    
    // Notifier les autres viewers
    socket.to(liveId).emit('live_shared', {
      platform,
      userInfo,
    });
  });

  // Démarrer le live
  socket.on('start_live', ({ liveId, userInfo }) => {
    console.log(`[Socket] Live démarré:`, liveId);
    
    if (liveRooms.has(liveId)) {
      const room = liveRooms.get(liveId);
      room.status = 'live';
      room.startedAt = new Date().toISOString();
      
      io.to(liveId).emit('live_started', {
        liveId,
        startedAt: room.startedAt,
      });
    }
  });

  // Arrêter le live
  socket.on('stop_live', ({ liveId, userInfo }) => {
    console.log(`[Socket] Live arrêté:`, liveId);
    
    if (liveRooms.has(liveId)) {
      const room = liveRooms.get(liveId);
      room.status = 'ended';
      room.endedAt = new Date().toISOString();
      
      io.to(liveId).emit('live_stopped', {
        liveId,
        endedAt: room.endedAt,
      });
    }
  });

  // Indiquer que l'utilisateur est en train de taper
  socket.on('typing_start', ({ user }) => {
    const viewer = viewers.get(socket.id);
    if (!viewer) return;
    
    const { liveId } = viewer;
    socket.to(liveId).emit('typing_start', user);
  });

  // Indiquer que l'utilisateur a arrêté de taper
  socket.on('typing_stop', () => {
    const viewer = viewers.get(socket.id);
    if (!viewer) return;
    
    const { liveId } = viewer;
    socket.to(liveId).emit('typing_stop', socket.id);
  });

  // Déconnexion
  socket.on('disconnect', () => {
    console.log(`[Socket] Déconnexion: ${socket.id}`);
    
    const viewer = viewers.get(socket.id);
    if (viewer) {
      const { liveId } = viewer;
      
      // Retirer le viewer de la room
      if (liveRooms.has(liveId)) {
        const room = liveRooms.get(liveId);
        room.viewers.delete(socket.id);
        
        // Notifier les autres viewers
        socket.to(liveId).emit('viewer_left', {
          viewerId: socket.id,
          viewerCount: room.viewers.size,
        });
      }
      
      // Supprimer le viewer
      viewers.delete(socket.id);

      // Fermer les transports et producers associés
      const liveTransports = transports.get(liveId);
      if (liveTransports) {
        for (const [transportId, transportData] of liveTransports.entries()) {
          if (transportData.socketId === socket.id) {
            transportData.transport.close();
            liveTransports.delete(transportId);
          }
        }
      }

      const liveProducers = producers.get(liveId);
      if (liveProducers) {
        for (const [producerId, producerData] of liveProducers.entries()) {
          if (producerData.socketId === socket.id) {
            producerData.producer.close();
            liveProducers.delete(producerId);
          }
        }
      }

      const liveConsumers = consumers.get(liveId);
      if (liveConsumers) {
        for (const [consumerId, consumerData] of liveConsumers.entries()) {
          if (consumerData.socketId === socket.id) {
            consumerData.consumer.close();
            liveConsumers.delete(consumerId);
          }
        }
      }
    }
  });
});

// ============================================
// REST API
// ============================================

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    activeRooms: liveRooms.size,
    activeViewers: viewers.size,
    activeWorkers: workers.length,
  });
});

// Obtenir les statistiques d'un live
app.get('/api/live/:liveId/stats', (req, res) => {
  const { liveId } = req.params;
  
  if (!liveRooms.has(liveId)) {
    return res.status(404).json({ error: 'Live non trouvé' });
  }
  
  const room = liveRooms.get(liveId);
  
  res.json({
    liveId,
    status: room.status,
    viewerCount: room.viewers.size,
    commentCount: room.comments.length,
    reactionCount: room.reactions.length,
    startedAt: room.startedAt,
    endedAt: room.endedAt,
  });
});

// Obtenir les commentaires d'un live
app.get('/api/live/:liveId/comments', (req, res) => {
  const { liveId } = req.params;
  const { limit = 50, offset = 0 } = req.query;
  
  if (!liveRooms.has(liveId)) {
    return res.status(404).json({ error: 'Live non trouvé' });
  }
  
  const room = liveRooms.get(liveId);
  const comments = room.comments.slice(
    parseInt(offset),
    parseInt(offset) + parseInt(limit)
  );
  
  res.json({
    comments,
    total: room.comments.length,
  });
});

// ============================================
// START SERVER
// ============================================

const PORT = 3000;

async function startServer() {
  try {
    // Créer les workers mediasoup
    await createWorkers();
    
    // Démarrer le serveur
    server.listen(PORT, () => {
      console.log(`[Server] Serveur démarré sur le port ${PORT}`);
      console.log(`[Server] WebSocket disponible sur ws://localhost:${PORT}`);
      console.log(`[Server] mediasoup prêt avec ${workers.length} workers`);
    });
  } catch (err) {
    console.error('[Server] Erreur lors du démarrage du serveur:', err);
    process.exit(1);
  }
}

startServer();

module.exports = { app, server, io };
