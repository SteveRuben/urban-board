// frontend/components/notifications/ToastContainer.jsx
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import NotificationToast from './notification-toast';
import { useNotifications } from '@/hooks/useNotifications';
import Notification,{ Toast } from '@/types/notification';

const ToastContainer: React.FC = () => {
    const [toasts, setToasts] = useState<Toast[]>([]);
    const [isBrowser, setIsBrowser] = useState<boolean>(false);
    const { notifications= [], markAsRead } = useNotifications();
    
    // Vérifier si nous sommes côté client
    useEffect(() => {
      setIsBrowser(true);
    }, []);
  
    // Surveiller les nouvelles notifications pour créer des toasts
    useEffect(() => {
      // Vérifier s'il y a de nouvelles notifications non lues
      const unreadNotifications = notifications.filter(
        notif => !notif?.read && !toasts.some(toast => toast.id === notif.id)
      );
      
      if (unreadNotifications.length > 0) {
        // Ajouter de nouveaux toasts pour les notifications non lues
        setToasts(prev => [
          ...prev,
          ...unreadNotifications.map(notif => ({
            id: notif.id,
            notification: notif,
            timestamp: Date.now()
          }))
        ]);
      }
    }, [notifications, toasts]);
  
    // Supprimer un toast
    const removeToast = (id: string): void => {
      setToasts(toasts.filter(toast => toast.id !== id));
      // Optionnel: Marquer comme lu quand le toast est fermé
      markAsRead(id);
    };
  
    // Ne rien render côté serveur
    if (!isBrowser) return null;
  
    // Utiliser createPortal pour rendre les toasts en dehors de la hiérarchie DOM normale
    return createPortal(
      <div className="fixed top-0 right-0 p-4 w-full md:max-w-sm z-50 space-y-4">
        {toasts.map((toast) => (
          <NotificationToast
            key={toast.id}
            notification={toast.notification}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>,
      document.body
    );
  };
  
  export default ToastContainer;