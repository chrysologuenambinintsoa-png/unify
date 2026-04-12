import { useEffect, useState, useRef } from 'react'
import CreatePost from './CreatePost'
import CreatePostModal from './CreatePostModal'
import PostCard from './PostCard'
import Stories from './Stories'
import Modal from './Modal'
import { PostSkeleton } from './Skeleton'
import ClickableAvatar from './ClickableAvatar'

export default function Actualites(){
  const [items, setItems] = useState([])
  const [loadingPosts, setLoadingPosts] = useState(false)
  const [postTitle, setPostTitle] = useState('')
  const [postContent, setPostContent] = useState('')
  const [selectedImage, setSelectedImage] = useState(null)
  const [selectedFilesCount, setSelectedFilesCount] = useState(0)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef(null)
  const [currentUser, setCurrentUser] = useState(null)
  const [showTagModal, setShowTagModal] = useState(false)
  const [showFeelingModal, setShowFeelingModal] = useState(false)
  const [showLocationModal, setShowLocationModal] = useState(false)
  const [tagInput, setTagInput] = useState('')
  const [feelingSelected, setFeelingSelected] = useState(null)
  const [locationInput, setLocationInput] = useState('')
  const [showTextPublicationModal, setShowTextPublicationModal] = useState(false)
  const [textPubContent, setTextPubContent] = useState('')
  const [textPubBgType, setTextPubBgType] = useState('color')
  const [textPubBgColor, setTextPubBgColor] = useState('#667eea')
  const [textPubTextColor, setTextPubTextColor] = useState('#ffffff')
  const [originalFile, setOriginalFile] = useState(null)
  const [filter, setFilter] = useState('all')

  async function load(){
    setLoadingPosts(true)
    try{
      let url = `/api/items?ts=${Date.now()}`
      const res = await fetch(url)
      const data = await res.json()

      const userStr = localStorage.getItem('user')
      const localUser = userStr ? JSON.parse(userStr) : null

      let transformed = data.map(item => ({
        ...item,
        author: item.author || (localUser ? (localUser.prenom || localUser.nomUtilisateur || localUser.email.split('@')[0]) : 'Jean Dupont'),
        date: new Date(item.createdAt).toLocaleDateString('fr-FR'),
        initials: item.initials || (localUser ? ((localUser.prenom ? `${localUser.prenom[0]}${(localUser.nom||'')[0]||''}` : (localUser.nomUtilisateur ? localUser.nomUtilisateur.slice(0,2) : 'JD')).toUpperCase()) : 'JD'),
        color: item.color || 'linear-gradient(135deg, #0B3D91, #082B60)',
        privacy: item.privacy || 'globe',
        likes: item.likes || 0,
        shares: item.shares || 0,
        image: item.image || null,
        avatarUrl: item.avatarUrl || (localUser ? localUser.avatarUrl : null),
        avatar: item.avatar || (localUser ? localUser.avatar : null),
      }))

      setItems(transformed)
    }catch(e){console.error(e)}
    finally{ setLoadingPosts(false) }
  }

  useEffect(()=>{
    const u = localStorage.getItem('user')
    if(u) setCurrentUser(JSON.parse(u))
    load()
    function onUserUpdated(){
      const v = localStorage.getItem('user')
      setCurrentUser(v ? JSON.parse(v) : null)
    }
    window.addEventListener('userUpdated', onUserUpdated)
    return () => window.removeEventListener('userUpdated', onUserUpdated)
  },[])

  // when another component publishes, prepend it
  useEffect(() => {
    function onPostCreated(e){
      const created = e?.detail
      if(created){
        const userStr = localStorage.getItem('user')
        const localUser = userStr ? JSON.parse(userStr) : null
        const name = localUser ? (localUser.prenom || localUser.nomUtilisateur || (localUser.email||'').split('@')[0]) : 'Jean Dupont'
        const post = {
          ...created,
          author: created.author || name,
          date: created.createdAt ? new Date(created.createdAt).toLocaleDateString('fr-FR') : (created.date ? new Date(created.date).toLocaleDateString('fr-FR') : new Date().toLocaleDateString('fr-FR')),
          initials: created.initials || (localUser ? (localUser.prenom ? `${localUser.prenom[0]}${(localUser.nom||'')[0]||''}`.toUpperCase() : (localUser.nomUtilisateur ? localUser.nomUtilisateur.slice(0,2).toUpperCase() : 'JD')) : 'JD'),
          color: created.color || 'linear-gradient(135deg, #0B3D91, #082B60)',
          privacy: created.privacy || 'globe',
          likes: created.likes || 0,
          shares: created.shares || 0,
          image: created.image || null,
          avatarUrl: created.avatarUrl || (localUser ? localUser.avatarUrl : null),
          avatar: created.avatar || (localUser ? localUser.avatar : null),
        }
        setItems(prev => [post, ...prev.filter(p => !String(p.id).startsWith('temp-'))])
      }
    }
    function onReloadFeed(){
      load()
    }
    window.addEventListener('postCreated', onPostCreated)
    window.addEventListener('reloadFeed', onReloadFeed)
    return () => {
      window.removeEventListener('postCreated', onPostCreated)
      window.removeEventListener('reloadFeed', onReloadFeed)
    }
  }, [])

  // Optimized image compression function
  async function compressImage(file, maxWidth = 1200, maxHeight = 1200, quality = 0.75) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (event) => {
        const img = new Image()
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas')
            let width = img.width
            let height = img.height

            if (width > height) {
              if (width > maxWidth) {
                height *= maxWidth / width
                width = maxWidth
              }
            } else {
              if (height > maxHeight) {
                width *= maxHeight / height
                height = maxHeight
              }
            }

            canvas.width = width
            canvas.height = height
            const ctx = canvas.getContext('2d')
            if (!ctx) {
              reject(new Error('Failed to get canvas context'))
              return
            }
            ctx.drawImage(img, 0, 0, width, height)

            const compressed = canvas.toDataURL(file.type || 'image/jpeg', quality)
            resolve(compressed)
          } catch (error) {
            console.error('Canvas compression error:', error)
            reject(error)
          }
        }
        img.onerror = () => {
          console.error('Image load error')
          reject(new Error('Failed to load image'))
        }
        img.src = event.target.result
      }
      reader.onerror = () => {
        console.error('File read error')
        reject(new Error('Failed to read file'))
      }
      reader.readAsDataURL(file)
    })
  }

  async function handleCreate(title, content){
    if(!content?.trim() && !selectedImage){
      alert('Veuillez ajouter du contenu ou une image');
      return;
    }
    
    setIsUploading(true)
    setUploadProgress(0)
    
    try {
      const computedTitle = (title || content || (selectedImage ? 'Image' : '')).trim();
      setUploadProgress(10)

      const userStr = localStorage.getItem('user')
      const localUser = userStr ? JSON.parse(userStr) : null
      const authorName = localUser ? (localUser.prenom || localUser.nomUtilisateur || (localUser.email||'').split('@')[0]) : 'Jean Dupont'

      const payload = { 
        title: computedTitle, 
        content: content.trim(), 
        image: selectedImage || null,
        author: authorName,
      }
      setUploadProgress(30)

      const res = await fetch('/api/items', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(payload)
      });
      
      setUploadProgress(70)

      if(!res.ok) {
        const text = await res.text();
        console.error('create post failed body', text);
        const name = localUser ? (localUser.prenom || localUser.nomUtilisateur || (localUser.email||'').split('@')[0]) : 'Jean Dupont'
        const initials = localUser ? (localUser.prenom ? `${localUser.prenom[0]}${(localUser.nom||'')[0]||''}`.toUpperCase() : (localUser.nomUtilisateur ? localUser.nomUtilisateur.slice(0,2).toUpperCase() : 'JD')) : 'JD'
        const tempPost = {
          id: `temp-${Date.now()}`,
          title: computedTitle,
          content: content.trim(),
          author: name,
          initials,
          color: 'linear-gradient(135deg, #0B3D91, #082B60)',
          date: new Date().toLocaleDateString('fr-FR'),
          image: selectedImage || null,
          avatarUrl: localUser?.avatarUrl,
          avatar: localUser?.avatar,
          likes: 0,
          shares: 0,
        }
        setItems(prev => {
          const withoutDup = (prev || []).filter(p => p.id !== tempPost.id)
          return [tempPost, ...withoutDup]
        })
        setUploadProgress(100)
        setTimeout(() => { setIsUploading(false); setUploadProgress(0); }, 500)
        closeModal()
        return
      }
      
      const created = await res.json()
      setUploadProgress(90)
      
      const name = localUser ? (localUser.prenom || localUser.nomUtilisateur || (localUser.email||'').split('@')[0]) : 'Jean Dupont'
      const initials = localUser ? (localUser.prenom ? `${localUser.prenom[0]}${(localUser.nom||'')[0]||''}`.toUpperCase() : (localUser.nomUtilisateur ? localUser.nomUtilisateur.slice(0,2).toUpperCase() : 'JD')) : 'JD'
      const localPost = {
        ...created,
        author: name,
        initials,
        color: 'linear-gradient(135deg, #0B3D91, #082B60)',
        date: new Date().toLocaleDateString('fr-FR'),
        image: selectedImage || null,
        avatarUrl: localUser?.avatarUrl,
        avatar: localUser?.avatar,
        likes: 0,
        shares: 0,
      }
      setItems(prev => {
        const withoutTemps = (prev || []).filter(p => !String(p.id).startsWith('temp-'))
        return [localPost, ...withoutTemps]
      })
      
      setUploadProgress(100)
      setTimeout(() => { 
        setIsUploading(false)
        setUploadProgress(0)
        closeModal()
      }, 500)
    } catch(e) {
      console.error('Erreur lors de la création du post:', e);
      alert('Erreur lors de la création du post');
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  async function handleDelete(id){
    try {
      const res = await fetch(`/api/items/${id}`, {method: 'DELETE'});
      if(!res.ok) throw new Error(`HTTP ${res.status}`);
      await load()
    } catch(e) {
      console.error('Erreur lors de la suppression:', e);
    }
  }

  function handlePhotoClick() {
    fileInputRef.current?.click();
  }

  function handleFileSelect(e) {
    const files = Array.from(e.target.files || []);
    if(files.length === 0) return;
    setSelectedFilesCount(files.length);
    const first = files[0];
    if(first) {
      setOriginalFile(first)
      const reader = new FileReader();
      reader.onload = async (event) => {
        setSelectedImage(event.target?.result);
        
        try {
          const compressed = await compressImage(first, 1200, 1200, 0.75)
          setSelectedImage(compressed)
        } catch (err) {
          console.error('Image compression error:', err)
        }
      };
      reader.readAsDataURL(first);
    }
  }

  function insertEmoji(emoji) {
    setPostContent(prev => prev + emoji);
  }

  function insertTag() {
    setPostContent(prev => prev + ' @Ami ');
  }

  function addTagFromModal() {
    if (tagInput.trim()) {
      setPostContent(prev => prev + ` @${tagInput} `);
      setTagInput('');
      setShowTagModal(false);
    }
  }

  function addFeelingFromModal() {
    if (feelingSelected) {
      setPostContent(prev => prev + ` ${feelingSelected.emoji} ${feelingSelected.label} `);
      setFeelingSelected(null);
      setShowFeelingModal(false);
    }
  }

  function addLocationFromModal() {
    if (locationInput.trim()) {
      setPostContent(prev => prev + ` 📍 ${locationInput} `);
      setLocationInput('');
      setShowLocationModal(false);
    }
  }

  const feelings = [
    { emoji: '😊', label: 'Joyeux' },
    { emoji: '😔', label: 'Triste' },
    { emoji: '😍', label: 'Amoureux' },
    { emoji: '😡', label: 'En colère' },
    { emoji: '😴', label: 'Fatigué' },
    { emoji: '🤔', label: 'Pensif' },
    { emoji: '🎉', label: 'Célébrant' },
    { emoji: '😎', label: 'Confiant' },
    { emoji: '😅', label: 'Rigolo' },
    { emoji: '😢', label: 'Ému' }
  ];

  function insertLocation() {
    setPostContent(prev => prev + ' 📍 Localisation ');
  }

  function closeModal() {
    setPostTitle('');
    setPostContent('');
    setSelectedImage(null);
    setSelectedFilesCount(0);
    setOriginalFile(null);
    setUploadProgress(0);
  }

  async function handleCreateTextPublication() {
    if (!textPubContent.trim()) {
      alert('Veuillez ajouter du texte');
      return;
    }

    try {
      const userStr = localStorage.getItem('user');
      const localUser = userStr ? JSON.parse(userStr) : null;
      const authorName = localUser ? (localUser.prenom || localUser.nomUtilisateur || (localUser.email||'').split('@')[0]) : 'Jean Dupont'

      const computedTitle = (textPubContent || '').trim().split('\n')[0].slice(0, 60) || 'Publication';

      const payload = {
        title: computedTitle,
        content: textPubContent,
        backgroundColor: textPubBgColor,
        textColor: textPubTextColor,
        privacy: 'public',
        author: authorName,
      };

      const res = await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const newPost = await res.json();
        newPost.backgroundColor = newPost.backgroundColor || textPubBgColor;
        newPost.textColor = newPost.textColor || textPubTextColor;
        setItems(prev => [newPost, ...prev]);
        setTextPubContent('');
        setTextPubBgColor('#667eea');
        setTextPubTextColor('#ffffff');
        setShowTextPublicationModal(false);
      } else {
        alert('Erreur lors de la création');
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la création');
    }
  }

  function resetTextPublicationModal() {
    setShowTextPublicationModal(false);
    setTextPubContent('');
    setTextPubBgColor('#667eea');
    setTextPubTextColor('#ffffff');
  }

  const categories = ['all', 'tech', 'business', 'design', 'web']
  const filtered = filter === 'all' ? items : items.filter(item => item.category === filter)

  return (
    <div style={{maxWidth:680,margin:'0 auto',padding:'16px'}}>
      {/* Stories Section */}
      <div style={{marginBottom:16}}>
        <Stories />
      </div>

      {/* Create Post Section */}
      <div className="card" style={{marginBottom:16}}>
        <div style={{padding:12}}>
          <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:12}}>
            <ClickableAvatar 
              initials={currentUser ? (currentUser.prenom ? `${currentUser.prenom[0]}${(currentUser.nom||'')[0]||''}`.toUpperCase() : (currentUser.nomUtilisateur ? currentUser.nomUtilisateur.slice(0,2).toUpperCase() : 'JD')) : 'JD'}
              color="linear-gradient(135deg, #0B3D91, #082B60)"
              size={40}
              avatarUrl={currentUser?.avatarUrl}
              avatar={currentUser?.avatar}
              userName={currentUser ? (currentUser.prenom || currentUser.nomUtilisateur || currentUser.email?.split('@')[0]) : 'Utilisateur'}
            />
            <button 
              onClick={() => setShowTextPublicationModal(true)}
              style={{
                flex:1,
                padding:'10px 16px',
                borderRadius:20,
                border:'none',
                background:'var(--fb-bg)',
                color:'var(--fb-text-secondary)',
                textAlign:'left',
                cursor:'pointer',
                fontSize:15
              }}
            >
              Quoi de neuf ?
            </button>
          </div>
          <div style={{display:'flex',borderTop:'1px solid var(--fb-border)',paddingTop:12}}>
            <button 
              onClick={() => setShowTextPublicationModal(true)}
              style={{
                flex:1,
                display:'flex',
                alignItems:'center',
                justifyContent:'center',
                gap:8,
                padding:'8px',
                border:'none',
                background:'transparent',
                cursor:'pointer',
                borderRadius:8,
                color:'var(--fb-text-secondary)',
                fontWeight:600,
                fontSize:14
              }}
              className="create-post-btn"
            >
              <span style={{fontSize:20}}>📹</span> Vidéo en direct
            </button>
            <button 
              onClick={handlePhotoClick}
              style={{
                flex:1,
                display:'flex',
                alignItems:'center',
                justifyContent:'center',
                gap:8,
                padding:'8px',
                border:'none',
                background:'transparent',
                cursor:'pointer',
                borderRadius:8,
                color:'var(--fb-text-secondary)',
                fontWeight:600,
                fontSize:14
              }}
              className="create-post-btn"
            >
              <span style={{fontSize:20}}>🖼️</span> Photo/vidéo
            </button>
            <button 
              onClick={() => setShowFeelingModal(true)}
              style={{
                flex:1,
                display:'flex',
                alignItems:'center',
                justifyContent:'center',
                gap:8,
                padding:'8px',
                border:'none',
                background:'transparent',
                cursor:'pointer',
                borderRadius:8,
                color:'var(--fb-text-secondary)',
                fontWeight:600,
                fontSize:14
              }}
              className="create-post-btn"
            >
              <span style={{fontSize:20}}>😊</span> Humeur
            </button>
          </div>
        </div>
      </div>

      {/* Category Filters */}
      <div className="card" style={{marginBottom:16}}>
        <div style={{padding:12,borderBottom:'1px solid var(--fb-border)'}}>
          <h3 style={{marginBottom:12,fontSize:16,fontWeight:600}}>Actualités</h3>
          <div style={{display:'flex',gap:8,overflowX:'auto',paddingBottom:8}}>
            {categories.map(cat => (
              <button 
                key={cat}
                onClick={() => setFilter(cat)}
                style={{
                  padding:'8px 16px',
                  background:filter===cat?'var(--fb-blue)':'var(--fb-bg)',
                  color:filter===cat?'white':'var(--fb-text)',
                  border:'none',
                  borderRadius:20,
                  cursor:'pointer',
                  fontWeight:600,
                  fontSize:13,
                  whiteSpace:'nowrap',
                  flex:'0 0 auto'
                }}
              >
                {cat === 'all' ? 'Toutes' : cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Posts Feed */}
      <div>
        {loadingPosts ? (
          <>
            <PostSkeleton />
            <PostSkeleton />
            <PostSkeleton />
          </>
        ) : filtered.length === 0 ? (
          <div className="card" style={{padding:40,textAlign:'center'}}>
            <div style={{fontSize:48,marginBottom:16}}>📰</div>
            <h3 style={{marginBottom:8,color:'var(--fb-text)'}}>Aucune actualité</h3>
            <p style={{color:'var(--fb-text-secondary)',fontSize:14}}>
              Soyez le premier à publier quelque chose !
            </p>
          </div>
        ) : (
          filtered.map(post => (
            <PostCard 
              key={post.id} 
              post={post} 
              onDelete={handleDelete}
              currentUser={currentUser}
            />
          ))
        )}
      </div>

      {/* Hidden file input */}
      <input 
        ref={fileInputRef}
        type="file" 
        accept="image/*" 
        multiple 
        style={{display:'none'}} 
        onChange={handleFileSelect}
      />

      {/* Text Publication Modal */}
      {showTextPublicationModal && (
        <Modal onClose={resetTextPublicationModal}>
          <div style={{padding:20,width:'100%',maxWidth:500}}>
            <h3 style={{marginBottom:16,textAlign:'center'}}>Créer une publication</h3>
            
            <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:16}}>
              <ClickableAvatar 
                initials={currentUser ? (currentUser.prenom ? `${currentUser.prenom[0]}${(currentUser.nom||'')[0]||''}`.toUpperCase() : (currentUser.nomUtilisateur ? currentUser.nomUtilisateur.slice(0,2).toUpperCase() : 'JD')) : 'JD'}
                color="linear-gradient(135deg, #0B3D91, #082B60)"
                size={40}
                avatarUrl={currentUser?.avatarUrl}
                avatar={currentUser?.avatar}
                userName={currentUser ? (currentUser.prenom || currentUser.nomUtilisateur || currentUser.email?.split('@')[0]) : 'Utilisateur'}
              />
              <div>
                <div style={{fontWeight:600,fontSize:14}}>
                  {currentUser ? (currentUser.prenom || currentUser.nomUtilisateur || currentUser.email?.split('@')[0]) : 'Utilisateur'}
                </div>
                <select 
                  style={{
                    padding:'4px 8px',
                    borderRadius:6,
                    border:'1px solid var(--fb-border)',
                    fontSize:12,
                    background:'var(--fb-bg)',
                    color:'var(--fb-text)'
                  }}
                >
                  <option>🌍 Public</option>
                  <option>👥 Amis</option>
                  <option>🔒 Privé</option>
                </select>
              </div>
            </div>

            <textarea
              value={textPubContent}
              onChange={e => setTextPubContent(e.target.value)}
              placeholder="Quoi de neuf ?"
              style={{
                width:'100%',
                minHeight:120,
                border:'none',
                outline:'none',
                resize:'none',
                fontSize:18,
                marginBottom:16,
                background:'transparent',
                color:'var(--fb-text)'
              }}
            />

            <div style={{display:'flex',gap:8,marginBottom:16}}>
              <button 
                onClick={() => setTextPubBgColor('#667eea')}
                style={{
                  width:32,
                  height:32,
                  borderRadius:'50%',
                  background:'#667eea',
                  border:textPubBgColor==='#667eea'?'3px solid var(--fb-blue)':'3px solid transparent',
                  cursor:'pointer'
                }}
              />
              <button 
                onClick={() => setTextPubBgColor('#f59e0b')}
                style={{
                  width:32,
                  height:32,
                  borderRadius:'50%',
                  background:'#f59e0b',
                  border:textPubBgColor==='#f59e0b'?'3px solid var(--fb-blue)':'3px solid transparent',
                  cursor:'pointer'
                }}
              />
              <button 
                onClick={() => setTextPubBgColor('#10b981')}
                style={{
                  width:32,
                  height:32,
                  borderRadius:'50%',
                  background:'#10b981',
                  border:textPubBgColor==='#10b981'?'3px solid var(--fb-blue)':'3px solid transparent',
                  cursor:'pointer'
                }}
              />
              <button 
                onClick={() => setTextPubBgColor('#ef4444')}
                style={{
                  width:32,
                  height:32,
                  borderRadius:'50%',
                  background:'#ef4444',
                  border:textPubBgColor==='#ef4444'?'3px solid var(--fb-blue)':'3px solid transparent',
                  cursor:'pointer'
                }}
              />
              <button 
                onClick={() => setTextPubBgColor('#8b5cf6')}
                style={{
                  width:32,
                  height:32,
                  borderRadius:'50%',
                  background:'#8b5cf6',
                  border:textPubBgColor==='#8b5cf6'?'3px solid var(--fb-blue)':'3px solid transparent',
                  cursor:'pointer'
                }}
              />
            </div>

            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:12,border:'1px solid var(--fb-border)',borderRadius:8}}>
              <span style={{fontWeight:600,fontSize:14}}>Ajouter à votre publication</span>
              <div style={{display:'flex',gap:8}}>
                <button 
                  onClick={handlePhotoClick}
                  style={{
                    width:36,
                    height:36,
                    borderRadius:'50%',
                    border:'none',
                    background:'transparent',
                    cursor:'pointer',
                    fontSize:20
                  }}
                  title="Photo/vidéo"
                >
                  🖼️
                </button>
                <button 
                  onClick={() => setShowTagModal(true)}
                  style={{
                    width:36,
                    height:36,
                    borderRadius:'50%',
                    border:'none',
                    background:'transparent',
                    cursor:'pointer',
                    fontSize:20
                  }}
                  title="Taguer des personnes"
                >
                  👤
                </button>
                <button 
                  onClick={() => setShowFeelingModal(true)}
                  style={{
                    width:36,
                    height:36,
                    borderRadius:'50%',
                    border:'none',
                    background:'transparent',
                    cursor:'pointer',
                    fontSize:20
                  }}
                  title="Humeur/activité"
                >
                  😊
                </button>
                <button 
                  onClick={() => setShowLocationModal(true)}
                  style={{
                    width:36,
                    height:36,
                    borderRadius:'50%',
                    border:'none',
                    background:'transparent',
                    cursor:'pointer',
                    fontSize:20
                  }}
                  title="S'enregistrer"
                >
                  📍
                </button>
              </div>
            </div>

            {selectedImage && (
              <div style={{marginTop:16,position:'relative'}}>
                <img 
                  src={selectedImage} 
                  alt="Preview" 
                  style={{
                    width:'100%',
                    borderRadius:8,
                    maxHeight:300,
                    objectFit:'cover'
                  }}
                />
                <button 
                  onClick={() => {setSelectedImage(null);setSelectedFilesCount(0)}}
                  style={{
                    position:'absolute',
                    top:8,
                    right:8,
                    width:32,
                    height:32,
                    borderRadius:'50%',
                    background:'rgba(0,0,0,0.6)',
                    color:'white',
                    border:'none',
                    cursor:'pointer',
                    fontSize:16
                  }}
                >
                  ✕
                </button>
              </div>
            )}

            <button 
              onClick={handleCreateTextPublication}
              disabled={!textPubContent.trim() && !selectedImage}
              style={{
                width:'100%',
                padding:12,
                marginTop:16,
                borderRadius:8,
                border:'none',
                background:(textPubContent.trim() || selectedImage)?'var(--fb-blue)':'var(--fb-bg)',
                color:(textPubContent.trim() || selectedImage)?'white':'var(--fb-text-secondary)',
                fontWeight:600,
                fontSize:15,
                cursor:(textPubContent.trim() || selectedImage)?'pointer':'not-allowed'
              }}
            >
              Publier
            </button>
          </div>
        </Modal>
      )}

      {/* Tag Modal */}
      {showTagModal && (
        <Modal onClose={() => setShowTagModal(false)}>
          <div style={{padding:20,width:'100%',maxWidth:400}}>
            <h3 style={{marginBottom:16}}>Taguer des personnes</h3>
            <input
              type="text"
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              placeholder="Nom de la personne"
              style={{
                width:'100%',
                padding:12,
                borderRadius:8,
                border:'1px solid var(--fb-border)',
                marginBottom:16,
                fontSize:14
              }}
            />
            <button 
              onClick={addTagFromModal}
              style={{
                width:'100%',
                padding:12,
                borderRadius:8,
                border:'none',
                background:'var(--fb-blue)',
                color:'white',
                fontWeight:600,
                cursor:'pointer'
              }}
            >
              Ajouter
            </button>
          </div>
        </Modal>
      )}

      {/* Feeling Modal */}
      {showFeelingModal && (
        <Modal onClose={() => setShowFeelingModal(false)}>
          <div style={{padding:20,width:'100%',maxWidth:400}}>
            <h3 style={{marginBottom:16}}>Comment vous sentez-vous ?</h3>
            <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:8}}>
              {feelings.map(feeling => (
                <button
                  key={feeling.label}
                  onClick={() => setFeelingSelected(feeling)}
                  style={{
                    padding:12,
                    borderRadius:8,
                    border:feelingSelected?.label===feeling.label?'2px solid var(--fb-blue)':'1px solid var(--fb-border)',
                    background:feelingSelected?.label===feeling.label?'rgba(24,119,242,0.1)':'transparent',
                    cursor:'pointer',
                    textAlign:'center'
                  }}
                >
                  <div style={{fontSize:24,marginBottom:4}}>{feeling.emoji}</div>
                  <div style={{fontSize:11}}>{feeling.label}</div>
                </button>
              ))}
            </div>
            <button 
              onClick={addFeelingFromModal}
              disabled={!feelingSelected}
              style={{
                width:'100%',
                padding:12,
                marginTop:16,
                borderRadius:8,
                border:'none',
                background:feelingSelected?'var(--fb-blue)':'var(--fb-bg)',
                color:feelingSelected?'white':'var(--fb-text-secondary)',
                fontWeight:600,
                cursor:feelingSelected?'pointer':'not-allowed'
              }}
            >
              Ajouter
            </button>
          </div>
        </Modal>
      )}

      {/* Location Modal */}
      {showLocationModal && (
        <Modal onClose={() => setShowLocationModal(false)}>
          <div style={{padding:20,width:'100%',maxWidth:400}}>
            <h3 style={{marginBottom:16}}>Où êtes-vous ?</h3>
            <input
              type="text"
              value={locationInput}
              onChange={e => setLocationInput(e.target.value)}
              placeholder="Lieu"
              style={{
                width:'100%',
                padding:12,
                borderRadius:8,
                border:'1px solid var(--fb-border)',
                marginBottom:16,
                fontSize:14
              }}
            />
            <button 
              onClick={addLocationFromModal}
              style={{
                width:'100%',
                padding:12,
                borderRadius:8,
                border:'none',
                background:'var(--fb-blue)',
                color:'white',
                fontWeight:600,
                cursor:'pointer'
              }}
            >
              Ajouter
            </button>
          </div>
        </Modal>
      )}

      {/* Upload Progress Overlay */}
      {isUploading && (
        <div style={{
          position:'fixed',
          top:0,
          left:0,
          right:0,
          bottom:0,
          background:'rgba(0,0,0,0.5)',
          display:'flex',
          alignItems:'center',
          justifyContent:'center',
          zIndex:9999
        }}>
          <div className="card" style={{padding:24,textAlign:'center',minWidth:300}}>
            <div style={{marginBottom:16}}>
              <div style={{
                width:48,
                height:48,
                border:'4px solid var(--fb-border)',
                borderTop:'4px solid var(--fb-blue)',
                borderRadius:'50%',
                animation:'spin 1s linear infinite',
                margin:'0 auto'
              }}/>
            </div>
            <p style={{marginBottom:8}}>Publication en cours...</p>
            <div style={{
              width:'100%',
              height:8,
              background:'var(--fb-border)',
              borderRadius:4,
              overflow:'hidden'
            }}>
              <div style={{
                width:`${uploadProgress}%`,
                height:'100%',
                background:'var(--fb-blue)',
                transition:'width 0.3s'
              }}/>
            </div>
            <p style={{marginTop:8,fontSize:12,color:'var(--fb-text-secondary)'}}>{uploadProgress}%</p>
          </div>
        </div>
      )}

      <style jsx>{`
        .create-post-btn:hover {
          background: var(--fb-bg);
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
