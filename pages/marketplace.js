import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faHeart as faHeartSolid, faStar, faPlus, faMapMarkerAlt, faMobileAlt, faTshirt, faHome, faTools, faBook, faFootballBall, faPalette, faBox, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { faHeart as faHeartEmpty } from '@fortawesome/free-regular-svg-icons';

const CATEGORIES = [
  { id: 'electronics', label: 'Électronique', icon: faMobileAlt },
  { id: 'fashion', label: 'Mode', icon: faTshirt },
  { id: 'home', label: 'Maison', icon: faHome },
  { id: 'services', label: 'Services', icon: faTools },
  { id: 'books', label: 'Livres', icon: faBook },
  { id: 'sports', label: 'Sports', icon: faFootballBall },
  { id: 'art', label: 'Art', icon: faPalette },
  { id: 'other', label: 'Autre', icon: faBox }
];

export default function MarketplacePage() {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [skip, setSkip] = useState(0);
  const [total, setTotal] = useState(0);
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (user) {
      try {
        const json = JSON.parse(user);
        setCurrentUser(json);
        const saved = localStorage.getItem('favorites') || '[]';
        setFavorites(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  const fetchProducts = async (searchTerm = '', category = '', offset = 0) => {
    setLoading(true);
    try {
      let url = `/api/marketplace?skip=${offset}&take=15`;
      if (searchTerm) url += `&search=${encodeURIComponent(searchTerm)}`;
      if (category) url += `&category=${category}`;

      const res = await fetch(url);
      const data = await res.json();
      setProducts(data.products || []);
      setTotal(data.total || 0);
    } catch (e) {
      console.error('Error fetching products', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setSkip(0);
    fetchProducts(search, selectedCategory, 0);
  }, [search, selectedCategory]);

  const toggleFavorite = async (productId) => {
    if (!currentUser) {
      router.push('/account-picker');
      return;
    }

    try {
      await fetch(`/api/marketplace/${productId}/favorites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userEmail: currentUser.email })
      });

      const newFavorites = favorites.includes(productId)
        ? favorites.filter(id => id !== productId)
        : [...favorites, productId];
      
      setFavorites(newFavorites);
      localStorage.setItem('favorites', JSON.stringify(newFavorites));
    } catch (e) {
      console.error('Error toggling favorite', e);
    }
  };

  const handleLoadMore = () => {
    const newSkip = skip + 15;
    setSkip(newSkip);
    fetchProducts(search, selectedCategory, newSkip);
  };

  return (
    <Layout>
      <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ marginBottom: 40 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <h1 style={{ fontSize: 32, fontWeight: 'bold', margin: 0 }}>🛍️ Marketplace</h1>
          </div>
          <p style={{ color: '#666', marginBottom: 24 }}>Découvrez des milliers d'articles - Achetez, vendez et échangez avec notre communauté</p>

          <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 250, display: 'flex', alignItems: 'center', background: 'white', border: '2px solid #e0e0e0', borderRadius: 12, padding: '0 16px', transition: 'border-color 0.2s' }}>
              <FontAwesomeIcon icon={faSearch} style={{ color: '#166FE5', marginRight: 12 }} />
              <input
                type="text"
                placeholder="Rechercher un produit, une catégorie..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ flex: 1, border: 'none', outline: 'none', padding: '14px 0', fontSize: 14, background: 'transparent' }}
              />
            </div>
            <button
              onClick={() => router.push('/marketplace/sell')}
              style={{
                background: 'linear-gradient(135deg, #166FE5, #0052CC)',
                color: 'white',
                border: 'none',
                borderRadius: 12,
                padding: '14px 28px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                boxShadow: '0 4px 12px rgba(22, 111, 229, 0.3)',
                transition: 'transform 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}
            >
              <FontAwesomeIcon icon={faPlus} /> Vendre un article
            </button>
          </div>

          <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 16, scrollBehavior: 'smooth' }}>
            <button
              onClick={() => setSelectedCategory('')}
              style={{
                padding: '10px 18px',
                border: selectedCategory === '' ? '2px solid #166FE5' : '1px solid #e0e0e0',
                borderRadius: 24,
                background: selectedCategory === '' ? '#e3f2fd' : 'white',
                color: selectedCategory === '' ? '#166FE5' : '#333',
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              Tous les articles
            </button>
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                style={{
                  padding: '10px 18px',
                  border: selectedCategory === cat.id ? '2px solid #166FE5' : '1px solid #e0e0e0',
                  borderRadius: 24,
                  background: selectedCategory === cat.id ? '#e3f2fd' : 'white',
                  color: selectedCategory === cat.id ? '#166FE5' : '#333',
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <FontAwesomeIcon icon={cat.icon} />
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {loading && skip === 0 ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <FontAwesomeIcon icon={faSpinner} spin style={{ fontSize: 32, color: '#166FE5', marginBottom: 16, display: 'block' }} />
            <p style={{ color: '#666', fontSize: 16 }}>Chargement des produits...</p>
          </div>
        ) : products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#666' }}>
            <p style={{ fontSize: 18 }}>Aucun produit</p>
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 16, marginBottom: 40 }}>
              {products.map(product => {
                const images = product.images ? JSON.parse(product.images) : [];
                const isFavored = favorites.includes(product.id);

                return (
                  <div
                    key={product.id}
                    onClick={() => router.push(`/marketplace/${product.id}`)}
                    style={{
                      border: '1px solid #e0e0e0',
                      borderRadius: 12,
                      overflow: 'hidden',
                      background: 'white',
                      cursor: 'pointer',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}
                  >
                    <div
                      style={{
                        width: '100%',
                        height: 200,
                        background: images.length > 0 ? `url(${images[0]})` : 'linear-gradient(135deg, #f5f5f5, #e0e0e0)',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        position: 'relative',
                        overflow: 'hidden'
                      }}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(product.id);
                        }}
                        style={{
                          position: 'absolute',
                          top: 10,
                          right: 10,
                          width: 40,
                          height: 40,
                          borderRadius: '50%',
                          background: isFavored ? '#ff4081' : 'rgba(255,255,255,0.9)',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 18,
                          color: isFavored ? 'white' : '#ff4081',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                      >
                        <FontAwesomeIcon icon={isFavored ? faHeartSolid : faHeartEmpty} />
                      </button>
                    </div>

                    <div style={{ padding: 14 }}>
                      <h3 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 10px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#1a1a1a' }}>
                        {product.title}
                      </h3>

                      <div style={{ fontSize: 18, fontWeight: 'bold', color: '#166FE5', marginBottom: 10 }}>
                        €{product.price.toFixed(2)}
                      </div>

                      {product.averageRating && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, fontSize: 12 }}>
                          <div style={{ display: 'flex', gap: 2, color: '#ff9800' }}>
                            {[...Array(5)].map((_, i) => (
                              <FontAwesomeIcon key={i} icon={faStar} style={{ opacity: i < Math.round(product.averageRating) ? 1 : 0.3 }} />
                            ))}
                          </div>
                          <span style={{ color: '#999', fontSize: 11 }}>({product.reviewCount})</span>
                        </div>
                      )}

                      {product.location && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#666', marginBottom: 8 }}>
                          <FontAwesomeIcon icon={faMapMarkerAlt} style={{ color: '#166FE5' }} />
                          {product.location}
                        </div>
                      )}

                      <div style={{ fontSize: 11, color: '#999', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <FontAwesomeIcon icon={faSpinner} style={{ fontSize: 10 }} />
                        {product.views} vues
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {skip + 15 < total && (
              <div style={{ textAlign: 'center', marginTop: 40 }}>
                <button
                  onClick={handleLoadMore}
                  style={{
                    padding: '12px 32px',
                    background: '#f0f0f0',
                    border: '1px solid #e0e0e0',
                    borderRadius: 8,
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Charger plus
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
