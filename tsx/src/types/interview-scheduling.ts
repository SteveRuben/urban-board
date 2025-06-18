// frontend/types/interview-scheduling.ts

import { AvatarStatus } from "./avatar";

// Types pour les statuts d'entretien
export type ScheduleStatus = 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'canceled' | 'no_show';

// Types pour les modes d'entretien - CORRIGÉ
export type InterviewMode = 'collaborative' | 'autonomous';

// Interface principale pour une planification d'entretien
export interface InterviewSchedule {
  id: string;
  candidate_name: string;
  candidate_email: string;
  candidate_phone?: string;
  title: string;
  description?: string;
  position: string;
  scheduled_at: string;
  duration_minutes: number;
  timezone: string;
  mode: InterviewMode; // collaborative ou autonomous
  ai_assistant_id?: string;
  predefined_questions?: string[];
  access_token: string;
  status: ScheduleStatus;
  interview_id?: string;
  reminder_sent?: boolean;
  organization_id: string;
  recruiter_id: string;
  
  was_confirmed_by_candidate: boolean;
  was_canceled_by_candidate: boolean;
  candidate_response_date?: string; // ISO date string
  cancellation_reason?: string;
  
  // Capacité de réponse candidat
  can_candidate_respond?: CandidateResponseCapability;
  
  // URLs de réponse (générées côté backend)
  candidate_response_urls?: CandidateResponseUrls;
  
  // Métadonnées audit
  created_at: string;
  updated_at: string;

  recruiter?: {
    id: string;
    name: string;
    email: string;
  };
  organization?: {
    id: string;
    name: string;
  };

  avatar?: AvatarStatus;

}

export interface CandidateResponseCapability {
  can_respond: boolean;
  reason: string; // Raison si le candidat ne peut pas répondre
  expires_at?: string; // Quand la capacité de réponse expire
}

// URLs de réponse candidat (générées par le backend)
export interface CandidateResponseUrls {
  confirm_url: string;
  cancel_url: string;
}

// Statut enrichi de réponse candidat
export interface CandidateResponseInfo {
  status: 'confirmed' | 'canceled' | 'pending' | 'expired';
  has_responded: boolean;
  response_date?: Date;
  cancellation_reason?: string;
  can_still_respond: boolean;
  time_until_expiry?: string;
  action_urls?: CandidateResponseUrls;
}

// Interface pour les données publiques (candidat)
export interface PublicScheduleData {
  id: string;
  title: string;
  description?: string;
  position: string;
  candidate_name: string;
  scheduled_at: string;
  duration_minutes: number;
  timezone: string;
  recruiter_name?: string;
  organization_name?: string;
  access_token: string;
  mode: InterviewMode;
  was_confirmed_by_candidate: boolean;
  was_canceled_by_candidate:boolean;
}

// Interface pour les filtres de recherche
export interface ScheduleFilters {
  status?: string;
  from_date?: string;
  to_date?: string;
  limit?: number;
  offset?: number;
}

// Interface pour la création/modification d'un entretien
export interface InterviewScheduleFormData {
  candidate_name: string;
  candidate_email: string;
  candidate_phone?: string;
  title: string;
  description?: string;
  position: string;
  scheduled_at: string;
  duration_minutes: number;
  timezone: string;
  mode: InterviewMode; // collaborative ou autonomous
  ai_assistant_id?: string;
  predefined_questions?: string[];
  job_id?: string
}

export interface InterviewScheduleUpdateData {
  scheduled_at?: string;
  duration_minutes?: number;
  timezone?: string;
  mode?: "autonomous" | "collaborative";
  ai_assistant_id?: string;
  predefined_questions?: string[];
}

// Interface pour les erreurs de validation
export interface ScheduleValidationErrors {
  [key: string]: string;
}

// Interface pour les options de mode d'entretien
export interface InterviewModeOption {
  value: InterviewMode;
  label: string;
  description: string;
  icon: string;
}

// Constantes pour les modes d'entretien
export const INTERVIEW_MODES: InterviewModeOption[] = [
  {
    value: 'collaborative',
    label: 'Collaboratif',
    description: 'Entretien avec assistant IA et interaction directe avec le recruteur',
    icon: 'users'
  },
  {
    value: 'autonomous',
    label: 'Autonome',
    description: 'Entretien autonome géré entièrement par l\'assistant IA',
    icon: 'bot'
  }
];

// Constantes pour les statuts
export const SCHEDULE_STATUSES: { value: ScheduleStatus; label: string; color: string }[] = [
  { value: 'scheduled', label: 'Planifié', color: '#3498db' },
  { value: 'confirmed', label: 'Confirmé', color: '#27ae60' },
  { value: 'in_progress', label: 'En cours', color: '#f39c12' },
  { value: 'completed', label: 'Terminé', color: '#2ecc71' },
  { value: 'canceled', label: 'Annulé', color: '#e74c3c' },
  { value: 'no_show', label: 'Absence candidat', color: '#95a5a6' }
];

// Types pour les anciennes interfaces (compatibilité)
export type InterviewStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

