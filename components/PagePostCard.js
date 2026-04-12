import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/router'
import PostViewer from './PostViewer'
import ClickableAvatar from './ClickableAvatar'
import useSaved from '../hooks/useSaved'
import useRealtimePost from './hooks/useRealtimePost'
import SkeletonCommentList from './SkeletonComment'
import EmojiPicker from './EmojiPicker'
import { Icons } from './Icons'

export default function PagePostCard({ post: initialPost, onDelete, currentUser, page, disableModal }) {
  const router = useRouter()
  const cardRef = useRef(null)
  const commentInputRef = useRef(null)
  const hideTimeoutRef = useRef(null)
  
  // Ensure initialPost has a fallback to prevent crashes
  const safeInitialPost = initialPost || { id: null, content: '', likes: 0 }
  
  // Real-time post updates
  const { post: realtimePost, isUpdating, lastUpdate, forceUpdate } = useRealtimePost(safeInitialPost?.id, safeInitialPost)
  
  // Ensure we always have a valid post object
  const post = realtimePost || safeInitialPost

  // Follow state
  const [isFollowing, setIsFollowing] = useState(false)

  // Format timestamp relative to current time
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (diff < 60000) return 'Ã€ l\'instant';
    if (diff < 3600000) return `Il y a ${Math.floor(diff / 60000)} min`;
    if (diff < 86400000) return `Il y a ${Math.floor(diff / 3600000)} h`;
    if (days === 1) return 'Hier';
    if (days < 7) return `Il y a ${days} j`;
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
  };

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
      like: '#bfbceedb',
      love: '#ffffff',
      haha: '#FFA500',
      wow: '#c04586',
      sad: '#6bdc4f',
      solidarity: '#10B981'
    }
    return colors[type] || '#0B3D91'
  }

  // Map emojis to FontAwesome icon classes
  const emojiToFontAwesome = {
    'ðŸ˜Š': 'fas fa-smile',
    'ðŸ˜”': 'fas fa-frown',
    'ðŸ˜': 'fas fa-heart-eyes',
    'ðŸ˜¡': 'fas fa-angry',
    'ðŸ˜´': 'fas fa-tired',
    'ðŸ¤”': 'fas fa-thinking',
    'ðŸŽ‰': 'fas fa-party-popper',
    'ðŸ˜Ž': 'fas fa-grin-stars',
    'ðŸ˜…': 'fas fa-grin-sweat',
    'ðŸ˜¢': 'fas fa-sad-tear'
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

    const locationRegex = /ðŸ“\s+([^ðŸ“\n]+)/g
    let locationMatch
    while ((locationMatch = locationRegex.exec(content)) !== null) {
      locations.push(locationMatch[1].trim())
    }

    const feelingRegex = /(ðŸ˜Š|ðŸ˜”|ðŸ˜|ðŸ˜¡|ðŸ˜´|ðŸ¤”|ðŸŽ‰|ðŸ˜Ž|ðŸ˜…|ðŸ˜¢)\s+(\w+)/g
    let feelingMatch
    while ((feelingMatch = feelingRegex.exec(content)) !== null) {
      feelings.push({ emoji: feelingMatch[1], label: feelingMatch[2], icon: emojiToFontAwesome[feelingMatch[1]] })
    }

    return { tags, feelings, locations }
  }

  function cleanContent(content) {
    let cleaned = content
    cleaned = cleaned.replace(/@\w+\s*/g, '')
    cleaned = cleaned.replace(/ðŸ“\s+[^ðŸ“\n]+/g, '')
    cleaned = cleaned.replace(/(ðŸ˜Š|ðŸ˜”|ðŸ˜|ðŸ˜¡|ðŸ˜´|ðŸ¤”|ðŸŽ‰|ðŸ˜Ž|ðŸ˜…|ðŸ˜¢)\s+\w+\s*/g, '')
    return cleaned.trim()
  }

  const metadata = parsePostMetadata(post.content || '')
  const cleanedContent = cleanContent(editedContent)

  // Load follow status
  useEffect(() => {
    try {
      const arr = JSON.parse(localStorage.getItem('followedPages') || '[]')
      setIsFollowing(arr.includes(page?.id))
    } catch (e) {}
  }, [page?.id])

  const toggleFollowPage = () => {
    try {
      const arr = JSON.parse(localStorage.getItem('followedPages') || '[]')
      if (isFollowing) {
        const updated = arr.filter(id => id !== page?.id)
        localStorage.setItem('followedPages', JSON.stringify(updated))
      } else {
        arr.push(page?.id)
        localStorage.setItem('followedPages', JSON.stringify([...new Set(arr)]))
      }
      setIsFollowing(!isFollowing)
    } catch (e) {}
  }

  // Close menu on outside click
  useEffect(() => {
    const handler = e => {
      if (menuOpen && cardRef.current && !cardRef.current.contains(e.target)) {
        setMenuOpen(false)
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

  }, [post.id])

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
    const newLiked = !isCurrently
    const newType = newLiked ? type : null
    setReactionType(newType)
    setLiked(newLiked)
    setLikesCount(c => newLiked ? c + 1 : Math.max(0, c - 1))

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
      case 'love': return <span style={commonStyle}>â¤ï¸</span>
      case 'haha': return <span style={commonStyle}>ðŸ˜‚</span>
      case 'wow': return <span style={commonStyle}>ðŸ˜®</span>
      case 'sad': return <span style={commonStyle}>ðŸ˜¢</span>
      case 'solidarity': return <span style={commonStyle}>ðŸ¤</span>
      default: return null
    }
  }


  // Truncate content for preview
  const shouldTruncate = cleanedContent && cleanedContent.length > 300
  const displayContent = shouldTruncate && !expanded 
    ? cleanedContent.substring(0, 300) + '...' 
    : (cleanedContent || '')

  // Early return if no valid post (after all hooks)
  if (!post || (!post.id && !post.content)) {
    return null
  }

  return (
    <>
      <article ref={cardRef} className="linkedin-post-card page-post-card" id={`post-${post.id}`}>
        {/* Post Header - Page Version */}
        <div className="post-header">
          {isUpdating && (
            <div className="realtime-indicator" title="Mise Ã  jour en cours...">
              <i className="fas fa-sync-alt fa-spin"></i>
            </div>
          )}
          <div className="post-author-section">
            <div className="page-post-avatar">
              <img 
                src={page?.profileImage || '/images/default-page.png'} 
                alt={page?.name || 'Page'}
                className="page-avatar-img"
              />
            </div>
            <div className="post-author-info">
              <div className="author-name-row">
                <span className="author-name page-name">
                  {page?.name || post.author?.name || ''}
                </span>
                <button 
                  className={`follow-page-btn ${isFollowing ? 'following' : ''}`}
                  onClick={(e) => { e.stopPropagation(); toggleFollowPage(); }}
                >
                  {isFollowing ? (
                    <><i className="fas fa-check"></i> Suivi</>
                  ) : (
                    <><i className="fas fa-plus"></i> Suivre</>
                  )}
                </button>
              </div>
              <div className="post-meta">
                <span className="post-time">{formatTime(post.createdAt || post.date)}</span>
                <span className="meta-dot">Â·</span>
                <span className="post-privacy">
                  <i className={`fas fa-${post.privacy || 'globe'}`}></i>
                  {post.privacy === 'user' ? 'PrivÃ©' : post.privacy === 'friends' ? 'Amis' : 'Public'}
                </span>
              </div>
            </div>
          </div>
          <div className="post-header-actions">
            <button className="post-menu-btn" onClick={() => setMenuOpen(!menuOpen)} aria-label="Plus d'options">
              <i className="fas fa-ellipsis-h"></i>
            </button>
            {menuOpen && (
              <div className="post-menu-dropdown">
                <button className="menu-item" onClick={() => { toggle(); setMenuOpen(false) }}>
                  <i className={`fa${saved ? 's' : 'r'} fa-bookmark`}></i>
                  <span>{saved ? 'EnregistrÃ©' : 'Enregistrer'}</span>
                </button>
                <button className="menu-item" onClick={() => { toggleNotifications(); setMenuOpen(false) }}>
                  <i className={`fas fa-${notificationsEnabled ? 'bell-slash' : 'bell'}`}></i>
                  <span>{notificationsEnabled ? 'DÃ©sactiver notifications' : 'Activer notifications'}</span>
                </button>
                <button className="menu-item" onClick={() => { toggleHidePost(); setMenuOpen(false) }}>
                  <i className="fas fa-eye-slash"></i>
                  <span>{isHidden ? 'Afficher la publication' : 'Masquer la publication'}</span>
                </button>
                <div className="menu-divider"></div>
                <button className="menu-item" onClick={() => { setReportOpen(true); setMenuOpen(false) }}>
                  <i className="fas fa-flag"></i>
                  <span>Signaler cette publication</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Post Content - Identique Ã  PostCard standard */}
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
          {(post.media || post.image || post.video || (post.images && post.images.length > 0)) && (
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
              ) : post.images && post.images.length > 0 ? (
                post.images.map((img, idx) => (
                  <img key={idx} src={img} alt={`post image ${idx + 1}`} loading="lazy" />
                ))
              ) : null}
            </div>
          )}
        </div>

        {/* Engagement Stats - Identique */}
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

        {/* Action Buttons - EXACTEMENT les mÃªmes que PostCard */}
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
          </div>

        </div>

        {/* Comments Section - Identique */}
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
                  placeholder={replyTo ? `RÃ©pondre Ã  ${replyTo.author}...` : 'Ajouter un commentaire...'}
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
                <span>RÃ©ponse Ã  <strong>{replyTo.author}</strong></span>
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
                          J'aime{comment.likes > 0 ? ` Â· ${comment.likes}` : ''}
                        </button>
                        <button className="comment-action-btn" onClick={() => handleReply(comment)}>
                          RÃ©pondre
                        </button>
                        <span className="comment-time">{comment.date || 'Ã€ l\'instant'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-comments">
                <p>Aucun commentaire pour le moment. Soyez le premier Ã  commenter !</p>
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
                  placeholder="DÃ©crivez la raison de votre signalement..."
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

      <style jsx>{`
        .page-post-avatar {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          overflow: hidden;
          flex-shrink: 0;
        }
        
        .page-avatar-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .follow-page-btn {
          margin-left: 12px;
          padding: 6px 14px;
          border: none;
          border-radius: 18px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #003d5c;
          color: white;
        }
        
        .follow-page-btn:hover {
          background: #002244;
        }
        
        .follow-page-btn.following {
          background: #e4e6eb;
          color: #050505;
        }
        
        .follow-page-btn.following:hover {
          background: #d8dadf;
        }
        
        .page-name {
          font-weight: 700;
        }
        
        .author-name-row {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 8px;
        }
      `}</style>
    </>
  )
}

