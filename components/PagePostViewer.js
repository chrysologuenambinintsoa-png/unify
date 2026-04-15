'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faThumbsUp, faHeart, faComment, faShare, faXmark } from '@fortawesome/free-solid-svg-icons'
import ClickableAvatar from './ClickableAvatar'
import SkeletonCommentList from './SkeletonComment'
import EmojiPicker from './EmojiPicker'
import { Icons } from './Icons'

export default function PagePostViewer({ post, onClose, onDelete, page }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [comments, setComments] = useState(Array.isArray(post?.commentsList) ? post?.commentsList : [])
  const [commentInput, setCommentInput] = useState('')
  const [commentsLoading, setCommentsLoading] = useState(false)
  const [commentLikes, setCommentLikes] = useState({})
  const [liked, setLiked] = useState(false)
  const [likesCount, setLikesCount] = useState(post?.likes || 0)
  const [sharesCount, setSharesCount] = useState(post?.shares || 0)
  const [reactionType, setReactionType] = useState(post?.reactionType || null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [reactionHistory, setReactionHistory] = useState([])
  const [menuOpen, setMenuOpen] = useState(false)
  const [mediaIndex, setMediaIndex] = useState(0)
  const [allMedia, setAllMedia] = useState([])
  const [showReactionPicker, setShowReactionPicker] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [shareFriends, setShareFriends] = useState([])
  const [shareGroups, setShareGroups] = useState([])
  const [shareLoading, setShareLoading] = useState(false)
  const [shareSearch, setShareSearch] = useState('')
  const [replyTo, setReplyTo] = useState(null)
  const [commentLiked, setCommentLiked] = useState({})
  const [mentionSearch, setMentionSearch] = useState('')
  const [showMentionList, setShowMentionList] = useState(false)
  const [mentionResults, setMentionResults] = useState([])
  const [saved, setSaved] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [commentImage, setCommentImage] = useState(null)
  const [commentImagePreview, setCommentImagePreview] = useState(null)
  const hidePickerTimeout = useRef(null)

  const modalRef = useRef(null)
  const commentInputRef = useRef(null)
  const fileInputRef = useRef(null)

  const handleMouseEnterPicker = () => {
    if (hidePickerTimeout.current) clearTimeout(hidePickerTimeout.current)
    setShowReactionPicker(true)
  }

  const handleMouseLeavePicker = () => {
    hidePickerTimeout.current = setTimeout(() => {
      setShowReactionPicker(false)
    }, 200)
  }

  const getReactionLabel = (type) => {
    const labels = { like: 'J\'aime', love: 'Adore', haha: 'Haha', wow: 'Wahou', angry: 'Colère', sad: 'Triste' }
    return labels[type] || 'J\'aime'
  }

  const handleReactionSelect = async (type) => {
    if (!currentUser) return
    
    const isSameType = reactionType === type
    
    try {
      await fetch(`/api/pages/${page?.id}/posts/${post.id}/reactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: isSameType ? 'unlike' : type, userEmail: currentUser.email })
      })
      
      const newReactionType = isSameType ? null : type
      setReactionType(newReactionType)
      setLiked(!isSameType)
      
      const newHistory = isSameType 
        ? reactionHistory.filter(t => t !== type)
        : [type, ...reactionHistory.filter(t => t !== type)].slice(0, 3)
      setReactionHistory(newHistory)
      
      const stored = JSON.parse(localStorage.getItem('postReactions') || '{}')
      stored[post.id] = { type: newReactionType, liked: !isSameType, history: newHistory }
      localStorage.setItem('postReactions', JSON.stringify(stored))
      
      const res = await fetch(`/api/pages/${page?.id}/posts/${post.id}/reactions`)
      const data = await res.json()
      if (data && data.count !== undefined) {
        setLikesCount(data.count)
      } else if (data && data.likes !== undefined) {
        setLikesCount(data.likes)
      }
      if (data && data.reactions) {
        setReactionHistory(data.reactions)
      }
    } catch (e) {}
    setShowReactionPicker(false)
  }

  useEffect(() => {
    const user = localStorage.getItem('user')
    if (user) setCurrentUser(JSON.parse(user))
    
    const stored = JSON.parse(localStorage.getItem('postReactions') || '{}')
    if (stored[post?.id]) {
      setReactionType(stored[post.id].type)
      setReactionHistory(stored[post.id].history || [])
    } else if (post?.reactions && post.reactions.length > 0) {
      setReactionHistory(post.reactions)
    }
    
    setCommentsLoading(true)
    if (post?.id && page?.id) {
      fetch(`/api/pages/${page.id}/posts/${post.id}/comments`)
        .then(r => r.json())
        .then(data => setComments(Array.isArray(data) ? data : []))
        .catch(() => {})
        .finally(() => setCommentsLoading(false))

      fetch(`/api/pages/${page.id}/posts/${post.id}/reactions`)
        .then(r => r.json())
        .then(data => {
          if (data && data.count !== undefined) {
            setLikesCount(data.count)
          } else if (data && data.likes !== undefined) {
            setLikesCount(data.likes)
          }
          if (data && data.reactions) {
            setReactionHistory(data.reactions)
          }
        })
        .catch(() => {})
    }
    
    const media = []
    if (post?.media) media.push(post.media)
    if (post?.image) media.push({ type: 'image', url: post.image })
    if (post?.video) media.push({ type: 'video', url: post.video })
    if (post?.images) post.images.forEach(img => media.push({ type: 'image', url: img }))
    setAllMedia(media)

    fetch(`/api/pages/${page.id}/posts/${post.id}/share`)
      .then(r => r.json())
      .then(data => {
        if (data && data.shares !== undefined) {
          setSharesCount(data.shares)
        }
      })
      .catch(() => {})
  }, [post?.id])

  useEffect(() => {
    if (!showShareModal) return
    setShareLoading(true)
    const userEmail = currentUser?.email
    Promise.all([
      fetch(`/api/friends${userEmail ? `?userEmail=${encodeURIComponent(userEmail)}` : ''}`).then(r => r.json()).catch(() => ({ friends: [] })),
      fetch(`/api/groupes${userEmail ? `?userEmail=${encodeURIComponent(userEmail)}` : ''}`).then(r => r.json()).catch(() => ({ groupes: [] }))
    ]).then(([friendsData, groupsData]) => {
      setShareFriends(Array.isArray(friendsData.friends) ? friendsData.friends : [])
      setShareGroups(Array.isArray(groupsData.groupes) ? groupsData.groupes : [])
    }).finally(() => setShareLoading(false))
  }, [showShareModal, currentUser])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft' && mediaIndex > 0) setMediaIndex(mediaIndex - 1)
      if (e.key === 'ArrowRight' && mediaIndex < allMedia.length - 1) setMediaIndex(mediaIndex + 1)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [mediaIndex, allMedia.length, onClose])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuOpen && !e.target.closest('.viewer-menu-dropdown') && !e.target.closest('.viewer-menu-btn')) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [menuOpen])

  const handleLike = async () => {
    if (!currentUser) return
    
    const isLike = reactionType === 'like'
    
    try {
      await fetch(`/api/pages/${page?.id}/posts/${post.id}/reactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: isLike ? 'unlike' : 'like', userEmail: currentUser.email })
      })
      
      const newReactionType = isLike ? null : 'like'
      setReactionType(newReactionType)
      setLiked(!isLike)
      
      const newHistory = isLike 
        ? reactionHistory.filter(t => t !== 'like')
        : ['like', ...reactionHistory.filter(t => t !== 'like')].slice(0, 3)
      setReactionHistory(newHistory)
      
      const stored = JSON.parse(localStorage.getItem('postReactions') || '{}')
      stored[post.id] = { type: newReactionType, liked: !isLike, history: newHistory }
      localStorage.setItem('postReactions', JSON.stringify(stored))
      
      const res = await fetch(`/api/pages/${page?.id}/posts/${post.id}/reactions`)
      const data = await res.json()
      if (data && data.count !== undefined) {
        setLikesCount(data.count)
      } else if (data && data.likes !== undefined) {
        setLikesCount(data.likes)
      }
      if (data && data.reactions) {
        setReactionHistory(data.reactions)
      }
    } catch (e) {}
  }

  const handleShare = async () => {
    setShowShareModal(true)
  }

  const handleShareToFriend = async (friend) => {
    try {
      await fetch(`/api/pages/${page?.id}/posts/${post.id}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          type: 'friend', 
          to: friend.email || friend.id,
          senderEmail: currentUser?.email,
          senderName: currentUser?.prenom || currentUser?.nomUtilisateur || currentUser?.email
        })
      })
      setSharesCount(prev => prev + 1)
      setShowShareModal(false)
      alert(`Publication partagée à ${friend.prenom || friend.nom ? `${friend.prenom || ''} ${friend.nom || ''}`.trim() : friend.email}`)
    } catch (e) {
      alert('Erreur lors du partage')
    }
  }

  const handleShareToGroup = async (group) => {
    try {
      await fetch(`/api/pages/${page?.id}/posts/${post.id}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          type: 'group', 
          to: group.id,
          senderEmail: currentUser?.email,
          senderName: currentUser?.prenom || currentUser?.nomUtilisateur || currentUser?.email
        })
      })
      setSharesCount(prev => prev + 1)
      setShowShareModal(false)
      alert(`Publication partagée dans ${group.name}`)
    } catch (e) {
      alert('Erreur lors du partage')
    }
  }

  const handleCopyLink = async () => {
    const shareUrl = `${window.location.origin}/posts/${post.id}`
    try {
      await navigator.clipboard.writeText(shareUrl)
      try {
        await fetch(`/api/pages/${page?.id}/posts/${post.id}/share`, { method: 'POST' })
        setSharesCount(prev => prev + 1)
      } catch (e) {}
      alert('Lien copié dans le presse-papiers!')
    } catch (e) {
      alert('Erreur lors de la copie du lien')
    }
  }

  const handleShareToSocial = async (platform) => {
    if (!post?.id) return
    const shareUrl = `${window.location.origin}/posts/${post.id}`
    const shareText = `Découvrez cette publication: ${post.content?.substring(0, 100) || ''}`
    
    let url = ''
    switch (platform) {
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`
        break
      case 'twitter':
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`
        break
      case 'whatsapp':
        url = `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`
        break
      case 'linkedin':
        url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`
        break
      case 'reddit':
        url = `https://reddit.com/submit?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(shareText)}`
        break
      default:
        return
    }
    
    if (url) {
      window.open(url, '_blank', 'width=600,height=400')
      try {
        await fetch(`/api/pages/${page?.id}/posts/${post.id}/share`, { method: 'POST' })
        setSharesCount(prev => prev + 1)
      } catch (e) {}
    }
  }

  const submitReport = async () => {
    if (!reportReason.trim()) return
    try {
      await fetch('/api/items/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: post.id, reason: reportReason, author: post.authorEmail || post.author, pageId: page?.id })
      })
      setReportOpen(false)
      setReportReason('')
      alert('Merci pour votre signalement')
    } catch (e) {
      console.error('Report error', e)
      alert('Erreur lors du signalement')
    }
  }

  const handleComment = async () => {
    if (!currentUser?.email || (!commentInput.trim() && !commentImage)) {
      alert('Veuillez vous connecter pour commenter')
      return
    }
    try {
      const formData = new FormData()
      formData.append('text', commentInput)
      formData.append('authorEmail', currentUser.email)
      if (replyTo?.id) {
        formData.append('parentId', replyTo.id)
      }
      if (commentImage) {
        formData.append('image', commentImage)
      }

      const res = await fetch(`/api/pages/${page?.id}/posts/${post.id}/comments`, {
        method: 'POST',
        body: formData
      })
      const newComment = await res.json()
      if (res.ok && newComment?.id) {
        setComments(prev => [...prev, newComment])
        setCommentInput('')
        setReplyTo(null)
        setCommentImage(null)
        setCommentImagePreview(null)
      } else {
        console.error('Comment error:', newComment)
      }
    } catch (e) {
      console.error('Comment fetch error:', e)
    }
  }

