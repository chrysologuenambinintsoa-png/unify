import { useState, useRef } from 'react'
import Modal from './Modal'
import Toast from './Toast'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faImage,
  faUserTag,
  faFaceSmile,
  faLocationDot,
  faVideo,
  faXmark,
  faPlus,
  faSpinner,
  faPaperPlane,
  faCheck,
  faCalendarDays
} from '@fortawesome/free-solid-svg-icons'

export function PagePostCreator({ pageId, currentUser, onPostCreated }) {
  const [isOpen, setIsOpen] = useState(false)
  const [postContent, setPostContent] = useState('')
  const [selectedImage, setSelectedImage] = useState(null)
  const [selectedFiles, setSelectedFiles] = useState([])
  const [originalFile, setOriginalFile] = useState(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [toast, setToast] = useState(null)
  const [showTagModal, setShowTagModal] = useState(false)
  const [showFeelingModal, setShowFeelingModal] = useState(false)
  const [showLocationModal, setShowLocationModal] = useState(false)
  const [showEventModal, setShowEventModal] = useState(false)
  const [tagInput, setTagInput] = useState('')
  const [taggedUsers, setTaggedUsers] = useState([])
  const [feelingSelected, setFeelingSelected] = useState(null)
  const [locationInput, setLocationInput] = useState('')
  const [eventTitle, setEventTitle] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [eventLocation, setEventLocation] = useState('')
  const fileInputRef = useRef(null)
  const videoInputRef = useRef(null)
  const textareaRef = useRef(null)

  const quickEmojis = ['ðŸ˜€', 'ðŸ˜‚', 'â¤ï¸', 'ðŸ‘', 'ðŸ˜®', 'ðŸ˜¢', 'ðŸ˜¡', 'ðŸŽ‰', 'ðŸ”¥', 'ðŸ’¯']
  const moodOptions = [
    { emoji: 'ðŸ˜Š', label: 'Joyeux' },
    { emoji: 'ðŸ˜”', label: 'Triste' },
    { emoji: 'ðŸ˜', label: 'Amoureux' },
    { emoji: 'ðŸ˜¡', label: 'En colÃ¨re' },
    { emoji: 'ðŸ˜´', label: 'FatiguÃ©' },
    { emoji: 'ðŸ¤”', label: 'Pensif' },
    { emoji: 'ðŸŽ‰', label: 'CÃ©lÃ©brant' },
    { emoji: 'ðŸ˜Ž', label: 'Confiant' },
    { emoji: 'ðŸ˜…', label: 'Rigolo' },
    { emoji: 'ðŸ˜¢', label: 'Ã‰mu' }
  ]

  const userName = currentUser ? (currentUser.prenom || currentUser.nomUtilisateur || (currentUser.email || '').split('@')[0]) : 'Jean'
  const userInitials = currentUser ? (currentUser.prenom ? `${currentUser.prenom[0]}${(currentUser.nom || '')[0] || ''}`.toUpperCase() : (currentUser.nomUtilisateur ? currentUser.nomUtilisateur.slice(0, 2).toUpperCase() : (currentUser.email || '')[0]?.toUpperCase())) : 'JD'

  function showToast(message, type = 'info') {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

  function closeModal() {
    setIsOpen(false)
    setPostContent('')
    setSelectedImage(null)
    setSelectedFiles([])
    setOriginalFile(null)
    setUploadProgress(0)
    setIsUploading(false)
    setTagInput('')
    setTaggedUsers([])
    setFeelingSelected(null)
    setLocationInput('')
    setEventTitle('')
    setEventDate('')
    setEventLocation('')
  }

  function handlePhotoClick() {
    setIsOpen(true)
    fileInputRef.current?.click()
  }

  function handleVideoClick() {
    setIsOpen(true)
    videoInputRef.current?.click()
  }

  async function compressImage(file, maxWidth = 1200, maxHeight = 1200, quality = 0.8) {
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
          resolve(canvas.toDataURL(file.type || 'image/jpeg', quality))
        }
        img.src = event.target.result
      }
      reader.readAsDataURL(file)
    })
  }

  async function handleFileSelect(e) {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    const file = files[0]
    setSelectedFiles(files)
    setOriginalFile(file)
    try {
      const compressed = await compressImage(file)
      setSelectedImage(compressed)
    } catch (error) {
      const reader = new FileReader()
      reader.onload = (event) => setSelectedImage(event.target.result)
      reader.readAsDataURL(file)
    }
  }

  function addTaggedUser() {
    if (!tagInput.trim()) return
    setTaggedUsers(prev => [...prev, { id: Date.now(), name: tagInput.trim() }])
    setTagInput('')
    setShowTagModal(false)
  }

  function removeTaggedUser(userId) {
    setTaggedUsers(prev => prev.filter(u => u.id !== userId))
  }

  function addEmoji(emoji) {
    setPostContent(prev => prev + emoji)
    textareaRef.current?.focus()
  }

  async function handleCreate() {
    if (!postContent.trim() && !selectedImage) {
      showToast('Veuillez ajouter du contenu ou une image', 'warning')
      return
    }

    setIsUploading(true)
    setUploadProgress(10)

    try {
      const userStr = localStorage.getItem('user')
      const localUser = userStr ? JSON.parse(userStr) : null
      const authorName = localUser ? (localUser.prenom || localUser.nomUtilisateur || (localUser.email || '').split('@')[0]) : 'Jean'
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
        contentWithTags = `${contentWithTags} ðŸ“ ${locationInput}`.trim()
      }
      if (eventTitle) {
        const formattedDate = eventDate ? new Date(eventDate).toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' }) : ''
        contentWithTags = `${contentWithTags} ðŸ“… ${eventTitle}${formattedDate ? ` le ${formattedDate}` : ''}${eventLocation ? ` Ã  ${eventLocation}` : ''}`.trim()
      }

      const computedTitle = (contentWithTags || (selectedImage ? 'Image' : '')).trim()
      let imageUrl = null

      if (selectedImage && originalFile) {
        setUploadProgress(30)
        const formData = new FormData()
        formData.append('file', originalFile)
        formData.append('type', 'publication')
        formData.append('userEmail', userEmail)

        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        })
        if (uploadRes.ok) {
          const data = await uploadRes.json()
          imageUrl = data.url || data.secure_url || null
        } else {
          const errorText = await uploadRes.text().catch(() => '')
          showToast('Ã‰chec upload image: ' + errorText, 'error')
          setIsUploading(false)
          return
        }
      }

      setUploadProgress(60)

      await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: computedTitle,
          content: contentWithTags,
          image: imageUrl,
          author: authorName,
          authorEmail: userEmail,
          avatarUrl: localUser?.avatarUrl || localUser?.avatar || null,
          privacy: 'globe',
          taggedUsers: taggedUsers.map(u => u.name),
          feeling: feelingSelected?.label || null,
          location: locationInput || null
        })
      })

      setUploadProgress(80)

      await fetch(`/api/pages/${pageId}/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: computedTitle,
          content: contentWithTags,
          image: imageUrl
        })
      })

      setUploadProgress(100)
      showToast('Publication crÃ©Ã©e avec succÃ¨s !', 'success')
      setTimeout(() => {
        setIsUploading(false)
        closeModal()
        onPostCreated?.()
        window.dispatchEvent(new CustomEvent('reloadFeed'))
      }, 400)
    } catch (error) {
      console.error(error)
      showToast('Erreur lors de la crÃ©ation', 'error')
      setIsUploading(false)
    }
  }

  return (
    <>
      <div className="create-post-card">
        <div className="create-post-header">
          <div className="create-post-avatar-wrapper">
            {currentUser && (currentUser.avatarUrl || currentUser.avatar) ? (
              <img src={currentUser.avatarUrl || currentUser.avatar} alt="avatar" className="create-post-avatar" />
            ) : (
              <div className="create-post-avatar-placeholder">{userInitials}</div>
            )}
          </div>
          <button className="create-post-input-btn" onClick={() => setIsOpen(true)}>
            {`Quoi de neuf, ${userName} ?`}
          </button>
        </div>

        <div className="create-post-divider" />

        <div className="create-post-actions">
          <button className="create-post-action-btn" onClick={handlePhotoClick}>
            <FontAwesomeIcon icon={faImage} style={{ color: '#45bd62' }} />
            <span className="create-post-action-text">Photo/vidÃ©o</span>
          </button>
          <button className="create-post-action-btn" onClick={() => { setIsOpen(true); setShowTagModal(true) }}>
            <FontAwesomeIcon icon={faUserTag} style={{ color: '#003d5c' }} />
            <span className="create-post-action-text">Taguer</span>
          </button>
          <button className="create-post-action-btn" onClick={() => { setIsOpen(true); setShowFeelingModal(true) }}>
            <FontAwesomeIcon icon={faFaceSmile} style={{ color: '#f7b928' }} />
            <span className="create-post-action-text">Sentiment</span>
          </button>
          <button className="create-post-action-btn" onClick={() => { setIsOpen(true); setShowLocationModal(true) }}>
            <FontAwesomeIcon icon={faLocationDot} style={{ color: '#f02849' }} />
            <span className="create-post-action-text">Lieu</span>
          </button>
          <button className="create-post-action-btn" onClick={() => { setIsOpen(true); setShowEventModal(true) }}>
            <FontAwesomeIcon icon={faCalendarDays} style={{ color: '#6a5cff' }} />
            <span className="create-post-action-text">Ã‰vÃ©nement</span>
          </button>
        </div>
      </div>

      <Modal open={isOpen} onClose={closeModal} title="CrÃ©er une publication sur la page">
        <div className="fb-create-post">
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
                <div className="fb-post-user-name">{userName}</div>
              </div>
            </div>
          </div>

          <div className="fb-post-content">
            <textarea
              ref={textareaRef}
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              className="fb-post-textarea"
              placeholder={`Quoi de neuf, ${userName} ?`}
              disabled={isUploading}
            />

            <div className="fb-quick-emojis">
              {quickEmojis.map(emoji => (
                <button key={emoji} className="fb-quick-emoji-btn" onClick={() => addEmoji(emoji)} disabled={isUploading}>
                  {emoji}
                </button>
              ))}
            </div>

            {taggedUsers.length > 0 && (
              <div className="fb-tagged-users">
                <FontAwesomeIcon icon={faUserTag} className="fb-tag-icon" />
                <div className="fb-tagged-list">
                  {taggedUsers.map(user => (
                    <span key={user.id} className="fb-tagged-user">
                      {user.name}
                      <button className="fb-remove-tag" onClick={() => removeTaggedUser(user.id)} disabled={isUploading}>
                        <FontAwesomeIcon icon={faXmark} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {selectedImage && (
              <div className="fb-image-preview">
                <img src={selectedImage} alt="preview" className="fb-preview-img" />
                <button className="fb-remove-image" onClick={() => setSelectedImage(null)} disabled={isUploading}>
                  <FontAwesomeIcon icon={faXmark} />
                </button>
                {selectedFiles.length > 1 && <div className="fb-file-count">+{selectedFiles.length - 1}</div>}
              </div>
            )}

            {locationInput && (
              <div className="fb-location-display">
                <FontAwesomeIcon icon={faLocationDot} className="fb-location-icon" />
                <span>{locationInput}</span>
                <button className="fb-remove-location" onClick={() => setLocationInput('')} disabled={isUploading}>
                  <FontAwesomeIcon icon={faXmark} />
                </button>
              </div>
            )}

            {eventTitle && (
              <div className="fb-event-display">
                <FontAwesomeIcon icon={faCalendarDays} className="fb-event-icon" />
                <div className="fb-event-details">
                  <strong>{eventTitle}</strong>
                  {eventDate && <div>{new Date(eventDate).toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' })}</div>}
                  {eventLocation && <div>{eventLocation}</div>}
                </div>
                <button className="fb-remove-location" onClick={() => { setEventTitle(''); setEventDate(''); setEventLocation('') }} disabled={isUploading}>
                  <FontAwesomeIcon icon={faXmark} />
                </button>
              </div>
            )}
          </div>

          <div className="fb-add-section">
            <div className="fb-add-label">Ajouter Ã  votre publication</div>
            <div className="fb-add-icons">
              <button className="fb-add-icon-btn" onClick={handlePhotoClick} disabled={isUploading} title="Photo/vidÃ©o">
                <FontAwesomeIcon icon={faImage} style={{ color: '#45bd62' }} />
              </button>
              <button className="fb-add-icon-btn" onClick={handleVideoClick} disabled={isUploading} title="VidÃ©o">
                <FontAwesomeIcon icon={faVideo} style={{ color: '#f3425f' }} />
              </button>
              <button className="fb-add-icon-btn" onClick={() => setShowTagModal(true)} disabled={isUploading} title="Taguer">
                <FontAwesomeIcon icon={faUserTag} style={{ color: '#003d5c' }} />
              </button>
              <button className="fb-add-icon-btn" onClick={() => setShowFeelingModal(true)} disabled={isUploading} title="Sentiment">
                <FontAwesomeIcon icon={faFaceSmile} style={{ color: '#f7b928' }} />
              </button>
              <button className="fb-add-icon-btn" onClick={() => setShowLocationModal(true)} disabled={isUploading} title="Lieu">
                <FontAwesomeIcon icon={faLocationDot} style={{ color: '#f02849' }} />
              </button>
              <button className="fb-add-icon-btn" onClick={() => setShowEventModal(true)} disabled={isUploading} title="Ã‰vÃ©nement">
                <FontAwesomeIcon icon={faCalendarDays} style={{ color: '#6a5cff' }} />
              </button>
            </div>
          </div>

          {isUploading && (
            <div className="fb-upload-progress">
              <div className="fb-progress-header">
                <FontAwesomeIcon icon={faSpinner} spin className="fb-progress-spinner" />
                <span className="fb-progress-text">Publication en cours...</span>
                <span className="fb-progress-percent">{uploadProgress}%</span>
              </div>
              <div className="fb-progress-bar">
                <div className="fb-progress-fill" style={{ width: `${uploadProgress}%` }} />
              </div>
            </div>
          )}

          <button className="fb-submit-btn" onClick={handleCreate} disabled={(!postContent.trim() && !selectedImage) || isUploading}>
            {isUploading ? (
              <>
                <FontAwesomeIcon icon={faSpinner} spin />
                <span>Publication... {uploadProgress}%</span>
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faPaperPlane} />
                <span>Publier</span>
              </>
            )}
          </button>

          {showTagModal && (
            <Modal open={showTagModal} onClose={() => { setShowTagModal(false); setTagInput('') }} title="Taguer des personnes">
              <div className="fb-submodal">
                <FontAwesomeIcon icon={faUserTag} className="fb-submodal-icon" />
                <input value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && addTaggedUser()} placeholder="Nom de la personne" className="fb-submodal-input" autoFocus />
                <div className="fb-submodal-actions">
                  <button onClick={() => { setShowTagModal(false); setTagInput('') }} className="fb-submodal-cancel">Annuler</button>
                  <button onClick={addTaggedUser} disabled={!tagInput.trim()} className="fb-submodal-confirm"><FontAwesomeIcon icon={faPlus} /> Ajouter</button>
                </div>
              </div>
            </Modal>
          )}

          {showFeelingModal && (
            <Modal open={showFeelingModal} onClose={() => setShowFeelingModal(false)} title="Comment vous sentez-vous ?">
              <div className="fb-feelings-grid">
                {moodOptions.map(f => (
                  <button key={f.label} className={`fb-feeling-item ${feelingSelected?.label === f.label ? 'selected' : ''}`} onClick={() => setFeelingSelected(f)}>
                    <div className="fb-feeling-emoji">{f.emoji}</div>
                    <div className="fb-feeling-label">{f.label}</div>
                  </button>
                ))}
              </div>
              <div className="fb-submodal-actions">
                <button onClick={() => { setShowFeelingModal(false); setFeelingSelected(null) }} className="fb-submodal-cancel">Annuler</button>
                <button onClick={() => setShowFeelingModal(false)} disabled={!feelingSelected} className="fb-submodal-confirm"><FontAwesomeIcon icon={faCheck} /> Confirmer</button>
              </div>
            </Modal>
          )}

          {showLocationModal && (
            <Modal open={showLocationModal} onClose={() => { setShowLocationModal(false); setLocationInput('') }} title="Ajouter une localisation">
              <div className="fb-submodal">
                <FontAwesomeIcon icon={faLocationDot} className="fb-submodal-icon" />
                <input value={locationInput} onChange={e => setLocationInput(e.target.value)} placeholder="Lieu" className="fb-submodal-input" autoFocus />
                <div className="fb-submodal-actions">
                  <button onClick={() => { setShowLocationModal(false); setLocationInput('') }} className="fb-submodal-cancel">Annuler</button>
                  <button onClick={() => setShowLocationModal(false)} disabled={!locationInput.trim()} className="fb-submodal-confirm"><FontAwesomeIcon icon={faCheck} /> Ajouter</button>
                </div>
              </div>
            </Modal>
          )}

          {showEventModal && (
            <Modal open={showEventModal} onClose={() => { setShowEventModal(false); setEventTitle(''); setEventDate(''); setEventLocation('') }} title="Ajouter un Ã©vÃ©nement">
              <div className="fb-submodal">
                <FontAwesomeIcon icon={faCalendarDays} className="fb-submodal-icon" />
                <input value={eventTitle} onChange={e => setEventTitle(e.target.value)} placeholder="Titre de l'Ã©vÃ©nement" className="fb-submodal-input" autoFocus />
                <input type="datetime-local" value={eventDate} onChange={e => setEventDate(e.target.value)} className="fb-submodal-input" />
                <input value={eventLocation} onChange={e => setEventLocation(e.target.value)} placeholder="Lieu de l'Ã©vÃ©nement" className="fb-submodal-input" />
                <div className="fb-submodal-actions">
                  <button onClick={() => { setShowEventModal(false); setEventTitle(''); setEventDate(''); setEventLocation('') }} className="fb-submodal-cancel">Annuler</button>
                  <button onClick={() => setShowEventModal(false)} disabled={!eventTitle.trim() || !eventDate} className="fb-submodal-confirm"><FontAwesomeIcon icon={faCheck} /> Ajouter</button>
                </div>
              </div>
            </Modal>
          )}

          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} style={{ display: 'none' }} disabled={isUploading} />
          <input ref={videoInputRef} type="file" accept="video/*" onChange={handleFileSelect} style={{ display: 'none' }} disabled={isUploading} />
        </div>
      </Modal>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <style jsx>{`
        .create-post-card {
          background: #fff;
          border-radius: 14px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06);
          padding: 16px;
          margin-bottom: 16px;
          border: 1px solid #e4e6eb;
        }
        .create-post-header {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .create-post-avatar-wrapper {
          flex-shrink: 0;
        }
        .create-post-avatar {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          object-fit: cover;
        }
        .create-post-avatar-placeholder {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #003d5c 0%, #42b72a 100%);
          color: #fff;
          font-weight: 700;
        }
        .create-post-input-btn {
          flex: 1;
          padding: 12px 16px;
          background: #f0f2f5;
          border: none;
          border-radius: 24px;
          text-align: left;
          color: #65676b;
          cursor: pointer;
          font-size: 16px;
        }
        .create-post-actions {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-top: 14px;
        }
        .create-post-action-btn {
          flex: 1;
          min-width: 110px;
          border: none;
          background: #f5f6f7;
          border-radius: 12px;
          padding: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
          color: #333;
        }
        .create-post-action-btn:hover {
          background: #e4e6eb;
        }
        .create-post-action-text {
          font-size: 14px;
          font-weight: 600;
        }
        .create-post-divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, #ced0d4, transparent);
          margin: 16px 0;
        }
        .fb-create-post {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .fb-post-header {
          display: flex;
          gap: 12px;
          align-items: center;
          padding-bottom: 12px;
          border-bottom: 1px solid #e4e6eb;
        }
        .fb-post-user-info {
          display: flex;
          gap: 12px;
          width: 100%;
        }
        .fb-post-user-details {
          flex: 1;
        }
        .fb-post-user-name {
          font-weight: 600;
          font-size: 16px;
          color: #050505;
        }
        .fb-post-content {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .fb-post-textarea {
          width: 100%;
          min-height: 120px;
          border: none;
          outline: none;
          resize: vertical;
          font-size: 16px;
          line-height: 1.5;
          color: #050505;
          font-family: inherit;
          background: transparent;
        }
        .fb-post-textarea::placeholder {
          color: #65676b;
        }
        .fb-quick-emojis {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .fb-quick-emoji-btn {
          width: 36px;
          height: 36px;
          border: 1px solid #e4e6eb;
          border-radius: 50%;
          background: #f0f2f5;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .fb-tagged-users,
        .fb-location-display,
        .fb-event-display {
          display: flex;
          align-items: center;
          gap: 10px;
          background: #f0f2f5;
          border-radius: 12px;
          padding: 10px 12px;
          flex-wrap: wrap;
        }
        .fb-tag-icon,
        .fb-location-icon,
        .fb-event-icon {
          font-size: 16px;
          flex-shrink: 0;
        }
        .fb-tagged-user {
          background: #003d5c;
          color: white;
          padding: 4px 8px;
          border-radius: 8px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .fb-remove-tag,
        .fb-remove-location {
          background: none;
          border: none;
          color: #65676b;
          cursor: pointer;
        }
        .fb-image-preview {
          position: relative;
          border-radius: 12px;
          overflow: hidden;
          background: #f0f2f5;
        }
        .fb-preview-img {
          width: 100%;
          display: block;
          object-fit: cover;
        }
        .fb-remove-image {
          position: absolute;
          top: 10px;
          right: 10px;
          background: rgba(0,0,0,0.6);
          color: white;
          border: none;
          width: 34px;
          height: 34px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }
        .fb-file-count {
          position: absolute;
          bottom: 10px;
          left: 10px;
          background: rgba(0,0,0,0.6);
          color: white;
          padding: 4px 8px;
          border-radius: 8px;
          font-size: 12px;
        }
        .fb-add-section {
          border-top: 1px solid #e4e6eb;
          padding-top: 12px;
        }
        .fb-add-label {
          font-size: 13px;
          color: #65676b;
          margin-bottom: 8px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .fb-add-icons {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .fb-add-icon-btn {
          width: 40px;
          height: 40px;
          border: none;
          border-radius: 12px;
          background: #f0f2f5;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }
        .fb-add-icon-btn:hover:not(:disabled) {
          background: #e4e6eb;
        }
        .fb-upload-progress {
          background: #f0f2f5;
          border-radius: 12px;
          padding: 12px;
        }
        .fb-progress-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
          font-size: 13px;
          color: #003d5c;
        }
        .fb-progress-bar {
          width: 100%;
          height: 6px;
          background: #d0d2d7;
          border-radius: 3px;
          overflow: hidden;
        }
        .fb-progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #003d5c, #42b72a);
          transition: width 0.3s ease;
        }
        .fb-submit-btn {
          width: 100%;
          padding: 12px 16px;
          border: none;
          border-radius: 12px;
          background: #003d5c;
          color: white;
          cursor: pointer;
          font-size: 15px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .fb-submit-btn:disabled {
          background: #d0d2d7;
          cursor: not-allowed;
        }
        .fb-submodal {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .fb-submodal-icon {
          font-size: 40px;
          color: #003d5c;
        }
        .fb-submodal-input {
          width: 100%;
          padding: 12px;
          border: 1px solid #e4e6eb;
          border-radius: 10px;
          font-family: inherit;
          font-size: 14px;
        }
        .fb-submodal-actions {
          display: flex;
          gap: 10px;
        }
        .fb-submodal-cancel,
        .fb-submodal-confirm {
          flex: 1;
          border: none;
          border-radius: 10px;
          padding: 10px;
          font-weight: 600;
          cursor: pointer;
        }
        .fb-submodal-cancel {
          background: #e4e6eb;
          color: #050505;
        }
        .fb-submodal-confirm {
          background: #003d5c;
          color: white;
        }
        .fb-feelings-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
          gap: 10px;
        }
        .fb-feeling-item {
          border: 1px solid #e4e6eb;
          border-radius: 12px;
          padding: 12px;
          background: white;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }
        .fb-feeling-item.selected {
          border-color: #003d5c;
          background: #eef4ff;
        }
        .fb-feeling-emoji {
          font-size: 24px;
        }
        .fb-feeling-label {
          font-size: 13px;
          text-align: center;
        }
      `}</style>
    </>
  )
}

