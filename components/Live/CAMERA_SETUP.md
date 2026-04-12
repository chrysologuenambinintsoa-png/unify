# Live avec Caméra - Guide d'Installation et d'Utilisation

Ce guide explique comment configurer et utiliser le composant Live avec support de caméra et streaming WebRTC via mediasoup.

## 🎯 Fonctionnalités

### Nouveautés (v3.0.0)
- ✅ Capture de la caméra via `getUserMedia()`
- ✅ Streaming WebRTC en temps réel via mediasoup
- ✅ Support multi-viewers (scalable)
- ✅ Sélection de caméra et microphone
- ✅ Contrôle vidéo/audio en temps réel
- ✅ Interface de paramètres de caméra
- ✅ Gestion des permissions navigateur

### Fonctionnalités Existantes
- ✅ Chat en temps réel
- ✅ Réactions Facebook (👍 ❤️ 😂 😮 😢 😡)
- ✅ Partage (Facebook, Twitter, Copier le lien)
- ✅ Mode plein écran
- ✅ Compteur de spectateurs
- ✅ Design responsive (mobile, tablette, desktop)

## 📦 Installation

### 1. Dépendances Frontend

Le composant utilise `mediasoup-client` pour WebRTC. Ajoutez-le à votre projet :

```bash
npm install mediasoup-client
```

### 2. Dépendances Backend

Le serveur utilise `mediasoup` pour le streaming WebRTC. Installez les dépendances :

```bash
cd components/Live/server
npm install mediasoup
```

Ou utilisez le fichier `package-mediasoup.json` :

```bash
cd components/Live/server
cp package-mediasoup.json package.json
npm install
```

## 🚀 Démarrage

### 1. Démarrer le Serveur

```bash
cd components/Live/server
npm run dev
```

Le serveur démarre sur `http://localhost:5000` par défaut.

### 2. Variables d'Environnement

Créez un fichier `.env` dans le dossier du serveur :

```env
PORT=5000
CLIENT_URL=http://localhost:3000
ANNOUNCED_IP=127.0.0.1  # IP publique du serveur (pour la production)
```

**Note :** En production, remplacez `ANNOUNCED_IP` par l'IP publique de votre serveur.

## 🎥 Utilisation

### 1. Import du Composant

```jsx
import LiveWithCamera from './components/Live/LiveWithCamera';
```

### 2. Utilisation Basique (Stream)

```jsx
function App() {
  return (
    <LiveWithCamera
      liveId="my-live-123"
      userInfo={{
        id: 'user-123',
        name: 'John Doe',
        avatar: 'https://example.com/avatar.jpg'
      }}
      socketUrl="http://localhost:5000"
      isStreamer={true}  // Important : définir à true pour le streamer
      showChat={true}
      showReactions={true}
      showActionBar={true}
      showViewerCount={true}
      autoPlay={true}
      muted={false}
      onReaction={(data) => console.log('Réaction:', data)}
      onComment={(data) => console.log('Commentaire:', data)}
      onShare={(data) => console.log('Partage:', data)}
      onError={(error) => console.error('Erreur:', error)}
    />
  );
}
```

### 3. Utilisation (Viewer)

```jsx
function ViewerPage() {
  return (
    <LiveWithCamera
      liveId="my-live-123"
      userInfo={{
        id: 'viewer-456',
        name: 'Jane Doe',
        avatar: 'https://example.com/avatar2.jpg'
      }}
      socketUrl="http://localhost:5000"
      isStreamer={false}  // Viewer : pas de caméra
      showChat={true}
      showReactions={true}
    />
  );
}
```

### 4. Utilisation des Hooks

```jsx
import { useCamera, useWebRTC } from './components/Live/LiveWithCamera';

function CustomLiveComponent() {
  const {
    stream,
    isStreaming,
    error,
    devices,
    startStream,
    stopStream,
    toggleVideo,
    toggleAudio,
  } = useCamera();

  const {
    produce,
    consume,
    producers,
    consumers,
  } = useWebRTC(socket, liveId, true);

  return (
    <div>
      <button onClick={startStream}>Démarrer la caméra</button>
      <button onClick={toggleVideo}>Toggle Vidéo</button>
      <button onClick={toggleAudio}>Toggle Audio</button>
      
      {stream && (
        <video
          autoPlay
          playsInline
          muted
          srcObject={stream}
          style={{ width: '100%', height: 'auto' }}
        />
      )}
    </div>
  );
}
```

