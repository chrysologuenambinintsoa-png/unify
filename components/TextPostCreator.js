import { useState, useRef, useEffect } from 'react'
import Modal from './Modal'

export default function TextPostCreator({ currentUser, sponsorId = null, sponsorTitle = null }) {
  const [content, setContent] = useState('')
  const [bgType, setBgType] = useState('color')
  const [bgColor, setBgColor] = useState('#667eea')
  const [textColor, setTextColor] = useState('#ffffff')
  const [bgImage, setBgImage] = useState(null)
  const [isPublishing, setIsPublishing] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const fileInputRef = useRef(null)

  useEffect(() => {
    function handleOpenTextPublication() {
      setIsOpen(true)
    }
    window.addEventListener('openTextPublication', handleOpenTextPublication)
    return () => window.removeEventListener('openTextPublication', handleOpenTextPublication)
  }, [])

  const presetColors = [
    '#667eea', '#764ba2', '#f093fb', '#f5576c',
    '#4facfe', '#00f2fe', '#43e97b', '#38f9d7',
    '#fa709a', '#fee140', '#30cfd0', '#330867'
  ]

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        setBgImage(event.target?.result)
        setBgType('image')
      }
      reader.readAsDataURL(file)
    }
  }

  const handlePublish = async () => {
    if (!content.trim()) {
      alert('Veuillez ajouter du texte')
      return
    }

    setIsPublishing(true)
    try {
      const userStr = localStorage.getItem('user')
      const localUser = userStr ? JSON.parse(userStr) : null
      const authorName = localUser ? (localUser.prenom || localUser.nomUtilisateur || (localUser.email||'').split('@')[0]) : 'Jean Dupont'

      const payload = {
        title: content.trim().split('\n')[0].slice(0, 60) || 'Publication',
        content: content.trim(),
        backgroundColor: bgType === 'color' ? bgColor : null,
        textColor: textColor,
        backgroundImage: bgType === 'image' ? bgImage : null,
        privacy: 'public',
        author: sponsorTitle || authorName,
        sponsorId: sponsorId || null,
        avatarUrl: sponsorTitle ? null : (localUser?.avatarUrl || localUser?.avatar || null)
      }

      const res = await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        const newPost = await res.json()
        newPost.backgroundColor = newPost.backgroundColor || payload.backgroundColor
        newPost.textColor = newPost.textColor || payload.textColor
        newPost.backgroundImage = newPost.backgroundImage || payload.backgroundImage
        window.dispatchEvent(new CustomEvent('postCreated', { detail: newPost }))
        handleClose()
      } else {
        throw new Error('Erreur lors de la publication')
      }
    } catch (error) {
      console.error('Erreur lors de la publication:', error)
      alert('Erreur lors de la publication')
    } finally {
      setIsPublishing(false)
    }
  }

  const handleClose = () => {
    setContent('')
    setBgType('color')
    setBgColor('#667eea')
    setTextColor('#ffffff')
    setBgImage(null)
    setIsOpen(false)
  }

  return (
    <Modal open={isOpen} onClose={handleClose} title="Créer une publication">
      <div className="text-post-creator-modal">
        {/* User Info */}
        <div className="text-post-creator-user">
          <div className="text-post-creator-avatar">
            {currentUser?.avatarUrl || currentUser?.avatar ? (
              <img src={currentUser.avatarUrl || currentUser.avatar} alt="avatar" />
            ) : (
              <div className="text-post-creator-avatar-placeholder">
                {currentUser?.prenom?.[0] || currentUser?.nomUtilisateur?.[0] || 'U'}
              </div>
            )}
          </div>
          <div className="text-post-creator-user-info">
            <span className="text-post-creator-user-name">
              {currentUser?.prenom || currentUser?.nomUtilisateur || 'Utilisateur'}
            </span>
            <span className="text-post-creator-privacy">
              <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
              </svg>
              Public
            </span>
          </div>
        </div>

        {/* Content Area */}
        <div className="text-post-creator-content">
          <div 
            className="text-post-creator-preview"
            style={{
              background: bgType === 'color' ? bgColor : `url(${bgImage}) center/cover`,
              color: textColor
            }}
          >
            <textarea
              className="text-post-creator-textarea"
              placeholder="Quoi de neuf ?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={500}
              style={{ color: textColor }}
            />
            <div className="text-post-creator-char-count" style={{ color: textColor }}>
              {content.length}/500
            </div>
          </div>
        </div>

        {/* Background Options */}
        <div className="text-post-creator-options">
          <div className="text-post-creator-option-section">
            <label>Arrière-plan</label>
            <div className="text-post-creator-bg-type-buttons">
              <button
                className={`text-post-creator-bg-type-btn ${bgType === 'color' ? 'active' : ''}`}
                onClick={() => setBgType('color')}
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                  <path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8zm-5.5 9c-.83 0-1.5-.67-1.5-1.5S5.67 9 6.5 9 8 9.67 8 10.5 7.33 12 6.5 12zm3-4C8.67 8 8 7.33 8 6.5S8.67 5 9.5 5s1.5.67 1.5 1.5S10.33 8 9.5 8zm5 0c-.83 0-1.5-.67-1.5-1.5S13.67 5 14.5 5s1.5.67 1.5 1.5S15.33 8 14.5 8zm3 4c-.83 0-1.5-.67-1.5-1.5S16.67 9 17.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
                </svg>
                Couleur
              </button>
              <button
                className={`text-post-creator-bg-type-btn ${bgType === 'image' ? 'active' : ''}`}
                onClick={() => fileInputRef.current?.click()}
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                  <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                </svg>
                Image
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                style={{ display: 'none' }}
              />
            </div>
          </div>

          {bgType === 'color' && (
            <div className="text-post-creator-option-section">
              <label>Couleurs prédéfinies</label>
              <div className="text-post-creator-color-palette">
                {presetColors.map((color) => (
                  <button
                    key={color}
                    className={`text-post-creator-color-btn ${bgColor === color ? 'active' : ''}`}
                    style={{ backgroundColor: color }}
                    onClick={() => setBgColor(color)}
                  />
                ))}
              </div>
              <div className="text-post-creator-custom-color">
                <label>Couleur personnalisée</label>
                <input
                  type="color"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="text-post-creator-color-input"
                />
              </div>
            </div>
          )}

          <div className="text-post-creator-option-section">
            <label>Couleur du texte</label>
            <div className="text-post-creator-text-color-options">
              <button
                className={`text-post-creator-text-color-btn ${textColor === '#ffffff' ? 'active' : ''}`}
                onClick={() => setTextColor('#ffffff')}
              >
                Blanc
              </button>
              <button
                className={`text-post-creator-text-color-btn ${textColor === '#000000' ? 'active' : ''}`}
                onClick={() => setTextColor('#000000')}
              >
                Noir
              </button>
              <input
                type="color"
                value={textColor}
                onChange={(e) => setTextColor(e.target.value)}
                className="text-post-creator-color-input"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="text-post-creator-actions">
          <button
            className="text-post-creator-cancel-btn"
            onClick={handleClose}
            disabled={isPublishing}
          >
            Annuler
          </button>
          <button
            className="text-post-creator-publish-btn"
            onClick={handlePublish}
            disabled={!content.trim() || isPublishing}
          >
            {isPublishing ? 'Publication...' : 'Publier'}
          </button>
        </div>

        <style jsx>{`
          .text-post-creator-modal {
            background: #ffffff;
            border-radius: 12px;
            width: 90%;
            max-width: 500px;
            max-height: 90vh;
            overflow-y: auto;
          }



          .text-post-creator-user {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 16px 20px;
          }

          .text-post-creator-avatar {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            overflow: hidden;
          }

          .text-post-creator-avatar img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }

          .text-post-creator-avatar-placeholder {
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, #003d5c 0%, #42b72a 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: 700;
            font-size: 16px;
          }

          .text-post-creator-user-info {
            display: flex;
            flex-direction: column;
            gap: 2px;
          }

          .text-post-creator-user-name {
            font-weight: 600;
            font-size: 15px;
            color: #050505;
          }

          .text-post-creator-privacy {
            display: flex;
            align-items: center;
            gap: 4px;
            font-size: 12px;
            color: #65676b;
            background: #e4e6eb;
            padding: 2px 8px;
            border-radius: 4px;
            width: fit-content;
          }

          .text-post-creator-content {
            padding: 0 20px 16px;
          }

          .text-post-creator-preview {
            border-radius: 12px;
            min-height: 200px;
            padding: 20px;
            display: flex;
            flex-direction: column;
            position: relative;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          }

          .text-post-creator-textarea {
            flex: 1;
            background: transparent;
            border: none;
            outline: none;
            resize: none;
            font-size: 24px;
            font-weight: 600;
            text-align: center;
            line-height: 1.4;
            font-family: inherit;
          }

          .text-post-creator-textarea::placeholder {
            color: inherit;
            opacity: 0.7;
          }

          .text-post-creator-char-count {
            text-align: right;
            font-size: 12px;
            opacity: 0.8;
            margin-top: 12px;
          }

          .text-post-creator-options {
            padding: 16px 20px;
            border-top: 1px solid #e4e6eb;
          }

          .text-post-creator-option-section {
            margin-bottom: 16px;
          }

          .text-post-creator-option-section:last-child {
            margin-bottom: 0;
          }

          .text-post-creator-option-section label {
            display: block;
            font-size: 13px;
            font-weight: 600;
            color: #65676b;
            margin-bottom: 8px;
          }

          .text-post-creator-bg-type-buttons {
            display: flex;
            gap: 8px;
          }

          .text-post-creator-bg-type-btn {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            padding: 10px 12px;
            border: 1px solid #e4e6eb;
            border-radius: 8px;
            background: #f0f2f5;
            cursor: pointer;
            font-size: 13px;
            font-weight: 500;
            color: #050505;
            transition: all 0.2s;
          }

          .text-post-creator-bg-type-btn:hover {
            background: #e4e6eb;
          }

          .text-post-creator-bg-type-btn.active {
            background: #003d5c;
            color: white;
            border-color: #003d5c;
          }

          .text-post-creator-color-palette {
            display: grid;
            grid-template-columns: repeat(6, 1fr);
            gap: 8px;
            margin-bottom: 12px;
          }

          .text-post-creator-color-btn {
            width: 100%;
            aspect-ratio: 1;
            border: 2px solid transparent;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.2s;
          }

          .text-post-creator-color-btn:hover {
            transform: scale(1.1);
          }

          .text-post-creator-color-btn.active {
            border-color: #050505;
            box-shadow: 0 0 0 2px #ffffff, 0 0 0 4px #050505;
          }

          .text-post-creator-custom-color {
            display: flex;
            align-items: center;
            gap: 12px;
          }

          .text-post-creator-custom-color label {
            margin: 0;
            font-size: 13px;
            color: #65676b;
          }

          .text-post-creator-color-input {
            width: 40px;
            height: 40px;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            padding: 0;
          }

          .text-post-creator-text-color-options {
            display: flex;
            gap: 8px;
            align-items: center;
          }

          .text-post-creator-text-color-btn {
            padding: 8px 16px;
            border: 1px solid #e4e6eb;
            border-radius: 8px;
            background: #f0f2f5;
            cursor: pointer;
            font-size: 13px;
            font-weight: 500;
            color: #050505;
            transition: all 0.2s;
          }

          .text-post-creator-text-color-btn:hover {
            background: #e4e6eb;
          }

          .text-post-creator-text-color-btn.active {
            background: #003d5c;
            color: white;
            border-color: #003d5c;
          }

          .text-post-creator-actions {
            display: flex;
            gap: 12px;
            padding: 16px 20px;
            border-top: 1px solid #e4e6eb;
          }

          .text-post-creator-cancel-btn,
          .text-post-creator-publish-btn {
            flex: 1;
            padding: 12px 20px;
            border: none;
            border-radius: 8px;
            font-size: 15px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
          }

          .text-post-creator-cancel-btn {
            background: #e4e6eb;
            color: #050505;
          }

          .text-post-creator-cancel-btn:hover {
            background: #d8dadf;
          }

          .text-post-creator-publish-btn {
            background: #003d5c;
            color: white;
          }

          .text-post-creator-publish-btn:hover:not(:disabled) {
            background: #002244;
          }

          .text-post-creator-publish-btn:disabled {
            background: #e4e6eb;
            color: #bcc0c4;
            cursor: not-allowed;
          }

          @media (max-width: 768px) {
            .text-post-creator-modal {
              width: 95%;
              max-height: 95vh;
            }

            .text-post-creator-color-palette {
              grid-template-columns: repeat(4, 1fr);
            }

            .text-post-creator-textarea {
              font-size: 20px;
            }
          }
        `}</style>
      </div>
    </Modal>
  )
}
