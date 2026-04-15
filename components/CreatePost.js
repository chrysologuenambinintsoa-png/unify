import { useState } from 'react'
import ProfessionalLiveVideo from './ProfessionalLiveVideo'

export default function CreatePost({ onOpen, user, onOpenTextPublication, sponsorTitle = null, sponsorAvatar = null }) {
  const name = user?.prenom || user?.nomUtilisateur || (user?.email ? user.email.split('@')[0] : 'Jean')
  const initials = user?.prenom ? `${user.prenom[0]}${(user.nom || '')[0] || ''}`.toUpperCase() : (user?.nomUtilisateur ? user.nomUtilisateur.slice(0, 2).toUpperCase() : 'JD')
  const [isHovered, setIsHovered] = useState(false)
  const [showLiveVideo, setShowLiveVideo] = useState(false)

  const handleOpen = () => {
    if (typeof onOpen === 'function') return onOpen()
    try { window.dispatchEvent(new CustomEvent('openCreatePost')) } catch (e) { }
  }

  const handleOpenText = () => {
    if (typeof onOpenTextPublication === 'function') return onOpenTextPublication()
    try { window.dispatchEvent(new CustomEvent('openTextPublication')) } catch (e) { }
  }

  const placeholder = sponsorTitle ? `Quoi de neuf sur la page de ${sponsorTitle} ?` : `Quoi de neuf, ${name} ?`

  const handleOpenLiveVideo = () => {
    setShowLiveVideo(true)
  }

  const handleCloseLiveVideo = () => {
    setShowLiveVideo(false)
  }

  return (
    <div className="create-post-card">
      <div className="create-post-header">
        <div className="create-post-avatar-wrapper">
          {sponsorAvatar ? (
            <img src={sponsorAvatar} alt="avatar" className="create-post-avatar" />
          ) : user && (user.avatarUrl || user.avatar) ? (
            <img src={user.avatarUrl || user.avatar} alt="avatar" className="create-post-avatar" />
          ) : (
            <div className="create-post-avatar-placeholder">{initials}</div>
          )}
        </div>
        <button 
          className="create-post-input-btn"
          onClick={handleOpen}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          style={{
            backgroundColor: isHovered ? '#e4e6eb' : '#f0f2f5'
          }}
        >
          {placeholder}
        </button>
      </div>

      <div className="create-post-divider" />

      <div className="create-post-actions">
        <button className="create-post-action-btn" onClick={handleOpen}>
          <span className="create-post-action-icon photo-icon">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="#45BD62">
              <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
            </svg>
          </span>
          <span className="create-post-action-text">Photo/vidéo</span>
        </button>

        <button className="create-post-action-btn" onClick={handleOpenText}>
          <span className="create-post-action-icon text-icon">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="#F7B928">
              <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
            </svg>
          </span>
          <span className="create-post-action-text">Texte</span>
        </button>

        <button className="create-post-action-btn" onClick={handleOpenLiveVideo}>
          <span className="create-post-action-icon live-video-icon">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="#F3425F">
              <path d="M10 9.35L14 12l-4 2.65V9.35zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
            </svg>
          </span>
          <span className="create-post-action-text">Vidéo en direct</span>
        </button>
      </div>

      <style jsx>{`
        .create-post-card {
          background: #ffffff;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.06);
          padding: 16px;
          margin-bottom: 16px;
          border: 1px solid #e4e6eb;
        }

        .create-post-header {
          display: flex !important;
          align-items: center;
          gap: 12px;
          width: 100%;
          flex-direction: row !important;
        }

        .create-post-avatar-wrapper {
          flex-shrink: 0;
        }

        .create-post-avatar {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          object-fit: cover;
          cursor: pointer;
          transition: all 0.2s ease;
          border: 2px solid transparent;
        }

        .create-post-avatar:hover {
          opacity: 0.9;
          border-color: #003d5c;
        }

        .create-post-avatar-placeholder {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: linear-gradient(135deg, #003d5c 0%, #42b72a 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 700;
          font-size: 15px;
          cursor: pointer;
          transition: all 0.2s ease;
          border: 2px solid transparent;
        }

        .create-post-avatar-placeholder:hover {
          border-color: #003d5c;
          transform: scale(1.05);
        }

        .create-post-input-btn {
          flex: 1;
          padding: 12px 16px;
          border: none;
          border-radius: 24px;
          background: #f0f2f5;
          color: #65676b;
          font-size: 16px;
          text-align: left;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: inherit;
          font-weight: 400;
          border: 1px solid transparent;
        }

        .create-post-input-btn:hover {
          background: #e4e6eb;
          border-color: #ced0d4;
        }

        .create-post-divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, #ced0d4, transparent);
          margin: 14px 0;
        }

        .create-post-actions {
          display: flex;
          justify-content: space-between;
          gap: 12px;
        }

        .create-post-action-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          flex: 1;
          min-width: 100px;
          max-width: 160px;
          padding: 8px 10px;
          border: none;
          border-radius: 10px;
          background: transparent;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: inherit;
        }

        .create-post-action-btn:hover {
          background: #f0f2f5;
          transform: translateY(-1px);
        }

        .create-post-action-btn:active {
          transform: translateY(0);
        }

        .create-post-action-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.2s ease;
        }
        .create-post-action-icon svg {
          width: 20px;
          height: 20px;
        }

        .create-post-action-btn:hover .create-post-action-icon {
          transform: scale(1.1);
        }

        .create-post-action-text {
          color: #65676b;
          font-size: 13px;
          font-weight: 600;
          white-space: normal;
          text-align: center;
          word-break: keep-all;
        }

        @media (max-width: 768px) {
          .create-post-card {
            border-radius: 0;
            margin-bottom: 8px;
            padding: 12px;
            border-left: none;
            border-right: none;
          }

          .create-post-header {
            gap: 10px;
            display: flex !important;
            align-items: center;
            flex-direction: row !important;
            width: 100%;
          }

          .create-post-avatar,
          .create-post-avatar-placeholder {
            width: 40px;
            height: 40px;
            font-size: 14px;
          }

          .create-post-input-btn {
            padding: 10px 14px;
            font-size: 15px;
            border-radius: 20px;
          }

          .create-post-divider {
            margin: 12px 0;
          }

          .create-post-actions {
            gap: 4px;
          }

          .create-post-action-btn {
            padding: 10px 8px;
            border-radius: 8px;
            gap: 6px;
          }

          .create-post-action-icon svg {
            width: 22px;
            height: 22px;
          }

          .create-post-action-text {
            font-size: 12px;
            font-weight: 600;
          }
        }

        @media (max-width: 480px) {
          .create-post-card {
            padding: 10px;
          }

          .create-post-action-text {
            display: none;
          }

          .create-post-action-btn {
            padding: 12px;
          }

          .create-post-action-icon svg {
            width: 26px;
            height: 26px;
          }
        }
      `}</style>

      {/* Modal VidÃ©o Live */}
      {showLiveVideo && (
        <div className="live-video-modal-overlay" onClick={handleCloseLiveVideo}>
          <div className="live-video-modal" onClick={(e) => e.stopPropagation()}>
            <button className="live-video-modal-close" onClick={handleCloseLiveVideo}>
              âœ•
            </button>
            <ProfessionalLiveVideo
              liveId={`live-${Date.now()}`}
              userInfo={{
                name: user?.prenom || user?.nomUtilisateur || 'Utilisateur',
                avatar: user?.avatarUrl || user?.avatar || null
              }}
              showChat={true}
              showReactions={true}
              showActionBar={true}
              showViewerCount={true}
              autoPlay={true}
              muted={false}
            />
          </div>
        </div>
      )}

      <style jsx>{`
        .live-video-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
          padding: 20px;
        }

        .live-video-modal {
          position: relative;
          width: 100%;
          max-width: 900px;
          max-height: 90vh;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
        }

        .live-video-modal-close {
          position: absolute;
          top: 16px;
          right: 16px;
          width: 40px;
          height: 40px;
          border: none;
          background: rgba(0, 0, 0, 0.7);
          color: white;
          border-radius: 50%;
          font-size: 20px;
          cursor: pointer;
          z-index: 10;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }

        .live-video-modal-close:hover {
          background: rgba(0, 0, 0, 0.9);
          transform: scale(1.1);
        }

        @media (max-width: 768px) {
          .live-video-modal {
            max-width: 100%;
            max-height: 100vh;
            border-radius: 0;
          }

          .live-video-modal-overlay {
            padding: 0;
          }
        }
      `}</style>
    </div>
  )
}

