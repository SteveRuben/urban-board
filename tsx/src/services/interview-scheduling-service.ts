import { CandidateResponseInfo, CandidateResponseStatusResponse, EmailPreviewResponse, InterviewSchedule, InterviewScheduleFilter, InterviewScheduleFormData, InterviewScheduleUpdateData, PublicScheduleData, ResendInvitationResponse, ScheduleFilters } from '@/types/interview-scheduling';
import { api } from './user-service'; 
import axios from 'axios'; 


const UPDATABLE_FIELDS = [
  'scheduled_at',
  'duration_minutes', 
  'timezone',
  'mode',
  'ai_assistant_id',
  'predefined_questions'
] as const;

type UpdatableField = typeof UPDATABLE_FIELDS[number];

/**
 * Filtre les données pour ne garder que les champs modifiables
 */
const filterUpdatableData = (data: any): InterviewScheduleUpdateData => {
  const filtered: any = {};
  
  UPDATABLE_FIELDS.forEach(field => {
    if (field in data && data[field] !== undefined) {
      if (field === 'predefined_questions' && Array.isArray(data[field])) {
        // Filtrer les questions vides
        filtered[field] = data[field].filter((q: string) => q.trim() !== '');
      } else if (field === 'ai_assistant_id' && data[field] === '') {
        // Permettre de vider l'assistant IA
        filtered[field] = '';
      } else {
        filtered[field] = data[field];
      }
    }
  });
  
  return filtered;
};

/**
 * Valide les données de mise à jour limitée
 */
const validateUpdateData = (data: InterviewScheduleUpdateData): Record<string, string> => {
  const errors: Record<string, string> = {};
  
  // Validation de la date
  if (data.scheduled_at) {
    const scheduledDate = new Date(data.scheduled_at);
    if (isNaN(scheduledDate.getTime())) {
      errors.scheduled_at = "Format de date invalide";
    } else if (scheduledDate <= new Date()) {
      errors.scheduled_at = "La date doit être dans le futur";
    }
  }
  
  // Validation de la durée
  if (data.duration_minutes !== undefined) {
    if (!Number.isInteger(data.duration_minutes) || data.duration_minutes < 15 || data.duration_minutes > 480) {
      errors.duration_minutes = "La durée doit être entre 15 minutes et 8 heures";
    }
  }
  
  // Validation du mode
  if (data.mode && !['autonomous', 'collaborative'].includes(data.mode)) {
    errors.mode = "Mode d'entretien invalide";
  }
  
  // Validation du fuseau horaire
  if (data.timezone) {
    const validTimezones = ['Europe/Paris', 'Europe/London', 'America/New_York', 'America/Los_Angeles', 'Africa/Douala'];
    if (!validTimezones.includes(data.timezone)) {
      errors.timezone = "Fuseau horaire non supporté";
    }
  }
  
  // Validation des questions prédéfinies
  if (data.predefined_questions) {
    if (!Array.isArray(data.predefined_questions)) {
      errors.predefined_questions = "Les questions doivent être une liste";
    } else {
      for (let i = 0; i < data.predefined_questions.length; i++) {
        const question = data.predefined_questions[i];
        if (typeof question !== 'string') {
          errors.predefined_questions = `La question ${i + 1} doit être une chaîne de caractères`;
          break;
        }
        if (question.trim().length > 500) {
          errors.predefined_questions = `La question ${i + 1} est trop longue (max 500 caractères)`;
          break;
        }
      }
    }
  }
  
  return errors;
};

