import { useState, useEffect, createContext, useContext } from 'react'

// Create translation context
const TranslationContext = createContext()

// Translation provider component
export function TranslationProvider({ children }) {
  const [translations, setTranslations] = useState({})
  const [loading, setLoading] = useState(true)

  // Load French translations
  const loadTranslations = async () => {
    try {
      setLoading(true)
      const response = await fetch('/locales/fr.json')
      if (response.ok) {
        const data = await response.json()
        setTranslations(data)
      } else {
        console.error('Failed to load French translations')
      }
    } catch (error) {
      console.error('Error loading translations:', error)
    } finally {
      setLoading(false)
    }
  }

  // Initialize with French translations
  useEffect(() => {
    loadTranslations()
  }, [])

  // Get translation by key path (e.g., "settings.title")
  const t = (key, params = {}) => {
    const keys = key.split('.')
    let value = translations
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k]
      } else {
        // Return key if translation not found
        return key
      }
    }
    
    // Replace parameters in translation string
    if (typeof value === 'string' && Object.keys(params).length > 0) {
      return Object.keys(params).reduce((str, param) => {
        return str.replace(new RegExp(`{${param}}`, 'g'), params[param])
      }, value)
    }
    
    return value
  }

  return (
    <TranslationContext.Provider value={{ locale: 'fr', t, loading }}>
      {children}
    </TranslationContext.Provider>
  )
}

// Hook to use translations
export function useTranslation() {
  const context = useContext(TranslationContext)
  if (!context) {
    throw new Error('useTranslation must be used within a TranslationProvider')
  }
  return context
}

export default useTranslation
