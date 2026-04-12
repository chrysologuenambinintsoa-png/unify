import { useState } from 'react'
import { useRouter } from 'next/router'
import Layout from '../../components/Layout'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faLock, faShieldAlt, faStar, faStore } from '@fortawesome/free-solid-svg-icons'

export default function UpgradeToSellerPage(){
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const startPayment = async () => {
    setError('')
    setLoading(true)
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
      if (!token) {
        setError('Vous devez être connecté pour effectuer le paiement')
        setLoading(false)
        // redirect to login after short delay
        setTimeout(() => router.push('/auth'), 800)
        return
      }

      const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }

      const res = await fetch('/api/payments/create-checkout-session', { method: 'POST', headers })
      // parse safely
      let data
      try {
        data = await res.json()
      } catch (e) {
        throw new Error('Réponse inattendue du serveur')
      }
      if (!res.ok) {
        if (res.status === 401) {
          setError('Session invalide — reconnectez-vous')
          setLoading(false)
          setTimeout(() => router.push('/auth'), 800)
          return
        }
        throw new Error(data.error || 'Erreur lors de la création de la session')
      }

      // Redirect user to Stripe Checkout page
      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error('URL de session manquante')
      }
    } catch (e) {
      console.error(e)
      setError(e.message || 'Erreur')
      setLoading(false)
    }
  }

  return (
    <Layout>
      <div className="upgrade-page">
        {/* Header: icon in circle + title */}
        <div className="upgrade-header">
          <div className="upgrade-icon-circle"><FontAwesomeIcon icon={faStore} /></div>
          <div>
            <h1 className="upgrade-title">Devenir vendeur sur Unify</h1>
            <div className="upgrade-sub">Activez votre compte pour publier et gérer vos ventes en toute confiance.</div>
          </div>
        </div>
        <div className="upgrade-row">
          {/* Left: Benefits and explanation */}
          <div className="upgrade-left">

            <div style={{ marginTop: 18, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ padding: 12, borderRadius: 10, background: '#f6fbff', border: '1px solid #e6f0ff' }}>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>Publier sans limites</div>
                <div style={{ fontSize: 13, color: '#555' }}>Ajoutez autant d'articles que vous le souhaitez.</div>
              </div>
              <div style={{ padding: 12, borderRadius: 10, background: '#f6fffa', border: '1px solid #e6ffef' }}>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>Outils vendeurs</div>
                <div style={{ fontSize: 13, color: '#555' }}>Statistiques, gestion et support prioritaire.</div>
              </div>
              <div style={{ padding: 12, borderRadius: 10, background: '#fff8f6', border: '1px solid #fff0ea' }}>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>Visibilité</div>
                <div style={{ fontSize: 13, color: '#555' }}>Mettez en avant vos meilleures offres.</div>
              </div>
              <div style={{ padding: 12, borderRadius: 10, background: '#f7f6ff', border: '1px solid #efeaff' }}>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>Sécurité</div>
                <div style={{ fontSize: 13, color: '#555' }}>Paiement sécurisé et suivi des ventes.</div>
              </div>
            </div>

            <div style={{ marginTop: 20 }}>
              <h3 style={{ marginBottom: 8 }}>Questions fréquentes</h3>
              <details style={{ marginBottom: 8 }}>
                <summary style={{ cursor: 'pointer' }}>Combien coûte l'activation ?</summary>
                <div style={{ padding: 8, color: '#444' }}>Le coût unique d'activation est indiqué dans le récapitulatif à droite.</div>
              </details>
              <details>
                <summary style={{ cursor: 'pointer' }}>Puis-je être remboursé ?</summary>
                <div style={{ padding: 8, color: '#444' }}>Contactez le support si vous rencontrez un problème lors de l'activation.</div>
              </details>
            </div>
          </div>

          {/* Right: Payment card */}
          <div className="upgrade-right">
            <div className="upgrade-right-inner">
              <div style={{ background: 'white', padding: 20, borderRadius: 14, boxShadow: '0 6px 20px rgba(20,30,60,0.06)', border: '1px solid #eef6ff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 12, color: '#888' }}>Frais d'activation</div>
                    <div style={{ fontSize: 24, fontWeight: 800, marginTop: 6 }}>{process.env.NEXT_PUBLIC_SELLER_FEE_DISPLAY || '49.00'} €</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 12, color: '#888' }}>Paiement sécurisé</div>
                    <div style={{ marginTop: 6, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      <div style={{ fontSize: 18, color: '#00A3FF' }}><FontAwesomeIcon icon={faLock} /></div>
                      <div style={{ fontSize: 18, color: '#28a745' }}><FontAwesomeIcon icon={faShieldAlt} /></div>
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: 16, borderTop: '1px dashed #f0f6ff', paddingTop: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#555', fontSize: 14 }}>
                    <div>Activation (unique)</div>
                    <div style={{ fontWeight: 700 }}>{process.env.NEXT_PUBLIC_SELLER_FEE_DISPLAY || '49.00'} €</div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#999', fontSize: 13, marginTop: 8 }}>
                    <div>TVA incl.</div>
                    <div>—</div>
                  </div>
                </div>

                {error && <div style={{ color: 'crimson', marginTop: 12 }}>{error}</div>}

                <button onClick={startPayment} disabled={loading} style={{ width: '100%', marginTop: 16, padding: '12px 14px', borderRadius: 10, background: '#166FE5', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 700 }}>
                  {loading ? 'Redirection...' : 'Payer et activer mon compte vendeur'}
                </button>

                <div style={{ marginTop: 12, fontSize: 13, color: '#666', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FontAwesomeIcon icon={faStar} style={{ color: '#f4c150' }} />
                  Paiement sécurisé — Nous n'accédons pas à vos données bancaires.
                </div>
              </div>

              <div style={{ marginTop: 12, textAlign: 'center', color: '#888', fontSize: 13 }}>
                <div>Besoin d'aide ? Contactez <a href="/contact">le support</a>.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
        {/* Micro-animation overlay during redirect */}
        {loading && (
          <div className="redirect-overlay" role="status" aria-live="polite">
            <div className="micro-box">
              <div className="spinner" />
              <div className="dots"><span>.</span><span>.</span><span>.</span></div>
              <div style={{ marginTop: 8, fontSize: 13, color: '#333' }}>Préparation de la page de paiement…</div>
            </div>
          </div>
        )}

        <style jsx>{`
          .redirect-overlay {
            position: fixed;
            inset: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(255,255,255,0.6);
            z-index: 1200;
          }
          .micro-box {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 8px;
            padding: 16px 20px;
            background: white;
            border-radius: 12px;
            box-shadow: 0 8px 30px rgba(20,30,60,0.12);
            min-width: 220px;
          }
          .spinner {
            width: 44px;
            height: 44px;
            border-radius: 50%;
            border: 4px solid rgba(0,0,0,0.08);
            border-top-color: #166FE5;
            animation: spin 1s linear infinite;
          }
          .dots { font-size: 22px; color: #166FE5; font-weight: 700; display:flex; gap:6px; }
          .dots span { opacity: 0.2; animation: bounce 1s infinite; }
          .dots span:nth-child(1) { animation-delay: 0s }
          .dots span:nth-child(2) { animation-delay: 0.12s }
          .dots span:nth-child(3) { animation-delay: 0.24s }

          /* Page container with rounded background */
          .upgrade-page { max-width: 1000px; margin: 32px auto; padding: 24px; background: linear-gradient(180deg,#fbfdff,#f3f8ff); border-radius: 18px; box-shadow: 0 8px 30px rgba(20,30,60,0.04); }
          .upgrade-header { display:flex; align-items:center; gap:16px; margin-bottom: 18px; }
          .upgrade-icon-circle { width:64px; height:64px; border-radius:50%; background: linear-gradient(135deg,#166FE5,#00A3FF); display:flex; align-items:center; justify-content:center; color:white; font-size:26px }
          .upgrade-title { margin:0; font-size:24px }
          .upgrade-sub { color:#666; margin-top:6px }
          .upgrade-row { display: flex; gap: 24px; flex-wrap: wrap; }
          .upgrade-left { flex: 1 1 560px; min-width: 300px; background: white; padding: 28px; border-radius: 14px; box-shadow: 0 6px 24px rgba(20,30,60,0.06); }
          .upgrade-right { width: 360px; min-width: 300px; }
          .upgrade-right-inner { position: sticky; top: 24px; }

          @media (max-width: 880px) {
            /* Stack content with payment card at the bottom */
            .upgrade-row { flex-direction: column; gap: 16px; }
            .upgrade-left { padding: 18px; border-radius: 12px; }
            .upgrade-right { width: 100%; min-width: auto; }
            .upgrade-right-inner { position: static; }

            /* Header: center icon and title on small screens */
            .upgrade-header { flex-direction: column; align-items: center; text-align: center; }
            .upgrade-icon-circle { width:48px; height:48px; font-size:20px }
            .upgrade-title { font-size:20px }
          }

          @keyframes spin { to { transform: rotate(360deg) } }
          @keyframes bounce { 0% { opacity: 0.2; transform: translateY(0) } 50% { opacity: 1; transform: translateY(-6px) } 100% { opacity: 0.2; transform: translateY(0) } }
        `}</style>
      </Layout>
    )
}
