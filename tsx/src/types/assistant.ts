// types/assistant.ts

// ====== INTERFACES DE BASE ======

export interface AIAssistantCapabilities {
  generateQuestions?: boolean;
  evaluateResponses?: boolean;
  provideFeedback?: boolean;
  suggestFollowUps?: boolean;
  realTimeCoaching?: boolean;
  biometricIntegration?: boolean;
}

export interface AIAssistantPersonality {
  friendliness?: number;
  formality?: number;
  technicalDepth?: number;
  followUpIntensity?: number;
}

export interface AIAssistantBaseKnowledge {
  technicalSkills?: boolean;
  softSkills?: boolean;
  companyValues?: boolean;
  industryTrends?: boolean;
}

// ====== TYPES ÉNUMÉRÉS ======

export type AssistantType = 
  | 'general' 
  | 'recruiter' 
  | 'evaluator' 
  | 'technical_interviewer'
  | 'soft_skills_coach'
  | 'behavioral_analyst'
  | 'performance_reviewer';

export type InterviewMode = 'autonomous' | 'collaborative' | 'hybrid';

export type AIModel = 
  | 'claude-3-7-sonnet' 
  | 'claude-3-opus' 
  | 'claude-3-haiku'
  | 'claude-3-5-sonnet'
  | 'gpt-4o'
  | 'gpt-4o-mini'
  | 'gpt-4-turbo'
  | 'gpt-3.5-turbo'
  | 'gemini-pro'
  | 'gemini-ultra';

export type APIProvider = 
  | 'openai'
  | 'anthropic'
  | 'google'
  | 'azure_openai'
  | 'huggingface'
  | 'cohere';

export type IndustryType = 
  | 'technology' 
  | 'finance' 
  | 'healthcare' 
  | 'education' 
  | 'retail' 
  | 'manufacturing';

export type JobRoleType = 
  | 'software-engineer' 
  | 'data-scientist' 
  | 'product-manager' 
  | 'designer' 
  | 'marketing' 
  | 'sales' 
  | 'customer-support';

export type SeniorityLevel = 
  | 'entry-level' 
  | 'mid-level' 
  | 'senior' 
  | 'management' 
  | 'executive';

export type DocumentType = 
  | 'company_values'
  | 'job_description'
  | 'interview_guide'
  | 'knowledge_base'
  | 'training_material'
  | 'policy_document'
  | 'general';

export type VectorIndexStatus = 'pending' | 'processing' | 'completed' | 'failed';

// ====== INTERFACE PRINCIPALE AI ASSISTANT ======

export interface AIAssistant {
  id: string;
  name: string;
  description?: string;
  avatar?: string;
  model: AIModel;
  assistantType: AssistantType;
  industry?: IndustryType;
  jobRole?: JobRoleType;
  seniority?: SeniorityLevel;
  interviewMode: InterviewMode;
  personality?: AIAssistantPersonality;
  baseKnowledge?: AIAssistantBaseKnowledge;
  capabilities?: AIAssistantCapabilities;
  customPrompt?: string;
  questionBank?: string[];
  
  // Métadonnées
  isTemplate?: boolean;
  templateId?: string;
  usageCount?: number;
  lastUsed?: string;
  createdAt: string;
  updatedAt: string;
  organizationId: string;
  userId: string;
  
  // Informations sur les clés d'API
  hasApiKey?: boolean;
  apiProvider?: APIProvider;
  apiKeyMasked?: string;
  apiKeyLastUpdated?: string;
  
  // Informations supplémentaires
  teamsCount?: number;
  creatorName?: string;
}

// ====== INTERFACES POUR LES DONNÉES D'ENTRÉE ======

export interface CreateAssistantData {
  name: string;
  description?: string;
  model: AIModel;
  assistantType: AssistantType;
  industry?: IndustryType;
  jobRole?: JobRoleType;
  seniority?: SeniorityLevel;
  interviewMode: InterviewMode;
  personality?: AIAssistantPersonality;
  baseKnowledge?: AIAssistantBaseKnowledge;
  capabilities?: AIAssistantCapabilities;
  customPrompt?: string;
  questionBank?: string[];
  avatar?: string;
  apiKey?: string;
  apiProvider?: APIProvider;
}

export interface UpdateAssistantData extends Partial<CreateAssistantData> {
  // Tous les champs de CreateAssistantData sont optionnels pour la mise à jour
}