export interface Interview {
  id: string;
  candidate_name: string;
  job_role: string;
  status: InterviewStatus;
  scheduled_time?: string;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  score?: number;
}

export interface GetInterviewsFilters {
  status?: string;
  from_date?: string;
  to_date?: string;
}

export interface CreateInterviewScheduleRequest {
  candidate_name: string;
  candidate_email: string;
  candidate_phone?: string;
  title: string;
  description?: string;
  position: string;
  scheduled_at: string; // ISO date string
  duration_minutes?: number;
  timezone?: string;
  mode: 'autonomous' | 'collaborative';
  ai_assistant_id?: string;
  predefined_questions?: string[];
}

// Requête de mise à jour d'entretien
export interface UpdateInterviewScheduleRequest {
  candidate_name?: string;
  candidate_email?: string;
  candidate_phone?: string;
  title?: string;
  description?: string;
  position?: string;
  scheduled_at?: string;
  duration_minutes?: number;
  timezone?: string;
  mode?: 'autonomous' | 'collaborative';
  ai_assistant_id?: string;
  predefined_questions?: string[];
}

// Réponse API pour le statut candidat
export interface CandidateResponseStatusResponse {
  status: string;
  data: {
    current_status: string;
    can_respond: boolean;
    response_reason: string;
    confirmed_by_candidate: boolean;
    canceled_by_candidate: boolean;
    cancellation_reason?: string;
    response_date?: string;
    time_until_interview?: number; // en secondes
  };
}

// Réponse API pour l'aperçu email
export interface EmailPreviewResponse {
  status: string;
  data: {
    html_content: string;
    text_content: string;
    subject: string;
    recipient: string;
    contains_response_buttons: boolean;
  };
}

// Réponse API pour le renvoi d'invitation
export interface ResendInvitationResponse {
  status: string;
  message: string;
  data: {
    email_sent: boolean;
    sent_at: string;
    recipient: string;
  };
}

export interface CandidateResponseStatusProps {
  schedule: InterviewSchedule;
  onStatusUpdate?: (schedule: InterviewSchedule) => void;
  showActions?: boolean;
  compact?: boolean;
  autoRefresh?: boolean;
}

// Props pour le modal d'aperçu email
export interface EmailPreviewModalProps {
  visible: boolean;
  htmlContent: string;
  textContent?: string;
  onClose: () => void;
  candidateName: string;
  interviewTitle: string;
  loading?: boolean;
}

// État pour le hook de réponse candidat
export interface CandidateResponseHookState {
  loading: boolean;
  schedule: InterviewSchedule | null;
  error: string | null;
  lastUpdated: Date | null;
}

// Actions pour le hook de réponse candidat
export interface CandidateResponseHookActions {
  refreshStatus: () => Promise<void>;
  resendInvitation: () => Promise<boolean>;
  getEmailPreview: () => Promise<string>;
  canCandidateRespond: boolean;
  responseStatus: 'confirmed' | 'canceled' | 'pending' | 'expired';
  responseMetadata: CandidateResponseMetadata;
}

// Métadonnées de réponse candidat
export interface CandidateResponseMetadata {
  hasResponded: boolean;
  responseDate?: Date;
  cancellationReason?: string;
  canStillRespond: boolean;
  responseTimeLeft?: string;
  interviewInHours?: number;
}

// ====================================================================
// TYPES POUR LA LISTE ET FILTRES
// ====================================================================

// Filtre pour la liste des entretiens
export interface InterviewScheduleFilter {
  status?: string[];
  candidate_response?: 'confirmed' | 'canceled' | 'pending' | 'any';
  date_range?: {
    start: string;
    end: string;
  };
  search?: string;
  recruiter_id?: string;
  mode?: ('autonomous' | 'collaborative')[];
}

// Item de liste avec statut enrichi
export interface InterviewScheduleListItem extends InterviewSchedule {
  candidate_response_summary: {
    status_badge: string;
    status_color: 'success' | 'error' | 'processing' | 'default';
    quick_info: string;
    needs_attention: boolean;
  };
}

// ====================================================================
// TYPES POUR LES NOTIFICATIONS
// ====================================================================

// Notification de réponse candidat
export interface CandidateResponseNotification {
  id: string;
  type: 'candidate_confirmed' | 'candidate_canceled' | 'candidate_reminder';
  schedule_id: string;
  candidate_name: string;
  message: string;
  created_at: string;
  read: boolean;
  action_url?: string;
}

export enum Interview_Status {
  SCHEDULED = 'scheduled',
  CONFIRMED = 'confirmed',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELED = 'canceled',
  MISSED = 'missed'
}

export enum CandidateResponseStatus {
  CONFIRMED = 'confirmed',
  CANCELED = 'canceled', 
  PENDING = 'pending',
  EXPIRED = 'expired'
}

export enum Interview_Mode {
  AUTONOMOUS = 'autonomous',
  COLLABORATIVE = 'collaborative'
}

//
export interface ErrorDetails {
  type: 'validation' | 'duplicate' | 'network' | 'server' | 'unknown';
  message: string;
  details?: any;
  actionable?: boolean;
  suggestions?: string[];
}