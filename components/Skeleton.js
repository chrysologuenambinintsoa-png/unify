import React from 'react';

// ─── Generic skeleton block ───────────────────────────────────────────────────
export function Skeleton({ width = '100%', height = 16, style = {}, className = '' }) {
  return (
    <div
      className={`skeleton ${className}`}
      style={{ width, height, borderRadius: 4, ...style }}
    />
  );
}

// ─── Specific shapes ──────────────────────────────────────────────────────────
export function AvatarSkeleton({ size = 36 }) {
  return (
    <Skeleton
      width={size}
      height={size}
      className="skeleton-avatar"
      style={{ borderRadius: '50%', flexShrink: 0 }}
    />
  );
}

export function TextSkeleton({ lines = 2 }) {
  return (
    <>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} height={12} style={{ marginBottom: 6, width: `${90 - i * 10}%` }} />
      ))}
    </>
  );
}

export function PostSkeleton() {
  return (
    <div className="post-skeleton" style={{ padding: 12, borderRadius: 8, background: 'var(--fb-white)', marginBottom: 12 }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <AvatarSkeleton />
        <Skeleton width="30%" height={12} style={{ alignSelf: 'center' }} />
      </div>
      <TextSkeleton lines={3} />
      <Skeleton height={150} style={{ marginTop: 8 }} />
    </div>
  );
}

export function ContactSkeleton() {
  return (
    <div className="contact-item notification-skeleton" style={{ opacity: 0.5 }}>
      <div className="contact-avatar"><AvatarSkeleton /></div>
      <div style={{ flex: 1, marginLeft: 8 }}>
        <Skeleton width="60%" height={12} />
      </div>
    </div>
  );
}

export function MessageSkeleton() {
  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
      <AvatarSkeleton />
      <div style={{ flex: 1 }}>
        <Skeleton width="40%" height={12} />
        <Skeleton width="80%" height={12} style={{ marginTop: 4 }} />
      </div>
    </div>
  );
}

export function GroupSkeleton() {
  return (
    <div className="contact-item" style={{ opacity: 0.5 }}>
      <div className="contact-avatar"><AvatarSkeleton /></div>
      <div style={{ flex: 1, marginLeft: 8 }}>
        <Skeleton width="60%" height={12} />
      </div>
    </div>
  );
}

