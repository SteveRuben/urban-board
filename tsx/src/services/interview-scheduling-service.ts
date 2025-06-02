// services/interview-scheduling-service.ts
import { InterviewSchedule, InterviewScheduleFormData, PublicScheduleData, ScheduleFilters } from '@/types/interview-scheduling';
import { api } from './user-service';

export class InterviewSchedulingService {
  /**
   * Crée une nouvelle planification d'entretien
   * @param data Données de la planification
   * @returns La planification créée
   */
  static async createSchedule(data: InterviewScheduleFormData): Promise<InterviewSchedule> {
    try {
      console.log("InterviewSchedulingService: Préparation de la création de planification", {
        candidate_name: data.candidate_name,
        title: data.title,
        scheduled_at: data.scheduled_at,
        mode: data.mode
      });

      const requestData = {
        ...data
      };

      console.log("InterviewSchedulingService: Données préparées, envoi de la requête");

      const response = await api.post('/scheduling/schedules', requestData);

      console.log("InterviewSchedulingService: Réponse reçue", response.status);

      if (response.data.status === 'error') {
        throw new Error(response.data.message || 'Erreur lors de la création de la planification');
      }

      return response.data.data;
    } catch (error) {
      console.error('Erreur détaillée lors de la création de la planification:', error);
      throw new Error('Une erreur inattendue est survenue lors de la création de la planification');
    }
  }

