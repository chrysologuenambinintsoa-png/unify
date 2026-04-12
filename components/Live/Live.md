# Live Component - Facebook Live Style

Composant de streaming live inspiré de Facebook Live avec fonctionnalités complètes en temps réel.

## 🚀 Fonctionnalités

### Streaming Vidéo

- Support HLS/DASH pour le streaming adaptatif
- Contrôles personnalisés (play/pause, volume, plein écran)
- Indicateur de buffering
- Mode live et VOD

### Réactions en Temps Réel
- 6 types de réactions Facebook (👍 ❤️ 😂 😮 😢 😡)
- Animations flottantes
- Compteur de réactions
- Overlay de réactions

### Chat Live
- Commentaires en temps réel
- Mise en épine de commentaires
- Indicateur de saisie
- Auto-scroll
- Historique des commentaires

### Interface Utilisateur
- Design moderne inspiré de Facebook Live
- Responsive (mobile, tablette, desktop)
- Mode plein écran
- Badge "EN DIRECT" animé
- Compteur de spectateurs
- Informations du streamer

### Actions Sociales
- Partage (Facebook, Twitter, Copier le lien)
- Bouton "Suivre"
- Contrôles de diffusion (démarrer/arrêter)

## 📦 Installation

### Dépendances Frontend

```bash
npm install socket.io-client
```

### Dépendances Backend

```bash
cd components/Live/server
npm install
```

## 🎯 Utilisation

### Import Basique

```jsx
import { Live } from './components/Live';

function App() {
  return (
    <Live
      liveId="demo-live"
      userInfo={{
        id: 'user-123',
        name: 'John Doe',
        avatar: 'https://example.com/avatar.jpg'
      }}
      socketUrl="http://localhost:5000"
      showChat={true}
      showReactions={true}
      showActionBar={true}
      showViewerCount={true}
      autoPlay={true}
      muted={false}
      onReaction={(data) => console.log('Réaction:', data)}
      onComment={(data) => console.log('Commentaire:', data)}
      onShare={(data) => console.log('Partage:', data)}
    />
  );
}
```

### Import des Sous-composants

```jsx
import {
  VideoPlayer,
  LiveChat,
  ActionBar,
  ReactionsOverlay,
  ViewerCounter,
  StreamerInfo,
  LiveProvider,
  useLive,
  useReactions,
  useComments,
} from './components/Live';
```

### Utilisation avec Contexte

```jsx
import { LiveProvider, useLive } from './components/Live';

function CustomLiveComponent() {
  const { socket, isConnected, liveData } = useLive();
  
  return (
    <div>
      {isConnected ? (
        <p>Connecté au live!</p>
      ) : (
        <p>Connexion en cours...</p>
      )}
    </div>
  );
}

function App() {
  return (
    <LiveProvider socketUrl="http://localhost:5000" liveId="demo-live">
      <CustomLiveComponent />
    </LiveProvider>
  );
}
```

### Utilisation des Hooks

```jsx
import { useReactions, useComments } from './components/Live';

function CustomComponent() {
  const { reactions, sendReaction, totalReactions } = useReactions();
  const { comments, sendMessage } = useComments();
  
  const handleReaction = () => {
    sendReaction('like');
  };
  
  const handleComment = () => {
    sendMessage('Hello World!', { id: 'user-123', name: 'John' });
  };
  
  return (
    <div>
      <button onClick={handleReaction}>👍 {totalReactions}</button>
      <button onClick={handleComment}>Commenter</button>
    </div>
  );
}
```

## 🖥️ Démarrage du Serveur

```bash
cd components/Live/server
npm install
npm run dev
```

Le serveur démarre sur `http://localhost:5000` par défaut.

### Variables d'Environnement

```env
PORT=5000
CLIENT_URL=http://localhost:3000
```

## 📡 API WebSocket

### Événements Client → Serveur

| Événement | Description | Payload |
|-----------|-------------|---------|
| `join_live` | Rejoindre un live | `{ liveId, userInfo }` |
| `leave_live` | Quitter un live | `{ liveId }` |
| `send_comment` | Envoyer un commentaire | `{ id, message, user, timestamp }` |
| `send_reaction` | Envoyer une réaction | `{ id, type, position, timestamp }` |
| `pin_comment` | Épingler un commentaire | `{ commentId }` |
| `unpin_comment` | Désépingler un commentaire | `{}` |
| `delete_comment` | Supprimer un commentaire | `{ commentId }` |
| `share_live` | Partager le live | `{ liveId, platform, userInfo }` |
| `start_live` | Démarrer le live | `{ liveId, userInfo }` |
| `stop_live` | Arrêter le live | `{ liveId, userInfo }` |
| `typing_start` | Indiquer le début de saisie | `{ user }` |
| `typing_stop` | Indiquer la fin de saisie | `{}` |

