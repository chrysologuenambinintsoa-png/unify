export default function Debug404() {
  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>Debug 404 Errors</h1>
      <p>Utilisez cette page pour analyser les erreurs 404 récentes.</p>

      <button
        onClick={() => {
          const errors = JSON.parse(localStorage.getItem('404_errors') || '[]')
          console.log('Stored 404 errors:', errors)
          alert(`Nombre d'erreurs stockées: ${errors.length}\nVérifiez la console pour les détails.`)
        }}
        style={{
          padding: '10px 20px',
          background: '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer'
        }}
      >
        Afficher les erreurs en console
      </button>

      <button
        onClick={() => {
          localStorage.removeItem('404_errors')
          alert('Erreurs supprimées!')
        }}
        style={{
          padding: '10px 20px',
          background: '#dc2626',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          marginLeft: '10px'
        }}
      >
        Effacer les erreurs
      </button>
    </div>
  )
}