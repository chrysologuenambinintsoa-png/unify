import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';

export default function SponsorAnalyticsPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sponsors, setSponsors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [aggregateStats, setAggregateStats] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      // include ownerEmail parameter if we have a current user
      let url = '/api/sponsors';
      if (currentUser && currentUser.email) {
        url += `?ownerEmail=${encodeURIComponent(currentUser.email)}`;
      }
      const sponsorRes = await fetch(url);
      const sponsorData = await sponsorRes.json();
      const sponsorsList = sponsorData.sponsors || [];

      // Fetch stats for each sponsor
      const sponsorsWithStats = await Promise.all(
        sponsorsList.map(async (sponsor) => {
          try {
            const statsRes = await fetch(`/api/sponsors/${sponsor.id}/stats`);
            const stats = await statsRes.json();
            const quotaRes = await fetch(`/api/sponsors/${sponsor.id}/quotas`);
            const quota = await quotaRes.json();
            return { ...sponsor, stats, quota };
          } catch (e) {
            console.error(`Error fetching stats for sponsor ${sponsor.id}`, e);
            return sponsor;
          }
        })
      );

      setSponsors(sponsorsWithStats);

      // Calculate aggregate stats
      const aggregate = {
        totalImpressions: 0,
        totalClicks: 0,
        totalConversions: 0,
        totalBudgetSpent: 0,
        totalBudgetLimit: 0,
        avgCTR: 0,
        avgConversionRate: 0
      };

      sponsorsWithStats.forEach((s) => {
        if (s.stats) {
          aggregate.totalImpressions += s.stats.impressions || 0;
          aggregate.totalClicks += s.stats.clicks || 0;
          aggregate.totalConversions += s.stats.conversions || 0;
        }
        if (s.quota) {
          aggregate.totalBudgetSpent += s.quota.budgetSpentToday || 0;
          if (s.quota.monthlyBudgetLimit) aggregate.totalBudgetLimit += s.quota.monthlyBudgetLimit;
        }
      });

      if (aggregate.totalImpressions > 0) {
        aggregate.avgCTR = ((aggregate.totalClicks / aggregate.totalImpressions) * 100).toFixed(2);
      }
      if (aggregate.totalClicks > 0) {
        aggregate.avgConversionRate = ((aggregate.totalConversions / aggregate.totalClicks) * 100).toFixed(2);
      }

      setAggregateStats(aggregate);
    } catch (e) {
      console.error('Error fetching analytics', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (!user) {
      router.push('/auth');
    } else {
      try {
        const json = JSON.parse(user);
        setCurrentUser(json);
      } catch(e) {}
      setIsAuthenticated(true);
      fetchAnalytics();
    }
  }, [router.isReady]);

  useEffect(() => {
    if (isAuthenticated) {
      const interval = setInterval(fetchAnalytics, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, currentUser]);

  if (loading) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',fontSize:18,color:'#666'}}>
      Chargement...
    </div>
  );

  if (!isAuthenticated) {
    return (
      <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',flexDirection:'column',gap:16}}>
        <h2 style={{fontSize:20,color:'#333'}}>Accès non autorisé</h2>
        <p style={{color:'#666'}}>Veuillez vous connecter pour continuer</p>
        <button onClick={() => router.push('/auth')} style={{padding:'10px 20px',background:'#166FE5',color:'white',border:'none',borderRadius:8,cursor:'pointer',fontWeight:600}}>
          Aller à la connexion
        </button>
      </div>
    );
  }

  return (
    <Layout>
      <div style={{ padding: 20, maxWidth: 1200, margin: '0 auto' }}>
      <h1>📊 Analytique globale des sponsors</h1>

      {/* Aggregate stats */}
      {aggregateStats && (
        <section style={{ padding: 20, background: '#f0f0f0', borderRadius: 8, marginBottom: 40 }}>
          <h2>Statistiques globales</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 20 }}>
            <div style={{ textAlign: 'center', padding: 12, background: 'white', borderRadius: 6 }}>
              <div style={{ fontSize: 28, fontWeight: 'bold' }}>{aggregateStats.totalImpressions}</div>
              <div style={{ fontSize: 12, color: '#666' }}>Impressions totales</div>
            </div>
            <div style={{ textAlign: 'center', padding: 12, background: 'white', borderRadius: 6 }}>
              <div style={{ fontSize: 28, fontWeight: 'bold' }}>{aggregateStats.totalClicks}</div>
              <div style={{ fontSize: 12, color: '#666' }}>Clics totaux</div>
            </div>
            <div style={{ textAlign: 'center', padding: 12, background: 'white', borderRadius: 6 }}>
              <div style={{ fontSize: 28, fontWeight: 'bold' }}>{aggregateStats.avgCTR}%</div>
              <div style={{ fontSize: 12, color: '#666' }}>CTR moyen</div>
            </div>
            <div style={{ textAlign: 'center', padding: 12, background: 'white', borderRadius: 6 }}>
              <div style={{ fontSize: 28, fontWeight: 'bold' }}>{aggregateStats.totalConversions}</div>
              <div style={{ fontSize: 12, color: '#666' }}>Conversions totales</div>
            </div>
            <div style={{ textAlign: 'center', padding: 12, background: 'white', borderRadius: 6 }}>
              <div style={{ fontSize: 28, fontWeight: 'bold' }}>{aggregateStats.avgConversionRate}%</div>
              <div style={{ fontSize: 12, color: '#666' }}>Taux de conversion</div>
            </div>
            <div style={{ textAlign: 'center', padding: 12, background: 'white', borderRadius: 6 }}>
              <div style={{ fontSize: 28, fontWeight: 'bold' }}>€{aggregateStats.totalBudgetSpent.toFixed(2)}</div>
              <div style={{ fontSize: 12, color: '#666' }}>Budget dépensé</div>
            </div>
          </div>
        </section>
      )}

      {/* Individual sponsor stats */}
      <section>
        <h2>Sponsors détaillés</h2>
        {sponsors.length === 0 ? (
          <p>Aucun sponsor trouvé</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: 20 }}>
            {sponsors.map((sponsor) => (
              <div key={sponsor.id} style={{ border: '1px solid #e0e0e0', borderRadius: 8, padding: 16, background: 'white' }}>
                <h3>{sponsor.title}</h3>
                {sponsor.image && (
                  <img src={sponsor.image} alt={sponsor.title} style={{ width: '100%', height: 150, objectFit: 'cover', borderRadius: 4, marginBottom: 12 }} />
                )}
                <p style={{ color: '#666', fontSize: 12 }}>{sponsor.content}</p>

                {sponsor.stats && (
                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #e0e0e0' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12 }}>
                      <div>
                        <strong>Impressions:</strong> {sponsor.stats.impressions}
                      </div>
                      <div>
                        <strong>Clics:</strong> {sponsor.stats.clicks}
                      </div>
                      <div>
                        <strong>CTR:</strong> {sponsor.stats.ctr}%
                      </div>
                      <div>
                        <strong>Conversions:</strong> {sponsor.stats.conversions}
                      </div>
                    </div>
                  </div>
                )}

                {sponsor.quota && (
                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #e0e0e0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                      <div>
                        <strong>Budget quotidien:</strong> €{sponsor.quota.dailyBudgetLimit || '∞'}
                      </div>
                      <div>
                        <strong>Dépensé:</strong> €{sponsor.quota.budgetSpentToday?.toFixed(2) || '0'}
                      </div>
                    </div>
                    <div style={{ marginTop: 8, fontSize: 11, color: sponsor.quota.quotaExceeded ? '#d32f2f' : '#4caf50' }}>
                      {sponsor.quota.quotaExceeded ? '⚠️ Quota dépassé' : '✅ Quota actif'}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <button onClick={fetchAnalytics} style={{ marginTop: 20, padding: '8px 16px' }}>
        🔄 Actualiser
      </button>
      </div>
    </Layout>
  );
}