### Événements Serveur → Client

| Événement | Description | Payload |
|-----------|-------------|---------|
| `live_data` | Données initiales du live | `{ liveId, status, viewerCount, comments, reactions }` |
| `viewer_joined` | Nouveau spectateur | `{ id, userInfo, viewerCount }` |
| `viewer_left` | Spectateur parti | `{ viewerId, viewerCount }` |
| `new_comment` | Nouveau commentaire | `{ id, message, user, timestamp }` |
| `comment_pinned` | Commentaire épinglé | `{ id, message, user, isPinned }` |
| `comment_unpinned` | Commentaire désépinglé | `{}` |
| `comment_deleted` | Commentaire supprimé | `commentId` |
| `new_reaction` | Nouvelle réaction | `{ id, type, position, timestamp }` |
| `live_shared` | Live partagé | `{ platform, userInfo }` |
| `live_started` | Live démarré | `{ liveId, startedAt }` |
| `live_stopped` | Live arrêté | `{ liveId, endedAt }` |
| `typing_start` | Utilisateur en train de taper | `{ id, name }` |
| `typing_stop` | Utilisateur a arrêté de taper | `userId` |

## 🎨 Personnalisation

### CSS Variables

```css
:root {
  --live-primary: #1877f2;
  --live-primary-hover: #166fe5;
  --live-secondary: #42b72a;
  --live-danger: #f02849;
  --live-warning: #f7b928;
  --live-success: #42b72a;
  --live-bg-dark: #18191a;
  --live-bg-light: #f0f2f5;
  --live-text-primary: #e4e6eb;
  --live-text-secondary: #b0b3b8;
  --live-border: #3e4042;
  --live-shadow: 0 2px 12px rgba(0, 0, 0, 0.3);
  --live-shadow-lg: 0 8px 32px rgba(0, 0, 0, 0.4);
  --live-radius: 12px;
  --live-radius-sm: 8px;
  --live-radius-lg: 16px;
  --live-transition: all 0.3s ease;
}
```

### Types de Réactions

```javascript
import { REACTION_TYPES, REACTIONS_CONFIG } from './components/Live';

// Types disponibles
REACTION_TYPES.LIKE    // 'like'
REACTION_TYPES.LOVE    // 'love'
REACTION_TYPES.HAHA    // 'haha'
REACTION_TYPES.WOW     // 'wow'
REACTION_TYPES.SAD     // 'sad'
REACTION_TYPES.ANGRY   // 'angry'

// Configuration
REACTIONS_CONFIG[REACTION_TYPES.LIKE]
// { emoji: '👍', label: 'J\'aime', color: '#1877f2' }
```

## 📱 Responsive Design

Le composant est entièrement responsive avec 3 breakpoints :

- **Desktop** : > 768px
- **Tablet** : 481px - 768px
- **Mobile** : ≤ 480px

## 🔧 Props du Composant Live

| Prop | Type | Défaut | Description |
|------|------|--------|-------------|
| `liveId` | `string` | - | ID unique du live |
| `userInfo` | `object` | - | Informations de l'utilisateur |
| `socketUrl` | `string` | `'http://localhost:5000'` | URL du serveur WebSocket |
| `showChat` | `boolean` | `true` | Afficher le chat |
| `showReactions` | `boolean` | `true` | Afficher les réactions |
| `showActionBar` | `boolean` | `true` | Afficher la barre d'actions |
| `showViewerCount` | `boolean` | `true` | Afficher le compteur de spectateurs |
| `autoPlay` | `boolean` | `true` | Lecture automatique |
| `muted` | `boolean` | `false` | Muet par défaut |
| `onReaction` | `function` | - | Callback lors d'une réaction |
| `onComment` | `function` | - | Callback lors d'un commentaire |
| `onShare` | `function` | - | Callback lors d'un partage |
| `onError` | `function` | - | Callback en cas d'erreur |
| `onViewerJoin` | `function` | - | Callback lors de l'arrivée d'un spectateur |
| `onViewerLeave` | `function` | - | Callback lors du départ d'un spectateur |

## 📄 Licence

MIT
