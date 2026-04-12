import { createContext, useContext, useMemo, useState, useEffect } from 'react';
import Toast from '../components/Toast';

export const AppContext = createContext();

const defaultPageAvatar = '/images/default-page.png';
const defaultPageCover = '/images/default-page.png';

function normalizePage(page) {
  if (!page) return null;

  return {
    ...page,
    id: page.id || page._id || Date.now() + Math.random(),
    cat: page.cat || page.category || 'Autre',
    avatar: page.avatar || page.profileImage || defaultPageAvatar,
    cover: page.cover || page.coverImage || defaultPageCover,
    likes: Number(page.likes || page.followers || page._count?.followers || 0),
    followers: Number(page.followers || page._count?.followers || 0),
    liked: Boolean(page.liked || page.following),
    managed: Boolean(page.managed || page.owner),
    description: page.description || '',
    website: page.website || '',
    phone: page.phone || '',
    type: page.type || page.privacy || 'Publique',
  };
}

export function AppProvider({ children }) {
  const [pages, setPages] = useState([]);
  const [toastMessage, setToastMessage] = useState(null);
  const [loadingPages, setLoadingPages] = useState(true);

  useEffect(() => {
    async function loadPagesFromAPI() {
      try {
        let userEmail = null;
        if (typeof window !== 'undefined') {
          const storedUser = localStorage.getItem('user');
          if (storedUser) {
            try {
              const userObj = JSON.parse(storedUser);
              userEmail = userObj?.email || null;
            } catch (e) {
              console.error('Failed to parse user:', e);
            }
          }
        }
        
        const url = userEmail 
          ? `/api/pages?userEmail=${encodeURIComponent(userEmail)}` 
          : '/api/pages';
        
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          const apiPages = Array.isArray(data.pages) ? data.pages : [];
          console.log('API response pages:', JSON.stringify(apiPages.map(p => ({ id: p.id, name: p.name, cover: p.cover, coverImage: p.coverImage }))));
          setPages(currentPages => {
            console.log('currentPages.length:', currentPages.length, 'apiPages count:', apiPages.length);
            if (currentPages.length === 0) return apiPages;
            const apiPagesMap = new Map(apiPages.map(p => [p.id || p._id, p]));
            console.log('API pages cover:', apiPages.map(p => ({ id: p.id, cover: p.cover, coverImage: p.coverImage })));
            return currentPages.map(currentPage => {
              const apiPage = apiPagesMap.get(currentPage.id);
              if (apiPage) {
                return {
                  ...apiPage,
                  avatar: currentPage.avatar || apiPage.avatar || apiPage.profileImage,
                  cover: currentPage.cover || apiPage.cover || apiPage.coverImage,
                };
              }
              return currentPage;
            });
          });
        }
      } catch (error) {
        console.error('Failed to load pages:', error);
      } finally {
        setLoadingPages(false);
      }
    }

    loadPagesFromAPI();
  }, []);

  const normalizedPages = useMemo(
    () => pages.map(normalizePage).filter(Boolean),
    [pages]
  );

  const togglePageLike = (pageId) => {
    setPages(currentPages => currentPages.map(page => {
      const normalizedPage = normalizePage(page);
      if (!normalizedPage || normalizedPage.id !== pageId) return page;

      const nextLiked = !normalizedPage.liked;
      const nextLikes = Math.max(0, normalizedPage.likes + (nextLiked ? 1 : -1));

      return {
        ...page,
        liked: nextLiked,
        likes: nextLikes,
      };
    }));
  };

  const addPage = (pageInput, categoryFallback) => {
    const pageData = typeof pageInput === 'string'
      ? { name: pageInput, category: categoryFallback }
      : (pageInput || {});
    const timestamp = Date.now();
    const newPage = {
      id: timestamp,
      name: pageData.name || 'Nouvelle page',
      cat: pageData.category || pageData.cat || 'Autre',
      category: pageData.category || pageData.cat || 'Autre',
      avatar: pageData.avatar || pageData.profileImage || defaultPageAvatar,
      cover: pageData.cover || pageData.coverImage || defaultPageCover,
      likes: 0,
      followers: 0,
      liked: false,
      managed: true,
      type: 'Page',
      description: pageData.description || '',
      website: pageData.website || '',
      phone: pageData.phone || '',
      posts: Array.isArray(pageData.posts) ? pageData.posts : [],
      createdAt: new Date().toISOString(),
    };

    setPages(currentPages => [newPage, ...currentPages]);
  };

  const updatePage = (pageId, updates) => {
    setPages(currentPages => currentPages.map(page => {
      const normalizedPage = normalizePage(page);
      if (!normalizedPage || normalizedPage.id !== pageId) return page;
      return { ...page, ...updates };
    }));
  };

  const refreshPages = async () => {
    setLoadingPages(true);
    try {
      let userEmail = null;
      if (typeof window !== 'undefined') {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          try {
            const userObj = JSON.parse(storedUser);
            userEmail = userObj?.email || null;
          } catch (e) {
            console.error('Failed to parse user:', e);
          }
        }
      }
      
      const url = userEmail 
        ? `/api/pages?userEmail=${encodeURIComponent(userEmail)}` 
        : '/api/pages';
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        const apiPages = Array.isArray(data.pages) ? data.pages : [];
        setPages(currentPages => {
          const apiPagesMap = new Map(apiPages.map(p => [p.id || p._id, p]));
          return currentPages.map(currentPage => {
            const apiPage = apiPagesMap.get(currentPage.id);
            if (apiPage) {
              return {
                ...currentPage,
                ...apiPage,
                avatar: currentPage.avatar || apiPage.avatar || apiPage.profileImage,
                cover: currentPage.cover || apiPage.cover || apiPage.coverImage,
              };
            }
            return currentPage;
          });
        });
      }
    } catch (error) {
      console.error('Failed to load pages:', error);
    } finally {
      setLoadingPages(false);
    }
  };

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <AppContext.Provider value={{
      pages: normalizedPages,
      loadingPages,
      refreshPages,
      togglePageLike,
      addPage,
      updatePage,
      showToast,
      toastMessage
    }}>
      {children}
      {toastMessage && (
        <Toast
          message={toastMessage}
          type="info"
          onClose={() => setToastMessage(null)}
        />
      )}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
