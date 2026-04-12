import { useEffect, useState } from 'react'
import PostCard from '../components/PostCard'
import PostViewer from '../components/PostViewer'
import Layout from '../components/Layout'

export default function Souvenirs(){
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [visible, setVisible] = useState(12)
  const [selected, setSelected] = useState(null)

  async function loadSouvenirs(){
    setLoading(true)
    try{
      // try reading a 'souvenirs' list from localStorage, fallback to 'savedPosts'
      let ids = []
      try{ ids = JSON.parse(localStorage.getItem('souvenirs') || '[]') }catch(e){ ids = [] }
      if ((!ids || ids.length === 0)){
        try{ ids = JSON.parse(localStorage.getItem('savedPosts') || '[]') }catch(e){ ids = [] }
      }

      const fetched = await Promise.all((ids || []).map(async id => {
        try{
          const r = await fetch(`/api/items/${id}`)
          if (r.ok) return await r.json()
        }catch(e){ }
        return null
      }))

      setItems(fetched.filter(Boolean))
    }catch(e){ console.error('loadSouvenirs', e) }
    finally{ setLoading(false) }
  }

  useEffect(()=>{ loadSouvenirs() }, [])

  function exportJson(){
    const blob = new Blob([JSON.stringify(items, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'souvenirs.json'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  function clearLocal(){
    if (confirm('Supprimer les souvenirs locaux ? Cette action est irréversible.')){
      localStorage.removeItem('souvenirs')
      loadSouvenirs()
    }
  }

  const hasMore = items.length > visible

  function timeAgo(input){
    if(!input) return ''
    let d = null
    // try common fields
    try{
      d = new Date(input)
      if (isNaN(d)) d = null
    }catch(e){ d = null }
    // fallback when timestamp is numeric string
    if(!d){
      const n = Number(input)
      if(!Number.isNaN(n)) d = new Date(n)
    }
    if(!d || isNaN(d)) return ''

    const now = new Date()
    const diffSec = Math.floor((now - d) / 1000)
    if(diffSec < 60) return "à l'instant"
    const diffMin = Math.floor(diffSec / 60)
    if(diffMin < 60) return `il y a ${diffMin} ${diffMin>1? 'minutes':'minute'}`
    const diffH = Math.floor(diffMin / 60)
    if(diffH < 24) return `il y a ${diffH} ${diffH>1? 'heures':'heure'}`
    const diffD = Math.floor(diffH / 24)
    if(diffD < 30) return `il y a ${diffD} ${diffD>1? 'jours':'jour'}`
    const diffM = Math.floor(diffD / 30)
    if(diffM < 12) return `il y a ${diffM} ${diffM>1? 'mois':'mois'}`
    const diffY = Math.floor(diffM / 12)
    return `il y a ${diffY} ${diffY>1? 'ans':'an'}`
  }

  return (
    <Layout>
      <div className="souvenirs-page" style={{maxWidth:1200,margin:'0 auto',padding:20}}>
      <header style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
        <div>
          <h1 style={{margin:0,fontSize:22}}>Souvenirs</h1>
          <p style={{margin:0,color:'var(--fb-text-secondary)'}}>Revoyez les moments importants enregistrés.</p>
        </div>
        <div style={{display:'flex',gap:8}}>
          <button onClick={loadSouvenirs} style={{padding:'8px 12px',borderRadius:8,border:'1px solid var(--fb-border)',background:'white'}}>Rafraîchir</button>
          <button onClick={exportJson} style={{padding:'8px 12px',borderRadius:8,background:'#0B3D91',color:'white',border:'none'}}>Exporter</button>
          <button onClick={clearLocal} style={{padding:'8px 12px',borderRadius:8,border:'1px solid #e0e0e0',background:'white'}}>Vider</button>
        </div>
      </header>

      <main>
        {loading && (<div style={{padding:40,textAlign:'center'}}>Chargement…</div>)}

        {!loading && items.length === 0 && (
          <div style={{padding:24, border:'1px dashed var(--fb-border)', borderRadius:12, textAlign:'center', color:'var(--fb-text-secondary)'}}>
            <div style={{fontSize:48, marginBottom:12}}>📸</div>
            <div style={{fontSize:18,fontWeight:700,marginBottom:8}}>Aucun souvenir</div>
            <div style={{marginBottom:16}}>Enregistrez des publications pour les retrouver plus tard ici.</div>
          </div>
        )}

        {!loading && items.length > 0 && (
          <div>
            <div className="grid" style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12}}>
              {items.slice(0,visible).map(p => (
                <div key={p.id || Math.random()} style={{background:'var(--fb-white)',border:'1px solid var(--fb-border)',borderRadius:12,padding:8}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      {/* reuse PostCard header Avatar by rendering small ClickableAvatar via PostCard */}
                      <div style={{minWidth:48}}></div>
                      <div>
                        <div style={{fontWeight:700}}>{p.author}</div>
                        <div style={{fontSize:12,color:'var(--fb-text-secondary)'}}>{timeAgo(p.date || p.createdAt || p.timestamp)}</div>
                      </div>
                    </div>
                    <div style={{display:'flex',gap:8}}>
                      <button onClick={()=>setSelected(p)} style={{padding:'6px 10px',borderRadius:8,border:'none',background:'#0B3D91',color:'white'}}>Voir</button>
                    </div>
                  </div>
                  <div style={{marginBottom:8}}>
                    <div style={{fontSize:14,color:'var(--fb-text)',whiteSpace:'pre-wrap'}}> {p.content?.slice(0,200)}</div>
                  </div>
                  {p.image && <img src={p.image} alt="media" style={{width:'100%',height:160,objectFit:'cover',borderRadius:8}} />}
                </div>
              ))}
            </div>

            {hasMore && (
              <div style={{textAlign:'center',marginTop:12}}>
                <button onClick={()=>setVisible(v=>v+12)} style={{padding:'10px 16px',borderRadius:8,border:'1px solid var(--fb-border)',background:'white'}}>Afficher plus</button>
              </div>
            )}
          </div>
        )}
      </main>

      {selected && (
        <div className="modal-overlay" onClick={()=>setSelected(null)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1200}}>
          <div onClick={(e)=>e.stopPropagation()} style={{width:'100%',maxWidth:900,maxHeight:'90vh',overflow:'auto',background:'white',borderRadius:12}}>
            <PostViewer post={selected} onClose={()=>setSelected(null)} />
          </div>
        </div>
      )}

      <style jsx>{`
        .grid { grid-template-columns: repeat(3, 1fr); }

        /* Tablet */
        @media (max-width: 900px) {
          .grid { grid-template-columns: repeat(2, 1fr); }
          /* Stack whole page vertically on tablet/mobile */
          .souvenirs-page { display: flex; flex-direction: column; gap:12px; }
          .souvenirs-page header { flex-direction: column; align-items:flex-start; gap:12px }
          .souvenirs-page header div[style] { width:100% }
          .souvenirs-page > header > div:last-child { width:100%; display:flex; gap:8px }
        }

        /* Mobile */
        @media (max-width: 600px) {
          .grid { grid-template-columns: 1fr; }
          .souvenirs-page { padding-top: 8px; }
          .souvenirs-page header { align-items:flex-start }
          .souvenirs-page .grid > div { width: 100%; }
        }

        /* Button responsive tweaks */
        .souvenirs-page button {
          padding:8px 12px;
          border-radius:8px;
          font-size:14px;
          min-height:40px;
        }
        @media (max-width: 600px) {
          .souvenirs-page button { flex:1; }
        }
      `}</style>
      </div>
    </Layout>
  )
}
