import { useEffect, useState } from 'react'
import EventForm from './EventForm'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlus } from '@fortawesome/free-solid-svg-icons'

export default function EvenementList(){
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [rsvps, setRsvps] = useState({})
  const [creating, setCreating] = useState(false)

  useEffect(()=>{
    async function load(){
      try{
        const res = await fetch('/api/evenements')
        const data = await res.json()
        setEvents(Array.isArray(data) ? data : [])
      }catch(e){
        console.error('load events', e)
      }finally{ setLoading(false) }
    }
    load()
  },[])

  function toggleRsvp(id){
    setRsvps(prev => ({...prev, [id]: !prev[id]}))
  }

  function exportEvent(ev){
    const blob = new Blob([JSON.stringify(ev, null, 2)], {type:'application/json'})
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${ev.slug || ev.id || 'evenement'}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleCreated(ev){
    // add to top of list
    setEvents(prev=>[ev, ...prev])
    setCreating(false)
  }

  if(loading) return <div className="card">Chargement des événements…</div>

  return (
    <div>
      <div className="headerRow">
        <div>
          <h1>Événements</h1>
          <p className="subtitle">Tous vos événements — à venir et passés</p>
        </div>
        <div className="controls">
          <button className="btn primary create" onClick={()=>setCreating(true)} aria-label="Créer un événement">
            <FontAwesomeIcon icon={faPlus} />
            <span style={{marginLeft:8}}>Créer un événement</span>
          </button>
        </div>
      </div>

      {creating && (
        <div className="modal" role="dialog" aria-modal="true" aria-labelledby="create-event-title">
          <div className="modal-backdrop" aria-hidden="true"></div>
          <div className="modal-content" role="document">
            <button className="close" onClick={()=>setCreating(false)} aria-label="Fermer la fenêtre">×</button>
            <h2 id="create-event-title">Créer un événement</h2>
            <EventForm onCreate={handleCreated} onCancel={()=>setCreating(false)} />
          </div>
        </div>
      )}

      {events.length === 0 && (
        <div className="empty card">Aucun événement pour le moment.</div>
      )}

      <div className="grid">
        {events.map(ev => (
          <article key={ev.id} className="card event-card">
            {ev.image && <img src={ev.image} alt="" className="thumb" />}
            <div className="body">
              <h3 className="title">{ev.title}</h3>
              <div className="meta">{ev.date ? new Date(ev.date).toLocaleString() : 'Date à définir'} • {ev.location || 'En ligne'}</div>
              <p className="desc">{ev.description ? (ev.description.length > 160 ? ev.description.slice(0,160)+'…' : ev.description) : ''}</p>
              <div className="actions">
                <button className="btn" onClick={()=>setSelected(ev)}>Détails</button>
                <button className={`btn ${rsvps[ev.id] ? 'primary':''}`} onClick={()=>toggleRsvp(ev.id)}>{rsvps[ev.id] ? 'Présent' : 'RSVP'}</button>
                <button className="btn" onClick={()=>exportEvent(ev)}>Exporter</button>
              </div>
            </div>
          </article>
        ))}
      </div>

      {selected && (
        <div className="modal" role="dialog" aria-modal="true" aria-labelledby="selected-event-title">
          <div className="modal-backdrop" aria-hidden="true"></div>
          <div className="modal-content">
            <button className="close" onClick={()=>setSelected(null)} aria-label="Fermer la fenêtre">×</button>
            <h2 id="selected-event-title">{selected.title}</h2>
            <div className="meta">{selected.date ? new Date(selected.date).toLocaleString() : ''} • {selected.location}</div>
            {selected.image && <img src={selected.image} alt="" style={{maxWidth:'100%',borderRadius:8,marginTop:12}} />}
            <p style={{marginTop:12}}>{selected.description}</p>
            <div style={{marginTop:16}}>
              <button className="btn primary" onClick={()=>{ toggleRsvp(selected.id); setSelected(null) }}>Je participe</button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .headerRow{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}
        .subtitle{color:var(--muted);margin-top:6px}
        .controls{display:flex;gap:8px}
        .controls .btn.create{display:inline-flex;align-items:center;gap:8px;padding:10px 14px;border-radius:10px;background:linear-gradient(90deg,#3b82f6,#06b6d4);color:#fff;border:none;box-shadow:0 8px 24px rgba(59,130,246,0.18);font-weight:700}
        .controls .btn.create:hover{transform:translateY(-1px)}
        .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
        .event-card{transition:transform .18s,box-shadow .18s}
        .event-card:hover{transform:translateY(-6px);box-shadow:0 12px 32px rgba(15,23,42,0.08)}
        .event-card{display:flex;flex-direction:column;height:100%}
        .thumb{width:100%;height:160px;object-fit:cover;border-radius:6px}
        .body{padding:12px;display:flex;flex-direction:column;flex:1}
        .title{margin:0 0 6px 0}
        .meta{color:var(--muted);font-size:13px;margin-bottom:8px}
        .desc{flex:1;color:#333}
        .actions{display:flex;gap:8px;margin-top:12px}
        .btn{padding:8px 12px;border-radius:6px;border:1px solid var(--fb-border);background:transparent;cursor:pointer}
        .btn.primary{background:var(--primary);color:#fff;border-color:transparent}
        .empty{padding:24px;text-align:center;color:var(--muted)}
        .modal{position:fixed;top:var(--navbar-height);left:0;right:0;bottom:0;display:flex;align-items:flex-start;justify-content:center;padding-top:12px;z-index:90;animation:fadeIn .18s ease}
        .modal-backdrop{position:absolute;inset:0;background:rgba(0,0,0,0.5);z-index:90}
        .modal-content{position:relative;z-index:91;max-height:calc(86vh - (var(--navbar-height,56px) + 12px));}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @media (prefers-reduced-motion: reduce){
          .event-card,.modal{transition:none;animation:none}
        }
        .modal-content{background:#fff;padding:20px;border-radius:8px;max-width:720px;width:94%;max-height:86vh;overflow:auto}
        .close{position:absolute;right:12px;top:12px;border:none;background:transparent;font-size:22px;cursor:pointer}
        @media(max-width:900px){.grid{grid-template-columns:repeat(2,1fr)}}
        @media(max-width:600px){.grid{grid-template-columns:1fr}.thumb{height:200px}}
      `}</style>
    </div>
  )
}
