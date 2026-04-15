import { useState, useEffect, useRef } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faHeart, 
  faComment, 
  faReply, 
  faAt, 
  faUserPlus, 
  faUserCheck,
  faLightbulb,
  faMobileAlt,
  faMessage,
  faShare,
  faCalendarAlt,
  faUsers,
  faBell,
  faCheck,
  faTrash,
  faEllipsisH,
  faCheckCircle,
  faTimes,
  faClock,
  faGlobe,
  faUserFriends
} from '@fortawesome/free-solid-svg-icons'
import { faBell as farBell } from '@fortawesome/free-regular-svg-icons'

// Mapping des icÃ´nes Font Awesome pour chaque type de notification
const NOTIFICATION_ICONS = {
  like: { icon: faHeart, color: '#f22837', bg: '#ffebe6' },
  comment: { icon: faComment, color: '#003d5c', bg: '#cce0f0' },
  reply: { icon: faReply, color: '#003d5c', bg: '#cce0f0' },
  mention: { icon: faAt, color: '#003d5c', bg: '#cce0f0' },
  'friend-request': { icon: faUserPlus, color: '#003d5c', bg: '#cce0f0' },
  'friend-accepted': { icon: faUserCheck, color: '#31a24c', bg: '#e6f4ea' },
  'friend-suggestion': { icon: faLightbulb, color: '#f7b928', bg: '#fff8e1' },
  'new-story': { icon: faMobileAlt, color: '#f02849', bg: '#ffebe6' },
  reaction: { icon: faHeart, color: '#f22837', bg: '#ffebe6' },
  message: { icon: faMessage, color: '#003d5c', bg: '#cce0f0' },
  share: { icon: faShare, color: '#003d5c', bg: '#cce0f0' },
  event: { icon: faCalendarAlt, color: '#f7b928', bg: '#fff8e1' },
  group: { icon: faUsers, color: '#003d5c', bg: '#cce0f0' },
  default: { icon: faBell, color: '#65676b', bg: '#f0f2f5' }
}

// Formater le temps relatif (style Facebook)
const formatRelativeTime = (dateString) => {
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return ''
  const now = new Date()
  const diffMs = now - date
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)
  const diffWeek = Math.floor(diffDay / 7)
  const diffMonth = Math.floor(diffDay / 30)

  if (diffSec < 60) return 'A l\'instant'
  if (diffMin < 60) return `Il y a ${diffMin} min`
  if (diffHour < 24) return `Il y a ${diffHour} h`
  if (diffDay < 7) return `Il y a ${diffDay} j`
  if (diffWeek < 4) return `Il y a ${diffWeek} sem.`
  if (diffMonth < 12) return `Il y a ${diffMonth} mois`
  return date.toLocaleDateString('fr-FR')
}

// Obtenir le texte de notification selon le type
const getNotificationText = (notification) => {
  const { type, content, actor } = notification
  const actorName = actor ? `${actor.prenom || ''} ${actor.nom || ''}`.trim() : ''
  
  switch (type) {
    case 'like':
      if (content?.includes('photo')) return 'aime votre photo'
      if (content?.includes('couverture')) return 'aime votre photo de couverture'
      if (content?.includes('profile')) return 'aime votre photo de profil'
      if (content?.includes('publication')) return 'aime votre publication'
      return 'a aimÃ© votre publication'
    case 'comment':
      return 'a commentÃ© votre publication'
    case 'reply':
      return 'a rÃ©pondu Ã  votre commentaire'
    case 'mention':
      return 'vous a identifiÃ© dans une publication'
    case 'friend-request':
      return 'vous a envoyÃ© une demande d\'ami'
    case 'friend-accepted':
      return 'a acceptÃ© votre demande d\'ami'
    case 'friend-suggestion':
      return 'vous a suggÃ©rÃ© un ami'
    case 'new-story':
      return 'a publiÃ© une nouvelle story'
    case 'reaction':
      return 'a rÃ©agir Ã  votre publication'
    case 'message':
      return 'vous a envoyÃ© un message'
    case 'share':
      return 'a partagÃ© votre publication'
    case 'event':
      return 'a crÃ©Ã© un Ã©vÃ©nement'
    case 'group':
      return 'a ajoutÃ© quelque chose au groupe'
    default:
      return content || 'nouvelle notification'
  }
}