// ─── Conversation card skeleton (matches ConversationCard layout) ─────────────
export function ConversationCardSkeleton() {
  return (
    <div className="conversation-skeleton" style={{
      display: 'flex',
      gap: 12,
      padding: '10px 12px',
      alignItems: 'center',
      borderBottom: '1px solid var(--fb-border)',
    }}>
      {/* Avatar + status dot */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <AvatarSkeleton size={48} />
        <div
          className="skeleton skeleton-avatar"
          style={{
            width: 12,
            height: 12,
            position: 'absolute',
            bottom: 1,
            right: 1,
            border: '2px solid white',
          }}
        />
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
          <Skeleton width="45%" height={13} />
          <Skeleton width="12%" height={11} />
        </div>
        <Skeleton width="72%" height={11} />
      </div>
    </div>
  );
}

// ─── Full conversation list skeleton ─────────────────────────────────────────
export function ConversationListSkeleton({ count = 5 }) {
  return (
    <div className="conversation-list">
      {/* Header */}
      <div style={{ padding: '16px 12px 10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Skeleton width="38%" height={22} />
          <Skeleton width={34} height={34} className="skeleton-avatar" />
        </div>
        {/* Search box */}
        <Skeleton width="100%" height={36} style={{ borderRadius: 20 }} />
      </div>

      {/* Filter pills */}
      <div style={{ display: 'flex', gap: 8, padding: '0 12px 10px' }}>
        <Skeleton width={55}  height={28} style={{ borderRadius: 20 }} />
        <Skeleton width={90}  height={28} style={{ borderRadius: 20 }} />
        <Skeleton width={90}  height={28} style={{ borderRadius: 20 }} />
      </div>

      {/* Items */}
      {Array.from({ length: count }).map((_, i) => (
        <ConversationCardSkeleton key={i} />
      ))}
    </div>
  );
}

// ─── Notification item skeleton ───────────────────────────────────────────────
export function NotificationItemSkeleton() {
  return (
    <div className="notification-skeleton" style={{
      display: 'flex',
      gap: 12,
      padding: 12,
      borderBottom: '1px solid var(--fb-border)',
      alignItems: 'center',
    }}>
      <AvatarSkeleton size={48} />
      <div style={{ flex: 1 }}>
        <Skeleton width="68%" height={13} style={{ marginBottom: 7 }} />
        <Skeleton width="38%" height={11} />
      </div>
      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
        <Skeleton width={32} height={32} className="skeleton-avatar" />
        <Skeleton width={32} height={32} className="skeleton-avatar" />
      </div>
    </div>
  );
}

// ─── Story skeleton ──────────────────────────────────────────────────────────
export function StorySkeleton() {
  return (
    <div className="story-card" style={{ background: 'var(--fb-gray)', borderRadius: 8 }}>
      <Skeleton width="100%" height="100%" style={{ borderRadius: 8 }} />
    </div>
  );
}

// ─── Dashboard skeleton ──────────────────────────────────────────────────────
export function DashboardSkeleton() {
  const StatCardSkeleton = () => (
    <div style={{
      background: 'white',
      borderRadius: 16,
      padding: 24,
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      border: '1px solid #E2E8F0',
      display: 'flex',
      alignItems: 'center',
      gap: 16,
    }}>
      <Skeleton width={48} height={48} className="skeleton-avatar" style={{ borderRadius: 12, flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <Skeleton width="60%" height={12} style={{ marginBottom: 8 }} />
        <Skeleton width="40%" height={22} />
      </div>
    </div>
  )

  const ActionSkeleton = () => (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 8,
      padding: 20,
      background: '#F8FAFC',
      borderRadius: 12,
    }}>
      <Skeleton width={24} height={24} className="skeleton-avatar" />
      <Skeleton width={70} height={12} />
    </div>
  )

  const ActivitySkeleton = () => (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      padding: 16,
      background: '#F8FAFC',
      borderRadius: 12,
      border: '1px solid #E2E8F0',
    }}>
      <Skeleton width={40} height={40} style={{ borderRadius: 10, flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <Skeleton width="70%" height={13} style={{ marginBottom: 6 }} />
        <Skeleton width="45%" height={11} />
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', padding: '40px 20px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <Skeleton width="45%" height={30} style={{ marginBottom: 10 }} />
          <Skeleton width="65%" height={16} />
        </div>

        {/* Stats Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 20,
          marginBottom: 32,
        }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>

        {/* Quick Actions */}
        <div style={{
          background: 'white',
          borderRadius: 20,
          padding: 32,
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          border: '1px solid #E2E8F0',
          marginBottom: 32,
        }}>
          <Skeleton width="25%" height={20} style={{ marginBottom: 20 }} />
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: 16,
          }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <ActionSkeleton key={i} />
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div style={{
          background: 'white',
          borderRadius: 20,
          padding: 32,
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          border: '1px solid #E2E8F0',
        }}>
          <Skeleton width="30%" height={20} style={{ marginBottom: 20 }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <ActivitySkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Page skeleton (matches Page.js layout) ────────────────────────────────────────────
export function PageSkeleton() {
  return (
    <div className="page-skeleton">
      {/* Cover */}
      <Skeleton height={280} style={{ borderRadius: '8px 8px 0 0' }} />
      
      {/* Header area */}
      <div style={{ padding: '0 16px 16px', background: 'var(--fb-white)', borderRadius: '0 0 8px 8px' }}>
        <div style={{ display: 'flex', gap: 20, marginTop: -48 }}>
          {/* Avatar */}
          <AvatarSkeleton size={120} />
          {/* Info */}
          <div style={{ flex: 1, paddingTop: 60 }}>
            <Skeleton width="40%" height={24} style={{ marginBottom: 8 }} />
            <Skeleton width="25%" height={14} style={{ marginBottom: 12 }} />
            <div style={{ display: 'flex', gap: 8 }}>
              <Skeleton width={100} height={36} style={{ borderRadius: 6 }} />
              <Skeleton width={100} height={36} style={{ borderRadius: 6 }} />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 24, marginTop: 24, borderTop: '1px solid var(--fb-border)', paddingTop: 12 }}>
          {['Publications', 'À propos', 'Photos', 'Vidéos', 'Événements', 'Avis'].map(() => (
            <Skeleton key={Math.random()} width={70} height={20} />
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16, marginTop: 16 }}>
        {/* Left sidebar */}
        <div>
          <div className="card" style={{ padding: 16, marginBottom: 12 }}>
            <Skeleton width="40%" height={18} style={{ marginBottom: 12 }} />
            <Skeleton width="80%" height={14} style={{ marginBottom: 8 }} />
            <Skeleton width="60%" height={14} />
          </div>
        </div>

        {/* Right - posts */}
        <div>
          <PostSkeleton />
          <PostSkeleton />
          <PostSkeleton />
        </div>
      </div>
    </div>
  );
}

// ─── Group page skeleton (matches group detail page) ───────────────────────────────
export function GroupPageSkeleton() {
  return (
    <div className="group-page-skeleton">
      <Skeleton height={200} style={{ borderRadius: 0 }} />
      
      <div style={{ padding: '0 16px 16px' }}>
        <div style={{ display: 'flex', gap: 20, marginTop: -40 }}>
          <AvatarSkeleton size={100} />
          <div style={{ flex: 1, paddingTop: 48 }}>
            <Skeleton width="35%" height={22} style={{ marginBottom: 8 }} />
            <Skeleton width="30%" height={14} style={{ marginBottom: 12 }} />
            <div style={{ display: 'flex', gap: 8 }}>
              <Skeleton width={90} height={36} style={{ borderRadius: 6 }} />
              <Skeleton width={90} height={36} style={{ borderRadius: 6 }} />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 16, marginTop: 24 }}>
          <Skeleton width={100} height={36} style={{ borderRadius: 6 }} />
          <Skeleton width={100} height={36} style={{ borderRadius: 6 }} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16, marginTop: 16 }}>
        <div>
          <div className="card" style={{ padding: 16 }}>
            <Skeleton width="50%" height={16} style={{ marginBottom: 12 }} />
            <TextSkeleton lines={4} />
          </div>
        </div>
        <div>
          <PostSkeleton />
          <PostSkeleton />
        </div>
      </div>
    </div>
  );
}

