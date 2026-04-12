import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { ContactSkeleton, GroupSkeleton } from './Skeleton';
import ClickableAvatar from './ClickableAvatar';

export default function SidebarRight(){
  const router = useRouter();
  const [contacts, setContacts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [groups, setGroups] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [sponsors, setSponsors] = useState([]);
  const [bannerIndex, setBannerIndex] = useState(0);
  const [loadingSponsor, setLoadingSponsor] = useState(false);
  const currentSponsor = sponsors[bannerIndex] || null;

  // helper to format lastSeen into human string
  const formatLast = (ts) => {
    if(!ts) return '';
    const diff = Date.now() - new Date(ts);
    if(diff < 60000) return 'en ligne';
    if(diff < 3600000) return `${Math.floor(diff/60000)} mn`;
    if(diff < 86400000) return `${Math.floor(diff/3600000)} h`;
    return `${Math.floor(diff/86400000)} j`;
  };

  // load contacts from backend (reuse amis endpoint)
  const loadContacts = () => {
    setLoadingContacts(true);
    try {
      const userStr = localStorage.getItem('user')
      const user = userStr ? JSON.parse(userStr) : null
      const userEmail = user?.email
      if (!userEmail) {
        setLoadingContacts(false)
        return
      }
      fetch(`/api/amis?userEmail=${encodeURIComponent(userEmail)}`)
        .then(r => r.json())
        .then(d => {
          const friends = d.amis || [];
          const formatted = friends
            .map(f => ({
              name: `${f.prenom || ''} ${f.nom || ''}`.trim(),
              email: f.email || f.nomUtilisateur || '',
              initials: f.prenom ? `${f.prenom[0]}${(f.nom||'')[0]||''}`.toUpperCase() : (f.nomUtilisateur ? f.nomUtilisateur.slice(0,2).toUpperCase() : ''),
              color: f.color || 'linear-gradient(135deg,#667eea,#764ba2)',
              // prefer actual URL if available, otherwise fallback on string/avatar
              avatar: f.avatarUrl || f.avatar || null,
              online: f.online || false,
              lastSeen: f.lastSeen,
            }))
            .filter(c => c.email); // supprimer contacts sans adresse
          console.log('loaded contacts', formatted);
          setContacts(formatted);
        })
        .catch((err) => {
          console.error('error loading contacts', err);
        })
        .finally(() => setLoadingContacts(false));
    } catch (e) {
      console.error('error in loadContacts', e);
      setLoadingContacts(false)
    }
  };

  useEffect(() => {
    loadContacts();
    loadGroups();
    loadSponsor();
    const interval = setInterval(loadContacts, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (sponsors.length === 0) return;
    const id = setInterval(() => {
      setBannerIndex(i => (i + 1) % sponsors.length);
    }, 30000);
    return () => clearInterval(id);
  }, [sponsors]);

  const loadGroups = () => {
    setLoadingGroups(true);
    const userStr = localStorage.getItem('user');
    const localUser = userStr ? JSON.parse(userStr) : null;
    const email = localUser ? localUser.email : '';
    fetch(`/api/groupes?userEmail=${encodeURIComponent(email)}`)
      .then(r => r.json())
      .then(d => setGroups(d.groupes || []))
      .catch(()=>{})
      .finally(()=>setLoadingGroups(false));
  };

  const loadSponsor = () => {
    setLoadingSponsor(true);
    fetch('/api/sponsors/list-with-stats')
      .then(r => r.json())
      .then(data => {
        if (data && Array.isArray(data.sponsors) && data.sponsors.length > 0) {
          const top = data.sponsors
            .sort((a, b) => (b.stats?.clicks || 0) - (a.stats?.clicks || 0))
            .slice(0, 5); // keep a few for rotation
          setSponsors(top);
          setBannerIndex(0);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingSponsor(false));
  };

  const openChat = (contact) => {
    console.log('openChat called for contact', contact)
    if (!contact.email) {
      console.warn('openChat: contact has no email, cannot open chat', contact)
      return
    }
    // Déclencher un événement pour ouvrir le chat modal dans Navbar
    window.dispatchEvent(new CustomEvent('openChatWithContact', {
      detail: {
        contactEmail: contact.email,
        contactName: contact.name
      }
    }))
  };

  return (
    <aside className="right-sidebar">
      {/* SPONSORED CARD - Facebook Style */}
      <div className="sponsored-card">
        <div className="section-header">
          <div className="section-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6zm3-6c0 1.66-1.34 3-3 3s-3-1.34-3-3 1.34-3 3-3 3 1.34 3 3z"/>
            </svg>
            Publicités sponsorisées
          </div>
        </div>
        <p style={{fontSize:13,color:'var(--fb-text-secondary)',margin:'0 0 12px 0',lineHeight:1.4}}>
          Découvrez les meilleures offres sélectionnées pour vous
        </p>
        {loadingSponsor ? (
          <div className="loading-state">Chargement des annonces...</div>
        ) : currentSponsor ? (
          <>
            <div className="banner">
              {currentSponsor.image && (
                <img src={currentSponsor.image} alt={currentSponsor.title} />
              )}
              <div className="banner-overlay">
                <span>{currentSponsor.title}</span>
              </div>
            </div>
            {currentSponsor.content && (
              <p className="sponsored-content">{currentSponsor.content}</p>
            )}
            <div style={{textAlign:'right'}}>
              <a href="/sponsors" className="see-all-link">
                Voir tous <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>
              </a>
            </div>
          </>
        ) : (
          <div className="empty-state" style={{fontSize: '12px', fontStyle: 'italic'}}>
            Aucune publicité disponible pour le moment
          </div>
        )}
      </div>

      {/* CONTACTS SECTION - Facebook Style */}
      <div className="card contacts-section">
        <div className="section-header">
          <div className="section-title">Contacts</div>
          <div className="contacts-icons">
            <button className="nav-icon-btn" onClick={() => setShowSearch(!showSearch)} title="Rechercher">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
              </svg>
            </button>
            <button className="nav-icon-btn" title="Options">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
              </svg>
            </button>
          </div>
        </div>
        
        {/* SEARCH INPUT */}
        {showSearch && (
          <div style={{marginBottom: 8}}>
            <input 
              type="text"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
              className="search-input"
            />
          </div>
        )}
        
        {loadingContacts ? (
          Array.from({length:5}).map((_,i)=><ContactSkeleton key={i} />)
        ) : contacts.length === 0 ? (
          <div className="empty-state">Aucun contact</div>
        ) : (
          <>
            {/* Online contacts */}
            {contacts
              .filter(c => c.online)
              .filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.email.toLowerCase().includes(searchTerm.toLowerCase()))
              .map((c,i)=> {
                const selected = router.query.contact === c.email;
                return (
                  <div
                    key={`online-${i}`}
                    className={`contact-item${selected ? ' selected' : ''}`}
                    onClick={()=>openChat(c)}
                  >
                    <div className="contact-avatar">
                      <ClickableAvatar
                        user={{
                          prenom: c.name,
                          nomUtilisateur: c.email,
                          email: c.email,
                          avatar: c.avatar
                        }}
                        size="small"
                        disableNavigation={true}
                        onClick={(user) => openChat(c)}
                      />
                      <div className="online-indicator"></div>
                    </div>
                    <span className="contact-name">{c.name}</span>
                    <div className="contact-actions">
                      <button title="Envoyer un message" onClick={(e) => { e.stopPropagation(); openChat(c); }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                )
              })
            }
            
            {/* Offline contacts */}
            {contacts
              .filter(c => !c.online)
              .filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.email.toLowerCase().includes(searchTerm.toLowerCase()))
              .map((c,i)=> {
                const selected = router.query.contact === c.email;
                return (
                  <div
                    key={`offline-${i}`}
                    className={`contact-item${selected ? ' selected' : ''}`}
                    onClick={()=>openChat(c)}
                  >
                    <div className="contact-avatar">
                      <ClickableAvatar
                        user={{
                          prenom: c.name,
                          nomUtilisateur: c.email,
                          email: c.email,
                          avatar: c.avatar
                        }}
                        size="small"
                        disableNavigation={true}
                        onClick={(user) => openChat(c)}
                      />
                    </div>
                    <span className="contact-name">{c.name}</span>
                    <div className="contact-actions">
                      <button title="Envoyer un message" onClick={(e) => { e.stopPropagation(); openChat(c); }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                )
              })}
          </>
        )}
      </div>

      {/* GROUPS SECTION - Facebook Style */}
      <div className="card contacts-section">
        <div className="section-header">
          <div className="section-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
            </svg>
            Conversations de groupe
          </div>
          <div className="contacts-icons">
            <button className="nav-icon-btn" title="Options">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
              </svg>
            </button>
          </div>
        </div>
        {loadingGroups ? (
          Array.from({length:2}).map((_,i)=><GroupSkeleton key={i} />)
        ) : groups.length === 0 ? (
          <div className="empty-state">Aucun groupe</div>
        ) : (
          groups.map(g => (
            <div
              key={g.id}
              className="group-item"
              onClick={() => router.push(`/groupes?id=${g.id}`)}
            >
              <div className="group-icon" style={{background: g.cover || 'linear-gradient(135deg, #667eea, #764ba2)'}}>
                {g.coverIcon || '👥'}
              </div>
              <div className="group-info">
                <div className="group-name">{g.name}</div>
                {g.members !== undefined && <div className="group-members">{g.members} membres</div>}
              </div>
            </div>
          ))
        )}
      </div>
    </aside>
  )
}
