// FontAwesome Icon Styles - Must be imported before other styles
import '@fortawesome/fontawesome-svg-core/styles.css'
import '@fortawesome/fontawesome-free/css/all.min.css'
import '../lib/fontawesome'

import '../styles/globals.css'
import '../styles/variables.css'
import '../styles/pages.css'
import '../components/components/pages/page.css'
import '../components/components/group/group.css'
import '../components/Skeleton.css'
import '../components/Notification.css'
import '../components/PostViewer.css'
import '../components/PostCard.css'
import '../components/Toast.module.css'

// Live Component Styles
import '../components/Live/Live.css'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { TranslationProvider } from '../hooks/useTranslation'
import { AppProvider } from '../context/AppContext'
import SplashScreen from '../components/SplashScreen'
import { isPublicRoute } from '../hooks/useAuth'

export default function MyApp({ Component, pageProps }) {
  const router = useRouter()
  const [darkMode, setDarkMode] = useState(false)
  const [showSplash, setShowSplash] = useState(true)
  const [isAuthChecked, setIsAuthChecked] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isRouterReady, setIsRouterReady] = useState(false)
  const [isRedirecting, setIsRedirecting] = useState(false)

  useEffect(() => {
    // Check localStorage for theme preference
    const savedTheme = localStorage.getItem('unify-theme')
    if (savedTheme === 'dark') {
      setDarkMode(true)
      document.body.classList.add('dark')
      document.body.setAttribute('data-theme', 'dark')
    } else if (savedTheme === 'light') {
      setDarkMode(false)
      document.body.classList.remove('dark')
      document.body.setAttribute('data-theme', 'light')
    } else {
      setDarkMode(false)
      document.body.classList.remove('dark')
      document.body.setAttribute('data-theme', 'light')
    }

    // Check if splash screen has been shown in this session
    const splashShown = sessionStorage.getItem('unify-splash-shown')
    if (splashShown) {
      setShowSplash(false)
    }
  }, [])

  // Vérification d'authentification
  useEffect(() => {
    const checkAuthentication = async () => {
      // Si c'est une route publique, pas besoin de vérifier
      if (isPublicRoute(router.pathname)) {
        setIsAuthChecked(true)
        setIsAuthenticated(false)
        return
      }

      // Vérifier le token et l'utilisateur
      const token = localStorage.getItem('token')
      const user = localStorage.getItem('user')

      if (token && user) {
        try {
          const userData = JSON.parse(user)
          if (userData && userData.email) {
            setIsAuthenticated(true)
            setIsAuthChecked(true)
            return
          }
        } catch (e) {
          console.error('Erreur lors du parsing de l\'utilisateur', e)
        }
      }

      // Utilisateur pas authentifié pour une route protégée
      // Sauvegarder le compte courant dans savedAccounts avant de le supprimer
      const currentUser = localStorage.getItem('user')
      if (currentUser) {
        try {
          const userData = JSON.parse(currentUser)
          const currentSavedAccounts = localStorage.getItem('savedAccounts')
          let accounts = currentSavedAccounts ? JSON.parse(currentSavedAccounts) : []
          
          // Éviter les doublons
          accounts = accounts.filter(a => a.email !== userData.email)
          accounts.unshift(userData)
          
          localStorage.setItem('savedAccounts', JSON.stringify(accounts))
          console.log('✅ Compte sauvegardé dans savedAccounts avant logout')
        } catch (e) {
          console.error('Erreur lors de la sauvegarde du compte:', e)
        }
      }
      
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      
      setIsAuthenticated(false)
      setIsAuthChecked(true)

      // Rediriger vers account-picker au lieu de auth
      if (router.pathname !== '/account-picker' && router.pathname !== '/auth') {
        setIsRedirecting(true)
        router.replace('/account-picker')
      }
    }

    if (!router.isReady) return
    setIsRouterReady(true)
    checkAuthentication()
  }, [router.pathname, router.isReady])

  const toggleDarkMode = () => {
    const newMode = !darkMode
    setDarkMode(newMode)
    localStorage.setItem('unify-theme', newMode ? 'dark' : 'light')
    if (newMode) {
      document.body.classList.add('dark')
      document.body.setAttribute('data-theme', 'dark')
    } else {
      document.body.classList.remove('dark')
      document.body.setAttribute('data-theme', 'light')
    }
  }

  const handleSplashComplete = () => {
    setShowSplash(false)
    sessionStorage.setItem('unify-splash-shown', 'true')
  }

  useEffect(() => {
    if (isRedirecting && isPublicRoute(router.pathname)) {
      setIsRedirecting(false)
    }
  }, [isRedirecting, router.pathname])

  // Afficher un écran de chargement pendant la vérification d'authentification
  if (isRedirecting || !isRouterReady || (!isAuthChecked && !isPublicRoute(router.pathname))) {
    return (
      <div data-theme={darkMode ? 'dark' : 'light'} style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--fb-background-primary, #fff)'
      }}>
        <div style={{
          textAlign: 'center',
          color: 'var(--fb-text-primary, #000)'
        }}>
          <div style={{
            fontSize: '18px',
            fontWeight: 600,
            marginBottom: '20px'
          }}>
            Chargement...
          </div>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid var(--fb-border-color, #e0e0e0)',
            borderTop: '3px solid var(--primary-color, #007bff)',
            borderRadius: '50%',
            margin: '0 auto',
            animation: 'spin 1s linear infinite'
          }}></div>
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }

  return (
    <TranslationProvider>
      <AppProvider>
        {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
        <div data-theme={darkMode ? 'dark' : 'light'} style={{ minHeight: '100vh' }}>
          <Component
            {...pageProps}
            darkMode={darkMode}
            toggleDarkMode={toggleDarkMode}
          />
        </div>
      </AppProvider>
    </TranslationProvider>
  )
}
