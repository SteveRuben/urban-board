
import { api } from './user-service';
import type { 
  AvatarStatus, 
  AvatarStatusResponse, 
  AvatarActionResponse, 
  AvatarQuestionsStatus,
  AvatarQuestionsPreview 
} from '@/types/avatar';

export class AvatarService {
  /**
   * Récupère le statut détaillé de l'avatar pour un entretien
   */
  static async getAvatarStatus(scheduleId: string): Promise<AvatarStatusResponse> {
    try {
      console.log("AvatarService: Récupération du statut avatar", { scheduleId });

      const response = await api.get(`/scheduling/schedules/${scheduleId}/avatar/status`);

      console.log("AvatarService: Réponse reçue", response.status);

      return response.data;
    } catch (error: any) {
      console.error('Erreur lors de la récupération du statut avatar:', error);
      
      // Retourner un statut d'erreur par défaut
      return {
        success: false,
        schedule_id: scheduleId,
        avatar_status: {
          available: false,
          status: 'error',
          mode: 'unknown',
          browser_running: false,
          meeting_active: false,
          error: error.response?.data?.error || error.message || 'Erreur inconnue'
        },
        error: error.response?.data?.error || error.message || 'Erreur lors de la récupération du statut'
      };
    }
  }

  /**
   * Force la prochaine question de l'avatar
   */
  static async forceNextQuestion(scheduleId: string): Promise<AvatarActionResponse> {
    try {
      console.log("AvatarService: Forcer la prochaine question", { scheduleId });

      const response = await api.post(`/scheduling/schedules/${scheduleId}/avatar/force-question`, {});

      console.log("AvatarService: Réponse reçue", response.status);

      return response.data;
    } catch (error: any) {
      console.error('Erreur lors du forçage de question:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Erreur lors du forçage de question'
      };
    }
  }

  /**
   * Arrête l'avatar d'un entretien
   */
  static async stopAvatar(scheduleId: string): Promise<AvatarActionResponse> {
    try {
      console.log("AvatarService: Arrêt de l'avatar", { scheduleId });

      const response = await api.post(`/scheduling/schedules/${scheduleId}/avatar/stop`, {});

      console.log("AvatarService: Réponse reçue", response.status);

      return response.data;
    } catch (error: any) {
      console.error('Erreur lors de l\'arrêt de l\'avatar:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Erreur lors de l\'arrêt de l\'avatar'
      };
    }
  }

  /**
   * Lance immédiatement l'avatar (debug/test)
   */
  static async forceLaunchAvatar(scheduleId: string): Promise<AvatarActionResponse> {
    try {
      console.log("AvatarService: Lancement forcé de l'avatar", { scheduleId });

      const response = await api.post(`/scheduling/schedules/${scheduleId}/avatar/force-launch`, {});

      console.log("AvatarService: Réponse reçue", response.status);

      return response.data;
    } catch (error: any) {
      console.error('Erreur lors du lancement forcé:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Erreur lors du lancement forcé'
      };
    }
  }

  /**
   * Prévisualise les questions pour un type de poste
   */
  static async previewInterviewQuestions(position: string): Promise<AvatarQuestionsPreview | null> {
    try {
      console.log("AvatarService: Prévisualisation des questions", { position });

      const response = await api.post('/scheduling/interview-questions/preview', {
        position
      });

      console.log("AvatarService: Réponse reçue", response.status);

      if (response.data.success) {
        return response.data;
      } else {
        console.error('Erreur dans la réponse:', response.data.error);
        return null;
      }
    } catch (error: any) {
      console.error('Erreur lors de la prévisualisation des questions:', error);
      return null;
    }
  }

  /**
   * Détermine les actions possibles selon le statut de l'avatar
   */
  static getAvailableActions(avatarStatus: AvatarStatus): {
    canForceQuestion: boolean;
    canStop: boolean;
    canLaunch: boolean;
    canViewStatus: boolean;
  } {
    return {
      canForceQuestion: avatarStatus.status === 'active' && avatarStatus.meeting_active,
      canStop: ['active', 'launching'].includes(avatarStatus.status),
      canLaunch: ['not_scheduled', 'stopped', 'error'].includes(avatarStatus.status),
      canViewStatus: avatarStatus.available
    };
  }

  /**
   * Formate le temps restant avant la prochaine question
   */
  static formatTimeUntilNext(seconds?: number): string {
    if (!seconds || seconds <= 0) return 'Maintenant';
    
    if (seconds < 60) {
      return `${seconds}s`;
    }
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (remainingSeconds === 0) {
      return `${minutes}min`;
    }
    
    return `${minutes}min ${remainingSeconds}s`;
  }

  /**
   * Calcule le pourcentage de progression des questions
   */
  static calculateProgress(asked: number, total: number): number {
    if (total === 0) return 0;
    return Math.round((asked / total) * 100);
  }

  /**
   * Détermine si l'avatar a besoin d'attention (erreur ou problème)
   */
  static needsAttention(avatarStatus: AvatarStatus): boolean {
    return avatarStatus.status === 'error' || 
           (avatarStatus.status === 'active' && !avatarStatus.browser_running) ||
           (avatarStatus.status === 'active' && !avatarStatus.meeting_active);
  }

  /**
   * Génère un message de statut pour l'UI
   */
  static getStatusMessage(avatarStatus: AvatarStatus): string {
    switch (avatarStatus.status) {
      case 'not_scheduled':
        return 'Avatar non programmé pour cet entretien';
      case 'scheduled':
        return `Avatar programmé pour ${avatarStatus.scheduled_launch ? new Date(avatarStatus.scheduled_launch).toLocaleTimeString('fr-FR') : 'bientôt'}`;
      case 'launching':
        return 'Avatar en cours de démarrage...';
      case 'active':
        if (!avatarStatus.browser_running) return 'Avatar actif mais navigateur fermé';
        if (!avatarStatus.meeting_active) return 'Avatar actif mais pas connecté au meeting';
        if (avatarStatus.questions) {
          const { asked, total, next_in_seconds } = avatarStatus.questions;
          return `Question ${asked + 1}/${total} - Prochaine dans ${this.formatTimeUntilNext(next_in_seconds)}`;
        }
        return 'Avatar actif et opérationnel';
      case 'stopping':
        return 'Avatar en cours d\'arrêt...';
      case 'stopped':
        return 'Avatar arrêté';
      case 'error':
        return `Erreur: ${avatarStatus.error || 'Erreur inconnue'}`;
      default:
        return 'Statut inconnu';
    }
  }

  /**
   * Hook pour actualiser automatiquement le statut
   */
  static createStatusPoller(
    scheduleId: string, 
    onUpdate: (status: AvatarStatusResponse) => void,
    intervalMs: number = 5000
  ): () => void {
    const interval = setInterval(async () => {
      try {
        const status = await this.getAvatarStatus(scheduleId);
        onUpdate(status);
      } catch (error) {
        console.error('Erreur lors de la mise à jour automatique du statut:', error);
      }
    }, intervalMs);

    // Première récupération immédiate
    this.getAvatarStatus(scheduleId).then(onUpdate).catch(console.error);

    // Retourner la fonction pour arrêter le polling
    return () => clearInterval(interval);
  }
}