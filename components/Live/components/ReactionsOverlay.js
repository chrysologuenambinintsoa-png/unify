/**
 * ReactionsOverlay.js - Overlay de réactions flottantes
 * Affiche les réactions en temps réel qui flottent vers le haut
 */

import React from 'react';
import { REACTIONS_CONFIG } from '../hooks/useReactions';


const ReactionsOverlay = ({
  reactions = [],
  onReaction,
}) => {
  // Obtenir la configuration d'une réaction
  const getReactionConfig = (type) => {
    return REACTIONS_CONFIG[type] || REACTIONS_CONFIG.like;
  };

  return (
    <div className={styles['reactions-overlay-container']}>
      {reactions.map((reaction) => {
        const config = getReactionConfig(reaction.type);
        const position = reaction.position || {
          x: Math.random() * 80 + 10,
          y: Math.random() * 80 + 10,
        };

        return (
          <div
            key={reaction.id}
            className={styles['reaction-float']}
            style={{
              left: `${position.x}%`,
              bottom: `${position.y}%`,
            }}
          >
            <span className={styles['reaction-float-emoji']}>
              {config.emoji}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default ReactionsOverlay;
