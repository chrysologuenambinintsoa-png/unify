import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons'

export default function AuthPage(){
  const router = useRouter()
  const [isLogin, setIsLogin] = useState(true)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    nom: '',
    prenom: '',
    nomUtilisateur: '',
    phone: '',
    dateNaissance: '',
    genre: 'autre',
    acceptTermes: false
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [rememberPassword, setRememberPassword] = useState(false)

  // Rediriger vers Account Picker si un utilisateur est déjà connu
  useEffect(() => {
    const user = localStorage.getItem('user')
    const token = localStorage.getItem('token')

    // Vérifier si l'utilisateur est vraiment connecté (avec token valide)
    if (user && token) {
      try {
        const userData = JSON.parse(user)
        // Rediriger vers Account Picker seulement si l'utilisateur a un token valide
        router.push('/account-picker')
      } catch (e) {
        // localStorage corrompu, rester sur la page auth
        localStorage.removeItem('user')
        localStorage.removeItem('token')
      }
    }

    // Vérifier le paramètre d'URL pour forcer le mode register
    if (router.query.mode === 'register') {
      setIsLogin(false)
    }

    // Afficher le message d'expiration de session
    if (router.query.sessionExpired === 'true') {
      setError('Votre session a expiré. Veuillez vous reconnecter.')
    }

    // Sinon, afficher le formulaire de login/register normalement
  }, [router])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    if (!formData.email || !formData.password) {
      setError('Email et mot de passe requis')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', email: formData.email, password: formData.password })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur de connexion')
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      
      // Sauvegarder le compte si "Enregistrer mon mot de passe" est coché
      if (rememberPassword) {
        try {
          const currentSavedAccounts = localStorage.getItem('savedAccounts')
          let accounts = currentSavedAccounts ? JSON.parse(currentSavedAccounts) : []
          
          // Éviter les doublons
          accounts = accounts.filter(a => a.email !== data.user.email)
          accounts.unshift(data.user)
          
          localStorage.setItem('savedAccounts', JSON.stringify(accounts))
          console.log('✅ Compte enregistré dans savedAccounts (rememberPassword)')
        } catch (err) {
          console.error('Erreur lors de l\'enregistrement du compte:', err)
        }
      }
      
      window.dispatchEvent(new Event('userUpdated'))
      router.push('/')
    } catch (err) {
      setError(err.message || 'Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setError('')
    
    if (!formData.nom || !formData.prenom || !formData.nomUtilisateur || !formData.email || !formData.phone || !formData.dateNaissance || !formData.password || !formData.confirmPassword) {
      setError('Tous les champs sont requis')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas')
      return
    }

    if (!formData.acceptTermes) {
      setError('Acceptez les termes et conditions')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'register', userData: {
          email: formData.email,
          password: formData.password,
          prenom: formData.prenom,
          nom: formData.nom,
          nomUtilisateur: formData.nomUtilisateur
        } })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur lors de l\'inscription')
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      window.dispatchEvent(new Event('userUpdated'))
      router.push('/welcome')
    } catch (err) {
      setError(err.message || 'Erreur lors de l\'inscription')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'linear-gradient(135deg, #0A2342, #166FE5)',padding:'8px 12px'}}>
      <div className="auth-card" style={{background:'white',borderRadius:12,boxShadow:'0 8px 32px rgba(0,0,0,0.1)',width:'100%',maxWidth:450,padding:'24px'}}>
        <style>{`
          .auth-card { min-height: fit-content; }
          
          /* Extra petit écran - 320px */
          @media (max-width: 380px) {
            .auth-card { 
              padding: 12px !important; 
              border-radius: 8px !important;
              max-width: 100% !important;
            }
            .auth-card img { width: 50px !important; height: 50px !important; margin-bottom: 12px !important; }
            .auth-card h1 { font-size: 20px !important; margin-bottom: 4px !important; }
            .auth-card p { font-size: 13px !important; }
            .auth-card label { font-size: 11px !important; margin-bottom: 3px !important; }
            .auth-card input, .auth-card select { font-size: 16px !important; padding: 8px !important; }
            .auth-card button { font-size: 13px !important; padding: 10px !important; }
          }
          
          /* Petit écran - 480px */
          @media (max-width: 480px) {
            .auth-card { 
              padding: 14px !important; 
              border-radius: 10px !important;
            }
            .auth-card img { width: 55px !important; height: 55px !important; margin-bottom: 14px !important; }
            .auth-card h1 { font-size: 22px !important; margin-bottom: 6px !important; }
            .auth-card p { font-size: 14px !important; }
            .auth-card label { font-size: 12px !important; margin-bottom: 4px !important; }
            .auth-card input, .auth-card select { font-size: 16px !important; padding: 9px !important; }
            .auth-card button { font-size: 13px !important; padding: 10px !important; }
          }
          
          /* Écran moyen - 640px */
          @media (max-width: 640px) {
            .auth-card { 
              padding: 18px !important;
              border-radius: 10px !important;
            }
            .auth-card img { width: 58px !important; height: 58px !important; margin-bottom: 15px !important; }
            .auth-card h1 { font-size: 24px !important; margin-bottom: 6px !important; }
            .auth-card p { font-size: 14px !important; }
            .auth-card label { font-size: 12px !important; margin-bottom: 4px !important; }
            .auth-card input, .auth-card select { font-size: 16px !important; padding: 10px !important; }
            .auth-card button { font-size: 14px !important; padding: 11px !important; }
          }
        `}</style>
        <div style={{textAlign:'center',marginBottom:32}}>
          <div style={{display:'inline-flex',alignItems:'center',justifyContent:'center',width:80,height:80,background:'transparent',borderRadius:20,marginBottom:20}}>
            <img src="/logo.svg" alt="Unify Logo" style={{width:96,height:96,filter:'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'}} />
          </div>
          <h1 style={{fontSize:28,fontWeight:700,margin:'0 0 8px 0',color:'#0A2342',textShadow:'0 1px 2px rgba(0,0,0,0.1)'}}>Unify</h1>
          <p style={{color:'var(--fb-text-secondary)',margin:0,fontSize:15}}>
            {isLogin ? 'Se connecter' : 'Créer un compte'}
          </p>
        </div>

        {error && (
          <div style={{background:'#fee',color:'#c33',padding:12,borderRadius:8,marginBottom:16,fontSize:13,lineHeight:1.4}}>
            {error}
          </div>
        )}

        <form onSubmit={isLogin ? handleLogin : handleRegister}>
          {isLogin ? (
            <>
              <div style={{marginBottom:16}}>
                <label style={{display:'block',marginBottom:6,fontWeight:600,color:'var(--fb-text)'}}>Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="exemple@email.com"
                  style={{width:'100%',padding:10,border:'1px solid var(--fb-border)',borderRadius:8,fontSize:14,boxSizing:'border-box'}}
                />
              </div>

              <div style={{marginBottom:20}}>
                <label style={{display:'block',marginBottom:6,fontWeight:600,color:'var(--fb-text)'}}>Mot de passe</label>
                <div style={{position:'relative',display:'flex',alignItems:'center'}}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    style={{width:'100%',padding:'10px 36px 10px 10px',border:'1px solid var(--fb-border)',borderRadius:8,fontSize:14,boxSizing:'border-box'}}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{position:'absolute',right:10,background:'none',border:'none',cursor:'pointer',fontSize:16,color:'var(--fb-text-secondary)',padding:0}}
                    aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  >
                    <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:16}}>
                <div>
                  <label style={{display:'block',marginBottom:6,fontWeight:600,color:'var(--fb-text)',fontSize:13}}>Nom</label>
                  <input
                    type="text"
                    name="nom"
                    value={formData.nom}
                    onChange={handleChange}
                    placeholder="Dupont"
                    style={{width:'100%',padding:10,border:'1px solid var(--fb-border)',borderRadius:8,fontSize:13,boxSizing:'border-box'}}
                  />
                </div>
                <div>
                  <label style={{display:'block',marginBottom:6,fontWeight:600,color:'var(--fb-text)',fontSize:13}}>Prénom</label>
                  <input
                    type="text"
                    name="prenom"
                    value={formData.prenom}
                    onChange={handleChange}
                    placeholder="Jean"
                    style={{width:'100%',padding:10,border:'1px solid var(--fb-border)',borderRadius:8,fontSize:13,boxSizing:'border-box'}}
                  />
                </div>
              </div>

              <div style={{marginBottom:16}}>
                <label style={{display:'block',marginBottom:6,fontWeight:600,color:'var(--fb-text)',fontSize:13}}>Nom d'utilisateur</label>
                <input
                  type="text"
                  name="nomUtilisateur"
                  value={formData.nomUtilisateur}
                  onChange={handleChange}
                  placeholder="jdupont2024"
                  style={{width:'100%',padding:10,border:'1px solid var(--fb-border)',borderRadius:8,fontSize:13,boxSizing:'border-box'}}
                />
              </div>

              <div style={{marginBottom:16}}>
                <label style={{display:'block',marginBottom:6,fontWeight:600,color:'var(--fb-text)',fontSize:13}}>Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="exemple@email.com"
                  style={{width:'100%',padding:10,border:'1px solid var(--fb-border)',borderRadius:8,fontSize:13,boxSizing:'border-box'}}
                />
              </div>

              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:16}}>
                <div>
                  <label style={{display:'block',marginBottom:6,fontWeight:600,color:'var(--fb-text)',fontSize:13}}>Téléphone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+33 6 12 34 56 78"
                    style={{width:'100%',padding:10,border:'1px solid var(--fb-border)',borderRadius:8,fontSize:13,boxSizing:'border-box'}}
                  />
                </div>
                <div>
                  <label style={{display:'block',marginBottom:6,fontWeight:600,color:'var(--fb-text)',fontSize:13}}>Date de naissance</label>
                  <input
                    type="date"
                    name="dateNaissance"
                    value={formData.dateNaissance}
                    onChange={handleChange}
                    style={{width:'100%',padding:10,border:'1px solid var(--fb-border)',borderRadius:8,fontSize:13,boxSizing:'border-box'}}
                  />
                </div>
              </div>

              <div style={{marginBottom:16}}>
                <label style={{display:'block',marginBottom:6,fontWeight:600,color:'var(--fb-text)',fontSize:13}}>Genre</label>
                <select
                  name="genre"
                  value={formData.genre}
                  onChange={handleChange}
                  style={{width:'100%',padding:10,border:'1px solid var(--fb-border)',borderRadius:8,fontSize:13,boxSizing:'border-box'}}
                >
                  <option value="homme">Homme</option>
                  <option value="femme">Femme</option>
                  <option value="autre">Autre</option>
                </select>
              </div>

              <div style={{marginBottom:16}}>
                <label style={{display:'block',marginBottom:6,fontWeight:600,color:'var(--fb-text)',fontSize:13}}>Mot de passe</label>
                <div style={{position:'relative',display:'flex',alignItems:'center'}}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    style={{width:'100%',padding:'10px 36px 10px 10px',border:'1px solid var(--fb-border)',borderRadius:8,fontSize:13,boxSizing:'border-box'}}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{position:'absolute',right:10,background:'none',border:'none',cursor:'pointer',fontSize:16,color:'var(--fb-text-secondary)',padding:0}}
                    aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  >
                    <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                  </button>
                </div>
              </div>

              <div style={{marginBottom:16}}>
                <label style={{display:'block',marginBottom:6,fontWeight:600,color:'var(--fb-text)',fontSize:13}}>Confirmer mot de passe</label>
                <div style={{position:'relative',display:'flex',alignItems:'center'}}>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="••••••••"
                    style={{width:'100%',padding:'10px 36px 10px 10px',border:'1px solid var(--fb-border)',borderRadius:8,fontSize:13,boxSizing:'border-box'}}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{position:'absolute',right:10,background:'none',border:'none',cursor:'pointer',fontSize:16,color:'var(--fb-text-secondary)',padding:0}}
                    aria-label={showConfirmPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  >
                    <FontAwesomeIcon icon={showConfirmPassword ? faEyeSlash : faEye} />
                  </button>
                </div>
              </div>

              <div style={{marginBottom:20,display:'flex',alignItems:'center',gap:8}}>
                <input
                  type="checkbox"
                  name="acceptTermes"
                  checked={formData.acceptTermes}
                  onChange={handleChange}
                  style={{width:18,height:18,cursor:'pointer'}}
                />
                <label style={{color:'var(--fb-text-secondary)',fontSize:13,cursor:'pointer'}}>
                  J'accepte les termes et conditions
                </label>
              </div>
            </>
          )}

          {isLogin && (
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:16}}>
              <input
                type="checkbox"
                id="rememberPassword"
                checked={rememberPassword}
                onChange={(e) => setRememberPassword(e.target.checked)}
                style={{width:18,height:18,cursor:'pointer'}}
              />
              <label htmlFor="rememberPassword" style={{color:'var(--fb-text-secondary)',fontSize:13,cursor:'pointer'}}>
                Enregistrer mon mot de passe
              </label>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width:'100%',
              padding:12,
              background:loading ? '#999' : '#0A2342',
              color:'white',
              border:'none',
              borderRadius:8,
              fontWeight:600,
              fontSize:14,
              cursor:loading ? 'not-allowed' : 'pointer',
              opacity:loading ? 0.7 : 1,
              transition:'background 0.3s'
            }}
          >
            {loading ? 'Chargement...' : (isLogin ? 'Se connecter' : 'Créer un compte')}
          </button>
        </form>

        <div style={{textAlign:'center',marginTop:20,color:'var(--fb-text-secondary)',fontSize:14}}>
          {isLogin ? "Pas encore de compte? " : "Vous avez déjà un compte? "}
          <button
            onClick={() => {
              setIsLogin(!isLogin)
              setError('')
              setRememberPassword(false)
              setFormData({
                email: '',
                password: '',
                confirmPassword: '',
                nom: '',
                prenom: '',
                nomUtilisateur: '',
                phone: '',
                dateNaissance: '',
                genre: 'autre',
                acceptTermes: false
              })
            }}
            style={{background:'none',border:'none',color:'#0A2342',fontWeight:600,cursor:'pointer',fontSize:14,textDecoration:'underline'}}
          >
            {isLogin ? 'S\'inscrire' : 'Se connecter'}
          </button>
        </div>
      </div>
    </div>
  )
}
