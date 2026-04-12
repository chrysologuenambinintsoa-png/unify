import Layout from '../../components/Layout'

export default function UpgradeCancel(){
  return (
    <Layout>
      <div style={{ maxWidth: 800, margin: '48px auto', padding: 20 }}>
        <h1>Paiement annulé</h1>
        <p>Le paiement a été annulé. Vous pouvez réessayer plus tard.</p>
        <div style={{ marginTop: 20 }}>
          <a href="/marketplace/upgrade" style={{ padding: '8px 12px', background: '#166FE5', color: 'white', borderRadius: 8, textDecoration: 'none' }}>Retourner à la page d'activation</a>
        </div>
      </div>
    </Layout>
  )
}