export class InterviewSchedulingService {
  /**
   * Crée une nouvelle planification d'entretien (NÉCESSITE AUTHENTIFICATION)
   */
  static async createSchedule(data: InterviewScheduleFormData): Promise<InterviewSchedule> {
    try {
      console.log("InterviewSchedulingService: Préparation de la création de planification", {
        candidate_name: data.candidate_name,
        title: data.title,
        scheduled_at: data.scheduled_at,
        mode: data.mode
      });
      console.log('...........1.',data)
      const response = await api.post('/scheduling/schedules', data);

      console.log("InterviewSchedulingService: Réponse reçue", response.status);

      if (response.data.status === 'error') {
        // Créer une erreur avec plus de détails
        const error = new Error(response.data.message || 'Erreur lors de la création de la planification');
        (error as any).response = {
          status: 400,
          data: response.data
        };
        throw error;
      }

      return response.data.data;
    } catch (error: any) {
      console.error('Erreur détaillée lors de la création de la planification:', error);
      
      // Si c'est déjà une erreur HTTP, la relancer telle quelle
      if (error.response) {
        throw error;
      }
      
      // Sinon, créer une erreur réseau
      const networkError = new Error('Une erreur de réseau est survenue');
      (networkError as any).isNetworkError = true;
      throw networkError;
    }
  }

  /**
   * Récupère une planification par son ID (NÉCESSITE AUTHENTIFICATION)
   */
  static async getSchedule(scheduleId: string): Promise<InterviewSchedule> {
    try {
      console.log("InterviewSchedulingService: Récupération de la planification", { scheduleId });

      const response = await api.get(`/scheduling/schedules/${scheduleId}`);

      console.log("InterviewSchedulingService: Réponse reçue", response.status);

      if (response.data.status === 'error') {
        throw new Error(response.data.message || 'Planification introuvable');
      }

      return response.data.data;
    } catch (error: any) {
      console.error('Erreur détaillée lors de la récupération de la planification:', error);
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Une erreur inattendue est survenue lors de la récupération de la planification');
    }
  }

