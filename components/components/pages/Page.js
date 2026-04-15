"use client";
// Labels pour les étoiles (avis)
const STAR_LABELS = {
  1: 'Très mauvais',
  2: 'Mauvais',
  3: 'Moyen',
  4: 'Bon',
  5: 'Excellent',
};
// Formateur de date relative (ex: "il y a 2h", "hier", etc.)
function formatTimeAgo(date) {
  if (!date) return '';
  const now = new Date();
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  const diff = now - d;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (diff < 60000) return "A l'instant";
  if (diff < 3600000) return `Il y a ${Math.floor(diff / 60000)} min`;
  if (diff < 86400000) return `Il y a ${Math.floor(diff / 3600000)} h`;
  if (days === 1) return 'Hier';
  if (days < 7) return `Il y a ${days} j`;
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
}

// Formateur de nombres avec séparateur de milliers
function formatNumber(n) {
  if (typeof n !== 'number') return n;
  return n.toLocaleString('fr-FR');
}

const PAGE_TABS = [
  { id: 'publications', label: 'Publications', icon: 'FileText' },
  { id: 'about', label: 'À propos', icon: 'Info' },
  { id: 'photos', label: 'Photos', icon: 'Image' },
  { id: 'videos', label: 'Vidéos', icon: 'Video' },
  { id: 'events', label: 'Événements', icon: 'Calendar' },
  { id: 'reviews', label: 'Avis', icon: 'Star' },
  { id: 'community', label: 'Communauté', icon: 'Users' },
];

import { Icons } from '../../Icons.js';
import stylesContrib from './Page.contribute-btn.module.css';
import eventCardStyles from '../../../styles/up-event-card.module.css';

import React, {
  useState,
  useCallback,
  useRef,
  useEffect,
  useMemo,
  forwardRef,
  useImperativeHandle,
  useSyncExternalStore,
} from 'react';
import { useRouter } from 'next/router';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faGlobe,
  faUsers,
  faPlus,
  faImage,
  faVideo,
  faFaceSmile,
  faThumbsUp,
  faComment,
  faShare,
  faEllipsisH,
  faBookmark,
  faCheck,
  faXmark,
  faChevronDown,
  faCalendar,
  faMapPin,
  faPhone,
  faEnvelope,
  faLink,
  faStar,
  faHeart,
  faPaperPlane,
  faCamera,
  faPen,
  faSearch,
  faFlag,
  faThumbtack,
  faExternalLinkAlt,
  faClock,
  faPlay,
  faTag,
  faComments,
  faUserPlus,
  faFileAlt,
  faInfoCircle,
  faCopy,
  faFilter,
  faSort,
  faCog,
  faBullhorn,
  faMap,
  faShieldAlt,
} from '@fortawesome/free-solid-svg-icons';
import Modal from '../../Modal';
import { PageSkeleton } from '../../Skeleton';
import CreatePost from '../../CreatePost';
import CreatePostModal from '../../CreatePostModal';
import TextPostCreator from '../../TextPostCreator';
import PagePostCard from '../../PagePostCard';
import InviteModal from '../../InviteModal';
import Toast from '../../Toast';

const FEELING_OPTIONS = [
  { emoji: '😊', label: 'Joyeux' },
  { emoji: '😔', label: 'Triste' },
  { emoji: '😍', label: 'Amoureux' },
  { emoji: '😡', label: 'Fâché' },
  { emoji: '😎', label: 'Cool' },
  { emoji: '🎉', label: 'Célébration' },
];

/* ============================================
   Sub-Components
   ============================================ */

