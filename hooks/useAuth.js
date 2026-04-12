import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

/**
 * Hook pour vérifier l'authentification de l'utilisateur
 * Redirige vers /auth si l'utilisateur n'est pas connecté
 * @param {Array<string>} publicRoutes - Routes qui n'ont pas besoin d'authentification
 */
export function useAuth(publicRoutes = []) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Les routes publiques qui n'ont pas besoin d'authentification
    const defaultPublicRoutes = ['/auth', '/account-picker', '/terms', '/privacy', '/welcome', '/F', '/_error', '/404'];
    const allPublicRoutes = [...defaultPublicRoutes, ...publicRoutes];

    // Vérifier si la route actuelle est publique
    const isPublicRoute = allPublicRoutes.some(route => {
      if (route === '/auth' && router.asPath.startsWith('/auth')) return true;
      return router.pathname === route;
    });

    // Si c'est une route publique, pas besoin de vérifier l'authentification
    if (isPublicRoute) {
      setIsLoading(false);
      setIsAuthenticated(false);
      return;
    }

    // Vérifier le token et l'utilisateur dans localStorage
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');

    if (token && user) {
      try {
        // Vérifier que c'est un JSON valide
        const userData = JSON.parse(user);
        if (userData && userData.email) {
          setIsAuthenticated(true);
          setIsLoading(false);
          return;
        }
      } catch (e) {
        console.error('Erreur lors du parsing de l\'utilisateur', e);
      }
    }

    // Pas authentifié, nettoyer et rediriger
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('savedAccounts');

    // Rediriger vers /auth avec le message que la session a expiré
    router.push(`/auth?sessionExpired=true`);
    setIsLoading(false);
  }, [router.pathname, router.asPath]);

  return { isAuthenticated, isLoading };
}

/**
 * Hook pour vérifier si une route est publique
 * @param {string} pathname - Le pathname du router
 * @returns {boolean} - True si la route est publique
 */
export function isPublicRoute(pathname) {
  const publicRoutes = ['/auth', '/account-picker', '/terms', '/privacy', '/welcome', '/F', '/_error', '/404'];
  return publicRoutes.some(route => {
    if (route === '/auth') return pathname.startsWith('/auth');
    return pathname === route;
  });
}
