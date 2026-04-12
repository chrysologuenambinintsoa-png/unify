import { useEffect, useState, useRef } from 'react'
import Modal from './Modal'
import Toast from './Toast'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faImage,
  faUserTag,
  faFaceSmile,
  faLocationDot,
  faVideo,
  faGlobe,
  faUserGroup,
  faLock,
  faXmark,
  faEllipsis,
  faMusic,
  faCamera,
  faFile,
  faSpinner,
  faCheck,
  faChevronDown,
  faPaperPlane,
  faTimes,
  faPlus,
  faGift,
  faPoll,
  faPen
} from '@fortawesome/free-solid-svg-icons'

export default function CreatePostModal({ currentUser, sponsorId = null, sponsorTitle = null, open: controlledOpen, onClose: controlledOnClose }) {
  const [isOpen, setIsOpen] = useState(false)
  const [postContent, setPostContent] = useState('')
  const [selectedImage, setSelectedImage] = useState(null)
  const [selectedVideo, setSelectedVideo] = useState(null)
  const [selectedFiles, setSelectedFiles] = useState([])
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [toast, setToast] = useState(null)
  const fileInputRef = useRef(null)
  const videoInputRef = useRef(null)
  const [originalFile, setOriginalFile] = useState(null)
  const [showTagModal, setShowTagModal] = useState(false)
  const [showFeelingModal, setShowFeelingModal] = useState(false)
  const [showLocationModal, setShowLocationModal] = useState(false)
  const [showPrivacyDropdown, setShowPrivacyDropdown] = useState(false)
  const [tagInput, setTagInput] = useState('')
  const [taggedUsers, setTaggedUsers] = useState([])
  const [feelingSelected, setFeelingSelected] = useState(null)
  const [locationInput, setLocationInput] = useState('')
  const [privacy, setPrivacy] = useState('public')
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const textareaRef = useRef(null)
  const privacyDropdownRef = useRef(null)

  const isModalOpen = controlledOpen !== undefined ? controlledOpen : isOpen

  const handleClose = () => {
    if (controlledOnClose) {
      controlledOnClose()
    } else {
      setIsOpen(false)
    }
  }

  const handleOpen = () => {
    if (controlledOpen === undefined) {
      setIsOpen(true)
    }
  }

  const modalTitle = sponsorTitle ? `Publier sur la page de ${sponsorTitle}` : 'Créer une publication'
  const userName = currentUser ? (currentUser.prenom || currentUser.nomUtilisateur || (currentUser.email || '').split('@')[0]) : 'Jean Dupont'
  const userInitials = currentUser ? (currentUser.prenom ? `${currentUser.prenom[0]}${(currentUser.nom || '')[0] || ''}`.toUpperCase() : (currentUser.nomUtilisateur ? currentUser.nomUtilisateur.slice(0, 2).toUpperCase() : (currentUser.email || '')[0]?.toUpperCase())) : 'JD'
  const moodOptions = [
    { emoji: '😊', label: 'Joyeux', icon: '😄' },
    { emoji: '😔', label: 'Triste', icon: '😢' },
    { emoji: '😍', label: 'Amoureux', icon: '❤️' },
    { emoji: '😡', label: 'En colère', icon: '😤' },
    { emoji: '😴', label: 'Fatigué', icon: '😪' },
    { emoji: '🤔', label: 'Pensif', icon: '🤔' },
    { emoji: '🎉', label: 'Célébrant', icon: '🎊' },
    { emoji: '😎', label: 'Confiant', icon: '💪' },
    { emoji: '😅', label: 'Rigolo', icon: '😂' },
    { emoji: '😢', label: 'Ému', icon: '🥹' },
    { emoji: '🥳', label: 'Fêtard', icon: '🎈' },
    { emoji: '😇', label: 'Reconnaissant', icon: '🙏' }
  ]

  const privacyOptions = [
    { value: 'public', label: 'Public', icon: faGlobe, color: '#003d5c' },
    { value: 'friends', label: 'Amis', icon: faUserGroup, color: '#42b72a' },
    { value: 'private', label: 'Privé', icon: faLock, color: '#f7b928' }
  ]

  const currentPrivacy = privacyOptions.find(p => p.value === privacy)
  const quickEmojis = ['😀', '😂', '❤️', '🎉', '😮', '😢', '😡', '👍', '🔥', '💯']

  useEffect(() => {
    function open() { setIsOpen(true) }
    window.addEventListener('openCreatePost', open)
    return () => {
      window.removeEventListener('openCreatePost', open)
    }
  }, [])

  useEffect(() => {
    function handleClickOutside(event) {
      if (privacyDropdownRef.current && !privacyDropdownRef.current.contains(event.target)) {
        setShowPrivacyDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function compressImage(file, maxWidth = 1200, maxHeight = 1200, quality = 0.75) {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (event) => {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          let width = img.width
          let height = img.height
          if (width > height) {
            if (width > maxWidth) {
              height *= maxWidth / width
              width = maxWidth
            }
          } else {
            if (height > maxHeight) {
              width *= maxHeight / height
              height = maxHeight
            }
          }
          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')
          ctx.drawImage(img, 0, 0, width, height)
          const compressed = canvas.toDataURL(file.type || 'image/jpeg', quality)
          resolve(compressed)
        }
        img.src = event.target.result
      }
      reader.readAsDataURL(file)
    })
  }

  function closeModal() {
    if (controlledOnClose) {
      controlledOnClose()
    } else {
      setIsOpen(false)
    }
    setPostContent('')
    setSelectedImage(null)
    setSelectedVideo(null)
    setSelectedFiles([])
    setOriginalFile(null)
    setUploadProgress(0)
    setIsUploading(false)
    setFeelingSelected(null)
    setLocationInput('')
    setTagInput('')
    setTaggedUsers([])
    setShowEmojiPicker(false)
  }

  function handlePhotoClick() { fileInputRef.current?.click() }
  function handleVideoClick() { videoInputRef.current?.click() }

  async function handleFileSelect(e) {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return
    
    // Filter to only images
    const imageFiles = files.filter(f => f.type.startsWith('image/'))
    if (imageFiles.length === 0) return
    
    setSelectedFiles(imageFiles)
    setOriginalFile(imageFiles[0])
    
    try {
      const compressed = await compressImage(imageFiles[0], 1200, 1200, 0.8)
      setSelectedImage(compressed)
    } catch (err) {
      console.error('compress error', err)
      const reader = new FileReader()
      reader.onload = ev => setSelectedImage(ev.target.result)
      reader.readAsDataURL(imageFiles[0])
    }
  }

  async function handleVideoSelect(e) {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return
    
    const videoFile = files[0]
    if (!videoFile.type.startsWith('video/')) {
      showToast('Veuillez sélectionner un fichier vidéo valide', 'warning')
      return
    }
    
    setOriginalFile(videoFile)
    setSelectedFiles([videoFile])
    
    // Create video preview
    const reader = new FileReader()
    reader.onload = (event) => {
      setSelectedVideo(event.target.result)
    }
    reader.readAsDataURL(videoFile)
  }

  function removeImage() {
    setSelectedImage(null)
    setSelectedVideo(null)
    setSelectedFiles([])
    setOriginalFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
    if (videoInputRef.current) videoInputRef.current.value = ''
  }

  function removeTaggedUser(userId) {
    setTaggedUsers(prev => prev.filter(u => u.id !== userId))
  }

  function addTaggedUser() {
    if (tagInput.trim()) {
      setTaggedUsers(prev => [...prev, { id: Date.now(), name: tagInput.trim() }])
      setTagInput('')
      setShowTagModal(false)
    }
  }

  function addEmoji(emoji) {
    setPostContent(prev => prev + emoji)
    textareaRef.current?.focus()
  }

  function showToast(message, type = 'info') {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

  async function handleCreate() {
    if (!postContent.trim() && !selectedImage && !selectedVideo) {
      showToast('Veuillez ajouter du contenu, une image ou une vidéo', 'warning');
      return;
    }

    // N'exige du texte que si aucune image/vidéo n'est présente
    if (!postContent.trim() && !selectedImage && !selectedVideo) {
      showToast('Le post doit contenir du texte, une image ou une vidéo.', 'error');
      return;
    }
    
    setIsUploading(true)
    setUploadProgress(10)
    
    try {
      const userStr = localStorage.getItem('user')
      const localUser = userStr ? JSON.parse(userStr) : null
      const authorName = localUser ? (localUser.prenom || localUser.nomUtilisateur || (localUser.email || '').split('@')[0]) : 'Jean Dupont'
      const userEmail = localUser?.email
      
      let contentWithTags = postContent.trim()
      if (taggedUsers.length > 0) {
        const tags = taggedUsers.map(u => `@${u.name}`).join(' ')
        contentWithTags = `${contentWithTags} ${tags}`.trim()
      }
      
      if (feelingSelected) {
        contentWithTags = `${contentWithTags} ${feelingSelected.emoji} ${feelingSelected.label}`.trim()
      }
      
      if (locationInput) {
        contentWithTags = `${contentWithTags} 📍 ${locationInput}`.trim()
      }
      
      const computedTitle = (contentWithTags || (selectedImage ? 'Image' : selectedVideo ? 'Vidéo' : '')).trim()
      let imageUrl = null
      let videoUrl = null

      if (selectedImage && originalFile) {
        setUploadProgress(30)
        try {
          const formData = new FormData()
          formData.append('file', originalFile)
          formData.append('type', 'publication')
          formData.append('userEmail', userEmail)

          const uploadRes = await fetch('/api/upload', {
            method: 'POST',
            body: formData
          })

          if (uploadRes.ok) {
            const uploadData = await uploadRes.json()
            imageUrl = uploadData.url || uploadData.secure_url
          } else {
            const errText = await uploadRes.text().catch(() => '')
            console.error('Upload failed:', uploadRes.status, errText)
            showToast('Erreur lors du téléchargement de l\'image: ' + (errText || uploadRes.status), 'error')
            setIsUploading(false)
            return
          }
        } catch (uploadErr) {
          console.error('Upload error:', uploadErr)
          showToast('Erreur lors du téléchargement de l\'image: ' + (uploadErr.message || uploadErr), 'error')
          setIsUploading(false)
          return
        }
      }

      if (selectedVideo && originalFile) {
        setUploadProgress(45)
        try {
          const formData = new FormData()
          formData.append('file', originalFile)
          formData.append('type', 'video')
          formData.append('userEmail', userEmail)

          const uploadRes = await fetch('/api/upload', {
            method: 'POST',
            body: formData
          })

          if (uploadRes.ok) {
            const uploadData = await uploadRes.json()
            videoUrl = uploadData.url || uploadData.secure_url
          } else {
            const errText = await uploadRes.text().catch(() => '')
            console.error('Video upload failed:', uploadRes.status, errText)
            showToast('Erreur lors du téléchargement de la vidéo: ' + (errText || uploadRes.status), 'error')
            setIsUploading(false)
            return
          }
        } catch (uploadErr) {
          console.error('Video upload error:', uploadErr)
          showToast('Erreur lors du téléchargement de la vidéo: ' + (uploadErr.message || uploadErr), 'error')
          setIsUploading(false)
          return
        }
      }

      setUploadProgress(60)
      // Build images array from image/video
      const mediaImages = [];
      if (imageUrl) mediaImages.push(imageUrl);
      
      const payload = {
        title: computedTitle,
        content: contentWithTags,
        images: mediaImages.length > 0 ? mediaImages : undefined,
        video: videoUrl || null,
        author: authorName,
        authorEmail: userEmail,
        avatarUrl: localUser?.avatarUrl || localUser?.avatar || null,
        privacy: privacy,
        taggedUsers: taggedUsers.map(u => u.name),
        feeling: feelingSelected ? feelingSelected.label : null,
        location: locationInput || null
      };
      // N'ajoute sponsorId que s'il est défini (pour éviter les erreurs de clé étrangère)
      if (sponsorId) {
        payload.sponsorId = sponsorId;
      }
      
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      // Envoie à l'API page si sponsorId (pageId) fourni, sinon fallback /api/items
      const apiUrl = sponsorId ? `/api/pages/${sponsorId}/posts` : '/api/items';
      const res = await fetch(apiUrl, { 
        method: 'POST', 
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload) 
      })
      
      setUploadProgress(80)
      let created
      if (res.ok) {
        created = await res.json()
      } else {
        // Use page info as author when posting on a page
        const postAuthor = sponsorTitle || authorName;
        created = {
          id: `temp-${Date.now()}`,
          title: computedTitle,
          content: contentWithTags,
          author: postAuthor,
          date: new Date().toISOString(),
          image: imageUrl || null,
          video: videoUrl || null
        }
      }
      
      try { 
        window.dispatchEvent(new CustomEvent('postCreated', { detail: created })) 
      } catch (e) { }
      
      setUploadProgress(100)
      showToast('Publication créée avec succès!', 'success')
      setTimeout(() => {
        try { window.dispatchEvent(new CustomEvent('reloadFeed')) } catch (e) { }
        closeModal()
      }, 500)
    } catch (e) {
      console.error('create error', e)
      showToast('Erreur lors de la création', 'error')
      setIsUploading(false)
    }
  }

  return (
    <Modal open={isModalOpen} onClose={handleClose} title={modalTitle}>
      <div className="fb-create-post">
        {/* Header Section */}
        <div className="fb-post-header">
          <div className="fb-post-user-info">
            <div className="fb-post-avatar-wrapper">
              {currentUser && (currentUser.avatarUrl || currentUser.avatar) ? (
                <img src={currentUser.avatarUrl || currentUser.avatar} alt="avatar" className="fb-post-avatar" />
              ) : (
                <div className="fb-post-avatar-placeholder">{userInitials}</div>
              )}
            </div>
            <div className="fb-post-user-details">
              <div className="fb-post-user-name">
                {userName}
                {feelingSelected && (
                  <span className="fb-post-feeling-inline">
                    {' '}est {feelingSelected.emoji} {feelingSelected.label}
                  </span>
                )}
                {taggedUsers.length > 0 && (
                  <span className="fb-post-tag-inline">
                    {' '}avec {taggedUsers.map(u => u.name).join(', ')}
                  </span>
                )}
              </div>
              {!sponsorId && (
                <div className="fb-post-privacy-wrapper" ref={privacyDropdownRef}>
                  <button 
                    className="fb-post-privacy-btn"
                    onClick={() => setShowPrivacyDropdown(!showPrivacyDropdown)}
                  >
                    <FontAwesomeIcon icon={currentPrivacy.icon} style={{ color: currentPrivacy.color }} />
                    <span>{currentPrivacy.label}</span>
                    <FontAwesomeIcon icon={faChevronDown} className="fb-privacy-chevron" />
                  </button>
                  {showPrivacyDropdown && (
                    <div className="fb-privacy-dropdown">
                      {privacyOptions.map(opt => (
                        <button
                          key={opt.value}
                          className={`fb-privacy-option ${privacy === opt.value ? 'active' : ''}`}
                          onClick={() => { setPrivacy(opt.value); setShowPrivacyDropdown(false) }}
                        >
                          <FontAwesomeIcon icon={opt.icon} style={{ color: opt.color }} />
                          <span>{opt.label}</span>
                          {privacy === opt.value && <FontAwesomeIcon icon={faCheck} className="fb-privacy-check" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="fb-post-content">
          <textarea
            ref={textareaRef}
            value={postContent}
            onChange={(e) => setPostContent(e.target.value)}
            className="fb-post-textarea"
            placeholder={`Quoi de neuf, ${userName} ?`}
            disabled={isUploading}
          />

          {/* Quick Emoji Bar */}
          <div className="fb-quick-emojis">
            {quickEmojis.map(emoji => (
              <button
                key={emoji}
                className="fb-quick-emoji-btn"
                onClick={() => addEmoji(emoji)}
                disabled={isUploading}
              >
                {emoji}
              </button>
            ))}
          </div>

          {/* Tagged Users Display */}
          {taggedUsers.length > 0 && (
            <div className="fb-tagged-users">
              <FontAwesomeIcon icon={faUserTag} className="fb-tag-icon" />
              <div className="fb-tagged-list">
                {taggedUsers.map(user => (
                  <span key={user.id} className="fb-tagged-user">
                    {user.name}
                    <button 
                      className="fb-remove-tag"
                      onClick={() => removeTaggedUser(user.id)}
                      disabled={isUploading}
                    >
                      <FontAwesomeIcon icon={faXmark} />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Image Preview */}
          {selectedImage && (
            <div className="fb-image-preview">
              <img src={selectedImage} alt="preview" className="fb-preview-img" />
              <button
                className="fb-remove-image"
                onClick={removeImage}
                disabled={isUploading}
              >
                <FontAwesomeIcon icon={faXmark} />
              </button>
              {selectedFiles.length > 1 && (
                <div className="fb-file-count">+{selectedFiles.length - 1}</div>
              )}
            </div>
          )}

          {/* Video Preview */}
          {selectedVideo && (
            <div className="fb-video-preview">
              <video src={selectedVideo} controls className="fb-preview-video" />
              <button
                className="fb-remove-image"
                onClick={removeImage}
                disabled={isUploading}
              >
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>
          )}

          {/* Location Display */}
          {locationInput && (
            <div className="fb-location-display">
              <FontAwesomeIcon icon={faLocationDot} className="fb-location-icon" />
              <span>{locationInput}</span>
              <button
                className="fb-remove-location"
                onClick={() => setLocationInput('')}
                disabled={isUploading}
              >
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>
          )}
        </div>

        {/* Add to Post Section */}
        <div className="fb-add-section">
          <div className="fb-add-label">Ajouter à votre publication</div>
          <div className="fb-add-icons">
            <button
              className="fb-add-icon-btn"
              onClick={handlePhotoClick}
              title="Photo/vidéo"
              disabled={isUploading}
            >
              <FontAwesomeIcon icon={faImage} style={{ color: '#45bd62' }} />
            </button>
            <button
              className="fb-add-icon-btn"
              onClick={handleVideoClick}
              title="Vidéo"
              disabled={isUploading}
            >
              <FontAwesomeIcon icon={faVideo} style={{ color: '#f3425f' }} />
            </button>
            <button
              className="fb-add-icon-btn"
              onClick={() => setShowTagModal(true)}
              title="Taguer des personnes"
              disabled={isUploading}
            >
              <FontAwesomeIcon icon={faUserTag} style={{ color: '#003d5c' }} />
            </button>
            <button
              className="fb-add-icon-btn"
              onClick={() => setShowFeelingModal(true)}
              title="Ajouter un sentiment"
              disabled={isUploading}
            >
              <FontAwesomeIcon icon={faFaceSmile} style={{ color: '#f7b928' }} />
            </button>
            <button
              className="fb-add-icon-btn"
              onClick={() => setShowLocationModal(true)}
              title="Ajouter une localisation"
              disabled={isUploading}
            >
              <FontAwesomeIcon icon={faLocationDot} style={{ color: '#f3425f' }} />
            </button>
          </div>
        </div>

        {/* Feeling Modal */}
        {showFeelingModal && (
          <div className="fb-modal-overlay" onClick={() => setShowFeelingModal(false)}>
            <div className="fb-feeling-modal" onClick={(e) => e.stopPropagation()}>
              <div className="fb-modal-header">
                <h3>Comment te sens-tu ?</h3>
                <button 
                  className="fb-modal-close-btn"
                  onClick={() => setShowFeelingModal(false)}
                  title="Fermer"
                >
                  <FontAwesomeIcon icon={faXmark} />
                </button>
              </div>
              <div className="fb-mood-grid">
                {moodOptions.map(mood => (
                  <button
                    key={mood.label}
                    className={`fb-mood-item ${feelingSelected?.label === mood.label ? 'selected' : ''}`}
                    onClick={() => {
                      setFeelingSelected(mood)
                      setShowFeelingModal(false)
                    }}
                  >
                    <span className="fb-mood-emoji">{mood.emoji}</span>
                    <span className="fb-mood-label">{mood.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tag Modal */}
        {showTagModal && (
          <div className="fb-modal-overlay" onClick={() => setShowTagModal(false)}>
            <div className="fb-tag-modal" onClick={(e) => e.stopPropagation()}>
              <h3>Taguer des personnes</h3>
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="Entrez le nom"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') addTaggedUser()
                }}
              />
              <button className="fb-tag-add-btn" onClick={addTaggedUser}>
                <FontAwesomeIcon icon={faPlus} /> Ajouter
              </button>
            </div>
          </div>
        )}

        {/* Location Modal */}
        {showLocationModal && (
          <div className="fb-modal-overlay" onClick={() => setShowLocationModal(false)}>
            <div className="fb-location-modal" onClick={(e) => e.stopPropagation()}>
              <h3>Où es-tu ?</h3>
              <input
                type="text"
                value={locationInput}
                onChange={(e) => setLocationInput(e.target.value)}
                placeholder="Entrez une localisation"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') setShowLocationModal(false)
                }}
              />
              <button 
                className="fb-location-confirm-btn"
                onClick={() => setShowLocationModal(false)}
              >
                <FontAwesomeIcon icon={faCheck} /> Valider
              </button>
            </div>
          </div>
        )}

        {/* Hidden File Inputs */}
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          accept="image/*"
          style={{ display: 'none' }}
          multiple
        />
        <input
          ref={videoInputRef}
          type="file"
          onChange={handleVideoSelect}
          accept="video/*"
          style={{ display: 'none' }}
        />

        {/* Upload Progress */}
        {isUploading && uploadProgress > 0 && (
          <div className="fb-upload-progress">
            <div className="fb-progress-bar">
              <div className="fb-progress-fill" style={{ width: `${uploadProgress}%` }}></div>
            </div>
            <span className="fb-progress-text">{uploadProgress}%</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="fb-post-actions">
          <button
            className="fb-post-cancel-btn"
            onClick={handleClose}
            disabled={isUploading}
          >
            Annuler
          </button>
          <button
            className="fb-post-create-btn"
            onClick={handleCreate}
            disabled={isUploading}
          >
            {isUploading ? (
              <>
                <FontAwesomeIcon icon={faSpinner} className="fb-spinner" /> Création...
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faPaperPlane} /> Publier
              </>
            )}
          </button>
        </div>

        {/* Toast Notification */}
        {toast && <Toast message={toast.message} type={toast.type} />}

        <style jsx>{`
          .fb-create-post {
            padding: 20px;
            background: #fff;
            border-radius: 8px;
          }

          .fb-post-header {
            display: flex;
            align-items: center;
            margin-bottom: 20px;
            padding-bottom: 20px;
            border-bottom: 1px solid #e5e5e5;
          }

          .fb-post-user-info {
            display: flex;
            align-items: center;
            flex: 1;
            gap: 12px;
          }

          .fb-post-avatar-wrapper {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            overflow: hidden;
          }

          .fb-post-avatar {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }

          .fb-post-avatar-placeholder {
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 16px;
          }

          .fb-post-user-details {
            flex: 1;
          }

          .fb-post-user-name {
            font-weight: 600;
            font-size: 14px;
            color: #000;
          }

          .fb-post-feeling-inline,
          .fb-post-tag-inline {
            color: #65676b;
            font-weight: 400;
          }

          .fb-post-privacy-wrapper {
            position: relative;
            margin-top: 5px;
          }

          .fb-post-privacy-btn {
            display: flex;
            align-items: center;
            gap: 8px;
            background: #f0f2f5;
            border: none;
            padding: 6px 12px;
            border-radius: 6px;
            font-size: 13px;
            cursor: pointer;
            transition: background 0.2s;
          }

          .fb-post-privacy-btn:hover {
            background: #e4e6eb;
          }

          .fb-privacy-chevron {
            font-size: 12px;
            color: #65676b;
          }

          .fb-privacy-dropdown {
            position: absolute;
            top: 100%;
            left: 0;
            background: white;
            border: 1px solid #e5e5e5;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            min-width: 200px;
            z-index: 1000;
            margin-top: 5px;
          }

          .fb-privacy-option {
            display: flex;
            align-items: center;
            gap: 12px;
            width: 100%;
            padding: 10px 15px;
            border: none;
            background: white;
            cursor: pointer;
            text-align: left;
            transition: background 0.2s;
            font-size: 14px;
          }

          .fb-privacy-option:hover {
            background: #f0f2f5;
          }

          .fb-privacy-option.active {
            background: #e7f3ff;
            color: #003d5c;
          }

          .fb-privacy-check {
            margin-left: auto;
            color: #31a24c;
          }

          .fb-post-content {
            margin-bottom: 20px;
          }

          .fb-post-textarea {
            width: 100%;
            min-height: 100px;
            padding: 12px;
            border: 1px solid #e5e5e5;
            border-radius: 8px;
            font-size: 16px;
            font-family: inherit;
            resize: vertical;
            outline: none;
            transition: border-color 0.2s;
          }

          .fb-post-textarea:focus {
            border-color: #667eea;
          }

          .fb-post-textarea:disabled {
            background: #f5f5f5;
            color: #999;
          }

          .fb-quick-emojis {
            display: flex;
            gap: 8px;
            margin-top: 12px;
            flex-wrap: wrap;
          }

          .fb-quick-emoji-btn {
            width: 40px;
            height: 40px;
            border: 1px solid #e5e5e5;
            border-radius: 50%;
            background: white;
            cursor: pointer;
            font-size: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s;
          }

          .fb-quick-emoji-btn:hover:not(:disabled) {
            background: #f0f2f5;
            border-color: #667eea;
          }

          .fb-quick-emoji-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }

          .fb-tagged-users {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-top: 12px;
            padding: 10px;
            background: #f0f2f5;
            border-radius: 8px;
          }

          .fb-tag-icon {
            color: #667eea;
          }

          .fb-tagged-list {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
          }

          .fb-tagged-user {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            background: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
          }

          .fb-remove-tag {
            background: none;
            border: none;
            cursor: pointer;
            color: #999;
            padding: 0;
            font-size: 12px;
          }

          .fb-remove-tag:hover {
            color: #f3425f;
          }

          .fb-image-preview {
            position: relative;
            margin-top: 12px;
            border-radius: 8px;
            overflow: hidden;
            background: #f0f2f5;
          }

          .fb-preview-img {
            max-width: 100%;
            max-height: 300px;
            width: 100%;
            object-fit: contain;
          }

          .fb-remove-image {
            position: absolute;
            top: 10px;
            right: 10px;
            width: 32px;
            height: 32px;
            background: rgba(0, 0, 0, 0.5);
            color: white;
            border: none;
            border-radius: 50%;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background 0.2s;
          }

          .fb-remove-image:hover {
            background: rgba(0, 0, 0, 0.8);
          }

          .fb-file-count {
            position: absolute;
            bottom: 10px;
            right: 10px;
            background: rgba(0, 0, 0, 0.6);
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
          }

          .fb-video-preview {
            position: relative;
            margin-top: 12px;
            border-radius: 8px;
            overflow: hidden;
            background: #000;
          }

          .fb-preview-video {
            max-width: 100%;
            max-height: 300px;
            width: 100%;
            object-fit: contain;
          }

          .fb-location-display {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-top: 12px;
            padding: 10px;
            background: #f0f2f5;
            border-radius: 8px;
            font-size: 14px;
          }

          .fb-location-icon {
            color: #f3425f;
          }

          .fb-remove-location {
            margin-left: auto;
            background: none;
            border: none;
            cursor: pointer;
            color: #999;
            padding: 0;
            font-size: 14px;
          }

          .fb-remove-location:hover {
            color: #f3425f;
          }

          .fb-add-section {
            margin-bottom: 20px;
            padding: 15px;
            background: #f0f2f5;
            border-radius: 8px;
          }

          .fb-add-label {
            font-size: 12px;
            font-weight: 600;
            color: #65676b;
            margin-bottom: 12px;
            text-transform: uppercase;
          }

          .fb-add-icons {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
          }

          .fb-add-icon-btn {
            flex: 1;
            min-width: 60px;
            padding: 10px;
            background: white;
            border: 1px solid #e5e5e5;
            border-radius: 6px;
            cursor: pointer;
            font-size: 18px;
            transition: all 0.2s;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .fb-add-icon-btn:hover:not(:disabled) {
            background: #f0f2f5;
            border-color: #667eea;
          }

          .fb-add-icon-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }

          .fb-modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 2000;
          }

          .fb-feeling-modal,
          .fb-tag-modal,
          .fb-location-modal {
            background: white;
            border-radius: 8px;
            padding: 20px;
            max-width: 500px;
            width: 90%;
            box-shadow: 0 5px 40px rgba(0, 0, 0, 0.16);
          }

          .fb-feeling-modal h3,
          .fb-tag-modal h3,
          .fb-location-modal h3 {
            font-size: 18px;
            margin: 0;
            color: #000;
          }

          .fb-modal-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 15px;
            position: relative;
          }

          .fb-modal-close-btn {
            background: none;
            border: none;
            color: #65676b;
            cursor: pointer;
            font-size: 24px;
            padding: 0;
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            transition: all 0.2s;
          }

          .fb-modal-close-btn:hover {
            background: #f0f2f5;
            color: #000;
          }

          .fb-mood-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 10px;
          }

          .fb-mood-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 15px;
            background: #f0f2f5;
            border: 2px solid transparent;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.2s;
          }

          .fb-mood-item:hover {
            background: #e4e6eb;
          }

          .fb-mood-item.selected {
            background: #e7f3ff;
            border-color: #667eea;
          }

          .fb-mood-emoji {
            font-size: 32px;
            margin-bottom: 8px;
          }

          .fb-mood-label {
            font-size: 12px;
            color: #65676b;
            text-align: center;
          }

          .fb-tag-modal input,
          .fb-location-modal input {
            width: 100%;
            padding: 10px;
            border: 1px solid #e5e5e5;
            border-radius: 6px;
            font-size: 14px;
            margin-bottom: 12px;
            outline: none;
          }

          .fb-tag-modal input:focus,
          .fb-location-modal input:focus {
            border-color: #667eea;
          }

          .fb-tag-add-btn,
          .fb-location-confirm-btn {
            width: 100%;
            padding: 10px;
            background: #667eea;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 600;
            transition: background 0.2s;
          }

          .fb-tag-add-btn:hover,
          .fb-location-confirm-btn:hover {
            background: #764ba2;
          }

          .fb-upload-progress {
            margin-bottom: 15px;
            display: flex;
            align-items: center;
            gap: 10px;
          }

          .fb-progress-bar {
            flex: 1;
            height: 4px;
            background: #e5e5e5;
            border-radius: 2px;
            overflow: hidden;
          }

          .fb-progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #667eea, #764ba2);
            transition: width 0.3s;
          }

          .fb-progress-text {
            font-size: 12px;
            color: #65676b;
            min-width: 35px;
          }

          .fb-post-actions {
            display: flex;
            gap: 10px;
            padding-top: 15px;
            border-top: 1px solid #e5e5e5;
          }

          .fb-post-cancel-btn,
          .fb-post-create-btn {
            flex: 1;
            padding: 10px 20px;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 600;
            transition: all 0.2s;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
          }

          .fb-post-cancel-btn {
            background: #f0f2f5;
            color: #000;
          }

          .fb-post-cancel-btn:hover:not(:disabled) {
            background: #e4e6eb;
          }

          .fb-post-create-btn {
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
          }

          .fb-post-create-btn:hover:not(:disabled) {
            opacity: 0.9;
          }

          .fb-post-cancel-btn:disabled,
          .fb-post-create-btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }

          .fb-spinner {
            animation: spin 1s linear infinite;
          }

          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </Modal>
  )
}
