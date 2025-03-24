// frontend/hooks/withAuth.jsx
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';

/**
 * Higher-Order Component (HOC) pour protéger les routes authentifiées
 * 
 * @param {React.ComponentType} Component - Composant à protéger
 * @param {Object} options - Options de configuration
 * @param {string} options.redirectTo - Chemin de redirection si non authentifié
 * @param {Array<string>} options.permissions - Permissions requises pour accéder au composant
 * @returns {React.ComponentType} - Composant protégé
 */
const withAuth = (Component, options = {}) => {
  const {
    redirectTo = '/auth/login',
    permissions = []
  } = options;
  
  const WithAuthGuard = (props) => {
    const { user, loading, initialized, hasPermission } = useAuth();
    const router = useRouter();
    const [isAuthorized, setIsAuthorized] = useState(false);
    
    useEffect(() => {
      // Attendre que l'authentification soit initialisée
      if (!initialized) return;
      
      // Si l'utilisateur n'est pas connecté, rediriger vers la page de connexion
      if (!loading && !user) {
        // Enregistrer l'URL actuelle pour rediriger après la connexion
        const currentPath = router.asPath;
        router.push({
          pathname: redirectTo,
          query: { redirect: currentPath }
        });
        return;
      }
      
      // Vérifier les permissions requises
      if (user && permissions.length > 0) {
        const authorized = permissions.every(permission => hasPermission(permission));
        
        if (!authorized) {
          // Rediriger vers une page d'accès refusé
          router.push('/access-denied');
          return;
        }
        
        setIsAuthorized(true);
      } else if (user) {
        // Utilisateur connecté sans vérification de permissions
        setIsAuthorized(true);
      }
    }, [user, loading, initialized, router]);
    
    // Afficher un indicateur de chargement pendant la vérification
    if (loading || !initialized || (!isAuthorized && user)) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      );
    }
    
    // Rendre le composant protégé si autorisé
    return isAuthorized ? <Component {...props} /> : null;
  };
  
  // Copier les propriétés statiques du composant d'origine
  if (Component.getInitialProps) {
    WithAuthGuard.getInitialProps = Component.getInitialProps;
  }
  
  return WithAuthGuard;
};

/**
 * HOC pour protéger les routes qui nécessitent un rôle administrateur
 * 
 * @param {React.ComponentType} Component - Composant à protéger
 * @returns {React.ComponentType} - Composant protégé
 */
export const withAdmin = (Component) => {
  return withAuth(Component, {
    permissions: ['admin']
  });
};

/**
 * HOC pour protéger les routes qui nécessitent un rôle recruteur
 * 
 * @param {React.ComponentType} Component - Composant à protéger
 * @returns {React.ComponentType} - Composant protégé
 */
export const withRecruiter = (Component) => {
  return withAuth(Component, {
    permissions: ['view_candidates', 'manage_interviews']
  });
};

export default withAuth;