// ─── Full profile header + content skeleton ───────────────────────────────────
export function ProfileHeaderSkeleton() {
  return (
    <div>
      <div className="card" style={{ marginBottom: 0, borderRadius: '8px 8px 0 0', overflow: 'visible' }}>

        {/* Cover photo */}
        <Skeleton height={350} style={{ borderRadius: 0 }} />

        <div className="profile-info-section">
          <div className="profile-top">

            {/* Avatar — overlaps cover */}
            <div className="profile-avatar-wrapper">
              <div style={{
                width: 168,
                height: 168,
                borderRadius: '50%',
                border: '4px solid var(--fb-white)',
                marginTop: -84,
                overflow: 'hidden',
                flexShrink: 0,
              }}>
                <Skeleton width={168} height={168} className="skeleton-avatar" />
              </div>
            </div>

            {/* Name + friends count + action buttons */}
            <div className="profile-name-area">
              <Skeleton width={220} height={28} style={{ marginTop: 8, marginBottom: 8 }} />
              <Skeleton width={90}  height={14} style={{ marginBottom: 10 }} />
              <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                <Skeleton width={150} height={36} style={{ borderRadius: 6 }} />
                <Skeleton width={140} height={36} style={{ borderRadius: 6 }} />
                <Skeleton width={44}  height={36} style={{ borderRadius: 6 }} />
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="profile-tabs" style={{ borderTop: '1px solid var(--fb-border)', marginTop: 8 }}>
            {['Publications', 'À propos', 'Amis', 'Photos', 'Vidéos'].map(tab => (
              <div key={tab} className="profile-tab" style={{ minWidth: 80 }}>
                <Skeleton width="80%" height={14} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content area */}
      <div className="profile-content">
        {/* Left sidebar */}
        <div className="profile-left">
          <div className="info-card">
            <Skeleton width="40%" height={20} style={{ marginBottom: 16 }} />
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 12, alignItems: 'center' }}>
                <Skeleton width={20} height={16} />
                <Skeleton width="65%" height={14} />
              </div>
            ))}
          </div>
        </div>

        {/* Right — post skeletons */}
        <div className="profile-right">
          <div className="card" style={{ padding: 12, marginBottom: 12 }}>
            <PostSkeleton />
            <PostSkeleton />
          </div>
        </div>
      </div>
    </div>
  );
}