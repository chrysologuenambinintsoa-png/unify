import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useRouter } from 'next/router';

// simple reusable image compressor from sponsors page
async function compressImage(file, maxWidth = 800, maxHeight = 800, quality = 0.7) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const compressed = canvas.toDataURL(file.type || 'image/jpeg', quality);
        resolve(compressed);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  });
}

export default function BecomeSponsor() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: '',
    content: '',
    link: '',
    image: '',
    avatarUrl: '',
    ownerEmail: ''
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [hasPaid, setHasPaid] = useState(false)
  const [checkingPaid, setCheckingPaid] = useState(true)

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await compressImage(file, 600, 600, 0.75);
      setForm((f) => ({ ...f, avatarUrl: url }));
    } catch (err) {
      console.error('compression error', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.ownerEmail.trim()) {
      setMessage('Le titre et l\'email du propriétaire sont requis');
      return;
    }
    setSaving(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
      const headers = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`

      const res = await fetch('/api/sponsors', {
        method: 'POST',
        headers,
        body: JSON.stringify(form)
      });
      if (res.ok) {
        const newSponsor = await res.json();
        setMessage('Page créée avec succès !');
        // Page creation without automatic redirect
      } else {
        // handle JSON or non-JSON error responses
        let errText = ''
        try {
          const err = await res.json()
          errText = err.error || JSON.stringify(err)
        } catch (ee) {
          errText = String(res.status)
        }

        if (res.status === 401) {
          setMessage('Vous devez être connecté pour créer une page sponsorisée.');
          // suggest login
        } else if (res.status === 403) {
          setMessage('Paiement requis : vous devez d\'abord payer les frais de plateforme pour créer une publicité.');
        } else {
          setMessage('Erreur : ' + errText);
        }
      }
    } catch (e) {
      console.error('submit error', e);
      setMessage('Erreur réseau');
    }
    setSaving(false);
  };

  useEffect(() => {
    // check whether current user already paid platform fee
    let mounted = true
    async function checkPaid() {
      setCheckingPaid(true)
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
        if (!token) {
          if (mounted) setHasPaid(false)
          return
        }
        // get user from token
        const meRes = await fetch('/api/me', { headers: { Authorization: `Bearer ${token}` } })
        if (!meRes.ok) {
          if (mounted) setHasPaid(false)
          return
        }
        const me = await meRes.json()
        if (!me || !me.email) {
          if (mounted) setHasPaid(false)
          return
        }
        const purchasesRes = await fetch(`/api/sponsors/purchases?userEmail=${encodeURIComponent(me.email)}`)
        if (!purchasesRes.ok) {
          if (mounted) setHasPaid(false)
          return
        }
        const { purchases } = await purchasesRes.json()
        const completed = Array.isArray(purchases) && purchases.some(p => p.status === 'completed')
        if (mounted) setHasPaid(Boolean(completed))
      } catch (e) {
        console.error('checkPaid error', e)
        if (mounted) setHasPaid(false)
      } finally {
        if (mounted) setCheckingPaid(false)
      }
    }
    checkPaid()
    return () => { mounted = false }
  }, [])

  return (
    <Layout>
      <div style={{maxWidth:600,margin:'0 auto',padding:24}}>
        <h1 style={{fontSize:28,fontWeight:800,marginBottom:16}}>Créer une page sponsorisée</h1>
        <p style={{marginBottom:24}}>Remplissez le formulaire ci-dessous pour devenir partenaire (entreprise, commerçant, etc.).</p>
        <form onSubmit={handleSubmit} style={{display:'flex',flexDirection:'column',gap:12}}>
          <label>
            Nom de la page
            <input name="title" value={form.title} onChange={handleChange} required style={{width:'100%',padding:8,border:'1px solid var(--fb-border)',borderRadius:6}} />
          </label>
          <label>
            Description
            <textarea name="content" value={form.content} onChange={handleChange} rows={3} style={{width:'100%',padding:8,border:'1px solid var(--fb-border)',borderRadius:6}} />
          </label>
          <label>
            Lien (site web)
            <input name="link" value={form.link} onChange={handleChange} style={{width:'100%',padding:8,border:'1px solid var(--fb-border)',borderRadius:6}} />
          </label>
          <label>
            Email du propriétaire
            <input name="ownerEmail" type="email" value={form.ownerEmail} onChange={handleChange} required style={{width:'100%',padding:8,border:'1px solid var(--fb-border)',borderRadius:6}} />
          </label>
          <label>
            Photo de profil
            <input type="file" accept="image/*" onChange={handleFile} />
          </label>
          {form.avatarUrl && (
            <img src={form.avatarUrl} alt="avatar" style={{width:80,height:80,borderRadius:'50%',objectFit:'cover'}} />
          )}
          <div style={{display:'flex',gap:12,alignItems:'center'}}>
            <button type="submit" disabled={saving} style={{padding:'12px 24px',background:'var(--fb-blue)',color:'white',border:'none',borderRadius:8,cursor:'pointer',fontWeight:600}}>
              {saving ? 'Enregistrement...' : 'Créer la page'}
            </button>
            {/* show pay CTA if user hasn't paid */}
            {!checkingPaid && !hasPaid && (
              <button type="button" onClick={() => router.push('/sponsor/upgrade')} style={{padding:'10px 16px',borderRadius:8,background:'#0A7E3E',color:'white',border:'none'}}>
                Payer les frais
              </button>
            )}
            {checkingPaid && (
              <div style={{color:'#666',fontSize:13}}>Vérification paiement...</div>
            )}
          </div>
        </form>
        {message && (
          <div style={{marginTop:16}}>
            <p style={{color:'#d00',marginBottom:8}}>{message}</p>
            {/* show action buttons depending on message */}
            {message.includes('connecté') && (
              <button onClick={() => router.push('/auth')} style={{padding:'8px 12px',borderRadius:8,background:'#166FE5',color:'white',border:'none'}}>Se connecter</button>
            )}
            {message.includes('Paiement requis') && (
              <button onClick={() => router.push('/sponsor/upgrade')} style={{padding:'8px 12px',borderRadius:8,background:'#0A7E3E',color:'white',border:'none'}}>Payer les frais</button>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
