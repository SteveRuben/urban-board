
import React, { useState, useEffect } from 'react';
import { 
  Bot, 
  Play, 
  Square, 
  SkipForward, 
  RefreshCw, 
  AlertTriangle,
  CheckCircle,
  Clock,
  MessageCircle,
  Monitor,
  Video,
  Eye,
  Settings
} from 'lucide-react';
import { AvatarService } from '@/services/avatar-service';
import type { AvatarStatus, AvatarStatusResponse } from '@/types/avatar';
import { AVATAR_STATUS_LABELS, AVATAR_STATUS_COLORS, AVATAR_STATUS_BACKGROUNDS } from '@/types/avatar';

interface AvatarStatusCardProps {
  scheduleId: string;
  scheduleStatus: string;
  interviewMode: 'autonomous' | 'collaborative';
  onStatusChange?: (status: AvatarStatusResponse) => void;
  showAdvancedControls?: boolean;
  autoRefresh?: boolean;
}

export const AvatarStatusCard: React.FC<AvatarStatusCardProps> = ({
  scheduleId,
  scheduleStatus,
  interviewMode,
  onStatusChange,
  showAdvancedControls = false,
  autoRefresh = true
}) => {
  const [avatarStatus, setAvatarStatus] = useState<AvatarStatusResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Récupération initiale et polling automatique
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        setLoading(true);
        const status = await AvatarService.getAvatarStatus(scheduleId);
        setAvatarStatus(status);
        setLastUpdate(new Date());
        onStatusChange?.(status);
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Erreur lors de la récupération du statut');
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();

    let cleanup: (() => void) | undefined;
    
    if (autoRefresh && ['scheduled', 'confirmed', 'in_progress'].includes(scheduleStatus)) {
      cleanup = AvatarService.createStatusPoller(
        scheduleId,
        (status) => {
          setAvatarStatus(status);
          setLastUpdate(new Date());
          onStatusChange?.(status);
        },
        5000 // 5 secondes
      );
    }

    return cleanup;
  }, [scheduleId, scheduleStatus, autoRefresh, onStatusChange]);

  // Actions de contrôle
  const handleForceQuestion = async () => {
    if (!avatarStatus?.avatar_status) return;
    
    try {
      setActionLoading('force_question');
      const result = await AvatarService.forceNextQuestion(scheduleId);
      
      if (result.success) {
        // Rafraîchir le statut
        const updatedStatus = await AvatarService.getAvatarStatus(scheduleId);
        setAvatarStatus(updatedStatus);
        setLastUpdate(new Date());
      } else {
        setError(result.error || 'Erreur lors du forçage de question');
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors du forçage de question');
    } finally {
      setActionLoading(null);
    }
  };

  const handleStopAvatar = async () => {
    if (!avatarStatus?.avatar_status) return;
    
    if (!confirm('Êtes-vous sûr de vouloir arrêter l\'avatar ?')) return;
    
    try {
      setActionLoading('stop');
      const result = await AvatarService.stopAvatar(scheduleId);
      
      if (result.success) {
        const updatedStatus = await AvatarService.getAvatarStatus(scheduleId);
        setAvatarStatus(updatedStatus);
        setLastUpdate(new Date());
      } else {
        setError(result.error || 'Erreur lors de l\'arrêt');
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'arrêt');
    } finally {
      setActionLoading(null);
    }
  };

  const handleForceLaunch = async () => {
    if (!avatarStatus?.avatar_status) return;
    
    if (!confirm('Lancer l\'avatar immédiatement ? (Fonction de test)')) return;
    
    try {
      setActionLoading('launch');
      const result = await AvatarService.forceLaunchAvatar(scheduleId);
      
      if (result.success) {
        const updatedStatus = await AvatarService.getAvatarStatus(scheduleId);
        setAvatarStatus(updatedStatus);
        setLastUpdate(new Date());
      } else {
        setError(result.error || 'Erreur lors du lancement');
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors du lancement');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRefreshStatus = async () => {
    try {
      setActionLoading('refresh');
      const status = await AvatarService.getAvatarStatus(scheduleId);
      setAvatarStatus(status);
      setLastUpdate(new Date());
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'actualisation');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
        <div className="flex items-center justify-center p-8">
          <RefreshCw className="h-6 w-6 animate-spin text-blue-600 mr-3" />
          <span className="text-gray-600">Chargement du statut avatar...</span>
        </div>
      </div>
    );
  }

  if (!avatarStatus || !avatarStatus.avatar_status.available) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
          <Bot className="h-5 w-5 mr-2 text-gray-400" />
          Assistant Avatar
        </h3>
        <div className="text-center p-6 text-gray-500">
          <Bot className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p>Service avatar non disponible</p>
          <p className="text-sm mt-1">
            {avatarStatus?.error || 'Le service avatar n\'est pas configuré pour cet environnement'}
          </p>
        </div>
      </div>
    );
  }

  const status = avatarStatus.avatar_status;
  const actions = AvatarService.getAvailableActions(status);
  const needsAttention = AvatarService.needsAttention(status);
  const statusMessage = AvatarService.getStatusMessage(status);

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center">
          <Bot className="h-5 w-5 mr-2 text-blue-600" />
          Assistant Avatar
          {needsAttention && (
            <AlertTriangle className="h-4 w-4 ml-2 text-orange-500" />
          )}
        </h3>
        
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefreshStatus}
            disabled={actionLoading === 'refresh'}
            className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
            title="Actualiser le statut"
          >
            <RefreshCw className={`h-4 w-4 ${actionLoading === 'refresh' ? 'animate-spin' : ''}`} />
          </button>
          
          {lastUpdate && (
            <span className="text-xs text-gray-500">
              {lastUpdate.toLocaleTimeString('fr-FR')}
            </span>
          )}
        </div>
      </div>

      {/* Affichage des erreurs */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-3">
          <div className="flex items-center">
            <AlertTriangle className="h-4 w-4 text-red-400 mr-2" />
            <span className="text-sm text-red-700">{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-400 hover:text-red-600"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Badge de statut principal */}
      <div className="mb-4">
        <div className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${AVATAR_STATUS_BACKGROUNDS[status.status]} ${AVATAR_STATUS_COLORS[status.status]}`}>
          <div className={`w-2 h-2 rounded-full mr-2 ${status.status === 'active' ? 'bg-green-500 animate-pulse' : 'bg-current'}`}></div>
          {AVATAR_STATUS_LABELS[status.status]}
        </div>
        
        <p className="text-sm text-gray-600 mt-2">{statusMessage}</p>
      </div>

      {/* Informations détaillées */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="flex items-center text-sm">
          <Monitor className="h-4 w-4 mr-2 text-gray-400" />
          <span className="text-gray-600">Navigateur:</span>
          <span className={`ml-1 ${status.browser_running ? 'text-green-600' : 'text-red-600'}`}>
            {status.browser_running ? 'Actif' : 'Fermé'}
          </span>
        </div>
        
        <div className="flex items-center text-sm">
          <Video className="h-4 w-4 mr-2 text-gray-400" />
          <span className="text-gray-600">Meeting:</span>
          <span className={`ml-1 ${status.meeting_active ? 'text-green-600' : 'text-red-600'}`}>
            {status.meeting_active ? 'Connecté' : 'Déconnecté'}
          </span>
        </div>
      </div>

      {/* Progression des questions (si actif) */}
      {status.status === 'active' && status.questions && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-800">
              Questions d'entretien
            </span>
            <span className="text-xs text-blue-600">
              {status.questions.asked}/{status.questions.total}
            </span>
          </div>
          
          <div className="w-full bg-blue-200 rounded-full h-2 mb-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${AvatarService.calculateProgress(status.questions.asked, status.questions.total)}%`
              }}
            ></div>
          </div>
          
          {status.questions.current_question && (
            <div className="text-sm text-blue-700 mb-2">
              <MessageCircle className="h-3 w-3 inline mr-1" />
              Question actuelle: {status.questions.current_question.substring(0, 60)}...
            </div>
          )}
          
          {status.questions.next_in_seconds && status.questions.next_in_seconds > 0 && (
            <div className="text-xs text-blue-600">
              <Clock className="h-3 w-3 inline mr-1" />
              Prochaine question dans {AvatarService.formatTimeUntilNext(status.questions.next_in_seconds)}
            </div>
          )}
        </div>
      )}

      {/* Actions de contrôle */}
      <div className="space-y-2">
        {actions.canForceQuestion && (
          <button
            onClick={handleForceQuestion}
            disabled={actionLoading === 'force_question'}
            className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {actionLoading === 'force_question' ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <SkipForward className="h-4 w-4 mr-2" />
            )}
            Forcer la prochaine question
          </button>
        )}

        {actions.canStop && (
          <button
            onClick={handleStopAvatar}
            disabled={actionLoading === 'stop'}
            className="w-full flex items-center justify-center px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors disabled:opacity-50"
          >
            {actionLoading === 'stop' ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Square className="h-4 w-4 mr-2" />
            )}
            Arrêter l'avatar
          </button>
        )}

        {showAdvancedControls && actions.canLaunch && (
          <button
            onClick={handleForceLaunch}
            disabled={actionLoading === 'launch'}
            className="w-full flex items-center justify-center px-4 py-2 bg-orange-100 text-orange-700 rounded-md hover:bg-orange-200 transition-colors disabled:opacity-50"
          >
            {actionLoading === 'launch' ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Play className="h-4 w-4 mr-2" />
            )}
            Lancer maintenant (Test)
          </button>
        )}
      </div>

      {/* Informations techniques (mode développeur) */}
      {showAdvancedControls && (
        <details className="mt-4 text-xs">
          <summary className="cursor-pointer text-gray-500 hover:text-gray-700">
            Informations techniques
          </summary>
          <div className="mt-2 p-2 bg-gray-50 rounded text-gray-600">
            <div>Mode: {status.mode}</div>
            <div>Statut: {status.status}</div>
            {status.scheduled_launch && (
              <div>Programmé: {new Date(status.scheduled_launch).toLocaleString('fr-FR')}</div>
            )}
            {status.launch_time && (
              <div>Lancé: {new Date(status.launch_time).toLocaleString('fr-FR')}</div>
            )}
          </div>
        </details>
      )}
    </div>
  );
};