// ====== INTERFACES POUR LES CLÉS D'API ======

export interface APIKeyData {
  apiKey: string;
  apiProvider?: APIProvider;
}

// ====== INTERFACES POUR LES DOCUMENTS ======

export interface AIDocument {
  id: string;
  assistantId: string;
  filename: string;
  originalFilename: string;
  fileSize: number;
  fileType: string;
  documentType: DocumentType;
  description?: string;
  vectorIndexStatus: VectorIndexStatus;
  createdAt: string;
  updatedAt: string;
}

// ====== INTERFACES POUR LES TEMPLATES ======

export interface AssistantTemplate extends AIAssistant {
  highlights?: string[];
  category?: string;
  popularity?: number;
}

// ====== INTERFACES POUR LES STATISTIQUES ======

export interface AssistantStats {
  assistantId: string;
  assistantName: string;
  usageCount: number;
  lastUsed?: string;
  teamsCount: number;
  totalContentGenerated: number;
  contentByType: Record<string, number>;
  recentActivity: any[];
  hasApiKey: boolean;
  apiProvider?: APIProvider;
  createdAt: string;
  updatedAt: string;
}

// ====== INTERFACES POUR LES OPTIONS ======

export interface CloneOptions {
  name?: string;
  description?: string;
  copyApiKey?: boolean;
}

export interface DuplicateOptions {
  name?: string;
  copyApiKey?: boolean;
}

export interface TemplateOptions {
  templateName?: string;
  removeApiKey?: boolean;
}

export interface CreateFromTemplateData {
  name: string;
  apiKey?: string;
  apiProvider?: APIProvider;
  customizations?: Record<string, any>;
}

// ====== INTERFACES POUR LES TESTS ET HISTORIQUE ======

export interface TestAssistantParams {
  question: string;
  assistant?: Partial<AIAssistant>;
  context?: any;
}

export interface HistoryFilters {
  startDate?: string;
  endDate?: string;
  contentType?: string;
}

// ====== INTERFACES POUR LES COMPOSANTS UI ======

export interface TooltipProps {
  text: string;
  children?: React.ReactNode;
}

export interface InterviewModeBadgeProps {
  mode: InterviewMode;
}

export interface AIAssistantCardProps {
  assistant: AIAssistant;
  onDelete: (assistant: AIAssistant) => void;
  onClone: (assistant: AIAssistant) => void;
  onEdit?: (assistant: AIAssistant) => void;
  showActions?: boolean;
}

export interface AssistantFormProps {
  initialData?: Partial<AIAssistant>;
  onSubmit: (data: CreateAssistantData | UpdateAssistantData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  mode: 'create' | 'edit';
}

// ====== INTERFACES POUR LES VALIDATIONS ======

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  checks: {
    basicInfo: boolean;
    apiKey: boolean;
    capabilities: boolean;
    configuration: boolean;
  };
}

// ====== TYPE GUARDS ======

export const isAIAssistant = (obj: any): obj is AIAssistant => {
  return obj && 
    typeof obj.id === 'string' && 
    typeof obj.name === 'string' &&
    typeof obj.model === 'string' &&
    typeof obj.assistantType === 'string' &&
    typeof obj.interviewMode === 'string';
};

export const hasCapabilities = (assistant: AIAssistant): assistant is AIAssistant & { capabilities: AIAssistantCapabilities } => {
  return assistant.capabilities !== undefined;
};

export const hasPersonality = (assistant: AIAssistant): assistant is AIAssistant & { personality: AIAssistantPersonality } => {
  return assistant.personality !== undefined;
};

export const hasBaseKnowledge = (assistant: AIAssistant): assistant is AIAssistant & { baseKnowledge: AIAssistantBaseKnowledge } => {
  return assistant.baseKnowledge !== undefined;
};

// ====== FONCTIONS UTILITAIRES ======

export const getDefaultCapabilities = (): AIAssistantCapabilities => ({
  generateQuestions: true,
  evaluateResponses: true,
  provideFeedback: true,
  suggestFollowUps: true,
  realTimeCoaching: false,
  biometricIntegration: false,
});

export const getDefaultPersonality = (): AIAssistantPersonality => ({
  friendliness: 3,
  formality: 3,
  technicalDepth: 3,
  followUpIntensity: 3,
});

