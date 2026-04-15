import React, { useState, useEffect } from 'react';
import styles from '../styles/AccountTransition.module.css';

export default function AccountTransition({ account, visible }) {
  if (!visible || !account) return null;

  const fullName = `${account.prenom || ''} ${account.nom || ''}`.trim() || 'User';
  const avatarSrc = account.avatarUrl || account.avatar || account.profileImage || account.image || null;
  
  const [imageError, setImageError] = useState(false);

  const shouldShowImage = avatarSrc && !imageError;
  const displaySrc = shouldShowImage ? avatarSrc : null;

  return (
    <div className={styles.overlay}>
      <div className={styles.content}>
        <div className={styles.avatarWrapper}>
          <div className={styles.arrowsContainer}>
            <div className={`${styles.arrow} ${styles.arrowLeft}`}></div>
            <div className={`${styles.arrow} ${styles.arrowRight}`}></div>
          </div>
          
          {shouldShowImage ? (
            <img
              src={displaySrc}
              alt={account.prenom}
              className={styles.avatar}
              onError={() => setImageError(true)}
            />
          ) : (
            <svg
              width="120"
              height="120"
              viewBox="0 0 100 100"
              className={styles.avatar}
              style={{
                width: '120px',
                height: '120px',
                borderRadius: '50%',
                border: '4px solid rgba(255, 255, 255, 0.3)',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
              }}
            >
              <circle cx="50" cy="50" r="50" fill="#e4e6eb"/>
              <circle cx="50" cy="36" r="16" fill="#bcc0c4"/>
              <path d="M50 52 C35 52 25 62 25 75 L25 100 L75 100 L75 75 C75 62 65 52 50 52Z" fill="#bcc0c4"/>
            </svg>
          )}
        </div>
        <h2 className={styles.name}>
          {account.prenom} {account.nom}
        </h2>
        <p className={styles.email}>{account.email}</p>
        <p className={styles.text}>Basculement en cours...</p>
      </div>
    </div>
  );
}