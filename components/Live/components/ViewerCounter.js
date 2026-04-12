/**
 * ViewerCounter.js - Compteur de spectateurs en temps réel
 * Affiche le nombre de spectateurs avec animation
 */

import React, { useState, useEffect } from 'react';


const ViewerCounter = ({
  count = 0,
  showIcon = true,
  animate = true,
}) => {
  const [displayCount, setDisplayCount] = useState(count);
  const [isAnimating, setIsAnimating] = useState(false);

  // Animer le changement de nombre
  useEffect(() => {
    if (animate && count !== displayCount) {
      setIsAnimating(true);
      
      // Animation de comptage
      const duration = 500;
      const steps = 20;
      const increment = (count - displayCount) / steps;
      let currentStep = 0;

      const timer = setInterval(() => {
        currentStep++;
        if (currentStep >= steps) {
          setDisplayCount(count);
          setIsAnimating(false);
          clearInterval(timer);
        } else {
          setDisplayCount(prev => Math.round(prev + increment));
        }
      }, duration / steps);

      return () => clearInterval(timer);
    } else {
      setDisplayCount(count);
    }
  }, [count, animate]);

  // Formater le nombre
  const formatCount = (num) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  return (
    <div className={`${styles['viewer-counter-container']} ${isAnimating ? styles['animating'] : ''}`}>
      {showIcon && (
        <svg 
          viewBox="0 0 24 24" 
          fill="currentColor" 
          className={styles['viewer-counter-icon']}
        >
          <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
        </svg>
      )}
      <span className={styles['viewer-counter-count']}>
        {formatCount(displayCount)}
      </span>
      <span className={styles['viewer-counter-label']}>
        spectateur{displayCount !== 1 ? 's' : ''}
      </span>
    </div>
  );
};

export default ViewerCounter;
