import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';

export default function AdminRevenueReports() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [revenueData, setRevenueData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (!user) {
      router.push('/auth');
    } else {
      // TODO: Add admin role check
      setIsAuthenticated(true);
      fetchRevenueData();
    }
  }, [router.isReady]);

  const fetchRevenueData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/revenue-reports');
      const data = await res.json();
      setRevenueData(data);
    } catch (e) {
      console.error('Error fetching revenue data', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',fontSize:18,color:'#666'}}>
      Chargement...
    </div>
  );

  if (!isAuthenticated) {
    return (
      <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',flexDirection:'column',gap:16}}>
        <h2 style={{fontSize:20,color:'#333'}}>Accès non autorisé</h2>
        <p style={{color:'#666'}}>Vous devez être administrateur pour accéder à cette page</p>
        <button onClick={() => router.push('/auth')} style={{padding:'10px 20px',background:'#166FE5',color:'white',border:'none',borderRadius:8,cursor:'pointer',fontWeight:600}}>
          Aller à la connexion
        </button>
      </div>
    );
  }

  return (
    <Layout>
      <div style={{ padding: 20, maxWidth: 1200, margin: '0 auto' }}>
        <h1>📊 Rapports de revenus - Administration</h1>

        {revenueData && (
          <>
            {/* Revenue Overview */}
            <section style={{ padding: 20, background: '#f0f0f0', borderRadius: 8, marginBottom: 40 }}>
              <h2>Aperçu des revenus</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
                <div style={{ textAlign: 'center', padding: 12, background: 'white', borderRadius: 6 }}>
                  <div style={{ fontSize: 28, fontWeight: 'bold', color: '#4caf50' }}>
                    €{revenueData.totalRevenue?.toFixed(2) || '0.00'}
                  </div>
                  <div style={{ fontSize: 12, color: '#666' }}>Revenus totaux</div>
                </div>
                <div style={{ textAlign: 'center', padding: 12, background: 'white', borderRadius: 6 }}>
                  <div style={{ fontSize: 28, fontWeight: 'bold', color: '#2196f3' }}>
                    €{revenueData.monthlyRevenue?.toFixed(2) || '0.00'}
                  </div>
                  <div style={{ fontSize: 12, color: '#666' }}>Ce mois-ci</div>
                </div>
                <div style={{ textAlign: 'center', padding: 12, background: 'white', borderRadius: 6 }}>
                  <div style={{ fontSize: 28, fontWeight: 'bold', color: '#ff9800' }}>
                    {revenueData.totalTransactions || 0}
                  </div>
                  <div style={{ fontSize: 12, color: '#666' }}>Transactions totales</div>
                </div>
                <div style={{ textAlign: 'center', padding: 12, background: 'white', borderRadius: 6 }}>
                  <div style={{ fontSize: 28, fontWeight: 'bold', color: '#9c27b0' }}>
                    €{revenueData.averageTransaction?.toFixed(2) || '0.00'}
                  </div>
                  <div style={{ fontSize: 12, color: '#666' }}>Transaction moyenne</div>
                </div>
              </div>
            </section>

            {/* Revenue by Source */}
            <section style={{ marginBottom: 40 }}>
              <h2>Revenus par source</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
                {revenueData.revenueBySource?.map((source, index) => (
                  <div key={index} style={{ border: '1px solid #e0e0e0', borderRadius: 8, padding: 16, background: 'white' }}>
                    <h3>{source.source}</h3>
                    <div style={{ fontSize: 24, fontWeight: 'bold', color: '#4caf50', marginBottom: 8 }}>
                      €{source.total?.toFixed(2) || '0.00'}
                    </div>
                    <div style={{ fontSize: 12, color: '#666' }}>
                      {source.count} transactions
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Recent Transactions */}
            <section>
              <h2>Transactions récentes</h2>
              <div style={{ border: '1px solid #e0e0e0', borderRadius: 8, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f5f5f5' }}>
                      <th style={{ padding: 12, textAlign: 'left', borderBottom: '1px solid #e0e0e0' }}>Date</th>
                      <th style={{ padding: 12, textAlign: 'left', borderBottom: '1px solid #e0e0e0' }}>Utilisateur</th>
                      <th style={{ padding: 12, textAlign: 'left', borderBottom: '1px solid #e0e0e0' }}>Source</th>
                      <th style={{ padding: 12, textAlign: 'right', borderBottom: '1px solid #e0e0e0' }}>Montant</th>
                      <th style={{ padding: 12, textAlign: 'left', borderBottom: '1px solid #e0e0e0' }}>Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {revenueData.recentTransactions?.map((transaction, index) => (
                      <tr key={index} style={{ borderBottom: '1px solid #f0f0f0' }}>
                        <td style={{ padding: 12 }}>
                          {new Date(transaction.createdAt).toLocaleDateString('fr-FR')}
                        </td>
                        <td style={{ padding: 12 }}>{transaction.userEmail}</td>
                        <td style={{ padding: 12 }}>{transaction.source}</td>
                        <td style={{ padding: 12, textAlign: 'right', fontWeight: 'bold' }}>
                          €{transaction.amount?.toFixed(2) || '0.00'}
                        </td>
                        <td style={{ padding: 12 }}>
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: 4,
                            fontSize: 12,
                            background: transaction.status === 'completed' ? '#4caf50' : '#ff9800',
                            color: 'white'
                          }}>
                            {transaction.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </div>
    </Layout>
  );
}