import { useState } from 'react'
import { useRouter } from 'next/router'
import Layout from '../../components/Layout'

export default function SponsorUpgrade(){
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const priceDisplay = process.env.NEXT_PUBLIC_SPONSOR_FEE_DISPLAY || '99.00'
  const priceAmount = process.env.SPONSOR_FEE_AMOUNT ? (parseInt(process.env.SPONSOR_FEE_AMOUNT,10)/100).toFixed(2) : priceDisplay

  const startSponsorPayment = async () => {
    setError('')
    setLoading(true)
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
      if (!token) {
        setError('Vous devez être connecté pour continuer')
        setTimeout(()=>router.push('/auth'),600)
        setLoading(false)
        return
      }

      const res = await fetch('/api/payments/create-sponsor-session', { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } })
      // handle 401 explicitly
      if (res.status === 401) {
        setLoading(false)
        setError('Session invalide — veuillez vous reconnecter')
        setTimeout(() => router.push('/auth'), 600)
        return
      }
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur lors de la création de la session sponsor')
      if (data.url) window.location.href = data.url
    } catch (e) {
      console.error(e)
      setError(e.message || 'Erreur')
      setLoading(false)
    }
  }

  return (
    <Layout>
      <div className="sponsor-upgrade" style={{ maxWidth: 980, margin: '48px auto', padding: 24 }}>
        <div className="upgrade-grid" style={{display:'grid',gap:24,alignItems:'start'}}>
          {/* Left - Hero */}
          <div>
            <h1 style={{fontSize:28,fontWeight:800,marginBottom:8}}>Activer une page sponsorisée</h1>
            <p style={{color:'#555',marginTop:0,marginBottom:20}}>Augmentez votre visibilité sur la plateforme en activant une page sponsorisée. Le paiement active la possibilité de publier des publicités et d'accéder aux statistiques avancées.</p>

            <div style={{display:'flex',gap:12,alignItems:'center',marginBottom:18}}>
              <div style={{width:64,height:64,display:'flex',alignItems:'center',justifyContent:'center',borderRadius:12,background:'linear-gradient(135deg,#0A7E3E,#0A5C2C)',color:'white',fontSize:28,fontWeight:800}}>
                <i className="fas fa-bullhorn"></i>
              </div>
              <div>
                <div style={{fontSize:13,color:'#888',fontWeight:700}}>Frais d'activation</div>
                <div style={{fontSize:32,fontWeight:900,color:'#0A7E3E'}}>{priceAmount} €</div>
              </div>
            </div>

            <div style={{background:'white',padding:18,borderRadius:12,boxShadow:'0 6px 18px rgba(15,23,42,0.06)',border:'1px solid var(--fb-border)'}}>
              <h3 style={{marginTop:0,marginBottom:12,fontSize:16}}>Ce que vous obtenez</h3>
              <ul style={{margin:0,paddingLeft:18,color:'#444'}}>
                <li style={{marginBottom:8}}>Page sponsor dédiée avec visuels et lien</li>
                <li style={{marginBottom:8}}>Possibilité de publier des publicités</li>
                <li style={{marginBottom:8}}>Accès aux statistiques et quotas publicitaires</li>
                <li style={{marginBottom:8}}>Support prioritaire</li>
              </ul>
              <div style={{marginTop:16,display:'flex',gap:12,alignItems:'center'}}>
                <i className="fas fa-lock" style={{color:'#999'}}></i>
                <small style={{color:'#777'}}>Paiement sécurisé par Stripe. Vos données bancaires ne sont pas stockées sur notre plateforme.</small>
              </div>
            </div>
          </div>

          {/* Right - CTA card */}
          <div className="cta-card-wrapper" style={{position:'relative'}}>
            <div style={{background:'linear-gradient(180deg,#fff,#f8fbff)',padding:20,borderRadius:12,boxShadow:'0 10px 30px rgba(10,40,80,0.06)',border:'1px solid var(--fb-border)'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:18}}>
                <div>
                  <div style={{fontSize:12,color:'#666',fontWeight:700}}>Activation Sponsor</div>
                  <div style={{fontSize:20,fontWeight:900,color:'#0A7E3E'}}>{priceAmount} €</div>
                </div>
                <div style={{textAlign:'right'}}>
                    <div className="duration-container" style={{textAlign:'right'}}>
                      <div className="badge">Recommandé</div>
                      <div style={{fontSize:12,color:'#999'}}>Durée</div>
                      <div style={{fontSize:13,fontWeight:700}}>Illimitée</div>
                    </div>
                </div>
              </div>

              <div style={{marginBottom:18}}>
                <button className="cta-button" onClick={startSponsorPayment} disabled={loading} style={{width:'100%',padding:'12px 16px',borderRadius:10,background:loading ? '#9fbbe6' : '#166FE5',color:'white',border:'none',fontSize:15,fontWeight:800,cursor:loading ? 'default' : 'pointer'}}>
                  {loading ? 'Redirection vers le paiement...' : 'Payer et activer ma page'}
                </button>
              </div>

              {error && <div style={{color:'crimson',fontSize:13}}>{error}</div>}

              <div style={{marginTop:14,display:'flex',gap:10,alignItems:'center',flexWrap:'wrap'}}>
                <div style={{display:'flex',alignItems:'center',gap:8}}>
                  <i className="fas fa-shield-alt" style={{color:'#0A7E3E'}}></i>
                  <small style={{color:'#666'}}>Sécurisé</small>
                </div>
                <div style={{display:'flex',alignItems:'center',gap:8}}>
                  <i className="fas fa-thumbs-up" style={{color:'#0A7E3E'}}></i>
                  <small style={{color:'#666'}}>Garantie de conformité</small>
                </div>
              </div>
            </div>

            {/* badge moved into duration container; styled above the card via CSS to match desktop */}
          </div>
        </div>

        <div style={{marginTop:28,textAlign:'center',color:'#666'}}>
          <small>Besoin d'aide ? Contactez <a href="/support">notre support</a> ou consultez la documentation.</small>
        </div>

        {/* Loading overlay */}
        {loading && (
          <div style={{position:'fixed',left:0,top:0,right:0,bottom:0,background:'rgba(10,20,40,0.4)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:9999}}>
            <div style={{background:'white',padding:24,borderRadius:12,display:'flex',alignItems:'center',gap:12,boxShadow:'0 12px 40px rgba(10,20,40,0.3)'}}>
              <div className="spinner" style={{width:36,height:36,borderRadius:36,border:'4px solid #e6eefc',borderTop:'4px solid #166FE5',animation:'spin 1s linear infinite'}}></div>
              <div style={{fontWeight:700}}>Redirection vers la page de paiement...</div>
            </div>
            <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
          </div>
        )}
        <style>{`
          /* Responsive adjustments for sponsor upgrade page */
          .sponsor-upgrade { padding: 20px; }
          .sponsor-upgrade h1 { font-size: 26px; }
          .sponsor-upgrade .upgrade-grid { grid-template-columns: 1fr 380px; }
          .sponsor-upgrade .cta-button { width: 100%; }

            @media (max-width: 900px) {
            .sponsor-upgrade { padding: 16px; }
            .sponsor-upgrade h1 { font-size: 22px; }
            .sponsor-upgrade .upgrade-grid { grid-template-columns: 1fr; }
            .sponsor-upgrade .upgrade-grid div { width: 100%; }
            /* Keep badge anchored above the card (desktop-like) and limit its width */
            .sponsor-upgrade .cta-card-wrapper { position: relative; }
            .sponsor-upgrade .cta-card-wrapper .badge { position: absolute; top: -16px; right: 12px; background:#fff; padding:6px 10px; border-radius:999px; box-shadow:0 6px 18px rgba(10,40,80,0.06); font-size:12px; font-weight:700; color:#0A7E3E; border:1px solid var(--fb-border); max-width:140px; white-space:nowrap; text-overflow:ellipsis; overflow:hidden; text-align:center; z-index:3; }
            .sponsor-upgrade .spinner { width: 30px; height: 30px; }
            .sponsor-upgrade .cta-button { font-size: 16px; padding: 12px; }
          }

          @media (max-width: 480px) {
            .sponsor-upgrade h1 { font-size: 20px; }
            .sponsor-upgrade p { font-size: 14px; }
          }
        `}</style>
      </div>
    </Layout>
  )
}
