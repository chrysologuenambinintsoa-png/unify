import Layout from '../components/Layout'
import { UnifyPage, CreatePageForm, PagesList } from '../components/components/pages'
import { useState, useRef, useEffect } from 'react'

const MOCK_CURRENT_USER = {
  id: 'user-1',
  name: 'Mon Compte',
  avatar: '/api/placeholder/40/40',
  role: 'owner'
}

export default function PagesPage() {
  const [selectedPage, setSelectedPage] = useState(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [currentUser, setCurrentUser] = useState(null)
  const containerRef = useRef(null)

  useEffect(() => {
    const u = localStorage.getItem('user')
    if (u) setCurrentUser(JSON.parse(u))
    function onUserUpdated() {
      const v = localStorage.getItem('user')
      setCurrentUser(v ? JSON.parse(v) : null)
    }
    window.addEventListener('userUpdated', onUserUpdated)
    return () => window.removeEventListener('userUpdated', onUserUpdated)
  }, [])

  const handlePageCreated = (newPage) => {
    // Si la réponse API est { page: {...} }, extraire la page réelle
    const pageObj = newPage.page ? newPage.page : newPage;
    // Ajoute ownerEmail si absent mais user courant existe
    if (!pageObj.ownerEmail && currentUser?.email) {
      pageObj.ownerEmail = currentUser.email;
    }
    setSelectedPage(pageObj);
    setRefreshTrigger(prev => prev + 1);
  }

  const handlePageSelect = (page) => {
    setSelectedPage(page)
    // Scroll to top to show the page view
    containerRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handlePageClose = () => {
    setSelectedPage(null)
  }

  return (
    <Layout>
      <div ref={containerRef}>
        {selectedPage ? (
          // Show selected page detail view with back button
          <div className="page-detail-container">
            <button 
              className="back-button"
              onClick={handlePageClose}
              title="Retour aux pages"
            >
              <span>←</span> Retour
            </button>
            <UnifyPage page={selectedPage} currentUser={currentUser} onClose={handlePageClose} />
          </div>
        ) : (
          // Show pages list and create form
          <>
            <CreatePageForm 
              onPageCreated={handlePageCreated}
              user={currentUser}
            />
            <PagesList 
              onPageSelect={handlePageSelect}
              user={currentUser}
              refreshTrigger={refreshTrigger}
            />
          </>
        )}
      </div>
    </Layout>
  )
}