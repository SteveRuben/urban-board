// components/auth/ProtectedRoute.jsx
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Composant d'ordre supérieur (HOC) pour protéger les routes nécessitant une authentification
 * 
 * @param {React.Component} Component - Le composant à protéger
 * @param {Object} options - Options supplémentaires
 * @returns {Function} - Un composant enveloppé qui vérifie l'authentification
 */
const withAuth = (Component, options = {}) => {
  const { requiredRole = null } = options;
  
  const ProtectedRoute = (props) => {
    const { isAuthenticated, loading, user } = useAuth();
    const router = useRouter();
    
    useEffect(() => {
      // Si l'authentification n'est pas en cours de chargement
      // et que l'utilisateur n'est pas authentifié, rediriger vers la page de connexion
      if (!loading && !isAuthenticated) {
        router.replace({
          pathname: '/auth/login',
          query: { returnUrl: router.asPath }
        });
      }
      
      // Vérifier le rôle si requis
      if (!loading && isAuthenticated && requiredRole && user?.role !== requiredRole) {
        router.replace('/dashboard');
      }
    }, [loading, isAuthenticated, router, user]);
    

    // Afficher un écran de chargement pendant la vérification
    if (loading || !isAuthenticated) {
      return (
        <div className="min-h-screen flex justify-center items-center bg-gray-50">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      );
    }
    
    // Si l'utilisateur n'a pas le rôle requis, ne pas afficher le composant
    if (requiredRole && user?.role !== requiredRole) {
      return null;
    }
    
    // L'utilisateur est authentifié, afficher le composant
    return <Component {...props} />;
  };
  
  // Copier les propriétés statiques du composant
  if (Component.getLayout) {
    ProtectedRoute.getLayout = Component.getLayout;
  }
  
  return ProtectedRoute;
};

export default withAuth;