# Nouveau Système de Chat Facebook-like

Ce système de chat refondu simule l'interface de Facebook avec des fonctionnalités modernes.

## Fonctionnalités

### ✅ Implémenté
- **Sidebar droite** : Liste des conversations qui ne bloque pas la navigation
- **Navigation fluide** : L'utilisateur peut naviguer dans l'application pendant que le chat est ouvert
- **Palette de couleurs bleue** : Utilisation de la couleur #1877f2 (bleu Facebook)
- **Messages groupés** : Messages consécutifs du même utilisateur sont groupés
- **Indicateur de frappe** : Animation de points pour montrer quand quelqu'un tape
- **Répondre aux messages** : Fonctionnalité de réponse avec aperçu
- **Réactions aux messages** : Boutons pour réagir aux messages (implémenté dans l'UI)
- **Transfert de fichiers** : Bouton pour attacher des fichiers (structure prête)
- **Status en ligne** : Indicateurs verts pour les utilisateurs en ligne
- **Messages non lus** : Compteurs et highlighting pour les conversations non lues
- **Interface responsive** : S'adapte aux mobiles et desktop

### 🔄 À implémenter (structure prête)
- Upload de fichiers réel
- Réactions emoji complètes
- Messages vocaux
- Appels vidéo/audio
- Notifications push

## Utilisation

### 1. Wrapper l'application avec ChatProvider

```jsx
import { ChatProvider } from './components/messages'

function App() {
  return (
    <ChatProvider>
      {/* Votre application */}
      <ChatButton />
      <ChatSystem user={currentUser} />
    </ChatProvider>
  )
}
```

### 2. Importer les composants

```jsx
import {
  ChatProvider,
  ChatSystem,
  ChatButton,
  useChat
} from './components/messages'
```

### 3. Utiliser le hook useChat dans vos composants

```jsx
import { useChat } from './components/messages'

function MyComponent() {
  const { isChatOpen, setIsChatOpen, conversations } = useChat()

  return (
    <div>
      {/* Votre contenu */}
    </div>
  )
}
```

## Structure des fichiers

```
components/messages/
├── ChatSystem.js          # Système principal et contexte
├── ChatSidebar.js         # Sidebar des conversations
├── ChatWindow.js          # Fenêtre de chat individuelle
├── ChatComposer.js        # Compositeur de messages
├── ChatButton.js          # Bouton flottant
├── ChatSystem.css         # Styles CSS
└── index.js              # Exports
```

## API requise

Le système utilise les mêmes endpoints API existants :

- `GET /api/messages/conversations?userEmail=...`
- `GET /api/messages/conversation/:id`
- `POST /api/messages/send`

## Personnalisation

### Couleurs
Le système utilise la palette Facebook :
- Bleu principal : `#1877f2`
- Fond : `#ffffff`, `#f8f9fa`
- Texte : `#1c1e21`, `#65676b`
- Bordures : `#e4e6ea`

### Dimensions
- Sidebar : 360px de largeur
- Chat window : 400px de largeur
- Avatars : 32px (messages), 48px (liste)

## Migration depuis l'ancien système

Remplacez les anciens composants :

```jsx
// Ancien
<MessageInbox user={user} onClose={onClose} />

// Nouveau
<ChatProvider>
  <ChatButton />
  <ChatSystem user={user} />
</ChatProvider>
```

Le nouveau système est complètement indépendant et peut coexister avec l'ancien pendant la migration.