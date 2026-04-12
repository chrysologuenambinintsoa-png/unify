import { useRouter } from 'next/router'
import { useState } from 'react'

/**
 * Composant Avatar cliquable réutilisable
 * Affiche une photo de profil avec lien vers le profil utilisateur
 * 
 * Props:
 * - user: object { prenom, nom, nomUtilisateur, email, avatar, avatarUrl }
 * - size: 'small' | 'header' | 'medium' | 'large' (default: 'medium')
 * - onClick: callback optionnel avant navigation
 * - disableNavigation: boolean - empêche la navigation vers le profil lorsque true
 * - showName: boolean - affiche nom et prénom (default: false)
 * - style: object - styles supplémentaires
 * - className: string - classes CSS supplémentaires
 */
export default function ClickableAvatar({ 
  user, 
  size = 'medium', 
  onClick, 
  disableNavigation = false,
  showName = false,
  style = {},
  className = '',
  tooltip = true
}) {
  const router = useRouter()
  const [imageError, setImageError] = useState(false)

  if (!user) return null

  const sizeMap = {
    small: { avatar: 32, font: 12 },
    header: { avatar: 40, font: 14 },
    medium: { avatar: 48, font: 14 },
    large: { avatar: 64, font: 16 }
  }

  const { avatar: avatarSize, font: fontSize } = sizeMap[size]

  const userName = user.prenom || user.nomUtilisateur || (user.email ? user.email.split('@')[0] : 'Utilisateur')
  const userLastName = user.nom || ''
  const displayName = `${userName} ${userLastName}`.trim()

  const initials = ((user.prenom ? user.prenom[0] : '') + (user.nom ? user.nom[0] : '') || 'U').toUpperCase()

  const avatarUrl = user.avatarUrl || user.avatar
  const avatarBg = user.avatarBg || `hsl(${Math.random() * 360}, 70%, 60%)`

  // Check if avatarUrl is a valid URL (starts with http/https or / for relative)
  const isValidAvatarUrl = avatarUrl && (avatarUrl.startsWith('http') || avatarUrl.startsWith('/') || avatarUrl.startsWith('./') || avatarUrl.startsWith('../'))
  const shouldShowImage = isValidAvatarUrl && !imageError

  const handleClick = async (e) => {
    e.preventDefault()
    
    // Only stop propagation if we're going to navigate
    // This allows parent onClick handlers to work when disableNavigation is true
    if (!disableNavigation) {
      e.stopPropagation()
    }
    
    if (onClick) {
      onClick(e, user)
    }

    if (disableNavigation) {
      return
    }

    // Navigation vers le profil
    const profileUsername = user.nomUtilisateur || userName
    await router.push(`/profile?user=${encodeURIComponent(profileUsername)}`)
  }

  // Render default avatar SVG (Facebook style)
  const renderDefaultAvatar = () => {
    return (
      <svg
        width={avatarSize}
        height={avatarSize}
        viewBox="0 0 100 100"
        style={{
          width: '100%',
          height: '100%'
        }}
      >
        {/* Background circle - Facebook light gray */}
        <circle cx="50" cy="50" r="50" fill="#e4e6eb"/>
        {/* Head silhouette */}
        <circle cx="50" cy="36" r="16" fill="#bcc0c4"/>
        {/* Body/shoulders silhouette */}
        <path d="M50 52 C35 52 25 62 25 75 L25 100 L75 100 L75 75 C75 62 65 52 50 52Z" fill="#bcc0c4"/>
      </svg>
    )
  }

  return (
    <div
      onClick={handleClick}
      style={{
        display: 'inline-flex',
        flexDirection: showName ? 'column' : 'row',
        alignItems: 'center',
        gap: showName ? 8 : 0,
        cursor: 'pointer',
        ...style
      }}
      className={`clickable-avatar ${className}`}
      title={tooltip ? displayName : ''}
    >
      {/* Avatar Image */}
      <div
        style={{
          width: avatarSize,
          height: avatarSize,
          borderRadius: '50%',
          backgroundColor: imageError ? avatarBg : 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          flexShrink: 0,
          border: '2px solid var(--fb-border)',
          position: 'relative',
          transition: 'all 0.2s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = '0 0 10px rgba(0,0,0,0.2)'
          e.currentTarget.style.transform = 'scale(1.05)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = 'none'
          e.currentTarget.style.transform = 'scale(1)'
        }}
      >
        {shouldShowImage ? (
          <img
            src={avatarUrl}
            alt={displayName}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
            onError={() => setImageError(true)}
          />
        ) : (
          renderDefaultAvatar()
        )}
      </div>

      {/* Name Display */}
      {showName && (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: `${fontSize}px`, fontWeight: 500, color: 'var(--fb-text)' }}>
            {userName}
          </div>
          {userLastName && (
            <div style={{ fontSize: `${fontSize - 2}px`, color: 'var(--fb-text-secondary)' }}>
              {userLastName}
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        .clickable-avatar:hover {
          opacity: 0.8;
        }
      `}</style>
    </div>
  )
}
