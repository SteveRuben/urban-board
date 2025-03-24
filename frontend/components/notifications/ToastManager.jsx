// components/notifications/ToastManager.jsx
import { useState, useEffect } from 'react';
import NotificationToast from './NotificationToast';

/**
 * Composant qui gère l'affichage des notifications toast
 * Doit être placé à la racine de l'application (_app.js)
 */
const ToastManager = () => {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    // Créer un écouteur d'événements personnalisé pour les nouvelles notifications
    const handleNewNotification = (event) => {
      const notification = event.detail;
      
      // Ajouter la notification à la pile
      setToasts(prevToasts => [notification, ...prevToasts].slice(0, 5)); // Limiter à 5 notifications maximum
    };
    
    // Écouter l'événement personnalisé
    window.addEventListener('NEW_NOTIFICATION', handleNewNotification);
    
    // Nettoyer l'écouteur lors du démontage du composant
    return () => {
      window.removeEventListener('NEW_NOTIFICATION', handleNewNotification);
    };
  }, []);

  // Supprimer une notification de la pile
  const removeToast = (id) => {
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
            onClose={removeToast} 
            autoClose={5000} 
          />
        ))}
      </div>
    </div>
  );
};

/**
 * Fonction utilitaire pour envoyer une notification toast
 * 
 * @param {Object} notification - L'objet notification à afficher
 * @param {string} notification.id - Identifiant unique de la notification
 * @param {string} notification.type - Type de notification
 * @param {string} notification.title - Titre de la notification
 * @param {string} notification.message - Message de la notification
 * @param {string} notification.link - Lien vers lequel rediriger lorsque l'utilisateur clique sur la notification
 */
export const showToast = (notification) => {
  // Créer un événement personnalisé avec les détails de la notification
  const event = new CustomEvent('NEW_NOTIFICATION', { detail: notification });
  
  // Déclencher l'événement
  window.dispatchEvent(event);
};

export default ToastManager;