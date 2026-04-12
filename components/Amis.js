import { useState, useEffect, useContext } from 'react'
import { AppContext } from '../context/AppContext'
import { useRouter } from 'next/router'
import ClickableAvatar from './ClickableAvatar'

export default function Amis(){
  const { showToast } = useContext(AppContext)
  const router = useRouter()
  const [amis, setAmis] = useState([])
  const [suggestions, setSuggestions] = useState([])
  const [demandesRecues, setDemandesRecues] = useState([])
  const [demandesEnvoyees, setDemandesEnvoyees] = useState([])
  const [loading, setLoading] = useState(true)
  const [gridCols, setGridCols] = useState(1)

  useEffect(() => {
    const updateCols = () => {
      if (window.innerWidth < 500) setGridCols(2)
      else if (window.innerWidth < 768) setGridCols(3)
      else setGridCols(4)
    }
    updateCols()
    window.addEventListener('resize', updateCols)
    return () => window.removeEventListener('resize', updateCols)
  }, [])
  const [activeTab, setActiveTab] = useState('amis')
  const { query } = router

  useEffect(() => {
    fetchAmis()
  }, [])

  // initialize tab from query param if present
  useEffect(() => {
    if (router.isReady && query.tab) {
      setActiveTab(query.tab)
    }
  }, [router.isReady, query.tab])

  const fetchAmis = async () => {
    try {
      const userStr = localStorage.getItem('user')
      const user = userStr ? JSON.parse(userStr) : null
      const userEmail = user?.email
      if (!userEmail) {
        setLoading(false)
        return
      }
      const res = await fetch(`/api/amis?userEmail=${encodeURIComponent(userEmail)}`)
      const data = await res.json()
      setAmis(data.amis || [])
      setSuggestions(data.suggestions || [])
      setDemandesRecues(data.demandesRecues || [])
      setDemandesEnvoyees(data.demandesEnvoyees || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }
  const handleAccept = async (id) => {
    const userStr = localStorage.getItem('user')
    const user = userStr ? JSON.parse(userStr) : null
    const userEmail = user?.email
    if (!userEmail) return
    await fetch(`/api/amis?userEmail=${encodeURIComponent(userEmail)}&action=accept&friendId=${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    })
    fetchAmis()
  }

  const handleRefuse = async (id) => {
    const userStr = localStorage.getItem('user')
    const user = userStr ? JSON.parse(userStr) : null
    const userEmail = user?.email
    if (!userEmail) return
    const res = await fetch(`/api/amis?userEmail=${encodeURIComponent(userEmail)}&action=refuse&friendId=${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    })
    if (res.ok) {
      showToast && showToast("Demande refusée")
    } else {
      showToast && showToast("Erreur lors du refus de la demande")
    }
    fetchAmis()
  }

  const handleAdd = async (id) => {
    const userStr = localStorage.getItem('user')
    const user = userStr ? JSON.parse(userStr) : null
    const userEmail = user?.email
    if (!userEmail) return
    const res = await fetch(`/api/amis?userEmail=${encodeURIComponent(userEmail)}&action=add&friendId=${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    })
    if (res.ok) {
      showToast && showToast("Demande envoyée à l'utilisateur")
    } else {
      const data = await res.json().catch(()=>null)
      showToast && showToast(data?.error || "Erreur lors de l'envoi de la demande")
    }
    fetchAmis()
  }

  const handleRemove = async (id) => {
    const userStr = localStorage.getItem('user')
    const user = userStr ? JSON.parse(userStr) : null
    const userEmail = user?.email
    if (!userEmail) return
    await fetch(`/api/amis?userEmail=${encodeURIComponent(userEmail)}&action=remove&friendId=${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    })
    fetchAmis()
  }

  return (
    <div style={{padding:'0 8px',maxWidth:'100%'}}>
      <div className="card" style={{marginBottom:12,borderRadius:8}}>
        <div style={{padding:16,borderBottom:'1px solid var(--fb-border)',display:'flex',gap:8,flexWrap:'wrap'}}>
          <button 
            onClick={() => {
              setActiveTab('amis')
              if (router.asPath !== '/amis?tab=amis') {
                router.push('/amis?tab=amis', undefined, { shallow: true })
              }
            }}
            style={{flex:1,minWidth:'30%',padding:'10px 12px',background:activeTab==='amis'?'var(--fb-blue)':'var(--fb-bg)',color:activeTab==='amis'?'white':'var(--fb-text)',border:'none',borderRadius:6,cursor:'pointer',fontWeight:600,fontSize:14}}
          >
            Mes amis ({amis.length})
          </button>
          <button 
            onClick={() => {
              setActiveTab('demandes')
              if (router.asPath !== '/amis?tab=demandes') {
                router.push('/amis?tab=demandes', undefined, { shallow: true })
              }
            }}
            style={{flex:1,minWidth:'30%',padding:'10px 12px',background:activeTab==='demandes'?'var(--fb-blue)':'var(--fb-bg)',color:activeTab==='demandes'?'white':'var(--fb-text)',border:'none',borderRadius:6,cursor:'pointer',fontWeight:600,fontSize:14}}
          >
            Demandes reçues ({demandesRecues.length})
          </button>
          <button 
            onClick={() => {
              setActiveTab('suggestions')
              if (router.asPath !== '/amis?tab=suggestions') {
                router.push('/amis?tab=suggestions', undefined, { shallow: true })
              }
            }}
            style={{flex:1,minWidth:'30%',padding:'10px 12px',background:activeTab==='suggestions'?'var(--fb-blue)':'var(--fb-bg)',color:activeTab==='suggestions'?'white':'var(--fb-text)',border:'none',borderRadius:6,cursor:'pointer',fontWeight:600,fontSize:14}}
          >
            Suggéstions ({suggestions.length})
          </button>
        </div>
          {activeTab === 'demandes' && (
            <div>
              <h3 style={{marginBottom:16}}>Demandes d'amis reçues</h3>
              {demandesRecues.length === 0 ? (
                <p style={{color:'var(--fb-text-secondary)'}}>Aucune demande en attente</p>
              ) : (
                <div style={{display:'grid',gridTemplateColumns:`repeat(${gridCols}, 1fr)`,gap:12}}>
                  {demandesRecues.map(user => (
                    <div key={user.id} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:8,padding:12,borderRadius:8,border:'1px solid var(--fb-border)',textAlign:'center'}}>
                      <ClickableAvatar
                        user={{
                          prenom: user.name,
                          nomUtilisateur: user.name,
                          avatarUrl: user.avatarUrl || user.avatar,
                          email: user.email
                        }}
                        size="medium"
                      />
                      <div style={{fontWeight:600}}>{user.name}</div>
                      <div style={{display:'flex',gap:8,marginTop:8}}>
                        <button onClick={() => handleAccept(user.id)} style={{padding:'6px 12px',background:'var(--fb-blue)',border:'none',borderRadius:6,cursor:'pointer',fontSize:13,fontWeight:600,color:'white'}}>Accepter</button>
                        <button onClick={() => handleRefuse(user.id)} style={{padding:'6px 12px',background:'#E4E6E9',border:'none',borderRadius:6,cursor:'pointer',fontSize:13,fontWeight:600}}>Refuser</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        <div style={{padding:16}}>
          {activeTab === 'amis' && (
            <div>
              <h3 style={{marginBottom:16}}>Mes amis</h3>
              {amis.length === 0 ? (
                <p style={{color:'var(--fb-text-secondary)'}}>Vous n'avez pas encore d'amis</p>
              ) : (
                <div style={{display:'grid',gridTemplateColumns:`repeat(${gridCols}, 1fr)`,gap:12}}>
                  {amis.map(ami => (
                    <div key={ami.id} style={{textAlign:'center',padding:12,borderRadius:8,border:'1px solid var(--fb-border)',cursor:'pointer'}} onClick={() => router.push(`/profile?userId=${ami.id}`)}>
                      <ClickableAvatar
                        user={{
                          prenom: ami.name,
                          nomUtilisateur: ami.name,
                          avatarUrl: ami.avatarUrl || ami.avatar,
                          email: ami.email
                        }}
                        size="medium"
                      />
                      <div style={{fontWeight:600,marginBottom:4}}>{ami.name}</div>
                      <div style={{fontSize:12,color:'var(--fb-text-secondary)',marginBottom:8}}>{ami.status}</div>
                      <button onClick={(e) => { e.stopPropagation(); handleRemove(ami.id); }} style={{width:'100%',padding:'6px 12px',background:'#E4E6E9',border:'none',borderRadius:6,cursor:'pointer',fontSize:13,fontWeight:600}}>
                        Retirer
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'suggestions' && (
            <div>
              <h3 style={{marginBottom:16}}>Suggestions d'amis</h3>
              {suggestions.length === 0 ? (
                <p style={{color:'var(--fb-text-secondary)'}}>Pas de suggéstions pour le moment</p>
              ) : (
                <div style={{display:'grid',gridTemplateColumns:`repeat(${gridCols}, 1fr)`,gap:12}}>
                  {suggestions.map(user => {
                    const isPending = demandesEnvoyees.some(d => d.id === user.id);
                    return (
                      <div key={user.id} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:8,padding:12,borderRadius:8,border:'1px solid var(--fb-border)',cursor:'pointer',textAlign:'center'}} onClick={() => router.push(`/profile?userId=${user.id}`)}>
                        <ClickableAvatar
                          user={{
                            prenom: user.name,
                            nomUtilisateur: user.name,
                            avatarUrl: user.avatarUrl || user.avatar,
                            email: user.email
                          }}
                          size="medium"
                        />
                        <div style={{fontWeight:600}}>{user.name}</div>
                        <div style={{fontSize:12,color:'var(--fb-text-secondary)'}}>{user.mutualFriends} amis en commun</div>
                        {isPending ? (
                          <div style={{padding:'6px 12px',background:'#E4E6E9',borderRadius:6,fontSize:13,fontWeight:600,width:'100%',color:'#888',textAlign:'center'}}>En attente</div>
                        ) : (
                          <button onClick={(e) => { e.stopPropagation(); handleAdd(user.id); }} style={{padding:'6px 12px',background:'var(--fb-blue)',border:'none',borderRadius:6,cursor:'pointer',fontSize:13,fontWeight:600,color:'white',width:'100%'}}>
                            Ajouter
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
