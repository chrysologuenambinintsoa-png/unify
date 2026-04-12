// ============================================
// SKELETON - CHARGEMENT NOTIFICATIONS
// ============================================
import React from 'react';

const SkeletonBox = ({ width = '100%', height = 14, radius = 6, style = {} }) => (
  <div
    className="skeleton-shimmer"
    style={{ width, height, borderRadius: radius, ...style }}
  />
);

// ── Skeleton d'une notification ───────────────
export const SkeletonNotifItem = ({ hasPreview = true }) => (
  <div className="skeleton-notif-item">
    {/* Avatar + badge icône */}
    <div className="skeleton-notif-item__avatar-wrap">
      <SkeletonBox width={52} height={52} radius="50%" />
      <div className="skeleton-notif-item__badge">
        <SkeletonBox width={22} height={22} radius="50%" />
      </div>
    </div>

    {/* Texte */}
    <div className="skeleton-notif-item__content">
      <SkeletonBox width="75%" height={13} />
      <SkeletonBox width="40%" height={11} style={{ marginTop: 7 }} />
      {/* Boutons d'action optionnels */}
      {Math.random() > 0.6 && (
        <div className="skeleton-notif-item__actions">
          <SkeletonBox width={80} height={30} radius={8} />
          <SkeletonBox width={80} height={30} radius={8} />
        </div>
      )}
    </div>

    {/* Aperçu image */}
    {hasPreview && (
      <SkeletonBox width={52} height={52} radius={8} style={{ flexShrink: 0 }} />
    )}

    {/* Point non-lu */}
    <SkeletonBox width={10} height={10} radius="50%" style={{ flexShrink: 0 }} />
  </div>
);

// ── Skeleton header notifications ─────────────
export const SkeletonNotifHeader = () => (
  <div className="skeleton-notif-header">
    <SkeletonBox width={160} height={22} radius={6} />
    <div style={{ display: 'flex', gap: 8 }}>
      <SkeletonBox width={90} height={32} radius={20} />
      <SkeletonBox width={32} height={32} radius="50%" />
    </div>
  </div>
);

// ── Skeleton tabs filtre ───────────────────────
export const SkeletonNotifTabs = () => (
  <div className="skeleton-notif-tabs">
    {[100, 80, 120].map((w, i) => (
      <SkeletonBox key={i} width={w} height={34} radius={20} />
    ))}
  </div>
);

// ── Skeleton groupe (section "Aujourd'hui" etc) ─
export const SkeletonNotifGroup = ({ count = 4, title = true }) => (
  <div className="skeleton-notif-group">
    {title && (
      <SkeletonBox width={100} height={13} radius={6} style={{ marginBottom: 12 }} />
    )}
    {Array.from({ length: count }, (_, i) => (
      <SkeletonNotifItem key={i} hasPreview={i % 3 !== 1} />
    ))}
  </div>
);

// ── Skeleton page complète notifications ───────
const SkeletonNotificationPage = () => (
  <div className="skeleton-notif-page">
    <SkeletonNotifHeader />
    <SkeletonNotifTabs />
    <SkeletonNotifGroup count={3} />
    <SkeletonNotifGroup count={4} />
    <SkeletonNotifGroup count={3} />
  </div>
);

export default SkeletonNotificationPage;