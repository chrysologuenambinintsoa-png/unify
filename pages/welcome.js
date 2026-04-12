import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faComments, 
  faVideo, 
  faUsers, 
  faBell, 
  faEnvelope, 
  faNewspaper, 
  faUserGroup, 
  faCalendarCheck,
  faGlobe,
  faShieldHalved,
  faBolt,
  faHeart,
  faArrowRight,
  faSignOutAlt,
  faUser,
  faEnvelope as faEnvelopeIcon,
  faCheckCircle,
  faRocket,
  faStar,
  faPlay,
  faFileContract,
  faLifeRing
} from '@fortawesome/free-solid-svg-icons'

export default function WelcomePage(){
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [stats, setStats] = useState({ users: 0, posts: 0, communities: 0 })

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (!userData) {
      router.push('/account-picker')
    } else {
      setUser(JSON.parse(userData))
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!loading) {
      const interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % slides.length)
      }, 5000)
      return () => clearInterval(interval)
    }
  }, [loading])

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/stats')
        if (response.ok) {
          const data = await response.json()
          setStats(data)
        }
      } catch (error) {
        console.error('Error fetching stats:', error)
      }
    }
    fetchStats()
  }, [])

  const slides = [
    {
      icon: faComments,
      title: 'Connectez-vous avec vos amis',
      description: 'Partagez vos moments, vos pensées et vos sentiments en temps réel',
      color: '#3B82F6',
      bgGradient: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)'
    },
    {
      icon: faVideo,
      title: 'Partagez vos souvenirs',
      description: 'Publiez des photos, vidéos et créez des souvenirs inoubliables',
      color: '#F59E0B',
      bgGradient: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)'
    },
    {
      icon: faUsers,
      title: 'Rejoignez des communautés',
      description: 'Découvrez des groupes basés sur vos intérêts et passions',
      color: '#8B5CF6',
      bgGradient: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)'
    },
    {
      icon: faBell,
      title: 'Restez informé',
      description: 'Recevez des notifications sur les activités de vos proches',
      color: '#10B981',
      bgGradient: 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
    }
  ]

  const features = [
    { icon: faEnvelope, title: 'Messagerie', description: 'Conversations privées et sécurisées', color: '#3B82F6' },
    { icon: faNewspaper, title: 'Fil d\'actualité', description: 'Suivez l\'activité de vos amis', color: '#F59E0B' },
    { icon: faUserGroup, title: 'Groupes', description: 'Créez et rejoignez des groupes', color: '#8B5CF6' },
    { icon: faCalendarCheck, title: 'Événements', description: 'Organisez des événements mémorables', color: '#10B981' }
  ]

  const guide = [
    { step: 1, title: 'Complétez votre profil', description: 'Ajoutez votre photo et vos informations', icon: faUser },
    { step: 2, title: 'Trouvez vos amis', description: 'Recherchez et ajoutez vos amis', icon: faUsers },
    { step: 3, title: 'Partagez votre contenu', description: 'Publiez vos photos et vos pensées', icon: faVideo },
    { step: 4, title: 'Interagissez', description: 'Aimez, commentez et partagez', icon: faHeart }
  ]

  const handleLogout = () => {
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
    router.push('/account-picker')
  }

  if (loading) {
    return (
      <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'linear-gradient(135deg, #0F172A 0%, #1E40AF 50%, #3B82F6 100%)'}}>
        <div style={{textAlign:'center',color:'white'}}>
          <div style={{fontSize:48,marginBottom:16,animation:'bounce 1s infinite'}}>
            <FontAwesomeIcon icon={faRocket} />
          </div>
          <p style={{fontSize:16,fontWeight:500,letterSpacing:'0.5px'}}>Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{minHeight:'100vh',background:'#F8FAFC'}}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideIn { from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
        @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-10px); } }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        @keyframes gradientShift { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
        
        .welcome-header { animation: fadeIn 0.6s ease-out; }
        .slide-container { animation: fadeIn 0.8s ease-out; }
        .feature-card { 
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1); 
          position: relative;
          overflow: hidden;
        }
        .feature-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
          transform: translateX(-100%);
          transition: transform 0.6s ease;
        }
        .feature-card:hover::before {
          transform: translateX(100%);
        }
        .feature-card:hover { 
          transform: translateY(-12px) scale(1.02); 
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15); 
        }
        .guide-step { animation: slideIn 0.6s ease-out; }
        .guide-step:nth-child(1) { animation-delay: 0.1s; }
        .guide-step:nth-child(2) { animation-delay: 0.2s; }
        .guide-step:nth-child(3) { animation-delay: 0.3s; }
        .guide-step:nth-child(4) { animation-delay: 0.4s; }
        
        .logo-animated { animation: float 3s ease-in-out infinite; }
        .slide-dot { transition: all 0.3s ease; cursor: pointer; }
        .slide-dot.active { transform: scale(1.3); }
        
        .btn-primary {
          background: linear-gradient(135deg, #0F172A 0%, #1E40AF 50%, #3B82F6 100%);
          background-size: 200% 200%;
          animation: gradientShift 3s ease infinite;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }
        .btn-primary::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          transition: left 0.5s ease;
        }
        .btn-primary:hover::before {
          left: 100%;
        }
        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(30, 64, 175, 0.4);
        }
        
        .btn-secondary {
          transition: all 0.3s ease;
        }
        .btn-secondary:hover {
          background: #E2E8F0;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        
        .stat-card {
          transition: all 0.3s ease;
        }
        .stat-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
        }
        
        .slide-icon-container {
          animation: float 4s ease-in-out infinite;
        }
        
        @media (max-width: 1024px) {
          .features-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .guide-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        
        @media (max-width: 768px) {
          .welcome-container { padding: 12px !important; }
          .features-grid { grid-template-columns: 1fr !important; }
          .guide-grid { grid-template-columns: 1fr !important; }
          .hero-section { padding: 24px 16px !important; }
          .about-grid { grid-template-columns: 1fr !important; }
          .stats-grid { flex-direction: column !important; gap: 16px !important; }
          .profile-grid { grid-template-columns: 1fr !important; }
          .buttons-grid { flex-direction: column !important; }
          .footer-links { flex-wrap: wrap !important; justify-content: center !important; }
        }
      `}</style>

      {/* Hero Section avec Logo et Titre */}
      <div style={{
        background:'linear-gradient(135deg, #0F172A 0%, #1E40AF 50%, #3B82F6 100%)',
        backgroundSize: '200% 200%',
        animation: 'gradientShift 8s ease infinite',
        padding:'80px 20px 60px',
        color:'white',
        textAlign:'center',
        position:'relative',
        overflow:'hidden'
      }}>
        {/* Background decoration */}
        <div style={{
          position:'absolute',
          top:0,
          left:0,
          right:0,
          bottom:0,
          background:'radial-gradient(circle at 20% 80%, rgba(255,255,255,0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.08) 0%, transparent 50%)',
          pointerEvents:'none'
        }} />
        
        <div className="welcome-header" style={{maxWidth:800,margin:'0 auto',position:'relative',zIndex:1}}>
          <div className="logo-animated" style={{fontSize:80,marginBottom:24,display:'inline-block'}}>
            <div style={{
              display:'inline-flex',
              alignItems:'center',
              justifyContent:'center',
              width:120,
              height:120,
              background:'rgba(255,255,255,0.1)',
              backdropFilter:'blur(10px)',
              borderRadius:24,
              border:'1px solid rgba(255,255,255,0.2)',
              boxShadow:'0 8px 32px rgba(0,0,0,0.2)'
            }}>
              <img src="/logo.svg" alt="Unify Logo" style={{width:80,height:80,filter:'drop-shadow(0 4px 8px rgba(0,0,0,0.3))'}} />
            </div>
          </div>
          <h1 style={{
            fontSize:56,
            fontWeight:800,
            margin:'0 0 16px 0',
            letterSpacing:'-1px',
            textShadow:'0 4px 8px rgba(0,0,0,0.3)',
            background:'linear-gradient(135deg, #fff 0%, #E0E7FF 100%)',
            WebkitBackgroundClip:'text',
            WebkitTextFillColor:'transparent',
            backgroundClip:'text'
          }}>Unify</h1>
          <p style={{fontSize:20,opacity:0.95,margin:'0 0 12px 0',fontWeight:500}}>Connectez-vous, partagez, découvrez</p>
          <p style={{fontSize:15,opacity:0.8,margin:0,maxWidth:500,marginLeft:'auto',marginRight:'auto',lineHeight:1.6}}>La plateforme sociale pour tisser des liens authentiques</p>
          
          {/* Stats */}
          <div className="stats-grid" style={{display:'flex',justifyContent:'center',gap:40,marginTop:40,flexWrap:'wrap'}}>
            <div style={{textAlign:'center'}}>
              <div style={{fontSize:32,fontWeight:700,marginBottom:4}}>{stats.users > 0 ? `${stats.users}+` : '0'}</div>
              <div style={{fontSize:13,opacity:0.8}}>Utilisateurs</div>
            </div>
            <div style={{textAlign:'center'}}>
              <div style={{fontSize:32,fontWeight:700,marginBottom:4}}>{stats.posts > 0 ? `${stats.posts}+` : '0'}</div>
              <div style={{fontSize:13,opacity:0.8}}>Publications</div>
            </div>
            <div style={{textAlign:'center'}}>
              <div style={{fontSize:32,fontWeight:700,marginBottom:4}}>{stats.communities > 0 ? `${stats.communities}+` : '0'}</div>
              <div style={{fontSize:13,opacity:0.8}}>Communautés</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{maxWidth:1100,margin:'0 auto',padding:'40px 20px'}}>
        {/* Carousel/Slides */}
        <div className="slide-container" style={{
          background:'white',
          borderRadius:20,
          padding:48,
          marginBottom:48,
          boxShadow:'0 4px 24px rgba(0,0,0,0.06)',
          border:'1px solid #E2E8F0'
        }}>
          <div style={{textAlign:'center',minHeight:320,display:'flex',flexDirection:'column',justifyContent:'center',alignItems:'center'}}>
            <div className="slide-icon-container" style={{
              width:120,
              height:120,
              background:slides[currentSlide].bgGradient,
              borderRadius:32,
              display:'flex',
              alignItems:'center',
              justifyContent:'center',
              marginBottom:24,
              boxShadow:`0 12px 32px ${slides[currentSlide].color}40`
            }}>
              <FontAwesomeIcon icon={slides[currentSlide].icon} style={{fontSize:48,color:'white'}} />
            </div>
            <h2 style={{fontSize:36,fontWeight:700,margin:'0 0 16px 0',color:'#0F172A'}}>{slides[currentSlide].title}</h2>
            <p style={{fontSize:17,color:'#64748B',margin:'0 0 32px 0',maxWidth:550,lineHeight:1.7}}>{slides[currentSlide].description}</p>
          </div>
          
          {/* Dots */}
          <div style={{display:'flex',justifyContent:'center',gap:12,marginTop:32}}>
            {slides.map((slide, idx) => (
              <button
                key={idx}
                className={`slide-dot ${idx === currentSlide ? 'active' : ''}`}
                onClick={() => setCurrentSlide(idx)}
                style={{
                  width: idx === currentSlide ? 36 : 12,
                  height: 12,
                  borderRadius: 6,
                  background: idx === currentSlide ? slide.color : '#CBD5E1',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
              />
            ))}
          </div>
        </div>

        {/* Description Section */}
        <div style={{
          background:'white',
          borderRadius:20,
          padding:48,
          marginBottom:48,
          boxShadow:'0 4px 24px rgba(0,0,0,0.06)',
          border:'1px solid #E2E8F0'
        }}>
          <div style={{textAlign:'center',marginBottom:40}}>
            <div style={{
              display:'inline-flex',
              alignItems:'center',
              gap:8,
              background:'#F1F5F9',
              padding:'8px 16px',
              borderRadius:20,
              marginBottom:16
            }}>
              <FontAwesomeIcon icon={faStar} style={{color:'#F59E0B',fontSize:14}} />
              <span style={{fontSize:13,fontWeight:600,color:'#475569'}}>À propos</span>
            </div>
            <h2 style={{fontSize:32,fontWeight:700,margin:'0 0 12px 0',color:'#0F172A'}}>À propos d'Unify</h2>
            <p style={{fontSize:16,color:'#64748B',maxWidth:600,margin:'0 auto',lineHeight:1.7}}>Une plateforme sociale révolutionnaire conçue pour vous connecter avec les personnes qui comptent vraiment.</p>
          </div>
          
          <div className="about-grid" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:40,alignItems:'center'}}>
            <div>
              <p style={{fontSize:16,color:'#334155',lineHeight:1.8,marginBottom:20}}>
                <strong>Unify</strong> est une plateforme sociale révolutionnaire conçue pour vous connecter avec les personnes qui comptent vraiment.
              </p>
              <p style={{fontSize:16,color:'#334155',lineHeight:1.8,marginBottom:20}}>
                Que vous souhaitiez rester en contact avec vos amis, avoir des discussions significatives ou découvrir de nouvelles communautés, Unify met la connexion authentique au cœur de tout.
              </p>
              <p style={{fontSize:16,color:'#334155',lineHeight:1.8}}>
                Bienvenue dans une plateforme où votre voix compte et où chaque interaction a du sens.
              </p>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
              <div className="stat-card" style={{background:'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',borderRadius:16,padding:24,textAlign:'center',border:'1px solid #BFDBFE'}}>
                <FontAwesomeIcon icon={faGlobe} style={{fontSize:28,color:'#3B82F6',marginBottom:12}} />
                <p style={{fontSize:15,fontWeight:600,color:'#1E40AF',margin:0}}>Mondial</p>
              </div>
              <div className="stat-card" style={{background:'linear-gradient(135deg, #F5F3FF 0%, #EDE9FE 100%)',borderRadius:16,padding:24,textAlign:'center',border:'1px solid #C4B5FD'}}>
                <FontAwesomeIcon icon={faShieldHalved} style={{fontSize:28,color:'#8B5CF6',marginBottom:12}} />
                <p style={{fontSize:15,fontWeight:600,color:'#6D28D9',margin:0}}>Sécurisé</p>
              </div>
              <div className="stat-card" style={{background:'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)',borderRadius:16,padding:24,textAlign:'center',border:'1px solid #FDE68A'}}>
                <FontAwesomeIcon icon={faBolt} style={{fontSize:28,color:'#F59E0B',marginBottom:12}} />
                <p style={{fontSize:15,fontWeight:600,color:'#D97706',margin:0}}>Rapide</p>
              </div>
              <div className="stat-card" style={{background:'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)',borderRadius:16,padding:24,textAlign:'center',border:'1px solid #A7F3D0'}}>
                <FontAwesomeIcon icon={faHeart} style={{fontSize:28,color:'#10B981',marginBottom:12}} />
                <p style={{fontSize:15,fontWeight:600,color:'#059669',margin:0}}>Éthique</p>
              </div>
            </div>
          </div>
        </div>

        {/* Features */}
        <div style={{marginBottom:48}}>
          <div style={{textAlign:'center',marginBottom:32}}>
            <div style={{
              display:'inline-flex',
              alignItems:'center',
              gap:8,
              background:'#F1F5F9',
              padding:'8px 16px',
              borderRadius:20,
              marginBottom:16
            }}>
              <FontAwesomeIcon icon={faRocket} style={{color:'#3B82F6',fontSize:14}} />
              <span style={{fontSize:13,fontWeight:600,color:'#475569'}}>Fonctionnalités</span>
            </div>
            <h2 style={{fontSize:32,fontWeight:700,margin:'0 0 12px 0',color:'#0F172A'}}>Fonctionnalités principales</h2>
            <p style={{fontSize:16,color:'#64748B',maxWidth:500,margin:'0 auto'}}>Découvrez tout ce qu'Unify a à offrir</p>
          </div>
          
          <div className="features-grid" style={{display:'grid',gridTemplateColumns:'repeat(4, 1fr)',gap:20}}>
            {features.map((feature, idx) => (
              <div key={idx} className="feature-card" style={{
                background:'white',
                borderRadius:16,
                padding:28,
                textAlign:'center',
                boxShadow:'0 2px 12px rgba(0,0,0,0.04)',
                border:'1px solid #E2E8F0'
              }}>
                <div style={{
                  width:64,
                  height:64,
                  background:`${feature.color}15`,
                  borderRadius:16,
                  display:'flex',
                  alignItems:'center',
                  justifyContent:'center',
                  margin:'0 auto 16px'
                }}>
                  <FontAwesomeIcon icon={feature.icon} style={{fontSize:24,color:feature.color}} />
                </div>
                <h3 style={{fontSize:17,fontWeight:700,margin:'0 0 8px 0',color:'#0F172A'}}>{feature.title}</h3>
                <p style={{fontSize:14,color:'#64748B',margin:0,lineHeight:1.6}}>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Guide de démarrage */}
        <div style={{
          background:'white',
          borderRadius:20,
          padding:48,
          marginBottom:48,
          boxShadow:'0 4px 24px rgba(0,0,0,0.06)',
          border:'1px solid #E2E8F0'
        }}>
          <div style={{textAlign:'center',marginBottom:40}}>
            <div style={{
              display:'inline-flex',
              alignItems:'center',
              gap:8,
              background:'#F1F5F9',
              padding:'8px 16px',
              borderRadius:20,
              marginBottom:16
            }}>
              <FontAwesomeIcon icon={faPlay} style={{color:'#10B981',fontSize:14}} />
              <span style={{fontSize:13,fontWeight:600,color:'#475569'}}>Guide</span>
            </div>
            <h2 style={{fontSize:32,fontWeight:700,margin:'0 0 12px 0',color:'#0F172A'}}>Guide de démarrage</h2>
            <p style={{fontSize:16,color:'#64748B',maxWidth:500,margin:'0 auto'}}>Commencez en quelques étapes simples</p>
          </div>
          
          <div className="guide-grid" style={{display:'grid',gridTemplateColumns:'repeat(4, 1fr)',gap:24}}>
            {guide.map((item, idx) => (
              <div key={idx} className="guide-step" style={{textAlign:'center'}}>
                <div style={{
                  width: 72,
                  height: 72,
                  background: 'linear-gradient(135deg, #0F172A 0%, #1E40AF 100%)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 20px',
                  color: 'white',
                  fontWeight: 700,
                  boxShadow:'0 8px 24px rgba(30, 64, 175, 0.3)',
                  position:'relative'
                }}>
                  <FontAwesomeIcon icon={item.icon} style={{fontSize:24}} />
                  <div style={{
                    position:'absolute',
                    top:-4,
                    right:-4,
                    width:24,
                    height:24,
                    background:'#3B82F6',
                    borderRadius:'50%',
                    display:'flex',
                    alignItems:'center',
                    justifyContent:'center',
                    fontSize:12,
                    fontWeight:700,
                    border:'2px solid white'
                  }}>{item.step}</div>
                </div>
                <h3 style={{fontSize:16,fontWeight:700,margin:'0 0 8px 0',color:'#0F172A'}}>{item.title}</h3>
                <p style={{fontSize:14,color:'#64748B',margin:0,lineHeight:1.6}}>{item.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Profil utilisateur */}
        <div style={{
          background:'white',
          borderRadius:20,
          padding:36,
          marginBottom:48,
          boxShadow:'0 4px 24px rgba(0,0,0,0.06)',
          border:'1px solid #E2E8F0'
        }}>
          <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:24}}>
            <div style={{
              width:48,
              height:48,
              background:'linear-gradient(135deg, #0F172A 0%, #1E40AF 100%)',
              borderRadius:12,
              display:'flex',
              alignItems:'center',
              justifyContent:'center'
            }}>
              <FontAwesomeIcon icon={faUser} style={{fontSize:20,color:'white'}} />
            </div>
            <div>
              <h2 style={{fontSize:22,fontWeight:700,margin:0,color:'#0F172A'}}>Votre profil</h2>
              <p style={{fontSize:14,color:'#64748B',margin:0}}>Informations de votre compte</p>
            </div>
          </div>
          
          <div className="profile-grid" style={{display:'grid',gridTemplateColumns:'repeat(3, 1fr)',gap:20,marginBottom:28}}>
            <div style={{padding:20,background:'#F8FAFC',borderRadius:12,border:'1px solid #E2E8F0'}}>
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
                <FontAwesomeIcon icon={faUser} style={{fontSize:14,color:'#64748B'}} />
                <p style={{color:'#64748B',fontSize:12,margin:0,textTransform:'uppercase',fontWeight:600,letterSpacing:'0.5px'}}>Prénom</p>
              </div>
              <p style={{fontSize:18,fontWeight:600,margin:0,color:'#0F172A'}}>{user?.prenom || 'N/A'}</p>
            </div>
            <div style={{padding:20,background:'#F8FAFC',borderRadius:12,border:'1px solid #E2E8F0'}}>
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
                <FontAwesomeIcon icon={faUser} style={{fontSize:14,color:'#64748B'}} />
                <p style={{color:'#64748B',fontSize:12,margin:0,textTransform:'uppercase',fontWeight:600,letterSpacing:'0.5px'}}>Nom</p>
              </div>
              <p style={{fontSize:18,fontWeight:600,margin:0,color:'#0F172A'}}>{user?.nom || 'N/A'}</p>
            </div>
            <div style={{padding:20,background:'#F8FAFC',borderRadius:12,border:'1px solid #E2E8F0'}}>
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
                <FontAwesomeIcon icon={faEnvelopeIcon} style={{fontSize:14,color:'#64748B'}} />
                <p style={{color:'#64748B',fontSize:12,margin:0,textTransform:'uppercase',fontWeight:600,letterSpacing:'0.5px'}}>Email</p>
              </div>
              <p style={{fontSize:16,fontWeight:600,margin:0,color:'#0F172A',wordBreak:'break-all'}}>{user?.email || 'N/A'}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="buttons-grid" style={{display:'flex',gap:16,flexWrap:'wrap'}}>
            <Link href="/" style={{flex:1,minWidth:200,textDecoration:'none'}}>
              <button className="btn-primary" style={{
                width:'100%',
                padding:16,
                color:'white',
                border:'none',
                borderRadius:12,
                fontWeight:700,
                cursor:'pointer',
                fontSize:15,
                display:'flex',
                alignItems:'center',
                justifyContent:'center',
                gap:10
              }}>
                <span>Commencer</span>
                <FontAwesomeIcon icon={faArrowRight} />
              </button>
            </Link>
            <button onClick={handleLogout} className="btn-secondary" style={{
              flex:1,
              minWidth:200,
              padding:16,
              background:'#F8FAFC',
              color:'#0F172A',
              border:'2px solid #E2E8F0',
              borderRadius:12,
              fontWeight:700,
              cursor:'pointer',
              fontSize:15,
              display:'flex',
              alignItems:'center',
              justifyContent:'center',
              gap:10
            }}>
              <FontAwesomeIcon icon={faSignOutAlt} />
              <span>Se déconnecter</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          textAlign:'center',
          paddingBottom:48,
          color:'#64748B',
          fontSize:14
        }}>
          <div style={{
            display:'flex',
            alignItems:'center',
            justifyContent:'center',
            gap:8,
            marginBottom:12
          }}>
            <img src="/logo.svg" alt="Unify" style={{width:24,height:24}} />
            <span style={{fontWeight:600,color:'#0F172A'}}>Unify</span>
          </div>
          <p style={{margin:0}}>© 2026 Unify. Tous droits réservés.</p>
          <div className="footer-links" style={{display:'flex',justifyContent:'center',gap:20,marginTop:12}}>
            <Link href="/privacy" style={{color:'#3B82F6',textDecoration:'none',fontWeight:500,transition:'color 0.3s ease',display:'flex',alignItems:'center',gap:6}}>
              <FontAwesomeIcon icon={faShieldHalved} style={{fontSize:14}} />
              <span>Politique de confidentialité</span>
            </Link>
            <span style={{color:'#CBD5E1'}}>|</span>
            <Link href="/terms" style={{color:'#3B82F6',textDecoration:'none',fontWeight:500,transition:'color 0.3s ease',display:'flex',alignItems:'center',gap:6}}>
              <FontAwesomeIcon icon={faFileContract} style={{fontSize:14}} />
              <span>Conditions d'utilisation</span>
            </Link>
            <span style={{color:'#CBD5E1'}}>|</span>
            <Link href="/support" style={{color:'#3B82F6',textDecoration:'none',fontWeight:500,transition:'color 0.3s ease',display:'flex',alignItems:'center',gap:6}}>
              <FontAwesomeIcon icon={faLifeRing} style={{fontSize:14}} />
              <span>Support</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
