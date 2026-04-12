/**
 * index.js - Point d'entrée pour le composant Live
 * Exporte tous les composants et hooks
 */

// Composant principal
export { default as Live } from './Live';

// Sous-composants
export { default as VideoPlayer } from './components/VideoPlayer';
export { default as LiveChat } from './components/LiveChat';
export { default as ActionBar } from './components/ActionBar';
export { default as ReactionsOverlay } from './components/ReactionsOverlay';
export { default as ViewerCounter } from './components/ViewerCounter';
export { default as StreamerInfo } from './components/StreamerInfo';

// Contexte
export { LiveProvider, useLive } from './context/LiveContext';

// Hooks
export { useReactions, REACTION_TYPES, REACTIONS_CONFIG } from './hooks/useReactions';
export { useComments } from './hooks/useComments';
