// frontend/components/interview/CollaborationPanel.jsx
import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, 
  MessageSquare, 
  Share2, 
  Clock, 
  Send, 
  Trash2, 
  User, 
  Mail, 
  Check, 
  X,
  UserPlus,
  MoreVertical
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';

const CollaborationPanel = ({ interviewId, isOwner, disabled = false }) => {
  const { user } = useAuth();
  const { showToast } = useNotification();
  const [activeTab, setActiveTab] = useState('comments');
  const [comments, setComments] = useState([]);
  const [shares, setShares] = useState([]);
  const [activities, setActivities] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [commentTimestamp, setCommentTimestamp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [shareEmail, setShareEmail] = useState('');
  const [sharePermission, setSharePermission] = useState('viewer');
  const [shareExpiry, setShareExpiry] = useState(null);
  const [processingAction, setProcessingAction] = useState(false);
  const commentsContainerRef = useRef(null);
  
  // Récupérer les commentaires au chargement
  useEffect(() => {
    const fetchComments = async () => {
      try {
        setLoading(true);
        
        const response = await fetch(`/api/interviews/${interviewId}/comments`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Erreur lors du chargement des commentaires');
        }
        
        const data = await response.json();
        setComments(data.data || []);
      } catch (error) {
        console.error('Erreur lors du chargement des commentaires:', error);
        showToast('error', 'Impossible de charger les commentaires');
      } finally {
        setLoading(false);
      }
    };
    
    if (interviewId && !disabled) {
      fetchComments();
    }
  }, [interviewId, disabled, showToast]);
  
  // Récupérer les partages si l'utilisateur est le propriétaire
  useEffect(() => {
    const fetchShares = async () => {
      if (!isOwner) return;
      
      try {
        const response = await fetch(`/api/interviews/${interviewId}/shares`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Erreur lors du chargement des partages');
        }
        
        const data = await response.json();
        setShares(data.data || []);
      } catch (error) {
        console.error('Erreur lors du chargement des partages:', error);
      }
    };
    
    if (interviewId && isOwner && !disabled) {
      fetchShares();
    }
  }, [interviewId, isOwner, disabled]);
  
  // Récupérer les activités si l'utilisateur est le propriétaire
  useEffect(() => {
    const fetchActivities = async () => {
      if (!isOwner) return;
      
      try {
        const response = await fetch(`/api/interviews/${interviewId}/activities`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Erreur lors du chargement des activités');
        }
        
        const data = await response.json();
        setActivities(data.data || []);
      } catch (error) {
        console.error('Erreur lors du chargement des activités:', error);
      }
    };
    
    if (interviewId && isOwner && !disabled && activeTab === 'activities') {
      fetchActivities();
    }
  }, [interviewId, isOwner, disabled, activeTab]);
  
  // Auto-scroll vers le bas lorsque de nouveaux commentaires sont ajoutés
  useEffect(() => {
    if (commentsContainerRef.current && comments.length > 0) {
      commentsContainerRef.current.scrollTop = commentsContainerRef.current.scrollHeight;
    }
  }, [comments]);
  
  const handleSendComment = async () => {
    if (!newComment.trim()) return;
    
    setProcessingAction(true);
    
    try {
      const response = await fetch(`/api/interviews/${interviewId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          content: newComment,
          timestamp: commentTimestamp
        })
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors de l\'envoi du commentaire');
      }
      
      const data = await response.json();
      
      // Ajouter le nouveau commentaire à la liste
      setComments([...comments, data.data]);
      
      // Vider le champ de commentaire
      setNewComment('');
      setCommentTimestamp(null);
    } catch (error) {
      console.error('Erreur lors de l\'envoi du commentaire:', error);
      showToast('error', 'Impossible d\'envoyer le commentaire');
    } finally {
      setProcessingAction(false);
    }
  };
  
// frontend/components/interview/CollaborationPanel.jsx (suite)
const handleShare = async (e) => {
    e.preventDefault();
    
    if (!shareEmail.trim()) return;
    
    setProcessingAction(true);
    
    try {
      const response = await fetch(`/api/interviews/${interviewId}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          email: shareEmail,
          permission_level: sharePermission,
          expires_days: shareExpiry
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors du partage');
      }
      
      // Recharger les partages
      const sharesResponse = await fetch(`/api/interviews/${interviewId}/shares`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (sharesResponse.ok) {
        const sharesData = await sharesResponse.json();
        setShares(sharesData.data || []);
      }
      
      // Réinitialiser le formulaire
      setShareEmail('');
      setSharePermission('viewer');
      setShareExpiry(null);
      setSharing(false);
      
      showToast('success', 'Entretien partagé avec succès');
    } catch (error) {
      console.error('Erreur lors du partage:', error);
      showToast('error', error.message || 'Impossible de partager l\'entretien');
    } finally {
      setProcessingAction(false);
    }
  };
  
  const handleRemoveShare = async (sharedWithId) => {
    setProcessingAction(true);
    
    try {
      const response = await fetch(`/api/interviews/${interviewId}/share/${sharedWithId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors de la suppression du partage');
      }
      
      // Mettre à jour la liste des partages
      setShares(shares.filter(share => share.shared_with_id !== sharedWithId));
      
      showToast('success', 'Partage supprimé avec succès');
    } catch (error) {
      console.error('Erreur lors de la suppression du partage:', error);
      showToast('error', 'Impossible de supprimer le partage');
    } finally {
      setProcessingAction(false);
    }
  };
  
  const formatTime = (seconds) => {
    if (!seconds && seconds !== 0) return '';
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const getActivityIcon = (activityType) => {
    switch (activityType) {
      case 'view':
        return <Users className="h-4 w-4 text-blue-500" />;
      case 'comment':
        return <MessageSquare className="h-4 w-4 text-green-500" />;
      case 'edit':
        return <Users className="h-4 w-4 text-orange-500" />;
      case 'rate':
        return <Users className="h-4 w-4 text-purple-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };
  
  const getActivityDescription = (activity) => {
    switch (activity.activity_type) {
      case 'view':
        return `a consulté l'entretien`;
      case 'comment':
        return `a ajouté un commentaire${activity.details?.timestamp ? ` à ${formatTime(activity.details.timestamp)}` : ''}`;
      case 'edit':
        return `a modifié l'entretien`;
      case 'rate':
        return `a évalué le candidat`;
      default:
        return `a effectué une action sur l'entretien`;
    }
  };
  
  const getPermissionLabel = (permission) => {
    switch (permission) {
      case 'viewer':
        return 'Visualisation';
      case 'commenter':
        return 'Commentaire';
      case 'editor':
        return 'Édition';
      default:
        return permission;
    }
  };
  
  if (disabled) {
    return (
      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <div className="flex flex-col items-center justify-center h-32 text-center">
          <Users className="h-10 w-10 text-gray-400 mb-2" />
          <p className="text-gray-700 font-medium">Mode collaboratif désactivé</p>
          <p className="text-sm text-gray-500 mt-1">Cette fonctionnalité est disponible dans les plans Pro et Enterprise.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden mb-6">
      <div className="flex border-b">
        <button
          className={`flex items-center px-4 py-3 text-sm font-medium ${
            activeTab === 'comments' 
              ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50' 
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
          onClick={() => setActiveTab('comments')}
        >
          <MessageSquare className="h-4 w-4 mr-2" />
          Commentaires
        </button>
        
        {isOwner && (
          <>
            <button
              className={`flex items-center px-4 py-3 text-sm font-medium ${
                activeTab === 'shares' 
                  ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
              onClick={() => setActiveTab('shares')}
            >
              <Share2 className="h-4 w-4 mr-2" />
              Partages
            </button>
            
            <button
              className={`flex items-center px-4 py-3 text-sm font-medium ${
                activeTab === 'activities' 
                  ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
              onClick={() => setActiveTab('activities')}
            >
              <Clock className="h-4 w-4 mr-2" />
              Activités
            </button>
          </>
        )}
      </div>
      
      {/* Contenu des onglets */}
      <div className="p-4">
        {/* Onglet Commentaires */}
        {activeTab === 'comments' && (
          <div className="flex flex-col h-96">
            <div 
              ref={commentsContainerRef}
              className="flex-grow overflow-y-auto mb-4 space-y-3"
            >
              {loading ? (
                <div className="flex justify-center items-center h-full">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                </div>
              ) : comments.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <MessageSquare className="h-8 w-8 mb-2 text-gray-300" />
                  <p>Aucun commentaire pour le moment</p>
                  <p className="text-sm">Soyez le premier à commenter cet entretien</p>
                </div>
              ) : (
                comments.map((comment) => (
                  <div 
                    key={comment.id} 
                    className={`flex ${comment.user_id === user.id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div 
                      className={`rounded-lg p-3 max-w-xs break-words ${
                        comment.user_id === user.id 
                          ? 'bg-indigo-100 text-indigo-900' 
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      <div className="flex items-center mb-1">
                        <span className="text-xs font-semibold">{comment.user_name}</span>
                        {comment.timestamp !== null && (
                          <span className="ml-2 text-xs text-gray-500">@{formatTime(comment.timestamp)}</span>
                        )}
                      </div>
                      <p className="text-sm">{comment.content}</p>
                      <span className="text-xs text-gray-500 mt-1 block text-right">
                        {formatDate(comment.created_at)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            <div className="border-t pt-3">
              <div className="flex mb-2">
                <input
                  type="text"
                  placeholder="Ajouter un timestamp (mm:ss)"
                  value={commentTimestamp ? formatTime(commentTimestamp) : ''}
                  onChange={(e) => {
                    const [minutes, seconds] = e.target.value.split(':').map(Number);
                    if (!isNaN(minutes) && !isNaN(seconds)) {
                      setCommentTimestamp(minutes * 60 + seconds);
                    } else {
                      setCommentTimestamp(null);
                    }
                  }}
                  className="text-xs p-1 border border-gray-300 rounded-md mr-2 w-28"
                />
                <button 
                  onClick={() => setCommentTimestamp(null)}
                  className="text-xs text-gray-500 hover:text-gray-700"
                  hidden={!commentTimestamp}
                >
                  Effacer le timestamp
                </button>
              </div>
              <div className="flex items-center">
                <input
                  type="text"
                  placeholder="Écrire un commentaire..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="flex-grow p-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendComment();
                    }
                  }}
                />
                <button
                  onClick={handleSendComment}
                  disabled={!newComment.trim() || processingAction}
                  className="p-2 bg-indigo-600 text-black rounded-r-md hover:bg-indigo-700 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processingAction ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Onglet Partages */}
        {activeTab === 'shares' && isOwner && (
          <div className="h-96">
            <div className="mb-4 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Partager cet entretien</h3>
              {!sharing && (
                <button
                  onClick={() => setSharing(true)}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-black bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <UserPlus className="h-4 w-4 mr-1" /> Nouveau partage
                </button>
              )}
            </div>
            
            {sharing && (
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <form onSubmit={handleShare}>
                  <div className="mb-3">
                    <label htmlFor="shareEmail" className="block text-sm font-medium text-gray-700 mb-1">
                      Adresse email
                    </label>
                    <input
                      type="email"
                      id="shareEmail"
                      placeholder="email@exemple.com"
                      value={shareEmail}
                      onChange={(e) => setShareEmail(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      required
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label htmlFor="sharePermission" className="block text-sm font-medium text-gray-700 mb-1">
                      Niveau d'accès
                    </label>
                    <select
                      id="sharePermission"
                      value={sharePermission}
                      onChange={(e) => setSharePermission(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="viewer">Visualisation uniquement</option>
                      <option value="commenter">Visualisation et commentaires</option>
                      <option value="editor">Édition complète</option>
                    </select>
                  </div>
                  
                  <div className="mb-4">
                    <label htmlFor="shareExpiry" className="block text-sm font-medium text-gray-700 mb-1">
                      Expiration (optionnel)
                    </label>
                    <select
                      id="shareExpiry"
                      value={shareExpiry || ''}
                      onChange={(e) => setShareExpiry(e.target.value === '' ? null : Number(e.target.value))}
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="">Jamais</option>
                      <option value="7">7 jours</option>
                      <option value="30">30 jours</option>
                      <option value="90">90 jours</option>
                    </select>
                  </div>
                  
                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setSharing(false)}
                      className="px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={!shareEmail.trim() || processingAction}
                      className="px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-black bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {processingAction ? 'Partage en cours...' : 'Partager'}
                    </button>
                  </div>
                </form>
              </div>
            )}
            
            <div className="border rounded-md divide-y overflow-y-auto" style={{ maxHeight: sharing ? '350px' : '500px' }}>
              <div className="px-4 py-3 bg-gray-50">
                <h4 className="text-sm font-medium text-gray-700">Utilisateurs ayant accès</h4>
              </div>
              
              {shares.length === 0 ? (
                <div className="py-8 text-center text-gray-500">
                  <Share2 className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p>Cet entretien n'est partagé avec personne</p>
                </div>
              ) : (
                shares.map((share) => (
                  <div key={share.id} className="px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="bg-gray-100 rounded-full p-2 mr-3">
                        <User className="h-5 w-5 text-gray-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{share.user_name}</p>
                        <p className="text-xs text-gray-500">{share.user_email}</p>
                        <div className="flex items-center mt-1">
                          <span className="text-xs px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded-full">
                            {getPermissionLabel(share.permission_level)}
                          </span>
                          {share.expires_at && (
                            <span className="ml-2 text-xs text-gray-500">
                              Expire le {new Date(share.expires_at).toLocaleDateString('fr-FR')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveShare(share.shared_with_id)}
                      disabled={processingAction}
                      className="text-gray-400 hover:text-red-500 p-1 rounded-full hover:bg-gray-100 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Supprimer le partage"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
        
        {/* Onglet Activités */}
        {activeTab === 'activities' && isOwner && (
          <div className="h-96 overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Historique des activités</h3>
            
            {activities.length === 0 ? (
              <div className="py-8 text-center text-gray-500">
                <Clock className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p>Aucune activité récente</p>
              </div>
            ) : (
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                
                <div className="space-y-4">
                  {activities.map((activity) => (
                    <div key={activity.id} className="flex items-start ml-4 pl-6 relative">
                      <div className="absolute -left-6 mt-1 bg-white p-1 rounded-full border border-gray-200">
                        {getActivityIcon(activity.activity_type)}
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg w-full">
                        <div className="flex items-center">
                          <span className="font-medium text-sm text-gray-900">{activity.user_name}</span>
                          <span className="mx-1 text-gray-500">•</span>
                          <span className="text-xs text-gray-500">{formatDate(activity.created_at)}</span>
                        </div>
                        <p className="text-sm text-gray-700 mt-1">
                          {getActivityDescription(activity)}
                        </p>
                        {activity.activity_type === 'comment' && activity.details?.content && (
                          <div className="mt-2 bg-white p-2 rounded-md text-xs text-gray-600 border border-gray-200">
                            "{activity.details.content}"
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CollaborationPanel;