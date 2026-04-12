import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import SponsorCard from '../components/SponsorCard';
import SponsorAnalyticsDashboard from '../components/SponsorAnalyticsDashboard';
import SponsorsSidebarRight from '../components/SponsorsSidebarRight';

export default function SponsorsPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sponsors, setSponsors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title:'', content:'', link:'', image:'', author:'', avatarUrl:'', color:'' });
  const [saving, setSaving] = useState(false);
  const [hasPaid, setHasPaid] = useState(false)
  const [checkingPaid, setCheckingPaid] = useState(true)
  const [activeTab, setActiveTab] = useState('list');

  const [purchases, setPurchases] = useState([]);
  const [purchaseForm, setPurchaseForm] = useState({ sponsorId:'', amount:'', currency:'EUR' });
  const [purchasing, setPurchasing] = useState(false);
  const [selectedAnalyticsSponsor, setSelectedAnalyticsSponsor] = useState(null);

  // Compress and convert image to data URL
  const compressImage = async (file, maxWidth = 300, maxHeight = 300, quality = 0.7) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Calculate new dimensions maintaining aspect ratio
          if (width > height) {
            if (width > maxWidth) {
              height *= maxWidth / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width *= maxHeight / height;
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          // Convert to compressed data URL
          const compressed = canvas.toDataURL(file.type || 'image/jpeg', quality);
          resolve(compressed);
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  // Handle avatar file upload with compression
  const handleAvatarFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      const compressedUrl = await compressImage(file);
      setForm({...form, avatarUrl: compressedUrl});
    } catch (err) {
      console.error('Erreur compression avatar:', err);
    }
  };

  const fetchSponsors = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/sponsors');
      const data = await res.json();
      setSponsors(data.sponsors || []);
    } catch(e) {
      console.error('error loading sponsors',e);
    } finally {
      setLoading(false);
    }
  };

  const fetchPurchases = async () => {
    try {
      const res = await fetch('/api/sponsors/purchases');
      const data = await res.json();
      setPurchases(data.purchases || []);
    } catch(e) { console.error('error loading purchases',e); }
  };

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (!user) {
      router.push('/auth');
    } else {
      setIsAuthenticated(true);
      fetchSponsors();
      fetchPurchases();
    }
  }, [router.isReady]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
      const headers = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`

      const res = await fetch('/api/sponsors', {
        method: 'POST',
        headers,
        body: JSON.stringify(form)
      })
      if (!res.ok) {
        // show error to user
        let errText = ''
        try { const err = await res.json(); errText = err.error || JSON.stringify(err) } catch (e) { errText = String(res.status) }
        alert('Erreur création publicité: ' + errText)
        setSaving(false)
        return
      }
      setForm({ title:'', content:'', link:'', image:'', author:'', avatarUrl:'', color:'' });
      setActiveTab('list');
      fetchSponsors();
    } catch(e) { console.error('save sponsor',e); }
    setSaving(false);
  };

  // check whether current user already paid platform fee
  useEffect(() => {
    let mounted = true
    async function checkPaid() {
      setCheckingPaid(true)
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
        if (!token) {
          if (mounted) setHasPaid(false)
          return
        }
        const meRes = await fetch('/api/me', { headers: { Authorization: `Bearer ${token}` } })
        if (!meRes.ok) { if (mounted) setHasPaid(false); return }
        const me = await meRes.json()
        if (!me || !me.email) { if (mounted) setHasPaid(false); return }
        const purchasesRes = await fetch(`/api/sponsors/purchases?userEmail=${encodeURIComponent(me.email)}`)
        if (!purchasesRes.ok) { if (mounted) setHasPaid(false); return }
        const { purchases } = await purchasesRes.json()
        const completed = Array.isArray(purchases) && purchases.some(p => p.status === 'completed')
        if (mounted) setHasPaid(Boolean(completed))
      } catch (e) {
        console.error('checkPaid error', e)
        if (mounted) setHasPaid(false)
      } finally { if (mounted) setCheckingPaid(false) }
    }
    checkPaid()
    return () => { mounted = false }
  }, [])

  if (!isAuthenticated) {
    return (
      <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',flexDirection:'column',gap:16}}>
        <h2 style={{fontSize:20,color:'#333'}}>Accès non autorisé</h2>
        <p style={{color:'#666'}}>Veuillez vous connecter pour continuer</p>
        <button onClick={() => router.push('/auth')} style={{padding:'10px 20px',background:'var(--fb-blue)',color:'white',border:'none',borderRadius:8,cursor:'pointer',fontWeight:600}}>
          Aller à la connexion
        </button>
      </div>
    );
  }

  if (selectedAnalyticsSponsor) {
    return (
      <Layout>
        <SponsorAnalyticsDashboard 
          sponsorId={selectedAnalyticsSponsor} 
          onBack={() => setSelectedAnalyticsSponsor(null)} 
        />
      </Layout>
    );
  }

  // Quick stats
  const activeCount = sponsors.filter(s => s.active).length;
  const totalInvested = purchases.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
  const totalSponsorships = purchases.length;

  return (
    <Layout 
      rightSidebar={<SponsorsSidebarRight />}
    >
      <div style={{maxWidth:1100,margin:'0 auto',padding:'24px 12px'}} className="sponsors-container">
        
        {/* HEADER SECTION */}
        <div style={{marginBottom:32}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:24,flexWrap:'wrap',gap:16}}>
            <div style={{flex:1,minWidth:'250px'}}>
              <h1 style={{fontSize:32,fontWeight:800,color:'var(--fb-text)',margin:'0 0 8px 0',letterSpacing:'-0.5px'}} className="sponsors-heading">
                <i className="fas fa-chart-bar" style={{marginRight:12,color:'var(--fb-blue)'}}></i>
                Gestion des Publicités
              </h1>
              <p style={{fontSize:16,color:'var(--fb-text-secondary)',margin:0}}>
                Gérez vos encarts publicitaires, consultez les statistiques et optimisez votre stratégie publicitaire
              </p>
            </div>
          </div>

          {/* STATS CARDS */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:16}} className="stats-grid">
            {[
              {label:'Sponsors actifs',value:activeCount,icon:'check-circle',color:'var(--fb-green)'},
              {label:'Investissement total',value:`€${totalInvested.toFixed(2)}`,icon:'wallet',color:'var(--fb-blue)'},
              {label:'Publicités achetées',value:totalSponsorships,icon:'trending-up',color:'#FF8C00'}
            ].map((stat,idx) => (
              <div key={idx} style={{
                background:'var(--fb-white)',
                borderRadius:12,
                padding:20,
                border:'1px solid var(--fb-border)',
                transition:'all 0.3s ease'
              }} className="stat-card">
                <i className={`fas fa-${stat.icon}`} style={{fontSize:24,marginBottom:8,color:stat.color,display:'block'}}></i>
                <p style={{margin:'0 0 8px 0',color:'var(--fb-text-secondary)',fontSize:13,fontWeight:500,textTransform:'uppercase',letterSpacing:'0.5px'}}>
                  {stat.label}
                </p>
                <p style={{margin:0,fontSize:28,fontWeight:800,color:stat.color}} className="stat-value">
                  {stat.value}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* TABS NAVIGATION */}
        <div style={{
          display:'flex',
          gap:8,
          marginBottom:24,
          borderBottom:'2px solid var(--fb-border)',
          position:'relative'
        }} className="tabs-container">
          {[
            {id:'list',label:'Mes Publicités',icon:'list',count:sponsors.length},
            {id:'add',label:'Créer une publicité',icon:'bullhorn',count:null},
            {id:'history',label:'Historique des achats',icon:'history',count:purchases.length}
          ].map(tab=>(
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding:'14px 20px',
                border:'none',
                background:'transparent',
                cursor:'pointer',
                fontSize:14,
                fontWeight:600,
                color: activeTab === tab.id ? 'var(--fb-blue)' : 'var(--fb-text-secondary)',
                position:'relative',
                transition:'color 0.2s',
                display:'flex',
                alignItems:'center',
                gap:8,
                whiteSpace:'nowrap'
              }}
              className="tab-button"
            >
              <i className={`fas fa-${tab.icon}`} style={{fontSize:16}}></i>
              {tab.label}
              {tab.count !== null && (
                <span style={{
                  background: activeTab === tab.id ? 'var(--fb-blue)' : 'var(--fb-border)',
                  color: activeTab === tab.id ? 'white' : 'var(--fb-text)',
                  borderRadius:12,
                  padding:'2px 8px',
                  fontSize:11,
                  fontWeight:700,
                  minWidth:'20px',
                  textAlign:'center'
                }}>
                  {tab.count}
                </span>
              )}
              {activeTab === tab.id && (
                <div style={{
                  position:'absolute',
                  bottom:-2,
                  left:0,
                  right:0,
                  height:3,
                  background:'var(--fb-blue)',
                  borderRadius:'3px 3px 0 0',
                  transition:'all 0.2s'
                }} />
              )}
            </button>
          ))}
        </div>

        {/* TAB CONTENT */}
        {activeTab === 'list' && (
          <div>
            {loading ? (
              <div style={{textAlign:'center',padding:60}}>
                <div style={{fontSize:48,marginBottom:16}}>⏳</div>
                <p style={{fontSize:16,color:'var(--fb-text-secondary)',margin:0}}>Chargement de vos publicités...</p>
              </div>
            ) : sponsors.length === 0 ? (
              <div style={{
                background:'linear-gradient(135deg, rgba(11,61,145,0.05), rgba(11,61,145,0.02))',
                borderRadius:16,
                padding:48,
                textAlign:'center',
                border:'2px dashed var(--fb-border)'
              }}>
                <div style={{fontSize:64,marginBottom:16}}></div>
                <h3 style={{fontSize:20,fontWeight:700,color:'var(--fb-text)',margin:'0 0 8px 0'}}>Aucune publicité trouvée</h3>
                <p style={{color:'var(--fb-text-secondary)',margin:'0 0 20px 0'}}>Créez votre première publicité pour commencer</p>
                <button
                  onClick={() => setActiveTab('add')}
                  style={{
                    padding:'12px 28px',
                    background:'var(--fb-blue)',
                    color:'white',
                    border:'none',
                    borderRadius:8,
                    fontSize:14,
                    fontWeight:700,
                    cursor:'pointer',
                    transition:'all 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.background = 'var(--fb-blue-dark)'}
                  onMouseLeave={(e) => e.target.style.background = 'var(--fb-blue)'}
                >
                  <i className="fas fa-bullhorn" style={{marginRight:8}}></i>
                  Créer une publicité
                </button>
              </div>
            ) : (
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(340px,1fr))',gap:20}} className="sponsor-cards-grid">
                {sponsors.map(s => (
                  <div key={s.id} style={{
                    background:'var(--fb-white)',
                    borderRadius:14,
                    overflow:'hidden',
                    border:'1px solid var(--fb-border)',
                    transition:'all 0.3s ease',
                    display:'flex',
                    flexDirection:'column'
                  }} className="sponsor-premium-card">
                    
                    {/* CARD HEADER */}
                    <div style={{
                      background:`linear-gradient(135deg, var(--fb-blue), var(--fb-blue-dark))`,
                      padding:16,
                      color:'white',
                      display:'flex',
                      justifyContent:'space-between',
                      alignItems:'start'
                    }}>
                      <div>
                        <h3 style={{margin:'0 0 4px 0',fontSize:15,fontWeight:700}}>{s.title}</h3>
                        <span style={{fontSize:12,opacity:0.8}}>ID#{s.id}</span>
                      </div>
                      <span style={{
                        background: s.active ? 'rgba(66, 183, 42, 0.9)' : 'rgba(250, 56, 62, 0.9)',
                        padding:'6px 12px',
                        borderRadius:20,
                        fontSize:11,
                        fontWeight:700,
                        whiteSpace:'nowrap',
                        display:'flex',
                        alignItems:'center',
                        gap:6
                      }}>
                        <i className={`fas fa-${s.active ? 'circle' : 'circle'}`} style={{fontSize:8}}></i>
                        {s.active ? 'En ligne' : 'Hors ligne'}
                      </span>
                    </div>

                    {/* SPONSOR PREVIEW */}
                    <div style={{padding:12,flex:1,display:'flex',flexDirection:'column',justifyContent:'center'}}>
                      <SponsorCard sponsor={s} />
                    </div>

                    {/* CARD FOOTER - ACTIONS */}
                    <div style={{
                      padding:16,
                      borderTop:'1px solid var(--fb-border)',
                      display:'flex',
                      flexDirection:'column',
                      gap:10
                    }}>
                      <button
                        onClick={() => {
                          setSelectedAnalyticsSponsor(s.id);
                        }}
                        style={{
                          width:'100%',
                          padding:'11px 16px',
                          background:'var(--fb-blue)',
                          color:'white',
                          border:'none',
                          borderRadius:8,
                          fontSize:13,
                          fontWeight:700,
                          cursor:'pointer',
                          transition:'all 0.2s',
                          display:'flex',
                          alignItems:'center',
                          justifyContent:'center',
                          gap:8
                        }}
                        onMouseEnter={(e) => {e.target.style.background = 'var(--fb-blue-dark)'; e.target.style.transform = 'translateY(-1px)'}}
                        onMouseLeave={(e) => {e.target.style.background = 'var(--fb-blue)'; e.target.style.transform = 'translateY(0)'}}
                      >
                        <i className="fas fa-chart-line"></i>
                        Statistiques détaillées
                      </button>
                      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}} className="sponsor-action-buttons">
                        <button
                          onClick={() => {
                            setPurchaseForm({ sponsorId: s.id.toString(), amount:'', currency:'EUR' });
                            setActiveTab('history');
                          }}
                          style={{
                            padding:'11px 12px',
                            background:'var(--fb-green)',
                            color:'white',
                            border:'none',
                            borderRadius:8,
                            fontSize:13,
                            fontWeight:700,
                            cursor:'pointer',
                            transition:'all 0.2s',
                            display:'flex',
                            alignItems:'center',
                            justifyContent:'center',
                            gap:6
                          }}
                          onMouseEnter={(e) => {e.target.style.background = '#39a326'; e.target.style.transform = 'translateY(-1px)'}}
                          onMouseLeave={(e) => {e.target.style.background = 'var(--fb-green)'; e.target.style.transform = 'translateY(0)'}}
                        >
                          <i className="fas fa-credit-card"></i>
                          Acheter
                        </button>
                        <button
                          onClick={async () => {
                            try{
                              await fetch(`/api/sponsors/${s.id}`, {
                                method:'PUT',
                                headers:{'Content-Type':'application/json'},
                                body: JSON.stringify({ active: !s.active })
                              });
                              fetchSponsors();
                            }catch(e){console.error(e)}
                          }}
                          style={{
                            padding:'11px 12px',
                            background: s.active ? 'var(--fb-red)' : '#999',
                            color:'white',
                            border:'none',
                            borderRadius:8,
                            fontSize:13,
                            fontWeight:700,
                            cursor:'pointer',
                            transition:'all 0.2s',
                            display:'flex',
                            alignItems:'center',
                            justifyContent:'center',
                            gap:6
                          }}
                          onMouseEnter={(e) => e.target.style.transform = 'translateY(-1px)'}
                          onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
                        >
                          <i className={`fas fa-power-off`}></i>
                          {s.active? 'Désactiver':'Activer'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB: CREATE */}
        {activeTab === 'add' && (
          <div style={{background:'var(--fb-white)',borderRadius:14,padding:32,border:'1px solid var(--fb-border)'}}>
            <h2 style={{fontSize:22,fontWeight:800,margin:'0 0 24px 0',color:'var(--fb-text)'}}>
              <i className="fas fa-pen-fancy" style={{marginRight:10,color:'var(--fb-blue)'}}></i>
              Créer une nouvelle publicité
            </h2>
            
            <form onSubmit={handleSubmit} style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:24}} className="form-grid">
              <div style={{gridColumn:'1 / -1'}}>
                <label style={{display:'block',fontSize:13,fontWeight:700,marginBottom:10,color:'var(--fb-text)',textTransform:'uppercase',letterSpacing:'0.5px'}}>
                  Titre de la publicité *
                </label>
                <input 
                  placeholder="Ex: Nouvelle collection printemps" 
                  value={form.title} 
                  onChange={e=>setForm({...form,title:e.target.value})} 
                  required 
                  style={{
                    width:'100%',
                    padding:'12px 14px',
                    border:'1.5px solid var(--fb-border)',
                    borderRadius:10,
                    fontSize:14,
                    boxSizing:'border-box',
                    transition:'all 0.2s',
                    fontFamily:'inherit'
                  }}
                  onFocus={(e) => {e.target.style.borderColor = 'var(--fb-blue)'; e.target.style.boxShadow = '0 0 0 3px rgba(11,61,145,0.1)'}}
                  onBlur={(e) => {e.target.style.borderColor = 'var(--fb-border)'; e.target.style.boxShadow = 'none'}}
                />
              </div>

              <div>
                <label style={{display:'block',fontSize:13,fontWeight:700,marginBottom:10,color:'var(--fb-text)',textTransform:'uppercase',letterSpacing:'0.5px'}}>
                  Description courte
                </label>
                <input 
                  placeholder="Décrivez brièvement votre offre" 
                  value={form.content} 
                  onChange={e=>setForm({...form,content:e.target.value})} 
                  style={{
                    width:'100%',
                    padding:'12px 14px',
                    border:'1.5px solid var(--fb-border)',
                    borderRadius:10,
                    fontSize:14,
                    boxSizing:'border-box',
                    transition:'all 0.2s',
                    fontFamily:'inherit'
                  }}
                  onFocus={(e) => {e.target.style.borderColor = 'var(--fb-blue)'; e.target.style.boxShadow = '0 0 0 3px rgba(11,61,145,0.1)'}}
                  onBlur={(e) => {e.target.style.borderColor = 'var(--fb-border)'; e.target.style.boxShadow = 'none'}}
                />
              </div>

              <div>
                <label style={{display:'block',fontSize:13,fontWeight:700,marginBottom:10,color:'var(--fb-text)',textTransform:'uppercase',letterSpacing:'0.5px'}}>
                  URL de destination
                </label>
                <input 
                  placeholder="https://votre-site.com" 
                  value={form.link} 
                  onChange={e=>setForm({...form,link:e.target.value})} 
                  style={{
                    width:'100%',
                    padding:'12px 14px',
                    border:'1.5px solid var(--fb-border)',
                    borderRadius:10,
                    fontSize:14,
                    boxSizing:'border-box',
                    transition:'all 0.2s',
                    fontFamily:'inherit'
                  }}
                  onFocus={(e) => {e.target.style.borderColor = 'var(--fb-blue)'; e.target.style.boxShadow = '0 0 0 3px rgba(11,61,145,0.1)'}}
                  onBlur={(e) => {e.target.style.borderColor = 'var(--fb-border)'; e.target.style.boxShadow = 'none'}}
                />
              </div>

              <div style={{gridColumn:'1 / -1'}}>
                <label style={{display:'block',fontSize:13,fontWeight:700,marginBottom:10,color:'var(--fb-text)',textTransform:'uppercase',letterSpacing:'0.5px'}}>
                  URL de l'image (bannière)
                </label>
                <input 
                  placeholder="https://votre-site.com/image.jpg" 
                  value={form.image} 
                  onChange={e=>setForm({...form,image:e.target.value})} 
                  style={{
                    width:'100%',
                    padding:'12px 14px',
                    border:'1.5px solid var(--fb-border)',
                    borderRadius:10,
                    fontSize:14,
                    boxSizing:'border-box',
                    transition:'all 0.2s',
                    fontFamily:'inherit'
                  }}
                  onFocus={(e) => {e.target.style.borderColor = 'var(--fb-blue)'; e.target.style.boxShadow = '0 0 0 3px rgba(11,61,145,0.1)'}}
                  onBlur={(e) => {e.target.style.borderColor = 'var(--fb-border)'; e.target.style.boxShadow = 'none'}}
                />
              </div>

              {form.image && (
                <div style={{gridColumn:'1 / -1',borderRadius:12,overflow:'hidden',maxHeight:250,border:'1px solid var(--fb-border)'}}>
                  <img src={form.image} alt="Preview" style={{width:'100%',height:'100%',objectFit:'cover'}} onError={(e) => e.target.style.display='none'} />
                </div>
              )}

              {/* OWNER PROFILE SECTION */}
              <div style={{gridColumn:'1 / -1',background:'linear-gradient(135deg, rgba(11,61,145,0.05), rgba(118,75,162,0.05))',borderRadius:12,padding:20,border:'1px solid var(--fb-border)'}}>
                <h4 style={{margin:'0 0 16px 0',fontSize:14,fontWeight:700,color:'var(--fb-text)',textTransform:'uppercase',letterSpacing:'0.5px'}}>
                  <i className="fas fa-user-circle" style={{marginRight:8}}></i>
                  Profil du propriétaire de la publicité
                </h4>
                
                <div style={{display:'grid',gridTemplateColumns:'auto 1fr',gap:16,alignItems:'start'}}>
                  {/* Avatar preview */}
                  <div style={{width:60,height:60,borderRadius:'50%',background:form.color || 'linear-gradient(135deg,#667eea,#764ba2)',display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontWeight:700,fontSize:18,flexShrink:0,overflow:'hidden',border:'2px solid var(--fb-border)'}}>
                    {form.avatarUrl ? (
                      <img src={form.avatarUrl} alt="Owner" style={{width:'100%',height:'100%',objectFit:'cover'}} onError={(e) => e.target.style.display='none'} />
                    ) : (
                      form.author ? form.author[0].toUpperCase() : 'A'
                    )}
                  </div>

                  {/* Owner info inputs */}
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                    <div>
                      <label style={{display:'block',fontSize:12,fontWeight:600,marginBottom:6,color:'var(--fb-text)',textTransform:'uppercase'}}>
                        Nom du propriétaire
                      </label>
                      <input 
                        placeholder="Ex: Nike Store" 
                        value={form.author} 
                        onChange={e=>setForm({...form,author:e.target.value})} 
                        style={{
                          width:'100%',
                          padding:'10px 12px',
                          border:'1.5px solid var(--fb-border)',
                          borderRadius:8,
                          fontSize:13,
                          boxSizing:'border-box',
                          transition:'all 0.2s',
                          fontFamily:'inherit'
                        }}
                        onFocus={(e) => {e.target.style.borderColor = 'var(--fb-blue)'; e.target.style.boxShadow = '0 0 0 3px rgba(11,61,145,0.1)'}}
                        onBlur={(e) => {e.target.style.borderColor = 'var(--fb-border)'; e.target.style.boxShadow = 'none'}}
                      />
                    </div>
                    <div>
                      <label style={{display:'block',fontSize:12,fontWeight:600,marginBottom:6,color:'var(--fb-text)',textTransform:'uppercase'}}>
                        Couleur de gradient
                      </label>
                      <input 
                        type="color"
                        value={form.color || '#667eea'}
                        onChange={e=>setForm({...form,color:e.target.value})} 
                        style={{
                          width:'100%',
                          height:38,
                          border:'1.5px solid var(--fb-border)',
                          borderRadius:8,
                          cursor:'pointer',
                          boxSizing:'border-box'
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div style={{marginTop:12}}>
                  <label style={{display:'block',fontSize:12,fontWeight:600,marginBottom:6,color:'var(--fb-text)',textTransform:'uppercase'}}>
                    <i className="fas fa-image" style={{marginRight:6}}></i>
                    Avatar du propriétaire
                  </label>
                  
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                    {/* File upload option */}
                    <div style={{position:'relative'}}>
                      <input 
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarFileUpload}
                        style={{display:'none'}}
                        id="avatar-file-upload"
                      />
                      <label 
                        htmlFor="avatar-file-upload"
                        style={{
                          display:'flex',
                          alignItems:'center',
                          justifyContent:'center',
                          gap:8,
                          padding:'12px',
                          border:'2px dashed var(--fb-border)',
                          borderRadius:8,
                          fontSize:13,
                          fontWeight:600,
                          cursor:'pointer',
                          transition:'all 0.2s',
                          color:'var(--fb-text-secondary)',
                          background:'var(--fb-bg)'
                        }}
                        onMouseEnter={(e) => {e.currentTarget.style.borderColor = 'var(--fb-blue)'; e.currentTarget.style.background = 'rgba(11,61,145,0.05)'}}
                        onMouseLeave={(e) => {e.currentTarget.style.borderColor = 'var(--fb-border)'; e.currentTarget.style.background = 'var(--fb-bg)'}}
                      >
                        <i className="fas fa-cloud-upload-alt"></i>
                        Sélectionner
                      </label>
                    </div>

                    {/* URL input option */}
                    <input 
                      type="text"
                      placeholder="Ou coller une URL" 
                      value={form.avatarUrl} 
                      onChange={e=>setForm({...form,avatarUrl:e.target.value})} 
                      style={{
                        padding:'12px',
                        border:'1.5px solid var(--fb-border)',
                        borderRadius:8,
                        fontSize:13,
                        boxSizing:'border-box',
                        transition:'all 0.2s',
                        fontFamily:'inherit'
                      }}
                      onFocus={(e) => {e.target.style.borderColor = 'var(--fb-blue)'; e.target.style.boxShadow = '0 0 0 3px rgba(11,61,145,0.1)'}}
                      onBlur={(e) => {e.target.style.borderColor = 'var(--fb-border)'; e.target.style.boxShadow = 'none'}}
                    />
                  </div>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={saving}
                style={{
                  gridColumn:'1 / -1',
                  padding:'14px 28px',
                  background: saving ? '#ccc' : `linear-gradient(135deg, var(--fb-blue), var(--fb-blue-dark))`,
                  color:'white',
                  border:'none',
                  borderRadius:10,
                  fontSize:15,
                  fontWeight:700,
                  cursor: saving ? 'not-allowed' : 'pointer',
                  transition:'all 0.2s'
                }}
                onMouseEnter={(e) => !saving && (e.target.style.transform = 'translateY(-2px)', e.target.style.boxShadow = '0 8px 24px rgba(11,61,145,0.3)')}
                onMouseLeave={(e) => !saving && (e.target.style.transform = 'translateY(0)', e.target.style.boxShadow = 'none')}
              >
                {saving ? 'Création en cours...' : 'Créer la publicité'}
              </button>
              {/* Pay CTA shown if user hasn't paid */}
              <div style={{marginTop:12,gridColumn:'1 / -1',display:'flex',gap:12,alignItems:'center'}}>
                {!checkingPaid && !hasPaid && (
                  <button type="button" onClick={() => router.push('/sponsor/upgrade')} style={{padding:'10px 16px',borderRadius:8,background:'#0A7E3E',color:'white',border:'none',fontWeight:700,cursor:'pointer'}}>
                    Payer les frais
                  </button>
                )}
                {checkingPaid && (
                  <div style={{color:'#666'}}>Vérification paiement...</div>
                )}
                {!checkingPaid && !hasPaid && (
                  <div style={{color:'#d00'}}>Vous devez payer les frais de plateforme avant de publier.</div>
                )}
              </div>
            </form>
          </div>
        )}

        {/* TAB: HISTORY */}
        {activeTab === 'history' && (
          <div style={{display:'grid',gridTemplateColumns:'1fr',gap:24}}>
            
            {/* PURCHASE FORM */}
            {purchaseForm.sponsorId && (
              <div style={{background:'linear-gradient(135deg, var(--fb-blue), var(--fb-blue-dark))',borderRadius:14,padding:28,color:'white'}}>
                <h3 style={{margin:'0 0 20px 0',fontSize:18,fontWeight:700}}>
                  <i className="fas fa-shopping-cart" style={{marginRight:10}}></i>
                  Acheter un emplacement publicitaire
                </h3>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  setPurchasing(true);
                  (async () => {
                    try{
                      await fetch('/api/sponsors/purchases', {
                        method:'POST',
                        headers:{'Content-Type':'application/json'},
                        body: JSON.stringify(purchaseForm)
                      });
                      setPurchaseForm({ sponsorId:'', amount:'', currency:'EUR' });
                      fetchPurchases();
                      alert('✅ Achat enregistré avec succès !');
                    }catch(e){
                      console.error(e);
                      alert('❌ Erreur lors de l\'achat');
                    }
                    setPurchasing(false);
                  })();
                }} style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr auto',gap:12,alignItems:'end'}}>
                  <div>
                    <label style={{display:'block',fontSize:12,fontWeight:700,marginBottom:8,opacity:0.9}}>Sponsor</label>
                    <p style={{margin:0,fontSize:14,fontWeight:700}}>{sponsors.find(s => s.id == purchaseForm.sponsorId)?.title || '#' + purchaseForm.sponsorId}</p>
                  </div>
                  <div>
                    <label style={{display:'block',fontSize:12,fontWeight:700,marginBottom:8,opacity:0.9}}>Montant (€)</label>
                    <input 
                      placeholder="100.00" 
                      type="number" 
                      step="0.01" 
                      value={purchaseForm.amount} 
                      onChange={(e)=>setPurchaseForm({...purchaseForm,amount:e.target.value})} 
                      required 
                      style={{
                        width:'100%',
                        padding:'10px 12px',
                        border:'none',
                        borderRadius:8,
                        fontSize:14,
                        fontWeight:600,
                        boxSizing:'border-box'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{display:'block',fontSize:12,fontWeight:700,marginBottom:8,opacity:0.9}}>Devise</label>
                    <select value={purchaseForm.currency} onChange={(e)=>setPurchaseForm({...purchaseForm,currency:e.target.value})} style={{width:'100%',padding:'10px 12px',border:'none',borderRadius:8,fontSize:14,fontWeight:600,boxSizing:'border-box',cursor:'pointer'}}>
                      <option>EUR</option>
                      <option>USD</option>
                      <option>GBP</option>
                    </select>
                  </div>
                  <div style={{display:'flex',gap:8}}>
                    <button type="submit" disabled={purchasing} style={{padding:'10px 20px',background:'var(--fb-green)',color:'white',border:'none',borderRadius:8,fontWeight:700,cursor:'pointer',transition:'all 0.2s'}} onMouseEnter={(e) => !purchasing && (e.target.style.transform = 'translateY(-2px)')} onMouseLeave={(e) => !purchasing && (e.target.style.transform = 'translateY(0)')}>
                      {purchasing ? 'Traitement...' : 'Confirmer'}
                    </button>
                    <button type="button" onClick={() => setPurchaseForm({sponsorId:'',amount:'',currency:'EUR'})} style={{padding:'10px 20px',background:'rgba(255,255,255,0.2)',color:'white',border:'none',borderRadius:8,fontWeight:700,cursor:'pointer',transition:'all 0.2s'}} onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.3)'} onMouseLeave={(e) => e.target.style.background = 'rgba(255,255,255,0.2)'}>
                      Annuler
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* PURCHASES TABLE */}
            <div style={{background:'var(--fb-white)',borderRadius:14,padding:28,border:'1px solid var(--fb-border)',overflow:'auto'}}>
              <h3 style={{margin:'0 0 20px 0',fontSize:18,fontWeight:700}}>
                <i className="fas fa-receipt" style={{marginRight:10,color:'var(--fb-blue)'}}></i>
                Historique des achats
              </h3>
              {purchases.length === 0 ? (
                <div style={{textAlign:'center',padding:40}}>
                  <i className="fas fa-inbox" style={{fontSize:48,marginBottom:12,color:'var(--fb-text-secondary)',display:'block'}}></i>
                  <p style={{color:'var(--fb-text-secondary)',margin:0}}>Aucun achat enregistré. Commencez par acheter un emplacement !</p>
                </div>
              ) : (
                <div style={{overflowX:'auto',WebkitOverflowScrolling:'touch'}}>
                  <table style={{width:'100%',borderCollapse:'collapse'}} className="purchases-table">
                    <thead>
                      <tr style={{background:'var(--fb-bg)',borderBottom:'2px solid var(--fb-border)'}}>
                        <th style={{padding:14,textAlign:'left',fontSize:12,fontWeight:700,color:'var(--fb-text)',textTransform:'uppercase',letterSpacing:'0.5px'}}>ID</th>
                        <th style={{padding:14,textAlign:'left',fontSize:12,fontWeight:700,color:'var(--fb-text)',textTransform:'uppercase',letterSpacing:'0.5px'}}>Publicité</th>
                        <th style={{padding:14,textAlign:'right',fontSize:12,fontWeight:700,color:'var(--fb-text)',textTransform:'uppercase',letterSpacing:'0.5px'}}>Montant</th>
                        <th style={{padding:14,textAlign:'center',fontSize:12,fontWeight:700,color:'var(--fb-text)',textTransform:'uppercase',letterSpacing:'0.5px'}}>Devise</th>
                        <th style={{padding:14,textAlign:'center',fontSize:12,fontWeight:700,color:'var(--fb-text)',textTransform:'uppercase',letterSpacing:'0.5px'}}>Statut</th>
                        <th style={{padding:14,textAlign:'left',fontSize:12,fontWeight:700,color:'var(--fb-text)',textTransform:'uppercase',letterSpacing:'0.5px'}}>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {purchases.map((p,idx) => (
                        <tr key={p.id} style={{borderBottom:'1px solid var(--fb-border)',background:idx % 2 === 0 ? 'transparent' : 'var(--fb-bg)',transition:'all 0.2s'}} className="table-row-hover">
                          <td style={{padding:14,fontSize:13}}>#{p.id}</td>
                          <td style={{padding:14,fontSize:13,fontWeight:600,color:'var(--fb-blue)'}}>{p.sponsor?.title || `#${p.sponsorId}`}</td>
                          <td style={{padding:14,fontSize:13,textAlign:'right',fontWeight:700,fontSize:14}}>€{parseFloat(p.amount).toFixed(2)}</td>
                          <td style={{padding:14,fontSize:13,textAlign:'center',fontWeight:600}}>{p.currency}</td>
                          <td style={{padding:14,fontSize:13,textAlign:'center'}}>
                            <span style={{background:p.status === 'completed' ? 'rgba(66,183,42,0.1)' : 'rgba(200,200,200,0.1)',color:p.status === 'completed' ? 'var(--fb-green)' : 'var(--fb-text-secondary)',padding:'6px 12px',borderRadius:6,fontSize:12,fontWeight:700}}>
                              {p.status === 'completed' ? 'Complété' : p.status}
                            </span>
                          </td>
                          <td style={{padding:14,fontSize:13}}>{new Date(p.createdAt).toLocaleDateString('fr-FR',{year:'numeric',month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <style>{`
        .stat-card:hover {
          border-color: var(--fb-blue);
          box-shadow: 0 4px 12px rgba(11, 61, 145, 0.08);
          transform: translateY(-2px);
        }
        .sponsor-premium-card:hover {
          box-shadow: 0 8px 24px rgba(0,0,0,0.12);
          border-color: var(--fb-blue);
          transform: translateY(-2px);
        }
        .table-row-hover:hover {
          background: linear-gradient(90deg, rgba(11,61,145,0.02), transparent);
        }

        /* Mobile Responsive */
        @media (max-width: 768px) {
          .sponsor-premium-card {
            border-radius: 12px !important;
          }

          /* Adapt sponsor cards grid */
          .sponsor-cards-grid {
            display: grid !important;
            grid-template-columns: 1fr !important;
            gap: 12px !important;
          }

          /* Adapt stat cards grid */
          .stats-grid {
            grid-template-columns: 1fr !important;
            gap: 12px !important;
          }

          /* Adapt tabs */
          .tabs-container {
            overflow-x: auto !important;
            -webkit-overflow-scrolling: touch;
            scroll-behavior: smooth;
          }

          .tab-button {
            font-size: 13px !important;
            padding: 10px 12px !important;
            min-width: fit-content;
          }

          /* Adjust heading */
          .sponsors-heading {
            font-size: 24px !important;
          }

          /* Form adjustments */
          .form-grid {
            grid-template-columns: 1fr !important;
          }

          /* Table adjustments */
          .purchases-table {
            font-size: 12px !important;
          }

          .purchases-table td {
            padding: 10px 6px !important;
          }

          /* Button adjustments */
          .sponsor-action-buttons {
            flex-direction: column !important;
            gap: 8px !important;
          }

          .sponsor-action-buttons button {
            width: 100% !important;
            padding: 10px 12px !important;
            font-size: 13px !important;
          }

          /* Hide sidebar on mobile (if needed) */
          @media (max-width: 640px) {
            .right-sidebar {
              display: none;
            }

            .sponsors-heading {
              font-size: 20px !important;
            }

            /* Increase touch targets */
            button {
              min-height: 44px !important;
            }

            /* Adjust padding */
            .sponsors-container {
              padding: 16px 8px !important;
            }

            /* Stack stat values better */
            .stat-card {
              padding: 14px 12px !important;
            }

            /* Text adjustments */
            h1 {
              letter-spacing: 0 !important;
            }
          }
        }

        @media (max-width: 480px) {
          .sponsors-heading {
            font-size: 18px !important;
          }

          .stat-value {
            font-size: 20px !important;
          }

          .stat-label {
            font-size: 11px !important;
          }

          .purchases-table {
            font-size: 11px !important;
          }

          /* Better spacing on small screens */
          .sponsors-container {
            padding: 12px 6px !important;
          }

          .sponsor-premium-card {
            margin-bottom: 8px;
          }
        }
      `}</style>
    </Layout>
  );
}
