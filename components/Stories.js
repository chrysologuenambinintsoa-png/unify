import { useState, useEffect, useRef, useCallback } from 'react'

export default function Stories() {
  const [user, setUser] = useState(null)
  const [stories, setStories] = useState([])
  const [loading, setLoading] = useState(true)
  const [viewerOpen, setViewerOpen] = useState(false)
  const [currentUserIndex, setCurrentUserIndex] = useState(0)
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0)
  const [progress, setProgress] = useState(0)
  const [createOpen, setCreateOpen] = useState(false)
  const [storyContent, setStoryContent] = useState('')
  const [storyImage, setStoryImage] = useState(null)
  const [storyImagePreview, setStoryImagePreview] = useState(null)
  const [creating, setCreating] = useState(false)
  const [paused, setPaused] = useState(false)
  const [liked, setLiked] = useState(false)
  const [reactionType, setReactionType] = useState(null)
  const [showReactions, setShowReactions] = useState(false)
  const [messageText, setMessageText] = useState('')
  const [storyStats, setStoryStats] = useState({})
  
  const progressRef = useRef(null)
  const imageInputRef = useRef(null)
  const viewerRef = useRef(null)
  const reactionTimeoutRef = useRef(null)

  // Group stories by user
  const groupedStories = stories.reduce((acc, story) => {
    const authorId = story.author?.id || story.authorId
    if (!acc[authorId]) {
      acc[authorId] = {
        author: story.author,
        stories: [],
        seen: false
      }
    }
    acc[authorId].stories.push(story)
    return acc
  }, {})

  const userStoriesList = Object.values(groupedStories)

  useEffect(() => {
    const u = localStorage.getItem('user')
    if (u) {
      try {
        const parsedUser = JSON.parse(u)
        console.log('Stories - User from localStorage:', parsedUser)
        setUser(parsedUser)
      } catch (error) {
        console.error('Stories - Error parsing user from localStorage:', error)
      }
    }
    function onUserUpdated() {
      const v = localStorage.getItem('user')
      setUser(v ? JSON.parse(v) : null)
    }
    window.addEventListener('userUpdated', onUserUpdated)
    return () => window.removeEventListener('userUpdated', onUserUpdated)
  }, [])

  useEffect(() => {
    fetchStories()
  }, [])

  async function fetchStories() {
    try {
      setLoading(true)
      const res = await fetch('/api/stories')
      if (res.ok) {
        const data = await res.json()
        setStories(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error('Error fetching stories:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStoryStats = useCallback(async (storyId) => {
    if (!storyId) return
    try {
      const res = await fetch(`/api/stories/${storyId}/stats`)
      if (res.ok) {
        const data = await res.json()
        setStoryStats(prev => ({
          ...prev,
          [storyId]: {
            reactionsCount: data.reactionsCount || 0,
            viewsCount: data.viewsCount || 0,
            reactionTypes: data.reactionTypes || {}
          }
        }))
      }
    } catch (e) {
      console.error('Error fetching story stats:', e)
    }
  }, [])

  const openViewer = useCallback((userIndex) => {
    setCurrentUserIndex(userIndex)
    setCurrentStoryIndex(0)
    setProgress(0)
    setLiked(false)
    setReactionType(null)
    setShowReactions(false)
    setViewerOpen(true)
    const story = userStoriesList[userIndex]?.stories[0]
    if (story?.id) {
      fetchStoryStats(story.id)
    }
  }, [userStoriesList, fetchStoryStats])

  const closeViewer = useCallback(() => {
    setViewerOpen(false)
    setPaused(false)
    setProgress(0)
  }, [])

  const goToNextStory = useCallback(() => {
    const currentUserStories = userStoriesList[currentUserIndex]?.stories || []
    if (currentStoryIndex < currentUserStories.length - 1) {
      const nextStory = currentUserStories[currentStoryIndex + 1]
      setCurrentStoryIndex(prev => prev + 1)
      setProgress(0)
      setLiked(false)
      setReactionType(null)
      setShowReactions(false)
      if (nextStory?.id) fetchStoryStats(nextStory.id)
    } else if (currentUserIndex < userStoriesList.length - 1) {
      const nextUserStories = userStoriesList[currentUserIndex + 1]?.stories || []
      const nextStory = nextUserStories[0]
      setCurrentUserIndex(prev => prev + 1)
      setCurrentStoryIndex(0)
      setProgress(0)
      setLiked(false)
      setReactionType(null)
      setShowReactions(false)
      if (nextStory?.id) fetchStoryStats(nextStory.id)
    } else {
      closeViewer()
    }
  }, [currentUserIndex, currentStoryIndex, userStoriesList, closeViewer, fetchStoryStats])

  const goToPrevStory = useCallback(() => {
    if (currentStoryIndex > 0) {
      const prevStory = userStoriesList[currentUserIndex]?.stories[currentStoryIndex - 1]
      setCurrentStoryIndex(prev => prev - 1)
      setProgress(0)
      setLiked(false)
      setReactionType(null)
      setShowReactions(false)
      if (prevStory?.id) fetchStoryStats(prevStory.id)
    } else if (currentUserIndex > 0) {
      const prevUserStories = userStoriesList[currentUserIndex - 1]?.stories || []
      const prevStory = prevUserStories[prevUserStories.length - 1]
      setCurrentUserIndex(prev => prev - 1)
      setCurrentStoryIndex(prevUserStories.length - 1)
      setProgress(0)
      setLiked(false)
      setReactionType(null)
      setShowReactions(false)
      if (prevStory?.id) fetchStoryStats(prevStory.id)
    }
  }, [currentUserIndex, currentStoryIndex, userStoriesList, fetchStoryStats])

  // Auto-progress timer
  useEffect(() => {
    if (!viewerOpen || paused) return

    const duration = 5000 // 5 seconds per story
    const interval = 50
    const increment = (interval / duration) * 100

    progressRef.current = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          goToNextStory()
          return 0
        }
        return prev + increment
      })
    }, interval)

    return () => clearInterval(progressRef.current)
  }, [viewerOpen, paused, currentUserIndex, currentStoryIndex, goToNextStory])

  // Mark story as viewed
  useEffect(() => {
    if (viewerOpen && userStoriesList[currentUserIndex]) {
      const story = userStoriesList[currentUserIndex].stories[currentStoryIndex]
      if (story?.id) {
        // Call view endpoint to increment views
        fetch(`/api/stories/${story.id}/view`, {
          method: 'POST',
          headers: { 'x-user-id': JSON.stringify(user) }
        })
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data) {
            // Update stats with server response
            setStoryStats(prev => ({
              ...prev,
              [story.id]: {
                ...prev[story.id],
                viewsCount: data.viewsCount || 0
              }
            }))
          }
        })
        .catch(() => {
          // Fallback: increment locally if server call fails
          const currentStats = storyStats[story.id] || { viewsCount: 0 }
          setStoryStats(prev => ({
            ...prev,
            [story.id]: {
              ...currentStats,
              viewsCount: (currentStats.viewsCount || 0) + 1
            }
          }))
        })
      }
    }
  }, [viewerOpen, currentUserIndex, currentStoryIndex])

  const handleReaction = async (type = 'like') => {
    if (!user) return
    const story = userStoriesList[currentUserIndex]?.stories[currentStoryIndex]
    if (!story) return

    const isCurrentlyReacted = reactionType === type
    const newReacted = !isCurrentlyReacted
    const newType = newReacted ? type : null
    
    setLiked(newReacted)
    setReactionType(newType)
    setShowReactions(false)

    // Update local counts immediately for better UX
    const currentStats = storyStats[story.id] || { reactionsCount: 0, reactionTypes: {} }
    // Ensure reactionTypes exists
    if (!currentStats.reactionTypes) {
      currentStats.reactionTypes = {}
    }
    if (newReacted) {
      setStoryStats(prev => ({
        ...prev,
        [story.id]: {
          ...currentStats,
          reactionsCount: currentStats.reactionsCount + 1,
          reactionTypes: {
            ...currentStats.reactionTypes,
            [type]: (currentStats.reactionTypes[type] || 0) + 1
          }
        }
      }))
    } else {
      setStoryStats(prev => ({
        ...prev,
        [story.id]: {
          ...currentStats,
          reactionsCount: Math.max(0, currentStats.reactionsCount - 1),
          reactionTypes: {
            ...currentStats.reactionTypes,
            [reactionType]: Math.max(0, (currentStats.reactionTypes[reactionType] || 0) - 1)
          }
        }
      }))
    }

    try {
      await fetch(`/api/stories/${story.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': JSON.stringify(user)
        },
        body: JSON.stringify({ action: newReacted ? 'react' : 'unreact', reactionType: newType })
      })
    } catch (e) {
      console.error(e)
    }
  }

  const handleLike = () => handleReaction('like')

  const getReactionIcon = () => {
    switch(reactionType) {
      case 'love': return <i className="fas fa-heart"></i>
      case 'adore': return <i className="fas fa-heart"></i>
      case 'haha': return <i className="fas fa-laugh-squint"></i>
      case 'wow': return <i className="fas fa-surprise"></i>
      case 'sad': return <i className="fas fa-sad-tear"></i>
      case 'angry': return <i className="fas fa-angry"></i>
      case 'like': return <i className="fas fa-thumbs-up"></i>
      default: return <i className="far fa-heart"></i>
    }
  }

  const getReactionColor = () => {
    switch(reactionType) {
      case 'love': return '#F33E58'
      case 'adore': return '#F33E58'
      case 'haha': return '#F7B125'
      case 'wow': return '#F7B125'
      case 'sad': return '#F7B125'
      case 'angry': return '#E9710F'
      case 'like': return '#003d5c'
      default: return 'rgba(255,255,255,0.2)'
    }
  }

  const handleSendMessage = async () => {
    if (!user || !messageText.trim()) return
    const story = userStoriesList[currentUserIndex]?.stories[currentStoryIndex]
    if (!story) return

    try {
      // Get story author's email
      const authorEmail = currentAuthor?.email
      if (!authorEmail) {
        console.error('Author email not found')
        return
      }

      // Don't send message to yourself
      const currentUserEmail = user.email || (typeof user === 'string' ? JSON.parse(user).email : user.email)
      if (authorEmail.toLowerCase().trim() === currentUserEmail.toLowerCase().trim()) {
        console.log('Cannot send message to yourself')
        setMessageText('')
        return
      }

      // Create or find conversation with story author
      const createConvRes = await fetch('/api/messages/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': JSON.stringify(user)
        },
        body: JSON.stringify({
          participants: [currentUserEmail, authorEmail]
        })
      })

      if (!createConvRes.ok) {
        console.error('Failed to create/find conversation')
        return
      }

      const conversation = await createConvRes.json()
      
      // Send message to the conversation with story reference
      const messageRes = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': JSON.stringify(user)
        },
        body: JSON.stringify({
          conversationId: conversation.id,
          senderEmail: currentUserEmail,
          senderName: `${user.prenom || ''} ${user.nom || ''}`.trim() || currentUserEmail,
          text: messageText.trim(),
          attachments: {
            type: 'story',
            storyId: story.id,
            storyContent: story.content || '',
            storyImage: story.image || null
          }
        })
      })

      if (messageRes.ok) {
        console.log('Message sent successfully to story author')
        setMessageText('')
      } else {
        console.error('Failed to send message')
      }
    } catch (e) {
      console.error('Error sending message to story author:', e)
    }
  }

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setStoryImage(file)
      const reader = new FileReader()
      reader.onload = (event) => {
        setStoryImagePreview(event.target?.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleCreateStory = async () => {
    if (!user) {
      alert('Vous devez être connecté')
      return
    }
    if (!storyContent && !storyImage) {
      alert('Veuillez ajouter du contenu ou une image')
      return
    }

    setCreating(true)
    try {
      let imageUrl = null
      const userEmail = user.email || (typeof user === 'string' ? JSON.parse(user).email : user.email)

      if (storyImage) {
        try {
          const formData = new FormData()
          formData.append('file', storyImage)
          formData.append('type', 'publication')
          formData.append('userEmail', userEmail)

          const uploadRes = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          })

          if (uploadRes.ok) {
            const uploadData = await uploadRes.json()
            imageUrl = uploadData.url || uploadData.secure_url
          } else {
            console.error('Erreur lors du téléchargement de l\'image')
            // Continue sans image au lieu d'arrêter la création
          }
        } catch (uploadError) {
          console.error('Erreur lors du téléchargement de l\'image:', uploadError)
          // Continue sans image au lieu d'arrêter la création
        }
      }

      const res = await fetch('/api/stories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': JSON.stringify(user)
        },
        body: JSON.stringify({
          content: storyContent,
          image: imageUrl,
          visibility: 'public'
        })
      })

      console.log('Stories - User being sent:', user);
      console.log('Stories - Response status:', res.status);

      if (res.ok) {
        const newStory = await res.json()
        setStories([newStory, ...stories])
        setCreateOpen(false)
        setStoryContent('')
        setStoryImage(null)
        setStoryImagePreview(null)
      } else {
        const errorData = await res.json().catch(() => ({}))
        console.error('Erreur API:', res.status, errorData)
        alert(errorData.error || `Erreur lors de la création de la story (${res.status})`)
      }
    } catch (error) {
      console.error('Error creating story:', error)
      alert('Erreur lors de la création de la story')
    }
  }

  const formatTime = (date) => {
    if (!date) return ''
    const now = new Date()
    const storyDate = new Date(date)
    const diffMs = now - storyDate
    const diffHours = Math.floor(diffMs / 3600000)
    if (diffHours < 1) return 'À l\'instant'
    if (diffHours < 24) return `${diffHours}h`
    return `${Math.floor(diffHours / 24)}j`
  }

  const currentStory = userStoriesList[currentUserIndex]?.stories[currentStoryIndex]
  const currentAuthor = userStoriesList[currentUserIndex]?.author

  return (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      padding: '16px',
      marginBottom: '16px',
      boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
    }}>
      {/* Stories Row */}
      <div style={{
        display: 'flex',
        gap: '12px',
        overflowX: 'auto',
        paddingBottom: '8px',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none'
      }}>
        <style>{`
          div::-webkit-scrollbar { display: none; }
        `}</style>

        {/* Create Story Card */}
        <div
          onClick={() => setCreateOpen(true)}
          style={{
            minWidth: '110px',
            height: '190px',
            borderRadius: '12px',
            overflow: 'hidden',
            cursor: 'pointer',
            position: 'relative',
            background: user?.avatarUrl || user?.avatar
              ? `url(${user.avatarUrl || user.avatar}) center/cover`
              : 'linear-gradient(135deg, #667eea, #764ba2)',
            flexShrink: 0
          }}
        >
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
            padding: '40px 8px 12px',
            textAlign: 'center'
          }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: '#003d5c',
              border: '3px solid white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '-28px auto 8px',
              color: 'white',
              fontSize: '20px',
              fontWeight: 'bold'
            }}><i className="fas fa-plus"></i></div>
            <span style={{ color: 'white', fontSize: '12px', fontWeight: '600' }}>
              Créer une story
            </span>
          </div>
        </div>

        {/* User Stories */}
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{
              minWidth: '110px',
              height: '190px',
              borderRadius: '12px',
              background: '#f0f0f0',
              animation: 'pulse 1.5s infinite',
              flexShrink: 0
            }} />
          ))
        ) : (
          userStoriesList.map((userStory, index) => {
            const author = userStory.author
            const latestStory = userStory.stories[0]
            const hasImage = latestStory?.image
            const initials = `${author?.prenom?.[0] || ''}${author?.nom?.[0] || ''}`.toUpperCase()

            return (
              <div
                key={author?.id || index}
                onClick={() => openViewer(index)}
                style={{
                  minWidth: '110px',
                  height: '190px',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  position: 'relative',
                  flexShrink: 0,
                  background: hasImage
                    ? `url(${latestStory.image}) center/cover`
                    : `linear-gradient(135deg, ${['#667eea', '#f093fb', '#0B3D91', '#fa709a', '#4facfe'][index % 5]}, ${['#764ba2', '#f5576c', '#082B60', '#fee140', '#00f2fe'][index % 5]})`
                }}
              >
                {/* Gradient overlay */}
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(transparent 50%, rgba(0,0,0,0.7) 100%)'
                }} />

                {/* Avatar with ring */}
                <div style={{
                  position: 'absolute',
                  top: '12px',
                  left: '12px',
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  padding: '3px',
                  background: userStory.seen
                    ? '#ccc'
                    : 'linear-gradient(135deg, #003d5c, #f02849)'
                }}>
                  <div style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    overflow: 'hidden',
                    border: '2px solid white',
                    background: '#e4e6eb'
                  }}>
                    {author?.avatarUrl || author?.avatar ? (
                      <img
                        src={author.avatarUrl || author.avatar}
                        alt=""
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'linear-gradient(135deg, #667eea, #764ba2)',
                        color: 'white',
                        fontSize: '14px',
                        fontWeight: '700'
                      }}>
                        {initials}
                      </div>
                    )}
                  </div>
                </div>

                {/* Story count indicator */}
                {userStory.stories.length > 1 && (
                  <div style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    background: 'rgba(0,0,0,0.5)',
                    color: 'white',
                    fontSize: '10px',
                    fontWeight: '600',
                    padding: '2px 6px',
                    borderRadius: '10px'
                  }}>
                    {userStory.stories.length}
                  </div>
                )}

                {/* Author name */}
                <div style={{
                  position: 'absolute',
                  bottom: '12px',
                  left: '8px',
                  right: '8px',
                  color: 'white',
                  fontSize: '12px',
                  fontWeight: '600',
                  textShadow: '0 1px 3px rgba(0,0,0,0.5)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {author?.prenom} {author?.nom}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Story Viewer Modal */}
      {viewerOpen && currentStory && (
        <div
          ref={viewerRef}
          onClick={(e) => {
            if (e.target === viewerRef.current) closeViewer()
          }}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.95)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {/* Close button */}
          <button
            onClick={closeViewer}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              background: 'none',
              border: 'none',
              color: 'white',
              fontSize: '28px',
              cursor: 'pointer',
              zIndex: 10001,
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
          >
            <i className="fas fa-times"></i>
          </button>

          {/* Navigation arrows */}
          {(currentUserIndex > 0 || currentStoryIndex > 0) && (
            <button
              onClick={(e) => { e.stopPropagation(); goToPrevStory(); }}
              style={{
                position: 'absolute',
                left: '20px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                color: 'white',
                fontSize: '24px',
                cursor: 'pointer',
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10001,
                transition: 'all 0.2s',
                backdropFilter: 'blur(10px)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.3)'
                e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.2)'
                e.currentTarget.style.transform = 'translateY(-50%)'
              }}
            >
              ‹
            </button>
          )}

          {(currentUserIndex < userStoriesList.length - 1 || currentStoryIndex < (userStoriesList[currentUserIndex]?.stories?.length || 1) - 1) && (
            <button
              onClick={(e) => { e.stopPropagation(); goToNextStory(); }}
              style={{
                position: 'absolute',
                right: '20px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                color: 'white',
                fontSize: '24px',
                cursor: 'pointer',
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10001,
                transition: 'all 0.2s',
                backdropFilter: 'blur(10px)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.3)'
                e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.2)'
                e.currentTarget.style.transform = 'translateY(-50%)'
              }}
            >
              ›
            </button>
          )}

          {/* Story Container */}
          <div
            style={{
              width: '400px',
              maxWidth: '100vw',
              height: '90vh',
              maxHeight: '700px',
              borderRadius: '12px',
              overflow: 'hidden',
              position: 'relative',
              background: currentStory.image
                ? `url(${currentStory.image}) center/cover`
                : 'linear-gradient(135deg, #667eea, #764ba2)',
              userSelect: 'none'
            }}
            onMouseDown={() => setPaused(true)}
            onMouseUp={() => setPaused(false)}
            onTouchStart={() => setPaused(true)}
            onTouchEnd={() => setPaused(false)}
          >
            {/* Progress bars */}
            <div style={{
              position: 'absolute',
              top: '8px',
              left: '8px',
              right: '8px',
              display: 'flex',
              gap: '4px',
              zIndex: 100
            }}>
              {userStoriesList[currentUserIndex]?.stories.map((_, idx) => (
                <div key={idx} style={{
                  flex: 1,
                  height: '3px',
                  background: 'rgba(255,255,255,0.3)',
                  borderRadius: '2px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    height: '100%',
                    background: 'white',
                    width: idx < currentStoryIndex
                      ? '100%'
                      : idx === currentStoryIndex
                        ? `${progress}%`
                        : '0%',
                    transition: idx === currentStoryIndex ? 'none' : 'width 0.3s'
                  }} />
                </div>
              ))}
            </div>

            {/* Header */}
            <div style={{
              position: 'absolute',
              top: '20px',
              left: '12px',
              right: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              zIndex: 100
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                overflow: 'hidden',
                border: '2px solid rgba(255,255,255,0.5)',
                flexShrink: 0
              }}>
                {currentAuthor?.avatarUrl || currentAuthor?.avatar ? (
                  <img
                    src={currentAuthor.avatarUrl || currentAuthor.avatar}
                    alt=""
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <div style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'linear-gradient(135deg, #667eea, #764ba2)',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: '700'
                  }}>
                    {`${currentAuthor?.prenom?.[0] || ''}${currentAuthor?.nom?.[0] || ''}`.toUpperCase()}
                  </div>
                )}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '600',
                  textShadow: '0 1px 3px rgba(0,0,0,0.5)'
                }}>
                  {currentAuthor?.prenom} {currentAuthor?.nom}
                </div>
                <div style={{
                  color: 'rgba(255,255,255,0.7)',
                  fontSize: '12px',
                  textShadow: '0 1px 2px rgba(0,0,0,0.5)'
                }}>
                  {formatTime(currentStory.createdAt)}
                </div>
              </div>
            </div>

            {/* Story content */}
            {currentStory.content && !currentStory.image && (
              <div style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '60px 24px',
                zIndex: 50
              }}>
                <p style={{
                  color: 'white',
                  fontSize: '24px',
                  fontWeight: '700',
                  textAlign: 'center',
                  textShadow: '0 2px 8px rgba(0,0,0,0.3)',
                  lineHeight: '1.4',
                  wordBreak: 'break-word'
                }}>
                  {currentStory.content}
                </p>
              </div>
            )}

            {/* Text overlay on image */}
            {currentStory.content && currentStory.image && (
              <div style={{
                position: 'absolute',
                bottom: '80px',
                left: '0',
                right: '0',
                padding: '16px 20px',
                background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
                zIndex: 50
              }}>
                <p style={{
                  color: 'white',
                  fontSize: '16px',
                  fontWeight: '600',
                  textAlign: 'center',
                  textShadow: '0 1px 3px rgba(0,0,0,0.5)',
                  lineHeight: '1.4'
                }}>
                  {currentStory.content}
                </p>
              </div>
            )}

            {/* Tap areas for navigation */}
            <div
              onClick={goToPrevStory}
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                width: '30%',
                height: '100%',
                cursor: 'pointer',
                zIndex: 60
              }}
            />
            <div
              onClick={goToNextStory}
              style={{
                position: 'absolute',
                right: 0,
                top: 0,
                width: '30%',
                height: '100%',
                cursor: 'pointer',
                zIndex: 60
              }}
            />

            {/* Reaction Status Bar */}
            <div style={{
              position: 'absolute',
              bottom: '80px',
              left: '12px',
              right: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 16px',
              background: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(10px)',
              borderRadius: '24px',
              zIndex: 100
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                {/* Reaction Icons */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  {Object.entries(storyStats[currentStory.id]?.reactionTypes || {})
                    .filter(([_, count]) => count > 0)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 3)
                    .map(([type], index) => (
                      <span
                        key={type}
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          background: type === 'like' ? '#003d5c' : type === 'love' || type === 'adore' ? '#F33E58' : '#F7B125',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '12px',
                          color: 'white',
                          border: '2px solid white',
                          marginRight: index < 2 ? '-6px' : '0'
                        }}
                      >
                        {type === 'like' && <i className="fas fa-thumbs-up"></i>}
                        {type === 'love' && '❤️'}
                        {type === 'adore' && '😍'}
                        {type === 'haha' && '😂'}
                        {type === 'wow' && '😮'}
                        {type === 'sad' && '😢'}
                        {type === 'angry' && '😡'}
                      </span>
                    ))}
                  {Object.keys(storyStats[currentStory.id]?.reactionTypes || {}).length === 0 && (
                    <span style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: '#003d5c',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      color: 'white',
                      border: '2px solid white'
                    }}>
                      <i className="fas fa-thumbs-up"></i>
                    </span>
                  )}
                </div>
                {/* Reaction Count */}
                <span style={{
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '600',
                  marginLeft: '8px'
                }}>
                  {storyStats[currentStory.id]?.reactionsCount || 0} réactions
                </span>
              </div>
              {/* Views Count */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: 'rgba(255,255,255,0.8)',
                fontSize: '13px'
              }}>
                <i className="fas fa-eye"></i>
                <span>{storyStats[currentStory.id]?.viewsCount || 0} vues</span>
              </div>
            </div>

            {/* Bottom actions */}
            <div style={{
              position: 'absolute',
              bottom: '16px',
              left: '12px',
              right: '12px',
              display: 'flex',
              gap: '8px',
              alignItems: 'center',
              zIndex: 100
            }}>
              <input
                type="text"
                placeholder="Envoyer un message..."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                onClick={(e) => e.stopPropagation()}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  borderRadius: '24px',
                  border: '1.5px solid rgba(255,255,255,0.4)',
                  background: 'rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(10px)',
                  color: 'white',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
              <div 
                style={{ position: 'relative' }}
                onMouseEnter={() => {
                  clearTimeout(reactionTimeoutRef.current)
                  setShowReactions(true)
                }}
                onMouseLeave={() => {
                  reactionTimeoutRef.current = setTimeout(() => setShowReactions(false), 300)
                }}
              >
                {/* Reaction Picker */}
                {showReactions && (
                  <div 
                    onClick={(e) => e.stopPropagation()}
                    onMouseEnter={() => {
                      clearTimeout(reactionTimeoutRef.current)
                      setShowReactions(true)
                    }}
                    onMouseLeave={() => {
                      reactionTimeoutRef.current = setTimeout(() => setShowReactions(false), 300)
                    }}
                    style={{
                      position: 'absolute',
                      bottom: '60px',
                      right: '0',
                      background: 'white',
                      borderRadius: '28px',
                      padding: '8px 12px',
                      display: 'flex',
                      gap: '4px',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                      zIndex: 10000,
                      animation: 'reactionPop 0.2s ease-out'
                    }}
                  >
                    <style>{`
                      @keyframes reactionPop {
                        0% { transform: scale(0.5); opacity: 0; }
                        100% { transform: scale(1); opacity: 1; }
                      }
                      @keyframes reactionBounce {
                        0%, 100% { transform: scale(1); }
                        50% { transform: scale(1.3); }
                      }
                      .reaction-btn:hover {
                        animation: reactionBounce 0.3s ease;
                      }
                    `}</style>
                    <button
                      className="reaction-btn"
                      onClick={(e) => { e.stopPropagation(); handleReaction('like'); }}
                      style={{
                        width: '40px',
                        height: '40px',
                        border: 'none',
                        background: 'none',
                        cursor: 'pointer',
                        fontSize: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'transform 0.2s',
                        color: '#003d5c'
                      }}
                      title="J'aime"
                    >
                      <i className="fas fa-thumbs-up"></i>
                    </button>
                    <button
                      className="reaction-btn"
                      onClick={(e) => { e.stopPropagation(); handleReaction('love'); }}
                      style={{
                        width: '40px',
                        height: '40px',
                        border: 'none',
                        background: 'none',
                        cursor: 'pointer',
                        fontSize: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'transform 0.2s'
                      }}
                      title="Love"
                    >
                      ❤️
                    </button>
                    <button
                      className="reaction-btn"
                      onClick={(e) => { e.stopPropagation(); handleReaction('adore'); }}
                      style={{
                        width: '40px',
                        height: '40px',
                        border: 'none',
                        background: 'none',
                        cursor: 'pointer',
                        fontSize: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'transform 0.2s'
                      }}
                      title="J'adore"
                    >
                      😍
                    </button>
                    <button
                      className="reaction-btn"
                      onClick={(e) => { e.stopPropagation(); handleReaction('haha'); }}
                      style={{
                        width: '40px',
                        height: '40px',
                        border: 'none',
                        background: 'none',
                        cursor: 'pointer',
                        fontSize: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'transform 0.2s'
                      }}
                      title="Haha"
                    >
                      😂
                    </button>
                    <button
                      className="reaction-btn"
                      onClick={(e) => { e.stopPropagation(); handleReaction('wow'); }}
                      style={{
                        width: '40px',
                        height: '40px',
                        border: 'none',
                        background: 'none',
                        cursor: 'pointer',
                        fontSize: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'transform 0.2s'
                      }}
                      title="Waoo"
                    >
                      😮
                    </button>
                    <button
                      className="reaction-btn"
                      onClick={(e) => { e.stopPropagation(); handleReaction('sad'); }}
                      style={{
                        width: '40px',
                        height: '40px',
                        border: 'none',
                        background: 'none',
                        cursor: 'pointer',
                        fontSize: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'transform 0.2s'
                      }}
                      title="Triste"
                    >
                      😢
                    </button>
                    <button
                      className="reaction-btn"
                      onClick={(e) => { e.stopPropagation(); handleReaction('angry'); }}
                      style={{
                        width: '40px',
                        height: '40px',
                        border: 'none',
                        background: 'none',
                        cursor: 'pointer',
                        fontSize: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'transform 0.2s'
                      }}
                      title="Grr"
                    >
                      😡
                    </button>
                  </div>
                )}
                
                {/* Main Reaction Button */}
                <button
                  onClick={(e) => { e.stopPropagation(); handleLike(); }}
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    border: 'none',
                    background: getReactionColor(),
                    backdropFilter: 'blur(10px)',
                    color: 'white',
                    fontSize: '20px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s',
                    transform: liked ? 'scale(1.1)' : 'scale(1)'
                  }}
                >
                  {getReactionIcon()}
                </button>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); handleSendMessage(); }}
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  border: 'none',
                  background: 'rgba(255,255,255,0.2)',
                  backdropFilter: 'blur(10px)',
                  color: 'white',
                  fontSize: '18px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background 0.2s'
                }}
              >
                <i className="fas fa-paper-plane"></i>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Story Modal */}
      {createOpen && (
        <div
          onClick={() => {
            setCreateOpen(false)
            setStoryContent('')
            setStoryImage(null)
            setStoryImagePreview(null)
          }}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(4px)'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '500px',
              maxWidth: '95vw',
              background: 'white',
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
            }}
          >
            {/* Header */}
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid #e4e6eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#1c1e21' }}>
                Créer une story
              </h2>
              <button
                onClick={() => {
                  setCreateOpen(false)
                  setStoryContent('')
                  setStoryImage(null)
                  setStoryImagePreview(null)
                }}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  border: 'none',
                  background: '#e4e6eb',
                  cursor: 'pointer',
                  fontSize: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#606770'
                }}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            {/* Preview */}
            <div style={{
              padding: '20px',
              display: 'flex',
              gap: '20px'
            }}>
              <div style={{
                width: '200px',
                height: '320px',
                borderRadius: '12px',
                overflow: 'hidden',
                background: storyImagePreview
                  ? `url(${storyImagePreview}) center/cover`
                  : 'linear-gradient(135deg, #667eea, #764ba2)',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
              }}>
                {storyContent && !storyImagePreview && (
                  <p style={{
                    color: 'white',
                    fontSize: '16px',
                    fontWeight: '600',
                    textAlign: 'center',
                    padding: '16px',
                    textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                  }}>
                    {storyContent}
                  </p>
                )}
              </div>

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* User info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    overflow: 'hidden',
                    background: '#e4e6eb'
                  }}>
                    {user?.avatarUrl || user?.avatar ? (
                      <img src={user.avatarUrl || user.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'linear-gradient(135deg, #667eea, #764ba2)',
                        color: 'white',
                        fontWeight: '700'
                      }}>
                        {`${user?.prenom?.[0] || ''}${user?.nom?.[0] || ''}`.toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div>
                    <div style={{ fontWeight: '600', color: '#1c1e21' }}>
                      {user?.prenom} {user?.nom}
                    </div>
                    <div style={{ fontSize: '12px', color: '#65676b' }}>Public</div>
                  </div>
                </div>

                {/* Content input */}
                <textarea
                  placeholder="Écrivez quelque chose..."
                  value={storyContent}
                  onChange={(e) => setStoryContent(e.target.value)}
                  maxLength={200}
                  style={{
                    width: '100%',
                    minHeight: '100px',
                    padding: '12px',
                    border: '1px solid #dddfe2',
                    borderRadius: '8px',
                    fontSize: '15px',
                    resize: 'none',
                    outline: 'none',
                    fontFamily: 'inherit',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#003d5c'}
                  onBlur={(e) => e.target.style.borderColor = '#dddfe2'}
                />

                {/* Image upload */}
                <button
                  onClick={() => imageInputRef.current?.click()}
                  style={{
                    padding: '12px',
                    border: '1px dashed #dddfe2',
                    borderRadius: '8px',
                    background: '#f5f6f7',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '14px',
                    color: '#606770',
                    fontWeight: '600',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#e4e6eb'
                    e.currentTarget.style.borderColor = '#003d5c'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#f5f6f7'
                    e.currentTarget.style.borderColor = '#dddfe2'
                  }}
                >
                  <i className="fas fa-camera"></i> {storyImage ? 'Changer l\'image' : 'Ajouter une image'}
                </button>
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  style={{ display: 'none' }}
                />
              </div>
            </div>

            {/* Footer */}
            <div style={{
              padding: '16px 20px',
              borderTop: '1px solid #e4e6eb',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px'
            }}>
              <button
                onClick={() => {
                  setCreateOpen(false)
                  setStoryContent('')
                  setStoryImage(null)
                  setStoryImagePreview(null)
                }}
                style={{
                  padding: '10px 24px',
                  border: 'none',
                  borderRadius: '8px',
                  background: '#e4e6eb',
                  color: '#606770',
                  fontSize: '15px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#d8dadf'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#e4e6eb'}
              >
                Annuler
              </button>
              <button
                onClick={handleCreateStory}
                disabled={creating || (!storyContent && !storyImage)}
                style={{
                  padding: '10px 24px',
                  border: 'none',
                  borderRadius: '8px',
                  background: creating || (!storyContent && !storyImage)
                    ? '#e4e6eb'
                    : '#003d5c',
                  color: creating || (!storyContent && !storyImage)
                    ? '#bcc0c4'
                    : 'white',
                  fontSize: '15px',
                  fontWeight: '600',
                  cursor: creating || (!storyContent && !storyImage)
                    ? 'not-allowed'
                    : 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (!creating && (storyContent || storyImage)) {
                    e.currentTarget.style.background = '#002244'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!creating && (storyContent || storyImage)) {
                    e.currentTarget.style.background = '#003d5c'
                  }
                }}
              >
                {creating ? <><i className="fas fa-spinner fa-spin"></i> Publication...</> : 'Publier'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

