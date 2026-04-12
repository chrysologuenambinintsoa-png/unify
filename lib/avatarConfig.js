/**
 * Configuration des avatars cliquables
 * Centralise les styles et configuration pour les avatars
 */

export const AVATAR_SIZES = {
  small: {
    width: 32,
    height: 32,
    fontSize: 12,
    borderWidth: 2
  },
  medium: {
    width: 48,
    height: 48,
    fontSize: 14,
    borderWidth: 2
  },
  large: {
    width: 64,
    height: 64,
    fontSize: 16,
    borderWidth: 3
  }
}

export const AVATAR_COLORS = [
  'hsl(210, 70%, 60%)',  // Bleu
  'hsl(290, 70%, 60%)',  // Violet
  'hsl(30, 70%, 60%)',   // Orange
  'hsl(130, 70%, 50%)',  // Vert
  'hsl(10, 75%, 60%)',   // Rouge
  'hsl(50, 75%, 50%)',   // Jaune
  'hsl(170, 70%, 50%)',  // Cyan
  'hsl(340, 70%, 60%)',  // Rose
]

export function getColorForUser(email) {
  if (!email) return AVATAR_COLORS[0]
  const hash = email.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]
}

export function getInitials(user) {
  if (!user) return 'U'
  const first = user.prenom ? user.prenom[0] : ''
  const last = user.nom ? user.nom[0] : ''
  return (first + last || 'U').toUpperCase()
}

export function getDisplayName(user) {
  if (!user) return 'Utilisateur'
  const name = user.prenom || ''
  const surname = user.nom || ''
  return (name + ' ' + surname).trim() || (user.nomUtilisateur || 'Utilisateur')
}

export function getAvatarUrl(user) {
  if (!user) return null
  return user.avatarUrl || user.avatar || null
}

export const AVATAR_STYLES = {
  container: {
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    userSelect: 'none'
  },
  avatar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%',
    overflow: 'hidden',
    flexShrink: 0,
    position: 'relative',
    transition: 'all 0.2s ease',
    border: '2px solid var(--fb-border, #e5e5e5)'
  },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  initials: {
    fontWeight: 600,
    color: '#fff',
    textShadow: '0 1px 2px rgba(0,0,0,0.3)',
    userSelect: 'none'
  },
  name: {
    fontSize: '14px',
    fontWeight: 500,
    color: 'var(--fb-text, #000)',
    textAlign: 'center'
  },
  nameSmall: {
    fontSize: '12px',
    color: 'var(--fb-text-secondary, #999)',
    marginTop: '4px'
  }
}

// Animations CSS
export const AVATAR_ANIMATIONS = `
  @keyframes avatarHover {
    from {
      transform: scale(1);
    }
    to {
      transform: scale(1.05);
      box-shadow: 0 0 10px rgba(0,0,0,0.2);
    }
  }

  .clickable-avatar:hover {
    animation: avatarHover 0.2s ease;
  }

  @keyframes avatarClick {
    0% {
      transform: scale(1);
    }
    50% {
      transform: scale(0.95);
    }
    100% {
      transform: scale(1);
    }
  }

  .clickable-avatar:active {
    animation: avatarClick 0.2s ease;
  }
`

/**
 * Utilités supplémentaires
 */

export function isUserOnline(user, onlineUsers = []) {
  if (!user) return false
  return onlineUsers.some(u => u.email === user.email)
}

export function formatUserStatus(user) {
  return `${user.prenom || ''} ${user.nom || ''}`.trim() || user.nomUtilisateur || user.email
}

export function buildAvatarData(user) {
  return {
    initials: getInitials(user),
    displayName: getDisplayName(user),
    avatarUrl: getAvatarUrl(user),
    backgroundColor: getColorForUser(user.email),
    online: isUserOnline(user)
  }
}
