import React, { useState, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTimes, faCamera, faImage } from '@fortawesome/free-solid-svg-icons';

export default function CreateGroupModal({ onClose, onCreated, user }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'Communauté',
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
      const img = new window.Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = width * ratio;
          height = height * ratio;
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(resolve, 'image/jpeg', quality);
      };
      img.src = dataUrl;
    });
  };

  async function handleSubmit(e) {
      //
    setError('');
    if (!formData.name.trim()) {
      setError('Le nom du groupe est requis');
      return;
    }
    if (!user?.email) {
      setError("Impossible de créer le groupe : utilisateur non connecté ou email manquant.");
      return;
    }
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('category', formData.category);
      formDataToSend.append('privacy', formData.privacy);
      formDataToSend.append('userEmail', user.email);
      if (profileImage) {
        const profileBlob = await compressImage(profileImage, 400, 400, 0.8);
        formDataToSend.append('profileImage', profileBlob, 'profile.jpg');
      }
      if (coverImage) {
        const coverBlob = await compressImage(coverImage, 1200, 400, 0.75);
        formDataToSend.append('coverImage', coverBlob, 'cover.jpg');
      }
      const res = await fetch('/api/groupes', {
        method: 'POST',
        body: formDataToSend
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erreur lors de la création');
      }
      setFormData({ name: '', description: '', category: 'Communauté', privacy: 'PUBLIC' });
      setProfileImage(null);
      setCoverImage(null);
      onCreated && onCreated();
      onClose && onClose();
    } catch (e) {
      setError(e.message || 'Erreur lors de la création du groupe');
    }
  }

  return (
    <div className="create-group-modal-overlay" style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(8,2,35,0.18)',zIndex:10000,display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div className="create-group-modal" style={{background:'#fff',borderRadius:18,padding:0,minWidth:280,maxWidth:'420px',width:'100%',maxHeight:'92vh',boxShadow:'0 8px 32px rgba(8,2,35,0.18)',overflow:'auto',margin:'80px 0 24px 0'}}>
        {/* Header coloré avec icône */}
        <div style={{background:'linear-gradient(90deg,#6a82fb,#fc5c7d 90%)',padding:'22px 32px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div style={{display:'flex',alignItems:'center',gap:14}}>
            <span style={{fontSize:26,background:'#fff',color:'#6a82fb',borderRadius:12,padding:'6px 12px',boxShadow:'0 2px 8px rgba(0,0,0,0.07)'}}><FontAwesomeIcon icon={faPlus} /></span>
            <span style={{fontSize:22,fontWeight:700,color:'#fff',letterSpacing:0.5}}>Créer un groupe</span>
          </div>
          <button className="close-btn" onClick={onClose} type="button" style={{background:'none',border:'none',fontSize:26,color:'#fff',padding:0,marginLeft:12,cursor:'pointer'}}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="page-form" style={{padding:'28px 32px'}}>
          <div className="form-group" style={{marginBottom:22}}>
            <label style={{fontWeight:600,marginBottom:6,display:'block'}}>Nom du groupe *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Ex: Groupe des passionnés"
              required
              style={{width:'100%',padding:'12px',borderRadius:8,border:'1px solid #d1d5db',fontSize:16,background:'#fafaff'}}
            />
          </div>
          <div className="form-group" style={{marginBottom:22}}>
            <label style={{fontWeight:600,marginBottom:6,display:'block'}}>Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Décrivez votre groupe..."
              rows="4"
              style={{width:'100%',padding:'12px',borderRadius:8,border:'1px solid #d1d5db',fontSize:15,background:'#fafaff'}}
            />
          </div>
          <div className="form-row" style={{display:'flex',gap:16,marginBottom:22}}>
            <div className="form-group" style={{flex:1}}>
              <label style={{fontWeight:600,marginBottom:6,display:'block'}}>Catégorie</label>
              <select 
                name="category" 
                value={formData.category}
                onChange={handleInputChange}
              >
                <option>Communauté</option>
                <option>Entreprise</option>
                <option>Sport</option>
                <option>Musique</option>
                <option>Art</option>
                <option>Autre</option>
              </select>
            </div>
            <div className="form-group" style={{flex:1}}>
              <label style={{fontWeight:600,marginBottom:6,display:'block'}}>Confidentialité</label>
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
          <div className="form-row" style={{display:'flex',gap:16,marginBottom:22}}>
            <div className="form-group" style={{flex:1}}>
              <label style={{fontWeight:600,marginBottom:6,display:'block'}}>Image de profil</label>
              <div className="image-upload" style={{display:'flex',flexDirection:'column',alignItems:'center',gap:8}}>
                {profileImage && (
                  <div className="image-preview" style={{marginBottom:4}}>
                    <img src={profileImage} alt="Profile" style={{width:64,height:64,borderRadius:'50%',objectFit:'cover',boxShadow:'0 2px 8px rgba(0,0,0,0.08)'}} />
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => fileInputProfile.current?.click()}
                  className="upload-btn"
                  style={{marginTop:0,padding:'7px 18px',borderRadius:7,background:'#f5f7fa',border:'1px solid #d1d5db',color:'#080223',fontWeight:600,fontSize:15,cursor:'pointer'}}
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
            <div className="form-group" style={{flex:1}}>
              <label style={{fontWeight:600,marginBottom:6,display:'block'}}>Image de couverture</label>
              <div className="image-upload" style={{display:'flex',flexDirection:'column',alignItems:'center',gap:8}}>
                {coverImage && (
                  <div className="image-preview-cover" style={{marginBottom:4}}>
                    <img src={coverImage} alt="Cover" style={{width:120,height:60,borderRadius:10,objectFit:'cover',boxShadow:'0 2px 8px rgba(0,0,0,0.08)'}} />
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => fileInputCover.current?.click()}
                  className="upload-btn"
                  style={{marginTop:0,padding:'7px 18px',borderRadius:7,background:'#f5f7fa',border:'1px solid #d1d5db',color:'#080223',fontWeight:600,fontSize:15,cursor:'pointer'}}
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
          {error && <div style={{color:'red',marginBottom:18,textAlign:'center',fontWeight:600}}>{error}</div>}
          <div className="form-actions" style={{display:'flex',justifyContent:'flex-end',gap:12,marginTop:32}}>
            <button
              type="button"
              className="cancel-btn"
              onClick={onClose}
              disabled={loading}
              style={{padding:'10px 28px',borderRadius:8,background:'#f5f7fa',color:'#080223',border:'1px solid #d1d5db',fontWeight:600,fontSize:16,cursor:'pointer'}}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="submit-btn"
              disabled={loading}
              style={{
                padding: '12px 36px',
                borderRadius: 12,
                background: 'linear-gradient(90deg,#2563eb 0%,#1e40af 100%)',
                color: '#fff',
                border: 'none',
                fontWeight: 800,
                fontSize: 18,
                letterSpacing: 0.5,
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 16px rgba(37,99,235,0.13)',
                transition: 'background 0.2s, box-shadow 0.2s, transform 0.1s',
                transform: loading ? 'scale(0.98)' : 'scale(1)',
                opacity: loading ? 0.7 : 1
              }}
              onMouseDown={e => e.currentTarget.style.transform = 'scale(0.97)'}
              onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              {loading ? 'Création...' : 'Créer le groupe'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
