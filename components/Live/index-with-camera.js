/**
 * index-with-camera.js - Point d'entrée pour le composant Live avec caméra
 * Exporte tous les composants, hooks et utilitaires nécessaires
 * 
 * @author SuperNinja AI
 * @version 3.0.0
 */

// Composant principal avec caméra
export { default as LiveWithCamera } from './LiveWithCamera';

// Composants individuels
export { default as VideoPlayer } from './components/VideoPlayer';
export { default as LiveChat } from './components/LiveChat';
export { default as ReactionsOverlay } from './components/ReactionsOverlay';
export { default as ActionBar } from './components/ActionBar';
export { default as ViewerCounter } from './components/ViewerCounter';
export { default as StreamerInfo } from './components/StreamerInfo';

// Hooks
export { default as useCamera } from './hooks/useCamera';
export { default as useWebRTC } from './hooks/useWebRTC';
export { useReactions, REACTIONS_CONFIG, REACTION_TYPES } from './hooks/useReactions';
export { useComments } from './hooks/useComments';

// Context
export { LiveProvider, useLive } from './context/LiveContext';

// Export par défaut
export { default } from './LiveWithCamera';