// Composant skeleton de chargement
function NotificationSkeleton() {
  return (
    <div className="fb-notification-item fb-notification-skeleton">
      <div className="fb-notification-avatar-skeleton"></div>
      <div className="fb-notification-content-skeleton">
        <div className="fb-notification-text-skeleton"></div>
        <div className="fb-notification-time-skeleton"></div>
      </div>
    </div>
  )
}

// Composant principal Notifications
export default function Notifications({ user, onUnreadCountChange, isPanel = false }) {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all, unread, mentions
  const [activeDropdown, setActiveDropdown] = useState(null)
  const dropdownRef = useRef(null)

  // Fermer le dropdown en cliquant Ã  l'extÃ©rieur
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setActiveDropdown(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Charger les notifications
  useEffect(() => {
    fetchNotifications()
    
    // Polling toutes les 30 secondes
    const pollingInterval = setInterval(() => {
      fetchNotifications()
    }, 30000)
    
    return () => clearInterval(pollingInterval)
  }, [user])

  // Mettre Ã  jour le compteur de non lus
  useEffect(() => {
    if (onUnreadCountChange) {
      const unreadCount = notifications.filter(n => !n.read).length
      onUnreadCountChange(unreadCount)
    }
  }, [notifications, onUnreadCountChange])

  const fetchNotifications = async () => {
    if (!user || !user.email) {
      setLoading(false)
      return
    }
    
    try {
      const res = await fetch(`/api/notifications?userEmail=${encodeURIComponent(user.email)}`)
      const data = await res.json()
      
      const mapped = (data.notifications || []).map(n => ({
        id: n.id,
        actor: n.actor,
        type: n.type,
        content: n.content,
        read: n.read,
        createdAt: n.createdAt,
        url: n.url || '#',
        preview: n.preview || null
      }))
      
      setNotifications(mapped)
    } catch (e) {
      console.error('Erreur chargement notifications:', e)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsRead = async (id) => {
    try {
      await fetch('/api/notifications', { 
        method: 'PUT', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ id, read: true, userEmail: user?.email }) 
      })
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    } catch (e) {
      console.error('Erreur marquage lu:', e)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await fetch('/api/notifications', { 
        method: 'PUT', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ all: true, userEmail: user?.email }) 
      })
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    } catch (e) {
      console.error('Erreur marquage tout lu:', e)
    }
  }

  const handleDelete = async (id) => {
    try {
      await fetch('/api/notifications', { 
        method: 'DELETE', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ id }) 
      })
      setNotifications(prev => prev.filter(n => n.id !== id))
      setActiveDropdown(null)
    } catch (e) {
      console.error('Erreur suppression:', e)
    }
  }

  const handleFriendResponse = async (id, accept) => {
    try {
      await fetch('/api/amis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userEmail: user?.email, 
          friendId: notifications.find(n => n.id === id)?.actor?.id,
          accept 
        })
      })
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    } catch (e) {
      console.error('Erreur rÃ©ponse ami:', e)
    }
  }

  // Filtrer les notifications
  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.read
    if (filter === 'mentions') return n.type === 'mention' || n.type === 'comment'
    return true
  })

  // Grouper par date
  const groupedNotifications = filteredNotifications.reduce((groups, notification) => {
    const date = new Date(notification.createdAt)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    
    let key = date.toLocaleDateString('fr-FR')
    if (date.toDateString() === today.toDateString()) key = 'Aujourd\'hui'
    else if (date.toDateString() === yesterday.toDateString()) key = 'Hier'
    
    if (!groups[key]) groups[key] = []
    groups[key].push(notification)
    return groups
  }, {})

  const unreadCount = notifications.filter(n => !n.read).length

  // Rendu skeleton
  if (loading) {
    return (
      <div className="fb-notifications-container">
        <div className="fb-notifications-header">
          <div className="fb-notifications-title">
            <h2><FontAwesomeIcon icon={faBell} style={{ marginRight: 10 }} />Notifications</h2>
          </div>
        </div>
        <div className="fb-notifications-list">
          {[1, 2, 3, 4, 5].map(i => <NotificationSkeleton key={i} />)}
        </div>
      </div>
    )
  }

  // Rendu principal
  return (
    <div className="fb-notifications-container" ref={dropdownRef}>
      {/* En-tÃªte */}
      <div className="fb-notifications-header">
        <div className="fb-notifications-title">
          <h2><FontAwesomeIcon icon={faBell} style={{ marginRight: 10 }} />Notifications</h2>
          {unreadCount > 0 && (
            <span className="fb-notifications-badge">{unreadCount}</span>
          )}
        </div>
        {notifications.length > 0 && (
          <button 
            className="fb-notifications-mark-all"
            onClick={handleMarkAllAsRead}
          >
            <FontAwesomeIcon icon={faCheck} style={{ marginRight: 6 }} />
            Tout marquer comme lu
          </button>
        )}
      </div>

      {/* Filtres */}
      <div className="fb-notifications-filters">
        <button 
          className={`fb-filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          <FontAwesomeIcon icon={faGlobe} style={{ fontSize: 14 }} />
          Tout
        </button>
        <button 
          className={`fb-filter-btn ${filter === 'unread' ? 'active' : ''}`}
          onClick={() => setFilter('unread')}
        >
          <FontAwesomeIcon icon={farBell} style={{ fontSize: 14 }} />
          Non lus
          {unreadCount > 0 && <span className="fb-filter-count">{unreadCount}</span>}
        </button>
        <button 
          className={`fb-filter-btn ${filter === 'mentions' ? 'active' : ''}`}
          onClick={() => setFilter('mentions')}
        >
          <FontAwesomeIcon icon={faAt} style={{ fontSize: 14 }} />
          Mentions
        </button>
      </div>

      {/* Liste des notifications */}
      <div className="fb-notifications-list">
        {filteredNotifications.length === 0 ? (
          <div className="fb-notifications-empty">
            <div className="fb-empty-icon">
              <FontAwesomeIcon icon={faBell} style={{ fontSize: 64, color: '#ccc' }} />
            </div>
            <h3>Aucune notification</h3>
            <p>Vous Ãªtes Ã  jour !</p>
          </div>
        ) : (
          Object.entries(groupedNotifications).map(([dateGroup, groupNotifications]) => (
            <div key={dateGroup} className="fb-notification-group">
              <div className="fb-notification-group-title">
                <FontAwesomeIcon icon={faClock} style={{ marginRight: 8, fontSize: 12 }} />
                {dateGroup}
              </div>
              {groupNotifications.map(notification => (
                <NotificationItem 
                  key={notification.id}
                  notification={notification}
                  isPanel={isPanel}
                  onMarkAsRead={handleMarkAsRead}
                  onDelete={handleDelete}
                  onFriendResponse={handleFriendResponse}
                  activeDropdown={activeDropdown}
                  setActiveDropdown={setActiveDropdown}
                />
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

// Composant item de notification individuel
function NotificationItem({ 
  notification, 
  isPanel, 
  onMarkAsRead, 
  onDelete, 
  onFriendResponse,
  activeDropdown,
  setActiveDropdown
}) {
  const actor = notification.actor
  const actorName = actor ? `${actor.prenom || ''} ${actor.nom || ''}`.trim() : ''
  const actorAvatar = actor?.avatarUrl || actor?.avatar || (actor?.prenom ? actor.prenom[0] : 'ðŸ‘¤')
  const notificationText = getNotificationText(notification)
  const iconConfig = NOTIFICATION_ICONS[notification.type] || NOTIFICATION_ICONS.default
  const isUnread = !notification.read

  const handleClick = () => {
    if (isUnread) {
      onMarkAsRead(notification.id)
    }
    if (notification.url && notification.url !== '#') {
      window.location.href = notification.url
    }
  }

  const toggleDropdown = (e) => {
    e.stopPropagation()
    setActiveDropdown(activeDropdown === notification.id ? null : notification.id)
  }

  return (
    <div 
      className={`fb-notification-item ${isUnread ? 'unread' : ''}`}
      onClick={handleClick}
    >
      {/* Avatar avec badge de type */}
      <div className="fb-notification-avatar-wrap">
        {actorAvatar.startsWith('http') || actorAvatar.startsWith('/') ? (
          <img 
            src={actorAvatar} 
            alt={actorName} 
            className="fb-notification-avatar"
          />
        ) : (
          <div className="fb-notification-avatar fb-avatar-placeholder">
            {actorAvatar}
          </div>
        )}
        <div 
          className="fb-notification-type-badge"
          style={{ backgroundColor: iconConfig.bg }}
        >
          <FontAwesomeIcon 
            icon={iconConfig.icon} 
            style={{ 
              fontSize: 11, 
              color: iconConfig.color 
            }} 
          />
        </div>
      </div>

      {/* Contenu */}
      <div className="fb-notification-content">
        <div className="fb-notification-text">
          {actorName && (
            <span 
              className="fb-notification-actor"
              onClick={(e) => {
                e.stopPropagation()
                if (actor?.id) window.location.href = `/profile?id=${actor.id}`
              }}
            >
              {actorName}
            </span>
          )}
          {' '}{notificationText}
        </div>
        
        {/* AperÃ§u du commentaire/rÃ©ponse */}
        {notification.preview && (
          <div className="fb-notification-preview">
            <FontAwesomeIcon icon={faComment} style={{ marginRight: 6, fontSize: 12 }} />
            "{notification.preview}"
          </div>
        )}
        
        <div className="fb-notification-time">
          <FontAwesomeIcon icon={faClock} style={{ marginRight: 5, fontSize: 12 }} />
          {formatRelativeTime(notification.createdAt)}
        </div>

        {/* Boutons d'action pour les demandes d'ami */}
        {notification.type === 'friend-request' && (
          <div className="fb-notification-actions">
            <button 
              className="fb-action-btn fb-action-btn-primary"
              onClick={(e) => {
                e.stopPropagation()
                onFriendResponse(notification.id, true)
              }}
            >
              <FontAwesomeIcon icon={faUserCheck} style={{ marginRight: 6 }} />
              Confirmer
            </button>
            <button 
              className="fb-action-btn fb-action-btn-secondary"
              onClick={(e) => {
                e.stopPropagation()
                onFriendResponse(notification.id, false)
              }}
            >
              <FontAwesomeIcon icon={faTimes} style={{ marginRight: 6 }} />
              Supprimer
            </button>
          </div>
        )}
      </div>

      {/* Indicateur non lu */}
      {isUnread && <div className="fb-notification-unread-dot"></div>}

      {/* Bouton menu */}
      <div className="fb-notification-menu">
        <button 
          className="fb-menu-btn"
          onClick={toggleDropdown}
          aria-label="Options"
        >
          <FontAwesomeIcon icon={faEllipsisH} />
        </button>
        
        {activeDropdown === notification.id && (
          <div className="fb-notification-dropdown">
            {isUnread && (
              <button 
                className="fb-dropdown-item"
                onClick={(e) => {
                  e.stopPropagation()
                  onMarkAsRead(notification.id)
                  setActiveDropdown(null)
                }}
              >
                <FontAwesomeIcon icon={faCheckCircle} style={{ marginRight: 8 }} />
                Marquer comme lu
              </button>
            )}
            <button 
              className="fb-dropdown-item fb-dropdown-item-danger"
              onClick={(e) => {
                e.stopPropagation()
                onDelete(notification.id)
              }}
            >
              <FontAwesomeIcon icon={faTrash} style={{ marginRight: 8 }} />
              Supprimer
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

