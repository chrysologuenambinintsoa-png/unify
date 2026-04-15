import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/router'
import ClickableAvatar from './ClickableAvatar'
import useSaved from '../hooks/useSaved'
import SkeletonCommentList from './SkeletonComment'
import EmojiPicker from './EmojiPicker'
import { Icons } from './Icons'

export default function PostViewer({ post, onClose, onDelete }) {
  const router = useRouter()
  const cardRef = useRef(null)
  const commentInputRef = useRef(null)
  const hideTimeoutRef = useRef(null)

  // State management
  const [currentUser, setCurrentUser] = useState(null)
  const [comments, setComments] = useState(Array.isArray(post?.commentsList) ? post?.commentsList : [])
  const [commentInput, setCommentInput] = useState('')
  const [commentsOpen, setCommentsOpen] = useState(true)
  const [commentsLoading, setCommentsLoading] = useState(false)
  const [replyTo, setReplyTo] = useState(null)
  const [commentLikes, setCommentLikes] = useState({})
  const [liked, setLiked] = useState(false)
  const [likesCount, setLikesCount] = useState(post?.likes || 0)
  const [reactionType, setReactionType] = useState(post?.reactionType || null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false)
  const [emojiPickerTimeout, setEmojiPickerTimeout] = useState(null)
  const [reactionHistory, setReactionHistory] = useState(Array.isArray(post?.reactionHistory) ? post.reactionHistory : [])
  const [menuOpen, setMenuOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [shareTargetType, setShareTargetType] = useState('friend')
  const [shareTarget, setShareTarget] = useState(null)
  const [friends, setFriends] = useState([])
  const [groups, setGroups] = useState([])
  const [mediaHovered, setMediaHovered] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const [reportReason, setReportReason] = useState('')

  const { saved, loading: saving, toggle } = useSaved(post?.id)
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

  const isAuthor = currentUser && post?.author === (currentUser.prenom || currentUser.nomUtilisateur || (currentUser.email || '').split('@')[0])

  // Sponsor tracking
  const trackSponsorClick = async () => {
    if (post?.isSponsor && post?.sponsorId) {
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

  // Navigation
  const navigateAuthor = () => {
    // If it's a sponsor post, redirect to sponsor link or Unify page
    if (post?.isSponsor) {
      if (post?.sponsorLink) {
        // Track the click before redirecting
        trackSponsorClick()
        window.open(post.sponsorLink, '_blank', 'noopener,noreferrer')
      } else {
        // Redirect to sponsor's Unify page
        router.push(`/profile?user=${encodeURIComponent(post?.author)}`)
      }
    } else if (post?.author) {
      router.push(`/profile?user=${encodeURIComponent(post.author)}`)
    }
  }

  // Picker functions
  function openPicker() {
    clearTimeout(hideTimeoutRef.current)
    setPickerOpen(true)
  }

  function closePicker() {
    hideTimeoutRef.current = setTimeout(() => setPickerOpen(false), 300)
  }

  const isTouchDevice = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0)

  const togglePickerForTouch = (e) => {
    e.stopPropagation()
    if (!isTouchDevice) return
    setPickerOpen(prev => !prev)
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
    }, 300)
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
    }, 300)
    setEmojiPickerTimeout(timeout)
  }

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && onClose) {
        if (!pickerOpen && !menuOpen && !shareOpen && !reportOpen) {
          onClose()
        }
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose, pickerOpen, menuOpen, shareOpen, reportOpen])

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [])

  // Load current user
  useEffect(() => {
    try {
      const userStr = localStorage.getItem('user')
      if (userStr) {
        const user = JSON.parse(userStr)
        setCurrentUser(user)
      }
    } catch (e) {
      console.error('Error loading user:', e)
    }
  }, [])

  // Load data
  useEffect(() => {
    if (post?.id) {
      try {
        const stored = JSON.parse(localStorage.getItem('postReactions') || '{}')
        const saved = stored[post.id]
        if (saved) {
          setReactionType(saved.type)
          setLiked(!!saved.liked)
          setReactionHistory(saved.history || [])
        }
      } catch (e) {}

      if (!post.commentsList || post.commentsList.length === 0) {
        setCommentsLoading(true)
        fetch(`/api/items/${post.id}/comments`)
          .then(r => r.json())
          .then(data => {
            if (Array.isArray(data)) setComments(data)
            else if (data && Array.isArray(data.comments)) setComments(data.comments)
            else setComments([])
          })
          .catch(() => {})
          .finally(() => setCommentsLoading(false))
      }
    }
  }, [post?.id])

  // Load friends for sharing
  useEffect(() => {
    if (shareOpen && currentUser?.email) {
      fetch(`/api/amis?userEmail=${encodeURIComponent(currentUser.email)}`)
        .then(r => r.json())
        .then(d => setFriends(d.amis || []))
        .catch(() => {})
    }
  }, [shareOpen, currentUser?.email])

  // Reaction handling
  async function handleReaction(type = 'like') {
    const isCurrently = reactionType === type
    const newLiked = !isCurrently
    const newType = newLiked ? type : null

    setReactionType(newType)
    setLiked(newLiked)
    setLikesCount(c => (newLiked ? c + 1 : Math.max(0, c - 1)))

    let newHistory = reactionHistory
    if (newLiked) {
      let filtered = reactionHistory.filter(t => t !== type)
      if (type === 'like') filtered = filtered.filter(t => t !== 'like')
      newHistory = [type, ...filtered].slice(0, 3)
      setReactionHistory(newHistory)
    } else {
      newHistory = []
      setReactionHistory([])
    }

    if (post?.id && !String(post.id).startsWith('temp-')) {
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
        console.error('reaction error:', e)
      }
    }

    if (post?.id) {
      try {
        const stored = JSON.parse(localStorage.getItem('postReactions') || '{}')
        stored[post.id] = { liked: newLiked, type: newType, history: newLiked ? newHistory : [] }
        localStorage.setItem('postReactions', JSON.stringify(stored))
      } catch (e) {}
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
      return arr.map(c =>
        c.id === comment.id ? { ...c, likes: (c.likes || 0) + (newVal ? 1 : -1) } : c
      )
    })

    if (post?.id && comment.id) {
      try {
        await fetch(`/api/items/${post.id}/comments/${comment.id}/reactions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: newVal ? 'like' : 'unlike' })
        })
      } catch (e) {
        console.error('comment like error:', e)
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

    if (post?.id) {
      const authorName = currentUser
        ? currentUser.prenom || currentUser.nomUtilisateur || (currentUser.email || '').split('@')[0]
        : 'Utilisateur'

      const bodyPayload = { author: authorName, text, authorEmail: currentUser?.email }
      if (parentId) bodyPayload.parentId = parentId

      try {
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
        }
      } catch (e) {
        console.error('comment error:', e)
      }
    }
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submitComment()
    }
  }

  // Share
  async function handleShare() {
    if (!shareTarget) return

    const message = `Partagé depuis Unify: ${post?.content?.substring(0, 100)}...`

    try {
      if (shareTargetType === 'friend' && shareTarget.email) {
        await fetch('/api/messages/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            senderEmail: currentUser.email,
            recipientEmail: shareTarget.email,
            text: message,
            postId: post.id
          })
        })
      } else if (shareTargetType === 'group') {
        console.log('Share to group:', shareTarget)
      }

      setShareOpen(false)
      setShareTarget(null)
    } catch (e) {
      console.error('Share error:', e)
    }
  }

  // Download media
  function downloadMedia() {
    const url = (post.media && post.media.url) || post.image
    if (!url) return
    let downloadUrl = url
    try {
      if (typeof url === 'string' && url.includes('cloudinary') && url.includes('/upload/')) {
        downloadUrl = url.replace('/upload/', '/upload/fl_attachment/')
      }
    } catch (e) {
      downloadUrl = url
    }

    const link = document.createElement('a')
    link.href = downloadUrl
    link.setAttribute('download', '')
    link.setAttribute('rel', 'noopener')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Set as avatar/cover
  async function setAs(type) {
    const url = (post.media && post.media.url) || post.image
    if (!url || !currentUser?.email) return
    try {
      const body = type === 'avatar' ? { avatarUrl: url } : { cover: url }
      const res = await fetch(`/api/user?userEmail=${encodeURIComponent(currentUser.email)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      if (res.ok) {
        const updated = await res.json()
        if (updated.user) {
          const cur = localStorage.getItem('user')
          if (cur) {
            try {
              const parsed = JSON.parse(cur)
              if (parsed.email === updated.user.email) {
                localStorage.setItem('user', JSON.stringify({ ...parsed, ...updated.user }))
                window.dispatchEvent(new Event('userUpdated'))
              }
            } catch (e) {}
          }
        }
        alert(type === 'avatar' ? 'Avatar mis à jour' : 'Photo de couverture mise à jour')
      } else {
        alert('Erreur lors de la mise à jour')
      }
    } catch (e) {
      console.error('set as error', e)
      alert('Erreur réseau')
    }
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

  if (!post) {
    return (
      <div className="pv-overlay" onClick={onClose}>
        <div className="pv-container">
          <div className="pv-empty">Post non trouvé</div>
        </div>
      </div>
    )
  }

  return (
    <div className="pv-overlay" onClick={onClose}>
      <div className="pv-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="pv-header">
          <h2 className="pv-header-title">Publication</h2>
          {onClose && (
            <button className="pv-close-btn" onClick={onClose} aria-label="Fermer">
              <i className="fas fa-times"></i>
            </button>
          )}
        </div>

        {/* Scrollable Content */}
        <div className="pv-scrollable">
          {/* Author Section */}
          <div className="pv-author">
            <div className="pv-author-row">
              {(() => {
                // Support post.author as object or string
                const authorName = typeof post.author === 'object' && post.author !== null ? post.author.name : post.author;
                const authorAvatar = typeof post.author === 'object' && post.author !== null ? post.author.avatar : post.avatarUrl || post.avatar;
                const userObj = post.authorUser ? {
                  prenom: post.authorUser.prenom || authorName,
                  nom: post.authorUser.nom,
                  nomUtilisateur: post.authorUser.nomUtilisateur || authorName,
                  email: post.authorUser.email,
                  avatarUrl: post.authorUser.avatarUrl || post.authorUser.avatar,
                  avatar: post.authorUser.avatar,
                  avatarBg: post.color
                } : {
                  prenom: authorName,
                  nomUtilisateur: authorName,
                  avatarUrl: authorAvatar,
                  avatar: authorAvatar,
                  avatarBg: post.color
                }
                return <ClickableAvatar user={userObj} size="medium" />
              })()}
              <div className="pv-author-info">
                <div className="pv-author-name-row">
                  <span className="pv-author-name" onClick={(e) => { e.stopPropagation(); navigateAuthor() }} style={{ cursor: 'pointer' }}>{typeof post.author === 'object' && post.author !== null ? post.author.name : post.author}</span>
                  {post.isVerified && (
                    <span className="pv-verified-badge" title="Compte vérifié">
                      <i className="fas fa-check"></i>
                    </span>
                  )}
                  {post.isSponsor && (
                    <span className="pv-sponsor-badge" onClick={(e) => { e.stopPropagation(); navigateAuthor() }} style={{ cursor: 'pointer' }}>
                      <i className="fas fa-star"></i>
                      Sponsorisé
                    </span>
                  )}
                </div>
                <div className="pv-meta">
                  <span className="pv-time">{post.date}</span>
                  {post.privacy && (
                    <span className="pv-privacy">
                      <i className={`fas fa-${post.privacy}`}></i>
                      {post.privacy === 'user' ? 'Privé' : post.privacy === 'friends' ? 'Amis' : 'Public'}
                    </span>
                  )}
                </div>
              </div>
              <div className="pv-menu-wrapper">
                <button className="pv-menu-btn" onClick={() => setMenuOpen(!menuOpen)}>
                  <i className="fas fa-ellipsis-h"></i>
                </button>
                {menuOpen && (
                  <div className="pv-menu-dropdown">
                    <button className="pv-menu-item" onClick={() => { toggle(); setMenuOpen(false) }}>
                      <i className={`fa${saved ? 's' : 'r'} fa-bookmark`}></i>
                      <span>{saved ? 'Enregistré' : 'Enregistrer'}</span>
                    </button>
                    {((post.media && post.media.url) || post.image) && (
                      <button className="pv-menu-item" onClick={() => { downloadMedia(); setMenuOpen(false) }}>
                        <i className="fas fa-download"></i>
                        <span>Télécharger</span>
                      </button>
                    )}
                    <button className="pv-menu-item" onClick={() => { setReportOpen(true); setMenuOpen(false) }}>
                      <i className="fas fa-flag"></i>
                      <span>Signaler</span>
                    </button>
                    {isAuthor && post.id && !String(post.id).startsWith('photo-') && (
                      <>
                        <div className="pv-menu-divider"></div>
                        {((post.media && post.media.url) || post.image) && (
                          <>
                            <button className="pv-menu-item" onClick={() => { setAs('avatar'); setMenuOpen(false) }}>
                              <i className="fas fa-user-circle"></i>
                              <span>Définir comme avatar</span>
                            </button>
                            <button className="pv-menu-item" onClick={() => { setAs('cover'); setMenuOpen(false) }}>
                              <i className="fas fa-image"></i>
                              <span>Définir comme couverture</span>
                            </button>
                          </>
                        )}
                        <button className="pv-menu-item danger" onClick={async () => { if (onDelete) await onDelete(post.id); setMenuOpen(false) }}>
                          <i className="fas fa-trash"></i>
                          <span>Supprimer</span>
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="pv-content">
            {(!post.media && !post.image && (post.backgroundColor || post.textColor || post.backgroundImage)) ? (
              <div className="pv-text-bg" style={{ 
                background: post.backgroundImage 
                  ? `url(${post.backgroundImage}) center/cover` 
                  : post.backgroundColor || 'transparent', 
                color: post.textColor || 'inherit' 
              }}>
                {post.content}
              </div>
            ) : (
              <p className="pv-text">{post.content}</p>
            )}

            {/* Media */}
            {(post.media || post.image) && (
              <div
                className="pv-media-container"
                onMouseEnter={() => setMediaHovered(true)}
                onMouseLeave={() => setMediaHovered(false)}
              >
                {post.media ? (
                  post.media.type === 'image' ? (
                    <img src={post.media.url} alt="post media" />
                  ) : post.media.type === 'video' ? (
                    <video src={post.media.url} controls />
                  ) : null
                ) : post.image && typeof post.image === 'string' && (post.image.indexOf('data:') === 0 || post.image.indexOf('http') === 0) ? (
                  <img src={post.image} alt="post media" />
                ) : null}
                {mediaHovered && (
                  <div className="pv-media-overlay">
                    <button className="pv-download-btn" onClick={downloadMedia}>
                      <i className="fas fa-download"></i>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Engagement Bar */}
          <div className="pv-engagement">
            <div className="pv-reactions-count">
              {likesCount > 0 && reactionHistory.length > 0 && (() => {
                let disp = [...reactionHistory]
                if (disp.includes('like')) {
                  disp = ['like', ...disp.filter(t => t !== 'like')]
                }
                return (
                  <div className="pv-reaction-icons">
                    {disp.slice(0, 3).map((t, i) => (
                      <div
                        key={i}
                        className="pv-reaction-icon"
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
              <span className="pv-likes-count">{likesCount > 0 ? likesCount : ''}</span>
            </div>
            <div className="pv-engagement-right">
              <span className="pv-comments-count" onClick={() => setCommentsOpen(v => !v)}>
                {safeComments.length} {safeComments.length === 1 ? 'commentaire' : 'commentaires'}
              </span>
              <span className="pv-shares-count">{post.shares || 0} partages</span>
            </div>
          </div>

          {/* Actions */}
          <div className="pv-actions">
            {/* Facebook-Style Emoji Picker */}
            <div 
              className="pv-action-wrapper emoji-picker-wrapper"
              onMouseEnter={handleLikeButtonEnter}
              onMouseLeave={handleLikeButtonLeave}
            >
              <button
                className={`pv-action-btn like-btn ${liked ? 'active' : ''}`}
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
                  <i className={`fa${liked ? 's' : 'r'} fa-thumbs-up pv-action-icon`} style={{color: liked ? '#e74c3c' : 'white'}}></i>
                )}
                <span>{liked ? (reactionType === 'love' ? 'J\'adore' : reactionType === 'haha' ? 'Haha' : reactionType === 'sad' ? 'Triste' : reactionType === 'wow' ? 'Waooo' : reactionType === 'solidarity' ? 'Solidaire' : 'J\'aime') : 'J\'aime'}</span>
              </button>
              <div
                onMouseEnter={handleEmojiPickerEnter}
                onMouseLeave={handleEmojiPickerLeave}
              >
                <EmojiPicker
                  onSelect={handleReaction}
                  currentReaction={reactionType}
                  isOpen={emojiPickerOpen}
                  onClose={() => setEmojiPickerOpen(false)}
                />
              </div>
            </div>

            {/* Comment Button */}
            <button className="pv-action-btn" onClick={() => setCommentsOpen(v => !v)}>
              <i className="far fa-comment pv-action-icon"></i>
              <span>Commenter</span>
            </button>

            {/* Share Button */}
            <div className="pv-action-wrapper">
              <button className="pv-action-btn" onClick={() => setShareOpen(!shareOpen)}>
                <i className="fas fa-share pv-action-icon"></i>
                <span>Partager</span>
              </button>
              {shareOpen && (
                <div className="pv-share-dropdown">
                  <div className="pv-share-header">
                    <span>Partager avec</span>
                    <button className="pv-close-share" onClick={() => setShareOpen(false)}>
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                  <div className="pv-share-tabs">
                    <button
                      className={`pv-share-tab ${shareTargetType === 'friend' ? 'active' : ''}`}
                      onClick={() => setShareTargetType('friend')}
                    >
                      Amis
                    </button>
                    <button
                      className={`pv-share-tab ${shareTargetType === 'group' ? 'active' : ''}`}
                      onClick={() => setShareTargetType('group')}
                    >
                      Groupes
                    </button>
                  </div>
                  <div className="pv-share-list">
                    {shareTargetType === 'friend' ? (
                      friends.length > 0 ? (
                        friends.map((friend, i) => (
                          <div key={i} className="pv-share-item" onClick={() => { setShareTarget(friend); handleShare() }}>
                            <div className="pv-share-avatar">
                              {friend.avatarUrl || friend.avatar ? (
                                <img src={friend.avatarUrl || friend.avatar} alt="" />
                              ) : (
                                <div className="pv-share-avatar-placeholder" style={{ background: friend.color || '#667eea' }}>
                                  {(friend.prenom || friend.nomUtilisateur || '?')[0]}
                                </div>
                              )}
                            </div>
                            <span className="pv-share-name">{friend.prenom || friend.nomUtilisateur}</span>
                          </div>
                        ))
                      ) : (
                        <div className="pv-share-empty">Aucun ami trouvé</div>
                      )
                    ) : (
                      <div className="pv-share-empty">Aucun groupe disponible</div>
                    )}
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Comments Section */}
          {commentsOpen && (
            <div className="pv-comments-section">
              {/* Comment Input */}
              <div className="pv-comment-input-wrapper">
                <div className="pv-comment-input-avatar">
                  {(() => {
                    if (currentUser?.avatarUrl || currentUser?.avatar) {
                      return <img src={currentUser.avatarUrl || currentUser.avatar} alt="" />
                    }
                    return (
                      <div className="pv-comment-avatar-placeholder">
                        {currentUser?.prenom ? currentUser.prenom[0] : currentUser?.nomUtilisateur ? currentUser.nomUtilisateur[0] : 'U'}
                      </div>
                    )
                  })()}
                </div>
                <div className="pv-comment-input-container">
                  <input
                    ref={commentInputRef}
                    type="text"
                    placeholder={replyTo ? `Répondre à ${replyTo.author}...` : 'Ajouter un commentaire...'}
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                    onKeyDown={handleKey}
                    className="pv-comment-input"
                  />
                  <button
                    className="pv-comment-submit-btn"
                    onClick={submitComment}
                    disabled={!commentInput.trim()}
                  >
                    <i className="fas fa-paper-plane"></i>
                  </button>
                </div>
              </div>

              {/* Reply indicator */}
              {replyTo && (
                <div className="pv-reply-indicator">
                  <span>Réponse à <strong>{replyTo.author}</strong></span>
                  <button className="pv-cancel-reply" onClick={() => setReplyTo(null)}>
                    <i className="fas fa-times"></i>
                  </button>
                </div>
              )}

              {/* Comments List */}
              {commentsLoading ? (
                <SkeletonCommentList count={3} />
              ) : safeComments.length > 0 ? (
                <div className="pv-comments-list">
                  {safeComments.map((comment, index) => (
                    <div key={comment.id || index} className="pv-comment-item">
                      <div className="pv-comment-avatar">
                        {comment.avatarUrl || comment.avatar ? (
                          <img src={comment.avatarUrl || comment.avatar} alt="" />
                        ) : (
                          <div className="pv-comment-avatar-placeholder" style={{ background: comment.color || '#667eea' }}>
                            {comment.initials || comment.author?.[0] || '?'}
                          </div>
                        )}
                      </div>
                      <div className="pv-comment-content">
                        <div className="pv-comment-bubble">
                          <span className="pv-comment-author">{comment.author}</span>
                          <p className="pv-comment-text">{comment.text}</p>
                        </div>
                        <div className="pv-comment-actions">
                          <button
                            className={`pv-comment-action-btn ${commentLikes[comment.id] ? 'liked' : ''}`}
                            onClick={() => toggleCommentLike(comment)}
                          >
                            J'aime{comment.likes > 0 ? ` · ${comment.likes}` : ''}
                          </button>
                          <button className="pv-comment-action-btn" onClick={() => handleReply(comment)}>
                            Répondre
                          </button>
                          <span className="pv-comment-time">{comment.date || 'À l\'instant'}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="pv-no-comments">
                  <p>Aucun commentaire pour le moment. Soyez le premier à commenter !</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Report Modal */}
        {reportOpen && (
          <div className="pv-report-overlay" onClick={() => setReportOpen(false)}>
            <div className="pv-report-modal" onClick={(e) => e.stopPropagation()}>
              <div className="pv-report-header">
                <h3>Signaler cette publication</h3>
                <button className="pv-close-report" onClick={() => setReportOpen(false)}>
                  <i className="fas fa-times"></i>
                </button>
              </div>
              <div className="pv-report-body">
                <textarea
                  placeholder="Décrivez la raison de votre signalement..."
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="pv-report-textarea"
                  rows={4}
                />
              </div>
              <div className="pv-report-footer">
                <button className="pv-btn-cancel" onClick={() => setReportOpen(false)}>
                  Annuler
                </button>
                <button className="pv-btn-submit" onClick={submitReport} disabled={!reportReason.trim()}>
                  Envoyer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
