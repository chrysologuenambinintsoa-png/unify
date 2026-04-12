import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/router'
import PostCard from './PostCard'
import CreatePost from './CreatePost'
import CreatePostModal from './CreatePostModal'
import Modal from './Modal'
import PostViewer from './PostViewer'
import ClickableAvatar from './ClickableAvatar'
import { ProfileHeaderSkeleton } from './Skeleton'
import { Live } from './Live'

export default function Profile() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [friendsList, setFriendsList] = useState([])
  const [editMode, setEditMode] = useState(false)
  const [editMetier, setEditMetier] = useState('')
  const [editEcole, setEditEcole] = useState('')
  const [editVille, setEditVille] = useState('')
  const [editOriginaire, setEditOriginaire] = useState('')
  const [editRelation, setEditRelation] = useState('')
  const [editMembre, setEditMembre] = useState('')
  const [activeTab, setActiveTab] = useState('Publications')
  const [openMenu, setOpenMenu] = useState(null)
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [showAllFriends, setShowAllFriends] = useState(false)
  const [showAllPhotos, setShowAllPhotos] = useState(false)
  const [uploadModal, setUploadModal] = useState(null) // 'avatar' | 'cover' | null
  const [userPublications, setUserPublications] = useState([])
  const [loadingPublications, setLoadingPublications] = useState(false)
  // text publication modal state (mimic feed)
  const [showTextPublicationModal, setShowTextPublicationModal] = useState(false)
  const [textPubContent, setTextPubContent] = useState('')
  const [textPubBgType, setTextPubBgType] = useState('color')
  const [textPubBgColor, setTextPubBgColor] = useState('#667eea')
  const [textPubTextColor, setTextPubTextColor] = useState('#ffffff')
  const [postViewerOpen, setPostViewerOpen] = useState(false)
  const [selectedPost, setSelectedPost] = useState(null)
  const chevronMenuRef = useRef(null)
  const ellipsisMenuRef = useRef(null)
  const coverInputRef = useRef(null)
  const avatarInputRef = useRef(null)
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState(null)
  const [coverPreviewUrl, setCoverPreviewUrl] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  // Story creation states
  const [createStoryOpen, setCreateStoryOpen] = useState(false)
  const [storyContent, setStoryContent] = useState('')
  const [storyImage, setStoryImage] = useState(null)
  const [storyImagePreview, setStoryImagePreview] = useState(null)
  const [creatingStory, setCreatingStory] = useState(false)
  const [storyBackground, setStoryBackground] = useState('image')
  const [storyBgColor, setStoryBgColor] = useState('#667eea')
  const [storyVisibility, setStoryVisibility] = useState('public')
  const [storyTextPosition, setStoryTextPosition] = useState('bottom') // 'top' | 'center' | 'bottom'
  const storyImageInputRef = useRef(null)
  // Image viewer modal states
  const [imageViewerOpen, setImageViewerOpen] = useState(false)
  const [viewerImageUrl, setViewerImageUrl] = useState('')
  const [viewerImageAlt, setViewerImageAlt] = useState('')
  // Live video modal state
  const [showLiveVideoModal, setShowLiveVideoModal] = useState(false)

  useEffect(() => {
    // fetch when router est prêt (pour s'assurer qu'on a les paramètres de requête)
    if (!router.isReady) return
    const { userId, user } = router.query
    setLoadingProfile(true)
    if (userId) {
      fetch(`/api/user?userId=${userId}`)
        .then(r => r.json())
        .then(d => {
          if (d.user) {
            setUser(d.user)
          } else {
            setUser(null)
          }
        })
        .catch(err => {
          console.error('Failed to load profile', err)
          setUser(null)
        })
        .finally(() => setLoadingProfile(false))
    } else if (user) {
      fetch(`/api/user?userEmail=${encodeURIComponent(user)}`)
        .then(r => r.json())
        .then(d => {
          if (d.user) {
            setUser(d.user)
          } else {
            setUser(null)
          }
        })
        .catch(err => {
          console.error('Failed to load profile', err)
          setUser(null)
        })
        .finally(() => setLoadingProfile(false))
    } else {
      const u = localStorage.getItem('user')
      if (u) {
        try {
          const parsed = JSON.parse(u)
          setUser(parsed)
          window.dispatchEvent(new CustomEvent('profileUserChanged', { detail: parsed }))
        } catch (e) {
          console.error('Error parsing user:', e)
          setUser(null)
          window.dispatchEvent(new CustomEvent('profileUserChanged', { detail: null }))
        }
      }
      setLoadingProfile(false)
    }
  }, [router.isReady, router.query.userId, router.query.user])

  // réagir quand un autre composant met à jour le user dans le localStorage
  useEffect(() => {
    function handleUserUpdated() {
      const u = localStorage.getItem('user')
      if (u) {
        try {
          const updatedUser = JSON.parse(u)
          console.log('Profile: userUpdated event received, isOnline:', updatedUser.isOnline)
          setUser(updatedUser)
        } catch (e) {
          console.error('Error parsing updated user:', e)
        }
      }
    }
    window.addEventListener('userUpdated', handleUserUpdated)
    return () => window.removeEventListener('userUpdated', handleUserUpdated)
  }, [])

  // load friends of current profile user
  useEffect(() => {
    if (!user) return
    const url = user.email
      ? `/api/amis?userEmail=${encodeURIComponent(user.email)}`
      : `/api/amis?userId=${user.id}`
    fetch(url)
      .then(r => r.json())
      .then(d => setFriendsList(d.amis || []))
      .catch(err => console.error('failed to load friends', err))
  }, [user])

  // load publications of current profile user
  useEffect(() => {
    if (!user) return
    // only refresh when viewing tabs that care about posts
    if (!['Publications','Photos','Vidéos'].includes(activeTab)) return
    setLoadingPublications(true)
    // add timestamp to bypass caching headers
    fetch(`/api/items?ts=${Date.now()}`)
      .then(r => r.json())
      .then(data => {
        const authorName = user.prenom || user.nomUtilisateur || (user.email ? user.email.split('@')[0] : 'Jean Dupont')
        const userPosts = data.filter(item => {
          if(item.author === authorName) return true
          // some older items may not have `author` set; fallback to matching by avatar
          if(user.avatarUrl && item.avatarUrl && item.avatarUrl === user.avatarUrl) return true
          if(user.avatar && item.avatar && item.avatar === user.avatar) return true
          return false
        })
        setUserPublications(userPosts)
      })
      .catch(err => {
        console.error('failed to load publications', err)
        setUserPublications([])
      })
      .finally(() => setLoadingPublications(false))
  }, [user, activeTab])

  // derive photo-only posts from publications (only include those with a real, nonempty URL)
  const photoPosts = userPublications.filter(p => {
    const mediaUrl = p.media && p.media.type === 'image' && p.media.url;
    const legacyUrl = p.image && typeof p.image === 'string' && p.image;
    const url = mediaUrl || legacyUrl;
    return !!url;
  })

  // derive video-only posts from publications
  const videoPosts = userPublications.filter(p => {
    return p.media && p.media.type === 'video' && p.media.url;
  })

  // listen for posts created elsewhere and update publications if author matches
  useEffect(() => {
    function onPostCreated(e){
      const created = e?.detail
      if(!created) return
      const authorName = user?.prenom || user?.nomUtilisateur || (user?.email ? user.email.split('@')[0] : null)
      if(authorName && created.author === authorName){
        setUserPublications(prev => [created, ...prev])
      }
    }
    window.addEventListener('postCreated', onPostCreated)
    return () => window.removeEventListener('postCreated', onPostCreated)
  }, [user])

  // open text modal when requested globally (e.g. from create bar or shared modal)
  useEffect(() => {
    function handleOpenText() { setShowTextPublicationModal(true) }
    window.addEventListener('openTextPublication', handleOpenText)
    return () => window.removeEventListener('openTextPublication', handleOpenText)
  }, [])

  useEffect(() => {
    function handleClickOutside(e) {
      if (chevronMenuRef.current && !chevronMenuRef.current.contains(e.target)) {
        if (openMenu === 'chevron') setOpenMenu(null)
      }
      if (ellipsisMenuRef.current && !ellipsisMenuRef.current.contains(e.target)) {
        if (openMenu === 'ellipsis') setOpenMenu(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [openMenu])

  function getInitials() {
    if (!user) return 'U'
    if (user.prenom && user.nom) return (user.prenom[0] + user.nom[0]).toUpperCase()
    if (user.prenom) return user.prenom[0].toUpperCase()
    if (user.nom) return user.nom[0].toUpperCase()
    return 'U'
  }

  // media helpers
  function isVideoUrl(url) {
    if (typeof url !== 'string') return false
    // strip query/hash
    const clean = url.split(/[?#]/)[0]
    return /\.(mp4|webm|ogg)$/i.test(clean)
  }

  function handleProfilePictureChange() {
    setUploadModal('avatar')
  }

  function handleCoverPictureChange() {
    setUploadModal('cover')
  }

  async function handleAvatarUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setSelectedFile(file)
    setAvatarPreviewUrl(URL.createObjectURL(file))
    // keep modal open so user can confirm
  }

  async function handleCoverUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setSelectedFile(file)
    setCoverPreviewUrl(URL.createObjectURL(file))
    // keep modal open so user can confirm
  }

  function handleDrop(e) {
    e.preventDefault()
    const f = e.dataTransfer?.files?.[0]
    if (f) {
      setSelectedFile(f)
      if (uploadModal === 'avatar') {
        setAvatarPreviewUrl(URL.createObjectURL(f))
      } else if (uploadModal === 'cover') {
        setCoverPreviewUrl(URL.createObjectURL(f))
      }
    }
  }

  function handleDragOver(e) {
    e.preventDefault()
  }

  async function handleConfirmUpload() {
    if (!selectedFile) return

    setUploading(true)
    setUploadProgress(0)

    try {
      // Compress image before upload
      let compressedFile
      try {
        compressedFile = await compressImage(selectedFile, uploadModal === 'avatar' ? 200 : 800)
      } catch (compressError) {
        console.error('Compression error:', compressError)
        alert('Erreur lors de la compression de l\'image: ' + compressError.message)
        setUploading(false)
        setUploadProgress(0)
        return
      }
      setUploadProgress(25)

      // Get user email from localStorage
      const userStr = localStorage.getItem('user')
      const currentUser = userStr ? JSON.parse(userStr) : null
      const userEmail = currentUser?.email
      if (!userEmail) {
        alert('Utilisateur non connecté')
        setUploading(false)
        setUploadProgress(0)
        return
      }

      console.log('Starting upload for:', { type: uploadModal, userEmail, fileSize: selectedFile.size })

      setUploadProgress(50)
      setUploadProgress(75)

      console.log('Uploading compressed image to server...')
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

      // Create FormData with the compressed file instead of data URL
      // This avoids encoding issues with data URLs
      const formData = new FormData()
      formData.append('file', compressedFile)
      formData.append('type', uploadModal) // 'avatar' or 'cover'
      formData.append('userEmail', userEmail)

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      console.log('Upload response status:', res.status)
      console.log('Upload response headers:', Object.fromEntries(res.headers.entries()))

      if (!res.ok) {
        let errorMessage = `HTTP ${res.status}`
        try {
          const errorText = await res.text()
          console.error('API error response text:', errorText)
          const errorData = JSON.parse(errorText)
          errorMessage = errorData.error || errorData.details || errorText
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError)
          errorMessage = `HTTP ${res.status} - Response parsing failed`
        }
        throw new Error(errorMessage)
      }

      const data = await res.json()
      console.log('API response data:', data)
      const imageUrl = data.url || data.secure_url

      if (data.user) {
        // Update local state with the updated user from API
        // Merge with existing user to preserve fields like 'avatar' that may not be in the response
        setUser(prev => ({ ...prev, ...data.user }))
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}')
        localStorage.setItem('user', JSON.stringify({ ...currentUser, ...data.user }))

        // Dispatch event for other components to update
        window.dispatchEvent(new CustomEvent('userUpdated', { detail: data.user }))

        setUploadProgress(100)

        // Close modal and reset after a brief delay to show 100%
        setTimeout(() => {
          setUploadModal(null)
          setAvatarPreviewUrl(null)
          setCoverPreviewUrl(null)
          setSelectedFile(null)
          setUploadProgress(0)
          setUploading(false)
        }, 500)
      } else {
        throw new Error('Réponse invalide du serveur')
      }
    } catch (error) {
      console.error('Upload error:', error)
      
      let errorMessage = 'Erreur lors du téléchargement'
      if (error.name === 'AbortError') {
        errorMessage = 'Téléchargement annulé - timeout dépassé (30 secondes)'
      } else if (error.message) {
        errorMessage = 'Erreur: ' + error.message
      }
      
      alert(errorMessage)
      setUploading(false)
      setUploadProgress(0)
    }
  }

  // Compress image function
  function compressImage(file, maxWidth) {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()

      img.onload = () => {
        try {
          // Calculate new dimensions
          let { width, height } = img
          if (width > maxWidth) {
            height = (height * maxWidth) / width
            width = maxWidth
          }

          canvas.width = width
          canvas.height = height

          // Draw and compress
          ctx.drawImage(img, 0, 0, width, height)

          canvas.toBlob((blob) => {
            if (blob) {
              resolve(new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now()
              }))
            } else {
              reject(new Error('Compression failed'))
            }
          }, 'image/jpeg', 0.8) // 80% quality
        } catch (error) {
          reject(error)
        }
      }

      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = URL.createObjectURL(file)
    })
  }


  // text publication helpers (same as feed)
  async function handleCreateTextPublication() {
    if (!textPubContent.trim()) {
      alert('Veuillez ajouter du texte');
      return;
    }

    try {
      const userStr = localStorage.getItem('user');
      const localUser = userStr ? JSON.parse(userStr) : null;
      const authorName = localUser ? (localUser.prenom || localUser.nomUtilisateur || (localUser.email||'').split('@')[0]) : 'Jean Dupont';
      const computedTitle = (textPubContent || '').trim().split('\n')[0].slice(0, 60) || 'Publication';

      const payload = {
        title: computedTitle,
        content: textPubContent,
        backgroundColor: textPubBgColor,
        textColor: textPubTextColor,
        privacy: 'public',
        author: authorName,
        avatarUrl: localUser?.avatarUrl || localUser?.avatar || null
      };

      const res = await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const newPost = await res.json();
        newPost.backgroundColor = newPost.backgroundColor || textPubBgColor;
        newPost.textColor = newPost.textColor || textPubTextColor;
        setUserPublications(prev => [newPost, ...prev]);
        setTextPubContent('');
        setTextPubBgColor('#667eea');
        setTextPubTextColor('#ffffff');
        setShowTextPublicationModal(false);
      } else {
        alert('Erreur lors de la création');
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la création');
    }
  }

  function resetTextPublicationModal() {
    setShowTextPublicationModal(false);
    setTextPubContent('');
    setTextPubBgColor('#667eea');
    setTextPubTextColor('#ffffff');
    setTextPubBgType('color');
  }

  function handleEditProfile() {
    setEditMetier(user.metier || '');
    setEditEcole(user.ecole || '');
    setEditVille(user.ville || '');
    setEditOriginaire(user.originaire || '');
    setEditRelation(user.relation || '');
    setEditMembre(user.membre || '');
    setEditMode(true);
    setActiveTab('À propos'); // Changer vers l'onglet À propos pour afficher le formulaire
  }

  async function handleSaveProfile() {
    try {
      const updatedUser = {
        ...user,
        metier: editMetier,
        ecole: editEcole,
        ville: editVille,
        originaire: editOriginaire,
        relation: editRelation,
        membre: editMembre
      };
      
      const res = await fetch(`/api/user?userId=${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metier: editMetier,
          ecole: editEcole,
          ville: editVille,
          originaire: editOriginaire,
          relation: editRelation,
          membre: editMembre
        })
      });

      if (res.ok) {
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        window.dispatchEvent(new CustomEvent('userUpdated', { detail: updatedUser }));
        setEditMode(false);
      } else {
        alert('Erreur lors de la sauvegarde');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Erreur lors de la sauvegarde');
    }
  }

  function handleCancelEdit() {
    setEditMode(false);
  }

  function handleLogout() {
    // Sauvegarder le compte courant dans savedAccounts avant déconnexion
    const currentUserStr = localStorage.getItem('user')
    if (currentUserStr) {
      try {
        const currentUser = JSON.parse(currentUserStr)
        const currentSavedAccounts = localStorage.getItem('savedAccounts')
        let accounts = currentSavedAccounts ? JSON.parse(currentSavedAccounts) : []
        
        // Éviter les doublons
        accounts = accounts.filter(a => a.email !== currentUser.email)
        accounts.unshift(currentUser)
        
        localStorage.setItem('savedAccounts', JSON.stringify(accounts))
        console.log('✅ Compte sauvegardé dans savedAccounts')
      } catch (err) {
        console.error('Erreur lors de la sauvegarde:', err)
      }
    }
    
    localStorage.removeItem('user')
    localStorage.removeItem('token')
    window.dispatchEvent(new Event('userUpdated'))
    router.push('/account-picker')
  }

  function openPostViewer(post) {
    setSelectedPost(post)
    setPostViewerOpen(true)
  }

  function closePostViewer() {
    setSelectedPost(null)
    setPostViewerOpen(false)
  }

  async function handleDeletePost(id) {
    try {
      const res = await fetch(`/api/items/${id}`, { method: 'DELETE' })
      if (res.status === 204 || res.ok) {
        // ensure comparison is type‑safe (Prisma may return number ids)
        setUserPublications(prev => prev.filter(p => p.id.toString() !== id.toString()))
        closePostViewer()
        window.dispatchEvent(new CustomEvent('postDeleted', { detail: { id } }))
      } else {
        alert('Erreur lors de la suppression')
      }
    } catch (e) {
      console.error('delete error', e)
      alert('Erreur lors de la suppression')
    }
  }

  // Story creation functions
  function handleStoryImageSelect(e) {
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

  async function handleCreateStory() {
    if (!user) {
      alert('Vous devez être connecté')
      return
    }

    if (!storyContent && !storyImage) {
      alert('Veuillez ajouter du contenu ou une image')
      return
    }

    setCreatingStory(true)
    try {
      const payload = {
        content: storyContent,
        image: storyImagePreview,
        visibility: storyVisibility
      }

      const res = await fetch('/api/stories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': JSON.stringify(user)
        },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        const newStory = await res.json()
        // Optionally update stories list if displayed
        setCreateStoryOpen(false)
        resetStoryForm()
        alert('Story créée avec succès !')
      } else {
        alert('Erreur lors de la création de la story')
      }
    } catch (error) {
      console.error('Error creating story:', error)
      alert('Erreur lors de la création de la story')
    } finally {
      setCreatingStory(false)
    }
  }

  function resetStoryForm() {
    setCreateStoryOpen(false)
    setStoryContent('')
    setStoryImage(null)
    setStoryImagePreview(null)
    setStoryBackground('image')
    setStoryBgColor('#667eea')
    setStoryVisibility('public')
    setStoryTextPosition('bottom')
  }

  function handleAvatarClick() {
    if (user && (user.avatarUrl || user.avatar)) {
      // Ouvrir le modal viewer pour l'avatar
      const imageUrl = user.avatarUrl || user.avatar;
      setViewerImageUrl(imageUrl);
      setViewerImageAlt('Photo de profil');
      setImageViewerOpen(true);
    }
  }

  function handleCoverClick() {
    if (user && user.cover) {
      // Ouvrir le modal viewer pour la couverture
      setViewerImageUrl(user.cover);
      setViewerImageAlt('Photo de couverture');
      setImageViewerOpen(true);
    }
  }

  function handleAddToStory() {
    setCreateStoryOpen(true)
  }

  if (loadingProfile) {
    return <ProfileHeaderSkeleton />
  }

  if (!user) {
    return (
      <div style={{ padding: 20 }}>
        Aucun utilisateur connecté. <button onClick={() => router.push('/auth')}>Se connecter</button>
      </div>
    )
  }

  return (
    <div>
      {/* PROFILE HEADER */}
      <div className="card" style={{ marginBottom: 0, borderRadius: '8px 8px 0 0', overflow: 'visible' }}>
        <div className="profile-cover" style={{
          backgroundImage: user?.cover ? `url(${user.cover})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          cursor: user?.cover ? 'pointer' : 'default'
        }} onClick={user?.cover ? handleCoverClick : undefined}>
          <div style={{
            position: 'absolute',
            inset: 0,
            background: user?.cover ? 'transparent' : 'linear-gradient(135deg,#0B3D91 0%,#082B60 50%,#0B3D91 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 80,
            opacity: user?.cover ? 0 : 0.3
          }}>🌊</div>
          <div className="profile-cover-actions">
            <button className="btn-secondary" style={{ background: 'rgba(255,255,255,.9)' }} onClick={handleCoverPictureChange}>
              <i className="fas fa-camera"></i> Modifier la photo de couverture
            </button>
          </div>
        </div>

        <div className="profile-info-section">
          <div className="profile-top">
            {/* AVATAR */}
            <div className="profile-avatar-wrapper">
              <ClickableAvatar 
                user={user} 
                size="large" 
                disableNavigation={true} 
                onClick={handleAvatarClick}
                style={{ position: 'relative' }}
              />
              <div style={{
                position: 'absolute',
                bottom: 8,
                right: 8,
                width: 36,
                height: 36,
                background: 'var(--fb-bg)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                border: '3px solid white'
              }} onClick={handleProfilePictureChange}>
                <i className="fas fa-camera" style={{ fontSize: 14 }}></i>
              </div>
            </div>

            {/* NAME AREA */}
            <div className="profile-name-area">
              <div className="profile-name">{user.prenom} {user.nom}</div>
              {user.isOnline !== false && (
                <div className="online-indicator">
                  <div className="online-dot"></div>
                  <span className="online-text">En ligne</span>
                </div>
              )}
              <div className="profile-friends-count">{friendsList.length} amis</div>
              <div style={{ display: 'flex', marginTop: 8 }}>
                <div style={{ display: 'flex', marginLeft: -8 }}>
                  {/* Friends avatars placeholder */}
                </div>
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="profile-action-btns">
              <button className="btn-primary" onClick={handleAddToStory}>
                <i className="fas fa-plus"></i> Ajouter à la story
              </button>
              <button className="btn-secondary" onClick={handleEditProfile}>
                <i className="fas fa-pen"></i> Modifier le profil
              </button>
              <div style={{ position: 'relative' }} ref={chevronMenuRef}>
                <button 
                  className="btn-secondary" 
                  style={{ padding: '8px 10px' }}
                  onClick={() => setOpenMenu(openMenu === 'chevron' ? null : 'chevron')}
                >
                  <i className="fas fa-chevron-down"></i>
                </button>
                {openMenu === 'chevron' && (
                  <div style={{
                    position: 'absolute',
                    right: 0,
                    top: '100%',
                    marginTop: 8,
                    background: 'white',
                    borderRadius: 8,
                    boxShadow: '0 2px 12px rgba(0,0,0,.15)',
                    minWidth: 240,
                    zIndex: 200
                  }}>
                    <div style={{ padding: '8px' }}>
                      <div style={{
                        padding: '10px 16px',
                        cursor: 'pointer',
                        fontSize: 15,
                        borderRadius: 6,
                        transition: 'background .15s'
                      }} onMouseEnter={(e) => e.currentTarget.style.background = 'var(--fb-hover)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      onClick={() => {
                        navigator.clipboard.writeText(window.location.href)
                        setOpenMenu(null)
                      }}>
                        <i className="fas fa-copy" style={{ marginRight: 8 }}></i>Copier le lien
                      </div>
                      <div style={{
                        padding: '10px 16px',
                        cursor: 'pointer',
                        fontSize: 15,
                        borderRadius: 6,
                        transition: 'background .15s'
                      }} onMouseEnter={(e) => e.currentTarget.style.background = 'var(--fb-hover)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      onClick={() => {
                        router.push('/settings')
                        setOpenMenu(null)
                      }}>
                        <i className="fas fa-lock" style={{ marginRight: 8 }}></i>Confidentialité
                      </div>
                      <div style={{
                        padding: '10px 16px',
                        cursor: 'pointer',
                        fontSize: 15,
                        borderRadius: 6,
                        transition: 'background .15s'
                      }} onMouseEnter={(e) => e.currentTarget.style.background = 'var(--fb-hover)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      onClick={() => {
                        setActiveTab('Photos')
                        setOpenMenu(null)
                      }}>
                        <i className="fas fa-image" style={{ marginRight: 8 }}></i>Photos
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* TABS */}
          <div className="profile-tabs">
            {['Publications', 'À propos', 'Amis', 'Photos', 'Vidéos'].map(tab => (
              <div
                key={tab}
                className={`profile-tab ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}
                style={{ cursor: 'pointer' }}
              >
                {tab}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* PROFILE CONTENT */}
      <div className="profile-content">
        {/* LEFT SIDEBAR - Info Preview always visible except on tabs with dedicated sidebars */}
        {activeTab !== 'Publications' && activeTab !== 'Photos' && activeTab !== 'Vidéos' && activeTab !== 'Amis' && (
          <div className="profile-left">
            {/* Show Info preview always in left sidebar */}
            <div className="info-card">
                <h3>Infos</h3>
                <div>
                  {user.metier && <div className="info-item">
                    <i className="fas fa-briefcase"></i>
                    <span>Travaille chez <strong>{user.metier}</strong></span>
                  </div>}
                  {user.ecole && <div className="info-item">
                    <i className="fas fa-graduation-cap"></i>
                    <span>A étudié à <strong>{user.ecole}</strong></span>
                  </div>}
                  {user.ville && <div className="info-item">
                    <i className="fas fa-map-marker-alt"></i>
                    <span>Habite à <strong>{user.ville}</strong></span>
                  </div>}
                  {user.originaire && <div className="info-item">
                    <i className="fas fa-home"></i>
                    <span>Originaire de <strong>{user.originaire}</strong></span>
                  </div>}
                  {user.relation && <div className="info-item">
                    <i className="fas fa-heart"></i>
                    <span><strong>{user.relation}</strong></span>
                  </div>}
                  {user.membre && <div className="info-item">
                    <i className="fas fa-globe"></i>
                    <span>Membre depuis <strong>{user.membre}</strong></span>
                  </div>}
                  {!user.metier && !user.ecole && !user.ville && !user.originaire && !user.relation && !user.membre && (
                    <p style={{ color: 'var(--fb-text-secondary)', textAlign: 'center', padding: '12px 0' }}>Aucune information pour le moment</p>
                  )}
                </div>
              </div>
          </div>
        )}

        {/* À propos Section with Editing in Right Sidebar */}
        {activeTab === 'À propos' && (
          <div className="profile-left">
            {/* Info preview also shown in left sidebar for À propos tab, read-only */}
            {/* The edit form is in the right sidebar profile-right section below */}
          </div>
        )}

        <>
          {/* Show Photos when Photos tab selected */}
          {activeTab === 'Photos' && (
            <div className="profile-left">
              <div className="info-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <h3 style={{ margin: 0 }}>Photos</h3>
                  <button onClick={()=>setShowAllPhotos(!showAllPhotos)} style={{ color: 'var(--fb-blue)', fontSize: 15, cursor: 'pointer', background:'none',border:'none',padding:0}}>{showAllPhotos?'Fermer':'Voir tout'}</button>
                </div>
                <div style={{ padding: 0 }}>
                  {photoPosts && photoPosts.length > 0 ? (
                    <div className="photos-grid" style={{gridTemplateColumns: showAllPhotos ? 'repeat(auto-fill,minmax(120px,1fr))' : 'repeat(3,1fr)', gap: showAllPhotos?8:12}}>
                      {photoPosts.map((p, i) => {
                        const url = (p.media && p.media.url) || p.image
                        const viewerPost = {
                          ...p,
                          media: p.media,
                          image: p.image,
                          author: p.author || (user.prenom || user.nomUtilisateur || (user.email||'').split('@')[0]),
                          date: p.date || '',
                          initials: user.prenom ? `${user.prenom[0]}${(user.nom||'')[0]||''}`.toUpperCase() : (user.nomUtilisateur ? user.nomUtilisateur.slice(0,2).toUpperCase() : 'JD'),
                          color: 'linear-gradient(135deg, #0B3D91, #082B60)',
                          privacy: p.privacy || 'globe',
                          likes: p.likes || 0,
                          shares: p.shares || 0,
                          avatarUrl: user.avatarUrl,
                          avatar: user.avatar
                        }
                        return (
                          <div key={i} className="photo-thumb" style={{cursor:'pointer'}} onClick={() => openPostViewer(viewerPost)}>
                            <img src={url} alt={`photo-${i}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div style={{ padding: 16, textAlign: 'center', color: 'var(--fb-text-secondary)' }}>Aucune photo pour le moment</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Show Videos when Vidéos tab selected */}
          {activeTab === 'Vidéos' && (
            <div className="profile-left">
              <div className="info-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <h3 style={{ margin: 0 }}>Vidéos</h3>
                  <button onClick={()=>setShowAllPhotos(!showAllPhotos)} style={{ color: 'var(--fb-blue)', fontSize: 15, cursor: 'pointer', background:'none',border:'none',padding:0}}>{showAllPhotos?'Fermer':'Voir tout'}</button>
                </div>
                <div style={{ padding: 0 }}>
                  {videoPosts && videoPosts.length > 0 ? (
                    <div className="photos-grid" style={{gridTemplateColumns: showAllPhotos ? 'repeat(auto-fill,minmax(120px,1fr))' : 'repeat(3,1fr)', gap: showAllPhotos?8:12}}>
                      {videoPosts.map((p, i) => {
                        const url = p.media && p.media.url
                        const viewerPost = {
                          ...p,
                          media: p.media,
                          author: p.author || (user.prenom || user.nomUtilisateur || (user.email||'').split('@')[0]),
                          date: p.date || '',
                          initials: user.prenom ? `${user.prenom[0]}${(user.nom||'')[0]||''}`.toUpperCase() : (user.nomUtilisateur ? user.nomUtilisateur.slice(0,2).toUpperCase() : 'JD'),
                          color: 'linear-gradient(135deg, #0B3D91, #082B60)',
                          privacy: p.privacy || 'globe',
                          likes: p.likes || 0,
                          shares: p.shares || 0,
                          avatarUrl: user.avatarUrl,
                          avatar: user.avatar
                        }
                        return (
                          <div key={i} className="photo-thumb" style={{cursor:'pointer', position: 'relative'}} onClick={() => openPostViewer(viewerPost)}>
                            <img src={url} alt={`video-${i}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.4)'}}
                            >
                              <i className="fas fa-play" style={{color: 'white', fontSize: 24}}></i>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div style={{ padding: 16, textAlign: 'center', color: 'var(--fb-text-secondary)' }}>Aucune vidéo pour le moment</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Show Friends when Amis tab selected */}
          {activeTab === 'Amis' && (
            <div className="profile-left">
              <div className="info-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <h3 style={{ margin: 0 }}>Amis <span style={{ fontSize: 15, fontWeight: 400, color: 'var(--fb-text-secondary)' }}>{friendsList ? friendsList.length : 0}</span></h3>
                  <button onClick={()=>setShowAllFriends(!showAllFriends)} style={{ color: 'var(--fb-blue)', fontSize: 15, cursor: 'pointer', background:'none',border:'none',padding:0}}>{showAllFriends?'Fermer':'Voir tout'}</button>
                </div>
                <div style={{ padding: 0 }}>
                  {friendsList && friendsList.length > 0 ? (
                    <div style={{ display: 'grid', gridTemplateColumns: showAllFriends ? 'repeat(auto-fill,minmax(80px,1fr))' : 'repeat(3, 1fr)', gap: showAllFriends?6:8 }}>
                      {friendsList.map((f, idx) => (
                        <div key={idx} style={{ textAlign: 'center', cursor: 'pointer' }} onClick={() => router.push(`/profile?id=${f.id}`)}>
                          <ClickableAvatar user={f} size="large" />
                          <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 6 }}>{f.prenom} {f.nom}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ padding: 16, textAlign: 'center', color: 'var(--fb-text-secondary)' }}>Les amis ajoutés apparaîtront ici</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </>

        {/* RIGHT SIDEBAR */}
        <div className="profile-right">
          {/* Render main tab content - hide card when Photos, Vidéos, or Amis tab is active */}
          {activeTab !== 'Photos' && activeTab !== 'Vidéos' && activeTab !== 'Amis' && (
          <div className="card" style={{ padding: 12, marginBottom: 12 }}>
            {activeTab === 'Publications' && (
              <div>
                {/* CREATE POST inside Publications */}
                <CreatePost
                  user={user}
                  onOpen={() => { try { window.dispatchEvent(new CustomEvent('openCreatePost')) } catch(e){} }}
                  onOpenTextPublication={() => { try { window.dispatchEvent(new CustomEvent('openTextPublication')) } catch(e){} }}
                  onOpenLiveVideo={() => setShowLiveVideoModal(true)}
                />

                <h3 style={{ margin: '0 0 8px 0' }}>Publications</h3>
                {loadingPublications ? (
                  <div style={{ color: 'var(--fb-text-secondary)' }}>Chargement des publications...</div>
                ) : userPublications.length > 0 ? (
                  <div style={{ marginTop: 12 }}>
                    {userPublications.map(post => (
                      <div key={post.id} style={{ cursor: 'pointer' }} onClick={() => openPostViewer({
                        ...post,
                        author: post.author || (user.prenom || user.nomUtilisateur || (user.email||'').split('@')[0]),
                        date: new Date(post.createdAt).toLocaleDateString('fr-FR'),
                        initials: user.prenom ? `${user.prenom[0]}${(user.nom||'')[0]||''}`.toUpperCase() : (user.nomUtilisateur ? user.nomUtilisateur.slice(0,2).toUpperCase() : 'JD'),
                        color: 'linear-gradient(135deg, #0B3D91, #082B60)',
                        privacy: post.privacy || 'globe',
                        likes: post.likes || 0,
                        shares: post.shares || 0,
                        avatarUrl: user.avatarUrl,
                        avatar: user.avatar
                      })}>
                        <PostCard 
                          post={{
                            ...post,
                            author: post.author || (user.prenom || user.nomUtilisateur || (user.email||'').split('@')[0]),
                            date: new Date(post.createdAt).toLocaleDateString('fr-FR'),
                            initials: user.prenom ? `${user.prenom[0]}${(user.nom||'')[0]||''}`.toUpperCase() : (user.nomUtilisateur ? user.nomUtilisateur.slice(0,2).toUpperCase() : 'JD'),
                            color: 'linear-gradient(135deg, #0B3D91, #082B60)',
                            privacy: post.privacy || 'globe',
                            likes: post.likes || 0,
                            shares: post.shares || 0,
                            avatarUrl: user.avatarUrl,
                            avatar: user.avatar
                          }}
                          currentUser={user}
                          disableModal={true}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ color: 'var(--fb-text-secondary)' }}>Aucune publication pour le moment</div>
                )}
                <CreatePostModal currentUser={user} sponsorId={null} sponsorTitle={null} />
                {/* Text Publication Modal for profile */}
                <Modal open={showTextPublicationModal} onClose={resetTextPublicationModal} title="Créer une publication texte">
                  <div style={{display:'flex',gap:'20px',maxHeight:'600px'}}>
                    {/* Preview */}
                    <div style={{flex:'0 0 300px',display:'flex',flexDirection:'column',alignItems:'center'}}>
                      <div style={{
                        width:'100%',
                        height:'400px',
                        background: textPubBgType === 'color' ? textPubBgColor : '#f0f0f0',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        borderRadius:'12px',
                        display:'flex',
                        alignItems:'center',
                        justifyContent:'center',
                        padding:'16px',
                        boxShadow:'0 4px 12px rgba(0,0,0,0.15)',
                        position:'relative',
                        overflow:'hidden'
                      }}>
                        <div style={{
                          color: textPubTextColor,
                          fontSize:'18px',
                          textAlign:'center',
                          fontWeight:'600',
                          maxWidth:'90%',
                          wordWrap:'break-word'
                        }}>
                          {textPubContent}
                        </div>
                      </div>
                      <div className="action-buttons" style={{display:'flex',gap:'8px',marginTop:'10px',justifyContent:'center',width:'100%'}}>
                        <button type="button" onClick={resetTextPublicationModal} style={{padding:'8px 12px',background:'var(--fb-bg)',border:'1px solid var(--fb-border)',borderRadius:'8px',cursor:'pointer',fontWeight:'500',fontSize:'13px',transition:'all 0.15s'}}>Annuler</button>
                        <button type="button" onClick={handleCreateTextPublication} style={{padding:'8px 12px',background:'var(--fb-blue)',color:'white',border:'none',borderRadius:'8px',cursor:'pointer',fontWeight:'600',fontSize:'13px',transition:'all 0.15s'}}>Publier</button>
                      </div>
                    </div>

                    {/* Controls */}
                    <div style={{flex:1,overflowY:'auto',paddingRight:'8px'}}>
                      <div style={{marginBottom:'16px'}}>
                        <textarea
                          placeholder="Écrivez votre texte..."
                          value={textPubContent}
                          onChange={(e)=>setTextPubContent(e.target.value)}
                          maxLength={200}
                          style={{
                            width:'100%',
                            height:'80px',
                            padding:'10px',
                            border:'1px solid var(--fb-border)',
                            borderRadius:'8px',
                            fontFamily:'inherit',
                            fontSize:'13px',
                            resize:'none'
                          }}
                        />
                        <div style={{fontSize:'11px',color:'var(--fb-text-secondary)',marginTop:'4px'}}>
                          {textPubContent.length}/200
                        </div>
                      </div>

                      <div style={{marginBottom:'16px'}}>
                        <label style={{display:'block',fontSize:'12px',fontWeight:'600',color:'var(--fb-text-secondary)',marginBottom:'6px'}}>Arrière-plan</label>
                        <div style={{display:'flex',gap:'8px'}}>
                          <button type="button" onClick={()=>setTextPubBgType('color')} style={{flex:1,padding:'8px',background:textPubBgType==='color'?'var(--fb-blue)':'var(--fb-bg)',color:textPubBgType==='color'?'white':'var(--fb-text)',border:'1px solid var(--fb-border)',borderRadius:'6px',cursor:'pointer',fontSize:'12px',fontWeight:'500',transition:'all 0.15s'}}>Couleur</button>
                          <button type="button" onClick={()=>setTextPubBgType('image')} style={{flex:1,padding:'8px',background:textPubBgType==='image'?'var(--fb-blue)':'var(--fb-bg)',color:textPubBgType==='image'?'white':'var(--fb-text)',border:'1px solid var(--fb-border)',borderRadius:'6px',cursor:'pointer',fontSize:'12px',fontWeight:'500',transition:'all 0.15s'}}>Image</button>
                        </div>
                      </div>

                      {textPubBgType==='color' && (
                        <div style={{marginBottom:'16px'}}>
                          <label style={{display:'block',fontSize:'12px',fontWeight:'600',color:'var(--fb-text-secondary)',marginBottom:'6px'}}>Couleur du fond</label>
                          <input type="color" value={textPubBgColor} onChange={e=>setTextPubBgColor(e.target.value)} style={{width:'100%',height:'32px',border:'none',padding:0}} />
                        </div>
                      )}

                      <div style={{marginBottom:'16px'}}>
                        <label style={{display:'block',fontSize:'12px',fontWeight:'600',color:'var(--fb-text-secondary)',marginBottom:'6px'}}>Couleur du texte</label>
                        <input type="color" value={textPubTextColor} onChange={e=>setTextPubTextColor(e.target.value)} style={{width:'100%',height:'32px',border:'none',padding:0}} />
                      </div>
                    </div>
                  </div>
                </Modal>
              </div>
            )}

            {activeTab === 'À propos' && (
              <div>
                <h3 style={{ margin: '0 0 8px 0' }}>À propos</h3>
                {!editMode ? (
                  <div>
                    {user.metier && <div className="info-item">
                      <i className="fas fa-briefcase"></i>
                      <span>Travaille chez <strong>{user.metier}</strong></span>
                    </div>}
                    {user.ecole && <div className="info-item">
                      <i className="fas fa-graduation-cap"></i>
                      <span>A étudié à <strong>{user.ecole}</strong></span>
                    </div>}
                    {user.ville && <div className="info-item">
                      <i className="fas fa-map-marker-alt"></i>
                      <span>Habite à <strong>{user.ville}</strong></span>
                    </div>}
                    {user.originaire && <div className="info-item">
                      <i className="fas fa-home"></i>
                      <span>Originaire de <strong>{user.originaire}</strong></span>
                    </div>}
                    {user.relation && <div className="info-item">
                      <i className="fas fa-heart"></i>
                      <span><strong>{user.relation}</strong></span>
                    </div>}
                    {user.membre && <div className="info-item">
                      <i className="fas fa-globe"></i>
                      <span>Membre depuis <strong>{user.membre}</strong></span>
                    </div>}
                    {!user.metier && !user.ecole && !user.ville && !user.originaire && !user.relation && !user.membre && (
                      <p style={{ color: 'var(--fb-text-secondary)', textAlign: 'center', padding: '12px 0' }}>Aucune information pour le moment</p>
                    )}
                    <button className="btn-secondary" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }} onClick={handleEditProfile}>
                      Modifier les infos
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div className="edit-form-group">
                      <label className="edit-form-label">Travail</label>
                      <input type="text" className="edit-form-input" value={editMetier} onChange={(e)=>setEditMetier(e.target.value)} placeholder="Titre ou entreprise" />
                    </div>
                    <div className="edit-form-group">
                      <label className="edit-form-label">Études</label>
                      <input type="text" className="edit-form-input" value={editEcole} onChange={(e)=>setEditEcole(e.target.value)} placeholder="École ou université" />
                    </div>
                    <div className="edit-form-group">
                      <label className="edit-form-label">Ville</label>
                      <input type="text" className="edit-form-input" value={editVille} onChange={(e)=>setEditVille(e.target.value)} placeholder="Ville actuelle" />
                    </div>
                    <div className="edit-form-group">
                      <label className="edit-form-label">Originaire de</label>
                      <input type="text" className="edit-form-input" value={editOriginaire} onChange={(e)=>setEditOriginaire(e.target.value)} placeholder="Ville ou région" />
                    </div>
                    <div className="edit-form-group">
                      <label className="edit-form-label">Situation relationnelle</label>
                      <input type="text" className="edit-form-input" value={editRelation} onChange={(e)=>setEditRelation(e.target.value)} placeholder="Situation actuelle" />
                    </div>
                    <div className="edit-form-group">
                      <label className="edit-form-label">Membre depuis</label>
                      <input type="text" className="edit-form-input" value={editMembre} onChange={(e)=>setEditMembre(e.target.value)} placeholder="Date ou période" />
                    </div>
                    <div style={{display:'flex',gap:'12px',marginTop:'12px'}}>
                      <button className="btn-secondary" style={{ flex: 1 }} onClick={handleCancelEdit}>Annuler</button>
                      <button className="btn-primary" style={{ flex: 1 }} onClick={handleSaveProfile}>Sauvegarder</button>
                    </div>
                  </div>
                )}
              </div>
            )}

                      </div>
          )}
        </div>
      </div>

      {/* Upload Modal for Avatar/Cover */}
      {uploadModal && (
        <Modal open={uploadModal !== null} onClose={() => {
          setUploadModal(null)
          setAvatarPreviewUrl(null)
          setCoverPreviewUrl(null)
          setSelectedFile(null)
        }} title={uploadModal === 'avatar' ? 'Modifier la photo de profil' : 'Modifier la photo de couverture'}>
          <div style={{display:'flex',flexDirection:'column',gap:16,alignItems:'center'}}>
            <div style={{padding:16,border:'2px dashed var(--fb-border)',borderRadius:12,textAlign:'center',cursor:'pointer',width:'100%'}} 
              onDragOver={(e)=>e.preventDefault()} 
              onDrop={handleDrop}
              onClick={() => uploadModal === 'avatar' ? avatarInputRef.current?.click() : coverInputRef.current?.click()}>
              {(uploadModal === 'avatar' ? avatarPreviewUrl : coverPreviewUrl) ? (
                <img src={uploadModal === 'avatar' ? avatarPreviewUrl : coverPreviewUrl} alt="preview" style={{maxWidth:'100%',maxHeight:300,borderRadius:8}} />
              ) : (
                <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:8,padding:24}}>
                  <i className="fas fa-cloud-upload-alt" style={{fontSize:32,color:'var(--fb-blue)'}}></i>
                  <p style={{margin:0,fontWeight:600}}>Glissez-déposez une image ici</p>
                  <p style={{margin:0,fontSize:13,color:'var(--fb-text-secondary)'}}>ou cliquez pour sélectionner</p>
                </div>
              )}
            </div>
            <input 
              ref={avatarInputRef} 
              type="file" 
              accept="image/*" 
              onChange={handleAvatarUpload} 
              style={{display:'none'}} 
            />
            <input 
              ref={coverInputRef} 
              type="file" 
              accept="image/*" 
              onChange={handleCoverUpload} 
              style={{display:'none'}} 
            />
            {uploading && (
              <div style={{width:'100%',display:'flex',flexDirection:'column',gap:8}}>
                <div style={{fontSize:14,color:'var(--fb-text-secondary)',textAlign:'center',fontWeight:500}}>Téléchargement en cours...</div>
                <div className="upload-progress-bar">
                  <div className="upload-progress-fill" style={{width:`${uploadProgress}%`}}></div>
                </div>
                <div style={{fontSize:12,color:'var(--fb-text-secondary)',textAlign:'center',fontWeight:600}}>{uploadProgress}%</div>
              </div>
            )}
            <div style={{display:'flex',gap:8,width:'100%'}}>
              <button className="btn-secondary" style={{flex:1}} disabled={uploading} onClick={() => {
                setUploadModal(null)
                setAvatarPreviewUrl(null)
                setCoverPreviewUrl(null)
                setSelectedFile(null)
              }}>Annuler</button>
              <button className="btn-primary" style={{flex:1,opacity:uploading?0.7:1,cursor:uploading?'not-allowed':'pointer'}} disabled={uploading || !selectedFile} onClick={handleConfirmUpload}>
                {uploading ? (
                  <span style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
                    <i className="fas fa-spinner" style={{animation:'spin 1s linear infinite'}}></i>
                    Téléchargement...
                  </span>
                ) : (
                  'Confirmer'
                )}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* modal viewer for posts/photos */}
      {postViewerOpen && (
        <div className="modal-overlay open" onClick={closePostViewer} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000}}>
          <div style={{width: '100%', maxWidth: 800, maxHeight: '90vh', overflow: 'auto', background: 'var(--fb-white)', borderRadius: 16, boxShadow: '0 16px 48px rgba(0,0,0,0.15)'}} onClick={(e) => e.stopPropagation()}>
            <PostViewer post={selectedPost} onClose={closePostViewer} onDelete={handleDeletePost} />
          </div>
        </div>
      )}

      {/* Story Creation Modal */}
      <Modal open={createStoryOpen} onClose={resetStoryForm} title="Créer une story">
        <div style={{display:'flex',gap:'20px',maxHeight:'600px'}}>
          {/* Preview */}
          <div style={{flex:'0 0 300px',display:'flex',flexDirection:'column',alignItems:'center'}}>
            <div style={{
              width:'100%',
              height:'400px',
              background: storyImagePreview ? `url(${storyImagePreview}) center/cover` : storyBgColor,
              borderRadius:'12px',
              display:'flex',
              alignItems:'center',
              justifyContent:'center',
              padding:'16px',
              boxShadow:'0 4px 12px rgba(0,0,0,0.15)',
              position:'relative',
              overflow:'hidden'
            }}>
              {storyContent && (
                <div style={{
                  color: 'white',
                  fontSize:'24px',
                  textAlign:'center',
                  fontWeight:'700',
                  textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
                  maxWidth:'90%',
                  wordWrap:'break-word'
                }}>
                  {storyContent}
                </div>
              )}
            </div>
            <div className="action-buttons" style={{display:'flex',gap:'8px',marginTop:'10px',justifyContent:'center',width:'100%'}}>
              <button type="button" onClick={resetStoryForm} style={{padding:'8px 12px',background:'var(--fb-bg)',border:'1px solid var(--fb-border)',borderRadius:'8px',cursor:'pointer',fontWeight:'500',fontSize:'13px',transition:'all 0.15s'}}>Annuler</button>
              <button type="button" onClick={handleCreateStory} disabled={creatingStory} style={{padding:'8px 12px',background:'var(--fb-blue)',color:'white',border:'none',borderRadius:'8px',cursor:creatingStory?'not-allowed':'pointer',fontWeight:'600',fontSize:'13px',transition:'all 0.15s',opacity:creatingStory?0.7:1}}>
                {creatingStory ? 'Création...' : 'Publier'}
              </button>
            </div>
          </div>

          {/* Controls */}
          <div style={{flex:1,overflowY:'auto',paddingRight:'8px'}}>
            <div style={{marginBottom:'16px'}}>
              <textarea
                placeholder="Écrivez quelque chose..."
                value={storyContent}
                onChange={(e)=>setStoryContent(e.target.value)}
                maxLength={100}
                style={{
                  width:'100%',
                  height:'80px',
                  padding:'10px',
                  border:'1px solid var(--fb-border)',
                  borderRadius:'8px',
                  fontFamily:'inherit',
                  fontSize:'13px',
                  resize:'none'
                }}
              />
              <div style={{fontSize:'11px',color:'var(--fb-text-secondary)',marginTop:'4px'}}>
                {storyContent.length}/100
              </div>
            </div>

            <div style={{marginBottom:'16px'}}>
              <label style={{display:'block',fontSize:'12px',fontWeight:'600',color:'var(--fb-text-secondary)',marginBottom:'6px'}}>Arrière-plan</label>
              <div style={{display:'flex',gap:'8px'}}>
                <button type="button" onClick={()=>setStoryBackground('color')} style={{flex:1,padding:'8px',background:storyBackground==='color'?'var(--fb-blue)':'var(--fb-bg)',color:storyBackground==='color'?'white':'var(--fb-text)',border:'1px solid var(--fb-border)',borderRadius:'6px',cursor:'pointer',fontSize:'12px',fontWeight:'500',transition:'all 0.15s'}}>Couleur</button>
                <button type="button" onClick={()=>setStoryBackground('image')} style={{flex:1,padding:'8px',background:storyBackground==='image'?'var(--fb-blue)':'var(--fb-bg)',color:storyBackground==='image'?'white':'var(--fb-text)',border:'1px solid var(--fb-border)',borderRadius:'6px',cursor:'pointer',fontSize:'12px',fontWeight:'500',transition:'all 0.15s'}}>Image</button>
              </div>
            </div>

            {storyBackground==='color' && (
              <div style={{marginBottom:'16px'}}>
                <label style={{display:'block',fontSize:'12px',fontWeight:'600',color:'var(--fb-text-secondary)',marginBottom:'6px'}}>Couleur du fond</label>
                <input type="color" value={storyBgColor} onChange={e=>setStoryBgColor(e.target.value)} style={{width:'100%',height:'32px',border:'none',padding:0}} />
              </div>
            )}

            {storyBackground==='image' && (
              <div style={{marginBottom:'16px'}}>
                <label style={{display:'block',fontSize:'12px',fontWeight:'600',color:'var(--fb-text-secondary)',marginBottom:'6px'}}>Image</label>
                <div style={{padding:16,border:'2px dashed var(--fb-border)',borderRadius:12,textAlign:'center',cursor:'pointer'}} onClick={() => storyImageInputRef.current?.click()}>
                  {storyImagePreview ? (
                    <img src={storyImagePreview} alt="preview" style={{maxWidth:'100%',maxHeight:150,borderRadius:8}} />
                  ) : (
                    <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:8}}>
                      <i className="fas fa-cloud-upload-alt" style={{fontSize:24,color:'var(--fb-blue)'}}></i>
                      <p style={{margin:0,fontSize:13,color:'var(--fb-text-secondary)'}}>Cliquez pour sélectionner une image</p>
                    </div>
                  )}
                </div>
                <input 
                  ref={storyImageInputRef} 
                  type="file" 
                  accept="image/*" 
                  onChange={handleStoryImageSelect} 
                  style={{display:'none'}} 
                />
              </div>
            )}

            <div style={{marginBottom:'16px'}}>
              <label style={{display:'block',fontSize:'12px',fontWeight:'600',color:'var(--fb-text-secondary)',marginBottom:'6px'}}>Visibilité</label>
              <select value={storyVisibility} onChange={(e)=>setStoryVisibility(e.target.value)} style={{width:'100%',padding:'8px',border:'1px solid var(--fb-border)',borderRadius:'6px',fontSize:'13px'}}>
                <option value="public">Public</option>
                <option value="friends">Amis</option>
              </select>
            </div>
          </div>
        </div>
      </Modal>

      {/* Image Viewer Modal */}
      <Modal open={imageViewerOpen} onClose={() => setImageViewerOpen(false)} title="">
        <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:16,maxWidth:'90vw',maxHeight:'90vh'}}>
          <img 
            src={viewerImageUrl} 
            alt={viewerImageAlt} 
            style={{
              maxWidth:'100%', 
              maxHeight:'80vh', 
              objectFit:'contain',
              borderRadius:'8px',
              boxShadow:'0 4px 12px rgba(0,0,0,0.15)'
            }} 
          />
          <button 
            className="btn-secondary" 
            onClick={() => setImageViewerOpen(false)}
            style={{alignSelf:'center'}}
          >
            Fermer
          </button>
        </div>
      </Modal>

      {/* Live Video Modal */}
      <Modal open={showLiveVideoModal} onClose={() => setShowLiveVideoModal(false)} title="Vidéo en direct">
        <div style={{width: '100%', height: '80vh', minHeight: '600px'}}>
          <Live 
            liveId="demo-live" 
            userInfo={{ name: user?.prenom || 'Utilisateur', avatar: user?.avatarUrl || user?.avatar }}
          />
        </div>
      </Modal>
    </div>
  )
}
