import { useEffect, useState, useRef } from 'react'
import CreatePost from './CreatePost'
import CreatePostModal from './CreatePostModal'
import PostCard from './PostCard'
import PagePostCard from './PagePostCard'
import Stories from './Stories'
import Modal from './Modal'
import { PostSkeleton } from './Skeleton'
import ClickableAvatar from './ClickableAvatar'
import { Live } from './Live'

export default function Feed({ sponsorId = null, sponsorTitle = null, isOwner = true }){
  const [items,setItems] = useState([])
  const [loadingPosts, setLoadingPosts] = useState(false)
  // state for inline modal removed - using global events instead
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

  const [originalFile, setOriginalFile] = useState(null)
  const [showLiveVideoModal, setShowLiveVideoModal] = useState(false)

  async function load(){
    setLoadingPosts(true)
    try{
      // bypass any cache by including a timestamp
      let url = `/api/items?ts=${Date.now()}`
      if (sponsorId) url += `&sponsorId=${sponsorId}`
      // load regular posts (possibly filtered for sponsor)
      const res = await fetch(url)
      const data = await res.json()

      const userStr = localStorage.getItem('user')
      const localUser = userStr ? JSON.parse(userStr) : null

      let transformed = data.map(item => ({
        ...item,
        author: item.author,
        date: new Date(item.createdAt).toLocaleDateString('fr-FR'),
        initials: item.initials,
        color: item.color || 'linear-gradient(135deg, #0B3D91, #082B60)',
        privacy: item.privacy || 'globe',
        likes: item.likes || 0,
        shares: item.shares || 0,
        image: item.image || null,
        video: item.video || null,
        avatarUrl: item.avatarUrl,
        avatar: item.avatar,
        isSponsor: !!item.sponsorId,
        sponsorId: item.sponsorId || null
      }))

      // Also fetch group posts if not on a sponsor-specific feed
      let groupPosts = []
      if (!sponsorId) {
        try {
          const groupRes = await fetch(`/api/groupes?ts=${Date.now()}`)
          const groupData = await groupRes.json()
          const groups = Array.isArray(groupData.groups) ? groupData.groups : []
          
          // Fetch posts from each group
          for (const group of groups) {
            try {
              const postsRes = await fetch(`/api/groupes/${group.id}/posts?ts=${Date.now()}`)
              const postsData = await postsRes.json()
              if (postsData.posts && Array.isArray(postsData.posts)) {
                const groupPostsWithMeta = postsData.posts.map(post => ({
                  ...post,
                  author: post.author?.prenom || post.author?.nomUtilisateur || post.author?.email?.split('@')[0] || 'Utilisateur',
                  date: new Date(post.createdAt).toLocaleDateString('fr-FR'),
                  initials: post.author?.prenom ? `${post.author.prenom[0]}${(post.author.nom||'')[0]||''}`.toUpperCase() : (post.author?.nomUtilisateur ? post.author.nomUtilisateur.slice(0,2).toUpperCase() : 'U'),
                  color: 'linear-gradient(135deg, #0B3D91, #082B60)',
                  privacy: 'globe',
                  likes: post.likes || 0,
                  shares: post.shares || 0,
                  image: post.image || null,
                  avatarUrl: post.author?.avatarUrl || null,
                  avatar: post.author?.avatar || null,
                  isGroupPost: true,
                  groupId: group.id,
                  groupName: group.name
                }))
                groupPosts = [...groupPosts, ...groupPostsWithMeta]
              }
            } catch (e) {
              console.warn(`Failed to fetch posts for group ${group.id}`, e)
            }
          }
        } catch (e) {
          console.warn('Failed to fetch groups', e)
        }
      }

      // if we are not on a sponsor-specific feed, also inject sponsor posts
      if (!sponsorId) {
        // also fetch active sponsors to inject into feed
        const sponsorRes = await fetch('/api/sponsors')
        const sponsorData = await sponsorRes.json()
        let sponsors = Array.isArray(sponsorData.sponsors) ? sponsorData.sponsors : []

        // Filter sponsors based on quotas and targeting
        sponsors = await Promise.all(sponsors.filter(async (sp) => {
          // Check quotas
          try {
            const quotaRes = await fetch(`/api/sponsors/${sp.id}/quotas`)
            const quota = await quotaRes.json()
            if (!quota.active || quota.quotaExceeded) return false
          } catch (e) {
            console.warn(`quota check failed for sponsor ${sp.id}`, e)
          }

          // Check targeting
          try {
            if (!localUser) return true // show all sponsors to non-logged users
            const targetRes = await fetch(`/api/sponsors/${sp.id}/targeting`)
            const targeting = await targetRes.json()
            // Age check
            if (targeting.minAge && localUser.age < targeting.minAge) return false
            if (targeting.maxAge && localUser.age > targeting.maxAge) return false
            // Gender check
            if (targeting.gender && localUser.gender && localUser.gender !== targeting.gender) return false
            // Country check
            if (targeting.countries?.length > 0 && localUser.country && !targeting.countries.includes(localUser.country)) return false
            // City check
            if (targeting.cities?.length > 0 && localUser.city && !targeting.cities.includes(localUser.city)) return false
            // Device check
            const userDevice = /mobile/i.test(navigator.userAgent) ? 'mobile' : /tablet/i.test(navigator.userAgent) ? 'tablet' : 'desktop'
            if (targeting.devices?.length > 0 && !targeting.devices.includes(userDevice)) return false
            return true
          } catch (e) {
            console.warn(`targeting check failed for sponsor ${sp.id}`, e)
            return true
          }
        }))

        // build sponsor posts with proper author profile
        const sponsorPosts = sponsors.map(sp => {
          // Extract author initials from sponsor title
          const authorName = sp.author || sp.title || 'Sponsor'
          const initials = authorName
            .split(' ')
            .map(w => w[0])
            .join('')
            .toUpperCase()
            .slice(0, 2) || 'SP'

          return {
            id: `sponsor-${sp.id}`,
            title: sp.title,
            content: sp.description || sp.content || '',
            author: authorName,
            date: new Date(sp.createdAt).toLocaleDateString('fr-FR'),
            initials: initials,
            color: sp.color || 'linear-gradient(135deg,#ff9a9e,#fad0c4)',
            privacy: 'globe',
            likes: sp.likes || 0,
            shares: sp.shares || 0,
            image: sp.image || null,
            avatarUrl: sp.avatarUrl || null,
            avatar: sp.avatar || null,
            isSponsor: true,
            sponsorLink: sp.link || null,
            sponsorId: sp.id
          }
        })

        setItems(prev => {
          const temps = (prev || []).filter(p => String(p.id).startsWith('temp-'))
          // prepend sponsor posts and group posts before normal items
          return [...temps, ...sponsorPosts, ...groupPosts, ...transformed]
        })
      } else {
        // sponsor-specific feed just show fetched data
        setItems(transformed)
      }
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
          image: created.image || (created.images && created.images.length > 0 ? created.images[0] : null),
          images: created.images || null,
          video: created.video || null,
          avatarUrl: created.avatarUrl || (localUser ? localUser.avatarUrl : null),
          avatar: created.avatar || (localUser ? localUser.avatar : null),
        }
        setItems(prev => [post, ...prev.filter(p => !String(p.id).startsWith('temp-'))])
      }
    }
    function onReloadFeed(){
      load() // Force reload all data from API
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
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (event) => {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          let width = img.width
          let height = img.height

          // Calculate new dimensions maintaining aspect ratio
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
          ctx.drawImage(img, 0, 0, width, height)

          // Convert to compressed data URL
          const compressed = canvas.toDataURL(file.type || 'image/jpeg', quality)
          resolve(compressed)
        }
        img.src = event.target.result
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

      // Get current user info
      const userStr = localStorage.getItem('user')
      const localUser = userStr ? JSON.parse(userStr) : null
      const authorName = localUser ? (localUser.prenom || localUser.nomUtilisateur || (localUser.email||'').split('@')[0]) : 'Jean Dupont'

      const payload = { 
        title: computedTitle, 
        content: content.trim(), 
        image: selectedImage || null,
        author: authorName,
        sponsorId: sponsorId || null
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
        // Fallback: still show the post locally with a temporary id so image appears
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
          sponsorId: sponsorId || null,
          isSponsor: !!sponsorId
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
      
      // prepend a local post that includes the selected image and current user info
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
        sponsorId: sponsorId || null,
        isSponsor: !!sponsorId
      }
      setItems(prev => {
        // remove any temp posts (they were placeholders)
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
      // Show a preview while we compress
      const reader = new FileReader();
      reader.onload = async (event) => {
        // Show quick preview
        setSelectedImage(event.target?.result);
        
        // Start compression in the background
        try {
          const compressed = await compressImage(first, 1200, 1200, 0.75)
          setSelectedImage(compressed)
        } catch (err) {
          console.error('Image compression error:', err)
          // Fallback to original if compression fails
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
    // previously closed inline modal; nothing to do now
    setPostTitle('');
    setPostContent('');
    setSelectedImage(null);
    setSelectedFilesCount(0);
    setOriginalFile(null);
    setUploadProgress(0);
  }




  return (
    <div>
      {!sponsorId && <Stories />}
      {(!sponsorId || isOwner) && (
        <>
          <CreatePost onOpen={() => { try{ window.dispatchEvent(new CustomEvent('openCreatePost')) }catch(e){} }} user={currentUser} onOpenTextPublication={() => { try{ window.dispatchEvent(new CustomEvent('openTextPublication')) }catch(e){} }} onOpenLiveVideo={() => setShowLiveVideoModal(true)} sponsorTitle={sponsorTitle} />
          <CreatePostModal currentUser={currentUser} sponsorId={sponsorId} sponsorTitle={sponsorTitle} />
        </>
      )}
      <div style={{marginTop:12}}>
        {loadingPosts ? (
          Array.from({length:3}).map((_,i)=> <PostSkeleton key={i} />)
        ) : items.length === 0 ? (
          <div style={{padding:32, textAlign:'center', color:'var(--fb-text-secondary)', fontSize:18}}>
            Aucune publication trouvée
          </div>
        ) : (
          items.map(it=> it.sponsorId ? 
            <PagePostCard key={it.id} post={it} onDelete={handleDelete} currentUser={currentUser} page={{id: it.sponsorId, name: it.author, profileImage: it.avatarUrl}} /> : 
            <PostCard key={it.id} post={it} onDelete={handleDelete} currentUser={currentUser} />
          )
        )}
      </div>

      {/* Tag Modal */}
      <Modal open={showTagModal} onClose={() => { setShowTagModal(false); setTagInput(''); }} title="Ajouter un tag">
        <div style={{display:'flex', flexDirection:'column', gap:'12px'}}>
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            placeholder="Entrez le nom de la personneà tagger"
            onKeyPress={(e) => e.key === 'Enter' && addTagFromModal()}
            style={{
              width:'100%',
              padding:'10px 12px',
              border:'1px solid var(--fb-border)',
              borderRadius:'6px',
              fontSize:'14px',
              boxSizing:'border-box'
            }}
            autoFocus
          />
          <div style={{display:'flex', gap:'8px', justifyContent:'flex-end'}}>
            <button
              onClick={() => { setShowTagModal(false); setTagInput(''); }}
              style={{
                padding:'8px 16px',
                border:'1px solid var(--fb-border)',
                borderRadius:'6px',
                background:'transparent',
                cursor:'pointer',
                fontSize:'13px',
                fontWeight:'500'
              }}
            >
              Annuler
            </button>
            <button
              onClick={addTagFromModal}
              disabled={!tagInput.trim()}
              style={{
                padding:'8px 16px',
                border:'none',
                borderRadius:'6px',
                background:'var(--fb-blue)',
                color:'white',
                cursor:tagInput.trim()?'pointer':'not-allowed',
                fontSize:'13px',
                fontWeight:'600',
                opacity:tagInput.trim()?1:0.6
              }}
            >
              Ajouter
            </button>
          </div>
        </div>
      </Modal>

      {/* Feeling Modal */}
      <Modal open={showFeelingModal} onClose={() => setShowFeelingModal(false)} title="Sélectionnez votre émotion">
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(80px, 1fr))', gap:'12px'}}>
          {feelings.map((feeling) => (
            <div
              key={feeling.label}
              onClick={() => setFeelingSelected(feeling)}
              style={{
                padding:'12px',
                border:feelingSelected?.label === feeling.label ? '3px solid var(--fb-blue)' : '1px solid var(--fb-border)',
                borderRadius:'8px',
                textAlign:'center',
                cursor:'pointer',
                transition:'all 0.15s',
                background:feelingSelected?.label === feeling.label ? 'rgba(102, 126, 234, 0.1)' : 'transparent'
              }}
            >
              <div style={{fontSize:'32px', marginBottom:'4px'}}>{feeling.emoji}</div>
              <div style={{fontSize:'12px', fontWeight:'500', color:'var(--fb-text)'}}>{feeling.label}</div>
            </div>
          ))}
        </div>
        <div style={{display:'flex', gap:'8px', justifyContent:'flex-end', marginTop:'16px'}}>
          <button
            onClick={() => setShowFeelingModal(false)}
            style={{
              padding:'8px 16px',
              border:'1px solid var(--fb-border)',
              borderRadius:'6px',
              background:'transparent',
              cursor:'pointer',
              fontSize:'13px',
              fontWeight:'500'
            }}
          >
            Annuler
          </button>
          <button
            onClick={addFeelingFromModal}
            disabled={!feelingSelected}
            style={{
              padding:'8px 16px',
              border:'none',
              borderRadius:'6px',
              background:'var(--fb-blue)',
              color:'white',
              cursor:feelingSelected?'pointer':'not-allowed',
              fontSize:'13px',
              fontWeight:'600',
              opacity:feelingSelected?1:0.6
            }}
          >
            Ajouter
          </button>
        </div>
      </Modal>

      {/* Location Modal */}
      <Modal open={showLocationModal} onClose={() => { setShowLocationModal(false); setLocationInput(''); }} title="Ajouter une localisation">
        <div style={{display:'flex', flexDirection:'column', gap:'12px'}}>
          <input
            type="text"
            value={locationInput}
            onChange={(e) => setLocationInput(e.target.value)}
            placeholder="Entrez votre localisation"
            onKeyPress={(e) => e.key === 'Enter' && addLocationFromModal()}
            style={{
              width:'100%',
              padding:'10px 12px',
              border:'1px solid var(--fb-border)',
              borderRadius:'6px',
              fontSize:'14px',
              boxSizing:'border-box'
            }}
            autoFocus
          />
          <div style={{display:'flex', gap:'8px', justifyContent:'flex-end'}}>
            <button
              onClick={() => { setShowLocationModal(false); setLocationInput(''); }}
              style={{
                padding:'8px 16px',
                border:'1px solid var(--fb-border)',
                borderRadius:'6px',
                background:'transparent',
                cursor:'pointer',
                fontSize:'13px',
                fontWeight:'500'
              }}
            >
              Annuler
            </button>
            <button
              onClick={addLocationFromModal}
              disabled={!locationInput.trim()}
              style={{
                padding:'8px 16px',
                border:'none',
                borderRadius:'6px',
                background:'var(--fb-blue)',
                color:'white',
                cursor:locationInput.trim()?'pointer':'not-allowed',
                fontSize:'13px',
                fontWeight:'600',
                opacity:locationInput.trim()?1:0.6
              }}
            >
              Ajouter
            </button>
          </div>
        </div>
      </Modal>



      {/* Live Video Modal */}
      <Modal open={showLiveVideoModal} onClose={() => setShowLiveVideoModal(false)} title="Vidéo en direct">
        <div style={{width: '100%', height: '80vh', minHeight: '600px'}}>
          <Live 
            liveId="demo-live" 
            userInfo={{ name: currentUser?.prenom || 'Utilisateur', avatar: currentUser?.avatar }}
          />
        </div>
      </Modal>

    </div>
  )
}
