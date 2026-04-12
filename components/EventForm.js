import { useState, useRef, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCalendarPlus } from '@fortawesome/free-solid-svg-icons'

export default function EventForm({ onCreate, onCancel }){
  const [title, setTitle] = useState('')
  const [date, setDate] = useState('')
  const [location, setLocation] = useState('')
  const [description, setDescription] = useState('')
  const [image, setImage] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const titleRef = useRef(null)

  useEffect(()=>{
    // focus the title input when the form mounts (helps keyboard users)
    try{ titleRef.current && titleRef.current.focus() }catch(e){}
  },[])

  async function handleSubmit(e){
    e.preventDefault()
    setError(null)
    if(!title.trim()) return setError('Le titre est requis')
    if(!date) return setError('La date est requise')

    const payload = { title: title.trim(), date, location: location.trim(), description: description.trim(), image: image.trim() }
    try{
      setSubmitting(true)
      const res = await fetch('/api/evenements', { method: 'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) })
      if(!res.ok) throw new Error('Erreur serveur')
      const created = await res.json()
      if(onCreate) onCreate(created)
      // reset
      setTitle(''); setDate(''); setLocation(''); setDescription(''); setImage('')
    }catch(e){
      console.error('create event', e)
      setError('Impossible de créer l\'événement')
    }finally{ setSubmitting(false) }
  }

  function handleFileChange(e){
    const file = e.target.files && e.target.files[0]
    if(!file) return
    uploadToCloudinary(file)
  }

  function uploadToCloudinary(file){
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
    if(!cloudName || !uploadPreset){
      setError('Upload Cloudinary non configuré. Définissez NEXT_PUBLIC_CLOUDINARY_*')
      return
    }
    setError(null)
    setUploading(true)
    setUploadProgress(0)

    return new Promise((resolve, reject) => {
      const url = `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`
      const xhr = new XMLHttpRequest()
      xhr.open('POST', url)
      xhr.upload.addEventListener('progress', (ev) => {
        if(ev.lengthComputable) setUploadProgress(Math.round((ev.loaded/ev.total)*100))
      })
      xhr.onreadystatechange = () => {
        if(xhr.readyState === 4){
          setUploading(false)
          if(xhr.status >= 200 && xhr.status < 300){
            try{
              const res = JSON.parse(xhr.responseText)
              if(res.secure_url){ setImage(res.secure_url); resolve(res) }
              else { setError('Échec upload'); reject(res) }
            }catch(err){ setError('Réponse inattendue'); reject(err) }
          }else{
            setError('Erreur lors de l\'upload')
            reject(xhr.responseText)
          }
        }
      }
      const fd = new FormData()
      fd.append('file', file)
      fd.append('upload_preset', uploadPreset)
      xhr.send(fd)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="event-form" aria-label="Formulaire création événement">
      <div className="form-header">
        <div className="header-left">
          <div className="icon-wrap"><FontAwesomeIcon icon={faCalendarPlus} /></div>
          <div>
            <h3>Nouvel événement</h3>
            <div className="hint">Remplissez les informations principales et cliquez sur «Créer».</div>
          </div>
        </div>
      </div>

      {error && <div className="error">{error}</div>}

      <div className="fields">
        <label className="field" htmlFor="ev-title">
          <span className="label-title">Intitulé</span>
          <input id="ev-title" ref={el=> titleRef.current = el} aria-required="true" value={title} onChange={e=>setTitle(e.target.value)} placeholder="Titre de l'événement" />
        </label>

        <label className="field" htmlFor="ev-date">
          <span className="label-title">Date et heure</span>
          <input id="ev-date" aria-required="true" type="datetime-local" value={date} onChange={e=>setDate(e.target.value)} />
        </label>

        <label className="field" htmlFor="ev-location">
          <span className="label-title">Lieu</span>
          <input id="ev-location" value={location} onChange={e=>setLocation(e.target.value)} placeholder="Ex: Salle des fêtes / En ligne" />
        </label>

        <label className="field full" htmlFor="ev-desc">
          <span className="label-title">Description</span>
          <textarea id="ev-desc" value={description} onChange={e=>setDescription(e.target.value)} rows={4} />
        </label>

        <div className="image-group">
          <label className="field">
              <span className="label-title">Image (URL)</span>
              <input id="ev-image-url" value={image} onChange={e=>setImage(e.target.value)} placeholder="https://..." />
            </label>

          <label className="field upload-field">
            <span className="label-title">Téléverser</span>
            <div className="drop" role="group" aria-label="Téléversement d'image">
              <input aria-label="Sélectionner une image" className="file-input" type="file" accept="image/*" onChange={handleFileChange} />
              <div className="drop-hint">Glissez une image ou cliquez pour sélectionner</div>
            </div>
            {uploading && <div className="upload-row">Téléversement: <strong>{uploadProgress}%</strong></div>}
            {image && !uploading && <div className="preview"><img src={image} alt="preview" /></div>}
          </label>
        </div>
      </div>

      <div className="form-actions">
        <button type="button" className="btn ghost" onClick={onCancel} disabled={submitting}>Annuler</button>
        <button type="submit" className="btn primary create" disabled={submitting}>{submitting ? 'Création…' : 'Créer l\'événement'}</button>
      </div>

      <style jsx>{`
        .event-form{display:flex;flex-direction:column;gap:14px;padding:6px 0}
        .form-header{display:flex;align-items:center;justify-content:space-between}
        .header-left{display:flex;gap:12px;align-items:center}
        .icon-wrap{width:56px;height:56px;border-radius:12px;background:linear-gradient(135deg,#4f46e5,#06b6d4);display:flex;align-items:center;justify-content:center;color:white;font-size:20px;box-shadow:0 8px 30px rgba(6,182,212,0.12)}
        .form-header h3{margin:0;font-size:18px}
        .hint{color:var(--fb-text-secondary);font-size:13px}
        .fields{display:grid;grid-template-columns:1fr 1fr;gap:14px}
        .image-group{display:contents}
        .field{display:flex;flex-direction:column}
        .field.full{grid-column:1 / -1}
        .label-title{font-size:13px;color:var(--fb-text-secondary);margin-bottom:8px;font-weight:600}
        input, textarea{padding:12px;border:1px solid rgba(16,24,40,0.06);border-radius:12px;font-size:14px;background:#fff;box-shadow:0 6px 18px rgba(15,23,42,0.04);transition:box-shadow .18s,transform .12s}
        input:focus, textarea:focus{outline:none;box-shadow:0 10px 30px rgba(59,130,246,0.12);transform:translateY(-2px)}
        .drop{position:relative;border:1px dashed rgba(16,24,40,0.06);padding:12px;border-radius:12px;display:flex;align-items:center;justify-content:center;background:linear-gradient(180deg, rgba(255,255,255,0.6), rgba(250,250,250,0.6))}
        .file-input{position:absolute;inset:0;opacity:0;width:100%;height:100%;cursor:pointer}
        .drop-hint{color:var(--fb-text-secondary);font-size:13px}
        .form-actions{display:flex;gap:12px;justify-content:flex-end;margin-top:6px}

        .btn{padding:10px 14px;border-radius:12px;border:1px solid transparent;cursor:pointer;font-weight:700}
        .btn.ghost{background:transparent;color:var(--fb-text-secondary);border:1px solid rgba(16,24,40,0.05)}
        .btn.primary{background:linear-gradient(90deg,#4f46e5,#06b6d4);color:#fff;box-shadow:0 12px 36px rgba(79,70,229,0.14)}
        .btn.primary.create{padding:12px 18px}
        .btn.primary:hover{transform:translateY(-2px)}

        .error{color:#7a0b0b;padding:10px;background:#fff2f2;border-radius:8px}

        .upload-row{margin-top:8px;font-size:13px;color:var(--fb-text-secondary)}
        .preview{margin-top:10px;border-radius:10px;overflow:hidden}
        .preview img{width:100%;height:160px;object-fit:cover;display:block}

        @media(max-width:720px){.fields{grid-template-columns:1fr}.form-actions{flex-direction:column-reverse}.btn{width:100%}.icon-wrap{width:48px;height:48px}}
      `}</style>
    </form>
  )
}
