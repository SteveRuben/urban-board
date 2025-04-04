// frontend/pages/notifications/index.jsx
import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { 
  BellIcon, 
  CheckCircleIcon, 
  ExclamationCircleIcon, 
  InformationCircleIcon,
  UserIcon,
  CalendarIcon,
  BriefcaseIcon,
  TrashIcon,
  FunnelIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';
import axios from 'axios';

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all', 'unread', 'read'
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedNotifications, setSelectedNotifications] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoading(true);
        
        // En environnement de développement, utiliser des données fictives
        if (process.env.NODE_ENV === 'development') {
          await new Promise(resolve => setTimeout(resolve, 1000)); // Simuler un délai réseau
          
          const mockNotifications = generateMockNotifications();
          setNotifications(mockNotifications);
        } else {
          // En production, appeler l'API
          const response = await axios.get('/api/notifications');
          setNotifications(response.data);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Erreur lors du chargement des notifications:', err);
        setError('Impossible de charger les notifications. Veuillez réessayer.');
        setLoading(false);
      }
    };
    
    fetchNotifications();
  }, []);

  // Générer des notifications fictives pour le développement
  const generateMockNotifications = () => {
    const types = [
      'interview_completed', 
      'interview_scheduled', 
      'candidate_application', 
      'subscription_renewal', 
      'system', 
      'job_position',
      'biometric_analysis',
      'collaboration'
    ];
    
    const notifications = [];
    const now = new Date();
    
    // Créer 20 notifications fictives avec dates variées
    for (let i = 0; i < 20; i++) {
      const type = types[Math.floor(Math.random() * types.length)];
      const date = new Date();
      date.setHours(now.getHours() - Math.floor(Math.random() * 168)); // Jusqu'à une semaine en arrière
      
      let title, message, link;
      
      switch (type) {
        case 'interview_completed':
          title = 'Entretien terminé';
          message = `L'entretien avec Candidat ${i + 1} pour le poste de ${['Développeur Front-end', 'Développeur Back-end', 'DevOps Engineer', 'Data Scientist'][i % 4]} est terminé.`;
          link = `/interviews/int-${100 + i}`;
          break;
        case 'interview_scheduled':
          title = 'Entretien planifié';
          message = `Un entretien avec Candidat ${i + 1} est planifié pour ${['demain', 'jeudi', 'vendredi', 'lundi prochain'][i % 4]} à ${10 + (i % 8)}h00.`;
          link = `/interviews/int-${100 + i}`;
          break;
        case 'candidate_application':
          title = 'Nouvelle candidature';
          message = `Candidat ${i + 1} a postulé pour le poste de ${['UX Designer', 'Product Manager', 'Front-end Developer', 'Marketing Specialist'][i % 4]}.`;
          link = `/candidates/cand-${200 + i}`;
          break;
        case 'subscription_renewal':
          title = 'Renouvellement d\'abonnement';
          message = `Votre abonnement ${['Starter', 'Pro', 'Enterprise'][i % 3]} sera renouvelé dans ${i + 1} jours.`;
          link = '/billing';
          break;
        case 'job_position':
          title = 'Nouveau poste créé';
          message = `Le poste de ${['UX Designer', 'Product Manager', 'Front-end Developer', 'Marketing Specialist'][i % 4]} a été créé par ${['Jean', 'Marie', 'Pierre', 'Sophie'][i % 4]}.`;
          link = `/positions/pos-${300 + i}`;
          break;
        case 'biometric_analysis':
          title = 'Analyse biométrique terminée';
          message = `L'analyse biométrique de l'entretien avec Candidat ${i + 1} est disponible.`;
          link = `/interviews/int-${100 + i}/biometrics`;
          break;
        case 'collaboration':
          title = 'Commentaire sur un entretien';
          message = `${['Jean', 'Marie', 'Pierre', 'Sophie'][i % 4]} a commenté l'entretien avec Candidat ${i + 1}.`;
          link = `/interviews/int-${100 + i}/collaboration`;
          break;
        case 'system':
          title = 'Information système';
          message = `${['Maintenance prévue', 'Mise à jour disponible', 'Nouvelle fonctionnalité', 'Optimisation de performance'][i % 4]} ${i % 2 === 0 ? 'prévue' : 'effectuée'} le ${now.getDate() + i % 7} mars.`;
          link = '/notifications';
          break;
        default:
          title = 'Notification';
          message = `Contenu de la notification ${i + 1}.`;
          link = '/notifications';
      }
      
      notifications.push({
        id: `notif-${i}`,
        type,
        title,
        message,
        date: date.toISOString(),
        read: i % 3 === 0 ? false : true, // 1/3 des notifications non lues
        link
      });
    }
    
    // Trier par date (plus récentes en premier)
    notifications.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    return notifications;
  };

  // Filtrer les notifications en fonction des critères
  const filteredNotifications = notifications.filter(notification => {
    // Filtre de lecture
    if (filter === 'unread' && notification.read) return false;
    if (filter === 'read' && !notification.read) return false;
    
    // Filtre de type
    if (typeFilter !== 'all' && notification.type !== typeFilter) return false;
    
    return true;
  });

  // Marquer une notification comme lue
  const markAsRead = async (notificationId) => {
    try {
      if (process.env.NODE_ENV === 'development') {
        // Simuler un appel API en dev
        setNotifications(prevNotifications =>
          prevNotifications.map(notification =>
            notification.id === notificationId
              ? { ...notification, read: true }
              : notification
          )
        );
      } else {
        // En production, appeler l'API
        await axios.put(`/api/notifications/${notificationId}/read`);
        
        // Mettre à jour l'état local
        setNotifications(prevNotifications =>
          prevNotifications.map(notification =>
            notification.id === notificationId
              ? { ...notification, read: true }
              : notification
          )
        );
      }
    } catch (err) {
      console.error('Erreur lors du marquage de la notification comme lue:', err);
      // Gérer l'erreur (afficher une notification d'erreur, etc.)
    }
  };

  // Marquer plusieurs notifications comme lues
  const markMultipleAsRead = async (notificationIds) => {
    try {
      if (process.env.NODE_ENV === 'development') {
        // Simuler un appel API en dev
        setNotifications(prevNotifications =>
          prevNotifications.map(notification =>
            notificationIds.includes(notification.id)
              ? { ...notification, read: true }
              : notification
          )
        );
      } else {
        // En production, appeler l'API
        await axios.put('/api/notifications/mark-multiple', { ids: notificationIds });
        
        // Mettre à jour l'état local
        setNotifications(prevNotifications =>
          prevNotifications.map(notification =>
            notificationIds.includes(notification.id)
              ? { ...notification, read: true }
              : notification
          )
        );
      }
      
      // Réinitialiser la sélection
      setSelectedNotifications([]);
      setSelectAll(false);
    } catch (err) {
      console.error('Erreur lors du marquage des notifications comme lues:', err);
      // Gérer l'erreur (afficher une notification d'erreur, etc.)
    }
  };

  // Supprimer une notification
  const deleteNotification = async (notificationId) => {
    try {
      if (process.env.NODE_ENV === 'development') {
        // Simuler un appel API en dev
        setNotifications(prevNotifications =>
          prevNotifications.filter(notification => notification.id !== notificationId)
        );
      } else {
        // En production, appeler l'API
        await axios.delete(`/api/notifications/${notificationId}`);
        
        // Mettre à jour l'état local
        setNotifications(prevNotifications =>
          prevNotifications.filter(notification => notification.id !== notificationId)
        );
      }
    } catch (err) {
      console.error('Erreur lors de la suppression de la notification:', err);
      // Gérer l'erreur (afficher une notification d'erreur, etc.)
    }
  };

  // Supprimer plusieurs notifications
  const deleteMultiple = async (notificationIds) => {
    try {
      if (process.env.NODE_ENV === 'development') {
        // Simuler un appel API en dev
        setNotifications(prevNotifications =>
          prevNotifications.filter(notification => !notificationIds.includes(notification.id))
        );
      } else {
        // En production, appeler l'API
        await axios.delete('/api/notifications', { data: { ids: notificationIds } });
        
        // Mettre à jour l'état local
        setNotifications(prevNotifications =>
          prevNotifications.filter(notification => !notificationIds.includes(notification.id))
        );
      }
      
      // Réinitialiser la sélection
      setSelectedNotifications([]);
      setSelectAll(false);
    } catch (err) {
      console.error('Erreur lors de la suppression des notifications:', err);
      // Gérer l'erreur (afficher une notification d'erreur, etc.)
    }
  };

  // Gérer la sélection d'une notification
  const toggleNotificationSelection = (notificationId) => {
    setSelectedNotifications(prevSelected => {
      if (prevSelected.includes(notificationId)) {
        return prevSelected.filter(id => id !== notificationId);
      } else {
        return [...prevSelected, notificationId];
      }
    });
  };

  // Gérer la sélection de toutes les notifications
  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedNotifications([]);
    } else {
      setSelectedNotifications(filteredNotifications.map(notification => notification.id));
    }
    setSelectAll(!selectAll);
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
      case 'biometric_analysis':
        return <UserIcon className="h-6 w-6 text-teal-500" />;
      case 'collaboration':
        return <EnvelopeIcon className="h-6 w-6 text-pink-500" />;
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
      return date.toLocaleDateString('fr-FR', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  // Obtenir le nom lisible pour le type de notification
  const getNotificationTypeName = (type) => {
    switch (type) {
      case 'interview_completed':
        return 'Entretien terminé';
      case 'interview_scheduled':
        return 'Entretien planifié';
      case 'candidate_application':
        return 'Candidature';
      case 'subscription_renewal':
        return 'Abonnement';
      case 'job_position':
        return 'Poste';
      case 'biometric_analysis':
        return 'Analyse biométrique';
      case 'collaboration':
        return 'Collaboration';
      case 'system':
        return 'Système';
      default:
        return 'Autre';
    }
  };

  return (
    <>
      <Head>
        <title>Notifications - RecruteIA</title>
        <meta name="description" content="Centre de notifications de RecruteIA" />
      </Head>

      <div className="bg-gray-50 py-6 min-h-screen">
        <div className="container mx-auto px-4">
          {/* En-tête et filtres */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">Notifications</h1>
              <p className="text-gray-600">Gérez et suivez toutes vos notifications</p>
            </div>
            
            <div className="mt-4 md:mt-0 flex flex-wrap gap-2">
              {selectedNotifications.length > 0 ? (
                <>
                  <button
                    onClick={() => markMultipleAsRead(selectedNotifications)}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-black bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    <CheckCircleIcon className="h-4 w-4 mr-1" />
                    Marquer comme lu
                  </button>
                  <button
                    onClick={() => deleteMultiple(selectedNotifications)}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    <TrashIcon className="h-4 w-4 mr-1" />
                    Supprimer
                  </button>
                </>
              ) : (
                <button
                  onClick={() => markMultipleAsRead(notifications.filter(n => !n.read).map(n => n.id))}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-black bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  disabled={!notifications.some(n => !n.read)}
                >
                  <CheckCircleIcon className="h-4 w-4 mr-1" />
                  Tout marquer comme lu
                </button>
              )}
              
              <div className="relative inline-block text-left">
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="block pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                >
                  <option value="all">Tous</option>
                  <option value="unread">Non lus</option>
                  <option value="read">Lus</option>
                </select>
              </div>
              
              <div className="relative inline-block text-left">
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="block pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                >
                  <option value="all">Tous les types</option>
                  <option value="interview_completed">Entretiens terminés</option>
                  <option value="interview_scheduled">Entretiens planifiés</option>
                  <option value="candidate_application">Candidatures</option>
                  <option value="job_position">Postes</option>
                  <option value="biometric_analysis">Analyses biométriques</option>
                  <option value="collaboration">Collaboration</option>
                  <option value="subscription_renewal">Abonnement</option>
                  <option value="system">Système</option>
                </select>
              </div>
            </div>
          </div>

          {/* Liste des notifications */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            {loading ? (
              <div className="py-20 px-4 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600 mx-auto"></div>
                <p className="mt-4 text-gray-500">Chargement des notifications...</p>
              </div>
            ) : error ? (
              <div className="py-20 px-4 text-center">
                <ExclamationCircleIcon className="h-12 w-12 text-red-500 mx-auto" />
                <p className="mt-4 text-red-500">{error}</p>
                <button 
                  onClick={() => window.location.reload()} 
                  className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-black bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Réessayer
                </button>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="py-20 px-4 text-center">
                <BellIcon className="h-12 w-12 text-gray-300 mx-auto" />
                <p className="mt-4 text-gray-500">Aucune notification à afficher</p>
              </div>
            ) : (
              <>
                <div className="border-b border-gray-200">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-10">
                          <div className="flex items-center">
                            <input
                              id="select-all"
                              name="select-all"
                              type="checkbox"
                              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                              checked={selectAll}
                              onChange={toggleSelectAll}
                            />
                          </div>
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Notification
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32 hidden sm:table-cell">
                          Type
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32 hidden md:table-cell">
                          Date
                        </th>
                        <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredNotifications.map((notification) => (
                        <tr 
                          key={notification.id} 
                          className={`${!notification.read ? 'bg-primary-50' : ''} hover:bg-gray-50`}
                        >
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <input
                                id={`select-${notification.id}`}
                                name={`select-${notification.id}`}
                                type="checkbox"
                                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                                checked={selectedNotifications.includes(notification.id)}
                                onChange={() => toggleNotificationSelection(notification.id)}
                              />
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-start">
                              <div className="flex-shrink-0 mt-0.5 mr-3">
                                {getNotificationIcon(notification.type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <Link href={notification.link}>
                                  <a
                                    className="block"
                                    onClick={() => !notification.read && markAsRead(notification.id)}
                                  >
                                    <p className={`text-sm font-medium truncate ${!notification.read ? 'text-gray-900' : 'text-gray-700'}`}>
                                      {notification.title}
                                    </p>
                                    <p className={`text-sm truncate ${!notification.read ? 'text-gray-700' : 'text-gray-500'}`}>
                                      {notification.message}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1 md:hidden">
                                      {formatNotificationDate(notification.date)}
                                    </p>
                                  </a>
                                </Link>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap hidden sm:table-cell">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              {getNotificationTypeName(notification.type)}
                            </span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">
                            {formatNotificationDate(notification.date)}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end">
                              {!notification.read && (
                                <button
                                  onClick={() => markAsRead(notification.id)}
                                  className="text-primary-600 hover:text-primary-900 mr-3"
                                  title="Marquer comme lu"
                                >
                                  <CheckCircleIcon className="h-5 w-5" />
                                </button>
                              )}
                              <button
                                onClick={() => deleteNotification(notification.id)}
                                className="text-gray-400 hover:text-red-600"
                                title="Supprimer"
                              >
                                <TrashIcon className="h-5 w-5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>

          {/* Lien vers les paramètres de notification */}
          <div className="mt-6 text-right">
            <Link href="/notifications/settings">
              <a className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                Paramètres de notification
              </a>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

NotificationsPage.getLayout = (page) => <DashboardLayout>{page}</DashboardLayout>;

export default NotificationsPage;