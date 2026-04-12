'use client';


import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUsers, faEye, faComments, faLock, faGlobe, faUserPlus } from '@fortawesome/free-solid-svg-icons';
import { Skeleton, AvatarSkeleton } from '../../Skeleton';

function GroupCardSkeleton() {
  return (
    <div className="group-card" style={{ opacity: 0.7 }}>
      <div className="group-card-cover">
        <Skeleton height={80} style={{ borderRadius: '8px 8px 0 0' }} />
      </div>
      <div className="group-card-profile">
        <div className="group-card-avatar">
          <AvatarSkeleton size={48} />
        </div>
        <div className="group-card-info">
          <Skeleton width="70%" height={16} style={{ marginBottom: 8 }} />
          <Skeleton width="50%" height={12} />
        </div>
      </div>
      <Skeleton width="90%" height={12} style={{ marginTop: 8 }} />
      <div className="group-card-actions">
        <Skeleton width={80} height={32} style={{ borderRadius: 6 }} />
        <Skeleton width={80} height={32} style={{ borderRadius: 6 }} />
      </div>
    </div>
  );
}

export default function GroupList({ onGroupSelect, user, refreshTrigger }) {
  const [groupes, setGroupes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchGroupes();
  }, [refreshTrigger]);

  const fetchGroupes = async () => {
    try {
      setLoading(true);
      setError('');
      let url = '/api/groupes';
      if (user?.email) {
        url += `?userEmail=${encodeURIComponent(user.email)}`;
      }
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des groupes');
      }
      const data = await response.json();
      setGroupes(data.groupes || []);
    } catch (err) {
      setError(err.message);
      console.error('Erreur:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredGroupes = filter === 'joined'
    ? groupes.filter(g => g.joined)
    : groupes;

  if (loading) return (
    <div className="groups-list-section">
      <div className="groups-header">
        <h2>Groupes</h2>
        <div className="groups-filter">
          <Skeleton width={100} height={32} style={{ borderRadius: 20 }} />
          <Skeleton width={120} height={32} style={{ borderRadius: 20 }} />
        </div>
      </div>
      <div className="groups-grid">
        {Array.from({ length: 4 }).map((_, i) => (
          <GroupCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );

  return (
    <div className="groups-list-section">
      <div className="groups-header">
        <h2>Groupes</h2>
        <div className="groups-filter">
          <button 
            className={`filter-btn${filter === 'all' ? ' active' : ''}`}
            onClick={() => setFilter('all')}
          >
            Tous ({groupes.length})
          </button>
          <button 
            className={`filter-btn${filter === 'joined' ? ' active' : ''}`}
            onClick={() => setFilter('joined')}
          >
            Mes groupes ({groupes.filter(g => g.joined).length})
          </button>
        </div>
      </div>

      {error && <div className="groups-error">{error}</div>}

      {filteredGroupes.length === 0 ? (
        <div className="no-groups">
          <p>
            {filter === 'joined' 
              ? 'Vous n\'avez rejoint aucun groupe.'
              : 'Aucun groupe disponible'}
          </p>
        </div>
      ) : (
        <div className="groups-grid">
          {filteredGroupes.map(g => (
            <div key={g.id} className="group-card">
              {/* Cover */}
              <div className="group-card-cover">
                <FontAwesomeIcon icon={faComments} />
              </div>
              {/* Profile Section */}
              <div className="group-card-profile">
                <div className="group-card-avatar">
                  {g.avatar ? <img src={g.avatar} alt={g.name} /> : (
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                      <circle cx="9" cy="7" r="4"/>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                    </svg>
                  )}
                </div>
                <div className="group-card-info">
                  <h3 onClick={()=>onGroupSelect && onGroupSelect(g)}>
                    {g.privacy === 'PRIVATE' ? (
                      <FontAwesomeIcon icon={faLock} />
                    ) : (
                      <FontAwesomeIcon icon={faGlobe} />
                    )}
                    {g.name}
                  </h3>
                  <p className="group-category">
                    <FontAwesomeIcon icon={faUsers} />
                    {g.category||'Communauté'}
                  </p>
                  {g.members > 0 && (
                    <p className="group-members">
                      <FontAwesomeIcon icon={faUsers} /> {g.members} membres
                    </p>
                  )}
                </div>
              </div>
              {/* Description */}
              {g.description && (
                <p className="group-card-description">
                  {g.description.length > 100 ? g.description.substring(0, 100) + '...' : g.description}
                </p>
              )}
              {/* Actions */}
              <div className="group-card-actions">
                <button
                  className={`action-btn view-btn`}
                  onClick={()=>onGroupSelect && onGroupSelect(g)}
                >
                  <FontAwesomeIcon icon={faEye} /> <span>Voir</span>
                </button>
                <button
                  className={`action-btn join-btn`}
                  title="Rejoindre le groupe"
                >
                  <FontAwesomeIcon icon={faUserPlus} /> <span>Rejoindre</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