  /**
   * Met à jour une planification d'entretien (NÉCESSITE AUTHENTIFICATION)
   */
  static async updateSchedule(scheduleId: string, data: Partial<InterviewScheduleFormData>): Promise<InterviewSchedule> {
    try {
      console.log("InterviewSchedulingService: Préparation de la mise à jour limitée", {
        scheduleId,
        fields: Object.keys(data)
      });

      // Filtrer les données pour ne garder que les champs autorisés
      const filteredData = filterUpdatableData(data);

      // Vérifier qu'il y a au moins un champ à mettre à jour
      if (Object.keys(filteredData).length === 0) {
        throw new Error(`Aucun champ modifiable fourni. Champs autorisés: ${UPDATABLE_FIELDS.join(', ')}`);
      }

      // Valider les données filtrées
      const validationErrors = validateUpdateData(filteredData);
      if (Object.keys(validationErrors).length > 0) {
        const firstError = Object.values(validationErrors)[0];
        throw new Error(firstError);
      }

      console.log("InterviewSchedulingService: Données filtrées et validées", filteredData);

      const response = await api.put(`/scheduling/schedules/${scheduleId}`, filteredData);

      console.log("InterviewSchedulingService: Réponse reçue", response.status);

      if (response.data.status === 'error') {
        throw new Error(response.data.message || 'Erreur lors de la mise à jour');
      }

      return response.data.data;
    } catch (error: any) {
      console.error('Erreur détaillée lors de la mise à jour limitée:', error);

      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }

      throw new Error(error.message || 'Une erreur inattendue est survenue lors de la mise à jour');
    }
  }

  /**
   * Annule une planification d'entretien 
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

      const response = await api.post(`/api/scheduling/schedules/${scheduleId}/cancel`, requestData);

      console.log("InterviewSchedulingService: Réponse reçue", response.status);

      if (response.data.status === 'error') {
        throw new Error(response.data.message || 'Erreur lors de l\'annulation');
      }

      return response.data.data;
    } catch (error: any) {
      console.error('Erreur détaillée lors de l\'annulation de la planification:', error);
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Une erreur inattendue est survenue lors de l\'annulation de la planification');
    }
  }

  /**
   * Récupère les planifications de l'utilisateur connecté (NÉCESSITE AUTHENTIFICATION)
   */
  static async getMySchedules(filters: ScheduleFilters = {}): Promise<InterviewSchedule[]> {
    try {
      const { status, from_date, to_date, limit = 20, offset = 0 } = filters;
      
      console.log("InterviewSchedulingService: Récupération des planifications utilisateur", {
        status, from_date, to_date, limit, offset
      });

      const params: any = {};
      
      if (status && status !== 'all') {
        params.status = status;
      }
      
      if (from_date) {
        params.from_date = from_date;
      }
      
      if (to_date) {
        params.to_date = to_date;
      }

      if (limit) {
        params.limit = limit;
      }

      if (offset) {
        params.offset = offset;
      }

      const response = await api.get('/scheduling/schedules/me', { params });

      console.log("InterviewSchedulingService: Réponse reçue", response.status);

      if (response.data.status === 'error') {
        throw new Error(response.data.message || 'Erreur lors de la récupération des planifications');
      }

      return response.data.data;
    } catch (error: any) {
      console.error('Erreur détaillée lors de la récupération des planifications utilisateur:', error);
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Une erreur inattendue est survenue lors de la récupération des planifications');
    }
  }

  /**
   * Récupère les planifications de l'organisation (NÉCESSITE AUTHENTIFICATION)
   */
  static async getOrganizationSchedules(filters: ScheduleFilters = {}): Promise<InterviewSchedule[]> {
    try {
      const { status, from_date, to_date, limit = 20, offset = 0 } = filters;
      
      console.log("InterviewSchedulingService: Récupération des planifications organisation", {
        status, from_date, to_date, limit, offset
      });

      const params: any = {};
      
      if (status && status !== 'all') {
        params.status = status;
      }
      
      if (from_date) {
        params.from_date = from_date;
      }
      
      if (to_date) {
        params.to_date = to_date;
      }

      if (limit) {
        params.limit = limit;
      }

      if (offset) {
        params.offset = offset;
      }

      const response = await api.get('/scheduling/organizations/current/schedules', { params });

      console.log("InterviewSchedulingService: Réponse reçue", response.status);

      if (response.data.status === 'error') {
        throw new Error(response.data.message || 'Erreur lors de la récupération des planifications');
      }

      return response.data.data;
    } catch (error: any) {
      console.error('Erreur détaillée lors de la récupération des planifications organisation:', error);
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Une erreur inattendue est survenue lors de la récupération des planifications');
    }
  }

  /**
   * Récupère une planification par son token d'accès (ENDPOINT PUBLIC - SANS AUTHENTIFICATION)
   */
  static async getScheduleByToken(accessToken: string): Promise<PublicScheduleData> {
    try {
      console.log("InterviewSchedulingService: Récupération par token", { accessToken });

      const response = await axios.get(`/api/scheduling/schedules/access/${accessToken}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log("InterviewSchedulingService: Réponse reçue", response.status);

      if (response.data.status === 'error') {
        throw new Error(response.data.message || 'Lien d\'entretien invalide');
      }

      return response.data.data;
    } catch (error: any) {
      console.error('Erreur détaillée lors de la récupération par token:', error);
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Une erreur inattendue est survenue lors de la récupération de l\'entretien');
    }
  }

  /**
   * Confirme une planification d'entretien 
   */
  static async confirmSchedule(scheduleId: string): Promise<InterviewSchedule> {
    try {
      console.log("InterviewSchedulingService: Confirmation de la planification", { scheduleId });

      const response = await axios.post(`/api/scheduling/schedules/${scheduleId}/confirm`, {});

      console.log("InterviewSchedulingService: Réponse reçue", response.status);

      if (response.data.status === 'error') {
        throw new Error(response.data.message || 'Erreur lors de la confirmation');
      }

      return response.data.data;
    } catch (error: any) {
      console.error('Erreur détaillée lors de la confirmation de la planification:', error);
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Une erreur inattendue est survenue lors de la confirmation de la planification');
    }
  }

  /**
   * Marque un candidat comme absent 
   */
  static async markAsNoShow(scheduleId: string): Promise<InterviewSchedule> {
    try {
      console.log("InterviewSchedulingService: Marquage comme absent", { scheduleId });

      const response = await api.post(`/scheduling/schedules/${scheduleId}/no-show`, {});

      console.log("InterviewSchedulingService: Réponse reçue", response.status);

      if (response.data.status === 'error') {
        throw new Error(response.data.message || 'Erreur lors du marquage comme absent');
      }

      return response.data.data;
    } catch (error: any) {
      console.error('Erreur détaillée lors du marquage comme absent:', error);
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Une erreur inattendue est survenue lors du marquage comme absent');
    }
  }

  /**
   * Démarre un entretien planifié 
   */
  static async startInterview(scheduleId: string, interviewId: string): Promise<InterviewSchedule> {
    try {
      console.log("InterviewSchedulingService: Démarrage de l'entretien", {
        scheduleId,
        interviewId
      });

      const requestData = {
        interview_id: interviewId
      };

      const response = await api.post(`/scheduling/schedules/${scheduleId}/start`, requestData);

      console.log("InterviewSchedulingService: Réponse reçue", response.status);

      if (response.data.status === 'error') {
        throw new Error(response.data.message || 'Erreur lors du démarrage de l\'entretien');
      }

      return response.data.data;
    } catch (error: any) {
      console.error('Erreur détaillée lors du démarrage de l\'entretien:', error);
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Une erreur inattendue est survenue lors du démarrage de l\'entretien');
    }
  }

  /**
   * Marque un entretien comme terminé 
   */
  static async completeInterview(scheduleId: string): Promise<InterviewSchedule> {
    try {
      console.log("InterviewSchedulingService: Finalisation de l'entretien", { scheduleId });

      const response = await api.post(`/scheduling/schedules/${scheduleId}/complete`, {});

      console.log("InterviewSchedulingService: Réponse reçue", response.status);

      if (response.data.status === 'error') {
        throw new Error(response.data.message || 'Erreur lors de la finalisation de l\'entretien');
      }

      return response.data.data;
    } catch (error: any) {
      console.error('Erreur détaillée lors de la finalisation de l\'entretien:', error);
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Une erreur inattendue est survenue lors de la finalisation de l\'entretien');
    }
  }

  /**
   * Récupère le statut de réponse candidat pour un entretien (NÉCESSITE AUTHENTIFICATION)
   */
  static async getCandidateResponseStatus(scheduleId: string): Promise<InterviewSchedule> {
    try {
      const response = await api.get(`/scheduling/schedules/${scheduleId}/candidate-status`);

      if (response.data.status === 'error') {
        throw new Error(response.data.message || 'Erreur lors de la récupération du statut candidat');
      }

      const result: CandidateResponseStatusResponse = response.data;
      
      // Transformer la réponse API en objet InterviewSchedule complet
      const schedule = await this.getSchedule(scheduleId);
      
      return {
        ...schedule,
        was_confirmed_by_candidate: result.data.confirmed_by_candidate,
        was_canceled_by_candidate: result.data.canceled_by_candidate,
        cancellation_reason: result.data.cancellation_reason,
        candidate_response_date: result.data.response_date,
        can_candidate_respond: {
          can_respond: result.data.can_respond,
          reason: result.data.response_reason || ""
        }
      };
    } catch (error: any) {
      console.error('Erreur getCandidateResponseStatus:', error);
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw error;
    }
  }

  /**
   * Renvoie l'invitation email à un candidat (NÉCESSITE AUTHENTIFICATION)
   */
  static async resendInvitation(scheduleId: string): Promise<boolean> {
    try {
      const response = await api.post(`/scheduling/schedules/${scheduleId}/resend-invitation`, {});

      if (response.data.status === 'error') {
        throw new Error(response.data.message || 'Erreur lors du renvoi de l\'invitation');
      }

      const result: ResendInvitationResponse = response.data;
      return result.data.email_sent;
    } catch (error: any) {
      console.error('Erreur resendInvitation:', error);
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw error;
    }
  }

  /**
   * Récupère l'aperçu HTML de l'email d'invitation (NÉCESSITE AUTHENTIFICATION)
   */
  static async getEmailPreview(scheduleId: string): Promise<string> {
    try {
      const response = await api.get(`/scheduling/schedules/${scheduleId}/email-preview`);

      if (response.data.status === 'error') {
        throw new Error(response.data.message || 'Erreur lors de la récupération de l\'aperçu');
      }

      const result: EmailPreviewResponse = response.data;
      return result.data.html_content;
    } catch (error: any) {
      console.error('Erreur getEmailPreview:', error);
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw error;
    }
  }

  /**
   * Récupère un entretien avec informations de réponse candidat enrichies (NÉCESSITE AUTHENTIFICATION)
   */
  static async getScheduleWithCandidateInfo(scheduleId: string): Promise<InterviewSchedule> {
    try {
      // Récupérer les données de base et le statut candidat en parallèle
      const [schedule, candidateStatus] = await Promise.all([
        this.getSchedule(scheduleId),
        this.getCandidateResponseStatus(scheduleId)
      ]);

      return {
        ...schedule,
        ...candidateStatus
      };
    } catch (error) {
      console.error('Erreur getScheduleWithCandidateInfo:', error);
      throw error;
    }
  }

  /**
   * Récupère la liste des entretiens avec filtres de réponse candidat (NÉCESSITE AUTHENTIFICATION)
   */
  static async getSchedulesWithFilters(filter: InterviewScheduleFilter = {}): Promise<InterviewSchedule[]> {
    try {
      const params: any = {};
      
      // Filtres existants
      if (filter.status && filter.status.length > 0) {
        params.status = filter.status.join(',');
      }
      
      if (filter.search) {
        params.search = filter.search;
      }

      if (filter.recruiter_id) {
        params.recruiter_id = filter.recruiter_id;
      }

      if (filter.mode && filter.mode.length > 0) {
        params.mode = filter.mode.join(',');
      }

      // Nouveaux filtres pour réponse candidat
      if (filter.candidate_response && filter.candidate_response !== 'any') {
        params.candidate_response = filter.candidate_response;
      }

      if (filter.date_range) {
        params.date_start = filter.date_range.start;
        params.date_end = filter.date_range.end;
      }

      const response = await api.get('/scheduling/schedules', { params });

      if (response.data.status === 'error') {
        throw new Error(response.data.message || 'Erreur lors de la récupération des entretiens');
      }

      return response.data.data || response.data;
    } catch (error: any) {
      console.error('Erreur getSchedulesWithFilters:', error);
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw error;
    }
  }

  /**
   * Analyse les statistiques de réponse candidat (NÉCESSITE AUTHENTIFICATION)
   */
  static async getCandidateResponseStats(dateRange?: { start: string; end: string }): Promise<{
    total_interviews: number;
    confirmed_count: number;
    canceled_count: number;
    pending_count: number;
    expired_count: number;
    confirmation_rate: number;
    avg_response_time_hours: number;
    top_cancellation_reasons: Array<{ reason: string; count: number }>;
  }> {
    try {
      const params: any = {};
      
      if (dateRange) {
        params.start_date = dateRange.start;
        params.end_date = dateRange.end;
      }

      const response = await api.get('/scheduling/candidate-response-stats', { params });

      if (response.data.status === 'error') {
        throw new Error(response.data.message || 'Erreur lors de la récupération des statistiques');
      }

      return response.data.data;
    } catch (error: any) {
      console.error('Erreur getCandidateResponseStats:', error);
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw error;
    }
  }

  /**
   * Marque une notification de réponse candidat comme lue (NÉCESSITE AUTHENTIFICATION)
   */
  static async markCandidateNotificationAsRead(notificationId: string): Promise<boolean> {
    try {
      const response = await api.post(`/notifications/${notificationId}/read`, {});

      return response.status === 200;
    } catch (error) {
      console.error('Erreur markCandidateNotificationAsRead:', error);
      return false;
    }
  }

  /**
   * Génère un rapport de réponses candidat (NÉCESSITE AUTHENTIFICATION)
   */
  static async exportCandidateResponseReport(
    format: 'csv' | 'pdf' = 'csv',
    filter: InterviewScheduleFilter = {}
  ): Promise<Blob> {
    try {
      const params: any = { format };
      
      Object.entries(filter).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            params[key] = value.join(',');
          } else if (typeof value === 'object') {
            Object.entries(value).forEach(([subKey, subValue]) => {
              params[`${key}_${subKey}`] = String(subValue);
            });
          } else {
            params[key] = String(value);
          }
        }
      });

      const response = await api.get('/scheduling/candidate-response-report', {
        params,
        responseType: 'blob'
      });

      return response.data;
    } catch (error: any) {
      console.error('Erreur exportCandidateResponseReport:', error);
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw error;
    }
  }

  // ====================================================================
  // MÉTHODES UTILITAIRES (SANS APPELS API)
  // ====================================================================

  /**
   * Vérifie si un champ peut être modifié
   */
  static canFieldBeUpdated(fieldName: string): boolean {
    return UPDATABLE_FIELDS.includes(fieldName as UpdatableField);
  }

  /**
   * Obtient la liste des champs modifiables
   */
  static getUpdatableFields(): readonly string[] {
    return UPDATABLE_FIELDS;
  }

  /**
   * Traduit les statuts d'entretien en français
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
   */
  static canBeModified(schedule: InterviewSchedule): boolean {
    const nonModifiableStatuses = ['in_progress', 'completed', 'canceled', 'no_show'];
    return !nonModifiableStatuses.includes(schedule.status);
  }

  /**
   * Vérifie si un entretien peut être démarré
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

  /**
   * Calcule les informations de réponse candidat à partir d'un objet InterviewSchedule
   */
  static calculateCandidateResponseInfo(schedule: InterviewSchedule): CandidateResponseInfo {
    const now = new Date();
    const scheduledDate = new Date(schedule.scheduled_at);
    const responseDate = schedule.candidate_response_date ? new Date(schedule.candidate_response_date) : undefined;
    
    let status: 'confirmed' | 'canceled' | 'pending' | 'expired';
    
    if (schedule.was_confirmed_by_candidate) {
      status = 'confirmed';
    } else if (schedule.was_canceled_by_candidate) {
      status = 'canceled';
    } else if (schedule.can_candidate_respond?.can_respond) {
      status = 'pending';
    } else {
      status = 'expired';
    }

    // Calculer le temps jusqu'à expiration
    let timeUntilExpiry: string | undefined;
    if (status === 'pending') {
      const timeUntilInterview = scheduledDate.getTime() - now.getTime();
      const hoursLeft = Math.floor(timeUntilInterview / (1000 * 60 * 60));
      
      if (hoursLeft > 48) {
        const daysLeft = Math.floor(hoursLeft / 24);
        timeUntilExpiry = `${daysLeft} jour${daysLeft > 1 ? 's' : ''} restant${daysLeft > 1 ? 's' : ''}`;
      } else if (hoursLeft > 0) {
        timeUntilExpiry = `${hoursLeft} heure${hoursLeft > 1 ? 's' : ''} restante${hoursLeft > 1 ? 's' : ''}`;
      } else {
        timeUntilExpiry = 'Expiré';
      }
    }

    return {
      status,
      has_responded: schedule.was_confirmed_by_candidate || schedule.was_canceled_by_candidate,
      response_date: responseDate,
      cancellation_reason: schedule.cancellation_reason,
      can_still_respond: schedule.can_candidate_respond?.can_respond || false,
      time_until_expiry: timeUntilExpiry,
      action_urls: schedule.candidate_response_urls
    };
  }
}