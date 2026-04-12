import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/router'
import PostViewer from './PostViewer'
import ClickableAvatar from './ClickableAvatar'
import useSaved from '../hooks/useSaved'
import useRealtimePost from './hooks/useRealtimePost'
import SkeletonCommentList from './SkeletonComment'
import EmojiPicker from './EmojiPicker'
import { Icons } from './Icons'

export default function PostCard({ post: initialPost, onDelete, currentUser, disableModal }) {
  const router = useRouter()
  const cardRef = useRef(null)
  const commentInputRef = useRef(null)
  const hideTimeoutRef = useRef(null)
  const menuDropdownRef = useRef(null)
  
  // Real-time post updates
  const { post, isUpdating, lastUpdate, forceUpdate } = useRealtimePost(initialPost?.id, initialPost)

  // Format timestamp relative to current time (like Groupe.js)
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (diff < 60000) return 'À l\'instant';
    if (diff < 3600000) return `Il y a ${Math.floor(diff / 60000)} min`;
    if (diff < 86400000) return `Il y a ${Math.floor(diff / 3600000)} h`;
    if (days === 1) return 'Hier';
    if (days < 7) return `Il y a ${days} j`;
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
  };

  // Current user detection
  const currentUserName = (() => {
    try {
      const userStr = localStorage.getItem('user') || ''
      if (userStr) {
        const u = JSON.parse(userStr)
        return u.prenom || u.nomUtilisateur || (u.email || '').split('@')[0]
      }
    } catch (e) {}
    return null
  })()

  const isAuthor = currentUserName && post.author === currentUserName

  // State management
  const [postViewerOpen, setPostViewerOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [commentsOpen, setCommentsOpen] = useState(false)
  const [comments, setComments] = useState(Array.isArray(post.commentsList) ? post.commentsList : [])
  const [commentsLoading, setCommentsLoading] = useState(false)
  const [commentInput, setCommentInput] = useState('')
  const [replyTo, setReplyTo] = useState(null)
  const [commentLikes, setCommentLikes] = useState({})
  const [liked, setLiked] = useState(false)
  const [likesCount, setLikesCount] = useState(post.likes || 0)
  const [reactionType, setReactionType] = useState(post.reactionType || null)
  const [reactionHistory, setReactionHistory] = useState([])
  const [shareTargetType, setShareTargetType] = useState('friend')
  const [friends, setFriends] = useState([])
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const [isHidden, setIsHidden] = useState(false)
  const [isFollowing, setIsFollowing] = useState(true)
  const [editMode, setEditMode] = useState(false)
  const [editedContent, setEditedContent] = useState(post.content || '')
  const [reportOpen, setReportOpen] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [expanded, setExpanded] = useState(false)
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false)
  const [emojiPickerTimeout, setEmojiPickerTimeout] = useState(null)

  const { saved, loading: saving, toggle } = useSaved(post.id)
  const safeComments = Array.isArray(comments) ? comments : []

  // Helper function to get reaction emoji
  const getReactionEmoji = (type) => {
    const reactions = {
      like: '👍',
      love: '❤️',
      haha: '😂',
      wow: '😮',
      sad: '😢',
      solidarity: '🤝'
    }
    return reactions[type] || '👍'
  }

  // Helper function to get reaction color
  const getReactionColor = (type) => {
    const colors = {
      like: '#0B3D91',
      love: '#F33E58',
      haha: '#FFA500',
      wow: '#8B5CF6',
      sad: '#6B7280',
      solidarity: '#10B981'
    }
    return colors[type] || '#0B3D91'
  }

  // Map emojis to FontAwesome icon classes
  const emojiToFontAwesome = {
    '😊': 'fas fa-smile',
    '😔': 'fas fa-frown',
    '😍': 'fas fa-heart-eyes',
    '😡': 'fas fa-angry',
    '😴': 'fas fa-tired',
    '🤔': 'fas fa-thinking',
    '🎉': 'fas fa-party-popper',
    '😎': 'fas fa-grin-stars',
    '😅': 'fas fa-grin-sweat',
    '😢': 'fas fa-sad-tear'
  }

  // Parse metadata from content
  function parsePostMetadata(content) {
    const tags = []
    const feelings = []
    const locations = []

    const tagRegex = /@(\w+)/g
    let tagMatch
    while ((tagMatch = tagRegex.exec(content)) !== null) {
      tags.push(tagMatch[1])
    }

    const locationRegex = /📍\s+([^📍\n]+)/g
    let locationMatch
    while ((locationMatch = locationRegex.exec(content)) !== null) {
      locations.push(locationMatch[1].trim())
    }

    const feelingRegex = /(😊|😔|😍|😡|😴|🤔|🎉|😎|😅|😢)\s+(\w+)/g
    let feelingMatch
    while ((feelingMatch = feelingRegex.exec(content)) !== null) {
      feelings.push({ emoji: feelingMatch[1], label: feelingMatch[2], icon: emojiToFontAwesome[feelingMatch[1]] })
    }

    return { tags, feelings, locations }
  }

  function cleanContent(content) {
    let cleaned = content
    cleaned = cleaned.replace(/@\w+\s*/g, '')
    cleaned = cleaned.replace(/📍\s+[^📍\n]+/g, '')
    cleaned = cleaned.replace(/(😊|😔|😍|😡|😴|🤔|🎉|😎|😅|😢)\s+\w+\s*/g, '')
    return cleaned.trim()
  }

  const metadata = parsePostMetadata(post.content || '')
  const cleanedContent = cleanContent(editedContent)

  // Navigation
  const navigateAuthor = () => {
    // If it's a sponsor post, redirect to sponsor link or Unify page
    if (post.isSponsor) {
      if (post.sponsorLink) {
        // Track the click before redirecting
        trackSponsorClick()
        window.open(post.sponsorLink, '_blank', 'noopener,noreferrer')
      } else {
        // Redirect to sponsor's Unify page
        router.push(`/profile?user=${encodeURIComponent(post.author)}`)
      }
    } else if (post.author) {
      router.push(`/profile?user=${encodeURIComponent(post.author)}`)
    }
  }

  // Sponsor tracking
  const trackSponsorClick = async () => {
    if (post.isSponsor && post.sponsorId) {
      try {
        await fetch(`/api/sponsors/${post.sponsorId}/track-event`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ event: 'click' })
        })
      } catch (e) {
        console.error('error tracking sponsor click', e)
      }
    }
  }

  // Track sponsor impressions
  useEffect(() => {
    if (post.isSponsor && post.sponsorId) {
      try {
        fetch(`/api/sponsors/${post.sponsorId}/stats`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'impression' })
        }).catch(e => console.error('error tracking sponsor impression', e))
      } catch (e) {
        console.error('error tracking sponsor impression', e)
      }
    }
  }, [post.isSponsor, post.sponsorId])

  // Close menu on outside click
  useEffect(() => {
    const handler = e => {
      if (menuOpen && cardRef.current && !cardRef.current.contains(e.target)) {
        // Vérifier aussi si le clic est dans le dropdown
        if (menuDropdownRef.current && !menuDropdownRef.current.contains(e.target)) {
          setMenuOpen(false)
        }
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuOpen])

  // Load comments and hydrate state
  useEffect(() => {
    const normalizedId = post.id ? String(post.id) : ''
    const isNumericId = /^[0-9]+$/.test(normalizedId)
    if ((!post.commentsList || post.commentsList.length === 0) && isNumericId && !normalizedId.startsWith('temp-')) {
      setCommentsLoading(true)
      fetch(`/api/items/${normalizedId}/comments`)
        .then(r => r.json())
        .then(data => {
          if (Array.isArray(data)) setComments(data)
          else if (data && Array.isArray(data.comments)) setComments(data.comments)
          else setComments([])
        })
        .catch(() => {})
        .finally(() => setCommentsLoading(false))
    }

    // Hydrate reaction state
    if (post.id) {
      try {
        const stored = JSON.parse(localStorage.getItem('postReactions') || '{}')
        const saved = stored[post.id]
        if (saved) {
          setReactionType(saved.type)
          setLiked(!!saved.liked)
          setReactionHistory(saved.history || [])
        }
      } catch (e) {}
    }

    // Hydrate notifications status
    try {
      const stored = JSON.parse(localStorage.getItem('postNotifications') || '{}')
      setNotificationsEnabled(!!stored[post.id])
    } catch (e) {}

    // Hydrate hidden status
    try {
      const arr = JSON.parse(localStorage.getItem('hiddenPosts') || '[]')
      setIsHidden(arr.includes(post.id))
    } catch (e) {}

    // Hydrate follow status
    try {
      const arr = JSON.parse(localStorage.getItem('unfollowedUsers') || '[]')
      setIsFollowing(!arr.includes(post.author))
    } catch (e) {}
  }, [post.id, post.author])

  // Load friends for sharing
  useEffect(() => {
    if (shareOpen) {
      try {
        const userStr = localStorage.getItem('user')
        const user = userStr ? JSON.parse(userStr) : null
        const userEmail = user?.email
        if (userEmail) {
          fetch(`/api/amis?userEmail=${encodeURIComponent(userEmail)}`)
            .then(r => r.json())
            .then(d => setFriends(d.amis || []))
            .catch(() => {})
        }
      } catch (e) {
        console.error('Error loading friends:', e)
      }
    }
  }, [shareOpen])

  // Toggle functions
  function toggleComments(e) {
    if (e) e.preventDefault()
    setCommentsOpen(prev => !prev)
  }

  function toggleNotifications() {
    setNotificationsEnabled(v => !v)
    try {
      const stored = JSON.parse(localStorage.getItem('postNotifications') || '{}')
      stored[post.id] = !notificationsEnabled
      localStorage.setItem('postNotifications', JSON.stringify(stored))
    } catch (e) {}
  }

  function toggleHidePost() {
    setIsHidden(v => !v)
    try {
      const stored = JSON.parse(localStorage.getItem('hiddenPosts') || '[]')
      if (!isHidden) {
        stored.push(post.id)
        localStorage.setItem('hiddenPosts', JSON.stringify([...new Set(stored)]))
      } else {
        const updated = stored.filter(id => id !== post.id)
        localStorage.setItem('hiddenPosts', JSON.stringify(updated))
      }
    } catch (e) {}
  }

  function toggleUnfollow() {
    setIsFollowing(v => !v)
    try {
      const stored = JSON.parse(localStorage.getItem('unfollowedUsers') || '[]')
      if (isFollowing) {
        stored.push(post.author)
        localStorage.setItem('unfollowedUsers', JSON.stringify([...new Set(stored)]))
      } else {
        const updated = stored.filter(name => name !== post.author)
        localStorage.setItem('unfollowedUsers', JSON.stringify(updated))
      }
    } catch (e) {}
  }

  // Emoji picker hover handlers
  function handleLikeButtonEnter() {
    if (emojiPickerTimeout) {
      clearTimeout(emojiPickerTimeout)
      setEmojiPickerTimeout(null)
    }
    const timeout = setTimeout(() => {
      setEmojiPickerOpen(true)
    }, 500)
    setEmojiPickerTimeout(timeout)
  }

  function handleLikeButtonLeave() {
    if (emojiPickerTimeout) {
      clearTimeout(emojiPickerTimeout)
      setEmojiPickerTimeout(null)
    }
    const timeout = setTimeout(() => {
      setEmojiPickerOpen(false)
    }, 1500)
    setEmojiPickerTimeout(timeout)
  }

  function handleEmojiPickerEnter() {
    if (emojiPickerTimeout) {
      clearTimeout(emojiPickerTimeout)
      setEmojiPickerTimeout(null)
    }
  }

  function handleEmojiPickerLeave() {
    const timeout = setTimeout(() => {
      setEmojiPickerOpen(false)
    }, 1500)
    setEmojiPickerTimeout(timeout)
  }

  // Report
  async function submitReport() {
    if (!reportReason.trim()) return
    try {
      await fetch('/api/items/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: post.id, reason: reportReason, author: post.author })
      })
      setReportOpen(false)
      setReportReason('')
      alert('Merci pour votre signalement')
    } catch (e) {
      console.error('Report error', e)
      alert('Erreur lors du signalement')
    }
  }

  // Edit
  function handleEditPost() {
    if (editMode) {
      setEditMode(false)
    } else {
      setEditMode(true)
    }
  }

  // Reply
  function handleReply(comment) {
    setReplyTo(comment)
    const prefix = `@${comment.author || ''} `
    setCommentInput(prefix)
    if (!commentsOpen) setCommentsOpen(true)
    setTimeout(() => {
      commentInputRef.current?.focus()
    }, 0)
  }

  // Comment like
  async function toggleCommentLike(comment) {
    const already = commentLikes[comment.id]
    const newVal = !already
    setCommentLikes(prev => ({ ...prev, [comment.id]: newVal }))
    setComments(prev => {
      const arr = Array.isArray(prev) ? prev : []
      return arr.map(c => c.id === comment.id ? { ...c, likes: (c.likes || 0) + (newVal ? 1 : -1) } : c)
    })
    if (post.id && comment.id) {
      try {
        await fetch(`/api/items/${post.id}/comments/${comment.id}/reactions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: newVal ? 'like' : 'unlike' })
        })
      } catch (e) {
        console.error('comment like error', e)
      }
    }
  }

  // Submit comment
  async function submitComment() {
    let text = commentInput.trim()
    if (!text) return

    let parentId = null
    if (replyTo) {
      const mention = `@${replyTo.author || ''}`
      if (!text.startsWith(mention)) {
        text = `${mention} ${text}`
      }
      parentId = replyTo.id
    }

    if (post.id) {
      const userStr = localStorage.getItem('user')
      const localUser = userStr ? JSON.parse(userStr) : null
      const authorName = localUser ? (localUser.prenom || localUser.nomUtilisateur || (localUser.email || '').split('@')[0]) : 'Jean Dupont'
      const bodyPayload = { author: authorName, text, authorEmail: localUser?.email }
      if (parentId) bodyPayload.parentId = parentId

      const res = await fetch(`/api/items/${post.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload)
      })
      if (res.ok) {
        const created = await res.json()
        setComments(prev => {
          const arr = Array.isArray(prev) ? prev : []
          return [...arr, created]
        })
        setCommentInput('')
        setReplyTo(null)
        if (!commentsOpen) setCommentsOpen(true)
      }
    } else {
      const userStr = localStorage.getItem('user')
      const localUser = userStr ? JSON.parse(userStr) : null
      const authorName = localUser ? (localUser.prenom || localUser.nomUtilisateur || (localUser.email || '').split('@')[0]) : 'Jean Dupont'
      const initials = localUser ? (localUser.prenom ? `${localUser.prenom[0]}${(localUser.nom || '')[0] || ''}`.toUpperCase() : (localUser.nomUtilisateur ? localUser.nomUtilisateur.slice(0, 2).toUpperCase() : 'JD')) : 'JD'
      const newC = {
        author: authorName,
        initials,
        color: 'linear-gradient(135deg,#0B3D91,#082B60)',
        text,
        likes: 0,
        avatarUrl: localUser?.avatarUrl,
        avatar: localUser?.avatar
      }
      setComments(prev => {
        const arr = Array.isArray(prev) ? prev : []
        return [...arr, newC]
      })
      setCommentInput('')
      if (!commentsOpen) setCommentsOpen(true)
    }
  }

  function handleKey(e) {
    if (e.key === 'Enter') {
      e.preventDefault()
      submitComment()
    }
  }

  // Reaction handling
  async function handleReaction(type = 'like') {
    const isCurrently = reactionType === type
    const hasPreviousReaction = !!reactionType
    const newLiked = !isCurrently
    const newType = newLiked ? type : null
    setReactionType(newType)
    setLiked(newLiked)
    setLikesCount(c => {
      if (isCurrently) return Math.max(0, c - 1)
      if (hasPreviousReaction) return c
      return c + 1
    })

    let newHistory = reactionHistory
    if (newLiked) {
      let filtered = reactionHistory.filter(t => t !== type)
      if (type === 'like') filtered = filtered.filter(t => t !== 'like')
      newHistory = [type, ...filtered].slice(0, 3)
      setReactionHistory(newHistory)
    }

    if (post.id && !String(post.id).startsWith('temp-')) {
      try {
        const userStr = localStorage.getItem('user')
        const localUser = userStr ? JSON.parse(userStr) : null
        const headers = { 'Content-Type': 'application/json' }
        const body = { action: newLiked ? 'like' : 'unlike' }
        if (localUser?.id) {
          headers['x-user-id'] = JSON.stringify({ id: localUser.id })
        }
        if (localUser?.email) {
          body.userEmail = localUser.email
        }
        await fetch(`/api/items/${post.id}/reactions`, {
          method: 'POST',
          headers,
          body: JSON.stringify(body)
        })
      } catch (e) {
        console.error('reaction API error', e)
      }
    }

    if (post.id) {
      try {
        const stored = JSON.parse(localStorage.getItem('postReactions') || '{}')
        stored[post.id] = { liked: newLiked, type: newType, history: newLiked ? newHistory : [] }
        localStorage.setItem('postReactions', JSON.stringify(stored))
      } catch (e) {}
    }
  }

  const renderReactionIcon = (t) => {
    const commonStyle = { fontSize: 12 }
    switch (t) {
      case 'like': return <i className="fas fa-thumbs-up" style={commonStyle}></i>
      case 'love': return <span style={commonStyle}>❤️</span>
      case 'haha': return <span style={commonStyle}>😂</span>
      case 'wow': return <span style={commonStyle}>😮</span>
      case 'sad': return <span style={commonStyle}>😢</span>
      case 'solidarity': return <span style={commonStyle}>🤝</span>
      default: return null
    }
  }


  // Truncate content for preview
  const shouldTruncate = cleanedContent.length > 300
  const displayContent = shouldTruncate && !expanded 
    ? cleanedContent.substring(0, 300) + '...' 
    : cleanedContent

  return (
    <>
      <article ref={cardRef} className={`linkedin-post-card ${menuOpen ? 'menu-open' : ''}`} id={`post-${post.id}`}>
        {/* Post Header - Professional Design */}
        <div className="post-header">
          {isUpdating && (
            <div className="realtime-indicator" title="Mise à jour en cours...">
              <i className="fas fa-sync-alt fa-spin"></i>
            </div>
          )}
          <div className="post-author-section">
            {(() => {
              const userObj = post.authorUser ? {
                prenom: post.authorUser.prenom || post.author,
                nom: post.authorUser.nom,
                nomUtilisateur: post.authorUser.nomUtilisateur || post.author,
                email: post.authorUser.email,
                avatarUrl: post.authorUser.avatarUrl || post.authorUser.avatar,
                avatar: post.authorUser.avatar,
                avatarBg: post.color
              } : {
                prenom: post.author,
                nomUtilisateur: post.author,
                avatarUrl: post.avatarUrl || post.avatar,
                avatar: post.avatar,
                avatarBg: post.color
              }
              return <ClickableAvatar user={userObj} size="medium" />
            })()}
            <div className="post-author-info">
              <div className="author-name-row">
                <span className="author-name" onClick={(e) => { e.stopPropagation(); navigateAuthor() }}>
                  {typeof post.author === 'object' && post.author !== null ? post.author.name : post.author}
                </span>
                {post.isVerified && (
                  <span className="verified-badge" title="Compte vérifié">
                    <i className="fas fa-check"></i>
                  </span>
                )}
                {post.isSponsor && (
                  <span className="sponsor-badge" onClick={(e) => { e.stopPropagation(); navigateAuthor() }} style={{ cursor: 'pointer' }}>
                    <i className="fas fa-star"></i>
                    Sponsorisé
                  </span>
                )}
              </div>
              <div className="post-meta">
                <span className="post-time">{formatTime(post.createdAt || post.date)}</span>
                <span className="meta-dot">·</span>
                <span className="post-privacy">
                  <i className={`fas fa-${post.privacy || 'globe'}`}></i>
                  {post.privacy === 'user' ? 'Privé' : post.privacy === 'friends' ? 'Amis' : 'Public'}
                </span>
              </div>
            </div>
          </div>
          <div className={`post-header-actions ${menuOpen ? 'menu-open' : ''}`}>
            <button className="post-menu-btn" onClick={() => setMenuOpen(!menuOpen)} aria-label="Plus d'options">
              <i className="fas fa-ellipsis-h"></i>
            </button>
            {menuOpen && (
              <div className="post-menu-dropdown" ref={menuDropdownRef}>
                <button className="menu-item" onClick={() => { toggle(); setMenuOpen(false) }}>
                  <i className={`fa${saved ? 's' : 'r'} fa-bookmark`}></i>
                  <span>{saved ? 'Enregistré' : 'Enregistrer'}</span>
                </button>
                <button className="menu-item" onClick={() => { toggleNotifications(); setMenuOpen(false) }}>
                  <i className={`fas fa-${notificationsEnabled ? 'bell-slash' : 'bell'}`}></i>
                  <span>{notificationsEnabled ? 'Désactiver notifications' : 'Activer notifications'}</span>
                </button>
                <button className="menu-item" onClick={() => { toggleHidePost(); setMenuOpen(false) }}>
                  <i className="fas fa-eye-slash"></i>
                  <span>{isHidden ? 'Afficher la publication' : 'Masquer la publication'}</span>
                </button>
                <button className="menu-item" onClick={() => { toggleUnfollow(); setMenuOpen(false) }}>
                  <i className={`fas fa-${isFollowing ? 'user-minus' : 'user-plus'}`}></i>
                  <span>{isFollowing ? `Ne plus suivre ${post.author}` : `Suivre ${post.author}`}</span>
                </button>
                <div className="menu-divider"></div>
                <button className="menu-item" onClick={() => { setReportOpen(true); setMenuOpen(false) }}>
                  <i className="fas fa-flag"></i>
                  <span>Signaler cette publication</span>
                </button>
                {isAuthor && (
                  <>
                    <div className="menu-divider"></div>
                    <button className="menu-item" onClick={() => { handleEditPost(); setMenuOpen(false) }}>
                      <i className="fas fa-pen"></i>
                      <span>Modifier</span>
                    </button>
                    <button className="menu-item danger" onClick={async () => { if (onDelete) await onDelete(post.id); setMenuOpen(false) }}>
                      <i className="fas fa-trash"></i>
                      <span>Supprimer</span>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Post Content */}
        <div className="post-content" onClick={() => !disableModal && setPostViewerOpen(true)}>
          {editMode ? (
            <div className="edit-content">
              <textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="edit-textarea"
                rows={4}
              />
              <div className="edit-actions">
                <button className="btn-cancel" onClick={() => { setEditMode(false); setEditedContent(post.content || '') }}>
                  Annuler
                </button>
                <button className="btn-save" onClick={() => { setEditMode(false) }}>
                  Enregistrer
                </button>
              </div>
            </div>
          ) : (
            <>
              {(!post.media && !post.image && (post.backgroundColor || post.textColor || post.backgroundImage)) ? (
                <div className="post-text-bg" style={{ 
                  background: post.backgroundImage 
                    ? `url(${post.backgroundImage}) center/cover` 
                    : post.backgroundColor || 'transparent', 
                  color: post.textColor || 'inherit' 
                }}>
                  {displayContent}
                </div>
              ) : (
                <p className="post-text">{displayContent}</p>
              )}
              {shouldTruncate && (
                <button className="see-more-btn" onClick={(e) => { e.stopPropagation(); setExpanded(!expanded) }}>
                  {expanded ? 'Voir moins' : 'Voir plus'}
                </button>
              )}
            </>
          )}

          {/* Tags, Feelings, Locations */}
          {(metadata.tags.length > 0 || metadata.feelings.length > 0 || metadata.locations.length > 0) && (
            <div className="post-metadata">
              {metadata.feelings.map((f, i) => (
                <span key={`feeling-${i}`} className="metadata-tag feeling">
                  {f.icon ? <i className={f.icon}></i> : f.emoji} {f.label}
                </span>
              ))}
              {metadata.locations.map((loc, i) => (
                <span key={`loc-${i}`} className="metadata-tag location">
                  <i className="fas fa-map-marker-alt"></i> {loc}
                </span>
              ))}
              {metadata.tags.map((tag, i) => (
                <span key={`tag-${i}`} className="metadata-tag tag">
                  @{tag}
                </span>
              ))}
            </div>
          )}

          {/* Media */}
          {(post.media || post.image || post.video) && (
            <div className="post-media" onClick={(e) => {
              // Don't open viewer if clicking on video controls
              if (e.target.tagName === 'VIDEO') {
                e.stopPropagation();
                return;
              }
              e.stopPropagation();
              setPostViewerOpen(true);
            }}>
              {post.media ? (
                post.media.type === 'image' ? (
                  <img src={post.media.url} alt="post media" loading="lazy" />
                ) : post.media.type === 'video' ? (
                  <video src={post.media.url} controls onClick={(e) => e.stopPropagation()} />
                ) : null
              ) : post.video && typeof post.video === 'string' && (post.video.indexOf('data:') === 0 || post.video.indexOf('http') === 0) ? (
                <video src={post.video} controls onClick={(e) => e.stopPropagation()} />
              ) : post.image && typeof post.image === 'string' && (post.image.indexOf('data:') === 0 || post.image.indexOf('http') === 0) ? (
                <img src={post.image} alt="post media" loading="lazy" />
              ) : null}
            </div>
          )}
        </div>

        {/* Engagement Stats */}
        <div className="post-engagement-stats">
          <div className="reactions-count">
            {likesCount > 0 && reactionHistory.length > 0 && (() => {
              let disp = [...reactionHistory]
              if (disp.includes('like')) {
                disp = ['like', ...disp.filter(t => t !== 'like')]
              }
              return (
                <div className="reaction-icons-stack">
                  {disp.slice(0, 3).map((t, i) => (
                    <div
                      key={i}
                      className="reaction-icon-mini"
                      style={{
                        background: t === 'like' ? '#0B3D91' : t === 'love' ? '#F33E58' : t === 'haha' ? '#FFA500' : t === 'sad' ? '#6B7280' : t === 'wow' ? '#8B5CF6' : t === 'solidarity' ? '#10B981' : '#ccc',
                        zIndex: 3 - i
                      }}
                    >
                      {renderReactionIcon(t)}
                    </div>
                  ))}
                </div>
              )
            })()}
            <span className="count-text">{likesCount > 0 ? likesCount : ''}</span>
          </div>
          <div className="engagement-right">
            {safeComments.length > 0 && (
              <span className="comments-count" onClick={toggleComments}>
                {safeComments.length} {safeComments.length === 1 ? 'commentaire' : 'commentaires'}
              </span>
            )}
            {post.shares > 0 && (
              <span className="shares-count">{post.shares} partages</span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="post-actions">

          {/* Facebook-Style Emoji Picker */}
          <div 
            className="action-wrapper emoji-picker-wrapper"
            onMouseEnter={handleLikeButtonEnter}
            onMouseLeave={handleLikeButtonLeave}
          >
            <button
              className={`action-btn like-btn ${liked ? 'active' : ''}`}
              onClick={(e) => {
                e.stopPropagation()
                handleReaction('like')
              }}
            >
              {liked && reactionType ? (
                <span 
                  className="reaction-emoji-display" 
                  style={{ 
                    fontSize: '18px', 
                    color: getReactionColor(reactionType),
                    filter: `drop-shadow(0 0 4px ${getReactionColor(reactionType)}20)`
                  }}
                >
                  {getReactionEmoji(reactionType)}
                </span>
              ) : (
                <i className={`fa${liked ? 's' : 'r'} fa-thumbs-up action-icon`} style={{color: liked ? '#1a1a2e' : 'white'}}></i>
              )}
              <span>{liked ? (reactionType === 'love' ? 'J\'adore' : reactionType === 'haha' ? 'Haha' : reactionType === 'sad' ? 'Triste' : reactionType === 'wow' ? 'Waooo' : reactionType === 'solidarity' ? 'Solidaire' : 'J\'aime') : 'J\'aime'}</span>
            </button>
            <div className="reaction-picker-container">
              <EmojiPicker
                onSelect={handleReaction}
                currentReaction={reactionType}
                isOpen={emojiPickerOpen}
                onClose={() => setEmojiPickerOpen(false)}
              />
            </div>
          </div>

          {/* Comment Button */}
          <button className="action-btn comment-btn" onClick={toggleComments}>
            <i className="far fa-comment action-icon"></i>
            <span>Commenter</span>
          </button>

          {/* Share Button */}
          <div className="action-wrapper">
            <button className="action-btn share-btn" onClick={() => setShareOpen(!shareOpen)}>
              <i className="fas fa-share action-icon"></i>
              <span>Partager</span>
            </button>
            {shareOpen && (
              <div className="share-dropdown">
                <div className="share-header">
                  <span>Partager avec</span>
                  <button className="close-share" onClick={() => setShareOpen(false)}>
                    <i className="fas fa-times"></i>
                  </button>
                </div>
                <div className="share-tabs">
                  <button
                    className={`share-tab ${shareTargetType === 'friend' ? 'active' : ''}`}
                    onClick={() => setShareTargetType('friend')}
                  >
                    Amis
                  </button>
                  <button
                    className={`share-tab ${shareTargetType === 'group' ? 'active' : ''}`}
                    onClick={() => setShareTargetType('group')}
                  >
                    Groupes
                  </button>
                </div>
                <div className="share-list">
                  {shareTargetType === 'friend' ? (
                    friends.length > 0 ? (
                      friends.map((friend, i) => (
                        <div key={i} className="share-item" onClick={() => { /* handle share */ setShareOpen(false) }}>
                          <div className="share-avatar">
                            {friend.avatarUrl || friend.avatar ? (
                              <img src={friend.avatarUrl || friend.avatar} alt="" />
                            ) : (
                              <img src="/images/avatar.svg" alt="" className="share-avatar-svg" />
                            )}
                          </div>
                          <span className="share-name">{friend.prenom || friend.nomUtilisateur}</span>
                        </div>
                      ))
                    ) : (
                      <div className="share-empty">Aucun ami trouvé</div>
                    )
                  ) : (
                    <div className="share-empty">Aucun groupe disponible</div>
                  )}
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Comments Section */}
        {commentsOpen && (
          <div className="post-comments-section">
            {/* Comment Input */}
            <div className="comment-input-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'nowrap' }}>
              <div className="comment-input-avatar">
                {(() => {
                  const userStr = localStorage.getItem('user')
                  const localUser = userStr ? JSON.parse(userStr) : null
                  if (localUser?.avatarUrl || localUser?.avatar) {
                    return <img src={localUser.avatarUrl || localUser.avatar} alt="" />
                  }
                  return (
                    <div className="comment-avatar-placeholder">
                      {localUser?.prenom ? localUser.prenom[0] : localUser?.nomUtilisateur ? localUser.nomUtilisateur[0] : 'U'}
                    </div>
                  )
                })()}
              </div>
              <div className="comment-input-container" style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center' }}>
                <input
                  className="comment-input"
                  style={{ flex: 1, minWidth: 0, width: '100%' }}
                  ref={commentInputRef}
                  type="text"
                  placeholder={replyTo ? `Répondre à ${replyTo.author}...` : 'Ajouter un commentaire...'}
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  onKeyDown={handleKey}
                />
                <button
                  className="comment-submit-btn"
                  onClick={submitComment}
                  disabled={!commentInput.trim()}
                >
                  <i className="fas fa-paper-plane"></i>
                </button>
              </div>
            </div>

            {/* Reply indicator */}
            {replyTo && (
              <div className="reply-indicator">
                <span>Réponse à <strong>{replyTo.author}</strong></span>
                <button className="cancel-reply" onClick={() => setReplyTo(null)}>
                  <i className="fas fa-times"></i>
                </button>
              </div>
            )}

            {/* Comments List */}
            {commentsLoading ? (
              <SkeletonCommentList count={3} />
            ) : safeComments.length > 0 ? (
              <div className="comments-list">
                {safeComments.map((comment, index) => (
                  <div key={comment.id || index} className="comment-item">
                    <div className="comment-avatar">
                      {comment.avatarUrl || comment.avatar ? (
                        <img src={comment.avatarUrl || comment.avatar} alt="" />
                      ) : (
                        <div className="comment-avatar-placeholder" style={{ background: comment.color || '#667eea' }}>
                          {comment.initials || comment.author?.[0] || '?'}
                        </div>
                      )}
                    </div>
                    <div className="comment-content">
                      <div className="comment-bubble">
                        <span className="comment-author">{comment.author}</span>
                        <p className="comment-text">{comment.text}</p>
                      </div>
                      <div className="comment-actions">
                        <button
                          className={`comment-action-btn ${commentLikes[comment.id] ? 'liked' : ''}`}
                          onClick={() => toggleCommentLike(comment)}
                        >
                          J'aime{comment.likes > 0 ? ` · ${comment.likes}` : ''}
                        </button>
                        <button className="comment-action-btn" onClick={() => handleReply(comment)}>
                          Répondre
                        </button>
                        <span className="comment-time">{comment.date || 'À l\'instant'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-comments">
                <p>Aucun commentaire pour le moment. Soyez le premier à commenter !</p>
              </div>
            )}
          </div>
        )}

        {/* Report Modal */}
        {reportOpen && (
          <div className="report-modal-overlay" onClick={() => setReportOpen(false)}>
            <div className="report-modal" onClick={(e) => e.stopPropagation()}>
              <div className="report-modal-header">
                <h3>Signaler cette publication</h3>
                <button className="close-report" onClick={() => setReportOpen(false)}>
                  <i className="fas fa-times"></i>
                </button>
              </div>
              <div className="report-modal-body">
                <textarea
                  placeholder="Décrivez la raison de votre signalement..."
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="report-textarea"
                  rows={4}
                />
              </div>
              <div className="report-modal-footer">
                <button className="btn-cancel" onClick={() => setReportOpen(false)}>
                  Annuler
                </button>
                <button className="btn-submit" onClick={submitReport} disabled={!reportReason.trim()}>
                  Envoyer
                </button>
              </div>
            </div>
          </div>
        )}
      </article>

      {/* Post Viewer Modal */}
      {postViewerOpen && !disableModal && (
        <PostViewer
          post={post}
          onClose={() => setPostViewerOpen(false)}
          onDelete={onDelete}
        />
      )}
    </>
  )
}
