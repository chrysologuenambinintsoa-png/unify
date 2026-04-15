'use client';

import React, { useState, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTimes, faCamera, faImage, faUpload } from '@fortawesome/free-solid-svg-icons';

export default function CreatePageForm({ onPageCreated, user }) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'Entreprise',
    subcategory: '',
    address: '',
    phone: '',
    website: '',
    contactEmail: '',
    privacy: 'PUBLIC'
  });
  const [profileImage, setProfileImage] = useState(null);
  const [coverImage, setCoverImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputProfile = useRef(null);
  const fileInputCover = useRef(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleProfileImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setProfileImage(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCoverImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCoverImage(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Helper function to compress image
  const compressImage = async (dataUrl, maxWidth = 1200, maxHeight = 800, quality = 0.7) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Scale down if too large
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = width * ratio;
          height = height * ratio;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(resolve, 'image/jpeg', quality);
      };
      img.src = dataUrl;
    });
  };

  const handleCreatePage = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('Le nom de la page est requis');
      return;
    }

    try {
      setLoading(true);
      
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('category', formData.category);
      formDataToSend.append('subcategory', formData.subcategory);
      formDataToSend.append('address', formData.address);
      formDataToSend.append('phone', formData.phone);
      formDataToSend.append('website', formData.website);
      formDataToSend.append('contactEmail', formData.contactEmail);
      formDataToSend.append('privacy', formData.privacy);
      
      // Compress and append images
      if (profileImage) {
        const profileBlob = await compressImage(profileImage, 400, 400, 0.8);
        formDataToSend.append('profileImage', profileBlob, 'profile.jpg');
      }
      
      if (coverImage) {
        const coverBlob = await compressImage(coverImage, 1200, 400, 0.75);
        formDataToSend.append('coverImage', coverBlob, 'cover.jpg');
      }
      
      const response = await fetch('/api/pages', {
        method: 'POST',
        headers: {
          'x-user-email': user?.email || ''
        },
        body: formDataToSend
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erreur lors de la création de la page');
      }

      const newPage = await response.json();
      
      // Reset form
      setFormData({ 
        name: '', 
        description: '', 
        category: 'Entreprise', 
        subcategory: '',
        address: '',
        phone: '',
        website: '',
        contactEmail: '',
        privacy: 'PUBLIC' 
      });
      setProfileImage(null);
      setCoverImage(null);
      setShowForm(false);

      // Call callback
      if (onPageCreated) {
        onPageCreated(newPage);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-page-section">
      {!showForm ? (
        <button 
          className="create-page-btn"
          onClick={() => setShowForm(true)}
        >
          <FontAwesomeIcon icon={faPlus} /> Créer une nouvelle page
        </button>
      ) : (
        <div className="create-page-form-container">
          <div className="form-header">
            <h3>Créer une nouvelle page</h3>
            <button 
              className="close-btn"
              onClick={() => setShowForm(false)}
              type="button"
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>

          <form onSubmit={handleCreatePage} className="page-form">
            <div className="form-group">
              <label>Nom de la page *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Ex: Ma Boutique"
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Catégorie</label>
                <select 
                  name="category" 
                  value={formData.category}
                  onChange={handleInputChange}
                >
                  <option value="Entreprise">Entreprise</option>
                  <option value="Marque">Marque</option>
                  <option value="Artiste">Artiste</option>
                  <option value="Cause">Cause</option>
                  <option value="Divertissement">Divertissement</option>
                  <option value="communauté">Communauté</option>
                  <option value="Restaurant">Restaurant</option>
                  <option value="Shop">Boutique</option>
                  <option value="Service">Service</option>
                  <option value="Autre">Autre</option>
                </select>
              </div>

              <div className="form-group">
                <label>Confidentialité</label>
                <select 
                  name="privacy" 
                  value={formData.privacy}
                  onChange={handleInputChange}
                >
                  <option value="PUBLIC">Public</option>
                  <option value="PRIVATE">Privée</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Décrivez votre page..."
                rows="3"
              />
            </div>

            <div className="form-group">
              <label>Sous-catégorie</label>
              <input
                type="text"
                name="subcategory"
                value={formData.subcategory}
                onChange={handleInputChange}
                placeholder="Sous-catégorie (optionnel)"
              />
            </div>

            <div className="form-group">
              <label>Adresse</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="Adresse de la page (optionnel)"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Téléphone</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="Numéro de téléphone (optionnel)"
                />
              </div>

              <div className="form-group">
                <label>Email de contact</label>
                <input
                  type="email"
                  name="contactEmail"
                  value={formData.contactEmail}
                  onChange={handleInputChange}
                  placeholder="contact@exemple.com (optionnel)"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Site web</label>
              <input
                type="url"
                name="website"
                value={formData.website}
                onChange={handleInputChange}
                placeholder="https://votre-site.com (optionnel)"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Image de profil</label>
                <div className="image-upload">
                  {profileImage && (
                    <div className="image-preview">
                      <img src={profileImage} alt="Profile" />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => fileInputProfile.current?.click()}
                    className="upload-btn"
                  >
                    <FontAwesomeIcon icon={faCamera} /> Choisir
                  </button>
                  <input
                    ref={fileInputProfile}
                    type="file"
                    accept="image/*"
                    onChange={handleProfileImageSelect}
                    style={{ display: 'none' }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Image de couverture</label>
                <div className="image-upload">
                  {coverImage && (
                    <div className="image-preview-cover">
                      <img src={coverImage} alt="Cover" />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => fileInputCover.current?.click()}
                    className="upload-btn"
                  >
                    <FontAwesomeIcon icon={faImage} /> Choisir
                  </button>
                  <input
                    ref={fileInputCover}
                    type="file"
                    accept="image/*"
                    onChange={handleCoverImageSelect}
                    style={{ display: 'none' }}
                  />
                </div>
              </div>
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="cancel-btn"
                onClick={() => setShowForm(false)}
                disabled={loading}
              >
                Annuler
              </button>
              <button
                type="submit"
                className="submit-btn"
                disabled={loading}
              >
                {loading ? 'Création...' : 'Créer la page'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
