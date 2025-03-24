// components/notifications/NotificationsDropdown.jsx
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  BellIcon, 
  CheckCircleIcon, 
  ExclamationCircleIcon, 
  InformationCircleIcon,
  UserIcon,
  CalendarIcon,
  BriefcaseIcon
} from '@heroicons/react/24/outline';

const NotificationsDropdown = ({ onClose }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Récupérer les notifications - ceci serait remplacé par un appel API réel
    const fetchNotifications = async () => {
      // Simuler un délai réseau
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Données fictives
      const mockNotifications = [
        {
          id: 'notif-1',
          type: 'interview_completed',
          title: 'Entretien terminé',
          message: 'L\'entretien avec Jean Durand pour le poste de Développeur Front-end est terminé.',
          date: '2025-03-22T14:30:00Z',
          read: false,
          link: '/interviews/int-123'
        },
        {
          id: 'notif-2',
          type: 'candidate_application',
          title: 'Nouvelle candidature',
          message: 'Marie Martin a postulé pour le poste de UX Designer.',
          date: '2025-03-22T10:15:00Z',
          read: false,
          link: '/candidates/cand-456'
        },
        {
          id: 'notif-3',
          type: 'interview_scheduled',
          title: 'Entretien planifié',
          message: 'Un entretien avec Philippe Dubois est planifié pour demain à 15h00.',
          date: '2025-03-21T18:45:00Z',
          read: true,
          link: '/interviews/int-789'
        },
        {
          id: 'notif-4',
          type: 'subscription_renewal',
          title: 'Renouvellement d\'abonnement',
          message: 'Votre abonnement Pro sera renouvelé dans 7 jours.',
          date: '2025-03-21T09:00:00Z',
          read: true,
          link: '/billing'
        },
        {
          id: 'notif-5',
          type: 'system',
          title: 'Maintenance prévue',
          message: 'Une maintenance système est prévue le 25 mars à 22h00 (UTC+1).',
          date: '2025-03-20T12:30:00Z',
          read: true,
          link: '/notifications'
        }
      ];
      
      setNotifications(mockNotifications);
      setLoading(false);
    };
    
    fetchNotifications();
    
    // Ajouter un gestionnaire de clic pour fermer le dropdown si l'utilisateur clique à l'extérieur
    const handleClickOutside = (event) => {
      const dropdown = document.getElementById('notifications-dropdown');
      if (dropdown && !dropdown.contains(event.target) && !event.target.closest('button[aria-label="Voir les notifications"]')) {
        onClose();
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);
  
  // Marquer une notification comme lue
  const markAsRead = (notificationId) => {
    setNotifications(prevNotifications =>
      prevNotifications.map(notification =>
        notification.id === notificationId
          ? { ...notification, read: true }
          : notification
      )
    );
    
    // Ici, vous enverriez une requête à l'API pour marquer la notification comme lue
  };
  
  // Marquer toutes les notifications comme lues
  const markAllAsRead = () => {
    setNotifications(prevNotifications =>
      prevNotifications.map(notification => ({ ...notification, read: true }))
    );
    
    // Ici, vous enverriez une requête à l'API pour marquer toutes les notifications comme lues
  };
  
  // Obtenir l'icône appropriée en fonction du type de notification
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'interview_completed':
        return <CheckCircleIcon className="h-6 w-6 text-green-500" />;
      case 'interview_scheduled':
        return <CalendarIcon className="h-6 w-6 text-blue-500" />;
      case 'candidate_application':
        return <UserIcon className="h-6 w-6 text-indigo-500" />;
      case 'subscription_renewal':
        return <ExclamationCircleIcon className="h-6 w-6 text-yellow-500" />;
      case 'job_position':
        return <BriefcaseIcon className="h-6 w-6 text-purple-500" />;
      case 'system':
        return <InformationCircleIcon className="h-6 w-6 text-gray-500" />;
      default:
        return <BellIcon className="h-6 w-6 text-gray-400" />;
    }
  };
  
  // Formater la date de la notification
  const formatNotificationDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffSec < 60) {
      return 'À l\'instant';
    } else if (diffMin < 60) {
      return `Il y a ${diffMin} min`;
    } else if (diffHours < 24) {
      return `Il y a ${diffHours}h`;
    } else if (diffDays === 1) {
      return 'Hier';
    } else if (diffDays < 7) {
      return `Il y a ${diffDays}j`;
    } else {
      return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }
  };
  
  const unreadCount = notifications.filter(notification => !notification.read).length;
  
  return (
    <div id="notifications-dropdown" className="origin-top-right absolute right-0 mt-2 w-96 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50" role="menu" aria-orientation="vertical">
      <div className="py-3 px-4 border-b border-gray-200 flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Notifications</h3>
        <div className="flex items-center space-x-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-sm text-primary-600 hover:text-primary-800 font-medium"
            >
              Tout marquer comme lu
            </button>
          )}
          <Link href="/notifications">
            <a className="text-sm text-gray-600 hover:text-gray-800">
              Voir tout
            </a>
          </Link>
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {loading ? (
          <div className="py-12 px-4 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-500">Chargement des notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-12 px-4 text-center">
            <BellIcon className="h-12 w-12 text-gray-300 mx-auto" />
            <p className="mt-2 text-sm text-gray-500">Aucune notification à afficher</p>
          </div>
        ) : (
          <ul role="list" className="divide-y divide-gray-200">
            {notifications.map(notification => (
              <li key={notification.id} className={`${!notification.read ? 'bg-primary-50' : ''} hover:bg-gray-50`}>
                <Link href={notification.link}>
                  <a 
                    className="block px-4 py-3"
                    onClick={() => !notification.read && markAsRead(notification.id)}
                  >
                    <div className="flex items-start">
                      <div className="flex-shrink-0 mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="ml-3 flex-1">
                        <div className="flex items-center justify-between">
                          <p className={`text-sm font-medium ${!notification.read ? 'text-gray-900' : 'text-gray-700'}`}>
                            {notification.title}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatNotificationDate(notification.date)}
                          </p>
                        </div>
                        <p className={`text-sm ${!notification.read ? 'text-gray-700' : 'text-gray-500'}`}>
                          {notification.message}
                        </p>
                      </div>
                    </div>
                  </a>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
      
      <div className="py-2 px-4 border-t border-gray-200 text-center">
        <Link href="/notifications/settings">
          <a className="text-sm text-gray-600 hover:text-gray-800">
            Paramètres de notification
          </a>
        </Link>
      </div>
    </div>
  );
};

export default NotificationsDropdown;