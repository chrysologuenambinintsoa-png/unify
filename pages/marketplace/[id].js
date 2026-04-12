import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar, faMapMarkerAlt, faBox, faHeart, faShare, faCheck, faSpinner, faArrowLeft, faUser, faCalendar } from '@fortawesome/free-solid-svg-icons';
import { faHeart as faHeartEmpty } from '@fortawesome/free-regular-svg-icons';

export default function ProductDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [isFavored, setIsFavored] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (user) {
      try {
        setCurrentUser(JSON.parse(user));
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    if (!id) return;
    
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/marketplace/${id}`);
        const data = await res.json();
        setProduct(data);
        const favs = JSON.parse(localStorage.getItem('favorites') || '[]');
        setIsFavored(favs.includes(parseInt(id)));
      } catch (e) {
        console.error('Error fetching product', e);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const handleSubmitReview = async () => {
    if (!currentUser) {
      router.push('/auth');
      return;
    }

    setSubmittingReview(true);
    try {
      await fetch(`/api/marketplace/${id}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating: parseInt(rating),
          comment: comment.trim(),
          buyer: currentUser.email
        })
      });

      setComment('');
      setRating(5);
      const res = await fetch(`/api/marketplace/${id}`);
      const data = await res.json();
      setProduct(data);
    } catch (e) {
      console.error('Error submitting review', e);
    } finally {
      setSubmittingReview(false);
    }
  };

  const toggleFavorite = async () => {
    if (!currentUser) {
      router.push('/auth');
      return;
    }

    try {
      await fetch(`/api/marketplace/${parseInt(id)}/favorites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userEmail: currentUser.email })
      });
      setIsFavored(!isFavored);
    } catch (e) {
      console.error('Error toggling favorite', e);
    }
  };

  const handleContact = () => {
    if (!currentUser) {
      router.push('/auth');
      return;
    }

    if (currentUser.email === product.sellerEmail) {
      alert('Vous ne pouvez pas vous contacter vous-même');
      return;
    }

    // Préparer des métadonnées spécifiques au vendeur (FAQ / autoreponse / questionnaire)
    const faq = [
      { q: 'Quel est l\'état exact de l\'article ?', a: 'Voir la description détaillée ci-dessus.' },
      { q: 'La livraison est-elle possible ?', a: product.location ? `Peut être expédié depuis ${product.location}` : 'Contactez le vendeur pour plus de détails.' }
    ];

    const autoResponse = 'Bonjour 👋 — merci pour votre message. Le vendeur répondra sous 24h. En attendant, consultez la FAQ ci-dessous ou envoyez vos questions.';

    const questionnaire = [
      { id: 'when', question: 'Quand souhaitez-vous récupérer / recevoir l\'article ?', type: 'text' },
      { id: 'offer', question: 'Souhaitez-vous faire une offre (montant) ?', type: 'text' }
    ];

    // Ouvrir le chat modal global via l'événement, en passant les meta du vendeur
    const contactName = product.seller ? ((product.seller.prenom || '') + ' ' + (product.seller.nom || '')).trim() || product.seller.nomUtilisateur || product.seller.email.split('@')[0] : (product.sellerEmail ? product.sellerEmail.split('@')[0] : 'Vendeur')

    window.dispatchEvent(new CustomEvent('openChatWithContact', {
      detail: {
        contactEmail: product.sellerEmail,
        contactName,
        sellerMeta: { faq, autoResponse, questionnaire }
      }
    }));
  };

  if (loading) {
    return (
      <Layout>
        <div style={{ textAlign: 'center', padding: 80 }}>
          <FontAwesomeIcon icon={faSpinner} spin style={{ fontSize: 40, color: '#166FE5', marginBottom: 20, display: 'block' }} />
          <p style={{ color: '#666' }}>Chargement...</p>
        </div>
      </Layout>
    );
  }

  if (!product) {
    return (
      <Layout>
        <div style={{ textAlign: 'center', padding: 80 }}>
          <h2 style={{ fontSize: 24, color: '#333', marginBottom: 16 }}>Produit non trouvé</h2>
          <button
            onClick={() => router.push('/marketplace')}
            style={{
              padding: '12px 24px',
              background: '#166FE5',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            <FontAwesomeIcon icon={faArrowLeft} /> Retour au marketplace
          </button>
        </div>
      </Layout>
    );
  }

  const images = product.images ? JSON.parse(product.images) : [];
  const averageRating = product.reviews && product.reviews.length > 0
    ? (product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length).toFixed(1)
    : null;

  return (
    <Layout>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '20px' }}>
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          style={{
            padding: '8px 16px',
            background: 'transparent',
            border: '1px solid #e0e0e0',
            borderRadius: 8,
            cursor: 'pointer',
            marginBottom: 24,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            color: '#666',
            fontWeight: 500
          }}
        >
          <FontAwesomeIcon icon={faArrowLeft} /> Retour
        </button>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, marginBottom: 60 }}>
          {/* Images Section */}
          <div>
            {images.length > 0 ? (
              <div>
                <img
                  src={images[0]}
                  alt={product.title}
                  style={{
                    width: '100%',
                    borderRadius: 16,
                    maxHeight: 600,
                    objectFit: 'cover',
                    marginBottom: 16,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}
                />
                {images.length > 1 && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: 12 }}>
                    {images.map((img, i) => (
                      <img
                        key={i}
                        src={img}
                        alt={`Product ${i}`}
                        style={{
                          width: '100%',
                          height: 100,
                          borderRadius: 12,
                          objectFit: 'cover',
                          cursor: 'pointer',
                          opacity: 0.7,
                          transition: 'opacity 0.2s'
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div style={{
                width: '100%',
                height: 600,
                background: 'linear-gradient(135deg, #f5f5f5, #e0e0e0)',
                borderRadius: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 48,
                color: '#ccc'
              }}>
                <FontAwesomeIcon icon={faBox} />
              </div>
            )}
          </div>

          {/* Product Info */}
          <div>
            <h1 style={{ fontSize: 32, fontWeight: 'bold', marginBottom: 16, color: '#1a1a1a' }}>{product.title}</h1>

            {/* Price */}
            <div style={{
              fontSize: 40,
              fontWeight: 'bold',
              color: '#166FE5',
              marginBottom: 24,
              display: 'flex',
              alignItems: 'baseline',
              gap: 8
            }}>
              €{product.price.toFixed(2)}
              {product.currency !== 'EUR' && <span style={{ fontSize: 16, color: '#999' }}>{product.currency}</span>}
            </div>

            {/* Rating */}
            {averageRating && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, paddingBottom: 24, borderBottom: '1px solid #e0e0e0' }}>
                <div style={{ display: 'flex', gap: 4, color: '#ff9800' }}>
                  {[...Array(5)].map((_, i) => (
                    <FontAwesomeIcon
                      key={i}
                      icon={faStar}
                      style={{ opacity: i < Math.round(averageRating) ? 1 : 0.3, fontSize: 18 }}
                    />
                  ))}
                </div>
                <span style={{ fontWeight: 600, fontSize: 16 }}>{averageRating}</span>
                <span style={{ color: '#999' }}>({product.reviews?.length || 0} avis)</span>
              </div>
            )}

            {/* Details Grid */}
            <div style={{ display: 'grid', gap: 16, marginBottom: 24 }}>
              {product.condition && (
                <div style={{ padding: 16, background: '#f9f9f9', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <FontAwesomeIcon icon={faBox} style={{ color: '#166FE5', fontSize: 20 }} />
                  <div>
                    <div style={{ fontSize: 12, color: '#999' }}>État</div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{product.condition}</div>
                  </div>
                </div>
              )}

              {product.location && (
                <div style={{ padding: 16, background: '#f9f9f9', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <FontAwesomeIcon icon={faMapMarkerAlt} style={{ color: '#166FE5', fontSize: 20 }} />
                  <div>
                    <div style={{ fontSize: 12, color: '#999' }}>Localisation</div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{product.location}</div>
                  </div>
                </div>
              )}

              <div style={{ padding: 16, background: '#f9f9f9', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
                <FontAwesomeIcon icon={faUser} style={{ color: '#166FE5', fontSize: 20 }} />
                <div>
                  <div style={{ fontSize: 12, color: '#999' }}>Vendeur</div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>
                    {product.seller && (product.seller.prenom || product.seller.nom) ? `${product.seller.prenom || ''} ${product.seller.nom || ''}`.trim() : (product.seller && product.seller.nomUtilisateur) ? product.seller.nomUtilisateur : (product.sellerEmail ? product.sellerEmail.split('@')[0] : 'Vendeur')}
                  </div>
                </div>
              </div>

              <div style={{ padding: 16, background: '#f9f9f9', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
                <FontAwesomeIcon icon={faCalendar} style={{ color: '#166FE5', fontSize: 20 }} />
                <div>
                  <div style={{ fontSize: 12, color: '#999' }}>Publié</div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{new Date(product.createdAt).toLocaleDateString('fr-FR')}</div>
                </div>
              </div>
            </div>

            {/* Description */}
            {product.description && (
              <div style={{ marginBottom: 24, paddingBottom: 24, borderBottom: '1px solid #e0e0e0' }}>
                <h3 style={{ fontWeight: 600, marginBottom: 12, fontSize: 16 }}>Description</h3>
                <p style={{ color: '#666', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{product.description}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <button
                onClick={toggleFavorite}
                style={{
                  padding: '14px 24px',
                  background: isFavored ? '#ff4081' : 'transparent',
                  color: isFavored ? 'white' : '#ff4081',
                  border: `2px solid ${isFavored ? '#ff4081' : '#ff4081'}`,
                  borderRadius: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  transition: 'all 0.2s'
                }}
              >
                <FontAwesomeIcon icon={isFavored ? faHeart : faHeartEmpty} /> Favori
              </button>
              <button
                onClick={handleContact}
                style={{
                  padding: '14px 24px',
                  background: '#166FE5',
                  color: 'white',
                  border: 'none',
                  borderRadius: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  boxShadow: '0 4px 12px rgba(22, 111, 229, 0.3)'
                }}
              >
                <FontAwesomeIcon icon={faShare} /> Contacter
              </button>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div style={{ borderTop: '2px solid #e0e0e0', paddingTop: 40 }}>
          <h2 style={{ fontSize: 28, fontWeight: 'bold', marginBottom: 32 }}>Avis clients</h2>

          {/* Submit Review Form */}
          {currentUser && (
            <div style={{
              background: 'linear-gradient(135deg, #f9f9f9, #f0f0f0)',
              padding: 24,
              borderRadius: 16,
              marginBottom: 32,
              border: '1px solid #e0e0e0'
            }}>
              <h3 style={{ marginBottom: 16, fontWeight: 600 }}>Laisser un avis</h3>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontWeight: 600, marginBottom: 8, display: 'block' }}>Votre note:</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[1, 2, 3, 4, 5].map(n => (
                    <button
                      key={n}
                      onClick={() => setRating(n)}
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 50,
                        border: rating === n ? '2px solid #ff9800' : '1px solid #ddd',
                        background: rating === n ? '#fff3e0' : 'white',
                        color: rating >= n ? '#ff9800' : '#ccc',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                      }}
                    >
                      <FontAwesomeIcon icon={faStar} />
                    </button>
                  ))}
                </div>
              </div>
              <textarea
                placeholder="Partagez votre expérience..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                style={{
                  width: '100%',
                  minHeight: 100,
                  padding: 12,
                  border: '1px solid #ddd',
                  borderRadius: 8,
                  marginBottom: 16,
                  fontFamily: 'inherit',
                  fontSize: 14,
                  resize: 'vertical'
                }}
              />
              <button
                onClick={handleSubmitReview}
                disabled={submittingReview || !comment.trim()}
                style={{
                  padding: '12px 24px',
                  background: '#166FE5',
                  color: 'white',
                  border: 'none',
                  borderRadius: 8,
                  fontWeight: 600,
                  cursor: submittingReview || !comment.trim() ? 'not-allowed' : 'pointer',
                  opacity: submittingReview || !comment.trim() ? 0.6 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}
              >
                <FontAwesomeIcon icon={faCheck} /> {submittingReview ? 'Envoi...' : 'Publier l\'avis'}
              </button>
            </div>
          )}

          {/* Reviews List */}
          <div>
            {product.reviews && product.reviews.length > 0 ? (
              <div style={{ display: 'grid', gap: 16 }}>
                {product.reviews.map(review => (
                  <div
                    key={review.id}
                    style={{
                      padding: 20,
                      border: '1px solid #e0e0e0',
                      borderRadius: 12,
                      background: 'white',
                      transition: 'box-shadow 0.2s'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 12 }}>
                      <div>
                        <strong style={{ fontSize: 16 }}>{review.buyer}</strong>
                        <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                          {new Date(review.createdAt).toLocaleDateString('fr-FR')}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 2, color: '#ff9800' }}>
                        {[...Array(5)].map((_, i) => (
                          <FontAwesomeIcon
                            key={i}
                            icon={faStar}
                            style={{ opacity: i < review.rating ? 1 : 0.3 }}
                          />
                        ))}
                      </div>
                    </div>
                    {review.comment && (
                      <p style={{ color: '#666', lineHeight: 1.6, margin: 0 }}>{review.comment}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
                <FontAwesomeIcon icon={faStar} style={{ fontSize: 32, marginBottom: 16, display: 'block', opacity: 0.3 }} />
                <p>Aucun avis pour le moment. Soyez le premier à commenter!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
