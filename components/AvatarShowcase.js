import ClickableAvatar from './ClickableAvatar'
import { useState, useEffect } from 'react'

/**
 * Composant exemple d'intégration complète des avatars cliquables
 * Montre les différentes façons d'utiliser ClickableAvatar
 */
export default function AvatarShowcase() {
  const [currentUser, setCurrentUser] = useState(null)

  useEffect(() => {
    // Charger l'utilisateur courant
    try {
      const userStr = localStorage.getItem('user')
      if (userStr) {
        setCurrentUser(JSON.parse(userStr))
      }
    } catch (e) {
      console.error('Erreur lecture utilisateur:', e)
    }
  }, [])

  // Données d'exemple
  const sampleUsers = [
    {
      prenom: 'Jean',
      nom: 'Dupont',
      nomUtilisateur: 'jeandupont',
      email: 'jean@example.com',
      avatarUrl: 'https://placehold.co/150?text=JD&bg=4A90E2&fg=white',
      avatarBg: 'hsl(210, 70%, 60%)'
    },
    {
      prenom: 'Marie',
      nom: 'Martin',
      nomUtilisateur: 'mariemartin',
      email: 'marie@example.com',
      avatarUrl: 'https://placehold.co/150?text=MM&bg=A366FF&fg=white',
      avatarBg: 'hsl(290, 70%, 60%)'
    },
    {
      prenom: 'Pierre',
      nom: 'Bernard',
      nomUtilisateur: 'pierrebernard',
      email: 'pierre@example.com',
      avatarBg: 'hsl(30, 70%, 60%)'
    }
  ]

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>🎨 Showcase - Avatars Cliquables</h1>

      {/* Section 1: Différentes tailles */}
      <section style={{ marginBottom: '40px' }}>
        <h2>Tailles disponibles</h2>
        <div style={{ display: 'flex', gap: '30px', alignItems: 'center' }}>
          <div>
            <p><strong>Small (32px)</strong></p>
            <ClickableAvatar user={sampleUsers[0]} size="small" />
          </div>
          <div>
            <p><strong>Medium (48px)</strong></p>
            <ClickableAvatar user={sampleUsers[0]} size="medium" />
          </div>
          <div>
            <p><strong>Large (64px)</strong></p>
            <ClickableAvatar user={sampleUsers[0]} size="large" />
          </div>
        </div>
      </section>

      {/* Section 2: Avec noms */}
      <section style={{ marginBottom: '40px' }}>
        <h2>Avatars avec noms</h2>
        <div style={{ display: 'flex', gap: '30px' }}>
          {sampleUsers.map((user) => (
            <div key={user.nomUtilisateur}>
              <ClickableAvatar user={user} size="medium" showName={true} />
            </div>
          ))}
        </div>
      </section>

      {/* Section 3: En grille (comme dans Amis) */}
      <section style={{ marginBottom: '40px' }}>
        <h2>Vue grille (comme Amis)</h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
          gap: '16px'
        }}>
          {sampleUsers.map((user) => (
            <div
              key={user.nomUtilisateur}
              style={{
                textAlign: 'center',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '8px'
              }}
            >
              <ClickableAvatar user={user} size="large" />
              <p style={{ marginTop: '8px', fontSize: '14px' }}>
                {user.prenom}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Section 4: En ligne (comme liste) */}
      <section style={{ marginBottom: '40px' }}>
        <h2>Vue liste (comme Messages)</h2>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          {sampleUsers.map((user) => (
            <div
              key={user.nomUtilisateur}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '8px'
              }}
            >
              <ClickableAvatar user={user} size="small" />
              <div>
                <p style={{ margin: 0, fontWeight: 500 }}>
                  {user.prenom} {user.nom}
                </p>
                <p style={{ margin: 0, fontSize: '12px', color: '#999' }}>
                  {user.email}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Section 5: Avec callback */}
      <section style={{ marginBottom: '40px' }}>
        <h2>Avec callback personnalisé</h2>
        <div>
          <p>Cliquez sur un avatar pour voir l'alert:</p>
          <div style={{ display: 'flex', gap: '20px' }}>
            {sampleUsers.slice(0, 2).map((user) => (
              <ClickableAvatar
                key={user.nomUtilisateur}
                user={user}
                size="medium"
                onClick={(user) => {
                  alert(`Vous consultez le profil de ${user.prenom} ${user.nom}`)
                }}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Section 6: Utilisateur courant */}
      {currentUser && (
        <section style={{ marginBottom: '40px' }}>
          <h2>Utilisateur courant</h2>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <ClickableAvatar user={currentUser} size="large" showName={true} />
          </div>
        </section>
      )}

      {/* Section 7: Composé (post card exemple) */}
      <section style={{ marginBottom: '40px' }}>
        <h2>Exemple: Carte de post</h2>
        {sampleUsers.map((user) => (
          <div
            key={user.nomUtilisateur}
            style={{
              border: '1px solid #ddd',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '16px',
              maxWidth: '500px'
            }}
          >
            <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
              <ClickableAvatar user={user} size="medium" />
              <div>
                <p style={{ margin: 0, fontWeight: 600 }}>
                  {user.prenom} {user.nom}
                </p>
                <p style={{ margin: 0, fontSize: '12px', color: '#999' }}>
                  Il y a 2 heures
                </p>
              </div>
            </div>
            <p>
              Voici un exemple de post avec un avatar cliquable. Cliquez sur l'avatar
              pour voir le profil de l'utilisateur!
            </p>
          </div>
        ))}
      </section>

      {/* Instructions */}
      <section style={{
        backgroundColor: '#f0f0f0',
        padding: '16px',
        borderRadius: '8px',
        marginTop: '40px'
      }}>
        <h3>📖 Comment utiliser dans vos composants:</h3>
        <pre style={{ backgroundColor: '#fff', padding: '12px', borderRadius: '4px', overflow: 'auto' }}>
{`import ClickableAvatar from './ClickableAvatar'

// Utilisation simple
<ClickableAvatar user={userData} size="medium" />

// Avec nom
<ClickableAvatar user={userData} size="medium" showName={true} />

// Avec callback
<ClickableAvatar 
  user={userData} 
  onClick={(user) => console.log(user)} 
/>
`}
        </pre>
      </section>
    </div>
  )
}
