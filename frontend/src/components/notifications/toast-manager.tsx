// components/notifications/ToastManager.tsx
import { useState, useEffect } from 'react';
import NotificationToast from './notification-toast';
import Notification from '@/types/notification';

/**
 * Composant qui gère l'affichage des notifications toast
 * Doit être placé à la racine de l'application (_app.tsx)
 */
const ToastManager: React.FC = () => {
  const [toasts, setToasts] = useState<Notification[]>([]);

  useEffect(() => {
    // Créer un écouteur d'événements personnalisé pour les nouvelles notifications
    const handleNewNotification = (event: CustomEvent<Notification>) => {
      const notification = event.detail;
      
      // Ajouter la notification à la pile
      setToasts(prevToasts => [notification, ...prevToasts].slice(0, 5)); // Limiter à 5 notifications maximum
    };
    
    // Écouter l'événement personnalisé
    window.addEventListener('NEW_NOTIFICATION', handleNewNotification as EventListener);
    
    // Nettoyer l'écouteur lors du démontage du composant
    return () => {
      window.removeEventListener('NEW_NOTIFICATION', handleNewNotification as EventListener);
    };
  }, []);

  // Supprimer une notification de la pile
  const removeToast = (id: string): void => {
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
  };

  // Si aucune notification, ne rien rendre
  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="assertive"
      className="fixed z-50 inset-0 flex flex-col items-end px-4 py-6 pointer-events-none sm:p-6"
    >
      <div className="flex flex-col space-y-4 items-end">
        {toasts.map((toast) => (
          <NotificationToast 
            key={toast.id} 
            notification={toast} 
            onClose={() => removeToast(toast.id)} 
            autoClose={true} 
          />
        ))}
      </div>
    </div>
  );
};

/**
 * Fonction utilitaire pour envoyer une notification toast
 * 
 * @param {Notification} notification - L'objet notification à afficher
 */
export const showToast = (notification: Notification): void => {
  // Créer un événement personnalisé avec les détails de la notification
  const event = new CustomEvent('NEW_NOTIFICATION', { detail: notification });
  
  // Déclencher l'événement
  window.dispatchEvent(event);
};

// Extension de l'interface WindowEventMap pour le typage des événements personnalisés
declare global {
  interface WindowEventMap {
    NEW_NOTIFICATION: CustomEvent<Notification>;
  }
}

export default ToastManager;