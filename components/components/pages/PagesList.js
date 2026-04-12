'use client';

import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserPlus, faCheck, faEye } from '@fortawesome/free-solid-svg-icons';

export default function PagesList({ onPageSelect, user, refreshTrigger }) {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchPages();
  }, [refreshTrigger]);

  const fetchPages = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch('/api/pages', {
        headers: {
          'x-user-email': user?.email || ''
        }
      });

      if (!response.ok) {
        throw new Error('Erreur lors du chargement des pages');
      }

      const data = await response.json();
      setPages(data.pages || []);
    } catch (err) {
      setError(err.message);
      console.error('Erreur:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFollowPage = async (pageId) => {
    try {
      const response = await fetch(`/api/pages/${pageId}/follow`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': user?.email || ''
        }
      });

      if (response.ok) {
        // Update page in list
        setPages(pages.map(p => 
          p.id === pageId ? { ...p, following: true } : p
        ));
      }
    } catch (err) {
      console.error('Erreur suivre page:', err);
    }
  };

  const handleDeletePage = async (pageId) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette page ?')) return;

    try {
      const response = await fetch(`/api/pages/${pageId}`, {
        method: 'DELETE',
        headers: {
          'x-user-email': user?.email || ''
        }
      });

      if (response.ok) {
        setPages(pages.filter(p => p.id !== pageId));
      }
    } catch (err) {
      console.error('Erreur suppression page:', err);
    }
  };

  const filteredPages = filter === 'following' 
    ? pages.filter(p => p.following)
    : pages;

  if (loading) return <div className="loading">Chargement des pages...</div>;

  return (
    <div className="pages-list-section">
      <div className="pages-header">
        <h2>Pages</h2>
        <div className="pages-filter">
          <button 
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            Toutes ({pages.length})
          </button>
          <button 
            className={`filter-btn ${filter === 'following' ? 'active' : ''}`}
            onClick={() => setFilter('following')}
          >
            Suivies ({pages.filter(p => p.following).length})
          </button>
        </div>
      </div>

      {error && <div className="pages-error">{error}</div>}

      {filteredPages.length === 0 ? (
        <div className="no-pages">
          <p>
            {filter === 'following' 
              ? 'Aucune page suivie pour le moment'
              : 'Aucune page disponible'}
          </p>
        </div>
      ) : (
        <div className="pages-grid">
          {filteredPages.map(page => (
            <div key={page.id} className="page-card">
              {/* Cover Image */}
              <div className="page-card-cover">
                {page.coverImage || page.cover ? (
                  <img 
                    src={page.coverImage || page.cover} 
                    alt={page.name}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextElementSibling.style.display = 'block';
                    }}
                  />
                ) : null}
                <div 
                  className="page-card-cover-placeholder"
                  style={{ display: 'none' }}
                >
                  🖼️
                </div>
              </div>

              {/* Profile Section */}
              <div className="page-card-profile">
                <div className="page-card-avatar">
                  {page.profileImage || page.avatar ? (
                    <img 
                      src={page.profileImage || page.avatar} 
                      alt={page.name}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextElementSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div 
                    className="page-card-avatar-placeholder"
                    style={{ display: 'none' }}
                  >
                    📄
                  </div>
                </div>

                <div className="page-card-info">
                  <h3 onClick={() => onPageSelect && onPageSelect(page)}>
                    {page.name}
                  </h3>
                  <p className="page-category">{page.category}</p>
                  <p className="page-followers">
                    {page.followers || 0} abonnés
                  </p>
                </div>
              </div>

              {/* Description */}
              {page.description && (
                <p className="page-card-description">
                  {page.description.length > 100
                    ? page.description.substring(0, 100) + '...'
                    : page.description}
                </p>
              )}

              {/* Actions */}
              <div className="page-card-actions">
                <button
                  className={`action-btn ${page.following ? 'following' : ''}`}
                  onClick={() => handleFollowPage(page.id)}
                >
                  <FontAwesomeIcon icon={page.following ? faCheck : faUserPlus} />
                  <span>{page.following ? 'Suivi' : 'Suivre'}</span>
                </button>
                <button
                  className="action-btn view-btn"
                  onClick={() => onPageSelect && onPageSelect(page)}
                >
                  <FontAwesomeIcon icon={faEye} />
                  <span>Voir</span>
                </button>
                {page.isOwner && (
                  <button
                    className="action-btn delete-btn"
                    onClick={() => handleDeletePage(page.id)}
                  >
                    🗑️
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
