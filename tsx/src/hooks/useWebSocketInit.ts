import { useAuth } from "@/provider/auth";
import { useEffect } from "react";
import websocketService from "./websocket-service";

/**
 * Hook pour initialiser et gérer la connexion WebSocket
 * Doit être utilisé dans un composant qui est enfant de AuthProvider
 */
const useWebSocketInit = () => {
    const { user, isAuthenticated } = useAuth();
    
    useEffect(() => {
      // Connecter les WebSockets lorsque l'utilisateur est authentifié
      if (isAuthenticated && user?.id) {
        const token = localStorage.getItem('token');
        
        if (token) {
          websocketService.connect(user.id, token)
            .catch(error => {
              console.error('Erreur lors de la connexion WebSocket:', error);
            });
        }
      }
      
      // Déconnecter les WebSockets lors du démontage du composant
      return () => {
        websocketService.disconnect();
      };
    }, [isAuthenticated, user]);
    
    return websocketService;
  };
  
  export default useWebSocketInit;