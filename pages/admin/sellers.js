import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';

export default function AdminSellersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadUsers = async () => {
    setLoading(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {}
      const res = await fetch('/api/admin/sellers', { headers });
      const data = await res.json();
      if (res.ok) setUsers(data.users || []);
      else setError(data.error || 'Erreur lors du chargement');
    } catch (e) {
      console.error(e);
      setError('Erreur réseau');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadUsers(); }, []);

  const toggleApprove = async (email, approve) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
      const headers = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`
      const res = await fetch('/api/admin/sellers', {
        method: 'PUT',
        headers,
        body: JSON.stringify({ email, approve })
      });
      const data = await res.json();
      if (res.ok) {
        setUsers(prev => prev.map(u => u.email === email ? data.user : u));
      } else {
        alert(data.error || 'Erreur');
        if (res.status === 401 || res.status === 403) setError('Non autorisé — connectez-vous en tant qu\'administrateur')
      }
    } catch (e) {
      console.error(e);
      alert('Erreur réseau');
    }
  };

  return (
    <Layout>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: 20 }}>
        <h1 style={{ marginBottom: 10 }}>Administration — Approbation des vendeurs</h1>
        <p style={{ color: '#666' }}>Liste des utilisateurs. Cliquez sur « Approuver » pour activer le mode vendeur.</p>

        {error && <div style={{ color: 'crimson', marginBottom: 12 }}>{error}</div>}

        <div style={{ marginTop: 16 }}>
          {loading ? (
            <div>Chargement...</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid #eee' }}>
                  <th style={{ padding: 8 }}>Utilisateur</th>
                  <th style={{ padding: 8 }}>Email</th>
                  <th style={{ padding: 8 }}>Créé</th>
                  <th style={{ padding: 8 }}>Statut vendeur</th>
                  <th style={{ padding: 8 }}></th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.email} style={{ borderBottom: '1px solid #fafafa' }}>
                    <td style={{ padding: 10 }}>
                      <div style={{ fontWeight: 600 }}>{(u.prenom || '') + ' ' + (u.nom || '')}</div>
                      <div style={{ fontSize: 12, color: '#666' }}>{u.nomUtilisateur || ''}</div>
                    </td>
                    <td style={{ padding: 10 }}>{u.email}</td>
                    <td style={{ padding: 10 }}>{new Date(u.createdAt).toLocaleString()}</td>
                    <td style={{ padding: 10 }}>{u.isApprovedSeller ? 'Approuvé' : 'Non approuvé'}</td>
                    <td style={{ padding: 10 }}>
                      {u.isApprovedSeller ? (
                        <button onClick={() => toggleApprove(u.email, false)} style={{ padding: '8px 12px', background: '#f5f5f5', border: '1px solid #e0e0e0', borderRadius: 8, cursor: 'pointer' }}>Révoquer</button>
                      ) : (
                        <button onClick={() => toggleApprove(u.email, true)} style={{ padding: '8px 12px', background: '#166FE5', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer' }}>Approuver</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </Layout>
  );
}
