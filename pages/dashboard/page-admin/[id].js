import Layout from '../../../components/Layout'
import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/router'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChartLine, faUsers, faEye, faHeart, faComment, faShare, faStore, faBullhorn, faCalendarAlt, faNewspaper, faSync, faArrowLeft, faCog, faUserPlus, faMegaphone, faImage, faVideo, faEdit } from '@fortawesome/free-solid-svg-icons'
const { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Area, AreaChart, Legend, BarChart, Bar, Cell } = require('recharts')

const POLL_INTERVAL = 15000

export default function PageDashboard() {
  const router = useRouter()
  const { id } = router.query
  const [user, setUser] = useState(null)
  const [pageData, setPageData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [syncing, setSyncing] = useState(false)
  const [activityData, setActivityData] = useState([])
  const [activeTab, setActiveTab] = useState('overview')
  const emailRef = useRef(null)
  const intervalRef = useRef(null)

  const fetchPageDashboard = useCallback(async (pageId, showSyncIndicator = false) => {
    if (!pageId) return
    if (showSyncIndicator) setSyncing(true)
    try {
      const res = await fetch(`/api/page-dashboard/${pageId}`)
      if (!res.ok) {
        const err = await res.json()
        console.error('API error:', err)
        throw new Error('Failed to fetch page dashboard')
      }
      
      const data = await res.json()
      console.log('Page dashboard data:', data)
      
      if (data.page) {
        setPageData(data)
      }
      if (data.activity) {
        setActivityData(data.activity)
      }
      setLastUpdated(new Date())
    } catch (error) {
      console.error('Error fetching page dashboard:', error)
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
      } catch (e) {
        console.error('Error parsing user:', e)
        setLoading(false)
      }
    } else {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (id) {
      fetchPageDashboard(id)
      intervalRef.current = setInterval(() => {
        fetchPageDashboard(id, true)
      }, POLL_INTERVAL)
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [id, fetchPageDashboard])

  const StatCard = ({ icon, title, value, color, subtitle }) => (
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
        <div style={{ fontSize: 24, fontWeight: 700, color: '#0F172A' }}>{value?.toLocaleString() || 0}</div>
        {subtitle && <div style={{ fontSize: 12, color: '#94A3B8' }}>{subtitle}</div>}
      </div>
    </div>
  )

  if (loading) {
    return (
      <Layout>
        <div style={{ minHeight: '100vh', background: '#F8FAFC', padding: '40px 20px' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', textAlign: 'center' }}>
            <div style={{ color: '#64748B' }}>Chargement du tableau de bord...</div>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      <div style={{ minHeight: '100vh', background: '#F8FAFC', padding: '40px 20px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <button 
            onClick={() => router.back()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'none',
              border: 'none',
              color: '#64748B',
              fontSize: 14,
              cursor: 'pointer',
              marginBottom: 16
            }}
          >
            <FontAwesomeIcon icon={faArrowLeft} />
            Retour à la page
          </button>

          <div style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              {pageData?.page?.avatar && (
                <img 
                  src={pageData.page.avatar} 
                  alt={pageData.page.name}
                  style={{ width: 64, height: 64, borderRadius: 16, objectFit: 'cover' }}
                />
              )}
              <div>
                <h1 style={{ fontSize: 32, fontWeight: 700, margin: 0, color: '#0F172A' }}>
                  {pageData?.page?.name || 'Tableau de bord'}
                </h1>
                <p style={{ fontSize: 16, color: '#64748B', margin: '8px 0 0 0' }}>
                  Gestion de la page {pageData?.page?.category}
                </p>
              </div>
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 20,
            marginBottom: 32
          }}>
            <StatCard icon={faUsers} title="Abonnés" value={pageData?.stats?.followers} color="#3B82F6" />
            <StatCard icon={faHeart} title="J'aime" value={pageData?.stats?.likes} color="#EF4444" />
            <StatCard icon={faEye} title="Publications" value={pageData?.stats?.posts} color="#10B981" />
            <StatCard icon={faComment} title="Commentaires" value={pageData?.stats?.comments} color="#F59E0B" />
          </div>

          <div style={{ background: 'white', borderRadius: 20, padding: 32, boxShadow: '0 4px 20px rgba(0,0,0,0.08)', border: '1px solid #E2E8F0', marginBottom: 32 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: '#0F172A' }}>
                  Activité récente
                </h2>
                <p style={{ fontSize: 14, color: '#64748B', margin: '4px 0 0 0' }}>
                  Likes et commentaires des dernières 24h
                </p>
              </div>
              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 12, height: 12, background: '#3B82F6', borderRadius: 3 }}></span>
                  <span style={{ fontSize: 13, color: '#64748B' }}>Likes</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 12, height: 12, background: '#F59E0B', borderRadius: 3 }}></span>
                  <span style={{ fontSize: 13, color: '#64748B' }}>Commentaires</span>
                </div>
              </div>
            </div>
            <div style={{ width: '100%', height: 320 }}>
              {activityData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={activityData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorLikesPage" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.25}/>
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorCommentsPage" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.25}/>
                        <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                    <XAxis 
                      dataKey="date" 
                      stroke="#94A3B8" 
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      dy={10}
                    />
                    <YAxis 
                      stroke="#94A3B8" 
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      dx={-10}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        background: '#fff', 
                        border: '1px solid #E2E8F0', 
                        borderRadius: 12, 
                        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                        padding: '12px 16px'
                      }}
                      labelStyle={{ color: '#0F172A', fontWeight: 600, marginBottom: 4 }}
                      itemStyle={{ color: '#64748B', fontSize: 13 }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="likes" 
                      stroke="#3B82F6" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorLikesPage)" 
                      name="Likes"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="comments" 
                      stroke="#F59E0B" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorCommentsPage)" 
                      name="Commentaires"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94A3B8' }}>
                  Aucune activité récente
                </div>
              )}
            </div>
          </div>

          <div style={{
            background: 'white',
            borderRadius: 20,
            padding: 32,
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            border: '1px solid #E2E8F0'
          }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 20px 0', color: '#0F172A' }}>
              Publications récentes
            </h2>
            {pageData?.recentActivity?.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {pageData.recentActivity.map(activity => (
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
                        {activity.content || 'Publication'}
                      </div>
                      <div style={{ fontSize: 12, color: '#64748B' }}>
                        {activity.date}
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
                <div style={{ fontSize: 16 }}>Aucune publication récente</div>
                <div style={{ fontSize: 14, marginTop: 8 }}>Créez votre première publication pour voir les statistiques ici.</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}