  /**
   * Récupère une planification par son ID
   * @param scheduleId Identifiant de la planification
   * @returns La planification correspondante
   */
  static async getSchedule(scheduleId: string): Promise<InterviewSchedule> {
    try {
      console.log("InterviewSchedulingService: Préparation de la récupération de la planification", { scheduleId });

      const response = await api.get(`/scheduling/schedules/${scheduleId}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log("InterviewSchedulingService: Réponse reçue", response.status);

      if (response.data.status === 'error') {
        throw new Error(response.data.message || 'Planification introuvable');
      }

      return response.data.data;
    } catch (error) {
      console.error('Erreur détaillée lors de la récupération de la planification:', error);
      throw new Error('Une erreur inattendue est survenue lors de la récupération de la planification');
    }
  }

  /**
   * Met à jour une planification d'entretien
   * @param scheduleId Identifiant de la planification
   * @param data Nouvelles données
   * @returns La planification mise à jour
   */
  static async updateSchedule(scheduleId: string, data: Partial<InterviewScheduleFormData>): Promise<InterviewSchedule> {
    try {
      console.log("InterviewSchedulingService: Préparation de la mise à jour de la planification", {
        scheduleId,
        candidate_name: data.candidate_name,
        scheduled_at: data.scheduled_at,
        mode: data.mode
      });

      const requestData = {
        ...data
      };

      console.log("InterviewSchedulingService: Données préparées, envoi de la requête");

      const response = await api.put(`/scheduling/schedules/${scheduleId}`, requestData, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log("InterviewSchedulingService: Réponse reçue", response.status);

      if (response.data.status === 'error') {
        throw new Error(response.data.message || 'Erreur lors de la mise à jour');
      }

      return response.data.data;
    } catch (error) {
      console.error('Erreur détaillée lors de la mise à jour de la planification:', error);
      throw new Error('Une erreur inattendue est survenue lors de la mise à jour de la planification');
    }
  }

  /**
   * Annule une planification d'entretien
   * @param scheduleId Identifiant de la planification
   * @param reason Raison de l'annulation (optionnel)
   * @returns La planification annulée
   */
  static async cancelSchedule(scheduleId: string, reason?: string): Promise<InterviewSchedule> {
    try {
      console.log("InterviewSchedulingService: Préparation de l'annulation de la planification", {
        scheduleId,
        reason
      });

      const requestData = {
        ...(reason && { reason })
      };

      console.log("InterviewSchedulingService: Données préparées, envoi de la requête");

      const response = await api.post(`/scheduling/schedules/${scheduleId}/cancel`, requestData, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log("InterviewSchedulingService: Réponse reçue", response.status);

      if (response.data.status === 'error') {
        throw new Error(response.data.message || 'Erreur lors de l\'annulation');
      }

      return response.data.data;
    } catch (error) {
      console.error('Erreur détaillée lors de l\'annulation de la planification:', error);
      throw new Error('Une erreur inattendue est survenue lors de l\'annulation de la planification');
    }
  }

  /**
   * Récupère les planifications de l'utilisateur connecté
   * @param filters Paramètres de filtrage
   * @returns Liste des planifications
   */
  static async getMySchedules(filters: ScheduleFilters = {}): Promise<InterviewSchedule[]> {
    try {
      const { status, from_date, to_date, limit = 20, offset = 0 } = filters;
      
      console.log("InterviewSchedulingService: Préparation de la récupération des planifications utilisateur", {
        status,
        from_date,
        to_date,
        limit,
        offset
      });

      // Construire les paramètres de requête
      const queryParams = new URLSearchParams();
      
      if (status && status !== 'all') {
        queryParams.append('status', status);
      }
      
      if (from_date) {
        queryParams.append('from_date', from_date);
      }
      
      if (to_date) {
        queryParams.append('to_date', to_date);
      }

      console.log("InterviewSchedulingService: Paramètres de requête créés, envoi de la requête");

      const response = await api.get('/scheduling/schedules/me', {
        params: Object.fromEntries(queryParams),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log("InterviewSchedulingService: Réponse reçue", response.status);

      if (response.data.status === 'error') {
        throw new Error(response.data.message || 'Erreur lors de la récupération des planifications');
      }

      return response.data.data;
    } catch (error) {
      console.error('Erreur détaillée lors de la récupération des planifications utilisateur:', error);
      throw new Error('Une erreur inattendue est survenue lors de la récupération des planifications');
    }
  }

  /**
   * Récupère les planifications de l'organisation
   * @param filters Paramètres de filtrage
   * @returns Liste des planifications de l'organisation
   */
  static async getOrganizationSchedules(filters: ScheduleFilters = {}): Promise<InterviewSchedule[]> {
    try {
      const { status, from_date, to_date, limit = 20, offset = 0 } = filters;
      
      console.log("InterviewSchedulingService: Préparation de la récupération des planifications organisation", {
        status,
        from_date,
        to_date,
        limit,
        offset
      });

      // Construire les paramètres de requête
      const queryParams = new URLSearchParams();
      
      if (status && status !== 'all') {
        queryParams.append('status', status);
      }
      
      if (from_date) {
        queryParams.append('from_date', from_date);
      }
      
      if (to_date) {
        queryParams.append('to_date', to_date);
      }

      console.log("InterviewSchedulingService: Paramètres de requête créés, envoi de la requête");

      const response = await api.get('/scheduling/organizations/current/schedules', {
        params: Object.fromEntries(queryParams),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log("InterviewSchedulingService: Réponse reçue", response.status);

      if (response.data.status === 'error') {
        throw new Error(response.data.message || 'Erreur lors de la récupération des planifications');
      }

      return response.data.data;
    } catch (error) {
      console.error('Erreur détaillée lors de la récupération des planifications organisation:', error);
      throw new Error('Une erreur inattendue est survenue lors de la récupération des planifications');
    }
  }

  /**
   * Récupère une planification par son token d'accès (pour le candidat)
   * @param accessToken Token d'accès unique
   * @returns Données publiques de la planification
   */
  static async getScheduleByToken(accessToken: string): Promise<PublicScheduleData> {
    try {
      console.log("InterviewSchedulingService: Préparation de la récupération par token", { accessToken });

      const response = await api.get(`/scheduling/schedules/access/${accessToken}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log("InterviewSchedulingService: Réponse reçue", response.status);

      if (response.data.status === 'error') {
        throw new Error(response.data.message || 'Lien d\'entretien invalide');
      }

      return response.data.data;
    } catch (error) {
      console.error('Erreur détaillée lors de la récupération par token:', error);
      throw new Error('Une erreur inattendue est survenue lors de la récupération de l\'entretien');
    }
  }

  /**
   * Confirme une planification d'entretien
   * @param scheduleId Identifiant de la planification
   * @returns La planification confirmée
   */
  static async confirmSchedule(scheduleId: string): Promise<InterviewSchedule> {
    try {
      console.log("InterviewSchedulingService: Préparation de la confirmation de la planification", { scheduleId });

      const response = await api.post(`/scheduling/schedules/${scheduleId}/confirm`, {}, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log("InterviewSchedulingService: Réponse reçue", response.status);

      if (response.data.status === 'error') {
        throw new Error(response.data.message || 'Erreur lors de la confirmation');
      }

      return response.data.data;
    } catch (error) {
      console.error('Erreur détaillée lors de la confirmation de la planification:', error);
      throw new Error('Une erreur inattendue est survenue lors de la confirmation de la planification');
    }
  }

  /**
   * Marque un candidat comme absent
   * @param scheduleId Identifiant de la planification
   * @returns La planification mise à jour
   */
  static async markAsNoShow(scheduleId: string): Promise<InterviewSchedule> {
    try {
      console.log("InterviewSchedulingService: Préparation du marquage comme absent", { scheduleId });

      const response = await api.post(`/scheduling/schedules/${scheduleId}/no-show`, {}, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log("InterviewSchedulingService: Réponse reçue", response.status);

      if (response.data.status === 'error') {
        throw new Error(response.data.message || 'Erreur lors du marquage comme absent');
      }

      return response.data.data;
    } catch (error) {
      console.error('Erreur détaillée lors du marquage comme absent:', error);
      throw new Error('Une erreur inattendue est survenue lors du marquage comme absent');
    }
  }

  /**
   * Démarre un entretien planifié
   * @param scheduleId Identifiant de la planification
   * @param interviewId Identifiant de l'entretien réel
   * @returns La planification mise à jour
   */
  static async startInterview(scheduleId: string, interviewId: string): Promise<InterviewSchedule> {
    try {
      console.log("InterviewSchedulingService: Préparation du démarrage de l'entretien", {
        scheduleId,
        interviewId
      });

      const requestData = {
        interview_id: interviewId
      };

      const response = await api.post(`/scheduling/schedules/${scheduleId}/start`, requestData, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log("InterviewSchedulingService: Réponse reçue", response.status);

      if (response.data.status === 'error') {
        throw new Error(response.data.message || 'Erreur lors du démarrage de l\'entretien');
      }

      return response.data.data;
    } catch (error) {
      console.error('Erreur détaillée lors du démarrage de l\'entretien:', error);
      throw new Error('Une erreur inattendue est survenue lors du démarrage de l\'entretien');
    }
  }

  /**
   * Marque un entretien comme terminé
   * @param scheduleId Identifiant de la planification
   * @returns La planification mise à jour
   */
  static async completeInterview(scheduleId: string): Promise<InterviewSchedule> {
    try {
      console.log("InterviewSchedulingService: Préparation de la finalisation de l'entretien", { scheduleId });

      const response = await api.post(`/scheduling/schedules/${scheduleId}/complete`, {}, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log("InterviewSchedulingService: Réponse reçue", response.status);

      if (response.data.status === 'error') {
        throw new Error(response.data.message || 'Erreur lors de la finalisation de l\'entretien');
      }

      return response.data.data;
    } catch (error) {
      console.error('Erreur détaillée lors de la finalisation de l\'entretien:', error);
      throw new Error('Une erreur inattendue est survenue lors de la finalisation de l\'entretien');
    }
  }

  // ===== MÉTHODES UTILITAIRES =====

  /**
   * Traduit les statuts d'entretien en français
   * @param status Statut en anglais
   * @returns Statut traduit en français
   */
  static getScheduleStatusLabel(status: InterviewSchedule['status']): string {
    const statusLabels = {
      'scheduled': 'Planifié',
      'confirmed': 'Confirmé',
      'in_progress': 'En cours',
      'completed': 'Terminé',
      'canceled': 'Annulé',
      'no_show': 'Absence candidat'
    };
    return statusLabels[status] || status;
  }

  /**
   * Obtient la couleur associée à un statut d'entretien
   * @param status Statut de l'entretien
   * @returns Code couleur hexadécimal
   */
  static getScheduleStatusColor(status: InterviewSchedule['status']): string {
    const statusColors = {
      'scheduled': '#3498db',
      'confirmed': '#27ae60',
      'in_progress': '#f39c12',
      'completed': '#2ecc71',
      'canceled': '#e74c3c',
      'no_show': '#95a5a6'
    };
    return statusColors[status] || '#95a5a6';
  }

  /**
   * Traduit les modes d'entretien en français
   * @param mode Mode d'entretien
   * @returns Mode traduit en français
   */
  static getInterviewModeLabel(mode: InterviewSchedule['mode']): string {
    const modeLabels = {
      'collaborative': 'Collaboratif',
      'autonomous': 'Autonome'
    };
    return modeLabels[mode] || mode;
  }

  /**
   * Obtient la description détaillée d'un mode d'entretien
   * @param mode Mode d'entretien
   * @returns Description du mode
   */
  static getInterviewModeDescription(mode: InterviewSchedule['mode']): string {
    const modeDescriptions = {
      'collaborative': 'Entretien avec assistant IA et interaction directe avec le recruteur',
      'autonomous': 'Entretien autonome géré entièrement par l\'assistant IA'
    };
    return modeDescriptions[mode] || mode;
  }

  /**
   * Valide les données d'une planification d'entretien
   * @param data Données de planification à valider
   * @returns Objet avec les erreurs de validation
   */
  static validateScheduleData(data: InterviewScheduleFormData): Record<string, string> {
    const errors: Record<string, string> = {};

    if (!data.candidate_name?.trim()) {
      errors.candidate_name = 'Le nom du candidat est requis';
    }

    if (!data.candidate_email?.trim()) {
      errors.candidate_email = 'L\'email du candidat est requis';
    } else if (!/\S+@\S+\.\S+/.test(data.candidate_email)) {
      errors.candidate_email = 'Format d\'email invalide';
    }

    if (!data.title?.trim()) {
      errors.title = 'Le titre de l\'entretien est requis';
    }

    if (!data.position?.trim()) {
      errors.position = 'Le poste est requis';
    }

    if (!data.scheduled_at) {
      errors.scheduled_at = 'La date et heure sont requises';
    } else {
      const scheduledDate = new Date(data.scheduled_at);
      if (isNaN(scheduledDate.getTime())) {
        errors.scheduled_at = 'Format de date invalide';
      } else if (scheduledDate <= new Date()) {
        errors.scheduled_at = 'La date doit être dans le futur';
      }
    }

    if (!data.mode) {
      errors.mode = 'Le mode d\'entretien est requis';
    } else if (!['collaborative', 'autonomous'].includes(data.mode)) {
      errors.mode = 'Mode d\'entretien invalide';
    }

    if (data.duration_minutes && (data.duration_minutes < 15 || data.duration_minutes > 480)) {
      errors.duration_minutes = 'La durée doit être entre 15 minutes et 8 heures';
    }

    return errors;
  }

  /**
   * Formate la durée d'un entretien en texte lisible
   * @param minutes Durée en minutes
   * @returns Durée formatée (ex: "1h 30min")
   */
  static formatDuration(minutes: number): string {
    if (minutes < 60) {
      return `${minutes}min`;
    }
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (remainingMinutes === 0) {
      return `${hours}h`;
    }
    
    return `${hours}h ${remainingMinutes}min`;
  }

  /**
   * Formate une date/heure d'entretien avec fuseau horaire
   * @param dateString Date ISO string
   * @param timezone Fuseau horaire
   * @returns Date formatée
   */
  static formatScheduledDateTime(dateString: string, timezone: string = 'Europe/Paris'): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('fr-FR', {
        timeZone: timezone,
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Erreur formatage date:', error);
      return dateString;
    }
  }

  /**
   * Vérifie si un entretien peut encore être modifié
   * @param schedule Planification d'entretien
   * @returns True si modifiable, false sinon
   */
  static canBeModified(schedule: InterviewSchedule): boolean {
    const nonModifiableStatuses = ['in_progress', 'completed', 'canceled', 'no_show'];
    return !nonModifiableStatuses.includes(schedule.status);
  }

  /**
   * Vérifie si un entretien peut être démarré
   * @param schedule Planification d'entretien
   * @returns True si peut être démarré, false sinon
   */
  static canBeStarted(schedule: InterviewSchedule): boolean {
    const startableStatuses = ['scheduled', 'confirmed'];
    const now = new Date();
    const scheduledTime = new Date(schedule.scheduled_at);
    const startTime = new Date(scheduledTime.getTime() - 15 * 60 * 1000); // 15 minutes avant
    
    return startableStatuses.includes(schedule.status) && now >= startTime;
  }

  /**
   * Calcule le temps restant avant un entretien
   * @param scheduledAt Date/heure de l'entretien
   * @returns Objet avec le temps restant
   */
  static getTimeUntilInterview(scheduledAt: string): {
    isPast: boolean;
    timeUntil: string;
    canStart: boolean;
  } {
    const now = new Date();
    const interviewTime = new Date(scheduledAt);
    const timeDiff = interviewTime.getTime() - now.getTime();
    
    if (timeDiff < 0) {
      return {
        isPast: true,
        timeUntil: 'Passé',
        canStart: false
      };
    }
    
    const canStart = timeDiff <= 15 * 60 * 1000; // 15 minutes
    
    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
    
    let timeUntil = '';
    if (days > 0) {
      timeUntil = `${days}j ${hours}h`;
    } else if (hours > 0) {
      timeUntil = `${hours}h ${minutes}min`;
    } else {
      timeUntil = `${minutes}min`;
    }
    
    return {
      isPast: false,
      timeUntil,
      canStart
    };
  }
}