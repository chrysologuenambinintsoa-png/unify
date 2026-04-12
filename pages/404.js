import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'

// Fonction pour calculer la similarité entre deux chaînes
function calculateSimilarity(str1, str2) {
  const longer = str1.length > str2.length ? str1 : str2
  const shorter = str1.length > str2.length ? str2 : str1

  if (longer.length === 0) return 1.0

  const distance = levenshteinDistance(longer, shorter)
  return (longer.length - distance) / longer.length
}

// Distance de Levenshtein pour mesurer la similarité
function levenshteinDistance(str1, str2) {
  const matrix = []

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i]
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        )
      }
    }
  }

  return matrix[str2.length][str1.length]
}

export default function Custom404() {
  const router = useRouter()
  const [suggestions, setSuggestions] = useState([])
  const [clientInfo, setClientInfo] = useState({ referrer: '', userAgent: '' })
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    if (!router.isReady) return
    setIsReady(true)

    // Only access browser globals on the client
    let ua = ''
    let ref = ''
    if (typeof navigator !== 'undefined') {
      ua = navigator.userAgent
    }
    if (typeof document !== 'undefined') {
      ref = document.referrer
    }

    setClientInfo({ referrer: ref, userAgent: ua })

    // Log détaillé de l'erreur pour le debugging
    const errorDetails = {
      url: router.asPath,
      pathname: router.pathname,
      query: router.query,
      userAgent: ua,
      referrer: ref,
      timestamp: new Date().toISOString()
    }

    console.error('404 Error Details:', errorDetails)

    // Détecter les fautes de frappe courantes
    const path = router.asPath.toLowerCase()
    const routeSuggestions = []

    const commonRoutes = [
      '/', '/profile', '/messages', '/amis', '/groupes', '/settings',
      '/actualites', '/videos', '/marketplace', '/souvenirs'
    ]

    // Suggestions basées sur la similarité de chaîne
    commonRoutes.forEach(route => {
      const similarity = calculateSimilarity(path, route)
      if (similarity > 0.6) {
        routeSuggestions.push({ route, similarity })
      }
    })

    // Trier par similarité
    routeSuggestions.sort((a, b) => b.similarity - a.similarity)
    setSuggestions(routeSuggestions.slice(0, 3))

    if (routeSuggestions.length > 0) {
      errorDetails.suggestions = routeSuggestions.slice(0, 3)
    }

    // Stocker dans localStorage pour analyse
    const existingErrors = JSON.parse(localStorage.getItem('404_errors') || '[]')
    existingErrors.push(errorDetails)
    // Garder seulement les 10 dernières erreurs
    if (existingErrors.length > 10) {
      existingErrors.shift()
    }
    localStorage.setItem('404_errors', JSON.stringify(existingErrors))

    // Rediriger automatiquement vers la page d'accueil après 5 secondes
    const timer = setTimeout(() => {
      router.push('/')
    }, 5000)

    return () => clearTimeout(timer)
  }, [router.isReady, router])

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: '#f5f7fa',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      textAlign: 'center',
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '40px',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
        maxWidth: '600px',
        width: '100%'
      }}>
        <div style={{
          fontSize: '72px',
          marginBottom: '20px',
          color: '#9ca3af'
        }}>
          404
        </div>

        <h1 style={{
          fontSize: '24px',
          fontWeight: '600',
          color: '#111827',
          marginBottom: '12px'
        }}>
          Page non trouvée
        </h1>

        <p style={{
          fontSize: '16px',
          color: '#6b7280',
          marginBottom: '8px',
          lineHeight: '1.5'
        }}>
          La page que vous recherchez n'existe pas ou a été déplacée.
        </p>

        <div style={{
          background: '#f3f4f6',
          padding: '12px',
          borderRadius: '6px',
          marginBottom: '24px',
          fontFamily: 'monospace',
          fontSize: '14px',
          color: '#374151',
          wordBreak: 'break-all'
        }}>
          <strong>URL demandée:</strong> {isReady ? router.asPath : 'Chargement...'}
        </div>

        {suggestions.length > 0 && (
          <div style={{
            background: '#ecfdf5',
            border: '1px solid #10b981',
            padding: '16px',
            borderRadius: '6px',
            marginBottom: '24px'
          }}>
            <div style={{
              fontSize: '16px',
              fontWeight: '600',
              color: '#065f46',
              marginBottom: '8px'
            }}>
              💡 Suggestions
            </div>
            <p style={{
              fontSize: '14px',
              color: '#047857',
              marginBottom: '12px'
            }}>
              Voulez-vous dire l'une de ces pages ?
            </p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => router.push(suggestion.route)}
                  style={{
                    background: '#10b981',
                    color: 'white',
                    border: 'none',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'background-color 0.15s ease'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#059669'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#10b981'}
                >
                  {suggestion.route}
                </button>
              ))}
            </div>
          </div>
        )}

        <div style={{
          background: '#fef3c7',
          border: '1px solid #f59e0b',
          padding: '12px',
          borderRadius: '6px',
          marginBottom: '24px',
          fontSize: '14px',
          color: '#92400e'
        }}>
          <strong>💡 Conseil:</strong> Vérifiez que l'URL est correcte. Les routes disponibles incluent: /, /profile, /messages, /amis, /groupes, etc.
        </div>

        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={() => router.push('/')}
            style={{
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'background-color 0.15s ease'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#2563eb'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#3b82f6'}
          >
            🏠 Retour à l'accueil
          </button>

          <button
            onClick={() => router.back()}
            style={{
              background: '#f3f4f6',
              color: '#374151',
              border: '1px solid #d1d5db',
              padding: '10px 20px',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#e5e7eb'
              e.target.style.borderColor = '#9ca3af'
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#f3f4f6'
              e.target.style.borderColor = '#d1d5db'
            }}
          >
            ← Page précédente
          </button>

          <button
            onClick={() => window.location.reload()}
            style={{
              background: '#10b981',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'background-color 0.15s ease'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#059669'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#10b981'}
          >
            🔄 Actualiser
          </button>
        </div>

        <p style={{
          fontSize: '14px',
          color: '#9ca3af',
          marginTop: '20px'
        }}>
          Redirection automatique dans 5 secondes...
        </p>

        <details style={{ marginTop: '20px', textAlign: 'left' }}>
          <summary style={{
            cursor: 'pointer',
            fontSize: '14px',
            color: '#6b7280',
            marginBottom: '10px'
          }}>
            📊 Informations de débogage
          </summary>
          <div style={{
            background: '#f9fafb',
            padding: '12px',
            borderRadius: '6px',
            fontSize: '12px',
            fontFamily: 'monospace',
            color: '#374151',
            overflow: 'auto'
          }}>
            <div><strong>Pathname:</strong> {router.pathname}</div>
            <div><strong>Query:</strong> {JSON.stringify(router.query)}</div>
            <div><strong>Referrer:</strong> {clientInfo.referrer || 'Aucun'}</div>
            <div><strong>User Agent:</strong> {clientInfo.userAgent || 'N/A'}</div>
          </div>
        </details>
      </div>
    </div>
  )
}