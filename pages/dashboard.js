import Layout from '../components/Layout'
import { useEffect, useState, useRef, useCallback } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChartLine, faUsers, faEye, faHeart, faComment, faShare, faStore, faBullhorn, faCalendarAlt, faNewspaper, faSync } from '@fortawesome/free-solid-svg-icons'
import { DashboardSkeleton } from '../components/Skeleton'

const POLL_INTERVAL = 15000 // 15 seconds

export default function DashboardPage() {
  const [user, setUser] = useState(null)
  const [stats, setStats] = useState({
    followers: 0,
    views: 0,
    likes: 0,
    comments: 0,
    shares: 0
  })
  const [recentActivity, setRecentActivity] = useState([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [syncing, setSyncing] = useState(false)
  const emailRef = useRef(null)
  const intervalRef = useRef(null)

  const fetchDashboardData = useCallback(async (email, showSyncIndicator = false) => {
    if (!email) return
    if (showSyncIndicator) setSyncing(true)
    try {
      // Fetch user stats
      const userRes = await fetch(`/api/user?userEmail=${encodeURIComponent(email)}`)
      const userData = await userRes.json()

      if (userData.user) {
        setStats({
          followers: userData.user.followers?.length || 0,
          views: userData.user.profileViews || 0,
          likes: userData.user.totalLikes || 0,
          comments: userData.user.totalComments || 0,
          shares: userData.user.totalShares || 0
        })
      }

      // Fetch recent activity (posts, comments, etc.)
      const postsRes = await fetch(`/api/posts?userEmail=${encodeURIComponent(email)}&limit=5`)
      const postsData = await postsRes.json()

      if (postsData.posts) {
        const activities = postsData.posts.map(post => ({
          id: post.id,
          type: 'post',
          content: post.content?.substring(0, 50) + (post.content?.length > 50 ? '...' : ''),
          likes: post.likes?.length || 0,
          comments: post.comments?.length || 0,
          date: new Date(post.createdAt).toLocaleDateString('fr-FR')
        }))
        setRecentActivity(activities)
      }
      setLastUpdated(new Date())
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
      if (showSyncIndicator) setSyncing(false)
    }
  }, [])

  useEffect(() => {
    const u = localStorage.getItem('user')
    if (u) {
      try {
        const userData = JSON.parse(u)
        setUser(userData)
        emailRef.current = userData.email
        fetchDashboardData(userData.email)
      } catch (e) {
        console.error('Error parsing user:', e)
        setLoading(false)
      }
    } else {
      setLoading(false)
    }

    // Polling
    intervalRef.current = setInterval(() => {
      if (emailRef.current) {
        fetchDashboardData(emailRef.current, true)
      }
    }, POLL_INTERVAL)

    // Visibility API - pause when tab hidden
    function onVisibilityChange() {
      if (document.hidden) {
        clearInterval(intervalRef.current)
      } else if (emailRef.current) {
        fetchDashboardData(emailRef.current, true)
        intervalRef.current = setInterval(() => {
          if (emailRef.current) {
            fetchDashboardData(emailRef.current, true)
          }
        }, POLL_INTERVAL)
      }
    }
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      clearInterval(intervalRef.current)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [fetchDashboardData])

  const StatCard = ({ icon, title, value, color }) => (
    <div style={{
      background: 'white',
      borderRadius: 16,
      padding: 24,
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      border: '1px solid #E2E8F0',
      display: 'flex',
      alignItems: 'center',
      gap: 16
    }}>
      <div style={{
        width: 48,
        height: 48,
        background: color,
        borderRadius: 12,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <FontAwesomeIcon icon={icon} style={{ fontSize: 20, color: 'white' }} />
      </div>
      <div>
        <div style={{ fontSize: 14, color: '#64748B', marginBottom: 4 }}>{title}</div>
        <div style={{ fontSize: 24, fontWeight: 700, color: '#0F172A' }}>{value}</div>
      </div>
    </div>
  )

  if (loading) {
    return (
      <Layout>
        <DashboardSkeleton />
      </Layout>
    )
  }

  return (
    <Layout>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      <div style={{ minHeight: '100vh', background: '#F8FAFC', padding: '40px 20px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          {/* Header */}
          <div style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h1 style={{ fontSize: 32, fontWeight: 700, margin: 0, color: '#0F172A' }}>
                Tableau de bord professionnel
              </h1>
              <p style={{ fontSize: 16, color: '#64748B', margin: '8px 0 0 0' }}>
                Bienvenue, {user?.prenom || 'Utilisateur'} ! Voici vos statistiques et activités récentes.
              </p>
            </div>
            {lastUpdated && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 13,
                color: '#94A3B8',
                whiteSpace: 'nowrap'
              }}>
                <FontAwesomeIcon
                  icon={faSync}
                  style={{
                    fontSize: 12,
                    animation: syncing ? 'spin 1s linear infinite' : 'none',
                    color: syncing ? '#3B82F6' : '#94A3B8'
                  }}
                />
                Mis à jour {lastUpdated.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </div>
            )}
          </div>

          {/* Stats Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 20,
            marginBottom: 32
          }}>
            <StatCard icon={faUsers} title="Abonnés" value={stats.followers} color="#3B82F6" />
            <StatCard icon={faEye} title="Vues du profil" value={stats.views} color="#10B981" />
            <StatCard icon={faHeart} title="J'aime" value={stats.likes} color="#EF4444" />
            <StatCard icon={faComment} title="Commentaires" value={stats.comments} color="#F59E0B" />
            <StatCard icon={faShare} title="Partages" value={stats.shares} color="#8B5CF6" />
          </div>

          {/* Quick Actions */}
          <div style={{
            background: 'white',
            borderRadius: 20,
            padding: 32,
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            border: '1px solid #E2E8F0',
            marginBottom: 32
          }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 20px 0', color: '#0F172A' }}>
              Actions rapides
            </h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: 16
            }}>
              <a href="/marketplace" style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 8,
                padding: 20,
                background: '#F8FAFC',
                borderRadius: 12,
                textDecoration: 'none',
                color: '#0F172A',
                transition: 'all 0.2s'
              }}>
                <FontAwesomeIcon icon={faStore} style={{ fontSize: 24, color: '#F59E0B' }} />
                <span style={{ fontSize: 14, fontWeight: 500 }}>Marketplace</span>
              </a>
              <a href="/sponsors" style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 8,
                padding: 20,
                background: '#F8FAFC',
                borderRadius: 12,
                textDecoration: 'none',
                color: '#0F172A',
                transition: 'all 0.2s'
              }}>
                <FontAwesomeIcon icon={faBullhorn} style={{ fontSize: 24, color: '#3B82F6' }} />
                <span style={{ fontSize: 14, fontWeight: 500 }}>Sponsors</span>
              </a>
              <a href="/evenements" style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 8,
                padding: 20,
                background: '#F8FAFC',
                borderRadius: 12,
                textDecoration: 'none',
                color: '#0F172A',
                transition: 'all 0.2s'
              }}>
                <FontAwesomeIcon icon={faCalendarAlt} style={{ fontSize: 24, color: '#EF4444' }} />
                <span style={{ fontSize: 14, fontWeight: 500 }}>Événements</span>
              </a>
              <a href="/page" style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 8,
                padding: 20,
                background: '#F8FAFC',
                borderRadius: 12,
                textDecoration: 'none',
                color: '#0F172A',
                transition: 'all 0.2s'
              }}>
                <FontAwesomeIcon icon={faNewspaper} style={{ fontSize: 24, color: '#10B981' }} />
                <span style={{ fontSize: 14, fontWeight: 500 }}>Pages</span>
              </a>
            </div>
          </div>

          {/* Recent Activity */}
          <div style={{
            background: 'white',
            borderRadius: 20,
            padding: 32,
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            border: '1px solid #E2E8F0'
          }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 20px 0', color: '#0F172A' }}>
              Activité récente
            </h2>
            {recentActivity.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {recentActivity.map(activity => (
                  <div key={activity.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    padding: 16,
                    background: '#F8FAFC',
                    borderRadius: 12,
                    border: '1px solid #E2E8F0'
                  }}>
                    <div style={{
                      width: 40,
                      height: 40,
                      background: '#3B82F6',
                      borderRadius: 10,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <FontAwesomeIcon icon={faChartLine} style={{ fontSize: 16, color: 'white' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 500, color: '#0F172A', marginBottom: 4 }}>
                        {activity.content}
                      </div>
                      <div style={{ fontSize: 12, color: '#64748B' }}>
                        {activity.date} • {activity.likes} j'aime • {activity.comments} commentaires
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{
                textAlign: 'center',
                padding: 40,
                color: '#64748B'
              }}>
                <FontAwesomeIcon icon={faChartLine} style={{ fontSize: 48, marginBottom: 16, color: '#CBD5E1' }} />
                <div style={{ fontSize: 16 }}>Aucune activité récente</div>
                <div style={{ fontSize: 14, marginTop: 8 }}>Commencez à publier du contenu pour voir vos statistiques ici.</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}
