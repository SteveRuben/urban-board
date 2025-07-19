// frontend/contexts/NotificationContext.tsx
import React, { createContext, useState, useContext, useEffect, useCallback, ReactNode } from 'react';
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react';
import type Notification  from '@/types/notification';
import axios from 'axios';
import { ApiClient } from '@/lib/api-client';

// Types
interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
  duration: number;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  toasts: Toast[];
  showToast: (type: Toast['type'], message: string, duration?: number) => void;
  removeToast: (id: string) => void;
  fetchNotifications: (filter?: string, forceRefresh?: boolean) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  addNotification: (notification: Notification) => void;
  refreshNotifications: () => Promise<void>;
}

interface ToastProps {
  type: Toast['type'];
  message: string;
  onClose: () => void;
}

interface NotificationProviderProps {
  children: ReactNode;
}

// Création du contexte
const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Hook personnalisé pour utiliser le contexte
export const useNotification = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications doit être utilisé à l\'intérieur de NotificationProvider');
  }
  return context;
};

// Composant Toast pour afficher les notifications
const Toast: React.FC<ToastProps> = ({ type, message, onClose }) => {
  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'info':
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'info':
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  return (
    <div className={`flex items-center p-4 mb-3 rounded-md shadow-sm border ${getBackgroundColor()}`}>
      <div className="flex-shrink-0">{getIcon()}</div>
      <div className="ml-3 flex-1">
        <p className="text-sm text-gray-800">{message}</p>
      </div>
      <button
        type="button"
        className="ml-auto flex-shrink-0 inline-flex text-gray-400 hover:text-gray-500 focus:outline-none"
        onClick={onClose}
      >
        <X className="h-5 w-5" />
      </button>
    </div>
  );
};

// Fournisseur du contexte
export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fonction pour obtenir le jeton d'accès frais
  const getAccessToken = (): string | null => {
    return localStorage.getItem('accessToken');
  };

  // Fonction pour vérifier si une réponse indique un problème d'authentification
  const isAuthError = (status: number): boolean => {
    return status === 401 || status === 403;
  };

  // Charger les notifications
  const fetchNotifications = useCallback(async (filter: string = 'all', forceRefresh: boolean = false): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      // Construire l'URL avec les paramètres
      let url = '/api/notifications';
      const params = new URLSearchParams();
      
      if (filter !== 'all') {
        params.append('filter', filter);
      }
      
      // Ajouter un paramètre timestamp pour éviter la mise en cache
      if (forceRefresh) {
        params.append('_t', Date.now().toString());
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      // Obtenir le jeton d'accès au moment de la requête
      const token = getAccessToken();
      
      if (!token) {
        throw new Error('Aucun jeton d\'authentification trouvé');
      }
      
      const response = await fetch(url, {
        headers: {
          'Authorization': 'Bearer ' + token,
          'accept': 'application/json',
        },
        cache: 'no-store'
      });

      if (isAuthError(response.status)) {
        // Si problème d'authentification, notifier l'utilisateur
        showToast('error', 'Session expirée. Veuillez vous reconnecter.');
        // Ici, vous pourriez également déclencher une déconnexion ou rafraîchir le token
        throw new Error('Erreur d\'authentification');
      }

      if (!response.ok) throw new Error('Erreur lors du chargement des notifications');
 
      const data = await response.json();
      setNotifications(data);
      updateUnreadCount(data);
     } catch (err: any) {
      console.error('Erreur:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fonction pour afficher une notification toast
  const showToast = useCallback((type: Toast['type'], message: string, duration: number = 4000): void => {
    const id = Date.now().toString();

    // Ajouter le nouveau toast
    setToasts(prevToasts => [...prevToasts, { id, type, message, duration }]);

    // Supprimer le toast après la durée spécifiée
    setTimeout(() => {
      setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
    }, duration);
  }, []);

  // Fonction pour supprimer un toast spécifique
  const removeToast = useCallback((id: string): void => {
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
  }, []);

  // Mettre à jour le compteur de notifications non lues
  const updateUnreadCount = (notifs: Notification[] = notifications): void => {
    const count = notifs.filter(notif => !notif.read).length;
    setUnreadCount(count);
  };

  // Charger les notifications au premier rendu
  useEffect(() => {
    fetchNotifications('all', true);

    // Optionnel: configuration d'un polling pour les mises à jour en temps réel
    const interval = setInterval(() => {
      fetchNotifications('all', true);
    }, 60000); // Toutes les minutes

    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Function pour créer des entêtes d'authentification
  const getAuthHeaders = (): Record<string, string> => {
    const token = getAccessToken();
    return {
      'Authorization': `Bearer ${token || ''}`,
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    };
  };

  // Marquer une notification comme lue
  const markAsRead = async (id: string): Promise<void> => {
    try {
      const response = await fetch(`/api/notifications/${id}/read`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        cache: 'no-store'
      });

      if (isAuthError(response.status)) {
        showToast('error', 'Session expirée. Veuillez vous reconnecter.');
        throw new Error('Erreur d\'authentification');
      }

      if (!response.ok) throw new Error('Erreur lors de la mise à jour');

      // Mise à jour locale
      const updatedNotifications = notifications.map(notif =>
        notif.id === id ? { ...notif, read: true } : notif
      );
      setNotifications(updatedNotifications);
      updateUnreadCount(updatedNotifications);
    } catch (err: any) {
      console.error('Erreur:', err);
      setError(err.message);
    }
  };

  // Marquer toutes les notifications comme lues
  const markAllAsRead = async (): Promise<void> => {
    try {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'PUT',
        headers: getAuthHeaders(),
        cache: 'no-store'
      });

      if (isAuthError(response.status)) {
        showToast('error', 'Session expirée. Veuillez vous reconnecter.');
        throw new Error('Erreur d\'authentification');
      }

      if (!response.ok) throw new Error('Erreur lors de la mise à jour');

      // Mise à jour locale
      const updatedNotifications = notifications.map(notif => ({ ...notif, read: true }));
      setNotifications(updatedNotifications);
      setUnreadCount(0);
    } catch (err: any) {
      console.error('Erreur:', err);
      setError(err.message);
    }
  };

  // Supprimer une notification
  const deleteNotification = async (id: string): Promise<void> => {
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        cache: 'no-store'
      });

      if (isAuthError(response.status)) {
        showToast('error', 'Session expirée. Veuillez vous reconnecter.');
        throw new Error('Erreur d\'authentification');
      }

      if (!response.ok) throw new Error('Erreur lors de la suppression');

      // Mise à jour locale
      const updatedNotifications = notifications.filter(notif => notif.id !== id);
      setNotifications(updatedNotifications);
      updateUnreadCount(updatedNotifications);
    } catch (err: any) {
      console.error('Erreur:', err);
      setError(err.message);
    }
  };

  // Ajouter une nouvelle notification (utile pour les tests ou les notifications temps réel)
  const addNotification = (notification: Notification): void => {
    setNotifications(prev => [notification, ...prev]);
    if (!notification.read) {
      setUnreadCount(prev => prev + 1);
    }
  };

  // Fonction pour rafraîchir manuellement les notifications
  const refreshNotifications = (): Promise<void> => {
    return fetchNotifications('all', true);
  };

  // Exposer les valeurs et fonctions à travers le contexte
  const value: NotificationContextType = {
    notifications,
    unreadCount,
    loading,
    error,
    toasts,
    showToast,
    removeToast,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    addNotification,
    refreshNotifications
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <div className="fixed bottom-0 right-0 p-4 z-50">
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            type={toast.type}
            message={toast.message}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

export default NotificationProvider;