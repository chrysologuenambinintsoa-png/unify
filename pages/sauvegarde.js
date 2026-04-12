import { useEffect, useState } from 'react'
import Link from 'next/link'
import PostCard from '../components/PostCard'
import Layout from '../components/Layout'

export default function Sauvegarde(){
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [visible, setVisible] = useState(10)

  async function loadSaved(){
    setLoading(true)
    try{
      const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null
      const user = userStr ? JSON.parse(userStr) : null

      let ids = []
      if (user?.email) {
        const res = await fetch(`/api/saved?userEmail=${encodeURIComponent(user.email)}`)
        if (res.ok) {
          const d = await res.json()
          ids = d.saved || []
        }
      }

      if (!ids || ids.length === 0) {
        try{ ids = JSON.parse(localStorage.getItem('savedPosts') || '[]') }catch(e){ ids = [] }
      }

      const fetched = await Promise.all((ids || []).map(async id => {
        try{
          const r = await fetch(`/api/items/${id}`)
          if (r.ok) return await r.json()
        }catch(e){ }
        return null
      }))

      setPosts(fetched.filter(Boolean))
    }catch(e){
      console.error('loadSaved error', e)
    }finally{
      setLoading(false)
    }
  }

  useEffect(()=>{ loadSaved() }, [])

  const hasMore = posts.length > visible
  const visiblePosts = posts.slice(0, visible)

  const rightSidebar = (
    <div style={{padding:16}}>
      <div style={{padding:16, border:'1px solid var(--fb-border)', borderRadius:12, background:'var(--fb-white)'}}>
        <h3 style={{margin:'0 0 8px 0'}}>À propos</h3>
        <p style={{margin:0,color:'var(--fb-text-secondary)',fontSize:14}}>Les publications sauvegardées sont stockées localement et, si vous êtes connecté, synchronisées avec votre compte.</p>
      </div>

      <div style={{height:12}}></div>

      <div style={{padding:16, border:'1px solid var(--fb-border)', borderRadius:12, background:'var(--fb-white)'}}>
        <div style={{fontWeight:700, fontSize:18}}>{posts.length}</div>
        <div style={{color:'var(--fb-text-secondary)'}}>éléments sauvegardés</div>
        <div style={{height:12}}></div>
        <button onClick={()=>{ localStorage.removeItem('savedPosts'); loadSaved() }} style={{width:'100%',padding:'8px 12px',borderRadius:8,border:'1px solid var(--fb-border)',background:'white',cursor:'pointer'}}>Vider les sauvegardes locales</button>
      </div>
    </div>
  )

  return (
    <Layout rightSidebar={rightSidebar}>
      <div className="saved-page" style={{padding:20, maxWidth:1200, margin:'0 auto', display:'flex', gap:24, boxSizing:'border-box'}}>
      <main className="saved-main" style={{flex:1}}>
        <header className="saved-header" style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
          <div>
            <h1 style={{margin:0,fontSize:22}}>Publications sauvegardées</h1>
            <p style={{margin:0,color:'var(--fb-text-secondary)'}}>Retrouvez ici les publications que vous avez enregistrées pour plus tard.</p>
          </div>
          <div className="saved-actions" style={{display:'flex',gap:8}}>
            <button onClick={loadSaved} style={{padding:'8px 12px',borderRadius:8,border:'1px solid var(--fb-border)',background:'white',cursor:'pointer'}}>Rafraîchir</button>
            <Link href="/" style={{padding:'8px 12px',borderRadius:8,background:'#0B3D91',color:'white',textDecoration:'none',display:'inline-flex',alignItems:'center'}}>Aller au fil</Link>
          </div>
        </header>

            <section>
          {loading && (
            <div style={{padding:40,textAlign:'center'}}>Chargement…</div>
          )}

          {!loading && posts.length === 0 && (
            <div style={{padding:24, border:'1px dashed var(--fb-border)', borderRadius:12, textAlign:'center', color:'var(--fb-text-secondary)'}}>
              <div style={{fontSize:48, marginBottom:12}}>🔖</div>
              <div style={{fontSize:18, fontWeight:700, marginBottom:8}}>Aucune publication sauvegardée</div>
              <div style={{marginBottom:16}}>Enregistrez des publications depuis le fil pour les retrouver ici plus tard.</div>
              <Link href="/" style={{padding:'10px 16px',background:'#0B3D91',color:'white',borderRadius:8,textDecoration:'none'}}>Découvrir le fil</Link>
            </div>
          )}

          {!loading && posts.length > 0 && (
            <div className="post-grid" style={{display:'grid',gridTemplateColumns:'1fr',gap:12}}>
              {visiblePosts.map(p => (
                <PostCard key={p.id || p.tempId || Math.random()} post={p} />
              ))}

              {hasMore && (
                <div style={{textAlign:'center', marginTop:8}}>
                  <button onClick={()=>setVisible(v=>v+10)} style={{padding:'8px 14px',borderRadius:8,border:'1px solid var(--fb-border)',background:'white',cursor:'pointer'}}>Afficher plus</button>
                </div>
              )}
            </div>
          )}
        </section>
      </main>

      <style jsx>{`
        .saved-page { padding:20px; max-width:1200px; margin:0 auto; display:flex; gap:24px; box-sizing:border-box; }
        .saved-header { align-items:center; }
        .saved-actions button, .saved-actions a { min-height:40px; }
        .post-grid { grid-template-columns: 1fr; }

        @media (max-width: 900px) {
          .saved-page { padding:16px; gap:16px; }
          .saved-aside { display: none; }
          .saved-header { flex-direction: column; align-items: flex-start; gap:12px; }
          .saved-actions { width:100%; display:flex; gap:8px; }
          .saved-actions button, .saved-actions a { flex:1; text-align:center; }
        }

        @media (max-width: 480px) {
          .saved-page { padding:12px; }
          .post-grid { gap:10px; }
          .saved-header h1 { font-size:18px; }
          .saved-header p { font-size:13px; }
        }
        /* Button improvements for mobile */
        .saved-page button, .saved-page a {
          border-radius:8px;
          padding:10px 12px;
          font-size:14px;
        }
        @media (max-width: 480px) {
          .saved-actions { flex-direction: column; }
          .saved-actions button, .saved-actions a { width:100%; display:inline-flex; justify-content:center; }
          .saved-page button { width:100%; box-sizing:border-box; }
        }
      `}</style>
    </div>
    </Layout>
  )
}
