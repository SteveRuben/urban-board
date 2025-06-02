// frontend/types/interview-scheduling.ts

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
  cancellation_reason?: string;
  created_at: string;
  updated_at: string;
  organization_id: string;
  recruiter_id: string;
  // Relations optionnelles
  recruiter?: {
    id: string;
    name: string;
    email: string;
  };
  organization?: {
    id: string;
    name: string;
  };
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