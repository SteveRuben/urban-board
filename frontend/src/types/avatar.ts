
export interface AvatarStatus {
    available: boolean;
    status: 'not_scheduled' | 'scheduled' | 'launching' | 'active' | 'stopping' | 'stopped' | 'error';
    mode: 'autonomous' | 'collaborative' | 'unknown';
    browser_running: boolean;
    meeting_active: boolean;
    scheduled_launch?: string; // ISO date
    launch_time?: string; // ISO date
    error?: string;
    
    // Infos des questions (si actif)
    questions?: {
      total: number;
      asked: number;
      current_question?: string;
      next_in_seconds?: number;
    };
  }
  
  export interface AvatarQuestionsStatus {
    total_questions: number;
    asked_questions: number;
    current_question?: string;
    next_question_in?: number; // secondes
    questions_list: AvatarQuestion[];
    is_asking: boolean;
    time_remaining?: number; // secondes pour cette question
  }
  
  export interface AvatarQuestion {
    question: string;
    timing: number; // secondes
    asked: boolean;
    asked_at?: string; // ISO date
  }
  
  export interface AvatarQuestionsPreview {
    position: string;
    mode: 'simulation' | 'ai';
    introduction: string;
    questions: Array<{
      question: string;
      timing_minutes: number;
      timing_seconds: number;
    }>;
  }
  
  // Actions possibles sur l'avatar
  export interface AvatarActions {
    canForceQuestion: boolean;
    canStop: boolean;
    canLaunch: boolean;
    canViewStatus: boolean;
  }
  
  // Réponses API pour l'avatar
  export interface AvatarStatusResponse {
    success: boolean;
    schedule_id: string;
    avatar_status: AvatarStatus;
    questions_status?: AvatarQuestionsStatus;
    error?: string;
  }
  
  export interface AvatarActionResponse {
    success: boolean;
    message?: string;
    error?: string;
    data?: any;
  }
  
  // États de l'avatar pour l'UI
  export const AVATAR_STATUS_LABELS = {
    'not_scheduled': 'Non programmé',
    'scheduled': 'Programmé',
    'launching': 'Démarrage...',
    'active': 'Actif',
    'stopping': 'Arrêt...',
    'stopped': 'Arrêté',
    'error': 'Erreur'
  } as const;
  
  export const AVATAR_STATUS_COLORS = {
    'not_scheduled': 'text-gray-500',
    'scheduled': 'text-blue-600',
    'launching': 'text-orange-500',
    'active': 'text-green-600',
    'stopping': 'text-orange-600',
    'stopped': 'text-gray-600',
    'error': 'text-red-600'
  } as const;
  
  export const AVATAR_STATUS_BACKGROUNDS = {
    'not_scheduled': 'bg-gray-100',
    'scheduled': 'bg-blue-100',
    'launching': 'bg-orange-100',
    'active': 'bg-green-100',
    'stopping': 'bg-orange-100',
    'stopped': 'bg-gray-100',
    'error': 'bg-red-100'
  } as const;