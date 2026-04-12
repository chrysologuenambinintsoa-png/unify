import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBullhorn, faChartLine } from '@fortawesome/free-solid-svg-icons';

export default function SponsorsSidebarRight() {
  const [sponsors, setSponsors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [bannerIndex, setBannerIndex] = useState(0);

  useEffect(() => {
    const loadSponsors = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/sponsors/list-with-stats');
        const data = await res.json();
        // Display top 3 sponsors with best performance
        const topSponsors = (data.sponsors || [])
          .sort((a, b) => (b.stats?.clicks || 0) - (a.stats?.clicks || 0))
          .slice(0, 3);
        setSponsors(topSponsors);
      } catch(e) {
        console.error('error loading sponsors', e);
        // Fallback to basic sponsors list
        try {
          const res = await fetch('/api/sponsors');
          const data = await res.json();
          setSponsors((data.sponsors || []).slice(0, 3));
        } catch(e2) {
          console.error('fallback error loading sponsors', e2);
        }
      } finally {
        setLoading(false);
      }
    };
    loadSponsors();
  }, []);

  // rotation effect
  useEffect(() => {
    if (sponsors.length === 0) return;
    setBannerIndex(0);
    const id = setInterval(() => {
      setBannerIndex(i => (i + 1) % sponsors.length);
    }, 30000); // every 30 seconds
    return () => clearInterval(id);
  }, [sponsors]);

  return (
    <aside style={{
      width: '280px',
      padding: '8px 8px',
      position: 'sticky',
      top: '72px',
      height: 'calc(100vh - 72px)',
      overflowY: 'auto',
      flexShrink: 0,
      display: 'flex',
      flexDirection: 'column',
      gap: 8
    }}>
      {/* SPONSORED SECTION */}
      <div style={{
        background: 'var(--fb-white)',
        borderRadius: 12,
        padding: 16,
        boxShadow: '0 2px 4px rgba(0,0,0,0.15)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          fontSize: 17,
          fontWeight: 700,
          marginBottom: 6,
          color: 'var(--fb-text)'
        }}>
          <FontAwesomeIcon icon={faBullhorn} style={{marginRight:8}} />
          Publicités sponsorisées
        </div>
        <p style={{
          fontSize: 13,
          color: 'var(--fb-text-secondary)',
          margin: '0 0 12px 0',
          lineHeight: 1.4
        }}>
          Découvrez les meilleures offres sélectionnées pour vous
        </p>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 24, color: 'var(--fb-text-secondary)', fontSize: 14 }}>
            Chargement des annonces...
          </div>
        ) : sponsors.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 24, color: 'var(--fb-text-secondary)', fontSize: 14 }}>
            Pas d'annonces éligibles pour le moment
          </div>
        ) : (
          <>
            {/* Banner pour le sponsor actuel */}
            {sponsors[bannerIndex] && (
              <a
                href={sponsors[bannerIndex].link || '#'}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => {
                  if (!sponsors[bannerIndex].link) {
                    e.preventDefault();
                  }
                }}
                style={{
                  display: 'block',
                  position: 'relative',
                  width: '100%',
                  height: 150,
                  borderRadius: 12,
                  overflow: 'hidden',
                  marginBottom: 16,
                  background: sponsors[bannerIndex].image ? 'transparent' : `linear-gradient(135deg, var(--fb-blue), var(--fb-blue-dark))`,
                  cursor: sponsors[bannerIndex].link ? 'pointer' : 'default',
                  textDecoration: 'none'
                }}>


                {sponsors[bannerIndex].image && (
                  <img
                    src={sponsors[bannerIndex].image}
                    alt={sponsors[bannerIndex].title}
                    style={{width:'100%', height:'100%', objectFit:'cover'}}
                  />
                )}
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  background: 'rgba(0,0,0,0.5)',
                  color: 'white',
                  padding: 8,
                  fontSize: 14,
                  fontWeight: 600,
                  lineHeight: 1.2
                }}>
                  <span>{sponsors[bannerIndex].title}</span>
                </div>
              </a>
            )}
            {/* Liste des autres sponsors */}
            {sponsors
              .filter((_, idx) => idx !== bannerIndex)
              .map((sponsor) => {
            return (
              <a 
                key={sponsor.id}
                href={sponsor.link || '#'}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => {
                  if (!sponsor.link) {
                    e.preventDefault();
                  }
                }}
                style={{
                display: 'flex',
                gap: 12,
                padding: '16px 0',
                borderBottom: '1px solid var(--fb-border)',
                transition: 'transform 0.2s, opacity 0.2s',
                cursor: sponsor.link ? 'pointer' : 'default',
                textDecoration: 'none',
                color: 'inherit'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateX(2px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}
              >
                {/* Image/Icon */}
                <div 
                  style={{
                    flexShrink: 0,
                    width: 56,
                    height: 56,
                    borderRadius: 12,
                    background: sponsor.image || `linear-gradient(135deg, var(--fb-blue), var(--fb-blue-dark))`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 28,
                    color: 'white'
                  }}>
                  {!sponsor.image && <FontAwesomeIcon icon={faBullhorn} />}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                  <h4 style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: 'var(--fb-text)',
                    margin: '0 0 6px 0',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {sponsor.title}
                  </h4>
                  <p style={{
                    fontSize: 12,
                    color: 'var(--fb-text-secondary)',
                    margin: 0,
                    lineHeight: 1.4,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {sponsor.content || 'Découvrez cette offre spéciale'}
                  </p>
                  {sponsor.stats && (
                    <div style={{
                      fontSize: 11,
                      color: 'var(--fb-blue)',
                      marginTop: 6,
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4
                    }}>
                      <FontAwesomeIcon icon={faChartLine} />
                      {sponsor.stats.clicks || 0} clics
                    </div>
                  )}
                </div>
              </a>
            );
          })}
          </>  
        )}
      </div>
    </aside>
  );
}
