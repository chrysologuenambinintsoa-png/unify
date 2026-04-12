import Layout from '../../components/Layout'
import { useEffect, useState } from 'react'

export default function UpgradeSuccess(){
  const [checking, setChecking] = useState(true)
  const [message, setMessage] = useState('Vérification en cours...')

  useEffect(()=>{
    async function checkStatus(){
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {}
        const res = await fetch('/api/me', { headers })
        if (!res.ok) { setMessage('Impossible de vérifier le statut du compte'); setChecking(false); return }
        const data = await res.json()
        if (data.user && data.user.isApprovedSeller) setMessage('Votre compte vendeur est activé. Vous pouvez publier des articles.')
        else setMessage('Paiement reçu — l\'activation peut prendre quelques minutes. Si nécessaire, contactez le support.')
      } catch (e) {
        console.error(e)
        setMessage('Erreur lors de la vérification du statut')
      } finally { setChecking(false) }
    }
    checkStatus()
  },[])

  return (
    <Layout>
      <div style={{ maxWidth: 800, margin: '48px auto', padding: 20 }}>
        <h1>Paiement réussi</h1>
        <p>{message}</p>
        <div style={{ marginTop: 20 }}>
          <a href="/marketplace/sell" style={{ padding: '8px 12px', background: '#166FE5', color: 'white', borderRadius: 8, textDecoration: 'none' }}>Publier un article</a>
        </div>
      </div>
    </Layout>
  )
}
