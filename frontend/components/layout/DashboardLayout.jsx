// components/layout/DashboardLayout.jsx
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import {
  Bars3Icon,
  XMarkIcon,
  BellIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import DashboardMenu from '../layout/DashboardMenu';
import NotificationsDropdown from '../../components/notifications/NotificationsDropdown';
import ToastManager from '../../components/notifications/ToastManager';
import ToastContainer from '../../components/notifications/ToastContainer';
import { NotificationProvider } from '../../contexts/NotificationContext';
import { useAuth } from '../../contexts/AuthContext';
import useWebSocketInit from '../../hooks/useWebSocketInit';


const DashboardLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const router = useRouter();
  const { user, loading, logout, isAuthenticated } = useAuth();
  const websocketService = useWebSocketInit();


  /* useEffect(() => {
    // Récupérer les informations utilisateur et les notifications
    // Cette fonction serait remplacée par un appel API réel
    const fetchUserData = async () => {
      // Simuler un appel API
      setTimeout(() => {
        setUnreadNotifications(3); // Exemple: 3 notifications non lues
      }, 1000);
    };
    
    fetchUserData();
    
    // Fermer la barre latérale sur les écrans plus petits lors du changement de route
    const handleRouteChange = () => {
      setSidebarOpen(false);
    };
    
    router.events.on('routeChangeComplete', handleRouteChange);
    
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router.events]); */

  useEffect(() => {
    // Rediriger vers la page de connexion si l'utilisateur n'est pas authentifié
    if (!loading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, loading, router]);

  useEffect(() => {
    // Récupérer le nombre de notifications non lues
    const fetchUnreadCount = async () => {
      try {

        const token = localStorage.getItem('accessToken');
        const response = await fetch('/api/notifications/unread-count', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setUnreadNotifications(data.unread_count);
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des notifications non lues:', error);
      }
    };

    if (isAuthenticated) {
      fetchUnreadCount();
    }

    // Écouteur pour les nouvelles notifications
    const handleNewNotification = () => {
      setUnreadNotifications(prevCount => prevCount + 1);
    };

    // S'abonner à l'événement de nouvelle notification
    websocketService.on('notification_received', handleNewNotification);
    window.addEventListener('NOTIFICATION_RECEIVED', handleNewNotification);

    // Fermer la barre latérale sur les écrans plus petits lors du changement de route
    const handleRouteChange = () => {
      setSidebarOpen(false);
    };

    router.events.on('routeChangeComplete', handleRouteChange);

    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
      websocketService.off('notification_received', handleNewNotification);
      window.removeEventListener('NOTIFICATION_RECEIVED', handleNewNotification);
    };
  }, [router.events, isAuthenticated, websocketService]);

  const toggleNotifications = () => {
    setNotificationsOpen(!notificationsOpen);

    // Réinitialiser le compteur de notifications non lues lorsque l'utilisateur ouvre la liste
    if (!notificationsOpen && unreadNotifications > 0) {
      setUnreadNotifications(0);
    }
  };

  // Si l'authentification est en cours de chargement, afficher un spinner
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-red-500">Vous devez être connecté pour accéder à cette page.</p>
      </div>
    );
  }

  return (
    <>
      <NotificationProvider>
        <div className="h-screen flex overflow-hidden bg-gray-100">
          {/* Barre latérale mobile */}
          <div className={`${sidebarOpen ? 'fixed' : 'hidden'} inset-0 flex z-40 md:hidden`}>
            {/* Arrière-plan pour fermer la barre latérale */}
            <div
              className={`fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity ease-in-out duration-300 ${sidebarOpen ? 'opacity-100' : 'opacity-0'
                }`}
              aria-hidden="true"
              onClick={() => setSidebarOpen(false)}
            ></div>

            {/* Barre latérale */}
            <div className={`relative flex-1 flex flex-col max-w-xs w-full bg-white transition ease-in-out duration-300 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
              }`}>
              {/* Bouton de fermeture */}
              <div className="absolute top-0 right-0 -mr-12 pt-2">
                <button
                  type="button"
                  className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                  onClick={() => setSidebarOpen(false)}
                >
                  <span className="sr-only">Fermer la barre latérale</span>
                  <XMarkIcon className="h-6 w-6 text-black" aria-hidden="true" />
                </button>
              </div>

              {/* Logo et menu */}
              <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
                <div className="px-4">
                  <Link href="/dashboard" legacyBehavior>
                    <a className="flex items-center">
                      <span className="text-xl font-bold text-primary-600">RecruteIA</span>
                    </a>
                  </Link>
                </div>
                <DashboardMenu userRole={user?.role} subscription={user?.subscription} />
              </div>

              {/* Profil utilisateur */}
              <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
                <Link href="/settings/profile" legacyBehavior>
                  <a className="flex-shrink-0 group block">
                    <div className="flex items-center">
                      <div>
                        <div className="relative h-9 w-9 rounded-full overflow-hidden bg-gray-100">
                          <Image
                            src={user?.avatar || '/images/avatars/default.png'}
                            alt={user?.name || ''}
                            sizes='(w-full)'
                            layout="fill"
                            className="object-cover"
                          />
                        </div>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900">{user?.name}</p>
                        <p className="text-xs font-medium text-gray-500 group-hover:text-gray-700">
                          {user?.role === 'admin' ? 'Administrateur' : 'Recruteur'}
                        </p>
                      </div>
                    </div>
                  </a>
                </Link>
              </div>
            </div>

            <div className="flex-shrink-0 w-14"></div>
          </div>

          {/* Barre latérale desktop */}
          <div className="hidden md:flex md:flex-shrink-0">
            <div className="flex flex-col w-64">
              <div className="flex flex-col h-0 flex-1 bg-white border-r border-gray-200">
                <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
                  <div className="px-4 mb-6">
                    <Link href="/dashboard" legacyBehavior>
                      <a className="flex items-center">
                        <span className="text-xl font-bold text-primary-600">RecruteIA</span>
                      </a>
                    </Link>
                  </div>
                  <DashboardMenu userRole={user?.role} subscription={user?.subscription} />
                </div>

                {/* Profil utilisateur */}
                <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
                  <Link href="/settings/profile" legacyBehavior>
                    <a className="flex-shrink-0 w-full group block">
                      <div className="flex items-center">
                        <div>
                          <div className="relative h-9 w-9 rounded-full overflow-hidden bg-gray-100">
                            <Image
                              src={user?.avatar || '/images/avatars/default.png'}
                              alt={user?.name || ''}
                              layout="fill"
                              className="object-cover"
                            />
                          </div>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900">{user?.name}</p>
                          <p className="text-xs font-medium text-gray-500 group-hover:text-gray-700">
                            {user?.role === 'admin' ? 'Administrateur' : 'Recruteur'}
                          </p>
                        </div>
                      </div>
                    </a>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col w-0 flex-1 overflow-hidden">
            <div className="relative z-10 flex-shrink-0 flex h-16 bg-white shadow">
              <button
                type="button"
                className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 md:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <span className="sr-only">Ouvrir la barre latérale</span>
                <Bars3Icon className="h-6 w-6" aria-hidden="true" />
              </button>

              <div className="flex-1 px-4 flex justify-between">
                <div className="flex-1 flex">
                  <form className="w-full flex md:ml-0" action="#">
                    <label htmlFor="search-field" className="sr-only">Rechercher</label>
                    <div className="relative w-full text-gray-400 focus-within:text-gray-600">
                      <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none">
                        <MagnifyingGlassIcon className="h-5 w-5" aria-hidden="true" />
                      </div>
                      <input
                        id="search-field"
                        className="block w-full h-full pl-8 pr-3 py-2 border-transparent text-gray-900 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-0 focus:border-transparent sm:text-sm"
                        placeholder="Rechercher des entretiens, candidats..."
                        type="search"
                        name="search"
                      />
                    </div>
                  </form>
                </div>

                <div className="ml-4 flex items-center md:ml-6">
                  {/* Bouton notifications */}
                  <div className="relative">
                    <button
                      type="button"
                      className="bg-white p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                      onClick={toggleNotifications}
                    >
                      <span className="sr-only">Voir les notifications</span>
                      <BellIcon className="h-6 w-6" aria-hidden="true" />
                      {unreadNotifications > 0 && (
                        <span className="absolute top-0 right-0 block h-5 w-5 rounded-full bg-red-500 text-black text-xs flex items-center justify-center">
                          {unreadNotifications}
                        </span>
                      )}
                    </button>

                    {/* Dropdown de notifications */}
                    {notificationsOpen && (
                      <NotificationsDropdown
                        onClose={() => setNotificationsOpen(false)}
                      />
                    )}
                  </div>

                  {/* Menu utilisateur */}
                  <div className="ml-3 relative">
                    <button
                      className="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                      onClick={logout}
                    >
                      <span className="sr-only">Déconnexion</span>
                      <span className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700">Déconnexion</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <main className="flex-1 relative overflow-y-auto focus:outline-none">
              {children}
            </main>
          </div>
        </div>
        <ToastContainer />
      </NotificationProvider>
      <ToastManager />
    </>
  );
};

export default DashboardLayout;