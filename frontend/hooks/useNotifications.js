// Hook personnalisé pour gérer les notifications
// /frontend/hooks/useNotifications.js
import { useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './useAuth';

export const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [socket, setSocket] = useState(null);
  const { user, token } = useAuth();

  // Initialisation de la connexion WebSocket
  useEffect(() => {
    if (!token) return;

    // Création de la connexion Socket.IO
    const socketInstance = io(process.env.NEXT_PUBLIC_API_URL, {
      path: '/socket.io',
      auth: {
        token
      }
    });

    socketInstance.on('connect', () => {
      console.log('Connecté au serveur WebSocket');
    });

    socketInstance.on('disconnect', () => {
      console.log('Déconnecté du serveur WebSocket');
    });

    // Écoute des nouvelles notifications
    socketInstance.on('new_notification', (notification) => {
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(count => count + 1);
      
      // Afficher une notification système si supporté par le navigateur
      if (Notification && Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/notification-icon.png'
        });
      }
    });

    setSocket(socketInstance);

    // Nettoyage à la déconnexion
    return () => {
      if (socketInstance) {
        socketInstance.disconnect();
      }
    };
  }, [token]);

  // Récupération des notifications depuis l'API
  const fetchNotifications = useCallback(async () => {
    if (!token) return;
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/notifications`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications);
        setUnreadCount(data.unread_count);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des notifications:', error);
    }
  }, [token]);

  // Marquer les notifications comme lues
  const markAsRead = useCallback(async (notificationId = null) => {
    if (!token) return;
    
    try {
      const endpoint = notificationId 
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/notifications/${notificationId}/read` 
        : `${process.env.NEXT_PUBLIC_API_URL}/api/notifications/read-all`;
        
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        if (notificationId) {
          setNotifications(prev => prev.map(n => 
            n.id === notificationId ? { ...n, read: true } : n
          ));
          setUnreadCount(count => Math.max(0, count - 1));
        } else {
          setNotifications(prev => prev.map(n => ({ ...n, read: true })));
          setUnreadCount(0);
        }
      }
    } catch (error) {
      console.error('Erreur lors du marquage des notifications comme lues:', error);
    }
  }, [token]);

  // Supprimer une notification
  const deleteNotification = useCallback(async (notificationId) => {
    if (!token) return;
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        // Mise à jour du compteur si la notification n'était pas lue
        const wasUnread = notifications.find(n => n.id === notificationId && !n.read);
        if (wasUnread) {
          setUnreadCount(count => Math.max(0, count - 1));
        }
      }
    } catch (error) {
      console.error('Erreur lors de la suppression de la notification:', error);
    }
  }, [token, notifications]);

  // Demander la permission pour les notifications système
  const requestNotificationPermission = useCallback(async () => {
    if (Notification && Notification.permission !== 'granted') {
      try {
        const permission = await Notification.requestPermission();
        return permission;
      } catch (error) {
        console.error('Erreur lors de la demande de permission:', error);
        return null;
      }
    }
    return Notification.permission;
  }, []);

  // Charge les notifications au montage du composant
  useEffect(() => {
    if (token) {
      fetchNotifications();
    }
  }, [fetchNotifications, token]);

  return {
    notifications,
    unreadCount,
    fetchNotifications,
    markAsRead,
    deleteNotification,
    requestNotificationPermission
  };
};