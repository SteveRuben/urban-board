// frontend/components/notifications/NotificationItem.jsx
import React from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { 
  Bell, 
  Check, 
  Info, 
  AlertTriangle, 
  X,
  MessageSquare,
  FileText,
  Users,
  Calendar
} from 'lucide-react';

// Fonction pour déterminer l'icône appropriée selon le type de notification
const getNotificationIcon = (type) => {
  switch (type) {
    case 'interview_completed':
      return <MessageSquare className="h-5 w-5 text-blue-500" />;
    case 'resume_analyzed':
      return <FileText className="h-5 w-5 text-green-500" />;
    case 'candidate_feedback':
      return <Users className="h-5 w-5 text-purple-500" />;
    case 'interview_scheduled':
      return <Calendar className="h-5 w-5 text-orange-500" />;
    case 'error':
      return <AlertTriangle className="h-5 w-5 text-red-500" />;
    case 'info':
      return <Info className="h-5 w-5 text-blue-500" />;
    default:
      return <Bell className="h-5 w-5 text-gray-500" />;
  }
};

const NotificationItem = ({ notification, onMarkAsRead, onDelete }) => {
  const formattedDate = notification.created_at 
    ? format(new Date(notification.created_at), 'dd MMM yyyy à HH:mm', { locale: fr })
    : '';

  return (
    <div 
      className={`flex p-3 border-b border-gray-100 ${!notification.is_read ? 'bg-blue-50' : ''}`}
    >
      <div className="flex-shrink-0 mr-3">
        {getNotificationIcon(notification.type)}
      </div>
      <div className="flex-grow">
        <div className="flex justify-between items-start">
          <h4 className="font-medium text-gray-900">{notification.title}</h4>
          <div className="flex items-center space-x-2">
            {!notification.is_read && (
              <button 
                onClick={() => onMarkAsRead(notification.id)}
                className="text-gray-400 hover:text-gray-600"
                title="Marquer comme lu"
              >
                <Check className="h-4 w-4" />
              </button>
            )}
            <button 
              onClick={() => onDelete(notification.id)}
              className="text-gray-400 hover:text-red-500"
              title="Supprimer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
        <div className="flex justify-between items-center mt-2">
          <span className="text-xs text-gray-500">{formattedDate}</span>
          {notification.reference_id && (
            <button 
              className="text-xs text-blue-600 hover:text-blue-800"
              onClick={() => window.location.href = getNotificationLink(notification)}
            >
              Voir les détails
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Fonction pour générer le lien associé à la notification
const getNotificationLink = (notification) => {
  switch (notification.type) {
    case 'interview_completed':
      return `/interviews/${notification.reference_id}/results`;
    case 'resume_analyzed':
      return `/resumes/${notification.reference_id}`;
    case 'candidate_feedback':
      return `/candidates/${notification.reference_id}/feedback`;
    case 'interview_scheduled':
      return `/interviews/${notification.reference_id}`;
    default:
      return `#`;
  }
};

export default NotificationItem;