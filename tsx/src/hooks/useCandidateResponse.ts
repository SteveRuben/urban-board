// tsx/src/hooks/useCandidateResponse.ts

import { useState, useEffect, useCallback } from 'react';
import { InterviewSchedulingService } from '../services/interview-scheduling-service';
import { InterviewSchedule } from '../types/interview-scheduling';

// Système de notifications personnalisé
const showNotification = {
  success: (content: string) => {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #f6ffed;
      border: 1px solid #b7eb8f;
      color: #52c41a;
      padding: 12px 16px;
      border-radius: 6px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 9999;
      font-size: 14px;
      max-width: 300px;
    `;
    notification.textContent = content;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification);
      }
    }, 3000);
  },
  error: (content: string) => {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #fff2f0;
      border: 1px solid #ffccc7;
      color: #ff4d4f;
      padding: 12px 16px;
      border-radius: 6px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 9999;
      font-size: 14px;
      max-width: 300px;
    `;
    notification.textContent = content;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification);
      }
    }, 3000);
  }
};

interface CandidateResponseState {
  loading: boolean;
  schedule: InterviewSchedule | null;
  error: string | null;
  lastUpdated: Date | null;
}

interface CandidateResponseActions {
  refreshStatus: () => Promise<void>;
  resendInvitation: () => Promise<boolean>;
  getEmailPreview: () => Promise<string>;
  canCandidateRespond: boolean;
  responseStatus: 'confirmed' | 'canceled' | 'pending' | 'expired';
  responseMetadata: {
    hasResponded: boolean;
    responseDate?: Date;
    cancellationReason?: string;
    canStillRespond: boolean;
    responseTimeLeft?: string;
  };
}

export const useCandidateResponse = (
  scheduleId: string,
  autoRefresh: boolean = false,
  refreshInterval: number = 30000 // 30 secondes
): [CandidateResponseState, CandidateResponseActions] => {
  
  const [state, setState] = useState<CandidateResponseState>({
    loading: true,
    schedule: null,
    error: null,
    lastUpdated: null
  });

  // Rafraîchir le statut depuis l'API
  const refreshStatus = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const updatedSchedule = await InterviewSchedulingService.getCandidateResponseStatus(scheduleId);
      
      setState(prev => ({
        ...prev,
        loading: false,
        schedule: updatedSchedule,
        lastUpdated: new Date()
      }));
      
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Erreur lors du rafraîchissement'
      }));
    }
  }, [scheduleId]);

  // Renvoyer l'invitation
  const resendInvitation = useCallback(async (): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, loading: true }));
      
      const success = await InterviewSchedulingService.resendInvitation(scheduleId);
      
      if (success) {
        showNotification.success('Invitation renvoyée avec succès !');
        // Rafraîchir automatiquement après renvoi
        await refreshStatus();
        return true;
      } else {
        showNotification.error('Erreur lors du renvoi de l\'invitation');
        return false;
      }
      
    } catch (error: any) {
      showNotification.error(`Erreur : ${error.message}`);
      setState(prev => ({ ...prev, loading: false }));
      return false;
    }
  }, [scheduleId, refreshStatus]);

  // Obtenir l'aperçu de l'email
  const getEmailPreview = useCallback(async (): Promise<string> => {
    try {
      return await InterviewSchedulingService.getEmailPreview(scheduleId);
    } catch (error: any) {
      showNotification.error(`Erreur aperçu email : ${error.message}`);
      throw error;
    }
  }, [scheduleId]);

  // Calculer le statut de réponse candidat
  const getResponseStatus = useCallback((): 'confirmed' | 'canceled' | 'pending' | 'expired' => {
    if (!state.schedule) return 'pending';
    
    if (state.schedule.was_confirmed_by_candidate) return 'confirmed';
    if (state.schedule.was_canceled_by_candidate) return 'canceled';
    if (!state.schedule.can_candidate_respond?.can_respond) return 'expired';
    
    return 'pending';
  }, [state.schedule]);

  // Calculer les métadonnées de réponse
  const getResponseMetadata = useCallback(() => {
    const schedule = state.schedule;
    if (!schedule) {
      return {
        hasResponded: false,
        canStillRespond: false
      };
    }

    const hasResponded = schedule.was_confirmed_by_candidate || schedule.was_canceled_by_candidate;
    const responseDate = schedule.candidate_response_date ? new Date(schedule.candidate_response_date) : undefined;
    const canStillRespond = schedule.can_candidate_respond?.can_respond || false;
    
    // Calculer le temps restant pour répondre
    let responseTimeLeft: string | undefined;
    if (canStillRespond && schedule.scheduled_at) {
      const scheduledDate = new Date(schedule.scheduled_at);
      const now = new Date();
      const timeUntilInterview = scheduledDate.getTime() - now.getTime();
      
      if (timeUntilInterview > 0) {
        const hoursLeft = Math.floor(timeUntilInterview / (1000 * 60 * 60));
        const daysLeft = Math.floor(hoursLeft / 24);
        
        if (daysLeft > 1) {
          responseTimeLeft = `${daysLeft} jours restants`;
        } else if (hoursLeft > 24) {
          responseTimeLeft = `1 jour restant`;
        } else if (hoursLeft > 2) {
          responseTimeLeft = `${hoursLeft} heures restantes`;
        } else if (hoursLeft > 0) {
          responseTimeLeft = `Moins de 2 heures restantes`;
        } else {
          responseTimeLeft = `Entretien imminent`;
        }
      }
    }

    return {
      hasResponded,
      responseDate,
      cancellationReason: schedule.cancellation_reason,
      canStillRespond,
      responseTimeLeft
    };
  }, [state.schedule]);

  // Détecter si le candidat peut encore répondre
  const canCandidateRespond = state.schedule?.can_candidate_respond?.can_respond || false;

  // Auto-refresh si activé
  useEffect(() => {
    if (autoRefresh && refreshInterval > 0) {
      const interval = setInterval(refreshStatus, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval, refreshStatus]);

  // Chargement initial
  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  // Actions
  const actions: CandidateResponseActions = {
    refreshStatus,
    resendInvitation,
    getEmailPreview,
    canCandidateRespond,
    responseStatus: getResponseStatus(),
    responseMetadata: getResponseMetadata()
  };

  return [state, actions];
};

// Hook simplifié pour juste obtenir le statut sans actions
export const useCandidateResponseStatus = (scheduleId: string) => {
  const [state, actions] = useCandidateResponse(scheduleId, false);
  
  return {
    loading: state.loading,
    responseStatus: actions.responseStatus,
    hasResponded: actions.responseMetadata.hasResponded,
    canStillRespond: actions.responseMetadata.canStillRespond,
    cancellationReason: actions.responseMetadata.cancellationReason,
    responseDate: actions.responseMetadata.responseDate,
    timeLeft: actions.responseMetadata.responseTimeLeft
  };
};

export default useCandidateResponse;