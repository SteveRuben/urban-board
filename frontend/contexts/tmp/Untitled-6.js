// frontend/pages/notifications/index.jsx
import React, { useState, useEffect } from 'react';
import { useNotifications } from '../../contexts/NotificationContext';
import NotificationItem from '../../components/notifications/NotificationItem';
import { 
  Bell, 
  Filter, 
  Check, 
  Trash2, 
  ChevronDown,
  RefreshCw,
  Calendar,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

// Options de filtrage
const filterOptions = [
  { id: 'all', name: 'Toutes les notifications' },
  { id: 'unread', name: 'Non lues' },
  { id: 'interview_completed', name: 'Entretiens terminés' },
  { id: 'resume_analyzed', name: 'CV analysés' },
  { id: 'candidate_feedback', name: 'Retours candidats' },
  { id: 'interview_scheduled', name: 'Entretiens planifiés' },
  { id: 'info', name: 'Informations' },
  { id: 'error', name: 'Erreurs' }
];

// Options de tri
const sortOptions = [
  { id: 'newest', name: 'Plus récentes d\'abord' },
  { id: 'oldest', name: 'Plus anciennes d\'abord' }
];

const NotificationsPage = () => {
  const { 
    notifications, 
    loading, 
    error, 
    fetchNotifications, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification 
  } = useNotifications();

  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [displayedNotifications, setDisplayedNotifications] = useState([]);

  // Appliquer le filtre et le tri aux notifications
  useEffect(() => {
    let filtered = [...notifications];
    
    // Filtrage
    if (filter === 'unread') {
      filtered = filtered.filter(notif => !notif.is_read);
    } else if (filter !== 'all') {
      filtered = filtered.filter(notif => notif.type === filter);
    }
    
    // Tri
    filtered.sort((a, b) => {
      const dateA = new Date(a.created_at);
      const dateB = new Date(b.created_at);
      return sortBy === 'newest' ? dateB - dateA : dateA - dateB;
    });
    
    setDisplayedNotifications(filtered);
  }, [notifications, filter, sortBy]);

  // Rafraîchir les notifications
  const handleRefresh = () => {
    fetchNotifications(filter !== 'unread' ? filter : 'all');
  };

  // Supprimer toutes les notifications affichées
  const handleDeleteAll = async () => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer toutes ces notifications ?')) {
      try {
        const response = await fetch('/api/notifications/bulk-delete', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ids: displayedNotifications.map(notif => notif.id)
          })
        });
        
        if (!response.ok) throw new Error('Erreur lors de la suppression');
        
        // Rafraîchir après suppression
        handleRefresh();
      } catch (err) {
        console.error('Erreur:', err);
      }
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col items-start md:flex-row md:items-center md:justify-between mb-6">
        <div className="flex items-center mb-4 md:mb-0">
          <Bell className="h-8 w-8 text-blue-600 mr-3" />
          <h1 className="text-2xl font-bold text-gray-900">Vos notifications</h1>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleRefresh}
            className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </button>
          
          {/* Dropdown de filtrage */}
          <div className="relative">
            <button
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <Filter className="h-4 w-4 mr-2" />
              {filterOptions.find(opt => opt.id === filter)?.name || 'Filtrer'}
              <ChevronDown className="h-4 w-4 ml-2" />
            </button>
            
            {showFilterDropdown && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                <ul className="py-1">
                  {filterOptions.map((option) => (
                    <li key={option.id}>
                      <button
                        onClick={() => {
                          setFilter(option.id);
                          setShowFilterDropdown(false);
                        }}
                        className={`block w-full text-left px-4 py-2 text-sm ${
                          filter === option.id ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {option.name}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          
          {/* Dropdown de tri */}
          <div className="relative">
            <button
              onClick={() => setShowSortDropdown(!showSortDropdown)}
              className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <Calendar className="h-4 w-4 mr-2" />
              {sortOptions.find(opt => opt.id === sortBy)?.name || 'Trier'}
              <ChevronDown className="h-4 w-4 ml-2" />
            </button>
            
            {showSortDropdown && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                <ul className="py-1">
                  {sortOptions.map((option) => (
                    <li key={option.id}>
                      <button
                        onClick={() => {
                          setSortBy(option.id);
                          setShowSortDropdown(false);
                        }}
                        className={`block w-full text-left px-4 py-2 text-sm ${
                          sortBy === option.id ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {option.name}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Actions de groupe */}
      {displayedNotifications.length > 0 && (
        <div className="flex justify-between items-center mb-4 p-3 bg-gray-50 border border-gray-200 rounded-md">
          <span className="text-sm text-gray-600">
            {displayedNotifications.length} notification{displayedNotifications.length > 1 ? 's' : ''}
          </span>
          <div className="flex space-x-2">
            <button
              onClick={markAllAsRead}
              className="inline-flex items-center px-3 py-1 text-sm font-medium text-green-700 bg-green-50 rounded-md hover:bg-green-100"
              disabled={loading}
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Tout marquer comme lu
            </button>
            <button
              onClick={handleDeleteAll}
              className="inline-flex items-center px-3 py-1 text-sm font-medium text-red-700 bg-red-50 rounded-md hover:bg-red-100"
              disabled={loading}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Tout supprimer
            </button>
          </div>
        </div>
      )}
      
      {/* Messages d'état */}
      {loading && (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4 flex items-start">
          <AlertCircle className="h-5 w-5 mr-2 mt-0.5" />
          <div>
            <p className="font-medium">Erreur lors du chargement des notifications</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}
      
      {/* Liste des notifications */}
      {!loading && !error && (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {displayedNotifications.length > 0 ? (
            displayedNotifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={markAsRead}
                onDelete={deleteNotification}
              />
            ))
          ) : (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <Bell className="h-16 w-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">Aucune notification</h3>
              <p className="text-gray-500">
                {filter !== 'all' ? 'Essayez de modifier vos filtres' : 'Vous n\'avez pas de notifications pour le moment'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;