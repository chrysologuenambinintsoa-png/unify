// ============================================
// SKELETON - COMMENTAIRES
// Skeleton de chargement pour les sections de commentaires
// ============================================
import React from 'react';

// ── Boîte skeleton générique ─────────────────
const SkeletonBox = ({ width = '100%', height = 14, radius = 6, style = {} }) => (
  <div
    className="skeleton-shimmer"
    style={{ width, height, borderRadius: radius, ...style }}
  />
);

// ── Skeleton d'un commentaire ────────────────
export const SkeletonComment = ({ hasAvatar = true, hasActions = true, hasReplies = false }) => (
  <div className="skeleton-comment">
    {hasAvatar && (
      <div className="skeleton-comment__avatar">
        <SkeletonBox width={36} height={36} radius="50%" />
      </div>
    )}
    <div className="skeleton-comment__body">
      <div className="skeleton-comment__bubble">
        <SkeletonBox width="40%" height={12} style={{ marginBottom: 6 }} />
        <SkeletonBox width="90%" height={12} />
      </div>
      {hasActions && (
        <div className="skeleton-comment__actions">
          <SkeletonBox width={50} height={10} />
          <SkeletonBox width={50} height={10} />
          <SkeletonBox width={60} height={10} />
        </div>
      )}
      {/* Réponses au commentaire */}
      {hasReplies && (
        <div className="skeleton-comment__replies">
          <div className="skeleton-comment__reply">
            <SkeletonBox width={28} height={28} radius="50%" />
          </div>
          <div className="skeleton-comment__reply">
            <SkeletonBox width={28} height={28} radius="50%" />
          </div>
        </div>
      )}
    </div>
  </div>
);

// ── Skeleton input commentaire ────────────────
export const SkeletonCommentInput = () => (
  <div className="skeleton-comment-input">
    <SkeletonBox width={36} height={36} radius="50%" />
    <SkeletonBox width="100%" height={40} radius={20} />
  </div>
);

// ── Skeleton liste de commentaires ───────────
export const SkeletonCommentList = ({ count = 3, showReplies = false }) => (
  <div className="skeleton-comment-list">
    {/* Input area */}
    <SkeletonCommentInput />
    
    {/* Comments */}
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonComment 
        key={i} 
        hasReplies={showReplies && i === 0} 
      />
    ))}
  </div>
);

// ── Skeleton section complète commentaires ───
export const SkeletonCommentsSection = ({ 
  hasHeader = true, 
  commentCount = 3,
  showInput = true,
  showReplies = false 
}) => (
  <div className="skeleton-comments-section">
    {hasHeader && (
      <div className="skeleton-comments-section__header">
        <SkeletonBox width={120} height={16} />
      </div>
    )}
    {showInput && <SkeletonCommentInput />}
    <div className="skeleton-comments-section__list">
      {Array.from({ length: commentCount }).map((_, i) => (
        <SkeletonComment 
          key={i} 
          hasReplies={showReplies && i === 0}
        />
      ))}
    </div>
  </div>
);

export default SkeletonCommentList;