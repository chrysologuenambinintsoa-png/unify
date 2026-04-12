import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMobileAlt, faTshirt, faHome, faTools, faBook, faFootballBall, faPalette, faBox, faTag, faCheck, faSpinner, faMapMarkerAlt, faFileAlt } from '@fortawesome/free-solid-svg-icons';

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

const CONDITIONS = [
  { id: 'new', label: 'Neuf' },
  { id: 'like-new', label: 'Comme neuf' },
  { id: 'good', label: 'Bon état' },
  { id: 'fair', label: 'Correct' }
];

export default function SellPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'electronics',
    price: '',
    condition: 'good',
    location: '',
    images: [],
    banner: null
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (!user) {
      router.push('/auth');
    } else {
      try {
        setCurrentUser(JSON.parse(user));
      } catch (e) {}
    }
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!form.title || !form.price || !form.category) {
      setMessage('Veuillez remplir les champs obligatoires');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/marketplace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          price: parseFloat(form.price),
          sellerEmail: currentUser.email,
          images: form.images.length > 0 ? form.images : null
        })
      });

      if (res.ok) {
        const data = await res.json();
        setMessage('Produit publié avec succès!');
        setTimeout(() => {
          router.push(`/marketplace/${data.id}`);
        }, 1500);
      } else {
        if (res.status === 403) {
          const err = await res.json().catch(() => ({ error: 'Accès refusé' }));
          setMessage(err.error || 'Accès refusé');
        } else {
          const err = await res.json().catch(() => ({ error: 'Erreur lors de la publication' }));
          setMessage(err.error || 'Erreur lors de la publication');
        }
      }
    } catch (e) {
      console.error('Error posting product', e);
      setMessage('Erreur serveur');
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) {
    return (
      <Layout>
        <div style={{ textAlign: 'center', padding: 40 }}>Redirection...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div style={{ maxWidth: 700, margin: '0 auto', padding: '20px' }}>
        {/* Header */}
        <div style={{ marginBottom: 40, textAlign: 'center' }}>
          <h1 style={{ fontSize: 32, fontWeight: 'bold', marginBottom: 8, color: '#1a1a1a' }}>Publier un article</h1>
          <p style={{ color: '#666', fontSize: 16 }}>Vendez en quelques minutes sur Unify Marketplace</p>
        </div>

        {/* If user is not approved as seller, show CTA to upgrade */}
        {!currentUser.isApprovedSeller && (
          <div style={{ marginBottom: 18, padding: 16, borderRadius: 12, background: '#fff8f0', border: '1px solid #ffe4c4', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ color: '#663c00' }}>
              <div style={{ fontWeight: 700 }}>Activez votre compte vendeur</div>
              <div style={{ fontSize: 13, color: '#5b3d00' }}>Pour publier des articles, vous devez activer votre compte vendeur.</div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <a href="/marketplace/upgrade" style={{ padding: '10px 14px', background: '#ff8c42', color: 'white', borderRadius: 8, textDecoration: 'none', fontWeight: 700 }}>Devenir vendeur</a>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {message && (
            <div style={{
              padding: 16,
              borderRadius: 12,
              background: message.includes('succès') ? '#d4edda' : '#f8d7da',
              color: message.includes('succès') ? '#155724' : '#721c24',
              textAlign: 'center',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8
            }}>
              <FontAwesomeIcon icon={message.includes('succès') ? faCheck : faBox} />
              {message}
            </div>
          )}

          {/* Section 1: Basic Info */}
          <div style={{
            background: 'linear-gradient(135deg, #f9f9f9, #f0f0f0)',
            padding: 24,
            borderRadius: 16,
            border: '1px solid #e0e0e0'
          }}>
            <h2 style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
              <FontAwesomeIcon icon={faFileAlt} style={{ fontSize: 20, color: '#166FE5' }} />
              Informations générales
            </h2>

            {/* Titre */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontWeight: 600, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
                <FontAwesomeIcon icon={faTag} style={{ color: '#166FE5' }} />
                Titre du produit *
              </label>
              <input
                type="text"
                placeholder="Ex: iPhone 13 Pro 256GB..."
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                style={{
                  width: '100%',
                  padding: 12,
                  border: '1px solid #ddd',
                  borderRadius: 8,
                  fontSize: 14,
                  transition: 'border-color 0.2s'
                }}
                required
              />
            </div>

            {/* Description */}
            <div>
              <label style={{ fontWeight: 600, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
                <FontAwesomeIcon icon={faFileAlt} style={{ color: '#166FE5' }} />
                Description
              </label>
              <textarea
                placeholder="Décrivez les caractéristiques, l'état, les accessoires inclus..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                style={{
                  width: '100%',
                  minHeight: 120,
                  padding: 12,
                  border: '1px solid #ddd',
                  borderRadius: 8,
                  fontSize: 14,
                  fontFamily: 'inherit',
                  resize: 'vertical'
                }}
              />
            </div>

            {/* Bannière */}
            <div style={{ marginTop: 16 }}>
              <label style={{ fontWeight: 600, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
                Bannière (image)
              </label>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <label style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  width: 320,
                  height: 140,
                  border: '2px dashed #d6e6ff',
                  borderRadius: 12,
                  background: '#fbfdff',
                  color: '#166FE5',
                  cursor: 'pointer',
                  padding: 12,
                  textAlign: 'center'
                }}>
                  <div style={{ fontWeight: 700 }}>Glisser ou cliquer pour ajouter</div>
                  <div style={{ fontSize: 12, color: '#6b7785' }}>Format recommandé: 1200x400px — JPG/PNG — max 2MB</div>
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const file = e.target.files && e.target.files[0];
                      if (!file) return;
                      if (file.size > 2 * 1024 * 1024) {
                        setMessage('Le fichier dépasse 2MB.');
                        return;
                      }
                      const reader = new FileReader();
                      reader.onload = () => {
                        setForm(prev => ({ ...prev, banner: reader.result }));
                        setMessage('');
                      };
                      reader.readAsDataURL(file);
                    }}
                  />
                </label>

                {form.banner && (
                  <div style={{ position: 'relative', width: 320, height: 140, borderRadius: 12, overflow: 'hidden', border: '1px solid #e0e6ef' }}>
                    <img src={form.banner} alt="Aperçu bannière" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, banner: null })}
                      style={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        background: 'rgba(0,0,0,0.6)',
                        color: 'white',
                        border: 'none',
                        borderRadius: 6,
                        padding: '6px 8px',
                        cursor: 'pointer'
                      }}
                    >Supprimer</button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Category & Pricing */}
          <div style={{
            background: 'linear-gradient(135deg, #f9f9f9, #f0f0f0)',
            padding: 24,
            borderRadius: 16,
            border: '1px solid #e0e0e0'
          }}>
            <h2 style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
              <FontAwesomeIcon icon={faBox} style={{ fontSize: 20, color: '#166FE5' }} />
              Catégorie & Prix
            </h2>

            {/* Catégorie */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontWeight: 600, marginBottom: 12, display: 'block', fontSize: 14 }}>Catégorie *</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setForm({ ...form, category: cat.id })}
                    style={{
                      padding: 12,
                      border: form.category === cat.id ? '2px solid #166FE5' : '1px solid #ddd',
                      background: form.category === cat.id ? '#e8f1ff' : 'white',
                      borderRadius: 8,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      transition: 'all 0.2s',
                      fontWeight: form.category === cat.id ? 600 : 500,
                      color: form.category === cat.id ? '#166FE5' : '#666'
                    }}
                  >
                    <FontAwesomeIcon icon={cat.icon} />
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Prix */}
            <div>
              <label style={{ fontWeight: 600, marginBottom: 8, display: 'block', fontSize: 14 }}>Prix (€) *</label>
              <input
                type="number"
                placeholder="0.00"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                min="0"
                step="0.01"
                style={{
                  width: '100%',
                  padding: 12,
                  border: '1px solid #ddd',
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 600,
                  color: '#166FE5'
                }}
                required
              />
            </div>
          </div>

          {/* Section 3: Condition & Location */}
          <div style={{
            background: 'linear-gradient(135deg, #f9f9f9, #f0f0f0)',
            padding: 24,
            borderRadius: 16,
            border: '1px solid #e0e0e0'
          }}>
            <h2 style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
              <FontAwesomeIcon icon={faCheck} style={{ fontSize: 20, color: '#166FE5' }} />
              État & Localisation
            </h2>

            {/* Condition */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontWeight: 600, marginBottom: 12, display: 'block', fontSize: 14 }}>Condition</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                {CONDITIONS.map(cond => (
                  <button
                    key={cond.id}
                    type="button"
                    onClick={() => setForm({ ...form, condition: cond.id })}
                    style={{
                      padding: 12,
                      border: form.condition === cond.id ? '2px solid #166FE5' : '1px solid #ddd',
                      background: form.condition === cond.id ? '#e8f1ff' : 'white',
                      borderRadius: 8,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      fontWeight: form.condition === cond.id ? 600 : 500,
                      color: form.condition === cond.id ? '#166FE5' : '#666'
                    }}
                  >
                    {cond.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Localisation */}
            <div>
              <label style={{ fontWeight: 600, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
                <FontAwesomeIcon icon={faMapMarkerAlt} style={{ color: '#166FE5' }} />
                Localisation
              </label>
              <input
                type="text"
                placeholder="Ex: Paris, 75001"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                style={{
                  width: '100%',
                  padding: 12,
                  border: '1px solid #ddd',
                  borderRadius: 8,
                  fontSize: 14
                }}
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !currentUser.isApprovedSeller}
            style={{
              padding: '16px 32px',
              background: (loading || !currentUser.isApprovedSeller) ? '#ccc' : 'linear-gradient(135deg, #166FE5, #0052CC)',
              color: 'white',
              border: 'none',
              borderRadius: 12,
              fontWeight: 600,
              fontSize: 16,
              cursor: (loading || !currentUser.isApprovedSeller) ? 'not-allowed' : 'pointer',
              boxShadow: (loading || !currentUser.isApprovedSeller) ? 'none' : '0 4px 12px rgba(22, 111, 229, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              transition: 'all 0.2s'
            }}
          >
            {loading ? (
              <>
                <FontAwesomeIcon icon={faSpinner} spin /> Publication en cours...
              </>
            ) : !currentUser.isApprovedSeller ? (
              <>
                <FontAwesomeIcon icon={faCheck} /> Activez votre compte pour publier
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faCheck} /> Publier mon article
              </>
            )}
          </button>

          {/* Info Text */}
          <div style={{
            background: '#f0f7ff',
            padding: 16,
            borderRadius: 12,
            border: '1px solid #b3d9ff',
            color: '#0052CC',
            fontSize: 13,
            lineHeight: 1.6
          }}>
            <strong>Astuce:</strong> Plus votre description est détaillée, plus vous aurez de vues et de chances de vendre rapidement. Incluez les dimensions, les défauts, et ce qui est inclus.
          </div>
        </form>
      </div>
    </Layout>
  );
}
