import Link from 'next/link'
import { useState, useEffect } from 'react'

export default function SidebarLeft(){
  const [showMore, setShowMore] = useState(false)
  const [user, setUser] = useState(null)
  const [myPages, setMyPages] = useState([])

  useEffect(() => {
    const u = localStorage.getItem('user')
    if (u) {
      try { setUser(JSON.parse(u)) } catch {}
    }
    function onUserUpdated(){
      const v = localStorage.getItem('user')
      setUser(v ? JSON.parse(v) : null)
    }
    function onPagesUpdated(){
      try{ const p = JSON.parse(localStorage.getItem('myPages')||'[]'); setMyPages(p||[]) }catch(e){}
    }
    window.addEventListener('userUpdated', onUserUpdated)
    window.addEventListener('pagesUpdated', onPagesUpdated)
    return () => {
      window.removeEventListener('userUpdated', onUserUpdated)
      window.removeEventListener('pagesUpdated', onPagesUpdated)
    }
  }, [])

  useEffect(()=>{
    // hydrate myPages from localStorage
    try{ const p = JSON.parse(localStorage.getItem('myPages')||'[]'); setMyPages(p||[]) }catch(e){}
    function onPagesUpdated(){ try{ const p = JSON.parse(localStorage.getItem('myPages')||'[]'); setMyPages(p||[]) }catch(e){} }
    window.addEventListener('pagesUpdated', onPagesUpdated)
    return ()=> window.removeEventListener('pagesUpdated', onPagesUpdated)
  }, [])

  function getInitials(){
    if (!user) return 'U'
    const first = user.prenom ? user.prenom[0] : ''
    const last = user.nom ? user.nom[0] : ''
    return (first+last).toUpperCase() || 'U'
  }

  return (
    <aside className="left-sidebar">
      <Link href="/profile">
        <div className="sidebar-profile" style={{display:'flex',flexDirection:'column',alignItems:'center',padding:'12px 8px',borderRadius:8,cursor:'pointer',textDecoration:'none',transition:'background .15s'}} onMouseEnter={(e)=>e.currentTarget.style.background='var(--fb-hover)'} onMouseLeave={(e)=>e.currentTarget.style.background='transparent'}>
          {user && (user.avatarUrl || user.avatar) ? (
            <div className="avatar-btn" style={{width:56,height:56,marginBottom:8}}>
              <img src={user.avatarUrl || user.avatar} alt="avatar" />
            </div>
          ) : (
            <div className="avatar-placeholder icon" style={{width:56,height:56,fontSize:24,marginBottom:8}}>{getInitials()}</div>
          )}
          <div className="sidebar-profile-info">
            <div className="sidebar-username">{user ? `${user.prenom} ${user.nom}` : 'Utilisateur'}</div>
          </div>
        </div>
      </Link>
      <div className="sidebar-divider" />
      <Link href="/amis">
        <div className="sidebar-link"><div className="icon sidebar-icon-blue"><i className="fas fa-users"></i></div><span>Amis</span></div>
      </Link>
      <Link href="/groupes">
        <div className="sidebar-link"><div className="icon sidebar-icon-purple"><i className="fas fa-people-group"></i></div><span>Groupes</span></div>
      </Link>
      <Link href="/pages">
        <div className="sidebar-link"><div className="icon sidebar-icon-green"><i className="fas fa-flag"></i></div><span>Pages</span></div>
      </Link>
      {showMore && (
        <>
          <Link href="/evenements">
            <div className="sidebar-link"><div className="icon sidebar-icon-red"><i className="fas fa-calendar-alt"></i></div><span>Événements</span></div>
          </Link>
          <Link href="/sauvegarde">
            <div className="sidebar-link"><div className="icon sidebar-icon-blue"><i className="fas fa-bookmark"></i></div><span>Sauvegarde</span></div>
          </Link>
          <Link href="/souvenirs">
            <div className="sidebar-link"><div className="icon sidebar-icon-purple"><i className="fas fa-history"></i></div><span>Souvenirs</span></div>
          </Link>
        </>
      )}
      <Link href="/marketplace">
        <div className="sidebar-link"><div className="icon sidebar-icon-orange"><i className="fas fa-store"></i></div><span>Marketplace</span></div>
      </Link>
      <Link href="/videos">
        <div className="sidebar-link"><div className="icon sidebar-icon-red"><i className="fas fa-play-circle"></i></div><span>Vidéos</span></div>
      </Link>
      <div className="sidebar-link sidebar-see-more" onClick={() => setShowMore(!showMore)}><div className="icon" style={{background:'var(--fb-bg)'}}><i className="fas fa-chevron-down"></i></div><span>{showMore ? 'Voir moins' : 'Voir plus'}</span></div>
      {showMore && (
        <>
          <div style={{height:1,background:'var(--fb-bg)',margin:'8px 0'}} />
          <div className="sidebar-section-title">Raccourcis</div>
          <div className="sidebar-section-title" style={{marginTop:8}}>Explorer</div>
          <Link href="/dashboard">
            <div className="sidebar-link"><div className="icon" style={{background:'var(--fb-bg)'}}><i className="fas fa-chart-line"></i></div><span>Dashboard professionnel</span></div>
          </Link>
          {/* Collectes de fonds removed */}
          <Link href="/sponsors">
            <div className="sidebar-link"><div className="icon" style={{background:'var(--fb-bg)'}}><i className="fas fa-bullhorn"></i></div><span>Sponsors</span></div>
          </Link>
        </>
      )}
    </aside>
  )
}
