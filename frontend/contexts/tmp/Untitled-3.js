// frontend/components/notifications/NotificationCenter.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Bell, Filter, Check, Trash2 } from 'lucide-react';
import NotificationItem from './NotificationItem';

const NotificationCenter = () => {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all', 'unread', ou spécifique type
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);

  // Ferme le dropdown quand on clique à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Chargement initial des notifications
  useEffect(() => {
    fetchNotifications();
  }, [filter]);

  // Mise à jour du compteur de notifications non lues
  useEffect(() => {
    const count = notifications.filter(notif => !notif.is_read).length;
    setUnreadCount(count);
  }, [notifications]);

  // Fonction pour récupérer les notifications depuis l'API
  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      let url = '/api/notifications';
      if (filter !== 'all') {
        url += `?filter=${filter}`;
      }
      
      const response = await fetch(url);
      if (!response.ok) throw new Error('Erreur lors du chargement des notifications');
      
      const data = await response.json();
      setNotifications(data);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Marquer une notification comme lue
  const handleMarkAsRead = async (id) => {
    try {
      const response = await fetch(`/api/notifications/${id}/read`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) throw new Error('Erreur lors de la mise à jour');
      
      // Mise à jour locale pour éviter de refaire un appel API
      setNotifications(prevNotifications => 
        prevNotifications.map(notif => 
          notif.id === id ? { ...notif, is_read: true } : notif
        )
      );
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  // Marquer toutes les notifications comme lues
  const handleMarkAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) throw new Error('Erreur lors de la mise à jour');
      
      // Mise à jour locale
      setNotifications(prevNotifications => 
        prevNotifications.map(notif => ({ ...notif, is_read: true }))
      );
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  // Supprimer une notification
  const handleDelete = async (id) => {
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('Erreur lors de la suppression');
      
      // Mise à jour locale
      setNotifications(prevNotifications => 
        prevNotifications.filter(notif => notif.id !== id)
      );
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  // Toggle du dropdown
  const toggleDropdown = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      fetchNotifications();
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bouton de notification avec badge */}
      <button
        className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none"
        onClick={toggleDropdown}
      >
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-black transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown de notifications */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-md shadow-lg z-50 overflow-hidden border border-gray-200">
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Notifications</h3>
              <div className="flex space-x-2">
                <div className="relative">
                  <button
                    className="p-1 text-gray-500 hover:text-gray-700 focus:outline-none"
                    title="Filtrer"
                  >
                    <Filter className="h-5 w-5" />
                  </button>
                  {/* Le menu de filtre peut être ajouté ici */}
                </div>
                <button
                  className="p-1 text-gray-500 hover:text-gray-700 focus:outline-none"
                  title="Tout marquer comme lu"
                  onClick={handleMarkAllAsRead}
                >
                  <Check className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="flex justify-center items-center h-24">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : notifications.length > 0 ? (
              notifications.map(notification => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={handleMarkAsRead}
                  onDelete={handleDelete}
                />
              ))
            ) : (
              <div className="flex flex-col items-center justify-center p-6 text-center">
                <Bell className="h-12 w-12 text-gray-300 mb-2" />
                <p className="text-gray-500">Aucune notification pour le moment</p>
              </div>
            )}
          </div>

          <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 text-right">
            <button
              className="text-sm text-blue-600 hover:text-blue-800"
              onClick={() => window.location.href = '/notifications'}
            >
              Voir toutes les notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;