## 🔧 Configuration

### Paramètres de Caméra

Le hook `useCamera` accepte les paramètres suivants :

```javascript
const { startStream } = useCamera();

// Démarrer avec des paramètres personnalisés
await startStream({
  video: true,           // Activer la vidéo
  audio: true,           // Activer l'audio
  width: 1280,           // Largeur souhaitée
  height: 720,           // Hauteur souhaitée
  frameRate: 30,         // FPS souhaité
});
```

### Paramètres WebRTC

Le hook `useWebRTC` gère automatiquement :
- La création de transports (send/receive)
- La production de flux média (streamer)
- La consommation de flux média (viewer)
- La gestion des connexions WebRTC

## 📡 API WebSocket

### Nouveaux Événements

| Événement | Direction | Description | Payload |
|-----------|-----------|-------------|---------|
| `getRouterRtpCapabilities` | Client → Serveur | Obtenir les capacités du router | `{ liveId }` |
| `createTransport` | Client → Serveur | Créer un transport WebRTC | `{ liveId, direction }` |
| `connectTransport` | Client → Serveur | Connecter un transport | `{ liveId, transportId, dtlsParameters }` |
| `produce` | Client → Serveur | Produire un flux média | `{ liveId, transportId, kind, rtpParameters, appData }` |
| `consume` | Client → Serveur | Consommer un flux média | `{ liveId, transportId, producerId, rtpCapabilities }` |
| `getProducers` | Client → Serveur | Obtenir les producers existants | `{ liveId }` |
| `closeProducer` | Client → Serveur | Fermer un producer | `{ liveId, producerId }` |
| `closeConsumer` | Client → Serveur | Fermer un consumer | `{ liveId, consumerId }` |
| `newProducer` | Serveur → Client | Nouveau producer disponible | `{ producerId, kind }` |

## 🐛 Dépannage

### Problème : La caméra ne s'ouvre pas

**Causes possibles :**
1. Permissions refusées par le navigateur
2. Caméra déjà utilisée par une autre application
3. Navigateur non supporté

**Solutions :**
1. Autoriser l'accès à la caméra dans les paramètres du navigateur
2. Fermer les autres applications utilisant la caméra
3. Utiliser un navigateur moderne (Chrome, Firefox, Edge)

### Problème : Le streaming ne fonctionne pas

**Causes possibles :**
1. Serveur mediasoup non démarré
2. Configuration réseau incorrecte
3. Parebloque les connexions WebRTC

**Solutions :**
1. Vérifier que le serveur est démarré
2. Vérifier la variable `ANNOUNCED_IP` dans `.env`
3. Ouvrir les ports UDP (10000-59999) dans le pare-feu

### Problème : Pas de son

**Causes possibles :**
1. Microphone désactivé
2. Volume à zéro
3. Permissions microphone refusées

**Solutions :**
1. Cliquer sur le bouton microphone pour l'activer
2. Augmenter le volume
3. Autoriser l'accès au microphone dans les paramètres du navigateur

## 🔒 Sécurité

### Recommandations

1. **HTTPS en production** : WebRTC nécessite HTTPS en production
2. **Authentification** : Implémenter une authentification pour les streamers
3. **Validation** : Valider toutes les données reçues du client
4. **Rate limiting** : Limiter le nombre de connexions par IP
5. **Monitoring** : Surveiller l'utilisation des ressources serveur

## 📊 Performance

### Optimisations

1. **Nombre de workers** : Le nombre de workers mediasoup est automatiquement ajusté au nombre de CPUs
2. **Ports UDP** : Chaque worker utilise une plage de ports UDP (10000-59999)
3. **Bandwidth** : Ajuster le bitrate vidéo selon la bande passante disponible
4. **Scalabilité** : mediasoup supporte des centaines de viewers simultanés

## 📚 Ressources

- [mediasoup Documentation](https://mediasoup.org/documentation/)
- [WebRTC API](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API)
- [getUserMedia API](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia)

## 🆘 Support

Pour toute question ou problème :
1. Vérifier les logs du serveur
2. Vérifier la console du navigateur
3. Consulter la section Dépannage
4. Créer une issue sur le repository

## 📝 Notes

- Le composant `LiveWithCamera` est une extension du composant `Live` original
- Il est rétrocompatible avec l'ancienne API
- Le mode `isStreamer={false}` fonctionne sans caméra (viewer uniquement)
- Le mode `isStreamer={true}` nécessite les permissions caméra/microphone
