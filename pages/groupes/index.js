import React, { useState, useEffect } from 'react';

import Layout from '../../components/Layout';
import GroupList from '../../components/components/group/GroupList';
import CreateGroupModal from '../../components/components/group/CreateGroupModal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUsers } from '@fortawesome/free-solid-svg-icons';

export default function Groupes() {
  const [showModal, setShowModal] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [stats, setStats] = useState({ groupes: 0, membres: 0 });
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error('Error parsing user:', e);
      }
    }
  }, []);

  // Récupérer stats groupes
  useEffect(() => {
    fetch('/api/groupes')
      .then(res => res.json())
      .then(data => {
        setStats({
          groupes: data.groupes?.length || 0,
          membres: data.groupes?.reduce((acc, g) => acc + (g.members || 0), 0) || 0
        });
      });
  }, [refresh]);

  return (
    <Layout>
      <div style={{maxWidth:900,margin:'32px auto',padding:16}}>
        {/* Bandeau d'intro professionnel avec icônes */}
        <div style={{display:'flex',alignItems:'center',background:'linear-gradient(90deg,#f5f7fa,#c3cfe2 80%)',borderRadius:16,padding:'28px 32px',marginBottom:32,gap:24}}>
          <div style={{flex:1}}>
            <h1 style={{fontSize:32,fontWeight:700,marginBottom:8,display:'flex',alignItems:'center',gap:16}}>
              <FontAwesomeIcon icon={faUsers} style={{fontSize:38,color:'#2563eb',background:'#fff',borderRadius:12,padding:8,boxShadow:'0 2px 8px rgba(37,99,235,0.08)'}} />
              Groupes
            </h1>
            <div style={{fontSize:16,color:'#444',marginBottom:12,display:'flex',alignItems:'center',gap:10}}>
              <FontAwesomeIcon icon={faUsers} style={{fontSize:20,color:'#1e40af'}} />
              Rejoignez, créez et animez des groupes pour échanger, collaborer et partager vos passions.
            </div>
          </div>
          <div style={{flex:'0 0 120px',display:'flex',alignItems:'center',justifyContent:'center'}}>
            <FontAwesomeIcon icon={faUsers} style={{fontSize:110, color:'#2563eb', background:'#f5f7fa', borderRadius:24, padding:18}} />
          </div>
        </div>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:24}}>
          <div style={{fontSize:22,fontWeight:600}}>Tous les groupes</div>
          <button
            style={{padding:'12px 28px',fontSize:18,borderRadius:8,background: user ? '#080223' : '#9ca3af',color:'white',border:'none',cursor: user ? 'pointer' : 'not-allowed',boxShadow:'0 2px 8px rgba(8,2,35,0.08)',fontWeight:700,display:'flex',alignItems:'center',gap:10}}
            onClick={()=>{ if(user) setShowModal(true); else window.location.href = '/auth'; }}
          >
            <span style={{fontSize:22,display:'flex',alignItems:'center'}}><i className="fas fa-plus"></i></span> Créer un groupe
          </button>
        </div>
        <GroupList
          user={user}
          refreshTrigger={refresh}
          onGroupSelect={g => window.location.href = `/groupes/${g.id}`}
        />
        {showModal && (
          <CreateGroupModal
            onClose={()=>setShowModal(false)}
            onCreated={()=>{ setShowModal(false); setRefresh(r=>r+1); }}
            user={user}
          />
        )}
      </div>
    </Layout>
  );
}
