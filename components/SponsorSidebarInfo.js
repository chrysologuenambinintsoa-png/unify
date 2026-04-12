import { useState, useEffect } from 'react';

export default function SponsorSidebarInfo({ sponsor, onSelect }) {
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);

  useEffect(() => {
    if (!sponsor) return;
    
    const fetchStats = async () => {
      setLoadingStats(true);
      try {
        const res = await fetch(`/api/sponsors/${sponsor.id}/stats`);
        const data = await res.json();
        setStats(data);
      } catch(e) {
        console.error('error loading sponsor stats', e);
      } finally {
        setLoadingStats(false);
      }
    };

    fetchStats();
  }, [sponsor?.id]);

  if (!sponsor) {
    return (
      <aside style={{
        width: '100%',
        background: '#fff',
        borderRadius: 12,
        padding: 20,
        border: '1px solid var(--fb-border)',
        textAlign: 'center',
        color: 'var(--fb-text-secondary)',
        fontSize: 14,
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}>
        <i className="fas fa-info-circle" style={{marginRight: 8}}></i>
        Sélectionnez un sponsor pour voir les détails
      </aside>
    );
  }

  return (
    <aside style={{
      width: '100%',
      background: '#fff',
      borderRadius: 12,
      overflow: 'hidden',
      border: '1px solid var(--fb-border)',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
    }}>
      {/* Header avec image */}
      <div style={{
        position: 'relative',
        height: 120,
        background: `url(${sponsor.image}) center/cover`,
        backgroundColor: 'var(--fb-blue)'
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.3)'
        }}></div>
      </div>

      {/* Contenu */}
      <div style={{ padding: 18 }}>
        {/* Titre */}
        <h3 style={{
          fontSize: 17,
          fontWeight: 700,
          color: 'var(--fb-text-primary)',
          marginBottom: 6,
          wordBreak: 'break-word',
          margin: '0 0 6px 0'
        }}>
          {sponsor.title}
        </h3>

        {/* Description */}
        {sponsor.content && (
          <p style={{
            fontSize: 12,
            color: 'var(--fb-text-secondary)',
            marginBottom: 14,
            lineHeight: 1.45,
            margin: '0 0 14px 0'
          }}>
            {sponsor.content}
          </p>
        )}

        {/* Stats */}
        {loadingStats ? (
          <div style={{ fontSize: 12, color: 'var(--fb-text-secondary)', textAlign: 'center', padding: 12 }}>
            Chargement...
          </div>
        ) : stats ? (
          <div style={{ marginBottom: 14 }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 10,
              marginBottom: 10
            }}>
              <div style={{
                background: 'rgba(11,61,145,0.05)',
                padding: 12,
                borderRadius: 8,
                textAlign: 'center'
              }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--fb-blue)' }}>
                  {(stats.impressions || 0).toLocaleString()}
                </div>
                <div style={{ fontSize: 10, color: 'var(--fb-text-secondary)', marginTop: 4 }}>
                  Impressions
                </div>
              </div>
              <div style={{
                background: 'rgba(66,183,42,0.05)',
                padding: 12,
                borderRadius: 8,
                textAlign: 'center'
              }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--fb-green)' }}>
                  {(stats.clicks || 0).toLocaleString()}
                </div>
                <div style={{ fontSize: 10, color: 'var(--fb-text-secondary)', marginTop: 4 }}>
                  Clics
                </div>
              </div>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 10,
              marginBottom: 10
            }}>
              <div style={{
                background: 'rgba(200,50,50,0.05)',
                padding: 12,
                borderRadius: 8,
                textAlign: 'center'
              }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#c83232' }}>
                  €{(stats.totalBudgetSpent || 0).toFixed(2)}
                </div>
                <div style={{ fontSize: 10, color: 'var(--fb-text-secondary)', marginTop: 4 }}>
                  Budget dépensé
                </div>
              </div>
              <div style={{
                background: 'rgba(50,100,200,0.05)',
                padding: 12,
                borderRadius: 8,
                textAlign: 'center'
              }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#3264c8' }}>
                  {(stats.conversions || 0).toLocaleString()}
                </div>
                <div style={{ fontSize: 10, color: 'var(--fb-text-secondary)', marginTop: 4 }}>
                  Conversions
                </div>
              </div>
            </div>

            {stats.ctr !== undefined && (
              <div style={{
                background: 'rgba(100,100,100,0.05)',
                padding: 12,
                borderRadius: 8,
                textAlign: 'center'
              }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#646464' }}>
                  {typeof stats.ctr === 'string' ? stats.ctr : (stats.ctr || 0).toFixed(2)}%
                </div>
                <div style={{ fontSize: 10, color: 'var(--fb-text-secondary)', marginTop: 4 }}>
                  Taux de clic (CTR)
                </div>
              </div>
            )}
          </div>
        ) : null}

        {/* Lien */}
        {sponsor.link && (
          <div style={{
            marginBottom: 12,
            paddingBottom: 12,
            borderBottom: '1px solid var(--fb-border)'
          }}>
            <div style={{ fontSize: 11, color: 'var(--fb-text-secondary)', marginBottom: 4 }}>
              Lien
            </div>
            <a 
              href={sponsor.link} 
              target="_blank" 
              rel="noopener noreferrer"
              style={{
                fontSize: 12,
                color: 'var(--fb-blue)',
                textDecoration: 'none',
                wordBreak: 'break-all',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                cursor: 'pointer'
              }}
            >
              <i className="fas fa-link" style={{ fontSize: 11 }}></i>
              {sponsor.link.substring(0, 30)}...
            </a>
          </div>
        )}

        {/* Boutons d'action */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 8
        }}>
          <button
            onClick={() => onSelect?.(sponsor)}
            style={{
              padding: 10,
              background: 'var(--fb-blue)',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = '#0956BD';
              e.target.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'var(--fb-blue)';
              e.target.style.transform = 'translateY(0)';
            }}
          >
            <i className="fas fa-chart-line" style={{ fontSize: 12 }}></i>
            Détails
          </button>
          <button
            onClick={() => {
              const shareUrl = sponsor.link || window.location.href;
              navigator.clipboard.writeText(shareUrl);
              alert('Lien copié!');
            }}
            style={{
              padding: 10,
              background: 'var(--fb-border)',
              color: 'var(--fb-text-primary)',
              border: 'none',
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = '#e4e4e4';
              e.target.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'var(--fb-border)';
              e.target.style.transform = 'translateY(0)';
            }}
          >
            <i className="fas fa-copy" style={{ fontSize: 12 }}></i>
            Copier
          </button>
        </div>

        {/* Info supplémentaire */}
        <div style={{
          marginTop: 12,
          paddingTop: 12,
          borderTop: '1px solid var(--fb-border)',
          fontSize: 11,
          color: 'var(--fb-text-secondary)'
        }}>
          <div style={{ marginBottom: 4 }}>
            <strong>État:</strong>{' '}
            <span style={{ color: sponsor.active ? 'var(--fb-green)' : '#999' }}>
              {sponsor.active ? '✓ Actif' : 'Inactif'}
            </span>
          </div>
          <div>
            <strong>Créé:</strong> {new Date(sponsor.createdAt).toLocaleDateString('fr-FR')}
          </div>
        </div>
      </div>
    </aside>
  );
}
