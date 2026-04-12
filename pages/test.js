import { useRouter } from 'next/router'
import { useEffect } from 'react'

export default function TestMenu() {
  const router = useRouter()

  useEffect(() => {
    // Add animation styles
    const style = document.createElement('style')
    style.textContent = `
      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
    `
    document.head.appendChild(style)
    return () => document.head.removeChild(style)
  }, [])

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>🧪 Menu de Test</h1>
        
        <div style={styles.grid}>
          <button
            onClick={() => router.push('/test-messages')}
            style={styles.button}
            onMouseEnter={(e) => e.target.style.background = '#667eea'}
            onMouseLeave={(e) => e.target.style.background = '#7c5cdb'}
          >
            <div style={styles.icon}>💬</div>
            <div style={styles.buttonText}>Tester les Messages</div>
            <div style={styles.subtitle}>Voir le système de chat avec utilisateurs de test</div>
          </button>

          <button
            onClick={() => router.push('/auth')}
            style={styles.button}
            onMouseEnter={(e) => e.target.style.background = '#667eea'}
            onMouseLeave={(e) => e.target.style.background = '#7c5cdb'}
          >
            <div style={styles.icon}>🔐</div>
            <div style={styles.buttonText}>Connexion</div>
            <div style={styles.subtitle}>Page de connexion/inscription</div>
          </button>

          <button
            onClick={() => router.push('/')}
            style={styles.button}
            onMouseEnter={(e) => e.target.style.background = '#667eea'}
            onMouseLeave={(e) => e.target.style.background = '#7c5cdb'}
          >
            <div style={styles.icon}>🏠</div>
            <div style={styles.buttonText}>Accueil</div>
            <div style={styles.subtitle}>Page d'accueil principale</div>
          </button>

          <button
            onClick={() => router.push('/welcome')}
            style={styles.button}
            onMouseEnter={(e) => e.target.style.background = '#667eea'}
            onMouseLeave={(e) => e.target.style.background = '#7c5cdb'}
          >
            <div style={styles.icon}>👋</div>
            <div style={styles.buttonText}>Page Welcome</div>
            <div style={styles.subtitle}>Page de bienvenue et onboarding</div>
          </button>
        </div>

        <div style={styles.info}>
          <h3>ℹ️ Instructions :</h3>
          <ol>
            <li>Cliquez sur <strong>"Tester les Messages"</strong></li>
            <li>Sélectionnez un utilisateur de test (Alice, Bob, Charlie ou Diana)</li>
            <li>Les données de test seront initialisées automatiquement</li>
            <li>Vous serez redirigé vers la page /messages</li>
            <li>Explorez les conversations et les chats modales</li>
          </ol>
        </div>

        <div style={styles.highlight}>
          <strong>💡 Conseil :</strong> Ouvrez plusieurs onglets avec différents utilisateurs pour tester les conversations multiples!
        </div>
      </div>
    </div>
  )
}

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: 20,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'system-ui, -apple-system, sans-serif'
  },
  card: {
    background: '#FFF',
    borderRadius: 20,
    padding: 40,
    maxWidth: 800,
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
    animation: 'fadeIn 0.5s ease-out'
  },
  title: {
    fontSize: 36,
    fontWeight: 700,
    margin: '0 0 32px 0',
    color: '#1F2937',
    textAlign: 'center'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: 16,
    marginBottom: 32
  },
  button: {
    background: '#7c5cdb',
    color: 'white',
    border: 'none',
    borderRadius: 12,
    padding: 24,
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    gap: 8,
    fontFamily: 'inherit'
  },
  icon: {
    fontSize: 40
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 600
  },
  subtitle: {
    fontSize: 12,
    opacity: 0.9,
    lineHeight: 1.3
  },
  info: {
    background: '#F0F4FF',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    border: '1px solid #E0E7FF'
  },
  highlight: {
    background: '#FFFBEB',
    padding: 16,
    borderRadius: 8,
    border: '1px solid #FEE3B0',
    color: '#92400E',
    fontSize: 14,
    lineHeight: 1.6
  }
}