export const getDefaultBaseKnowledge = (): AIAssistantBaseKnowledge => ({
  technicalSkills: true,
  softSkills: true,
  companyValues: false,
  industryTrends: false,
});

// ====== FONCTIONS DE NORMALISATION ======

export const normalizeAssistant = (assistant: any): AIAssistant => {
  console.log(assistant.assistant_type)
  return {
    ...assistant,
    assistantType: assistant.assistant_type || assistant.assistantType,
    jobRole: assistant?.jobRole || assistant?.job_role,
    interviewMode: assistant.interviewMode || assistant.interview_mode,
    baseKnowledge: assistant.baseKnowledge || assistant.base_knowledge,
    customPrompt: assistant.customPrompt || assistant.custom_prompt,
    questionBank: assistant.questionBank || assistant.question_bank,
    isTemplate: assistant.isTemplate ?? assistant.is_template ?? false,
    templateId: assistant.templateId || assistant.template_id,
    usageCount: assistant.usageCount ?? assistant.usage_count ?? 0,
    lastUsed: assistant.lastUsed || assistant.last_used,
    createdAt: assistant.createdAt || assistant.created_at,
    updatedAt: assistant.updatedAt || assistant.updated_at,
    organizationId: assistant.organizationId || assistant.organization_id,
    userId: assistant.userId || assistant.user_id,
    hasApiKey: assistant.hasApiKey ?? assistant.has_api_key ?? false,
    apiProvider: assistant.apiProvider || assistant.api_provider,
    apiKeyMasked: assistant.apiKeyMasked || assistant.api_key_masked,
    apiKeyLastUpdated: assistant.apiKeyLastUpdated || assistant.api_key_last_updated,
    teamsCount: assistant.teamsCount ?? assistant.teams_count ?? 0,
    creatorName: assistant.creatorName || assistant.creator_name,
  };
};

// ====== CONSTANTES ======

export const ASSISTANT_TYPE_LABELS: Record<AssistantType, string> = {
  general: 'Général',
  recruiter: 'Recruteur',
  evaluator: 'Évaluateur',
  technical_interviewer: 'Interviewer technique',
  soft_skills_coach: 'Coach soft skills',
  behavioral_analyst: 'Analyste comportemental',
  performance_reviewer: 'Évaluateur de performance',
};

export const INTERVIEW_MODE_LABELS: Record<InterviewMode, string> = {
  autonomous: 'Autonome',
  collaborative: 'Collaboratif',
  hybrid: 'Hybride',
};

export const INDUSTRY_LABELS: Record<IndustryType, string> = {
  technology: 'Technologie',
  finance: 'Finance',
  healthcare: 'Santé',
  education: 'Éducation',
  retail: 'Commerce',
  manufacturing: 'Industrie',
};

export const JOB_ROLE_LABELS: Record<JobRoleType, string> = {
  'software-engineer': 'Ingénieur logiciel',
  'data-scientist': 'Data Scientist',
  'product-manager': 'Chef de produit',
  designer: 'Designer',
  marketing: 'Marketing',
  sales: 'Ventes',
  'customer-support': 'Support client',
};

export const SENIORITY_LABELS: Record<SeniorityLevel, string> = {
  'entry-level': 'Débutant',
  'mid-level': 'Intermédiaire',
  senior: 'Senior',
  management: 'Management',
  executive: 'Exécutif',
};

export const MODEL_LABELS: Record<AIModel, string> = {
  'claude-3-7-sonnet': 'Claude 3.7 Sonnet',
  'claude-3-opus': 'Claude 3 Opus',
  'claude-3-haiku': 'Claude 3 Haiku',
  'claude-3-5-sonnet': 'Claude 3.5 Sonnet',
  'gpt-4o': 'GPT-4o',
  'gpt-4o-mini': 'GPT-4o Mini',
  'gpt-4-turbo': 'GPT-4 Turbo',
  'gpt-3.5-turbo': 'GPT-3.5 Turbo',
  'gemini-pro': 'Gemini Pro',
  'gemini-ultra': 'Gemini Ultra',
};

export const PROVIDER_LABELS: Record<APIProvider, string> = {
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  google: 'Google AI',
  azure_openai: 'Azure OpenAI',
  huggingface: 'Hugging Face',
  cohere: 'Cohere',
};