const handleCommentLike = async (commentId) => {
    if (!currentUser) return
    const isLiked = commentLiked[commentId]
    try {
      await fetch(`/api/pages/${page?.id}/posts/${post.id}/comments/${commentId}/reactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: isLiked ? 'unlike' : 'like', userEmail: currentUser.email })
      })
      setCommentLikes(prev => ({ ...prev, [commentId]: (prev[commentId] || 0) + (isLiked ? -1 : 1) }))
      setCommentLiked(prev => ({ ...prev, [commentId]: !isLiked }))
    } catch (e) {
      setCommentLikes(prev => ({ ...prev, [commentId]: (prev[commentId] || 0) + (isLiked ? -1 : 1) }))
      setCommentLiked(prev => ({ ...prev, [commentId]: !isLiked }))
    }
  }

  const handleReply = (comment) => {
    const replyText = `@${comment.authorEmail?.split('@')[0]} `
    setCommentInput(replyText)
    setReplyTo({ id: comment.id, authorEmail: comment.authorEmail })
    commentInputRef.current?.focus()
  }

  const handleMentionSearch = async (query) => {
    setMentionSearch(query)
    if (query.startsWith('@') && query.length > 1) {
      try {
        const search = query.slice(1)
        const res = await fetch(`/api/search?type=user&q=${encodeURIComponent(search)}`)
        const data = await res.json()
        setMentionResults(data.users?.slice(0, 5) || [])
        setShowMentionList(true)
      } catch (e) {}
    } else {
      setShowMentionList(false)
    }
  }

  const insertMention = (user) => {
    const mention = `@${user.prenom || user.email.split('@')[0]} `
    setCommentInput(prev => prev.replace(/@[\w]*$/, mention))
    setShowMentionList(false)
    setMentionSearch('')
    commentInputRef.current?.focus()
  }

  const cancelReply = () => {
    setReplyTo(null)
    setCommentInput('')
  }

  const formatTime = (timestamp) => {
    if (!timestamp) return ''
    const date = new Date(timestamp)
    if (isNaN(date.getTime())) return ''
    const now = new Date()
    const diff = now - date
    if (diff < 60000) return "A l'instant"
    if (diff < 3600000) return `Il y a ${Math.floor(diff / 60000)} min`
    if (diff < 86400000) return `Il y a ${Math.floor(diff / 3600000)} h`
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
  }

  const getReactionEmoji = (type) => {
    const reactions = { like: 'like', love: 'love', haha: 'haha', wow: 'wow', sad: 'sad', angry: 'angry' }
    return reactions[type] || 'like'
  }

  const getReactionIcon = (type) => {
    const iconStyle = { fontSize: 12, color: '#fff' }
    switch(type) {
      case 'like': return <FontAwesomeIcon icon={faThumbsUp} style={iconStyle} />
      case 'love': return <FontAwesomeIcon icon={faHeart} style={iconStyle} />
      case 'haha': return <span style={{ fontSize: 12 }}>😂</span>
      case 'wow': return <span style={{ fontSize: 12 }}>😮</span>
      case 'sad': return <span style={{ fontSize: 12 }}>😢</span>
      case 'angry': return <span style={{ fontSize: 12 }}>😡</span>
      default: return <FontAwesomeIcon icon={faThumbsUp} style={iconStyle} />
    }
  }

  const getReactionBgColor = (type) => {
    const colors = { like: '#1877f2', love: '#e41e3f', haha: '#f7b928', wow: '#f7b928', sad: '#6b7280', angry: '#e41e3f' }
    return colors[type] || '#1877f2'
  }

  const currentMedia = allMedia[mediaIndex]

  return (
    <div className="post-viewer-overlay" onClick={onClose}>
      <div className="post-viewer-container" onClick={e => e.stopPropagation()} ref={modalRef}>
        <button className="viewer-close-btn" onClick={onClose}>
          <FontAwesomeIcon icon={faXmark} />
        </button>

        <div className="viewer-content">
          <div className="viewer-media-section">
            {currentMedia ? (
              currentMedia.type === 'video' ? (
                <video src={currentMedia.url} controls className="viewer-media" />
              ) : (
                <img src={currentMedia.url} alt="post media" className="viewer-media" />
              )
            ) : (
              <div className="viewer-no-media">Aucun média</div>
            )}
            
            {allMedia.length > 1 && (
              <div className="viewer-media-nav">
                <button onClick={() => setMediaIndex(Math.max(0, mediaIndex - 1))} disabled={mediaIndex === 0}>
                  <Icons.ChevronLeft />
                </button>
                <span>{mediaIndex + 1} / {allMedia.length}</span>
                <button onClick={() => setMediaIndex(Math.min(allMedia.length - 1, mediaIndex + 1))} disabled={mediaIndex === allMedia.length - 1}>
                  <Icons.ChevronRight />
                </button>
              </div>
            )}
          </div>

          <div className="viewer-sidebar">
            <div className="viewer-header">
              <div className="viewer-author">
                <img src={page?.profileImage || '/images/default-page.png'} alt={page?.name} className="viewer-avatar" />
                <div className="viewer-author-info">
                  <span className="viewer-author-name">{page?.name || post?.author?.name}</span>
                  <span className="viewer-post-time">{formatTime(post?.createdAt)}</span>
                </div>
              </div>
              <button className="viewer-menu-btn" onClick={() => setMenuOpen(!menuOpen)} aria-label="Plus d'options">
                <Icons.MoreHorizontal />
              </button>
              {menuOpen && (
                <div className="viewer-menu-dropdown">
                  <button className="menu-item" onClick={() => { setSaved(!saved); setMenuOpen(false) }}>
                    <i className={`fas fa-${saved ? 's' : 'r'} fa-bookmark`}></i>
                    <span>{saved ? 'Enregistré' : 'Enregistrer'}</span>
                  </button>
                  <button className="menu-item" onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/pages/${page?.id}/posts/${post?.id}`); alert('Lien copié!'); setMenuOpen(false) }}>
                    <i className="fas fa-link"></i>
                    <span>Copier le lien</span>
                  </button>
                  {currentUser && (currentUser.email === page?.ownerEmail || currentUser.email === post?.authorEmail) && (
                    <>
                      <div className="menu-divider"></div>
                      <button className="menu-item danger" onClick={() => { if(onDelete) onDelete(post?.id); setMenuOpen(false) }}>
                        <i className="fas fa-trash"></i>
                        <span>Supprimer la publication</span>
                      </button>
                    </>
                  )}
                  <div className="menu-divider"></div>
                  <button className="menu-item" onClick={() => { setReportOpen(true); setMenuOpen(false) }}>
                    <i className="fas fa-flag"></i>
                    <span>Signaler cette publication</span>
                  </button>
                </div>
              )}
            </div>

            <div className="viewer-post-content">
              <p>{post?.content}</p>
            </div>

            <div className="viewer-engagement">
              <div className="viewer-reactions">
                {(likesCount > 0 || reactionHistory.length > 0) ? (() => {
                  const displayReactions = reactionHistory.length > 0 ? reactionHistory : ['like']
                  let disp = [...displayReactions]
                  if (disp.includes('like')) {
                    disp = ['like', ...disp.filter(t => t !== 'like')]
                  }
                  return (
                    <>
                      <div className="reaction-icons-stack">
                        {disp.slice(0, 3).map((t, i) => (
                          <span 
                            key={i} 
                            className="reaction-icon-mini"
                            style={{
                              background: getReactionBgColor(t),
                              zIndex: 3 - i
                            }}
                          >
                            {getReactionIcon(t)}
                          </span>
                        ))}
                      </div>
                      <span className="likes-count">{likesCount} J'aime</span>
                    </>
                  )
                })() : null}
              </div>
              <div className="engagement-right">
                <span className="comments-count">
                  {comments.length} {comments.length === 1 ? 'commentaire' : 'commentaires'}
                </span>
                <span className="shares-count">{sharesCount} partages</span>
              </div>
            </div>

            <div className="viewer-actions">
              <div className="reaction-picker-wrapper">
                <button 
                  className={`action-btn ${reactionType ? 'active' : ''}`} 
                  onClick={handleLike}
                  onMouseEnter={() => setShowReactionPicker(true)}
                  onMouseLeave={handleMouseLeavePicker}
                >
                  {reactionType === 'like' ? (
                    <span className="reaction-btn-icon like-icon"><FontAwesomeIcon icon={faThumbsUp} /></span>
                  ) : reactionType === 'love' ? (
                    <span className="reaction-btn-icon love-icon"><FontAwesomeIcon icon={faHeart} /></span>
                  ) : reactionType === 'haha' ? (
                    <span className="reaction-btn-icon haha-icon">😂</span>
                  ) : reactionType === 'wow' ? (
                    <span className="reaction-btn-icon wow-icon">😮</span>
                  ) : reactionType === 'sad' ? (
                    <span className="reaction-btn-icon sad-icon">😢</span>
                  ) : reactionType === 'angry' ? (
                    <span className="reaction-btn-icon angry-icon">😡</span>
                  ) : (
                    <FontAwesomeIcon icon={faThumbsUp} />
                  )}
                  <span>{reactionType ? getReactionLabel(reactionType) : 'J\'aime'}</span>
                </button>
                <div 
                  className="reaction-picker-container"
                  onMouseEnter={handleMouseEnterPicker}
                  onMouseLeave={handleMouseLeavePicker}
                >
                  {showReactionPicker && (
                    <div className="reaction-picker-popup">
                      <button 
                        className={`reaction-option reaction-like ${reactionType === 'like' ? 'active' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleReactionSelect('like')
                        }}
                      >
                        <FontAwesomeIcon icon={faThumbsUp} />
                      </button>
                      <button 
                        className={`reaction-option reaction-love ${reactionType === 'love' ? 'active' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleReactionSelect('love')
                        }}
                      >
                        <FontAwesomeIcon icon={faHeart} />
                      </button>
                      <button 
                        className={`reaction-option reaction-haha ${reactionType === 'haha' ? 'active' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleReactionSelect('haha')
                        }}
                      >
                        😂
                      </button>
                      <button 
                        className={`reaction-option reaction-wow ${reactionType === 'wow' ? 'active' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleReactionSelect('wow')
                        }}
                      >
                        😮
                      </button>
                      <button 
                        className={`reaction-option reaction-angry ${reactionType === 'angry' ? 'active' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleReactionSelect('angry')
                        }}
                      >
                        😡
                      </button>
                      <button 
                        className={`reaction-option reaction-sad ${reactionType === 'sad' ? 'active' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleReactionSelect('sad')
                        }}
                      >
                        😢
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <button className="action-btn" onClick={() => commentInputRef.current?.focus()}>
                <FontAwesomeIcon icon={faComment} />
                <span>Commenter</span>
              </button>
              <button className="action-btn" onClick={handleShare}>
                <FontAwesomeIcon icon={faShare} />
                <span>Partager</span>
              </button>
            </div>

            <div className="viewer-comments">
              <div className="comments-list">
                {commentsLoading ? (
                  <SkeletonCommentList count={3} />
                ) : comments.length === 0 ? (
                  <p className="no-comments">Aucun commentaire</p>
                ) : (
                  comments.map((comment, idx) => (
                    <div key={comment.id || idx} className="comment-item">
                      <ClickableAvatar user={{ email: comment.authorEmail, prenom: comment.authorEmail?.split('@')[0] }} size={32} />
                      <div className="comment-content">
                        <div className="comment-bubble">
                          <span className="comment-author">{comment.authorEmail?.split('@')[0] || 'Utilisateur'}</span>
                          {comment.parentId && <span className="comment-reply-to">en réponse à</span>}
                          <p className="comment-text">{comment.text}</p>
                          {comment.image && (
                            <img src={comment.image} alt="" className="comment-image" />
                          )}
                        </div>
                        <div className="comment-actions">
                          <button 
                            onClick={() => handleCommentLike(comment.id)}
                            className={commentLiked[comment.id] ? 'liked' : ''}
                          >
                            {commentLiked[comment.id] ? 'Aimé' : 'J\'aime'} {((comment.likes || 0) + (commentLikes[comment.id] || 0)) > 0 && `(${(comment.likes || 0) + (commentLikes[comment.id] || 0)})`}
                          </button>
                          <button onClick={() => handleReply(comment)}>Répondre</button>
                          <span className="comment-time">{formatTime(comment.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="comment-input-section">
                {replyTo && (
                  <div className="reply-indicator">
                    <span>En réponse à <strong>@{replyTo.authorEmail?.split('@')[0]}</strong></span>
                    <button onClick={cancelReply}>✕</button>
                  </div>
                )}
                {commentImagePreview && (
                  <div className="comment-image-preview">
                    <img src={commentImagePreview} alt="Preview" />
                    <button onClick={() => { setCommentImage(null); setCommentImagePreview(null) }}>✕</button>
                  </div>
                )}
                <div className="comment-input-main">
                  <ClickableAvatar user={currentUser} size={32} />
                  <div className="comment-input-wrapper">
                    <input
                      ref={commentInputRef}
                      type="text"
                      placeholder={replyTo ? "Écrire une réponse..." : "Écrire un commentaire... (@ pour mentionner)"}
                      value={commentInput}
                      onChange={(e) => {
                        setCommentInput(e.target.value)
                        if (e.target.value.includes('@')) {
                          handleMentionSearch(e.target.value)
                        }
                      }}
                      onKeyDown={(e) => e.key === 'Enter' && handleComment()}
                    />
                    {showMentionList && mentionResults.length > 0 && (
                      <div className="mention-list">
                        {mentionResults.map(user => (
                          <div key={user.id} className="mention-item" onClick={() => insertMention(user)}>
                            <ClickableAvatar user={user} size={24} />
                            <span>{user.prenom || user.email.split('@')[0]}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      ref={fileInputRef}
                      onChange={(e) => {
                        const file = e.target.files[0]
                        if (file) {
                          setCommentImage(file)
                          setCommentImagePreview(URL.createObjectURL(file))
                        }
                      }}
                      style={{ display: 'none' }}
                    />
                    <button 
                      className="image-upload-btn"
                      onClick={() => fileInputRef.current?.click()}
                      type="button"
                      title="Ajouter une photo"
                    >
                      <Icons.Image size={18} />
                    </button>
                    <button 
                      className={`emoji-picker-toggle ${pickerOpen ? 'active' : ''}`}
                      onClick={() => setPickerOpen(!pickerOpen)}
                      type="button"
                      title="Ajouter un emoji"
                    >
                      <Icons.Emoji size={18} />
                    </button>
                    {pickerOpen && (
                      <EmojiPicker
                        onSelect={(emoji) => {
                          setCommentInput(prev => prev + emoji)
                          setPickerOpen(false)
                          commentInputRef.current?.focus()
                        }}
                        currentReaction={null}
                        isOpen={pickerOpen}
                        onClose={() => setPickerOpen(false)}
                        position="bottom"
                      />
                    )}
                    <button className="comment-send-btn" onClick={handleComment} disabled={!commentInput.trim() && !commentImage}>
                      <Icons.Send />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .post-viewer-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.9);
          z-index: 9999;
          display: flex;
          align-items: stretch;
          justify-content: center;
          padding: 0;
          height: 100vh;
          width: 100vw;
        }

        .post-viewer-container {
          background: #fff;
          border-radius: 12px;
          max-width: 1200px;
          width: 100%;
          height: 100vh;
          min-height: 0;
          max-height: 100vh;
          overflow: hidden;
          position: relative;
          display: flex;
          flex-direction: row;
          flex: 1 1 0%;
        }

        .viewer-close-btn {
          position: absolute;
          top: 16px;
          right: 16px;
          z-index: 10;
          background: rgba(0, 0, 0, 0.5);
          border: none;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          color: #fff;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .viewer-content {
          display: flex;
          flex-direction: row;
          width: 100%;
          height: 100%;
          flex: 1 1 0%;
          min-height: 0;
        }

        .report-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
        }

        .report-modal {
          background: white;
          border-radius: 12px;
          width: 90%;
          max-width: 400px;
          overflow: hidden;
        }

        .report-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px;
          border-bottom: 1px solid #e5e7eb;
        }

        .report-modal-header h3 {
          margin: 0;
          font-size: 16px;
          color: #1f2937;
        }

        .close-report {
          background: none;
          border: none;
          font-size: 18px;
          cursor: pointer;
          color: #6b7280;
        }

        .report-modal-body {
          padding: 16px;
        }

        .report-textarea {
          width: 100%;
          padding: 12px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          font-size: 14px;
          resize: none;
          font-family: inherit;
        }

        .report-textarea:focus {
          outline: none;
          border-color: #1877f2;
        }

        .report-modal-footer {
          display: flex;
          gap: 12px;
          padding: 16px;
          border-top: 1px solid #e5e7eb;
        }

        .btn-cancel {
          flex: 1;
          padding: 10px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          background: white;
          cursor: pointer;
          font-size: 14px;
        }

        .btn-submit {
          flex: 1;
          padding: 10px;
          border: none;
          border-radius: 8px;
          background: #dc2626;
          color: white;
          cursor: pointer;
          font-size: 14px;
        }

        .btn-submit:disabled {
          background: #f3f4f6;
          color: #9ca3af;
          cursor: not-allowed;
        }

        .viewer-media-section {
          flex: 1;
          background: #000;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          min-width: 0;
        }

        .viewer-media {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
        }

        .viewer-no-media {
          color: #666;
          font-size: 18px;
        }

        .viewer-media-nav {
          position: absolute;
          bottom: 16px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          align-items: center;
          gap: 16px;
          background: rgba(0, 0, 0, 0.6);
          padding: 8px 16px;
          border-radius: 20px;
          color: #fff;
        }

        .viewer-media-nav button {
          background: none;
          border: none;
          color: #fff;
          cursor: pointer;
          padding: 4px;
        }

        .viewer-media-nav button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }



.viewer-sidebar {
  width: 650px;
  min-width: 500px;
  display: flex;
  flex-direction: column;
  border-left: 1px solid #e5e7eb;
  background: #fff;
  height: 100%;
  min-height: 0;
  max-height: 100vh;
  flex: 1 1 0%;
}

@media (max-width: 1200px) {
  .viewer-sidebar {
    width: 500px;
    min-width: 350px;
  }
}


        .viewer-comments {
          flex: 1 1 0%;
          min-height: 0;
          display: flex;
          flex-direction: column;
          width: 100%;
          height: 100%;
          overflow: hidden;
        }

        .viewer-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 56px 16px 16px; /* Ajoute de l'espace à droite pour le bouton close */
          border-bottom: 1px solid #e5e7eb;
          position: relative;
        }

        .viewer-author {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .viewer-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          object-fit: cover;
        }

        .viewer-author-info {
          display: flex;
          flex-direction: column;
        }

        .viewer-author-name {
          font-weight: 600;
          color: #1f2937;
        }

        .viewer-post-time {
          font-size: 12px;
          color: #6b7280;
        }

        .viewer-menu-btn {
          background: none;
          border: none;
          cursor: pointer;
          padding: 8px;
          color: #6b7280;
          position: relative;
          margin-right: 8px;
        }

.viewer-menu-dropdown {
          position: absolute;
          top: 100%;
          right: 8px;
          background: white;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          min-width: 220px;
          z-index: 100;
        }

        .viewer-menu-dropdown .menu-item {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          padding: 12px 16px;
          border: none;
          background: none;
          cursor: pointer;
          font-size: 14px;
          color: #1f2937;
          text-align: left;
        }

        .viewer-menu-dropdown .menu-item:hover {
          background: #f3f4f6;
        }

        .viewer-menu-dropdown .menu-item.danger {
          color: #dc2626;
        }

        .viewer-menu-dropdown .menu-item i {
          width: 20px;
          text-align: center;
        }

        .viewer-menu-dropdown .menu-divider {
          height: 1px;
          background: #e5e7eb;
          margin: 4px 0;
        }

        .viewer-menu-dropdown .delete-btn {
          color: #dc2626;
        }

        .menu-icon {
          font-size: 16px;
        }

        .viewer-post-content {
          padding: 16px;
          border-bottom: 1px solid #e5e7eb;
          max-height: 200px;
          overflow-y: auto;
        }

        .viewer-post-content p {
          margin: 0;
          color: #1f2937;
          line-height: 1.5;
        }

        .viewer-engagement {
          padding: 12px 16px;
          border-bottom: 1px solid #e5e7eb;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #f9fafb;
        }

        .viewer-reactions {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .reaction-icons-stack {
          display: flex;
          margin-right: 2px;
        }

        .reaction-icon-mini {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-left: -6px;
          border: 2px solid white;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
          transition: transform 0.2s ease;
          font-size: 14px;
        }

        .reaction-icon-mini:hover {
          transform: scale(1.15);
          z-index: 10;
        }

        .reaction-icon-mini:first-child {
          margin-left: 0;
        }

        .likes-count {
          font-size: 13px;
          color: rgba(0, 0, 0, 0.65);
          font-weight: 500;
        }

        .engagement-right {
          display: flex;
          gap: 12px;
        }

        .comments-count {
          color: #65676b;
          font-size: 14px;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 4px;
          transition: background 0.2s;
        }

        .comments-count:hover {
          background: #e5e7eb;
        }

        .shares-count {
          color: #65676b;
          font-size: 14px;
          padding: 4px 8px;
          border-radius: 4px;
          cursor: pointer;
          transition: background 0.2s;
        }

        .shares-count:hover {
          background: #e5e7eb;
        }

        .viewer-actions {
          display: flex;
          justify-content: space-around;
          padding: 12px 16px;
          border-bottom: 1px solid #e5e7eb;
        }

        .action-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          background: none;
          border: none;
          color: #6b7280;
          cursor: pointer;
          font-size: 14px;
          padding: 8px 12px;
          border-radius: 6px;
          transition: background 0.2s;
        }

        .action-btn:hover {
          background: #f3f4f6;
        }

        .action-btn.active {
          color: #2563eb;
        }

        .reaction-btn-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
        }

        .reaction-btn-icon.like-icon { color: #1877f2; }
        .reaction-btn-icon.love-icon { color: #e41e3f; }
        .reaction-btn-icon.haha-icon { }
        .reaction-btn-icon.wow-icon { }
        .reaction-btn-icon.sad-icon { }
        .reaction-btn-icon.angry-icon { }

        .reaction-picker-wrapper {
          position: relative;
          display: inline-block;
        }

        .reaction-picker-container {
          position: absolute;
          bottom: 0;
          left: 50%;
          transform: translateX(-35%);
          width: 220px;
          height: 100px;
        }

        .reaction-picker-popup {
          position: absolute;
          bottom: 100%;
          left: 20px;
          transform: translateX(0);
          display: flex;
          gap: 8px;
          background: #fff;
          padding: 8px 12px;
          border-radius: 24px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
          margin-bottom: 12px;
          animation: reactionPopIn 0.3s ease;
          z-index: 100;
        }

        @keyframes reactionPopIn {
          0% { opacity: 0; transform: translateY(10px) scale(0.5); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }

        .reaction-option {
          width: 48px;
          height: 48px;
          border: none;
          background: linear-gradient(145deg, #ffffff, #e6e6e6);
          border-radius: 50%;
          cursor: pointer;
          font-size: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.2s, background 0.2s;
          animation: reactionFloat 2s ease-in-out infinite;
          box-shadow: 
            0 4px 8px rgba(0, 0, 0, 0.15),
            0 2px 4px rgba(0, 0, 0, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 0.8);
          transform-style: preserve-3d;
          perspective: 500px;
        }

        .reaction-option:hover {
          transform: scale(1.4) rotateY(10deg) rotateX(5deg);
          box-shadow: 
            0 8px 16px rgba(0, 0, 0, 0.2),
            0 4px 8px rgba(0, 0, 0, 0.15),
            inset 0 1px 0 rgba(255, 255, 255, 0.8);
        }

        .reaction-option:active {
          transform: scale(1.1) rotateY(5deg) rotateX(2deg);
        }

        .reaction-option.active {
          transform: scale(1.3) rotateY(5deg);
          box-shadow: 
            0 6px 12px rgba(0, 0, 0, 0.2),
            0 3px 6px rgba(0, 0, 0, 0.15),
            inset 0 1px 0 rgba(255, 255, 255, 0.8);
        }

        .reaction-option svg {
          width: 28px;
          height: 28px;
        }

.reaction-like {
          background: linear-gradient(145deg, #1a237e, #283593);
          border: 2px solid #0d1442;
          animation: likeBounce 1.5s ease-in-out infinite;
        }
        .reaction-like:hover { background: #1a237e; border-color: #0d1442; }
        .reaction-like svg { color: #64b5f6; }
        
        .reaction-love {
          background: linear-gradient(145deg, #ffffff, #f5f5f5);
          animation: lovePulse 1.7s ease-in-out infinite;
          border: 2px solid #e0e0e0;
        }
        .reaction-love:hover { background: #ffffff; }
        .reaction-love svg { color: #e41e3f; }
        
        @keyframes lovePulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.08); }
        }
        
        .reaction-haha {
          background: linear-gradient(145deg, #fff8e1, #ffecb3);
          animation: hahaWobble 1.6s ease-in-out infinite;
        }
        .reaction-haha:hover { background: #ffecb3; }
        
        @keyframes hahaWobble {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-8deg); }
          75% { transform: rotate(8deg); }
        }
        
        .reaction-wow {
          background: linear-gradient(145deg, #e8f5e9, #c8e6c9);
          animation: wowExpand 1.8s ease-in-out infinite;
        }
        .reaction-wow:hover { background: #c8e6c9; }
        
        .reaction-angry {
          background: linear-gradient(145deg, #ffebee, #ffcdd2);
          animation: angryShake 1.4s ease-in-out infinite;
        }
        .reaction-angry:hover { background: #ffcdd2; }
        
        .reaction-sad {
          background: linear-gradient(145deg, #e8eaf6, #c5cae9);
          animation: sadDrop 1.5s ease-in-out infinite;
        }
        .reaction-sad:hover { background: #c5cae9; }

        @keyframes likeBounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
        
        @keyframes lovePulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.08); }
        }
        
        @keyframes hahaWobble {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-8deg); }
          75% { transform: rotate(8deg); }
        }
        
        @keyframes wowExpand {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.9; }
        }
        
        @keyframes angryShake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-3px); }
          75% { transform: translateX(3px); }
        }
        
        @keyframes sadDrop {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(2px); }
        }
        
        .reaction-wow { background: #e8f5e9; }
        .reaction-wow:hover { background: #c8e6c9; }

        .reaction-icon {
          font-size: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .reaction-icon svg {
          width: 18px;
          height: 18px;
        }

        .reaction-icon.like { color: #1877f2; }
        .reaction-icon.love { color: #e41e3f; }
        .reaction-icon.haha { color: #f7b928; }
        .reaction-icon.wow { color: #f7b928; }
        .reaction-icon.angry { color: #e41e3f; }
        .reaction-icon.sad { color: #6b7280; }

        @media (max-width: 768px) {
          25% { transform: rotate(-15deg); }
          75% { transform: rotate(15deg); }
        }
        @keyframes reactionShake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        @keyframes reactionDrop {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(4px); }
        }
        @keyframes reactionExpand {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.2); }
        }

        @media (max-width: 768px) {
          .reaction-picker-popup {
            gap: 6px;
            padding: 8px 12px;
          }
          .reaction-option {
            width: 44px;
            height: 44px;
            font-size: 28px;
          }
          .reaction-option svg {
            width: 24px;
            height: 24px;
          }
        }

        .viewer-comments {
          flex: 1 1 0%;
          display: flex;
          flex-direction: column;
          min-height: 0;
          overflow: hidden;
        }


        .comments-list {
          flex: 1 1 0%;
          min-height: 0;
          overflow-y: auto;
          padding: 16px;
        }

        .comment-input-section {
          border-top: 1px solid #e5e7eb;
          flex: 0 0 auto;
          width: 100%;
          display: flex;
          flex-direction: column;
          background: #fff;
          margin-bottom: 0;
        }

        .no-comments {
          text-align: center;
          color: #9ca3af;
          padding: 20px;
        }

        .comment-item {
          display: flex;
          gap: 10px;
          margin-bottom: 16px;
        }

        .comment-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          object-fit: cover;
        }

        .comment-content {
          flex: 1;
        }

        .comment-bubble {
          background: #f3f4f6;
          padding: 10px 14px;
          border-radius: 18px;
          display: inline-block;
        }

.comment-author {
          font-weight: 600;
          font-size: 13px;
          display: block;
          margin-bottom: 2px;
        }

        .comment-text {
          margin: 0;
          font-size: 14px;
          color: #374151;
          word-wrap: break-word;
        }

        .comment-image {
          max-width: 200px;
          max-height: 200px;
          border-radius: 8px;
          margin-top: 8px;
          display: block;
        }

        .comment-actions {
          display: flex;
          gap: 12px;
          margin-top: 4px;
          padding-left: 4px;
        }

        .comment-actions button {
          background: none;
          border: none;
          color: #6b7280;
          font-size: 12px;
          cursor: pointer;
        }

        .comment-actions button:hover {
          color: #1877f2;
        }

        .comment-actions button.liked {
          color: #1877f2;
        }

        .comment-reply-to {
          font-size: 11px;
          color: #6b7280;
margin-left: 6px;
        }

        .comment-input-section {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding: 12px 16px;
          border-top: 1px solid #e5e7eb;
          flex-shrink: 0;
          margin-top: auto;
          background: #fff;
        }

        .comment-input-section .reply-indicator {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 6px 12px;
          background: #f3f4f6;
          border-radius: 8px;
          font-size: 12px;
        }

        .comment-input-section .reply-indicator button {
          background: none;
          border: none;
          cursor: pointer;
          font-size: 14px;
          color: #6b7280;
        }

        .comment-input-main {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
        }

        .comment-input-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          object-fit: cover;
        }

.comment-input-wrapper {
          flex: 1;
          position: relative;
          display: flex;
          align-items: center;
          min-height: 40px;
        }

        .comment-input-wrapper input {
          flex: 1;
          padding: 8px 12px;
          border: 1px solid #e5e7eb;
          border-radius: 20px;
          font-size: 14px;
          outline: none;
        }

        .comment-input-wrapper input:focus {
          border-color: #1877f2;
        }

        .emoji-picker-toggle {
          background: none;
          border: none;
          font-size: 18px;
          cursor: pointer;
          padding: 6px 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: all 0.2s;
          color: #65676b;
        }

        .emoji-picker-toggle:hover {
          background: #f0f2f5;
        }

        .emoji-picker-toggle.active {
          background: #e7f3ff;
          color: #1877f2;
        }

        .image-upload-btn {
          background: none;
          border: none;
          cursor: pointer;
          padding: 6px 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          color: #65676b;
          transition: all 0.2s;
        }

        .image-upload-btn:hover {
          background: #f0f2f5;
        }

        .comment-image-preview {
          position: relative;
          display: flex;
          align-items: center;
          margin: 4px 0;
          padding: 8px;
          background: #f9fafb;
          border-radius: 8px;
        }

        .comment-image-preview img {
          max-width: 100px;
          max-height: 100px;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
          object-fit: cover;
        }

        .comment-image-preview button {
          position: relative;
          top: auto;
          right: auto;
          margin-left: 12px;
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .comment-send-btn {
          background: #1877f2;
          border: none;
          border-radius: 50%;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
          color: white;
        }

        .comment-send-btn:hover:not(:disabled) {
          background: #166fe5;
        }

        .comment-send-btn:disabled {
          background: #e4e6eb;
          color: #bcc0c4;
          cursor: not-allowed;
        }

        .comment-send-btn svg {
          width: 16px;
          height: 16px;
        }

        .comment-input-wrapper input {
          flex: 1;
          border: none;
          background: none;
          outline: none;
          font-size: 14px;
        }

        .comment-input-wrapper button {
          background: none;
          border: none;
          color: #2563eb;
          cursor: pointer;
          padding: 4px;
        }

        .comment-input-wrapper button:disabled {
          color: #9ca3af;
          cursor: not-allowed;
        }

        @media (max-width: 768px) {
          .post-viewer-overlay {
            padding: 0;
          }

          .post-viewer-container {
            max-width: 100%;
            max-height: 100%;
            height: 100%;
            border-radius: 0;
          }

          .viewer-content {
            flex-direction: column;
            height: 100%;
          }

          .viewer-media-section {
            flex: none;
            height: 50%;
            min-height: 40%;
          }

          .viewer-media {
            width: 100%;
            height: 100%;
            object-fit: contain;
          }

          .viewer-sidebar {
            width: 100%;
            height: 50%;
          }

          .comment-image-preview img {
            max-width: 80px;
            max-height: 80px;
          }

          .comment-image-preview button {
            width: 18px;
            height: 18px;
            font-size: 10px;
          }
        }

          .viewer-sidebar {
            width: 100%;
            height: 50%;
            flex: 1;
            border-left: none;
            border-top: 1px solid #e5e7eb;
          }

          .viewer-header {
            padding: 12px;
          }

          .viewer-avatar {
            width: 32px;
            height: 32px;
          }

          .viewer-post-content {
            padding: 12px;
            max-height: 80px;
          }

          .viewer-comments {
            flex: 1;
            min-height: 0;
          }

          .comments-list {
            padding: 12px;
          }

          .comment-input-section {
            padding: 10px 12px;
            flex-shrink: 0;
            margin-top: auto;
            background: #fff;
          }
        }

        @media (max-width: 480px) {
          .viewer-sidebar {
            height: 55%;
          }

          .viewer-media-section {
            height: 45%;
          }

          .viewer-close-btn {
            top: 8px;
            right: 8px;
            width: 32px;
            height: 32px;
          }

          .viewer-header {
            padding: 8px;
          }

          .viewer-author-name {
            font-size: 14px;
          }

          .action-btn {
            padding: 6px 8px;
            font-size: 12px;
          }
        }
      `}</style>

      {reportOpen && (
        <div className="report-modal-overlay" onClick={() => setReportOpen(false)}>
          <div className="report-modal" onClick={(e) => e.stopPropagation()}>
            <div className="report-modal-header">
              <h3>Signaler cette publication</h3>
              <button className="close-report" onClick={() => setReportOpen(false)}>
                <Icons.X />
              </button>
            </div>
            <div className="report-modal-body">
              <textarea
                className="report-textarea"
                placeholder="Décrivez la raison de votre signalement..."
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                rows={4}
              />
            </div>
            <div className="report-modal-footer">
              <button className="btn-cancel" onClick={() => setReportOpen(false)}>Annuler</button>
              <button className="btn-submit" onClick={submitReport} disabled={!reportReason.trim()}>Envoyer</button>
            </div>
          </div>
        </div>
      )}

      {showShareModal && (
        <div className="up-modal-overlay" onClick={() => setShowShareModal(false)}>
          <div className="up-share-modal" onClick={(e) => e.stopPropagation()}>
            <div className="up-modal-header">
              <h3>Partager cette publication</h3>
              <button className="up-modal-close" onClick={() => setShowShareModal(false)}>
                <Icons.X />
              </button>
            </div>
            
            <div className="up-share-search">
              <input type="text" placeholder="Rechercher amis ou groupes..." value={shareSearch} onChange={(e) => setShareSearch(e.target.value)} />
            </div>
            
            <div className="up-share-section">
              <h4>Amis</h4>
              {shareLoading ? (
                <p>Chargement...</p>
              ) : shareFriends.filter(f => !shareSearch || (f.name || f.email || '').toLowerCase().includes(shareSearch.toLowerCase())).length > 0 ? (
                <div className="up-share-list">
                  {shareFriends.filter(f => !shareSearch || (f.name || f.email || '').toLowerCase().includes(shareSearch.toLowerCase())).slice(0, 5).map(friend => (
                    <div key={friend.id || friend.email} className="up-share-item" onClick={() => handleShareToFriend(friend)}>
                      <ClickableAvatar user={friend} size={32} />
                      <span>{friend.prenom || friend.nom ? `${friend.prenom || ''} ${friend.nom || ''}`.trim() : friend.email}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="up-share-empty">Aucun ami trouvé</p>
              )}
            </div>
            
            <div className="up-share-section">
              <h4>Groupes</h4>
              {shareLoading ? (
                <p>Chargement...</p>
              ) : shareGroups.filter(g => !shareSearch || (g.name || '').toLowerCase().includes(shareSearch.toLowerCase())).length > 0 ? (
                <div className="up-share-list">
                  {shareGroups.filter(g => !shareSearch || (g.name || '').toLowerCase().includes(shareSearch.toLowerCase())).slice(0, 5).map(group => (
                    <div key={group.id} className="up-share-item" onClick={() => handleShareToGroup(group)}>
                      <div className="up-share-group-avatar">{group.name?.charAt(0)}</div>
                      <span>{group.name}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="up-share-empty">Aucun groupe trouvé</p>
              )}
            </div>
            
            <div className="up-share-options">
              <button className="up-share-option" style={{ '--share-color': '#003d5c' }} onClick={() => handleShareToSocial('facebook')}>
                <span className="up-share-icon" style={{ background: '#003d5c' }}>
                  <Icons.Facebook size={16} />
                </span>
                <span>Facebook</span>
              </button>
              <button className="up-share-option" style={{ '--share-color': '#1DA1F2' }} onClick={() => handleShareToSocial('twitter')}>
                <span className="up-share-icon" style={{ background: '#1DA1F2' }}>
                  <Icons.Twitter size={16} />
                </span>
                <span>Twitter</span>
              </button>
              <button className="up-share-option" style={{ '--share-color': '#25D366' }} onClick={() => handleShareToSocial('whatsapp')}>
                <span className="up-share-icon" style={{ background: '#25D366' }}>
                  <Icons.WhatsApp size={16} />
                </span>
                <span>WhatsApp</span>
              </button>
              <button className="up-share-option" style={{ '--share-color': '#0077B5' }} onClick={() => handleShareToSocial('linkedin')}>
                <span className="up-share-icon" style={{ background: '#0077B5' }}>
                  <Icons.LinkedIn size={16} />
                </span>
                <span>LinkedIn</span>
              </button>
              <button className="up-share-option" style={{ '--share-color': '#FF4500' }} onClick={() => handleShareToSocial('reddit')}>
                <span className="up-share-icon" style={{ background: '#FF4500' }}>
                  <Icons.Reddit size={16} />
                </span>
                <span>Reddit</span>
              </button>
              <button className="up-share-option" onClick={handleCopyLink} style={{ '--share-color': '#65676B' }}>
                <span className="up-share-icon" style={{ background: '#65676B' }}>
                  <Icons.Copy size={16} />
                </span>
                <span>Copier le lien</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}