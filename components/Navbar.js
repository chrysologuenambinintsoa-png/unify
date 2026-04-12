import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'

import Dropdown from './Dropdown'
import ClickableAvatar from './ClickableAvatar'
import { MessageInbox } from './messages'
import { useTranslation } from '../hooks/useTranslation'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faRotate } from '@fortawesome/free-solid-svg-icons'

export default function Navbar({ sidebarOpen, setSidebarOpen }) {
  const router = useRouter()
  const { t, locale } = useTranslation()
  const [darkMode, setDarkMode] = useState(false)
  const [openId, setOpenId] = useState(null)
  const [notifLoading, setNotifLoading] = useState(false)
  const [user, setUser] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState(null)
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchTab, setSearchTab] = useState('all')
  const [showSearchDrop, setShowSearchDrop] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [isSmallMobile, setIsSmallMobile] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [toastNotifications, setToastNotifications] = useState([])
  const [recentSearches] = useState([])
  const defaultSuggestions = [
    { text: t('navbar.recentSearches1'), icon: 'fa-newspaper', action: () => router.push('/actualites') },
    { text: t('navbar.recentSearches2'), icon: 'fa-calendar', action: () => router.push('/evenements') },
    { text: t('navbar.recentSearches3'), icon: 'fa-users', action: () => router.push('/groupes') }
  ]
  const [showMessages, setShowMessages] = useState(false)
  
  const rootRef = useRef(null)
  const searchRef = useRef(null)
  const searchTimeoutRef = useRef(null)
  const userRef = useRef(user)
  
  userRef.current = user
  
  // Memoize user email to prevent unnecessary effect re-runs
  const userEmail = useMemo(() => user?.email || null, [user?.email])

  useEffect(() => {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      const userData = JSON.parse(userStr)
      console.log('👤 User loaded from localStorage:', userData?.email);
      setUser(userData)
    }
    function onUserUpdated() {
      const u = localStorage.getItem('user')
      console.log('👤 User updated event received:', u ? JSON.parse(u)?.email : 'null');
      setUser(u ? JSON.parse(u) : null)
    }
    window.addEventListener('userUpdated', onUserUpdated)
    
    // Initialize dark mode from localStorage
    const savedTheme = localStorage.getItem('unify-theme')
    if (savedTheme === 'dark') {
      setDarkMode(true)
      document.body.classList.add('dark')
    }
    
    // Listen for theme changes from other components
    function onThemeChanged() {
      const theme = localStorage.getItem('unify-theme')
      if (theme === 'dark') {
        setDarkMode(true)
        document.body.classList.add('dark')
      } else {
        setDarkMode(false)
        document.body.classList.remove('dark')
      }
    }
    window.addEventListener('themeChanged', onThemeChanged)
    
    // Screen size detection for search bar adaptation
    function handleResize() {
      setIsMobile(window.innerWidth <= 768)
      setIsSmallMobile(window.innerWidth <= 480)
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    
    return () => {
      window.removeEventListener('userUpdated', onUserUpdated)
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  useEffect(()=>{
    function onDoc(e){
      if(!rootRef.current) return
      if(!rootRef.current.contains(e.target)) setOpenId(null)
      if(searchRef.current && !searchRef.current.contains(e.target)) setShowSearchDrop(false)
    }
    document.addEventListener('mousedown', onDoc)
    return ()=> document.removeEventListener('mousedown', onDoc)
  },[])

  // Search function with debounce
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(null)
      setSearchLoading(false)
      clearTimeout(searchTimeoutRef.current)
      return
    }

    setSearchLoading(true)
    clearTimeout(searchTimeoutRef.current)

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const type = searchTab === 'all' ? '' : `&type=${searchTab}`
        const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}${type}`)
        if (!res.ok) {
          setSearchResults({ users: [], actualites: [], groupes: [], pages: [] })
          return
        }
        const data = await res.json()
        setSearchResults(data)
      } catch (e) {
        console.error('Search error:', e)
        setSearchResults({ users: [], actualites: [], groupes: [], pages: [] })
      } finally {
        setSearchLoading(false)
      }
    }, 300)

    return () => clearTimeout(searchTimeoutRef.current)
  }, [searchQuery, searchTab])

  // Map notification API data to UI format
  const mapNotification = (n) => {
    const actorName = n.actor ? `${n.actor.prenom || ''} ${n.actor.nom || ''}`.trim() : ''
    const actorAvatar = n.actor ? (n.actor.avatarUrl || n.actor.avatar || (n.actor.prenom ? n.actor.prenom[0] : '')) : '🔔'
    
    let action = ''
    switch (n.type) {
      case 'like':
        if (n.content?.includes('photo')) action = t('notifications.likedPhoto')
        else if (n.content?.includes('couverture')) action = t('notifications.likedCover')
        else if (n.content?.includes('profile')) action = t('notifications.likedProfile')
        else if (n.content?.includes('publication')) action = t('notifications.likedPost')
        else action = t('notifications.likedYourPost')
        break
      case 'comment': action = t('notifications.commentedPost'); break
      case 'reply': action = t('notifications.repliedComment'); break
      case 'mention': action = t('notifications.taggedYou'); break
      case 'friend-request': action = t('notifications.sentFriendRequest'); break
      case 'friend-accepted': action = t('notifications.acceptedFriendRequest'); break
      case 'friend-suggestion': action = t('notifications.newFriendSuggestion'); break
      case 'reaction': action = t('notifications.reactedPhoto'); break
      case 'message': action = t('notifications.sentMessage'); break
      default: action = n.content || n.type
    }
    
    // Format relative time
    const now = new Date()
    const notifDate = new Date(n.createdAt)
    const diffMs = now - notifDate
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)
    
    let timeStr = ''
    if (diffMins < 1) timeStr = t('notifications.justNow')
    else if (diffMins < 60) timeStr = t('notifications.minutesAgo', { minutes: diffMins })
    else if (diffHours < 24) timeStr = t('notifications.hoursAgo', { hours: diffHours })
    else if (diffDays === 1) timeStr = t('notifications.yesterday')
    else if (diffDays < 7) timeStr = t('notifications.daysAgo', { days: diffDays })
    else timeStr = notifDate.toLocaleDateString(locale)
    
    return {
      id: n.id,
      avatar: actorAvatar,
      userName: actorName,
      action: action,
      content: n.content || '',
      time: timeStr,
      read: n.read,
      type: n.type,
      url: n.url || '#',
      actorId: n.actor?.id
    }
  }

  // Mark all as read
  const markAllRead = async () => {
    if (!user?.email) return
    try {
      await fetch('/api/notifications', { 
        method: 'PUT', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ all: true, userEmail: user.email }) 
      })
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    } catch (e) {
      console.error('mark all read failed', e)
    }
  }

  // Mark single as read
  const markAsRead = async (id) => {
    try {
      await fetch('/api/notifications', { 
        method: 'PUT', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ id, read: true, userEmail: user?.email }) 
      })
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    } catch (e) {
      console.error('mark as read failed', e)
    }
  }

  // Delete a notification
  const deleteNotification = async (id, e) => {
    e.stopPropagation()
    try {
      await fetch('/api/notifications', { 
        method: 'DELETE', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ id, userEmail: user?.email }) 
      })
      setNotifications(prev => prev.filter(n => n.id !== id))
    } catch (e) {
      console.error('delete notification failed', e)
    }
  }

  // Accept friend request - use existing amis.js endpoint
  const acceptFriendRequest = async (actorId, notifId) => {
    try {
      // Call amis.js with action=add to accept the friend request
      await fetch('/api/amis.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userEmail: user?.email, friendId: actorId, action: 'add' })
      })
      // Remove the notification
      await fetch('/api/notifications', { 
        method: 'DELETE', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ id: notifId, userEmail: user?.email }) 
      })
      setNotifications(prev => prev.filter(n => n.id !== notifId))
    } catch (e) {
      console.error('accept friend request failed', e)
    }
  }

  // Decline friend request - just remove the notification (don't create friendship)
  const declineFriendRequest = async (actorId, notifId) => {
    try {
      // For decline, we just remove the notification (no friendship created)
      await fetch('/api/notifications', { 
        method: 'DELETE', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ id: notifId, userEmail: user?.email }) 
      })
      setNotifications(prev => prev.filter(n => n.id !== notifId))
    } catch (e) {
      console.error('decline friend request failed', e)
    }
  }

  // Poll notifications every 10 seconds (like Facebook)
  useEffect(() => {
    if (!userEmail) return
    let mounted = true
    let intervalId = null
    
    async function fetchNotifications() {
      try {
        setNotifLoading(true)
        const res = await fetch(`/api/notifications?userEmail=${encodeURIComponent(userEmail)}`)
        const data = await res.json()
        if (mounted && data.notifications && Array.isArray(data.notifications)) {
          const mapped = data.notifications.map(mapNotification)
          
          // Only update if there are actually changes
          setNotifications(prev => {
            // Simple comparison: check if length changed or IDs are different
            const prevIds = new Set(prev.map(n => n.id))
            const newIds = new Set(mapped.map(n => n.id))
            const hasNewItems = mapped.some(n => !prevIds.has(n.id))
            const hasRemovedItems = prev.some(n => !newIds.has(n.id))
            
            // Only detect new unread for toast (not all changes)
            if (hasNewItems || hasRemovedItems) {
              const newUnread = mapped.filter(n => !n.read && !prevIds.has(n.id))
              
              // Show toast for new unread notifications
              if (newUnread.length > 0) {
                setToastNotifications(prevToasts => [...prevToasts, ...newUnread])
                // Auto-remove toast after 5 seconds
                setTimeout(() => {
                  setToastNotifications(t => t.filter(toast => !newUnread.find(n => n.id === toast.id)))
                }, 5000)
              }
              
              return mapped
            }
            return prev
          })
        }
      } catch (e) {
        console.error('Failed to fetch notifications:', e)
      } finally {
        if (mounted) setNotifLoading(false)
      }
    }
    
    // Initial fetch
    fetchNotifications()
    
    // Set up interval after initial fetch
    intervalId = setInterval(fetchNotifications, 10000)
    
    return () => { 
      mounted = false 
      if (intervalId) clearInterval(intervalId)
    }
  }, [userEmail])

  function toggle(id) {
    setOpenId(prev => (prev === id ? null : id))
  }

  function handleNotificationClick(e){
    e.stopPropagation()
    toggle('notif')
  }

  function handleProfileClick(e){
    e.stopPropagation()
    toggle('profile')
  }

  function handleLogout(e) {
    e?.stopPropagation()
    
    // Sauvegarder le compte courant dans savedAccounts avant déconnexion
    const currentUserStr = localStorage.getItem('user')
    if (currentUserStr) {
      try {
        const currentUser = JSON.parse(currentUserStr)
        const currentSavedAccounts = localStorage.getItem('savedAccounts')
        let accounts = currentSavedAccounts ? JSON.parse(currentSavedAccounts) : []
        
        // Éviter les doublons
        accounts = accounts.filter(a => a.email !== currentUser.email)
        accounts.unshift(currentUser)
        
        localStorage.setItem('savedAccounts', JSON.stringify(accounts))
        console.log('✅ Compte sauvegardé dans savedAccounts')
      } catch (err) {
        console.error('Erreur lors de la sauvegarde:', err)
      }
    }
    
    localStorage.removeItem('user')
    localStorage.removeItem('token')
    setUser(null)
    setOpenId(null)
    router.push('/account-picker')
  }

  return (
    <nav className="navbar" ref={rootRef}>
      <div className="navbar-left" style={{display:'flex',alignItems:'center',gap:12}}>
        <button 
          className="sidebar-toggle-btn" 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          style={{display:'none',background:'none',border:'none',cursor:'pointer',fontSize:22,color:'#D4A017',padding:'8px 10px'}}
          title={t('navbar.menu')}
        >
          <i className="fas fa-bars"></i>
        </button>
        <div style={{display:'flex',alignItems:'center',gap:16}}>
          <Link href="/" className="navbar-logo" style={{display:'flex',alignItems:'center',justifyContent:'center',width:48,height:48,padding:0,borderRadius:'50%',background:'transparent',transition:'all 0.3s ease'}} onMouseEnter={(e)=>{e.currentTarget.style.transform='scale(1.05)'}} onMouseLeave={(e)=>{e.currentTarget.style.transform='scale(1)'}}>
            <img src="/logo.svg" alt="Unify Logo" style={{width:44,height:44,filter:'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'}} />
          </Link>
          <span style={{fontSize:36,fontWeight:700,color:'#B8860B',letterSpacing:'-0.5px',fontFamily:'Arial, sans-serif',textShadow:'0 2px 4px rgba(0,0,0,0.15)'}}>Unify</span>
        </div>
      </div>

      <div className="navbar-center" style={{display:'flex',alignItems:'center',justifyContent:'center',flex:'1',maxWidth:600,padding:'0 8px'}}>
        <div className="fb-search" ref={searchRef}>
          <div className={`fb-search__pill${showSearchDrop ? ' fb-search__pill--open' : ''}`}>
            <span className="fb-search__icon-wrap">
              <i className="fa fa-search fb-search__icon"></i>
            </span>
            <input
              type="text"
              className="fb-search__input"
              placeholder={isSmallMobile ? '🔍' : isMobile ? t('navbar.search') : t('navbar.searchPlaceholder')}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onFocus={() => setShowSearchDrop(true)}
              autoComplete="off"
            />
            {searchQuery && (
              <button
                className="fb-search__clear"
                onMouseDown={e => { e.preventDefault(); setSearchQuery('') }}
                title={t('navbar.clear')}
              >
                <i className="fa fa-times"></i>
              </button>
            )}
          </div>

          {showSearchDrop && (
            <div className="fb-search__dropdown">
              {searchQuery ? (
                <>
                  {/* Search Tabs */}
                  <div className="fb-search__tabs-container" style={{display:'flex',gap:4,padding:'8px',borderBottom:'1px solid var(--fb-border)',overflowX:'auto',flexWrap:'wrap',WebkitOverflowScrolling:'touch'}}>
                    <button
                      onMouseDown={() => setSearchTab('all')}
                      style={{
                        padding:'6px 12px',
                        background: searchTab === 'all' ? 'var(--fb-blue)' : 'transparent',
                        color: searchTab === 'all' ? 'white' : 'var(--fb-text)',
                        border: searchTab === 'all' ? 'none' : '1px solid var(--fb-border)',
                        borderRadius:4,
                        cursor:'pointer',
                        fontSize:12,
                        fontWeight:500,
                        transition:'all 0.2s'
                      }}
                    >
                      {t('navbar.all')}
                    </button>
                    <button
                      onMouseDown={() => setSearchTab('users')}
                      style={{
                        padding:'6px 12px',
                        background: searchTab === 'users' ? 'var(--fb-blue)' : 'transparent',
                        color: searchTab === 'users' ? 'white' : 'var(--fb-text)',
                        border: searchTab === 'users' ? 'none' : '1px solid var(--fb-border)',
                        borderRadius:4,
                        cursor:'pointer',
                        fontSize:12,
                        fontWeight:500,
                        transition:'all 0.2s'
                      }}
                    >
                      {t('navbar.people')}
                    </button>
                    <button
                      onMouseDown={() => setSearchTab('actualites')}
                      style={{
                        padding:'6px 12px',
                        background: searchTab === 'actualites' ? 'var(--fb-blue)' : 'transparent',
                        color: searchTab === 'actualites' ? 'white' : 'var(--fb-text)',
                        border: searchTab === 'actualites' ? 'none' : '1px solid var(--fb-border)',
                        borderRadius:4,
                        cursor:'pointer',
                        fontSize:12,
                        fontWeight:500,
                        transition:'all 0.2s'
                      }}
                    >
                      {t('navbar.news')}
                    </button>
                    <button
                      onMouseDown={() => setSearchTab('groupes')}
                      style={{
                        padding:'6px 12px',
                        background: searchTab === 'groupes' ? 'var(--fb-blue)' : 'transparent',
                        color: searchTab === 'groupes' ? 'white' : 'var(--fb-text)',
                        border: searchTab === 'groupes' ? 'none' : '1px solid var(--fb-border)',
                        borderRadius:4,
                        cursor:'pointer',
                        fontSize:12,
                        fontWeight:500,
                        transition:'all 0.2s'
                      }}
                    >
                      {t('navbar.groups')}
                    </button>
                  </div>

                  {/* Search Results */}
                  <div className="fb-search__results-container" style={{maxHeight:'calc(100vh - 200px)',overflowY:'auto',WebkitOverflowScrolling:'touch'}}>
                    {searchLoading ? (
                      <div style={{padding:16,textAlign:'center',color:'var(--fb-text-secondary)'}}>
                        <i className="fa fa-spinner fa-spin" style={{marginRight:8}}></i>
                        {t('navbar.searching')}
                      </div>
                    ) : searchResults ? (
                      <>
                        {/* All Tab */}
                        {searchTab === 'all' && (
                          <>
                            {searchResults.users?.length > 0 && (
                              <>
                                <div style={{padding:'8px 12px',fontSize:12,fontWeight:700,color:'var(--fb-text-secondary)',background:'var(--fb-bg)'}}>
                                  {t('navbar.people')} ({searchResults.users.length})
                                </div>
                                {searchResults.users.map(u => (
                                  <div
                                    key={u.id}
                                    className="fb-search__item"
                                    onMouseDown={() => { router.push(`/profile?id=${u.id}`); setShowSearchDrop(false) }}
                                  >
                                    <div style={{width:32,height:32,borderRadius:'50%',background:u.avatar ? `url(${u.avatar})` : 'var(--fb-bg)',backgroundSize:'cover',backgroundPosition:'center'}}></div>
                                    <div style={{flex:1}}>
                                      <div style={{fontSize:13,fontWeight:500,color:'var(--fb-text)'}}>{u.name}</div>
                                      <div style={{fontSize:12,color:'var(--fb-text-secondary)'}}>{u.username || u.email}</div>
                                    </div>
                                  </div>
                                ))}
                              </>
                            )}
                            {searchResults.actualites?.length > 0 && (
                              <>
                                <div style={{padding:'8px 12px',fontSize:12,fontWeight:700,color:'var(--fb-text-secondary)',background:'var(--fb-bg)',marginTop:8}}>
                                  {t('navbar.news')} ({searchResults.actualites.length})
                                </div>
                                {searchResults.actualites.map(a => (
                                  <div
                                    key={a.id}
                                    className="fb-search__item"
                                    onMouseDown={() => { setShowSearchDrop(false) }}
                                  >
                                    <div className="fb-search__item-icon">
                                      <i className="fa fa-newspaper"></i>
                                    </div>
                                    <div style={{flex:1}}>
                                      <div style={{fontSize:13,fontWeight:500,color:'var(--fb-text)'}}>{a.title}</div>
                                      <div style={{fontSize:12,color:'var(--fb-text-secondary)'}}>{a.author}</div>
                                    </div>
                                  </div>
                                ))}
                              </>
                            )}
                            {searchResults.groupes?.length > 0 && (
                              <>
                                <div style={{padding:'8px 12px',fontSize:12,fontWeight:700,color:'var(--fb-text-secondary)',background:'var(--fb-bg)',marginTop:8}}>
                                  {t('navbar.groups')} ({searchResults.groupes.length})
                                </div>
                                {searchResults.groupes.map(g => (
                                  <div
                                    key={g.id}
                                    className="fb-search__item"
                                    onMouseDown={() => { router.push(`/groupes/${g.id}`); setShowSearchDrop(false) }}
                                  >
                                    <div className="fb-search__item-icon" style={{background:'linear-gradient(135deg,#667eea,#764ba2)'}}>
                                      <i className="fa fa-users"></i>
                                    </div>
                                    <div style={{flex:1}}>
                                      <div style={{fontSize:13,fontWeight:500,color:'var(--fb-text)'}}>{g.name}</div>
                                      <div style={{fontSize:12,color:'var(--fb-text-secondary)'}}>{g.memberCount} {t('navbar.members')}</div>
                                    </div>
                                  </div>
                                ))}
                              </>
                            )}
                            {!searchResults.users?.length && !searchResults.actualites?.length && !searchResults.groupes?.length && (
                              <div style={{padding:16,textAlign:'center',color:'var(--fb-text-secondary)'}}>
                                {t('navbar.noResults')}
                              </div>
                            )}
                          </>
                        )}

                        {/* Users Tab */}
                        {searchTab === 'users' && (
                          <>
                            {searchResults.users?.length > 0 ? (
                              searchResults.users.map(u => (
                                <div
                                  key={u.id}
                                  className="fb-search__item"
                                  onMouseDown={() => { router.push(`/profile?id=${u.id}`); setShowSearchDrop(false) }}
                                >
                                  <div style={{width:36,height:36,borderRadius:'50%',background:u.avatar ? `url(${u.avatar})` : 'linear-gradient(135deg,#667eea,#764ba2)',backgroundSize:'cover',backgroundPosition:'center',display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontWeight:700}}>
                                    {!u.avatar && u.name[0]}
                                  </div>
                                  <div style={{flex:1}}>
                                    <div style={{fontSize:14,fontWeight:500,color:'var(--fb-text)'}}>{u.name}</div>
                                    <div style={{fontSize:12,color:'var(--fb-text-secondary)'}}>{u.username || u.email}</div>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div style={{padding:16,textAlign:'center',color:'var(--fb-text-secondary)'}}>
                                {t('navbar.noPeopleFound')}
                              </div>
                            )}
                          </>
                        )}

                        {/* Actualites Tab */}
                        {searchTab === 'actualites' && (
                          <>
                            {searchResults.actualites?.length > 0 ? (
                              searchResults.actualites.map(a => (
                                <div
                                  key={a.id}
                                  className="fb-search__item"
                                  onMouseDown={() => { setShowSearchDrop(false) }}
                                >
                                  <div className="fb-search__item-icon">
                                    <i className="fa fa-newspaper"></i>
                                  </div>
                                  <div style={{flex:1}}>
                                    <div style={{fontSize:13,fontWeight:500,color:'var(--fb-text)'}}>{a.title}</div>
                                    <div style={{fontSize:12,color:'var(--fb-text-secondary)'}}>{a.author}</div>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div style={{padding:16,textAlign:'center',color:'var(--fb-text-secondary)'}}>
                                {t('navbar.noNewsFound')}
                              </div>
                            )}
                          </>
                        )}

                        {/* Groupes Tab */}
                        {searchTab === 'groupes' && (
                          <>
                            {searchResults.groupes?.length > 0 ? (
                              searchResults.groupes.map(g => (
                                <div
                                  key={g.id}
                                  className="fb-search__item"
                                  onMouseDown={() => { router.push(`/groupes/${g.id}`); setShowSearchDrop(false) }}
                                >
                                  <div className="fb-search__item-icon" style={{background:'linear-gradient(135deg,#667eea,#764ba2)'}}>
                                    <i className="fa fa-users"></i>
                                  </div>
                                  <div style={{flex:1}}>
                                    <div style={{fontSize:13,fontWeight:500,color:'var(--fb-text)'}}>{g.name}</div>
                                    <div style={{fontSize:12,color:'var(--fb-text-secondary)'}}>{g.memberCount} {t('navbar.members')}</div>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div style={{padding:16,textAlign:'center',color:'var(--fb-text-secondary)'}}>
                                {t('navbar.noGroupsFound')}
                              </div>
                            )}
                          </>
                        )}
                      </>
                    ) : (
                      <div style={{padding:16,textAlign:'center',color:'var(--fb-text-secondary)'}}>
                        {t('navbar.noResults')}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <p className="fb-search__drop-title">{t('navbar.recentSearches')}</p>
                  {(recentSearches.length > 0 ? recentSearches : defaultSuggestions).map((item, i) => (
                    <div
                      key={i}
                      className="fb-search__item"
                      onMouseDown={() => { 
                        if (recentSearches.length > 0) {
                          setSearchQuery(item); 
                          setShowSearchDrop(true);
                        } else {
                          item.action();
                          setShowSearchDrop(false);
                        }
                      }}
                    >
                      <div className="fb-search__item-icon fb-search__item-icon--recent">
                        <i className={`fa ${recentSearches.length > 0 ? 'fa-history' : item.icon}`}></i>
                      </div>
                      <span className="fb-search__item-label">{recentSearches.length > 0 ? item : item.text}</span>
                      {recentSearches.length > 0 && (
                        <button
                          className="fb-search__item-remove"
                          onMouseDown={e => { e.stopPropagation() }}
                          title={t('navbar.delete')}
                        >
                          <i className="fa fa-times"></i>
                        </button>
                      )}
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="navbar-right">
        <Link href="/">
          <button className="nav-icon-btn dark" title={t('navbar.home')}><i className="fas fa-home"></i></button>
        </Link>

        <button className="nav-icon-btn dark" onClick={() => setShowMessages(true)} title={t('navbar.messages')}>
          <i className="fas fa-comment"></i>
        </button>

        <button className="nav-icon-btn dark" onClick={handleNotificationClick} title={t('navbar.notifications')}>
            <i className="fas fa-bell"></i>
            {(() => {
              const count = notifications.filter(n => !n.read).length;
              return count > 0 && (
                <span 
                  className="badge" 
                  data-count={count > 99 ? '3' : count.toString().length.toString()}
                  data-overflow={count > 99 ? 'true' : 'false'}
                >
                  {count > 99 ? '99+' : count}
                </span>
              );
            })()}
          </button>
          <Dropdown open={openId==='notif'}>
            <div className="notif-dropdown" style={{width:360,maxHeight:480,background:'white',borderRadius:8,boxShadow:'0 2px 12px rgba(0,0,0,0.15)',border:'1px solid var(--fb-border)'}}>
              <div style={{padding:'12px 16px',borderBottom:'1px solid var(--fb-border)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <h3 style={{margin:0,fontSize:18,fontWeight:700,color:'var(--fb-text)'}}>{t('navbar.notifications')}</h3>
                <button style={{background:'transparent',border:'none',cursor:'pointer',color:'var(--fb-blue)',fontSize:13,fontWeight:600}} onClick={(e)=>{ e.stopPropagation(); router.push('/notifications') }}>
                  {t('navbar.viewAll')}
                </button>
              </div>
              {notifLoading && notifications.length === 0 ? (
                <div style={{padding:20,textAlign:'center'}}>
                  <div style={{width:24,height:24,border:'3px solid #ddd',borderTop:'3px solid var(--fb-blue)',borderRadius:'50%',animation:'spin 1s linear infinite',margin:'0 auto'}}></div>
                </div>
              ) : (
                <React.Fragment>
                  {notifications.filter(n => !n.read).length > 0 && (
                    <p style={{padding:'8px 16px 4px',fontSize:13,fontWeight:700,color:'var(--fb-blue)',margin:0}}>{t('navbar.newNotifications')}</p>
                  )}
                  <div style={{maxHeight:360,overflowY:'auto'}}>
                {notifications.length === 0 ? (
                  <div style={{padding:'8px',color:'var(--fb-text-secondary)'}}>{t('navbar.noNotifications')}</div>
                ) : (
                  notifications.slice(0,8).map(notif => {
                    const getIconClass = () => {
                      if(notif.action?.includes('aimé')) return 'blue'
                      if(notif.action?.includes('commenté') || notif.action?.includes('réagi')) return 'red'
                      if(notif.action?.includes('accepté') || notif.action?.includes('suivre')) return 'green'
                      return 'blue'
                    }
                    const getIconSymbol = () => {
                      if(notif.action?.includes('aimé')) return '👍'
                      if(notif.action?.includes('commenté')) return '💬'
                      if(notif.action?.includes('accepté')) return '✓'
                      if(notif.action?.includes('anniversaire')) return '🎂'
                      return '💙'
                    }
                    return (
                      <div key={notif.id} className={`notif-item ${!notif.read ? 'unread' : ''}`} onClick={() => { if(!notif.read) markAsRead(notif.id); if(notif.url) window.location.href = notif.url }} style={{position:'relative', paddingBottom: notif.type === 'friend-request' ? 8 : 12}}>
                        <div className="notif-avatar">
                          <div className="avatar-placeholder" style={{background:'linear-gradient(135deg, #667eea, #764ba2)'}}>
                            {notif.avatar}
                          </div>
                          <span className={`notif-icon ${getIconClass()}`}>{getIconSymbol()}</span>
                        </div>
                        <div className="notif-text">
                          <p><strong>{notif.userName}</strong> {notif.action} {notif.content && `votre ${notif.content}`}</p>
                          <span>{notif.time}</span>
                        </div>
                        {!notif.read && <div className="notif-dot"></div>}
                        
                        {/* Friend request action buttons (Facebook-style) */}
                        {notif.type === 'friend-request' && (
                          <div style={{display:'flex', gap: 8, marginTop: 8, paddingLeft: 52}} onClick={e => e.stopPropagation()}>
                            <button 
                              onClick={() => acceptFriendRequest(notif.actorId, notif.id)}
                              style={{
                                flex: 1,
                                padding: '6px 12px',
                                borderRadius: 6,
                                border: 'none',
                                background: 'var(--fb-blue)',
                                color: 'white',
                                fontWeight: 600,
                                fontSize: 13,
                                cursor: 'pointer',
                                transition: 'background 0.2s'
                              }}
                              onMouseEnter={e => e.currentTarget.style.background = '#0a2e6b'}
                              onMouseLeave={e => e.currentTarget.style.background = 'var(--fb-blue)'}
                            >
                              {t('navbar.confirm')}
                            </button>
                            <button 
                              onClick={() => declineFriendRequest(notif.actorId, notif.id)}
                              style={{
                                flex: 1,
                                padding: '6px 12px',
                                borderRadius: 6,
                                border: '1px solid var(--fb-border)',
                                background: 'transparent',
                                color: 'var(--fb-text)',
                                fontWeight: 600,
                                fontSize: 13,
                                cursor: 'pointer',
                                transition: 'background 0.2s'
                              }}
                              onMouseEnter={e => e.currentTarget.style.background = 'var(--fb-hover)'}
                              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            >
                              {t('navbar.decline')}
                            </button>
                          </div>
                        )}
                        
                        <button 
                          className="notif-delete-btn"
                          onClick={(e) => deleteNotification(notif.id, e)}
                          title={t('navbar.delete')}
                          style={{position:'absolute',top:8,right:8,background:'transparent',border:'none',color:'var(--fb-text-secondary)',cursor:'pointer',opacity:0.5,fontSize:12,padding:4}}
                          onMouseEnter={(e)=>e.currentTarget.style.opacity=1}
                          onMouseLeave={(e)=>e.currentTarget.style.opacity=0.5}
                        >
                          ✕
                        </button>
                      </div>
                    )
                  })
                )}
              </div>
                </React.Fragment>
              )}
            </div>
          </Dropdown>
        </div>

        <div className="navbar-dropdown" style={{position:'relative'}}>
          <button className="nav-icon-btn dark" onClick={handleProfileClick} title={t('navbar.profile')} style={{padding: 0, overflow: 'hidden'}}>
            <ClickableAvatar 
              user={user} 
              size="header" 
              disableNavigation={true}
              style={{ cursor: 'pointer' }}
            />
          </button>
          <Dropdown open={openId==='profile'}>
            <div style={{padding:8,minWidth:260}}>
              {user ? (
                <div>
                  <div style={{display:'flex',alignItems:'center',gap:12,paddingBottom:8,borderBottom:'1px solid var(--fb-border)',cursor:'pointer',padding:8,borderRadius:8}} onClick={()=>{ setOpenId(null); router.push('/profile') }} onMouseEnter={(e)=>e.currentTarget.style.background='var(--fb-hover)'} onMouseLeave={(e)=>e.currentTarget.style.background='transparent'}>
                    <ClickableAvatar user={user} size="large" disableNavigation={true} />
                    <div>
                      <div style={{fontWeight:700,fontSize:16}}>{user.prenom} {user.nom}</div>
                      <div style={{fontSize:13,color:'var(--fb-blue)',fontWeight:600}}>{t('navbar.viewProfile')}</div>
                    </div>
                  </div>
                  {/* Account Switcher */}
                  {(() => {
                    let savedAccounts = [];
                    try {
                      savedAccounts = JSON.parse(localStorage.getItem('savedAccounts') || '[]');
                    } catch {}
                    if (savedAccounts.length > 0) {
                      return (
                        <div style={{margin:'8px 0'}}>
                          <div style={{fontSize:13,fontWeight:700,color:'var(--fb-text-secondary)',padding:'0 8px 4px'}}>Changer de compte</div>
                          {savedAccounts.map(acc => (
                            <div key={acc.email} style={{display:'flex',alignItems:'center',gap:10,padding:'8px',borderRadius:8,cursor:'pointer',transition:'background .15s',position:'relative'}} onClick={() => {
                              localStorage.setItem('user', JSON.stringify(acc));
                              setUser(acc);
                              setOpenId(null);
                              window.location.reload();
                            }} onMouseEnter={e=>e.currentTarget.style.background='var(--fb-hover)'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                              <div style={{position:'relative',width:56,height:56,display:'flex',alignItems:'center',justifyContent:'center'}}>
                                <FontAwesomeIcon
                                  icon={faRotate}
                                  className="navbar-arrow-oscillate"
                                  style={{
                                    position:'absolute',
                                    left:0,top:0,right:0,bottom:0,
                                    margin:'auto',
                                    pointerEvents:'none',
                                    opacity:1
                                  }}
                                />
                                <div style={{position:'relative',zIndex:3}}>
                                  <ClickableAvatar user={acc} size="medium" disableNavigation={true} />
                                </div>
                              </div>
                              <div style={{flex:1}}>
                                <div style={{fontWeight:600,fontSize:15}}>{acc.prenom} {acc.nom}</div>
                                <div style={{fontSize:12,color:'var(--fb-text-secondary)'}}>{acc.email}</div>
                              </div>
                              {user.email === acc.email && <span style={{fontSize:12,color:'#3b82f6',fontWeight:600,marginLeft:6}}>Actif</span>}
                            </div>
                          ))}

                        </div>
                      );
                    }
                    return null;
                  })()}
                  <div style={{borderBottom:'1px solid var(--fb-border)',margin:'8px 0'}}></div>
                  <div style={{display:'flex',alignItems:'center',gap:12,padding:'10px 12px',cursor:'pointer',fontSize:15,borderRadius:8}} onClick={() => { const newMode = !darkMode; setDarkMode(newMode); localStorage.setItem('unify-theme', newMode ? 'dark' : 'light'); if (newMode) { document.body.classList.add('dark') } else { document.body.classList.remove('dark') }; window.dispatchEvent(new Event('themeChanged')) }} onMouseEnter={(e)=>e.currentTarget.style.background='var(--fb-hover)'} onMouseLeave={(e)=>e.currentTarget.style.background='transparent'}>
                    <div style={{width:36,height:36,background:'var(--fb-bg)',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16}}><i className={darkMode ? "fas fa-sun" : "fas fa-moon"}></i></div>
                    <span>{darkMode ? t('navbar.lightMode') : t('navbar.darkMode')}</span>
                    <div style={{marginLeft:'auto',width:44,height:24,background: darkMode ? 'var(--fb-blue)' : 'var(--fb-border)',borderRadius:12,cursor:'pointer',position:'relative',transition:'background .2s'}} className="toggle" onClick={(e) => { e.stopPropagation(); const newMode = !darkMode; setDarkMode(newMode); localStorage.setItem('unify-theme', newMode ? 'dark' : 'light'); if (newMode) { document.body.classList.add('dark') } else { document.body.classList.remove('dark') }; window.dispatchEvent(new Event('themeChanged')) }}>
                      <div style={{position:'absolute',width:20,height:20,background:'white',borderRadius:'50%',top:2,left: darkMode ? 20 : 2,transition:'left .2s',boxShadow:'0 1px 3px rgba(0,0,0,.3)'}}></div>
                    </div>
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:12,padding:'10px 12px',cursor:'pointer',fontSize:15,borderRadius:8}} onClick={()=>{ setOpenId(null); router.push('/settings') }} onMouseEnter={(e)=>e.currentTarget.style.background='var(--fb-hover)'} onMouseLeave={(e)=>e.currentTarget.style.background='transparent'}>
                    <div style={{width:36,height:36,background:'var(--fb-bg)',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16}}><i className="fas fa-cog"></i></div>
                    <span>{t('navbar.settingsPrivacy')}</span>
                    <i className="fas fa-chevron-right" style={{marginLeft:'auto',color:'var(--fb-text-secondary)',fontSize:14}}></i>
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:12,padding:'10px 12px',cursor:'pointer',fontSize:15,borderRadius:8}} onClick={()=>{ setOpenId(null); router.push('/support') }} onMouseEnter={(e)=>e.currentTarget.style.background='var(--fb-hover)'} onMouseLeave={(e)=>e.currentTarget.style.background='transparent'}>
                    <div style={{width:36,height:36,background:'var(--fb-bg)',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16}}><i className="fas fa-question-circle"></i></div>
                    <span>{t('navbar.helpSupport')}</span>
                  </div>
                  <div style={{borderBottom:'1px solid var(--fb-border)',margin:'8px 0'}}></div>
                  <div style={{display:'flex',alignItems:'center',gap:12,padding:'10px 12px',cursor:'pointer',fontSize:15,borderRadius:8,color:'#c53030'}} onClick={handleLogout} onMouseEnter={(e)=>e.currentTarget.style.background='var(--fb-hover)'} onMouseLeave={(e)=>e.currentTarget.style.background='transparent'}>
                    <div style={{width:36,height:36,background:'var(--fb-bg)',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16}}><i className="fas fa-sign-out-alt"></i></div>
                    <span>{t('navbar.logout')}</span>
                  </div>
                </div>
              ) : (
                <button className="btn-primary" onClick={()=>router.push('/auth')} style={{width:'100%',justifyContent:'center'}}>{t('navbar.login')}</button>
              )}
            </div>
          </Dropdown>
        </div>

      {/* Toast notification popups (Facebook-style) */}
      {toastNotifications.length > 0 && (
        <div style={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: 10
        }}>
          {toastNotifications.map(toast => (
            <div 
              key={toast.id}
              style={{
                background: 'white',
                borderRadius: 8,
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                minWidth: 280,
                maxWidth: 350,
                cursor: 'pointer',
                animation: 'slideInRight 0.3s ease-out',
                border: '1px solid var(--fb-border)'
              }}
              onClick={() => {
                if(toast.url) window.location.href = toast.url
                setToastNotifications(prev => prev.filter(n => n.id !== toast.id))
              }}
            >
              <div style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #667eea, #764ba2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 700,
                fontSize: 16,
                flexShrink: 0
              }}>
                {toast.avatar}
              </div>
              <div style={{flex: 1, minWidth: 0}}>
                <div style={{fontSize: 13, fontWeight: 600, color: 'var(--fb-text)', marginBottom: 2}}>
                  {toast.userName}
                </div>
                <div style={{fontSize: 12, color: 'var(--fb-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>
                  {toast.action}
                </div>
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation()
                  setToastNotifications(prev => prev.filter(n => n.id !== toast.id))
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--fb-text-secondary)',
                  cursor: 'pointer',
                  padding: 4,
                  fontSize: 14
                }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Messages Modal */}
      {showMessages && (
        <MessageInbox
          user={user}
          onClose={() => setShowMessages(false)}
        />
      )}
    </nav>
  )
}
