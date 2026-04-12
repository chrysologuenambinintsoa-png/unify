/**
 * server.js - Serveur backend pour le composant Live
 * Gère les connexions WebSocket et les événements en temps réel
 */

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

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

// Stockage des données en mémoire
const liveRooms = new Map();
const viewers = new Map();
const comments = new Map();
const reactions = new Map();

// ============================================
// SOCKET.IO EVENTS
// ============================================

io.on('connection', (socket) => {
  console.log(`[Socket] Nouvelle connexion: ${socket.id}`);

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
      comments: room.comments.slice(-50), // Derniers 50 commentaires
      reactions: room.reactions.slice(-100), // Dernières 100 réactions
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

server.listen(PORT, () => {
  console.log(`[Server] Serveur démarré sur le port ${PORT}`);
  console.log(`[Server] WebSocket disponible sur ws://localhost:${PORT}`);
});

module.exports = { app, server, io };