// ================= VIDEO VIEWER MODAL =================
const VideoViewerModal = ({ video, videoIndex, totalVideos, onClose, onPrev, onNext, canPrev, canNext, pageId, currentUser }) => {
  const [videoPlayerRef, setVideoPlayerRef] = useState(null);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [videoMuted, setVideoMuted] = useState(false);
  const [videoCurrentTime, setVideoCurrentTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [videoProgress, setVideoProgress] = useState(0);
  const [likeCount, setLikeCount] = useState(video.likes || 0);
  const [liked, setLiked] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);
  const [followed, setFollowed] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [shareCopied, setShareCopied] = useState(false);

  useEffect(() => {
    setLikeCount(video.likes || 0);
    setLiked(false);
    setComments([]);
    setCommentText("");
    setShareCopied(false);
    setLoadingComments(true);
    fetch(`/api/items/${video.id}/comments`)
      .then(res => res.json())
      .then(data => setComments(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoadingComments(false));
    if (pageId) {
      fetch(`/api/pages/${pageId}/follow`, { method: 'GET', credentials: 'include' })
        .then(res => res.json())
        .then(data => {
          setFollowed(!!data.isFollowing);
          setFollowersCount(data.followersCount || 0);
        })
        .catch(() => {});
    }
  }, [video.id, pageId]);

  const handleLike = async () => {
    if (!currentUser || liked) return;
    setLiked(true);
    setLikeCount(prev => prev + 1);
    await fetch(`/api/items/${video.id}/reactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'like', userEmail: currentUser.email })
    }).catch(() => {});
  };

  const handleComment = async () => {
    if (!currentUser || !commentText.trim()) return;
    try {
      const res = await fetch(`/api/items/${video.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: commentText, author: currentUser.email, authorEmail: currentUser.email })
      });
      if (res.ok) {
        const newComment = await res.json();
        setComments(prev => [...prev, newComment]);
        setCommentText("");
      }
    } catch (e) {}
  };

  const handleFollow = async () => {
    if (!currentUser || !pageId) return;
    try {
      if (followed) {
        await fetch(`/api/pages/${pageId}/follow`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userEmail: currentUser.email })
        });
        setFollowed(false);
        setFollowersCount(prev => prev - 1);
      } else {
        await fetch(`/api/pages/${pageId}/follow`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userEmail: currentUser.email })
        });
        setFollowed(true);
        setFollowersCount(prev => prev + 1);
      }
    } catch (e) {}
  };

  const handleShare = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.origin + `/videos/${video.id}`);
    }
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2000);
  };

  return (
    <div className="up-modal-overlay" onClick={onClose} style={{zIndex: 9999, background: 'rgba(0,0,0,0.92)'}}>
      <div className="up-video-viewer" onClick={e => e.stopPropagation()} style={{position: 'relative', width: '90vw', maxWidth: 1000, background: '#000', borderRadius: 12, overflow: 'hidden', boxShadow: '0 8px 40px rgba(0,0,0,0.6)'}}>
        {/* Header */}
        <div style={{position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'linear-gradient(to bottom, rgba(0,0,0,0.8), transparent)', flexWrap: 'wrap', gap: 8}}>
          <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
            <span style={{color: '#fff', fontSize: 16, fontWeight: 600}}>{video.title}</span>
            <button onClick={handleFollow} style={{marginLeft: 16, background: followed ? '#1877f2' : '#fff', color: followed ? '#fff' : '#1877f2', border: 'none', borderRadius: 20, padding: '4px 16px', fontWeight: 600, cursor: 'pointer'}}>
              {followed ? 'Abonn\u00e9' : "S'abonner"} ({followersCount})
            </button>
          </div>
          <button onClick={onClose} style={{background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: 36, height: 36, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s'}}>
            <Icons.X size={20} />
          </button>
        </div>

        {/* Video Player */}
        <div style={{position: 'relative', paddingTop: '56.25%'}}>
          <video
            ref={setVideoPlayerRef}
            src={video.url || video.videoUrl}
            poster={video.thumbnail}
            style={{position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'contain', background: '#000'}}
            onPlay={() => setVideoPlaying(true)}
            onPause={() => setVideoPlaying(false)}
            onTimeUpdate={e => {
              setVideoCurrentTime(e.target.currentTime);
              setVideoProgress((e.target.currentTime / e.target.duration) * 100);
            }}
            onLoadedMetadata={e => setVideoDuration(e.target.duration)}
            onEnded={() => setVideoPlaying(false)}
            onVolumeChange={e => setVideoMuted(e.target.muted)}
            onClick={e => { if (e.target.paused) { e.target.play(); } else { e.target.pause(); } }}
            controls
          />
        </div>

        {/* Action Bar */}
        <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#1a1a1a', flexWrap: 'wrap', gap: 12}}>
          <div style={{display: 'flex', alignItems: 'center', gap: 16}}>
            <button onClick={handleLike} style={{background: liked ? '#1877f2' : 'transparent', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 10px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6}}>
              <Icons.ThumbsUp size={18} /> J&apos;aime ({likeCount})
            </button>
            <button onClick={() => videoPlayerRef && (videoPlayerRef.paused ? videoPlayerRef.play() : videoPlayerRef.pause())} style={{background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, padding: '6px 10px', borderRadius: 6}}>
              {videoPlaying ? <Icons.Pause size={18} /> : <Icons.Play size={18} />}
              <span>{videoPlaying ? 'Pause' : 'Lecture'}</span>
            </button>
            <button onClick={handleShare} style={{background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, padding: '6px 10px', borderRadius: 6}}>
              <Icons.Share size={18} /> {shareCopied ? 'Lien copi\u00e9 !' : 'Partager'}
            </button>
          </div>
          <div style={{color: '#b0b3b8', fontSize: 13}}>{formatNumber(video.views || 0)} vues · {formatTimeAgo(video.createdAt)}</div>
        </div>

        {/* Progress Bar */}
        <div style={{height: 5, background: 'rgba(255,255,255,0.2)', cursor: 'pointer', position: 'relative'}} onClick={e => {
          if (videoPlayerRef && videoDuration) {
            const rect = e.currentTarget.getBoundingClientRect();
            const percent = (e.clientX - rect.left) / rect.width;
            videoPlayerRef.currentTime = percent * videoDuration;
          }
        }}>
          <div style={{height: '100%', width: `${videoProgress}%`, background: '#1877f2', transition: 'width 0.1s linear'}} />
        </div>

        {/* Comments Section */}
        <div style={{background: '#18191a', padding: 16, minHeight: 180}}>
          <h4 style={{color: '#fff', marginBottom: 8}}>Commentaires</h4>
          {loadingComments ? <div style={{color: '#b0b3b8'}}>Chargement...</div> : (
            <div style={{maxHeight: 200, overflowY: 'auto', marginBottom: 8}}>
              {comments.length === 0 && <div style={{color: '#b0b3b8'}}>Aucun commentaire</div>}
              {comments.map((c, i) => (
                <div key={c.id || i} style={{display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8}}>
                  <img src={c.authorUser?.avatar || '/images/default-page.png'} alt="avatar" style={{width: 32, height: 32, borderRadius: '50%'}} />
                  <div>
                    <div style={{color: '#fff', fontWeight: 600, fontSize: 14}}>{c.authorUser?.prenom || c.authorUser?.email || c.author || 'Utilisateur'}</div>
                    <div style={{color: '#b0b3b8', fontSize: 13}}>{c.text}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {currentUser && (
            <div style={{display: 'flex', alignItems: 'center', gap: 8, marginTop: 8}}>
              <input type="text" value={commentText} onChange={e => setCommentText(e.target.value)} placeholder="Ajouter un commentaire..." style={{flex: 1, borderRadius: 20, border: 'none', padding: '8px 14px', fontSize: 14}} onKeyDown={e => e.key === 'Enter' && handleComment()} />
              <button onClick={handleComment} style={{background: '#1877f2', color: '#fff', border: 'none', borderRadius: 20, padding: '8px 16px', fontWeight: 600, cursor: 'pointer'}}>Envoyer</button>
            </div>
          )}
        </div>

        {/* Navigation arrows & counter */}
        {totalVideos > 1 && (
          <>
            {canPrev && (
              <button onClick={onPrev} style={{position: 'absolute', left: 16, top: '40%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', width: 48, height: 48, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s', zIndex: 10}}>
                <Icons.ArrowLeft size={24} />
              </button>
            )}
            {canNext && (
              <button onClick={onNext} style={{position: 'absolute', right: 16, top: '40%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', width: 48, height: 48, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s', zIndex: 10}}>
                <Icons.ArrowRight size={24} />
              </button>
            )}
            <div style={{position: 'absolute', top: 16, right: 60, background: 'rgba(0,0,0,0.6)', borderRadius: 20, padding: '6px 12px', color: '#fff', fontSize: 13}}>
              {videoIndex + 1} / {totalVideos}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

/* --- Reaction Tooltip --- */
const ReactionTooltip = ({ show, onReaction, onClose }) => {
  const ref = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        onClose();
      }
    };
    if (show) {
      document.addEventListener('mousedown', handleClick);
    }
    return () => document.removeEventListener('mousedown', handleClick);
  }, [show, onClose]);

  if (!show) return null;

  return (
    <div ref={ref} className="up-reaction-tooltip">
      {REACTION_EMOJIS.map((r) => (
        <button
          key={r.emoji}
          className="up-reaction-tooltip-item"
          onClick={() => onReaction(r.emoji)}
          title={r.label}
        >
          <span className="up-reaction-emoji">{r.emoji}</span>
          <span className="up-reaction-label">{r.label}</span>
        </button>
      ))}
    </div>
  );
};

/* --- Comment Item --- */
const CommentItem = ({ comment, onLike, onReply, currentUserId, depth = 0 }) => {
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyText, setReplyText] = useState('');

  const handleReply = () => {
    if (replyText.trim()) {
      onReply(comment.id, replyText.trim());
      setReplyText('');
      setShowReplyInput(false);
    }
  };

  return (
    <div className={`up-comment ${depth > 0 ? 'up-comment-reply' : ''}`}>
      <div className="up-comment-avatar">
        <img src={comment.author.avatar} alt={comment.author.name} />
      </div>
      <div className="up-comment-content">
        <div className="up-comment-bubble">
          <div className="up-comment-header">
            <span className="up-comment-author">{comment.author.name}</span>
            {comment.author.verified && (
              <span className="up-verified-badge"><Icons.Check /></span>
            )}
          </div>
          <p className="up-comment-text">{comment.text}</p>
          <div className="up-comment-meta">
            <span className="up-comment-time">{formatTimeAgo(comment.createdAt)}</span>
            <button className="up-comment-action-btn" onClick={() => onLike(comment.id)}>
              {comment.liked ? "J'aime · " : "J'aime"}
            </button>
            {comment.likes > 0 && <span className="up-comment-likes-count">{comment.likes}</span>}
            {depth < 2 && (
              <button
                className="up-comment-action-btn"
                onClick={() => setShowReplyInput(!showReplyInput)}
              >
                Répondre
              </button>
            )}
          </div>
        </div>

        {showReplyInput && (
          <div className="up-reply-input-wrap">
            <img
              src={currentUser?.avatar || '/images/default-page.png'}
              alt="You"
              className="up-reply-avatar"
            />
            <div className="up-reply-input">
              <input
                type="text"
                placeholder="Répondre..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleReply()}
                autoFocus
              />
              <button onClick={handleReply} disabled={!replyText.trim()}>
                <Icons.Send />
              </button>
            </div>
          </div>
        )}

        {comment.replies && comment.replies.length > 0 && (
          <div className="up-comment-replies">
            {comment.replies.map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                onLike={onLike}
                onReply={onReply}
                currentUserId={currentUserId}
                depth={depth + 1}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

/* --- Post Item --- */
const PostItem = ({ post, currentUser, currentPageData, currentPageId, router, onReaction, onComment, onLikeComment, onReplyComment, onToggleSave, onDelete, onShare }) => {
  const [commentText, setCommentText] = useState('');
  const [showComments, setShowComments] = useState(false);
  const [showReactionBar, setShowReactionBar] = useState(false);
  const [showPostMenu, setShowPostMenu] = useState(false);
  const reactionTimeoutRef = useRef(null);

  const handleReaction = useCallback((emoji) => {
    onReaction(post.id, emoji);
    setShowReactionBar(false);
  }, [onReaction, post.id]);

  const handleLikeHover = useCallback(() => {
    reactionTimeoutRef.current = setTimeout(() => {
      setShowReactionBar(true);
    }, 500);
  }, []);

  const handleLikeLeave = useCallback(() => {
    clearTimeout(reactionTimeoutRef.current);
    setTimeout(() => setShowReactionBar(false), 300);
  }, []);

  const handleCommentSubmit = () => {
    if (commentText.trim()) {
      onComment(post.id, commentText.trim());
      setCommentText('');
    }
  };

  const getTopReactions = () => {
    if (!post.reactions || post.reactions.length === 0) return [];
    const counts = {};
    post.reactions.forEach((r) => {
      counts[r] = (counts[r] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([emoji, count]) => ({ emoji, count }));
  };

  const topReactions = getTopReactions();
  const totalReactions = post.reactions ? post.reactions.length : 0;
  const totalComments = post.comments ? post.comments.length : 0;

  const isPageOwner = currentUser && (currentUser.role === 'owner' || currentUser.role === 'admin');

  return (
    <div className={`up-post ${post.pinned ? 'up-post-pinned' : ''} ${post.isAnnouncement ? 'up-post-announcement' : ''}`}>
      {(post.pinned || post.isAnnouncement) && (
        <div className="up-post-badge">
          <Icons.Pinned />
          <span>{post.isAnnouncement ? 'Annonce' : 'Épinglé'}</span>
        </div>
      )}

      <div className="up-post-header">
        <div className="up-post-author-info">
          <div className="up-dashboard-actions">
            <button className="up-dashboard-btn-compact" onClick={() => router.push(`/dashboard/page-admin/${currentPageId}`)}>
              <Icons.User /> <span>Tableau de bord</span>
            </button>
            <button className="up-dashboard-btn-compact" onClick={() => setShowInviteModal(true)}>
              <Icons.UserPlus /> <span>Inviter</span>
            </button>
            <button className="up-dashboard-btn-compact" onClick={handleOpenSponsorModal}>
              <Icons.Megaphone /> <span>Promouvoir</span>
            </button>
            <div className="up-owner-menu">
              <button
                className="up-icon-btn"
                onClick={() => setShowOwnerMenu(!showOwnerMenu)}
              >
                <Icons.MoreHorizontal />
              </button>
              {showOwnerMenu && (
                <>
                  <div className="up-overlay" onClick={() => setShowOwnerMenu(false)} />
                  <div className="up-dropdown-menu up-dropdown-top">
                    <button onClick={() => handleOwnerAction('edit')}>
                      <Icons.Edit /> Modifier la page
                    </button>
                    <button onClick={() => handleOwnerAction('settings')}>
                      <Icons.Settings /> Paramètres
                    </button>
                    <button onClick={handleOpenSponsorModal}>
                      <Icons.Megaphone /> Promouvoir
                    </button>
                    <button onClick={() => setShowInviteModal(true)}>
                      <Icons.UserPlus /> Inviter
                    </button>
                    <button className="up-dropdown-danger" onClick={() => handleOwnerAction('delete')}>
                      <Icons.Trash2 /> Supprimer la page
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
          <button 
            className="up-icon-btn" 
            onClick={() => onToggleSave(post.id)}
            aria-label={post.saved ? "Retirer des enregistrés" : "Ajouter aux enregistrés"}
            title={post.saved ? "Retirer des enregistrés" : "Ajouter aux enregistrés"}
          >
            <span className={post.saved ? 'is-active' : ''}><Icons.Bookmark /></span>
          </button>
        </div>
      </div>

      <div className="up-post-content">
        {post.tags && post.tags.length > 0 && (
          <div className="up-post-tags">
            {post.tags.map((tag) => (
              <span key={tag} className="up-tag"><Icons.Tag /> {tag}</span>
            ))}
          </div>
        )}

        {/* Special Event Card Display */}
        {post.event && post.event.title && (
          <div className={eventCardStyles['up-event-card']}>
            {post.event.coverImage && (
              <img src={post.event.coverImage} alt={post.event.title} className={eventCardStyles['up-event-card-cover']} />
            )}
            <div className={eventCardStyles['up-event-card-content']}>
              <div className={eventCardStyles['up-event-card-date']}>
                <Icons.Calendar />
                {post.event.date && (
                  <span>
                    {new Date(post.event.date).toLocaleDateString('fr-FR', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                )}
              </div>
              <h4 className={eventCardStyles['up-event-card-title']}>{post.event.title}</h4>
              {post.event.location && (
                <div className={eventCardStyles['up-event-card-location']}>
                  <Icons.MapPin /> {post.event.location}
                </div>
              )}
              {post.event.description && (
                <p className={eventCardStyles['up-event-card-desc']}>{post.event.description}</p>
              )}
              <button 
                className={eventCardStyles['up-event-card-btn']}
                onClick={() => {
                  let userEmail = currentUser?.email || null;
                  if (!userEmail && typeof window !== 'undefined') {
                    try {
                      const storedUser = localStorage.getItem('user');
                      if (storedUser) {
                        const parsedUser = JSON.parse(storedUser);
                        userEmail = parsedUser?.email || null;
                      }
                    } catch (e) {}
                    if (!userEmail) {
                      userEmail = localStorage.getItem('user_email');
                    }
                  }
                  if (!userEmail) {
                    alert('Vous devez être connecté pour participer à un événement.');
                    return;
                  }
                  handleEventParticipate(post.id);
                }}
              >
                {post.userParticipating ? 'Participe' : 'Participer'}
              </button>
            </div>
          </div>
        )}

        {/* Regular Meta (when no special event card) */}
        {!post.event && (
          <>
            {(post.feeling || post.location) && (
              <div className="up-post-meta-flair up-meta-box">
                {post.feeling && (
                  <span className="up-feeling-badge">
                    <span>{FEELING_OPTIONS.find((f) => f.label === post.feeling)?.emoji || '🙂'}</span>
                    {post.feeling}
                  </span>
                )}
                {post.location && (
                  <span className="up-location-badge">
                    <Icons.MapPin /> {post.location}
                  </span>
                )}
              </div>
            )}
            <p className="up-post-text">{post.content}</p>
          </>
        )}
      </div>

      {post.images && post.images.length > 0 && (
        <div className={`up-post-images up-images-${Math.min(post.images.length, 4)}`}>
          {post.images.slice(0, 4).map((img, idx) => (
            <div key={idx} className="up-post-image-wrap">
              <img src={img} alt={`Post image ${idx + 1}`} />
              {idx === 3 && post.images.length > 4 && (
                <div className="up-image-overlay">
                  +{post.images.length - 4}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Video Post - Using professional video viewer */}
      {(post.video || (post.media && post.media.type === 'video')) && (
        <div className="up-post-video">
          <video 
            src={post.video || post.media?.url} 
            controls 
            style={{
              width: '100%',
              maxHeight: '500px',
              borderRadius: '8px',
              backgroundColor: '#000'
            }}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {post.linkPreview && (
        <div className="up-post-link-preview">
          <img src={post.linkPreview.image} alt="" />
          <div className="up-link-preview-info">
            <span className="up-link-domain">{post.linkPreview.domain}</span>
            <p className="up-link-title">{post.linkPreview.title}</p>
            <p className="up-link-desc">{post.linkPreview.description}</p>
          </div>
        </div>
      )}

      {(totalReactions > 0 || totalComments > 0) && (
        <div className="up-post-stats">
          <div className="up-post-stats-left">
            {totalReactions > 0 && (
              <div className="up-reaction-counts">
                <div className="up-reaction-icons">
                  {topReactions.map((r) => (
                    <span key={r.emoji} className="up-reaction-count-icon">{r.emoji}</span>
                  ))}
                </div>
                <span>{totalReactions}</span>
              </div>
            )}
          </div>
          <div className="up-post-stats-right">
            {totalComments > 0 && (
              <button
                className="up-post-stat-btn"
                onClick={() => setShowComments(!showComments)}
              >
                {totalComments} commentaire{totalComments > 1 ? 's' : ''}
              </button>
            )}
            {post.shares > 0 && (
              <span className="up-post-stat-btn">{post.shares} partages</span>
            )}
          </div>
        </div>
      )}

      <div className="up-post-actions-bar">
        <div className="up-post-action" onMouseEnter={handleLikeHover} onMouseLeave={handleLikeLeave}>
          <ReactionTooltip
            show={showReactionBar}
            onReaction={handleReaction}
            onClose={() => setShowReactionBar(false)}
          />
          <button
            className={`up-action-btn ${post.userReaction ? 'has-reaction' : ''}`}
            onClick={() => onReaction(post.id, post.userReaction ? null : '👍')}
          >
            {post.userReaction ? (
              <span className="up-action-emoji">{post.userReaction}</span>
            ) : (
              <Icons.ThumbsUp />
            )}
            <span>J&apos;aime</span>
          </button>
        </div>
        <button
          className="up-action-btn"
          onClick={() => setShowComments(!showComments)}
        >
          <Icons.Comment />
          <span>Commenter</span>
        </button>
        <button className="up-action-btn" onClick={() => onShare && onShare(post.id)}>
          <Icons.Share />
          <span>Partager</span>
        </button>
      </div>

      {showComments && (
        <div className="up-comments-section">
          {post.comments && post.comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              onLike={(commentId) => onLikeComment(post.id, commentId)}
              onReply={(commentId, text) => onReplyComment(post.id, commentId, text)}
              currentUserId={currentUser?.id}
            />
          ))}

          <div className="up-comment-input-wrap">
            <div className="up-comment-input-avatar">
              <img src={currentUser?.avatar || '/images/default-page.png'} alt="" />
            </div>
            <div className="up-comment-input-container">
              <div className="up-comment-input-box">
                <input
                  type="text"
                  placeholder="Écrire un commentaire..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCommentSubmit()}
                />
                <div className="up-comment-input-actions">
                  <button className="up-icon-btn" title="Ajouter un emoji" aria-label="Ajouter un emoji"><Icons.Smile /></button>
                  <button className="up-icon-btn" title="Ajouter une caméra" aria-label="Ajouter une photo de caméra"><Icons.Camera /></button>
                  <button className="up-icon-btn" title="Ajouter une image" aria-label="Ajouter une image"><Icons.Image /></button>
                </div>
              </div>
              {commentText.trim() && (
                <button className="up-comment-submit" onClick={handleCommentSubmit}>
                  <Icons.Send />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* --- Review Item --- */
const ReviewItem = ({ review, helpfulCount = 0, userVoted = false, replies = [], onHelpful, onReply, currentUserEmail }) => {
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [showReplies, setShowReplies] = useState(false);

  const handleHelpfulClick = () => {
    if (onHelpful) onHelpful();
  };

  const handleSubmitReply = () => {
    if (replyText.trim() && onReply) {
      onReply(replyText);
      setReplyText('');
      setShowReplyInput(false);
    }
  };

  return (
    <div className="up-review-item">
      <div className="up-review-header">
        <div className="up-review-author">
          <img src={review.author.avatar} alt={review.author.name} className="up-review-avatar" />
          <div className="up-review-author-info">
            <span className="up-review-name">{review.author.name}</span>
            <span className="up-review-date">{formatTimeAgo(review.createdAt)}</span>
          </div>
        </div>
        <div className="up-review-rating">
          {[1, 2, 3, 4, 5].map((star) => (
            <span
              key={star}
              className={`up-star ${star <= review.rating ? 'up-star-filled' : 'up-star-empty'}`}
            >
              {star <= review.rating ? <Icons.Star /> : <Icons.StarEmpty />}
            </span>
          ))}
        </div>
      </div>
      {review.recommends !== undefined && (
        <div className={`up-review-recommend ${review.recommends ? 'up-recommend-yes' : 'up-recommend-no'}`}>
          {review.recommends ? <Icons.ThumbsUp /> : <Icons.ThumbsUp />}
          <span>{review.recommends ? 'Recommande' : 'Ne recommande pas'}</span>
        </div>
      )}
      {review.text && (
        <p className="up-review-text">{review.text}</p>
      )}
      <div className="up-review-footer">
        <button className={`up-review-action ${userVoted ? 'up-review-action-voted' : ''}`} onClick={handleHelpfulClick}>
          <Icons.ThumbsUp /> Utile ({helpfulCount})
        </button>
        <button className="up-review-action" onClick={() => setShowReplyInput(!showReplyInput)}>
          <Icons.Comment /> Répondre
        </button>
      </div>

      {showReplyInput && (
        <div className="up-review-reply-input">
          <input
            type="text"
            placeholder="Écrire une réponse..."
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmitReply()}
          />
          <button onClick={handleSubmitReply} disabled={!replyText.trim()}>
            <Icons.Send />
          </button>
        </div>
      )}

      {replies && replies.length > 0 && (
        <div className="up-review-replies">
          <button className="up-replies-toggle" onClick={() => setShowReplies(!showReplies)}>
            {showReplies ? 'Masquer' : 'Afficher'} les réponses ({replies.length})
          </button>
          {showReplies && replies.map((reply) => (
            <div key={reply.id} className="up-review-reply-item">
              <div className="up-reply-author">
                <img src={reply.author.avatar} alt={reply.author.name} className="up-reply-avatar" />
                <span className="up-reply-name">{reply.author.name}</span>
                <span className="up-reply-date">{formatTimeAgo(review.createdAt)}</span>
              </div>
              <p className="up-reply-text">{reply.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* --- Photo Grid --- */
const PhotoGrid = ({ photos, onPhotoClick }) => (
  <div className="up-photo-grid">
    {photos.map((photo, idx) => (
      <div key={idx} className="up-photo-item" onClick={() => onPhotoClick && onPhotoClick(idx)}>
        <img src={photo.url} alt={photo.caption || ''} />
        <div className="up-photo-overlay">
          <span className="up-photo-likes"><Icons.Heart /> {photo.likes || 0}</span>
          {photo.caption && <span className="up-photo-caption">{photo.caption}</span>}
        </div>
      </div>
    ))}
  </div>
);

/* --- Video Item --- */
const VideoItem = ({ video, onClick }) => (
  <div className="up-video-item" onClick={() => onClick && onClick(video)}>
    <div className="up-video-thumbnail">
      <img src={video.thumbnail} alt={video.title} />
      <div className="up-video-play-btn">
        <Icons.Play />
      </div>
      {video.duration && (
        <span className="up-video-duration">{video.duration}</span>
      )}
    </div>
    <div className="up-video-info">
      <p className="up-video-title">{video.title}</p>
      <p className="up-video-meta">
        <span>{formatNumber(video.views)} vues</span>
        <span>·</span>
        <span>{formatTimeAgo(video.createdAt)}</span>
      </p>
    </div>
  </div>
);

/* --- Event Item --- */
const EventItem = ({ event }) => {
  if (!event || !event.date) return null;
  
  const eventDate = new Date(event.date);
  if (isNaN(eventDate.getTime())) return null;
  
  return (
    <div className="up-event-item">
      <div className="up-event-date">
        <span className="up-event-month">
          {eventDate.toLocaleDateString('fr-FR', { month: 'short' })}
        </span>
        <span className="up-event-day">
          {eventDate.getDate()}
        </span>
      </div>
      <div className="up-event-info">
        <p className="up-event-title">{event.title}</p>
        <p className="up-event-time">
          {eventDate.toLocaleDateString('fr-FR', {
            weekday: 'long',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
        {event.location && (
          <p className="up-event-location">
            <Icons.MapPin /> {event.location}
          </p>
        )}
        <div className="up-event-interested">
          <span>{event.interestedCount || 0} intéressés</span>
        </div>
      </div>
      <button className="up-event-join-btn">Intéressé(e)</button>
    </div>
  );
};

/* --- Business Hours --- */
const emptySubscribe = () => () => {};

const BusinessHours = ({ hours }) => {
  const currentDay = useSyncExternalStore(
    emptySubscribe,
    () => new Date().getDay(),
    () => 0
  );

  const isOpen = currentDay >= 0 && hours && hours[currentDay] && hours[currentDay].open !== undefined;

  return (
    <div className="up-business-hours">
      <h4 className="up-hours-title">
        <Icons.Clock /> Horaires d&apos;ouverture
      </h4>
      {isOpen ? (
        <span className={`up-hours-status ${hours[currentDay].isOpen ? 'up-status-open' : 'up-status-closed'}`}>
          {hours[currentDay].isOpen ? 'Ouvert maintenant' : 'Fermé actuellement'}
        </span>
      ) : null}
      <div className="up-hours-table">
        {DAYS_FR.map((day, idx) => {
          const entry = hours && hours[idx];
          return (
            <div key={day} className={`up-hours-row ${idx === currentDay ? 'up-hours-today' : ''}`}>
              <span className="up-hours-day">{day}</span>
              <span className="up-hours-time">
                {entry && entry.open ? `${entry.open} - ${entry.close}` : 'Fermé'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* --- Similar Page Card --- */
const SimilarPageCard = ({ page }) => (
  <div className="up-similar-page">
    <div className="up-similar-page-avatar">
      <img src={page.avatar} alt={page.name} />
    </div>
    <div className="up-similar-page-info">
      <span className="up-similar-page-name">{page.name}</span>
      <span className="up-similar-page-likes">
        <Icons.ThumbsUp /> {formatNumber(page.likesCount)} J&apos;aime
      </span>
    </div>
    <button className="up-similar-page-btn">
      <Icons.ThumbsUp /> J&apos;aime
    </button>
  </div>
);

/* --- Star Rating Input --- */
const StarRatingInput = ({ rating, onChange }) => (
  <div className="up-star-rating-input">
    {[1, 2, 3, 4, 5].map((star) => (
      <button
        key={star}
        className={`up-star-rating-btn ${star <= rating ? 'up-star-filled' : ''}`}
        onClick={() => onChange(star)}
        title={STAR_LABELS[star]}
        type="button"
      >
        {star <= rating ? <Icons.Star /> : <Icons.StarEmpty />}
      </button>
    ))}
  </div>
);

/* ============================================
   Main Page Component
   ============================================ */
const UnifyPage = forwardRef(function UnifyPage(props, ref) {
  useEffect(() => {
    function handlePostCreated(e) {
      console.log('[Page] postCreated event received:', e?.detail);
      if (e?.detail && e.detail.id) {
        const postWithCleanedMedia = {
          ...e.detail,
          media: null,
          image: null
        };
        setLocalPosts((prev) => {
          const exists = prev.some((p) => p.id === e.detail.id);
          if (exists) return prev;
          console.log('[Page] Adding post from event to localPosts:', e.detail.id);
          return [postWithCleanedMedia, ...prev];
        });
      }
    }
    window.addEventListener('postCreated', handlePostCreated);
    return () => window.removeEventListener('postCreated', handlePostCreated);
  }, []);
  const {
    page: pageProp = {},
    currentUser = null,
    posts = [],
    photos = [],
    videos = [],
    events = [],
    reviews = [],
    similarPages = [],
    followersCount: followersCountProp,
    likesCount: likesCountProp,
    checkInsCount: checkInsCountProp,
    businessHours: businessHoursProp,
    socialLinks: socialLinksProp,
    className = '',
    showSuggestions = true,
    enableReviews = true,
    enableVideos = true,
    enableEvents = true,
    loading = false,
    onFollow,
    onUnfollow,
    onLike,
    onMessage,
    onShare,
    onPostCreate,
    onPostReaction,
    onPostComment,
    onCommentLike,
    onCommentReply,
    onReviewSubmit,
    onPostSave,
    onPostDelete,
    onTabChange,
    onPageUpdate,
    onEventParticipate,
  } = props;


  /* --- State --- */
  const [activeTab, setActiveTab] = useState('publications');
  // State pour la modale Contribuer
  const [showContributeModal, setShowContributeModal] = useState(false);
  const [isFollowing, setIsFollowing] = useState(pageProp.isFollowing || false);
  const [isLiked, setIsLiked] = useState(pageProp.isLiked || false);
  const [localLikesCount, setLocalLikesCount] = useState(likesCountProp || pageProp.likesCount || 0);
  const [localFollowersCount, setLocalFollowersCount] = useState(followersCountProp || pageProp.followersCount || 0);
  const [localCheckInsCount, setLocalCheckInsCount] = useState(checkInsCountProp || pageProp.checkInsCount || 0);
  const [showPostComposer, setShowPostComposer] = useState(false);
  const [postText, setPostText] = useState('');
  const [postImages, setPostImages] = useState([]);
  const [postTags, setPostTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [showTagInput, setShowTagInput] = useState(false);
  const [postFeeling, setPostFeeling] = useState(null);
  const [showFeelingPicker, setShowFeelingPicker] = useState(false);
  const [postLocation, setPostLocation] = useState('');
  const [showLocationInput, setShowLocationInput] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [showEventForm, setShowEventForm] = useState(false);
  const [postBackgroundColor, setPostBackgroundColor] = useState('');
  const [postTextColor, setPostTextColor] = useState('');
  const [postBackgroundImage, setPostBackgroundImage] = useState('');
  const [localPosts, setLocalPosts] = useState(posts || []);
  const [postsLoaded, setPostsLoaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const [showShareModal, setShowShareModal] = useState(false);
  const [sharedPostId, setSharedPostId] = useState(null);
  const [showOwnerMenu, setShowOwnerMenu] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showSponsorModal, setShowSponsorModal] = useState(false);
  const [sponsorLoading, setSponsorLoading] = useState(false);
  const [sponsorError, setSponsorError] = useState('');
  const [isSponsoredPage, setIsSponsoredPage] = useState(false);
  const [sponsorFormData, setSponsorFormData] = useState({
    title: '',
    description: '',
    destinationUrl: '',
    imageUrl: '',
    ownerName: '',
    ownerGradientColor: '#667eea',
    ownerAvatarUrl: '',
    ownerAvatarFile: null,
    ownerAvatarPreview: null,
  });
  const [ownerAction, setOwnerAction] = useState(null); // 'edit' | 'settings' | 'advertise' | 'info' | 'transparency'
  const [currentPageDraft, setPageDraft] = useState({
    name: pageProp.name || '',
    category: pageProp.category || '',
    description: pageProp.description || '',
  });
  const [currentPageSettings, setPageSettings] = useState({
    isPublic: pageProp.isPublic !== undefined ? pageProp.isPublic : true,
    notificationsEnabled: pageProp.notificationsEnabled !== undefined ? pageProp.notificationsEnabled : true,
    publishEnabled: pageProp.isPublished !== undefined ? pageProp.isPublished : true,
  });
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [reviewRecommends, setReviewRecommends] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [uploadModal, setUploadModal] = useState(null); // 'avatar' | 'cover' | null
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState(null);
  const [toast, setToast] = useState(null);
  const [pagePhotos, setPagePhotos] = useState(photos || []);
  const [pageVideos, setPageVideos] = useState(videos || []);
  const [pageReviews, setPageReviews] = useState(reviews || []);
  const [pageEvents, setPageEvents] = useState(events || []);
  const [eventsLoaded, setEventsLoaded] = useState(false);
  const [reviewsLoaded, setReviewsLoaded] = useState(false);
  const [reviewHelpfulCounts, setReviewHelpfulCounts] = useState({});
  const [reviewUserVoted, setReviewUserVoted] = useState({});
  const [reviewReplies, setReviewReplies] = useState({});
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(null);
  const [photoViewerOpen, setPhotoViewerOpen] = useState(false);
  const [selectedVideoIndex, setSelectedVideoIndex] = useState(null);
  const [videoViewerOpen, setVideoViewerOpen] = useState(false);
  const [videoPlayerRef, setVideoPlayerRef] = useState(null);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [videoCurrentTime, setVideoCurrentTime] = useState(0);
  const [videoVolume, setVideoVolume] = useState(1);
  const [videoMuted, setVideoMuted] = useState(false);
  const [videoFullscreen, setVideoFullscreen] = useState(false);

  const fileInputRef = useRef(null);
  const coverInputRef = useRef(null);

  // Fetch posts from API if currentPage.id exists and no posts were passed via props

  // --- Handle reloadFeed event to refresh posts ---
  useEffect(() => {
    function handleReloadFeed() {
      console.log('[Page] reloadFeed event received, re-fetching posts');
      const pageId = pageProp.id;
      if (pageId) {
        const numericPageId = parseInt(pageId, 10);
        if (isNaN(numericPageId)) {
          console.warn('Invalid page ID for reloadFeed:', pageId);
          return;
        }
        fetch(`/api/pages/${numericPageId}/posts`)
          .then(res => {
            if (!res.ok) throw new Error('API error: ' + res.status);
            return res.json();
          })
          .then(data => {
            const fetchedPosts = Array.isArray(data) ? data : (data.posts || []);
            // Ne pas écraser media, image, video : garder les champs d'origine
            const cleanedPosts = fetchedPosts.map(p => ({ ...p }));
            // Fusionne les posts locaux non encore en base (id temporaire ou id non trouvé dans l'API)
            setLocalPosts(prev => {
              const apiIds = new Set(fetchedPosts.map(p => p.id));
              const localOnly = prev.filter(p => !apiIds.has(p.id));
              return [...localOnly, ...cleanedPosts];
            });
            setPostsLoaded(true);
          })
          .catch(e => {
            console.warn('Failed to refresh posts (keeping existing):', e.message);
            setPostsLoaded(true);
          });
      }
    }
    window.addEventListener('reloadFeed', handleReloadFeed);
    return () => window.removeEventListener('reloadFeed', handleReloadFeed);
  }, [pageProp.id]);

  // --- Synchroniser le draft et les settings quand l'ID de currentPage change ---
  useEffect(() => {
    setPageDraft({
      name: pageProp.name || '',
      category: pageProp.category || '',
      description: pageProp.description || '',
    });
    setPageSettings({
      isPublic: pageProp.isPublic !== undefined ? pageProp.isPublic : true,
      notificationsEnabled: pageProp.notificationsEnabled !== undefined ? pageProp.notificationsEnabled : true,
      publishEnabled: pageProp.isPublished !== undefined ? pageProp.isPublished : true,
    });
    // Sync checkInsCount from props
    if (pageProp.checkInsCount !== undefined) {
      setLocalCheckInsCount(pageProp.checkInsCount);
    }
  }, [pageProp.id]);

  // --- Fetch posts depuis l'API si besoin ---
  useEffect(() => {
    const controller = new AbortController();
    const fetchPosts = () => {
      const pageId = pageProp.id;
      if (!pageId) return;
      const numericPageId = parseInt(pageId, 10);
      if (isNaN(numericPageId)) {
        console.warn('Invalid page ID:', pageId);
        setPostsLoaded(true);
        return;
      }
      // Always try to fetch fresh data when pageId changes
      // First check props for posts (these come from server-side rendering)
      if (posts && posts.length > 0) {
        console.log('[Page] Setting posts from props:', posts.length);
        setLocalPosts(posts);
        setPostsLoaded(true);
        return;
      }
      if (pageProp.posts && pageProp.posts.length > 0) {
        console.log('[Page] Setting posts from pageProp.posts:', pageProp.posts.length);
        setLocalPosts(pageProp.posts);
        setPostsLoaded(true);
        return;
      }
      // No posts in props, fetch from API
      setPostsLoaded(false);
      console.log('[Page] Fetching posts from API for page:', numericPageId);
      fetch(`/api/pages/${numericPageId}/posts`, { signal: controller.signal })
        .then(res => {
          if (controller.signal.aborted) return;
          return res.json();
        })
        .then(data => {
          if (controller.signal.aborted) return;
          const fetchedPosts = Array.isArray(data) ? data : (data.posts || []);
const cleanedPosts = fetchedPosts.map(p => ({
              ...p,
              media: null,
              image: null
            }));
            // Fusionne les posts locaux temporaires (id commençant par temp-) avec ceux de l'API
          setLocalPosts(prev => {
            const apiIds = new Set(fetchedPosts.map(p => p.id));
            const localOnly = prev.filter(p => String(p.id).startsWith('temp-'));
            return [...localOnly, ...cleanedPosts];
          });
          setPostsLoaded(true);
        })
        .catch(e => {
          if (e.name === 'AbortError') return;
          console.warn('Failed to fetch currentPage posts:', e);
        });
    };
    fetchPosts();
    return () => controller.abort();
  }, [pageProp.id]);

  // --- Fetch initial follow, like and visit status ---
  useEffect(() => {
    const fetchFollowLikeStatus = async () => {
      const pageId = pageProp.id;
      if (!pageId) return;
      
      const numericPageId = parseInt(pageId, 10);
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      
      try {
        const [followRes, likeRes, pageRes] = await Promise.all([
          fetch(`/api/pages/${numericPageId}/follow`, {
            headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
          }),
          fetch(`/api/pages/${numericPageId}/like`, {
            headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
          }),
          fetch(`/api/pages/${numericPageId}`, {
            headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
          })
        ]);
        
        if (followRes.ok) {
          const followData = await followRes.json();
          setIsFollowing(followData.isFollowing);
          setLocalFollowersCount(followData.followersCount);
        }
        
        if (likeRes.ok) {
          const likeData = await likeRes.json();
          setIsLiked(likeData.isLiked);
          setLocalLikesCount(likeData.likesCount);
        }

        if (pageRes.ok) {
          const pageData = await pageRes.json();
          if (pageData.checkInsCount !== undefined) {
            setLocalCheckInsCount(pageData.checkInsCount);
          }
        }
      } catch (e) {
        console.warn('Failed to fetch follow/like/page status:', e);
      }
    };
    
    if (pageProp.id) {
      fetchFollowLikeStatus();
    }
  }, [pageProp.id]);

  // --- Check if currentPage is sponsored ---
  useEffect(() => {
    const checkSponsored = async () => {
      if (pageProp.ownerEmail) {
        try {
          const res = await fetch(`/api/sponsors?ownerEmail=${encodeURIComponent(pageProp.ownerEmail)}`);
          const data = await res.json();
          setIsSponsoredPage(data.sponsors && data.sponsors.length > 0);
        } catch (e) {
          console.warn('Failed to check if currentPage is sponsored', e);
        }
      }
    };
    checkSponsored();
  }, [pageProp.ownerEmail]);

  // --- Detect mobile viewport ---
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // --- Fetch photos when photos tab is active ---
  useEffect(() => {
    if (activeTab !== 'photos' || !pageProp.id) return;
    
    const numericPageId = parseInt(pageProp.id, 10);
    if (isNaN(numericPageId)) return;
    
    fetch(`/api/pages/${numericPageId}/photos`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setPagePhotos(data);
        }
      })
      .catch(e => console.warn('Failed to fetch page photos:', e));
  }, [activeTab, pageProp.id]);

  // --- Fetch videos when videos tab is active ---
  useEffect(() => {
    if (activeTab !== 'videos' || !pageProp.id) return;
    
    const numericPageId = parseInt(pageProp.id, 10);
    if (isNaN(numericPageId)) return;
    
    fetch(`/api/pages/${numericPageId}/videos`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setPageVideos(data);
        }
      })
      .catch(e => console.warn('Failed to fetch page videos:', e));
  }, [activeTab, pageProp.id]);

  // --- Fetch events when events tab is active ---
  useEffect(() => {
    if (activeTab !== 'events' || !pageProp.id) return;
    
    const numericPageId = parseInt(pageProp.id, 10);
    if (isNaN(numericPageId) || numericPageId === 0) return;

    // Use events from props if available
    if (events && events.length > 0 && !eventsLoaded) {
      setPageEvents(events);
      setEventsLoaded(true);
      return;
    }

    // Events are extracted from posts automatically, no need to fetch from API
    // Only fetch if we have page events but no events have been loaded from posts
  }, [activeTab, pageProp.id, events, eventsLoaded]);

  // --- Load reviews on page load (for stats display) ---
  useEffect(() => {
    if (!pageProp.id || reviewsLoaded) return;
    
    const numericPageId = parseInt(pageProp.id, 10);
    if (isNaN(numericPageId)) return;
    
    if (reviews && reviews.length > 0) {
      setPageReviews(reviews);
      setReviewsLoaded(true);
      return;
    }
    
    fetch(`/api/pages/${numericPageId}/reviews`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setPageReviews(data);
          setReviewsLoaded(true);
        }
      })
      .catch(e => console.warn('Failed to fetch page reviews on load:', e));
  }, [pageProp.id]);

  // --- Fetch reviews when reviews tab is active ---
  useEffect(() => {
    if (activeTab !== 'reviews' || !pageProp.id) return;
    
    if (reviews && reviews.length > 0 && !reviewsLoaded) {
      setPageReviews(reviews);
      setReviewsLoaded(true);
      return;
    }
    
    const numericPageId = parseInt(pageProp.id, 10);
    if (isNaN(numericPageId)) return;
    
    if (pageReviews.length > 0) return;
    
    fetch(`/api/pages/${numericPageId}/reviews`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setPageReviews(data);
          setReviewsLoaded(true);
        }
      })
      .catch(e => console.warn('Failed to fetch page reviews:', e));
  }, [activeTab, pageProp.id, reviews, reviewsLoaded]);

  // --- Fetch review interactions (helpful counts and replies) ---
  useEffect(() => {
    if (activeTab !== 'reviews' || !pageProp.id || !pageReviews.length) return;
    
    const numericPageId = parseInt(pageProp.id, 10);
    if (isNaN(numericPageId)) return;
    
    let userEmail = currentUser?.email || null;
    if (!userEmail && typeof window !== 'undefined') {
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          userEmail = parsedUser?.email || null;
        }
      } catch (e) {}
      if (!userEmail) {
        userEmail = localStorage.getItem('user_email');
      }
    }
    
    pageReviews.forEach(review => {
      const url = userEmail 
        ? `/api/pages/${numericPageId}/reviews/${review.id}?userEmail=${encodeURIComponent(userEmail)}`
        : `/api/pages/${numericPageId}/reviews/${review.id}`;
      fetch(url)
        .then(res => res.json())
        .then(data => {
          setReviewHelpfulCounts(prev => ({ ...prev, [review.id]: data.helpfulCount || 0 }));
          if (data.userVoted !== undefined) {
            setReviewUserVoted(prev => ({ ...prev, [review.id]: data.userVoted }));
          }
          if (data.replies && data.replies.length > 0) {
            setReviewReplies(prev => ({ ...prev, [review.id]: data.replies }));
          }
        })
        .catch(e => console.warn('Failed to fetch review interactions:', e));
    });
  }, [activeTab, pageProp.id, pageReviews, currentUser]);

  /* --- Derived data --- */
  const enabledTabs = useMemo(() => {
    return PAGE_TABS.filter((tab) => {
      if (tab.id === 'videos' && !enableVideos) return false;
      if (tab.id === 'events' && !enableEvents) return false;
      if (tab.id === 'reviews' && !enableReviews) return false;
      return true;
    });
  }, [enableReviews, enableVideos, enableEvents]);

  const filteredPosts = useMemo(() => {
    console.log('[Page] filteredPosts recalculating, localPosts length:', localPosts?.length);
    // Enrichit chaque post avec les infos de la currentPage si manquantes
    let filtered = localPosts.map((p) => {
      let enriched = { ...p };
      // Si le post est de la page (author.email === page.ownerEmail OU author.id === page.id OU author.name === pageProp.name), afficher la page comme auteur
      // Sinon, garder l'auteur réel (objet ou string)
      const pageIsAuthor = (
        (typeof enriched.author === 'object' && (
          (enriched.author.email && pageProp.ownerEmail && enriched.author.email === pageProp.ownerEmail) ||
          (enriched.author.id && pageProp.id && String(enriched.author.id) === String(pageProp.id)) ||
          (enriched.author.name && pageProp.name && enriched.author.name === pageProp.name)
        )) ||
        (typeof enriched.author === 'string' && enriched.author === pageProp.name)
      );
      if (pageIsAuthor || !enriched.author) {
        enriched.author = {
          id: pageProp.id || 'currentPage-1',
          name: pageProp.name || 'Page',
          avatar: pageProp.avatar || '/images/default-page.png',
          verified: pageProp.verified || false,
        };
      } else if (typeof enriched.author === 'string' || !enriched.author.avatar) {
        // Si l'auteur est une string ou un objet sans avatar, on garde le nom mais on met un avatar par défaut
        enriched.author = {
          name: typeof enriched.author === 'string' ? enriched.author : enriched.author.name,
          avatar: enriched.author.avatar || '/images/default-page.png',
          verified: enriched.author.verified || false,
        };
      }
      // Ajoute createdAt si absent
      if (!enriched.createdAt) {
        enriched.createdAt = enriched.date || new Date().toISOString();
      }
      // Assure que images est toujours un tableau d'URL
      if (!Array.isArray(enriched.images)) {
        if (typeof enriched.images === 'string') {
          try {
            const arr = JSON.parse(enriched.images);
            enriched.images = Array.isArray(arr) ? arr : [];
          } catch {
            enriched.images = [];
          }
        } else if (enriched.image) {
          enriched.images = [enriched.image];
        } else {
          enriched.images = [];
        }
      }
      // Nettoie les images vides ou nulles
      enriched.images = enriched.images.filter((img) => !!img);
      console.log('[Page] Post enriched:', enriched.id, 'content:', enriched.content?.substring(0, 50));
      return enriched;
    });
    console.log('[Page] filteredPosts before sort:', filtered.length, 'posts:', filtered.map(p => p.id));
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.content.toLowerCase().includes(q) ||
          p.author.name.toLowerCase().includes(q) ||
          (p.tags && p.tags.some((t) => t.toLowerCase().includes(q)))
      );
    }
    // Toujours trier du plus récent au plus ancien
    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    console.log('[Page] filteredPosts after sort:', filtered.map(p => p.id));
    return filtered;
  }, [localPosts, searchQuery, sortBy]);

  const avgRating = useMemo(() => {
    if (!pageReviews || pageReviews.length === 0) return 0;
    const sum = pageReviews.reduce((acc, r) => acc + r.rating, 0);
    return (sum / pageReviews.length).toFixed(1);
  }, [pageReviews]);

  const ratingDistribution = useMemo(() => {
    const dist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    if (!pageReviews) return dist;
    pageReviews.forEach((r) => { dist[r.rating] = (dist[r.rating] || 0) + 1; });
    return dist;
  }, [pageReviews]);

  // Extract events from posts that have event data
  useEffect(() => {
    if (!localPosts || localPosts.length === 0) return;
    const extractedEvents = localPosts
      .filter(p => {
        const eventData = typeof p.event === 'string' ? (() => { try { return JSON.parse(p.event); } catch { return null; } })() : p.event;
        return eventData && (eventData.title || eventData.date);
      })
      .map(p => {
        const eventData = typeof p.event === 'string' ? (() => { try { return JSON.parse(p.event); } catch { return null; } })() : p.event;
        return {
          id: p.id,
          title: eventData?.title || p.content?.substring(0, 50),
          date: eventData?.date,
          location: eventData?.location,
          description: eventData?.description,
          coverImage: eventData?.coverImage,
          content: p.content,
          createdAt: p.createdAt
        };
      })
      .filter(e => e.date) // Only events with valid dates
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    
    if (extractedEvents.length > 0) {
      setPageEvents(prev => {
        if (prev.length > 0 && !eventsLoaded) return prev;
        return extractedEvents;
      });
      setEventsLoaded(true);
    }
  }, [localPosts]);




  // Local state for page data (can be updated from URL query)
  // Initialize with page prop if it has an ID, otherwise null
  const [localPage, setLocalPage] = useState(pageProp?.id ? pageProp : null);

  // Use localPage throughout the component, falling back to page prop
  const currentPage = localPage || pageProp;

  const businessHours = businessHoursProp || currentPage.businessHours || null;
  const socialLinks = socialLinksProp || currentPage.socialLinks || {};

  /* --- Imperative Handle --- */
  useImperativeHandle(ref, () => ({
    setPageTab: setActiveTab,
    createPost: (text) => {
      setPostText(text);
      setShowPostComposer(true);
    },
    getPageData: () => currentPage,
  }));

  /* --- Callbacks --- */
  const handleFollow = useCallback(async () => {
    const pageId = pageProp.id;
    if (!pageId) return;
    
    const numericPageId = parseInt(pageId, 10);
    const method = isFollowing ? 'DELETE' : 'POST';
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    
    try {
      const res = await fetch(`/api/pages/${numericPageId}/follow`, {
        method,
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      
      if (res.ok) {
        const data = await res.json();
        setIsFollowing(data.isFollowing);
        setLocalFollowersCount(data.followersCount);
        if (!isFollowing) {
          onFollow?.();
        } else {
          onUnfollow?.();
        }
      } else {
        const errorData = await res.json().catch(() => ({}));
        console.warn('Follow action failed:', errorData.error);
      }
    } catch (error) {
      console.warn('Follow API error:', error.message);
    }
  }, [isFollowing, onFollow, onUnfollow, pageProp.id]);

  const handleLike = useCallback(async () => {
    const pageId = pageProp.id;
    if (!pageId) return;
    
    const numericPageId = parseInt(pageId, 10);
    const method = isLiked ? 'DELETE' : 'POST';
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    
    try {
      const res = await fetch(`/api/pages/${numericPageId}/like`, {
        method,
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      
      if (res.ok) {
        const data = await res.json();
        setIsLiked(data.isLiked);
        setLocalLikesCount(data.likesCount);
        onLike?.();
      } else {
        const errorData = await res.json().catch(() => ({}));
        console.warn('Like action failed:', errorData.error);
      }
    } catch (error) {
      console.warn('Like API error:', error.message);
    }
  }, [isLiked, onLike, pageProp.id]);

  const handleTabChange = useCallback((tab) => {
    setActiveTab(tab);
    onTabChange?.(tab);
  }, [onTabChange]);

  const handleCreatePost = useCallback(async () => {
    if (!postText.trim() && postImages.length === 0) return;

    // Validate currentPage object
    if (!currentPage || !currentPage.id) {
      const errorMsg = 'Page invalide ou non chargée. Veuillez recharger la currentPage.';
      console.error(errorMsg);
      alert(`Erreur: ${errorMsg}`);
      return;
    }

    // Verify user is the owner of this page
    const isPageOwner = currentUser && (
      currentUser.role === 'owner' || 
      currentUser.role === 'admin' || 
      pageProp.isOwner === true ||
      (currentUser.email && pageProp.ownerEmail && currentUser.email === pageProp.ownerEmail)
    );
    if (!isPageOwner) {
      const errorMsg = 'Vous devez être le propriétaire de cette page pour créer une publication.';
      console.error(errorMsg);
      alert(`Erreur: ${errorMsg}`);
      return;
    }

    const updatedContent = `${postText.trim()}${postFeeling ? ` ${postFeeling.emoji} ${postFeeling.label}` : ''}${postLocation ? ` 📍 ${postLocation}` : ''}${eventTitle ? ` 📅 ${eventTitle}${eventDate ? ` le ${new Date(eventDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}` : ''}${eventLocation ? ` à ${eventLocation}` : ''}` : ''}`;
    let userEmail = currentUser?.email || null;
    if (!userEmail && typeof window !== 'undefined') {
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          userEmail = parsedUser?.email || null;
        }
      } catch (e) {
        // ignore malformed localStorage user object
      }
      if (!userEmail) {
        userEmail = localStorage.getItem('user_email');
      }
    }

    if (!userEmail) {
      const errorMsg = 'Vous devez être connecté pour créer une publication.';
      console.error(errorMsg);
      alert(`Erreur: ${errorMsg}`);
      return;
    }

    try {
      // Upload images if any
      let imageUrls = [];
      if (postImages.length > 0) {
        for (const image of postImages) {
          if (image.startsWith('blob:')) {
            // Convert blob URL to file and upload
            const response = await fetch(image);
            const blob = await response.blob();
            const formData = new FormData();
            formData.append('file', blob);
            formData.append('type', 'publication');
            formData.append('userEmail', userEmail);

            const uploadRes = await fetch('/api/upload', {
              method: 'POST',
              body: formData,
            });

            if (uploadRes.ok) {
              const uploadData = await uploadRes.json();
              imageUrls.push(uploadData.url || uploadData.secure_url);
            } else {
              throw new Error(`Erreur upload: ${uploadRes.status}`);
            }
          } else {
            imageUrls.push(image);
          }
        }
      }

      // Save post to server
      const postData = {
        title: updatedContent.trim(),
        content: updatedContent.trim(),
        images: imageUrls.length > 0 ? imageUrls : undefined,
        tags: postTags.length > 0 ? postTags : undefined,
        feeling: postFeeling?.label,
        location: postLocation || undefined,
        event: eventTitle ? { title: eventTitle, date: eventDate, location: eventLocation } : undefined,
        backgroundColor: postBackgroundColor || undefined,
        textColor: postTextColor || undefined,
        backgroundImage: postBackgroundImage || undefined,
      };
      console.log('[Page] postData envoyé à l\'API:', postData);
      const numericPageId = parseInt(currentPage.id, 10);
      console.log('[Page] currentPage.id:', numericPageId);

      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const res = await fetch(`/api/pages/${numericPageId}/posts?userEmail=${encodeURIComponent(userEmail)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(postData),
      });

      if (res.ok) {
        // Ajoute d'abord un post temporaire
        const tempId = 'temp-' + generateId();
        const tempPost = {
          id: tempId,
          media: null,
          image: null,
          author: {
            id: currentPage.id || 'page-1',
            name: currentPage.name || 'Page',
            avatar: currentPage.avatar || '/images/default-page.png',
            verified: currentPage.verified || false,
          },
          content: updatedContent.trim(),
          tags: postTags.length > 0 ? postTags : undefined,
          feeling: postFeeling?.label,
          location: postLocation || undefined,
          event: eventTitle ? { title: eventTitle, date: eventDate, location: eventLocation } : undefined,
          images: imageUrls.length > 0 ? imageUrls : undefined,
          backgroundColor: postBackgroundColor || null,
          textColor: postTextColor || null,
          backgroundImage: postBackgroundImage || null,
          reactions: [],
          comments: [],
          shares: 0,
          createdAt: new Date().toISOString(),
          saved: false,
          pinned: false,
          isSponsor: isSponsoredPage,
        };
        setLocalPosts((prev) => [tempPost, ...prev]);

        // Reset form
        setPostText('');
        setPostImages([]);
        setPostTags([]);
        setTagInput('');
        setShowTagInput(false);
        setPostFeeling(null);
        setShowFeelingPicker(false);
        setPostLocation('');
        setShowLocationInput(false);
        setEventTitle('');
        setEventDate('');
        setPostBackgroundColor('');
        setPostTextColor('');
        setPostBackgroundImage('');
        setShowEventForm(false);
        setShowPostComposer(false);

        // Notify parent component
        onPostCreate?.(tempPost);

        // Quand l'API répond, remplace le post temporaire par le vrai
        const createdPost = await res.json();
        console.log('[DEBUG] Réponse API création post:', createdPost);
        setLocalPosts((prev) => {
          // remplace le post temporaire par le vrai (même contenu, vrai id/images)
          return prev.map(p => p.id === tempId ? createdPost : p);
        });

        // Dispatch postCreated event for other components
        window.dispatchEvent(new CustomEvent('postCreated', { detail: createdPost }));
      } else {
        // En cas d'erreur, tente de recharger le feed
        window.dispatchEvent(new CustomEvent('reloadFeed'));
        const errorData = await res.json();
        const errorMsg = errorData?.error || `Erreur ${res.status}: Impossible de publier le post`;
        console.error('Failed to save post:', errorMsg);
        alert(`Erreur de publication: ${errorMsg}`);
      }
    } catch (error) {
      console.error('Error creating post:', error);
      alert(`Erreur lors de la publication: ${error.message}`);
    }
  }, [postText, postImages, currentPage, onPostCreate, postFeeling, postLocation, eventTitle, eventDate, eventLocation, postTags, postBackgroundColor, postTextColor, postBackgroundImage]);

  const handlePostReaction = useCallback((postId, emoji) => {
    setLocalPosts((prev) =>
      prev.map((post) => {
        if (post.id !== postId) return post;
        if (!emoji) {
          return { ...post, userReaction: null, reactions: post.reactions.filter((r) => r !== post.userReaction) };
        }
        return {
          ...post,
          userReaction: emoji,
          reactions: post.userReaction
            ? [...post.reactions.filter((r) => r !== post.userReaction), emoji]
            : [...post.reactions, emoji],
        };
      })
    );
    onPostReaction?.(postId, emoji);
  }, [onPostReaction]);

  const handleEventParticipate = useCallback(async (postId) => {
    let userEmail = currentUser?.email || null;
    if (!userEmail && typeof window !== 'undefined') {
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          userEmail = parsedUser?.email || null;
        }
      } catch (e) {}
      if (!userEmail) {
        userEmail = localStorage.getItem('user_email');
      }
    }

    if (!userEmail) {
      alert('Vous devez être connecté pour participer à un événement.');
      return;
    }

    const post = localPosts.find(p => p.id === postId);
    if (!post) return;

    const eventData = post.event;
    if (!eventData) return;

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const pageId = pageProp.id;
      if (!pageId) {
        console.warn('No page ID for event participation');
        return;
      }

      const numericPageId = parseInt(pageId, 10);
      const res = await fetch(`/api/pages/${numericPageId}/events/participate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          postId,
          userEmail,
          eventTitle: eventData.title,
          eventDate: eventData.date,
          eventLocation: eventData.location
        })
      });

      if (res.ok) {
        const data = await res.json();
        setLocalPosts(prev => prev.map(p => {
          if (p.id !== postId) return p;
          return {
            ...p,
            userParticipating: data.isParticipating,
            participantsCount: data.participantsCount
          };
        }));
        onEventParticipate?.(postId, data.isParticipating);
      } else {
        const errorData = await res.json().catch(() => ({}));
        console.warn('Event participation failed:', errorData.error);
        alert(`Erreur: ${errorData.error || 'Impossible de participer à l\'événement'}`);
      }
    } catch (error) {
      console.error('Event participation error:', error);
      alert('Erreur lors de la participation à l\'événement');
    }
  }, [currentUser, localPosts, pageProp.id, onEventParticipate]);

  const handlePostComment = useCallback((postId, text) => {
    const newComment = {
      id: generateId(),
      author: currentUser || {
        id: 'me',
        name: 'Vous',
        avatar: '/images/default-page.png',
      },
      text,
      likes: 0,
      liked: false,
      replies: [],
      createdAt: new Date().toISOString(),
    };
    setLocalPosts((prev) =>
      prev.map((post) => {
        if (post.id !== postId) return post;
        return { ...post, comments: [...(post.comments || []), newComment] };
      })
    );
    onPostComment?.(postId, newComment);
  }, [currentUser, onPostComment]);

  const handleCommentLike = useCallback((postId, commentId) => {
    setLocalPosts((prev) =>
      prev.map((post) => {
        if (post.id !== postId) return post;
        return {
          ...post,
          comments: post.comments.map((c) =>
            c.id === commentId
              ? { ...c, liked: !c.liked, likes: c.liked ? c.likes - 1 : c.likes + 1 }
              : c
          ),
        };
      })
    );
    onCommentLike?.(postId, commentId);
  }, [onCommentLike]);

  const handleCommentReply = useCallback((postId, commentId, text) => {
    const newReply = {
      id: generateId(),
      author: currentUser || {
        id: 'me',
        name: 'Vous',
        avatar: '/images/default-page.png',
      },
      text,
      likes: 0,
      liked: false,
      createdAt: new Date().toISOString(),
    };
    setLocalPosts((prev) =>
      prev.map((post) => {
        if (post.id !== postId) return post;
        return {
          ...post,
          comments: post.comments.map((c) =>
            c.id === commentId
              ? { ...c, replies: [...(c.replies || []), newReply] }
              : c
          ),
        };
      })
    );
    onCommentReply?.(postId, commentId, newReply);
  }, [currentUser, onCommentReply]);

  const handleToggleSave = useCallback((postId) => {
    setLocalPosts((prev) =>
      prev.map((post) =>
        post.id === postId ? { ...post, saved: !post.saved } : post
      )
    );
    onPostSave?.(postId);
  }, [onPostSave]);

  const handleDeletePost = useCallback(async (postId) => {
    // Si le post a un ID temporaire (créé localement), on le supprime juste de l'état local
    if (String(postId).startsWith('temp-')) {
      setLocalPosts((prev) => prev.filter((p) => p.id !== postId));
      onPostDelete?.(postId);
      return;
    }
    
    // Appelle l'API pour supprimer le post côté serveur
    try {
      const pageId = pageProp.id;
      if (!pageId) throw new Error('Page ID manquant');
      const numericPageId = parseInt(pageId, 10);
      const res = await fetch(`/api/pages/${numericPageId}/posts/${postId}`, { method: 'DELETE' });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const errorMsg = errorData?.error || `Erreur ${res.status}: Impossible de supprimer le post`;
        alert(errorMsg);
        return;
      }
      setLocalPosts((prev) => prev.filter((p) => p.id !== postId));
      onPostDelete?.(postId);
    } catch (e) {
      alert('Erreur lors de la suppression du post: ' + (e.message || e));
    }
  }, [onPostDelete, pageProp.id]);

  const handleAddTag = useCallback(() => {
    const trimmedTag = tagInput.trim();
    if (!trimmedTag) return;
    if (!postTags.includes(trimmedTag)) {
      setPostTags((prev) => [...prev, trimmedTag]);
    }
    setTagInput('');
    setShowTagInput(false);
  }, [postTags, tagInput]);

  const handleRemoveTag = useCallback((index) => {
    setPostTags((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleSelectFeeling = useCallback((feeling) => {
    setPostFeeling(feeling);
    setShowFeelingPicker(false);
  }, []);

  const handleClearFeeling = useCallback(() => {
    setPostFeeling(null);
  }, []);

  const handleSaveLocation = useCallback(() => {
    if (!postLocation.trim()) return;
    setShowLocationInput(false);
  }, [postLocation]);

  const handleClearLocation = useCallback(() => {
    setPostLocation('');
    setShowLocationInput(false);
  }, []);

  const handleSaveEvent = useCallback(() => {
    if (!eventTitle.trim()) return;
    setShowEventForm(false);
  }, [eventTitle]);

  const handleClearEvent = useCallback(() => {
    setEventTitle('');
    setEventDate('');
    setEventLocation('');
    setShowEventForm(false);
  }, []);

  const handleImageUpload = useCallback((e) => {
    const files = Array.from(e.target.files || []);
    const newImages = files.map((f) => URL.createObjectURL(f));
    setPostImages((prev) => [...prev, ...newImages]);
  }, []);

  const removeImage = useCallback((index) => {
    setPostImages((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleReviewSubmit = useCallback(async () => {
    if (!reviewRating) return;
    
    const pageId = currentPage?.id;
    if (!pageId) {
      console.warn('No page ID for review submit');
      return;
    }
    
    let userEmail = currentUser?.email || null;
    if (!userEmail && typeof window !== 'undefined') {
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          userEmail = parsedUser?.email || null;
        }
      } catch (e) {}
      if (!userEmail) {
        userEmail = localStorage.getItem('user_email');
      }
    }
    
    if (!userEmail) {
      alert('Vous devez être connecté pour laisser un avis.');
      return;
    }
    
    const numericPageId = parseInt(pageId, 10);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const res = await fetch(`/api/pages/${numericPageId}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          rating: reviewRating,
          text: reviewText.trim(),
          recommends: reviewRecommends,
          userEmail
        })
      });
      
      if (res.ok) {
        const createdReview = await res.json();
        setPageReviews(prev => [createdReview, ...prev]);
      } else {
        const errorData = await res.json().catch(() => ({}));
        console.warn('Failed to submit review:', errorData.error);
        alert(`Erreur: ${errorData.error || 'Impossible de soumettre l\'avis'}`);
      }
    } catch (e) {
      console.error('Review submit error:', e);
      alert('Erreur lors de la soumission de l\'avis');
    }
    
    setReviewRating(0);
    setReviewText('');
    setReviewRecommends(true);
    setShowReviewForm(false);
  }, [reviewRating, reviewText, reviewRecommends, currentUser, currentPage]);

  const handleReviewHelpful = useCallback(async (reviewId) => {
    const pageId = currentPage?.id;
    console.log('[Review] handleReviewHelpful called', { pageId, reviewId, currentPageId: currentPage?.id });
    if (!pageId || !reviewId) return;
    
    let userEmail = currentUser?.email || null;
    if (!userEmail && typeof window !== 'undefined') {
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          userEmail = parsedUser?.email || null;
        }
      } catch (e) {}
      if (!userEmail) {
        userEmail = localStorage.getItem('user_email');
      }
    }
    console.log('[Review] userEmail:', userEmail);
    
    if (!userEmail) {
      alert('Vous devez être connecté pour voter.');
      return;
    }
    
    const numericPageId = parseInt(pageId, 10);
    const numericReviewId = parseInt(reviewId, 10);
    console.log('[Review] API call:', `/api/pages/${numericPageId}/reviews/${numericReviewId}`);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const res = await fetch(`/api/pages/${numericPageId}/reviews/${numericReviewId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ action: 'helpful', userEmail })
      });
      console.log('[Review] Response:', res.status, await res.text().catch(() => ''));
      
      if (res.ok) {
        const data = await res.json();
        setReviewHelpfulCounts(prev => ({ ...prev, [reviewId]: data.helpfulCount }));
        setReviewUserVoted(prev => ({ ...prev, [reviewId]: !prev[reviewId] }));
      }
    } catch (e) {
      console.error('Error toggling helpful:', e);
    }
  }, [currentUser, currentPage]);

  const handleReviewReply = useCallback(async (reviewId, text) => {
    console.log('[Review] handleReviewReply called', { reviewId, text });
    const pageId = currentPage?.id;
    if (!pageId || !reviewId || !text.trim()) return;
    
    let userEmail = currentUser?.email || null;
    if (!userEmail && typeof window !== 'undefined') {
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          userEmail = parsedUser?.email || null;
        }
      } catch (e) {}
      if (!userEmail) {
        userEmail = localStorage.getItem('user_email');
      }
    }
    
    if (!userEmail) {
      alert('Vous devez être connecté pour répondre.');
      return;
    }
    
    const numericPageId = parseInt(pageId, 10);
    const numericReviewId = parseInt(reviewId, 10);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const res = await fetch(`/api/pages/${numericPageId}/reviews/${numericReviewId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ action: 'reply', text: text.trim(), userEmail })
      });
      console.log('[Review] Reply response:', res.status);
      
      if (res.ok) {
        const reply = await res.json();
        setReviewReplies(prev => {
          const existing = prev[reviewId] || [];
          return { ...prev, [reviewId]: [...existing, reply] };
        });
      }
    } catch (e) {
      console.error('Error submitting reply:', e);
    }
  }, [currentUser, currentPage]);

  const handleShare = useCallback((postId) => {
    setSharedPostId(postId);
    setShowShareModal(true);
  });

  const handleCopyLink = useCallback(() => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
    }
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  }, []);

  const handleOwnerAction = useCallback((action) => {
    setShowOwnerMenu(false);
    setOwnerAction(action);
    if (action === 'edit') {
      setPageDraft({
        name: currentPage.name || '',
        category: currentPage.category || '',
        description: currentPage.description || '',
        subcategory: currentPage.subcategory || '',
        address: currentPage.address || '',
        phone: currentPage.phone || '',
        website: currentPage.website || '',
        contactEmail: currentPage.contactEmail || '',
      });
    }
    if (action === 'settings') {
      setPageSettings({
        isPublic: currentPage.isPublic !== undefined ? currentPage.isPublic : true,
        notificationsEnabled: currentPage.notificationsEnabled !== undefined ? currentPage.notificationsEnabled : true,
        publishEnabled: currentPage.isPublished !== undefined ? currentPage.isPublished : true,
      });
    }
  }, [currentPage.name, currentPage.category, currentPage.description, currentPage.isPublic, currentPage.isPublished, currentPage.notificationsEnabled, currentPage.subcategory, currentPage.address, currentPage.phone, currentPage.website, currentPage.contactEmail]);

  const handleOwnerModalClose = useCallback(() => setOwnerAction(null), []);

  const handlePageDraftChange = useCallback((field, value) => {
    setPageDraft((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleSettingsToggle = useCallback((field) => {
    setPageSettings((prev) => ({ ...prev, [field]: !prev[field] }));
  }, []);

  const handleSavePageDraft = useCallback(async () => {
    const pageData = {
      ...currentPage,
      ...currentPageDraft,
      subcategory: currentPage.subcategory || currentPageDraft.subcategory || '',
      address: currentPage.address || currentPageDraft.address || '',
      phone: currentPage.phone || currentPageDraft.phone || '',
      website: currentPage.website || currentPageDraft.website || '',
      contactEmail: currentPage.contactEmail || currentPageDraft.contactEmail || '',
      isPublic: currentPageSettings.isPublic,
      isPublished: currentPageSettings.publishEnabled,
      notificationsEnabled: currentPageSettings.notificationsEnabled,
    };

    try {
      const userEmail = currentUser?.email || '';
      const url = `/api/pages/${currentPage.id}?userEmail=${encodeURIComponent(userEmail)}`;
      const bodyWithEmail = { ...pageData, userEmail };
      console.log('[Page] Saving page - URL:', url);
      console.log('[Page] Saving page - body:', JSON.stringify(bodyWithEmail));
      const res = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyWithEmail)
      });
      console.log('[Page] Save response status:', res.status);
      if (res.ok) {
        const data = await res.json();
        console.log('[Page] Save response data:', data);
        if (data.page) {
          setLocalPage(data.page);
          setToast({ message: 'Modifications enregistrées avec succès', type: 'success' });
        }
      } else {
        const errorData = await res.json();
        console.error('[Page] Save error response:', errorData);
        setToast({ message: errorData.error || 'Erreur lors de la sauvegarde', type: 'error' });
      }
    } catch (e) {
      setToast({ message: 'Erreur lors de la sauvegarde', type: 'error' });
      console.error('[Page] Failed to save page:', e);
    }
    setTimeout(() => setToast(null), 3000);
    setOwnerAction(null);
  }, [currentPageDraft, currentPageSettings, currentPage, currentUser]);

  // Fonction utilitaire pour re-fetch la page après modification
  const fetchPageData = async (id) => {
    try {
      const res = await fetch(`/api/pages/${id || currentPage.id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.page) setLocalPage(data.page);
      }
    } catch (e) {
      console.error('Failed to fetch page data:', e);
    }
  };

  const isOwner = currentUser && (
    currentUser.email && currentPage.ownerEmail && currentUser.email === currentPage.ownerEmail
  );
  const router = useRouter();


  // Synchroniser le draft et les settings quand l'ID de currentPage change
  useEffect(() => {
    setPageDraft({
      name: currentPage.name || '',
      category: currentPage.category || '',
      description: currentPage.description || '',
      subcategory: currentPage.subcategory || '',
      address: currentPage.address || '',
      phone: currentPage.phone || '',
      website: currentPage.website || '',
      contactEmail: currentPage.contactEmail || '',
    });
    setPageSettings({
      isPublic: currentPage.isPublic !== undefined ? currentPage.isPublic : true,
      notificationsEnabled: currentPage.notificationsEnabled !== undefined ? currentPage.notificationsEnabled : true,
      publishEnabled: currentPage.isPublished !== undefined ? currentPage.isPublished : true,
    });
  }, [currentPage.id, currentPage]); // Sync when currentPage ID changes or currentPage object changes

  // Sync localPage when page prop changes (but not when we have localPage from URL)
  useEffect(() => {
    if (pageProp?.id) {
      setLocalPage(pageProp);
    }
  }, [pageProp]);

  // Fetch page data from URL query param
  useEffect(() => {
    if (!router.isReady) return;
    
    const pageIdFromUrl = router.query.id;
    if (!pageIdFromUrl) return;
    
    // If we already have the same page loaded, skip
    if (currentPage.id && String(currentPage.id) === pageIdFromUrl) return;
    
    const fetchPageData = async () => {
      try {
        const numericPageId = parseInt(pageIdFromUrl, 10);
        if (isNaN(numericPageId)) {
          console.warn('Invalid page ID from URL:', pageIdFromUrl);
          return;
        }
        const res = await fetch(`/api/pages/${numericPageId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.page) {
            setLocalPage(data.page);
          }
        }
      } catch (e) {
        console.error('Failed to fetch page data:', e);
      }
    };
    
    fetchPageData();
  }, [router.isReady, router.query.id]);

  const resetSponsorForm = useCallback(() => {
    setSponsorFormData({
      title: '',
      description: '',
      destinationUrl: '',
      imageUrl: '',
      ownerName: '',
      ownerGradientColor: '#667eea',
      ownerAvatarUrl: '',
      ownerAvatarFile: null,
      ownerAvatarPreview: null,
    });
    setSponsorError('');
  }, []);

  const handleOpenSponsorModal = useCallback(() => {
    setShowOwnerMenu(false);
    resetSponsorForm();
    setShowSponsorModal(true);
  }, [resetSponsorForm]);

  const handleSponsorPayment = useCallback(async () => {
    setSponsorError('');
    setSponsorLoading(true);

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) {
        setSponsorError('Vous devez être connecté pour activer la sponsorisation.');
        setSponsorLoading(false);
        return;
      }

      const res = await fetch('/api/payments/create-sponsor-session', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'x-user-email': currentUser?.email || ''
        },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Échec de la création de la session sponsor');
      }
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('URL de paiement introuvable');
      }
    } catch (error) {
      setSponsorError(error.message || 'Impossible de démarrer la sponsorisation.');
      setSponsorLoading(false);
    }
  }, []);

  const handleSponsorFormChange = useCallback((field, value) => {
    setSponsorFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleSponsorAvatarUpload = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSponsorFormData((prev) => ({
      ...prev,
      ownerAvatarFile: file,
      ownerAvatarPreview: URL.createObjectURL(file),
      ownerAvatarUrl: '',
    }));
  }, []);

  const handleSponsorAvatarUrlChange = useCallback((value) => {
    setSponsorFormData((prev) => ({
      ...prev,
      ownerAvatarUrl: value,
      ownerAvatarPreview: null,
    }));
  }, []);

  const handleAvatarChange = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarPreviewUrl(URL.createObjectURL(file));
    setUploadModal('avatar');
  }, []);

  const handleCoverChange = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverPreviewUrl(URL.createObjectURL(file));
    setUploadModal('cover');
  }, []);

  const handleAvatarClick = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = handleAvatarChange;
    input.click();
  }, [handleAvatarChange]);

  const handleCoverClick = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = handleCoverChange;
    input.click();
  }, [handleCoverChange]);

  const handleUploadImage = useCallback(async () => {
    if (!uploadModal) return;
    
    try {
      const formData = new FormData();
      const imageUrl = uploadModal === 'avatar' ? avatarPreviewUrl : coverPreviewUrl;
      
      if (!imageUrl) return;
      
      // Convert data URL to blob
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      
      formData.append(uploadModal === 'avatar' ? 'profileImage' : 'coverImage', blob, `${uploadModal}.jpg`);
      
      const numericPageId = parseInt(currentPage.id, 10);
      const apiResponse = await fetch(`/api/pages/${numericPageId}`, {
        method: 'PATCH',
        headers: {
          'x-user-email': currentUser?.email || ''
        },
        body: formData
      });
      
      if (!apiResponse.ok) {
        throw new Error('Erreur lors de l\'upload de l\'image');
      }
      
      const updatedPage = await apiResponse.json();
      
      // Update local currentPage data
      if (onPageUpdate) {
        onPageUpdate(updatedPage);
      }
      
      // Close modal and reset
      setUploadModal(null);
      setAvatarPreviewUrl(null);
      setCoverPreviewUrl(null);
      
    } catch (error) {
      console.error('Upload error:', error);
      // TODO: Show error message to user
    }
  }, [uploadModal, avatarPreviewUrl, coverPreviewUrl, currentPage.id, currentUser?.email, onPageUpdate]);

  /* --- Render --- */
  if (loading) {
    return <PageSkeleton />;
  }

  return (
    <div className={`up-container ${className}`}>
      {/* ====== PAGE COVER ====== */}
      <div className="up-cover">
        <div
          className="up-cover-image"
          style={{
            backgroundImage: `url(${currentPage.coverImage || 'https://picsum.photos/seed/page-cover/1200/350'})`,
          }}
        >
          <div className="up-cover-gradient" />
        </div>

        <div className="up-cover-actions">
          {isOwner && (
            <button
              className="up-cover-edit-btn"
              onClick={handleCoverClick}
            >
              <Icons.Camera />
              <span>Modifier la couverture</span>
            </button>
          )}
        </div>
      </div>

      {/* ====== PAGE INFO BAR ====== */}
      <div className="up-info-bar">
        <div className="up-info-left">
          <div className="up-page-avatar-wrap">
            <div
              className="up-page-avatar"
              style={{
                backgroundImage: `url(${currentPage.avatar || 'https://picsum.photos/seed/page-avatar/120/120'})`,
              }}
            />
            {isOwner && (
              <button className="up-avatar-edit-btn" onClick={handleAvatarClick}>
                <Icons.Camera />
              </button>
            )}
          </div>
          <div className="up-currentPage-details">
            <div className="up-page-name-row">
              <h1 className="up-page-name">{currentPage.name || 'Ma Page'}</h1>
              {currentPage.verified && (
                <span className="up-verified-badge up-verified-lg">
                  <Icons.Check />
                </span>
              )}
            </div>
            <div className="up-currentPage-category">
              <span className="up-category-badge">{currentPage.category || 'Entreprise'}</span>
              {currentPage.subcategory && (
                <>
                  <span className="up-meta-sep">·</span>
                  <span className="up-subcategory">{currentPage.subcategory}</span>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="up-info-right">
          <div className="up-info-actions">
            {isOwner ? (
              <>
                <div className="up-dashboard-actions">
                  {isMobile ? (
                    <div style={{display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', width: '100%'}}>
                      <button className="up-dashboard-btn-compact" onClick={() => router.push(`/dashboard/page-admin/${currentPage.id}`)}>
                        <Icons.User /> <span>Tableau de bord</span>
                      </button>
                      <button className="up-dashboard-btn-compact" onClick={handleOpenSponsorModal}>
                        <Icons.Megaphone /> <span>Promouvoir</span>
                      </button>
                      <button className="up-dashboard-btn-compact" onClick={() => setShowInviteModal(true)}>
                        <Icons.UserPlus /> <span>Inviter</span>
                      </button>
                      <button
                        className="up-dashboard-btn-round"
                        onClick={() => setShowOwnerMenu(!showOwnerMenu)}
                      >
                        <Icons.MoreHorizontal />
                      </button>
                      {showOwnerMenu && (
                        <>
                          <div className="up-overlay" onClick={() => setShowOwnerMenu(false)} />
                          <div className="up-dropdown-menu up-dropdown-top">
                            <button onClick={() => { setShowOwnerMenu(false); handleOwnerAction('edit'); }}>
                              <Icons.Edit /> Modifier la page
                            </button>
                            <button onClick={() => { setShowOwnerMenu(false); handleOwnerAction('settings'); }}>
                              <Icons.Settings /> Paramètres
                            </button>
                            <button onClick={() => { setShowOwnerMenu(false); handleOwnerAction('info'); }}>
                              <Icons.Info /> Informations sur la page
                            </button>
                            <button onClick={() => { setShowOwnerMenu(false); handleOwnerAction('transparency'); }}>
                              <Icons.Shield /> Transparence de la page
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                    ) : (
                    <>
                      <button className="up-dashboard-btn-compact" onClick={() => router.push(`/dashboard/page-admin/${currentPage.id}`)}>
                        <Icons.User /> <span>Tableau de bord</span>
                      </button>
                      <button className="up-dashboard-btn-compact" onClick={() => setShowInviteModal(true)}>
                        <Icons.UserPlus /> <span>Inviter</span>
                      </button>
                      <button className="up-dashboard-btn-compact" onClick={handleOpenSponsorModal}>
                        <Icons.Megaphone /> <span>Promouvoir</span>
                      </button>
                      <button
                        className="up-dashboard-btn-round"
                        onClick={() => setShowOwnerMenu(!showOwnerMenu)}
                      >
                        <Icons.MoreHorizontal />
                      </button>
                      {showOwnerMenu && (
                        <>
                          <div className="up-overlay" onClick={() => setShowOwnerMenu(false)} />
                          <div className="up-dropdown-menu up-dropdown-top">
                            <button onClick={() => handleOwnerAction('edit')}>
                              <Icons.Edit /> Modifier la page
                            </button>
                            <button onClick={() => handleOwnerAction('settings')}>
                              <Icons.Settings /> Paramètres
                            </button>
                            <button onClick={handleOpenSponsorModal}>
                              <Icons.Megaphone /> Créer une publicité
                            </button>
                            <button onClick={() => handleOwnerAction('info')}>
                              <Icons.Info /> Informations sur la page
                            </button>
                            <button onClick={() => handleOwnerAction('transparency')}>
                              <Icons.Shield /> Transparence de la page
                            </button>
                          </div>
                        </>
                      )}
                    </>
                  )}
                </div>
              </>
            ) : (
              <>
                {isMobile ? (
                  <div className="up-owner-menu-mobile" style={{display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center'}}>
                    <button
                      className={`up-dashboard-btn-compact ${isFollowing ? '' : ''}`}
                      onClick={handleFollow}
                    >
                      {isFollowing ? (
                        <>
                          <Icons.Check /> <span>Suivi</span>
                        </>
                      ) : (
                        <>
                          <Icons.UserPlus /> <span>Suivre</span>
                        </>
                      )}
                    </button>
                    <button
                      className={`up-dashboard-btn-compact ${isLiked ? 'up-liked' : ''}`}
                      onClick={handleLike}
                    >
                      <Icons.ThumbsUp /> <span>J&apos;aime</span>
                    </button>
                    <button className="up-dashboard-btn-compact" onClick={() => setShowInviteModal(true)}>
                      <Icons.UserPlus /> <span>Inviter</span>
                    </button>
                    <button className="up-dashboard-btn-compact" onClick={onMessage}>
                      <Icons.MessageCircle /> <span>Message</span>
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      className={`up-dashboard-btn-compact ${isFollowing ? '' : ''}`}
                      onClick={handleFollow}
                    >
                      {isFollowing ? (
                        <>
                          <Icons.Check /> <span>Suivi</span>
                        </>
                      ) : (
                        <>
                          <Icons.UserPlus /> <span>Suivre</span>
                        </>
                      )}
                    </button>
                    <button
                      className={`up-dashboard-btn-compact ${isLiked ? 'up-liked' : ''}`}
                      onClick={handleLike}
                    >
                      <Icons.ThumbsUp /> <span>J&apos;aime</span>
                    </button>
                    <button className="up-dashboard-btn-compact" onClick={onMessage}>
                      <Icons.MessageCircle /> <span>Message</span>
                    </button>
                    <button className="up-dashboard-btn-compact" onClick={() => setShowInviteModal(true)}>
                      <Icons.UserPlus /> <span>Inviter</span>
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ====== STATS BAR ====== */}
      <div className="up-stats-bar">
        <div className="up-stat-item">
          <span className="up-stat-number">{formatNumber(localLikesCount)}</span>
          <span className="up-stat-label">J&apos;aime</span>
        </div>
        <div className="up-stat-item">
          <span className="up-stat-number">{formatNumber(localFollowersCount)}</span>
          <span className="up-stat-label">Abonnés</span>
        </div>
        <div className="up-stat-item">
          <span className="up-stat-number">{formatNumber(localCheckInsCount)}</span>
          <span className="up-stat-label">Visites</span>
        </div>
        <div className="up-stat-item">
          <span className="up-stat-number">{pageReviews.length}</span>
          <span className="up-stat-label">Avis</span>
        </div>
      </div>

      {/* ====== TABS NAVIGATION ====== */}
      <nav className="up-tabs">
        <div className="up-tabs-inner">
          {enabledTabs.map((tab) => {
            const TabIcon = Icons[tab.icon] || Icons.Info;
            return (
              <button
                key={tab.id}
                className={`up-tab ${activeTab === tab.id ? 'is-active' : ''}`}
                onClick={() => handleTabChange(tab.id)}
              >
                <span className="up-tab-icon"><TabIcon /></span>
                <span className="up-tab-label">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* ====== MAIN CONTENT ====== */}
      <div className="up-main">
        <div className="up-content">
          {/* ---- PUBLICATIONS TAB ---- */}
          {activeTab === 'publications' && (

            <div className="up-publications">
              {/* Post Composer (Feed logic) */}

              {isOwner && (
                <>
                  <CreatePost
                    user={currentUser}
                    sponsorTitle={currentPage.name}
                    sponsorAvatar={currentPage.avatar || '/images/default-page.png'}
                  />
                  <CreatePostModal
                    currentUser={currentUser}
                    sponsorId={currentPage.id}
                    sponsorTitle={currentPage.name}
                    sponsorAvatar={currentPage.avatar || '/images/default-page.png'}
                  />
                  <TextPostCreator
                    currentUser={currentUser}
                    sponsorId={currentPage.id}
                    sponsorTitle={currentPage.name}
                    sponsorAvatar={currentPage.avatar || '/images/default-page.png'}
                  />
                </>
              )}

              {/* Search & Sort */}
              <div className="up-search-bar">
                <div className="up-search-input">
                  <Icons.Search />
                  <input
                    type="text"
                    placeholder="Rechercher des publications..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button className="up-search-clear" onClick={() => setSearchQuery('')}>
                      <Icons.X />
                    </button>
                  )}
                </div>
                <div className="up-search-actions">
                  <button
                    className="up-sort-btn"
                    onClick={() => setSortBy(sortBy === 'recent' ? 'top' : 'recent')}
                  >
                    <Icons.Sort />
                    <span>{sortBy === 'recent' ? 'Plus récent' : 'Plus populaires'}</span>
                    <Icons.ChevronDown />
                  </button>
                </div>
              </div>

              {/* Posts Feed */}
              <div className="up-feed">
                {console.log('[Page] Rendering, filteredPosts length:', filteredPosts.length) || null}
                {filteredPosts.length === 0 ? (
                  <div className="up-no-posts">
                    <div className="up-no-posts-icon">
                      <Icons.FileText />
                    </div>
                    <h4>Aucune publication</h4>
                    <p>Cette Page n'a pas encore de publications.</p>
                  </div>
                ) : (
                  filteredPosts.map((post) => {
                    // Check if post has event data - display special event card instead of PostCard
                    const eventData = typeof post.event === 'string' 
                      ? (() => { try { return JSON.parse(post.event); } catch { return null; } })() 
                      : post.event;
                    
                    if (eventData && (eventData.title || eventData.date)) {
                      // Render special Event Card
                      const eventDateObj = eventData.date ? new Date(eventData.date) : null;
                      const isValidDate = eventDateObj && !isNaN(eventDateObj.getTime());
                      return (
                        <div key={post.id} className="up-feed-event-card">
                          {eventData.coverImage && (
                            <img src={eventData.coverImage} alt={eventData.title} className="up-event-cover" />
                          )}
                          <div className="up-event-content">
                            <div className="up-event-date-badge">
                              <Icons.Calendar />
                              {isValidDate && (
                                <span>
                                  {eventDateObj.toLocaleDateString('fr-FR', {
                                    weekday: 'short',
                                    day: 'numeric',
                                    month: 'short'
                                  })} à {eventDateObj.toLocaleTimeString('fr-FR', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              )}
                            </div>
                            <h4 className="up-event-title">{eventData.title}</h4>
                            {eventData.location && (
                              <p className="up-event-location">
                                <Icons.MapPin /> {eventData.location}
                              </p>
                            )}
                            {eventData.description && (
                              <p className="up-event-description">{eventData.description}</p>
                            )}
                            {post.participantsCount !== undefined && (
                              <p className="up-event-participants">{post.participantsCount} participant(s)</p>
                            )}
                            <button 
                              className={`up-event-cta ${post.userParticipating ? 'is-participating' : ''}`}
                              onClick={() => handleEventParticipate(post.id)}
                            >
                              {post.userParticipating ? 'Participe' : 'Participer'}
                            </button>
                          </div>
                        </div>
                      );
                    }

                    // Use only the images array, not a separate image property
                    // Preserve video/media for video posts, nullify only image media
                    const hasVideo = post.video || (post.media && post.media.type === 'video');
                    const postForCard = {
                      ...post,
                      media: hasVideo ? post.media : null,
                      image: null,
                      video: post.video || null,
                      author: (typeof post.author === 'object' && post.author !== null && typeof post.author.name === 'string')
                        ? post.author
                        : { name: String(post.author || ''), avatar: post.avatar || '/images/default-page.png', verified: post.verified || false },
                      avatar: post.author?.avatar || post.avatar || '/images/default-page.png',
                      verified: post.author?.verified || false,
                      pageName: currentPage.name,
                      pageAvatar: currentPage.avatar || '/images/default-page.png',
                    };
                    // Remove separate image property to avoid duplication
                    delete postForCard.image;
                    return (
                      <PagePostCard
                        key={post.id}
                        post={postForCard}
                        currentUser={currentUser}
                        onDelete={handleDeletePost}
                        page={{
                          id: currentPage.id,
                          name: currentPage.name,
                          profileImage: currentPage.avatar || '/images/default-page.png',
                          ownerEmail: currentPage.ownerEmail
                        }}
                      />
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* ---- ABOUT TAB ---- */}
          {activeTab === 'about' && (
            <div className="up-about-section">
              <div className="up-about-card">
                <h3 className="up-section-title">Description</h3>
                <p className="up-about-description">{currentPage.description || 'Aucune description disponible.'}</p>
              </div>

              <div className="up-about-card">
                <h3 className="up-section-title">Informations générales</h3>
                <div className="up-info-list">
                  <div className="up-info-item">
                    <Icons.Globe />
                    <span className="up-info-label">Catégorie</span>
                    <span className="up-info-value">{currentPage.category || 'Non spécifié'}</span>
                  </div>
                  {currentPage.subcategory && (
                    <div className="up-info-item">
                      <Icons.Tag />
                      <span className="up-info-label">Sous-catégorie</span>
                      <span className="up-info-value">{currentPage.subcategory}</span>
                    </div>
                  )}
                  {currentPage.phone && (
                    <div className="up-info-item">
                      <Icons.Phone />
                      <span className="up-info-label">Téléphone</span>
                      <span className="up-info-value">{currentPage.phone}</span>
                    </div>
                  )}
                  {(currentPage.contactEmail || currentPage.email) && (
                    <div className="up-info-item">
                      <Icons.Mail />
                      <span className="up-info-label">Email</span>
                      <span className="up-info-value">{currentPage.contactEmail || currentPage.email}</span>
                    </div>
                  )}
                  {currentPage.website && (
                    <div className="up-info-item">
                      <Icons.Link />
                      <span className="up-info-label">Site web</span>
                      <a href={currentPage.website} className="up-info-link" target="_blank" rel="noopener noreferrer">
                        {currentPage.website} <Icons.ExternalLink />
                      </a>
                    </div>
                  )}
                  {currentPage.address && (
                    <div className="up-info-item">
                      <Icons.MapPin />
                      <span className="up-info-label">Adresse</span>
                      <span className="up-info-value">{currentPage.address}</span>
                    </div>
                  )}
                  {currentPage.createdAt && (
                    <div className="up-info-item">
                      <Icons.Calendar />
                      <span className="up-info-label">Créée le</span>
                      <span className="up-info-value">
                        {new Date(currentPage.createdAt).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {socialLinks && Object.keys(socialLinks).length > 0 && (
                <div className="up-about-card">
                  <h3 className="up-section-title">Liens sociaux</h3>
                  <div className="up-social-links">
                    {socialLinks.facebook && (
                      <a href={socialLinks.facebook} className="up-social-link" target="_blank" rel="noopener noreferrer">
                        <span className="up-social-icon">f</span> Facebook
                      </a>
                    )}
                    {socialLinks.twitter && (
                      <a href={socialLinks.twitter} className="up-social-link" target="_blank" rel="noopener noreferrer">
                        <span className="up-social-icon">𝕏</span> Twitter
                      </a>
                    )}
                    {socialLinks.instagram && (
                      <a href={socialLinks.instagram} className="up-social-link" target="_blank" rel="noopener noreferrer">
                        <span className="up-social-icon">📷</span> Instagram
                      </a>
                    )}
                    {socialLinks.linkedin && (
                      <a href={socialLinks.linkedin} className="up-social-link" target="_blank" rel="noopener noreferrer">
                        <span className="up-social-icon">in</span> LinkedIn
                      </a>
                    )}
                  </div>
                </div>
              )}

              {businessHours && (
                <div className="up-about-card">
                  <BusinessHours hours={businessHours} />
                </div>
              )}
            </div>
          )}

          {/* ---- PHOTOS TAB ---- */}
          {activeTab === 'photos' && (
            <div className="up-photos-section">
              <div className="up-section-header">
                <h3 className="up-section-title">Photos de la page</h3>
                <span className="up-section-count">{pagePhotos.length} photos</span>
              </div>
              <PhotoGrid photos={pagePhotos} onPhotoClick={(idx) => {
                setSelectedPhotoIndex(idx);
                setPhotoViewerOpen(true);
              }} />
            </div>
          )}

          {/* ---- VIDEOS TAB ---- */}
          {activeTab === 'videos' && (
            <div className="up-videos-section">
              <div className="up-section-header">
                <h3 className="up-section-title">Vidéos</h3>
                <span className="up-section-count">{pageVideos.length} vidéos</span>
              </div>
              <div className="up-video-list">
                {pageVideos.map((video, idx) => (
                  <VideoItem 
                    key={video.id || idx} 
                    video={video} 
                    onClick={(v) => {
                      const index = pageVideos.findIndex(x => (x.id || idx) === (v.id || idx));
                      setSelectedVideoIndex(index >= 0 ? index : idx);
                      setVideoViewerOpen(true);
                    }} 
                  />
                ))}
              </div>
            </div>
          )}

          {/* ---- EVENTS TAB ---- */}
          {activeTab === 'events' && (
            <div className="up-events-section">
              <div className="up-section-header">
                <h3 className="up-section-title">Événements à venir</h3>
                <span className="up-section-count">{pageEvents.length} événements</span>
              </div>
              {pageEvents.length === 0 ? (
                <div className="up-empty-section">
                  <div className="up-empty-icon"><Icons.Calendar /></div>
                  <h4>Aucun événement</h4>
                  <p>Crééz un post avec un événement pour en afficher un ici.</p>
                </div>
              ) : (
                <div className="up-events-list">
                  {pageEvents.filter(e => e.date).map((event, idx) => (
                    <EventItem key={event.id || idx} event={event} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ---- REVIEWS TAB ---- */}
          {activeTab === 'reviews' && (
            <div className="up-reviews-section">
              {/* Overall Rating */}
              <div className="up-rating-overview">
                <div className="up-rating-score">
                  <span className="up-rating-number">{avgRating}</span>
                  <div className="up-rating-stars">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span
                        key={star}
                        className={`up-star ${star <= Math.round(avgRating) ? 'up-star-filled' : 'up-star-empty'}`}
                      >
                        {star <= Math.round(avgRating) ? <Icons.Star /> : <Icons.StarEmpty />}
                      </span>
                    ))}
                  </div>
                  <span className="up-rating-total">{pageReviews.length} avis</span>
                </div>
                <div className="up-rating-distribution">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const count = ratingDistribution[star] || 0;
                    const percentage = pageReviews.length > 0 ? Math.round((count / pageReviews.length) * 100) : 0;
                    return (
                      <div key={star} className="up-rating-bar-row">
                        <span className="up-rating-bar-label">{star} ★</span>
                        <div className="up-rating-bar-track">
                          <div
                            className="up-rating-bar-fill"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="up-rating-bar-count">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Write Review */}
              <div className="up-write-review">
                <h3 className="up-section-title">Écrire un avis</h3>
                {!showReviewForm ? (
                  <button className="up-review-write-btn" onClick={() => setShowReviewForm(true)}>
                    <Icons.Edit /> Écrire un avis
                  </button>
                ) : (
                  <div className="up-review-form">
                    <div className="up-review-form-stars">
                      <span className="up-review-form-label">Votre note :</span>
                      <StarRatingInput rating={reviewRating} onChange={setReviewRating} />
                      {reviewRating > 0 && (
                        <span className="up-rating-text">{STAR_LABELS[reviewRating]}</span>
                      )}
                    </div>
                    <div className="up-review-recommend-toggle">
                      <button
                        className={`up-recommend-btn ${reviewRecommends ? 'up-recommend-active' : ''}`}
                        onClick={() => setReviewRecommends(true)}
                      >
                        <Icons.ThumbsUp /> Recommande
                      </button>
                      <button
                        className={`up-recommend-btn ${!reviewRecommends ? 'up-recommend-active' : ''}`}
                        onClick={() => setReviewRecommends(false)}
                      >
                        <Icons.ThumbsUp /> Ne recommande pas
                      </button>
                    </div>
                    <textarea
                      className="up-review-textarea"
                      placeholder="Partagez votre expérience..."
                      value={reviewText}
                      onChange={(e) => setReviewText(e.target.value)}
                      rows={4}
                    />
                    <div className="up-review-form-actions">
                      <button
                        className="up-review-cancel-btn"
                        onClick={() => { setShowReviewForm(false); setReviewRating(0); setReviewText(''); }}
                      >
                        Annuler
                      </button>
                      <button
                        className="up-review-submit-btn"
                        onClick={handleReviewSubmit}
                        disabled={!reviewRating}
                      >
                        Publier l&apos;avis
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Reviews List */}
              <div className="up-reviews-list">
                {pageReviews.map((review) => (
                  <ReviewItem 
                    key={review.id} 
                    review={review} 
                    helpfulCount={reviewHelpfulCounts[review.id] || 0}
                    userVoted={reviewUserVoted[review.id] || false}
                    replies={reviewReplies[review.id] || []}
                    onHelpful={() => handleReviewHelpful(review.id)}
                    onReply={(text) => handleReviewReply(review.id, text)}
                    currentUserEmail={currentUser?.email}
                  />
                ))}
              </div>
            </div>
          )}

          {/* ---- COMMUNITY TAB ---- */}
          {activeTab === 'community' && (
            <div className="up-community-section">
              <div className="up-community-highlights">
                <div className="up-community-card">
                  <div className="up-community-card-header">
                    <Icons.Users />
                    <h3>Communauté</h3>
                  </div>
                  <p className="up-community-desc">
                    {formatNumber(localFollowersCount)} personnes suivent cette page.
                    Rejoignez la communauté pour rester informé.
                  </p>
                  <button className="up-community-join-btn" onClick={handleFollow}>
                    {isFollowing ? (
                      <>
                        <Icons.Check /> <span>Suivi</span>
                      </>
                    ) : (
                      <>
                        <Icons.UserPlus /> <span>Suivre cette page</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="up-community-discussions">
                <h3 className="up-section-title">Discussions récentes</h3>
                {filteredPosts.slice(0, 5).map((post) => (
                  <div key={post.id} className="up-community-post">
                    <div className="up-community-post-avatar">
                      <img src={post.author.avatar} alt={post.author.name} />
                    </div>
                    <div className="up-community-post-info">
                      <span className="up-community-post-author">{post.author.name}</span>
                      <p className="up-community-post-text">
                        {post.content.length > 120 ? post.content.substring(0, 120) + '...' : post.content}
                      </p>
                      <div className="up-community-post-meta">
                        <span>{formatTimeAgo(post.createdAt)}</span>
                        <span>·</span>
                        <span>{post.reactions?.length || 0} réactions</span>
                        <span>·</span>
                        <span>{post.comments?.length || 0} commentaires</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ====== SIDEBAR ====== */}
        {showSuggestions && (
          <div className="up-sidebar">
            {/* Page Info Card */}
            <div className="up-sidebar-card">
              <h4 className="up-sidebar-title">À propos</h4>
              {currentPage.description && (
                <p className="up-sidebar-description">
                  {currentPage.description.length > 150 ? currentPage.description.substring(0, 150) + '...' : currentPage.description}
                </p>
              )}
              <div className="up-sidebar-info-list">
                {currentPage.category && (
                  <div className="up-sidebar-info-item">
                    <Icons.Tag />
                    <span>{currentPage.category}{currentPage.subcategory ? ` · ${currentPage.subcategory}` : ''}</span>
                  </div>
                )}
                {currentPage.phone && (
                  <div className="up-sidebar-info-item">
                    <Icons.Phone />
                    <span>{currentPage.phone}</span>
                  </div>
                )}
                {currentPage.email && (
                  <div className="up-sidebar-info-item">
                    <Icons.Mail />
                    <span>{currentPage.email}</span>
                  </div>
                )}
                {currentPage.website && (
                  <div className="up-sidebar-info-item">
                    <Icons.Link />
                    <a href={currentPage.website} className="up-sidebar-link" target="_blank" rel="noopener noreferrer">
                      {currentPage.website.replace(/^https?:\/\//, '')}
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Business Hours */}
            {businessHours && (
              <div className="up-sidebar-card">
                <BusinessHours hours={businessHours} />
              </div>
            )}

            {/* Photos Preview */}
            {photos && photos.length > 0 && (
              <div className="up-sidebar-card">
                <h4 className="up-sidebar-title">Photos</h4>
                <div className="up-sidebar-photos">
                  {photos.slice(0, 6).map((photo, idx) => (
                    <div key={idx} className="up-sidebar-photo">
                      <img src={photo.url} alt={photo.caption || ''} />
                    </div>
                  ))}
                </div>
                {photos.length > 6 && (
                  <button
                    className="up-sidebar-see-all"
                    onClick={() => handleTabChange('photos')}
                  >
                    Voir toutes les photos
                  </button>
                )}
              </div>
            )}

            {/* Similar Pages */}
            {similarPages && similarPages.length > 0 && (
              <div className="up-sidebar-card">
                <h4 className="up-sidebar-title">Pages similaires</h4>
                <div className="up-similar-currentPages">
                  {similarPages.map((sp, idx) => (
                    <SimilarPageCard key={idx} currentPage={sp} />
                  ))}
                </div>
              </div>
            )}

            {/* Page Transparency */}
            <div className="up-sidebar-card">
              <h4 className="up-sidebar-title">Transparence de la page</h4>
              <div className="up-transparency-info">
                <div className="up-transparency-item">
                  <Icons.Shield />
                  <span>Page vérifiée</span>
                </div>
                {currentPage.createdAt && (
                  <div className="up-transparency-item">
                    <Icons.Calendar />
                    <span>Créée le {new Date(currentPage.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                  </div>
                )}
                <div className="up-transparency-item">
                  <Icons.Globe />
                  <span>Page publique</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ====== SHARE MODAL ====== */}
      {showShareModal && (
        <div className="up-modal-overlay" onClick={() => setShowShareModal(false)}>
          <div className="up-share-modal" onClick={(e) => e.stopPropagation()}>
            <div className="up-modal-header">
              <h3>Partager cette publication</h3>
              <button className="up-modal-close" onClick={() => setShowShareModal(false)}>
                <Icons.X />
              </button>
            </div>
            <div className="up-share-options">
              <button className="up-share-option" style={{ '--share-color': '#003d5c' }}>
                <span className="up-share-icon" style={{ background: '#003d5c' }}>f</span>
                <span>Facebook</span>
              </button>
              <button className="up-share-option" style={{ '--share-color': '#1DA1F2' }}>
                <span className="up-share-icon" style={{ background: '#1DA1F2' }}>𝕏</span>
                <span>Twitter</span>
              </button>
              <button className="up-share-option" style={{ '--share-color': '#25D366' }}>
                <span className="up-share-icon" style={{ background: '#25D366' }}>💬</span>
                <span>WhatsApp</span>
              </button>
              <button className="up-share-option" style={{ '--share-color': '#0077B5' }}>
                <span className="up-share-icon" style={{ background: '#0077B5' }}>in</span>
                <span>LinkedIn</span>
              </button>
              <button className="up-share-option" style={{ '--share-color': '#FF4500' }}>
                <span className="up-share-icon" style={{ background: '#FF4500' }}>☉</span>
                <span>Reddit</span>
              </button>
              <button className="up-share-option" onClick={handleCopyLink} style={{ '--share-color': '#65676B' }}>
                <span className="up-share-icon" style={{ background: '#65676B' }}>
                  <Icons.Copy />
                </span>
                <span>{copiedLink ? 'Copié !' : 'Copier le lien'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====== INVITE MODAL ====== */}
      {showInviteModal && (
        <InviteModal currentUser={currentUser} pageName={currentPage.name} onClose={() => setShowInviteModal(false)} />
      )}

      {showSponsorModal && (
        <div className="up-modal-overlay" onClick={() => setShowSponsorModal(false)}>
          <div className="up-sponsor-create-modal" onClick={(e) => e.stopPropagation()}>
            <div className="up-modal-header">
              <h3>
                <i className="fas fa-pen-fancy" style={{marginRight:10,color:'var(--fb-blue)'}}></i>
                Créer une nouvelle publicité
              </h3>
              <button className="up-modal-close" onClick={() => setShowSponsorModal(false)}>
                <Icons.X />
              </button>
            </div>
            <div className="up-sponsor-create-content">
              <form onSubmit={(e) => {
                e.preventDefault();
                setSponsorError("");
                setSponsorLoading(true);
                fetch('/api/sponsors/create', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(sponsorFormData),
                })
                  .then(res => {
                    if (!res.ok) throw new Error('Erreur lors de la création de la publicité');
                    return res.json();
                  })
                  .then(() => {
                    setSponsorLoading(false);
                    setShowSponsorModal(false);
                    // Optionnel: afficher un toast ou recharger la liste
                  })
                  .catch(err => {
                    setSponsorError(err.message || 'Erreur inconnue');
                    setSponsorLoading(false);
                  });
              }} className="up-sponsor-form">
                <div className="up-sponsor-form-grid">
                  <div className="up-sponsor-form-field" style={{gridColumn:'1 / -1'}}>
                    <label className="up-sponsor-label">
                      Titre de la publicité *
                    </label>
                    <input
                      className="up-sponsor-input"
                      placeholder="Ex: Nouvelle collection printemps"
                      required
                      value={sponsorFormData.title}
                      onChange={(e) => handleSponsorFormChange('title', e.target.value)}
                    />
                  </div>

                  <div className="up-sponsor-form-field">
                    <label className="up-sponsor-label">
                      Description courte
                    </label>
                    <input
                      className="up-sponsor-input"
                      placeholder="Décrivez brièvement votre offre"
                      value={sponsorFormData.description}
                      onChange={(e) => handleSponsorFormChange('description', e.target.value)}
                    />
                  </div>

                  <div className="up-sponsor-form-field">
                    <label className="up-sponsor-label">
                      URL de destination
                    </label>
                    <input
                      className="up-sponsor-input"
                      placeholder="https://votre-site.com"
                      value={sponsorFormData.destinationUrl}
                      onChange={(e) => handleSponsorFormChange('destinationUrl', e.target.value)}
                    />
                  </div>

                  <div className="up-sponsor-form-field" style={{gridColumn:'1 / -1'}}>
                    <label className="up-sponsor-label">
                      URL de l'image (bannière)
                    </label>
                    <input
                      className="up-sponsor-input"
                      placeholder="https://votre-site.com/image.jpg"
                      value={sponsorFormData.imageUrl}
                      onChange={(e) => handleSponsorFormChange('imageUrl', e.target.value)}
                    />
                  </div>

                  {/* OWNER PROFILE SECTION */}
                  <div className="up-sponsor-profile-section" style={{gridColumn:'1 / -1'}}>
                    <h4 className="up-sponsor-profile-title">
                      <i className="fas fa-user-circle" style={{marginRight:8}}></i>
                      Profil du propriétaire de la publicité
                    </h4>

                    <div className="up-sponsor-profile-grid">
                      {/* Avatar preview */}
                      <div className="up-sponsor-avatar-preview">
                        <div
                          className="up-sponsor-avatar-circle"
                          style={{
                            backgroundImage: sponsorFormData.ownerAvatarPreview
                              ? `url(${sponsorFormData.ownerAvatarPreview})`
                              : sponsorFormData.ownerAvatarUrl
                              ? `url(${sponsorFormData.ownerAvatarUrl})`
                              : `linear-gradient(135deg, ${sponsorFormData.ownerGradientColor} 0%, #ffffff 100%)`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                          }}
                        >
                          {!sponsorFormData.ownerAvatarPreview && !sponsorFormData.ownerAvatarUrl && (
                            <span>{sponsorFormData.ownerName ? sponsorFormData.ownerName.charAt(0).toUpperCase() : 'A'}</span>
                          )}
                        </div>
                      </div>

                      {/* Owner info inputs */}
                      <div className="up-sponsor-owner-info">
                        <div className="up-sponsor-owner-field">
                          <label className="up-sponsor-owner-label">
                            Nom du propriétaire
                          </label>
                          <input
                            className="up-sponsor-owner-input"
                            placeholder="Ex: Nike Store"
                            value={sponsorFormData.ownerName}
                            onChange={(e) => handleSponsorFormChange('ownerName', e.target.value)}
                          />
                        </div>
                        <div className="up-sponsor-owner-field">
                          <label className="up-sponsor-owner-label">
                            Couleur de gradient
                          </label>
                          <input
                            className="up-sponsor-color-input"
                            type="color"
                            value={sponsorFormData.ownerGradientColor}
                            onChange={(e) => handleSponsorFormChange('ownerGradientColor', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="up-sponsor-avatar-upload">
                      <label className="up-sponsor-avatar-label">
                        <i className="fas fa-image" style={{marginRight:6}}></i>
                        Avatar du propriétaire
                      </label>

                      <div className="up-sponsor-upload-grid">
                        {/* File upload option */}
                        <div className="up-sponsor-upload-button">
                          <input
                            type="file"
                            accept="image/*"
                            style={{display:'none'}}
                            id="sponsor-avatar-upload"
                            onChange={handleSponsorAvatarUpload}
                          />
                          <label
                            htmlFor="sponsor-avatar-upload"
                            className="up-sponsor-upload-label"
                          >
                            <i className="fas fa-cloud-upload-alt"></i>
                            Sélectionner
                          </label>
                        </div>

                        {/* URL input option */}
                        <input
                          className="up-sponsor-url-input"
                          type="text"
                          placeholder="Ou coller une URL"
                          value={sponsorFormData.ownerAvatarUrl}
                          onChange={(e) => handleSponsorAvatarUrlChange(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="up-sponsor-submit-btn"
                    disabled={sponsorLoading}
                  >
                    {sponsorLoading ? 'Création...' : 'Créer la publicité'}
                  </button>
                  {sponsorError && <div className="up-sponsor-error">{sponsorError}</div>}

                  {/* Pay CTA shown if user hasn't paid */}
                  <div className="up-sponsor-pay-cta">
                    <button
                      type="button"
                      onClick={() => router.push('/sponsor/upgrade')}
                      disabled={sponsorLoading}
                      className="up-sponsor-pay-btn"
                    >
                      {sponsorLoading ? 'Chargement...' : 'Payer les frais'}
                    </button>
                    <div className="up-sponsor-pay-text">
                      Vous devez payer les frais de plateforme avant de publier.
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {ownerAction && (
        <div className="up-modal-overlay" onClick={handleOwnerModalClose}>
          <div className="up-action-modal" onClick={(e) => e.stopPropagation()}>
            <div className="up-modal-header">
              <h3>
                {ownerAction === 'edit' && 'Modifier la page'}
                {ownerAction === 'settings' && 'Paramètres de la page'}
                {ownerAction === 'advertise' && 'Créer une publicité'}
                {ownerAction === 'info' && 'Informations sur la page'}
                {ownerAction === 'transparency' && 'Transparence de la page'}
              </h3>
              <button className="up-modal-close" onClick={handleOwnerModalClose}>
                <Icons.X />
              </button>
            </div>
            <div className="up-action-content">
              {ownerAction === 'dashboard' && (
                <div className="up-dashboard-modal-ui">
                  <div className="up-dashboard-stats">
                    <div className="up-dashboard-stat">
                      <span className="up-dashboard-stat-number">{formatNumber(localFollowersCount)}</span>
                      <span className="up-dashboard-stat-label">Abonnés</span>
                    </div>
                    <div className="up-dashboard-stat">
                      <span className="up-dashboard-stat-number">{formatNumber(localLikesCount)}</span>
                      <span className="up-dashboard-stat-label">J'aime</span>
                    </div>
                    <div className="up-dashboard-stat">
                      <span className="up-dashboard-stat-number">{formatNumber(localCheckInsCount)}</span>
                      <span className="up-dashboard-stat-label">Visites</span>
                    </div>
                  </div>
                  <div className="up-dashboard-actions-modal">
                    <button className="up-dashboard-btn-compact" onClick={() => handleOwnerAction('edit')}>
                      <Icons.Edit /> <span>Modifier la page</span>
                    </button>
                    <button className="up-dashboard-btn-compact" onClick={() => handleOwnerAction('settings')}>
                      <Icons.Settings /> <span>Paramètres</span>
                    </button>
                    <button className="up-dashboard-btn-compact" onClick={handleOpenSponsorModal}>
                      <Icons.Megaphone /> <span>Promouvoir</span>
                    </button>
                    <button className="up-dashboard-btn-compact" onClick={() => setShowInviteModal(true)}>
                      <Icons.UserPlus /> <span>Inviter</span>
                    </button>
                  </div>
                  <div className="up-dashboard-links">
                    <a href="#publications" className="up-dashboard-link">Voir les publications</a>
                    <a href="#about" className="up-dashboard-link">À propos</a>
                    <a href="#photos" className="up-dashboard-link">Photos</a>
                    <a href="#videos" className="up-dashboard-link">Vidéos</a>
                  </div>
                </div>
              )}
              {ownerAction === 'edit' && (
                <div className="up-action-edit">
                  <div className="up-edit-form">
                    <div className="up-edit-field">
                      <label className="up-edit-label">Nom de la page</label>
                      <input
                        type="text"
                        className="up-edit-input"
                        value={currentPageDraft.name}
                        onChange={(e) => handlePageDraftChange('name', e.target.value)}
                        placeholder="Nom de votre page"
                      />
                    </div>
                    <div className="up-edit-field">
                      <label className="up-edit-label">Catégorie</label>
                      <select
                        className="up-edit-select"
                        value={currentPageDraft.category}
                        onChange={(e) => handlePageDraftChange('category', e.target.value)}
                      >
                        <option value="">Sélectionner une catégorie</option>
                        <option value="Entreprise">Entreprise</option>
                        <option value="Marque">Marque</option>
                        <option value="Artiste">Artiste</option>
                        <option value="Cause">Cause</option>
                        <option value="Divertissement">Divertissement</option>
                        <option value="communauté">Communauté</option>
                        <option value="Restaurant">Restaurant</option>
                        <option value="Shop">Boutique</option>
                        <option value="Service">Service</option>
                        <option value="Autre">Autre</option>
                      </select>
                    </div>
                    <div className="up-edit-field">
                      <label className="up-edit-label">Description</label>
                      <textarea
                        className="up-edit-textarea"
                        value={currentPageDraft.description}
                        onChange={(e) => handlePageDraftChange('description', e.target.value)}
                        placeholder="Décrivez votre page..."
                        rows={4}
                      />
                    </div>
                    <div className="up-edit-field">
                      <label className="up-edit-label">Sous-catégorie</label>
                      <input
                        type="text"
                        className="up-edit-input"
                        value={currentPageDraft.subcategory || ''}
                        onChange={(e) => handlePageDraftChange('subcategory', e.target.value)}
                        placeholder="Sous-catégorie (optionnel)"
                      />
                    </div>
                    <div className="up-edit-field">
                      <label className="up-edit-label">Adresse</label>
                      <input
                        type="text"
                        className="up-edit-input"
                        value={currentPageDraft.address || ''}
                        onChange={(e) => handlePageDraftChange('address', e.target.value)}
                        placeholder="Adresse de la page (optionnel)"
                      />
                    </div>
                    <div className="up-edit-field">
                      <label className="up-edit-label">Téléphone</label>
                      <input
                        type="tel"
                        className="up-edit-input"
                        value={currentPageDraft.phone || ''}
                        onChange={(e) => handlePageDraftChange('phone', e.target.value)}
                        placeholder="Numéro de téléphone (optionnel)"
                      />
                    </div>
                    <div className="up-edit-field">
                      <label className="up-edit-label">Site web</label>
                      <input
                        type="url"
                        className="up-edit-input"
                        value={currentPageDraft.website || ''}
                        onChange={(e) => handlePageDraftChange('website', e.target.value)}
                        placeholder="https://votre-site.com (optionnel)"
                      />
                    </div>
                    <div className="up-edit-field">
                      <label className="up-edit-label">Email de contact</label>
                      <input
                        type="email"
                        className="up-edit-input"
                        value={currentPageDraft.contactEmail || ''}
                        onChange={(e) => handlePageDraftChange('contactEmail', e.target.value)}
                        placeholder="contact@exemple.com (optionnel)"
                      />
                    </div>
                    <div className="up-action-button-row">
                      <button className="up-invite-send-btn" onClick={handleSavePageDraft}>
                        Enregistrer les modifications
                      </button>
                    </div>
                  </div>
                </div>
              )}
              {ownerAction === 'settings' && (
                <div className="up-action-settings">
                  <div className="up-action-setting-item">
                    <label>
                      <input
                        type="checkbox"
                        checked={currentPageSettings.publishEnabled}
                        onChange={() => handleSettingsToggle('publishEnabled')}
                      />
                      Publier les mises à jour de la page
                    </label>
                  </div>
                  <div className="up-action-setting-item">
                    <label>
                      <input
                        type="checkbox"
                        checked={currentPageSettings.isPublic}
                        onChange={() => handleSettingsToggle('isPublic')}
                      />
                      Page publique
                    </label>
                  </div>
                  <div className="up-action-setting-item">
                    <label>
                      <input
                        type="checkbox"
                        checked={currentPageSettings.notificationsEnabled}
                        onChange={() => handleSettingsToggle('notificationsEnabled')}
                      />
                      Notifications activées
                    </label>
                  </div>
                  <div className="up-action-button-row">
                    <button className="up-invite-send-btn" onClick={handleSavePageDraft}>
                      Enregistrer les paramètres
                    </button>
                  </div>
                </div>
              )}
              {ownerAction === 'advertise' && (
                <div className="up-action-advertise">
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    // Handle sponsor creation logic here
                    handleOwnerModalClose();
                  }} className="up-sponsor-form">
                    <div className="up-sponsor-form-grid">
                      <div className="up-sponsor-form-field" style={{gridColumn:'1 / -1'}}>
                        <label className="up-sponsor-label">
                          Titre de la publicité *
                        </label>
                        <input
                          className="up-sponsor-input"
                          placeholder="Ex: Nouvelle collection printemps"
                          required
                          value={sponsorFormData.title}
                          onChange={(e) => handleSponsorFormChange('title', e.target.value)}
                        />
                      </div>

                      <div className="up-sponsor-form-field">
                        <label className="up-sponsor-label">
                          Description courte
                        </label>
                        <input
                          className="up-sponsor-input"
                          placeholder="Décrivez brièvement votre offre"
                          value={sponsorFormData.description}
                          onChange={(e) => handleSponsorFormChange('description', e.target.value)}
                        />
                      </div>

                      <div className="up-sponsor-form-field">
                        <label className="up-sponsor-label">
                          URL de destination
                        </label>
                        <input
                          className="up-sponsor-input"
                          placeholder="https://votre-site.com"
                          value={sponsorFormData.destinationUrl}
                          onChange={(e) => handleSponsorFormChange('destinationUrl', e.target.value)}
                        />
                      </div>

                      <div className="up-sponsor-form-field" style={{gridColumn:'1 / -1'}}>
                        <label className="up-sponsor-label">
                          URL de l'image (bannière)
                        </label>
                        <input
                          className="up-sponsor-input"
                          placeholder="https://votre-site.com/image.jpg"
                          value={sponsorFormData.imageUrl}
                          onChange={(e) => handleSponsorFormChange('imageUrl', e.target.value)}
                        />
                      </div>

                      {/* OWNER PROFILE SECTION */}
                      <div className="up-sponsor-profile-section" style={{gridColumn:'1 / -1'}}>
                        <h4 className="up-sponsor-profile-title">
                          <i className="fas fa-user-circle" style={{marginRight:8}}></i>
                          Profil du propriétaire de la publicité
                        </h4>

                        <div className="up-sponsor-profile-grid">
                          {/* Avatar preview */}
                          <div className="up-sponsor-avatar-preview">
                            <div
                              className="up-sponsor-avatar-circle"
                              style={{
                                backgroundImage: sponsorFormData.ownerAvatarPreview
                                  ? `url(${sponsorFormData.ownerAvatarPreview})`
                                  : sponsorFormData.ownerAvatarUrl
                                  ? `url(${sponsorFormData.ownerAvatarUrl})`
                                  : `linear-gradient(135deg, ${sponsorFormData.ownerGradientColor} 0%, #ffffff 100%)`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                              }}
                            >
                          {!sponsorFormData.ownerAvatarPreview && !sponsorFormData.ownerAvatarUrl && (
                            <span>{sponsorFormData.ownerName ? sponsorFormData.ownerName.charAt(0).toUpperCase() : 'A'}</span>
                          )}
                        </div>
                      </div>

                      {/* Owner info inputs */}
                      <div className="up-sponsor-owner-info">
                        <div className="up-sponsor-owner-field">
                          <label className="up-sponsor-owner-label">
                            Nom du propriétaire
                          </label>
                          <input
                            className="up-sponsor-owner-input"
                            placeholder="Ex: Nike Store"
                            value={sponsorFormData.ownerName}
                            onChange={(e) => handleSponsorFormChange('ownerName', e.target.value)}
                          />
                        </div>
                        <div className="up-sponsor-owner-field">
                          <label className="up-sponsor-owner-label">
                            Couleur de gradient
                          </label>
                          <input
                            className="up-sponsor-color-input"
                            type="color"
                            value={sponsorFormData.ownerGradientColor}
                            onChange={(e) => handleSponsorFormChange('ownerGradientColor', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="up-sponsor-avatar-upload">
                      <label className="up-sponsor-avatar-label">
                        <i className="fas fa-image" style={{marginRight:6}}></i>
                        Avatar du propriétaire
                      </label>

                      <div className="up-sponsor-upload-grid">
                        {/* File upload option */}
                        <div className="up-sponsor-upload-button">
                          <input
                            type="file"
                            accept="image/*"
                            style={{display:'none'}}
                            id="sponsor-avatar-upload-owner"
                            onChange={handleSponsorAvatarUpload}
                          />
                          <label
                            htmlFor="sponsor-avatar-upload-owner"
                            className="up-sponsor-upload-label"
                          >
                            <i className="fas fa-cloud-upload-alt"></i>
                            Sélectionner
                          </label>
                        </div>

                        {/* URL input option */}
                        <input
                          className="up-sponsor-url-input"
                          type="text"
                          placeholder="Ou coller une URL"
                          value={sponsorFormData.ownerAvatarUrl}
                          onChange={(e) => handleSponsorAvatarUrlChange(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="up-sponsor-submit-btn"
                  >
                    Créer la publicité
                  </button>

                  {/* Pay CTA shown if user hasn't paid */}
                  <div className="up-sponsor-pay-cta">
                    <button
                      type="button"
                      onClick={() => router.push('/sponsor/upgrade')}
                      disabled={sponsorLoading}
                      className="up-sponsor-pay-btn"
                    >
                      {sponsorLoading ? 'Chargement...' : 'Payer les frais'}
                    </button>
                    <div className="up-sponsor-pay-text">
                      Vous devez payer les frais de plateforme avant de publier.
                    </div>
                  </div>
                    </div>
                  </form>
                </div>
              )}
              {ownerAction === 'info' && (
                <div className="up-action-summary">
                  <p className="up-action-hint">Informations de la page {currentPage.name || 'Ma Page'}.</p>
                  <div className="up-action-summary-item">
                    <strong>Catégorie :</strong> {currentPage.category || 'Entreprise'}
                  </div>
                  {currentPage.subcategory && (
                    <div className="up-action-summary-item">
                      <strong>Sous-catégorie :</strong> {currentPage.subcategory}
                    </div>
                  )}
                  {currentPage.description && (
                    <div className="up-action-summary-item">
                      <strong>Description :</strong> {currentPage.description}
                    </div>
                  )}
                  {currentPage.address && (
                    <div className="up-action-summary-item">
                      <strong>Adresse :</strong> {currentPage.address}
                    </div>
                  )}
                  {currentPage.phone && (
                    <div className="up-action-summary-item">
                      <strong>Téléphone :</strong> {currentPage.phone}
                    </div>
                  )}
                  {currentPage.website && (
                    <div className="up-action-summary-item">
                      <strong>Site web :</strong> {currentPage.website}
                    </div>
                  )}
                  {currentPage.contactEmail && (
                    <div className="up-action-summary-item">
                      <strong>Email :</strong> {currentPage.contactEmail}
                    </div>
                  )}
                  <div className="up-action-summary-item">
                    <strong>Abonnés :</strong> {formatNumber(localFollowersCount)}
                  </div>
                  <div className="up-action-summary-item">
                    <strong>J'aime :</strong> {formatNumber(localLikesCount)}
                  </div>
                </div>
              )}
              {ownerAction === 'transparency' && (
                <div className="up-action-summary">
                  <div className="up-action-summary-item">
                    <Icons.Shield /> Page vérifiée
                  </div>
                  {currentPage.createdAt && (
                    <div className="up-action-summary-item">
                      <Icons.Calendar /> Créée le {new Date(currentPage.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                  )}
                  <div className="up-action-summary-item">
                    <Icons.Globe /> Page publique
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal for Avatar/Cover */}
      {uploadModal && (
        <Modal open={uploadModal !== null} onClose={() => {
          setUploadModal(null);
          setAvatarPreviewUrl(null);
          setCoverPreviewUrl(null);
        }} title={uploadModal === 'avatar' ? 'Modifier la photo de profil' : 'Modifier la photo de couverture'}>
          <div style={{display:'flex',flexDirection:'column',gap:16,alignItems:'center'}}>
            <div style={{padding:16,border:'2px dashed #ddd',borderRadius:12,textAlign:'center',cursor:'pointer',width:'100%'}}
              onClick={() => uploadModal === 'avatar' ? handleAvatarClick() : handleCoverClick()}>
              {(uploadModal === 'avatar' ? avatarPreviewUrl : coverPreviewUrl) ? (
                <img src={uploadModal === 'avatar' ? avatarPreviewUrl : coverPreviewUrl} alt="preview" style={{maxWidth:'100%',maxHeight:300,borderRadius:8}} />
              ) : (
                <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:8,padding:24}}>
                  <Icons.Camera style={{fontSize:32,color:'#003d5c'}} />
                  <p style={{margin:0,fontWeight:600}}>Glissez-déposez une image ici</p>
                  <p style={{margin:0,fontSize:13,color:'#888'}}>ou cliquez pour sélectionner</p>
                </div>
              )}
            </div>
            <div style={{display:'flex',gap:8,width:'100%'}}>
              <button style={{flex:1,padding:'10px 16px',border:'1px solid #ddd',borderRadius:6,background:'#fff',cursor:'pointer'}} onClick={() => {
                setUploadModal(null);
                setAvatarPreviewUrl(null);
                setCoverPreviewUrl(null);
              }}>Annuler</button>
              <button style={{flex:1,padding:'10px 16px',border:'none',borderRadius:6,background:'#003d5c',color:'#fff',cursor:'pointer',fontWeight:600}} onClick={handleUploadImage}>
                Confirmer
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Photo Viewer Modal */}
      {photoViewerOpen && selectedPhotoIndex !== null && pagePhotos[selectedPhotoIndex] && (
        <div className="up-modal-overlay" onClick={() => setPhotoViewerOpen(false)} style={{zIndex:9999}}>
          <div className="up-photo-viewer" onClick={(e) => e.stopPropagation()} style={{
            position:'relative',maxWidth:'90vw',maxHeight:'90vh',background:'#000',borderRadius:8,overflow:'hidden'
          }}>
            {/* Header with close button */}
            <div style={{
              position:'absolute',top:0,left:0,right:0,zIndex:10,
              display:'flex',justifyContent:'space-between',alignItems:'center',
              padding:'8px 12px',background:'linear-gradient(to bottom,rgba(0,0,0,0.7),transparent)',
              flexWrap:'wrap',gap:8
            }}>
              <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
                <button 
                  onClick={async () => {
                    try {
                      const response = await fetch(pagePhotos[selectedPhotoIndex].url);
                      const blob = await response.blob();
                      const url = window.URL.createObjectURL(blob);
                      const link = document.createElement('a');
                      link.href = url;
                      link.download = 'photo-' + Date.now() + '.jpg';
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      window.URL.revokeObjectURL(url);
                    } catch (e) {
                      alert('Erreur lors du téléchargement');
                    }
                  }}
                  style={{
                    background:'rgba(255,255,255,0.2)',border:'none',borderRadius:4,
                    padding:'6px 10px',color:'#fff',cursor:'pointer',display:'flex',alignItems:'center',gap:4,fontSize:13
                  }}
                >
                  <Icons.Download size={16} /> <span className="btn-text">Télécharger</span>
                </button>
                {currentUser && currentUser.email === currentPage.ownerEmail && (
                  <>
                    <button 
                      onClick={async () => {
                        try {
                          const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
                          const userEmail = currentUser?.email || '';
                          const res = await fetch(`/api/pages/${currentPage.id}?userEmail=${encodeURIComponent(userEmail)}`, {
                            method: 'PUT',
                            headers: { 
                              'Content-Type': 'application/json',
                              ...(token ? { Authorization: `Bearer ${token}` } : {})
                            },
                            body: JSON.stringify({ 
                              avatar: pagePhotos[selectedPhotoIndex].url
                            })
                          });
                          if (res.ok) {
                            setToast({ message: 'Photo de profil mise à jour', type: 'success' });
                            setPhotoViewerOpen(false);
                          } else {
                            const err = await res.json();
                            setToast({ message: err.error || 'Erreur lors de la mise à jour', type: 'error' });
                          }
                        } catch (e) {
                          setToast({ message: 'Erreur lors de la mise à jour', type: 'error' });
                        }
                      }}
                      style={{
                        background:'rgba(255,255,255,0.2)',border:'none',borderRadius:4,
                        padding:'6px 10px',color:'#fff',cursor:'pointer',display:'flex',alignItems:'center',gap:4,fontSize:13
                      }}
                    >
                      <Icons.User size={16} /> <span className="btn-text">Profil</span>
                    </button>
                    <button 
                      onClick={async () => {
                        try {
                          const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
                          const res = await fetch(`/api/pages/${currentPage.id}`, {
                            method: 'PUT',
                            headers: { 
                              'Content-Type': 'application/json',
                              ...(token ? { Authorization: `Bearer ${token}` } : {})
                            },
                            body: JSON.stringify({ 
                              cover: pagePhotos[selectedPhotoIndex].url
                            })
                          });
                          if (res.ok) {
                            setToast({ message: 'Photo de couverture mise à jour', type: 'success' });
                            setPhotoViewerOpen(false);
                          } else {
                            const err = await res.json();
                            setToast({ message: err.error || 'Erreur lors de la mise à jour', type: 'error' });
                          }
                        } catch (e) {
                          setToast({ message: 'Erreur lors de la mise à jour', type: 'error' });
                        }
                      }}
                      style={{
                        background:'rgba(255,255,255,0.2)',border:'none',borderRadius:4,
                        padding:'6px 10px',color:'#fff',cursor:'pointer',display:'flex',alignItems:'center',gap:4,fontSize:13
                      }}
                    >
                      <Icons.Image size={16} /> <span className="btn-text">Couverture</span>
                    </button>
                  </>
                )}
              </div>
              <button 
                onClick={() => setPhotoViewerOpen(false)}
                style={{
                  background:'rgba(255,255,255,0.2)',border:'none',borderRadius:'50%',
                  width:32,height:32,color:'#fff',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'
                }}
              >
                <Icons.X size={18} />
              </button>
            </div>

            {/* Photo */}
            <img 
              src={pagePhotos[selectedPhotoIndex].url} 
              alt={pagePhotos[selectedPhotoIndex].caption || ''}
              style={{
                maxWidth:'90vw',maxHeight:'85vh',width:'auto',height:'auto',
                display:'block',margin:'0 auto'
              }}
            />

            {/* Caption */}
            {pagePhotos[selectedPhotoIndex].caption && (
              <div style={{
                position:'absolute',bottom:0,left:0,right:0,
                padding:'16px',background:'linear-gradient(to top,rgba(0,0,0,0.8),transparent)',
                color:'#fff'
              }}>
                <p style={{margin:0}}>{pagePhotos[selectedPhotoIndex].caption}</p>
              </div>
            )}

            {/* Navigation arrows */}
            {pagePhotos.length > 1 && (
              <>
                {selectedPhotoIndex > 0 && (
                  <button 
                    onClick={() => setSelectedPhotoIndex(selectedPhotoIndex - 1)}
                    style={{
                      position:'absolute',left:16,top:'50%',transform:'translateY(-50%)',
                      background:'rgba(255,255,255,0.3)',border:'none',borderRadius:'50%',
                      width:44,height:44,color:'#fff',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'
                    }}
                  >
                    <Icons.ArrowLeft />
                  </button>
                )}
                {selectedPhotoIndex < pagePhotos.length - 1 && (
                  <button 
                    onClick={() => setSelectedPhotoIndex(selectedPhotoIndex + 1)}
                    style={{
                      position:'absolute',right:16,top:'50%',transform:'translateY(-50%)',
                      background:'rgba(255,255,255,0.3)',border:'none',borderRadius:'50%',
                      width:44,height:44,color:'#fff',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'
                    }}
                  >
                    <Icons.ArrowRight />
                  </button>
                )}
              </>
            )}

            {/* Photo counter */}
            <div style={{
              position:'absolute',bottom:16,right:16,
              background:'rgba(0,0,0,0.6)',borderRadius:20,
              padding:'6px 12px',color:'#fff',fontSize:13
            }}>
              {selectedPhotoIndex + 1} / {pagePhotos.length}
            </div>
          </div>
        </div>
      )}

      {/* Video Viewer Modal - version professionnelle avec actions dynamiques, commentaires, follow */}
      {videoViewerOpen && selectedVideoIndex !== null && pageVideos[selectedVideoIndex] && (
        <VideoViewerModal
          video={pageVideos[selectedVideoIndex]}
          videoIndex={selectedVideoIndex}
          totalVideos={pageVideos.length}
          onClose={() => setVideoViewerOpen(false)}
          onPrev={() => {
            setSelectedVideoIndex(selectedVideoIndex - 1); setVideoPlaying(false);
          }}
          onNext={() => {
            setSelectedVideoIndex(selectedVideoIndex + 1); setVideoPlaying(false);
          }}
          canPrev={selectedVideoIndex > 0}
          canNext={selectedVideoIndex < pageVideos.length - 1}
          pageId={pageProp.id}
          currentUser={currentUser}
        />
      )}
    </div>
  );

});

export default UnifyPage;

