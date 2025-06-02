// @/types/assistant.ts

// Interface pour les capabilities spécifiques
export interface AIAssistantCapabilities {
    generateQuestions?: boolean;
    evaluateResponses?: boolean;
    provideFeedback?: boolean;
    suggestFollowUps?: boolean;
    realTimeCoaching?: boolean;
    biometricIntegration?: boolean;
  }
  
  // Interface pour la personnalité
  export interface AIAssistantPersonality {
    friendliness?: number;
    formality?: number;
    technicalDepth?: number;
    followUpIntensity?: number;
  }
  
  // Interface pour les connaissances de base
  export interface AIAssistantBaseKnowledge {
    technicalSkills?: boolean;
    softSkills?: boolean;
    companyValues?: boolean;
    industryTrends?: boolean;
  }
  
  // Types pour les énumérations
  export type AssistantType = 'general' | 'recruiter' | 'evaluator' | 'analyzer' | 'interviewer';
  export type InterviewMode = 'autonomous' | 'collaborative' | 'hybrid';
  export type AIModel = 'claude-3-7-sonnet' | 'claude-3-opus' | 'gpt-4o';
  export type IndustryType = 'technology' | 'finance' | 'healthcare' | 'education' | 'retail' | 'manufacturing';
  export type JobRoleType = 'software-engineer' | 'data-scientist' | 'product-manager' | 'designer' | 'marketing' | 'sales' | 'customer-support';
  export type SeniorityLevel = 'entry-level' | 'mid-level' | 'senior' | 'management' | 'executive';
  
  // Interface principale pour l'AI Assistant
  export interface AIAssistant {
    id: string;
    name: string;
    description?: string;
    avatar?: string;
    model: AIModel;
    assistantType?: AssistantType;
    assistant_type?: AssistantType;  // Support pour les deux formats (snake_case du backend)
    industry?: IndustryType;
    jobRole?: JobRoleType;
    job_role?: JobRoleType;  // Support pour les deux formats
    seniority?: SeniorityLevel;
    interviewMode?: InterviewMode;
    interview_mode?: InterviewMode;  // Support pour les deux formats
    personality?: AIAssistantPersonality;
    baseKnowledge?: AIAssistantBaseKnowledge;
    base_knowledge?: AIAssistantBaseKnowledge;  // Support pour snake_case
    capabilities?: AIAssistantCapabilities;
    customPrompt?: string;
    custom_prompt?: string;  // Support pour snake_case
    questionBank?: string[];
    question_bank?: string[];  // Support pour snake_case
    isTemplate?: boolean;
    is_template?: boolean;  // Support pour snake_case
    templateId?: string;
    template_id?: string;  // Support pour snake_case
    usageCount?: number;
    usage_count?: number;  // Support pour snake_case
    lastUsed?: string;
    last_used?: string;  // Support pour snake_case
    createdAt?: string;
    created_at?: string;  // Support pour snake_case
    updatedAt?: string;
    updated_at?: string;  // Support pour snake_case
    organizationId?: string;
    organization_id?: string;  // Support pour snake_case
    userId?: string;
    user_id?: string;  // Support pour snake_case
  }
  
  // Interface pour les documents d'assistant
  export interface AIDocument {
    id: string;
    assistantId: string;
    filename: string;
    originalFilename: string;
    fileSize: number;
    fileType: string;
    documentType: string;
    description?: string;
    vectorIndexStatus: 'pending' | 'processing' | 'completed' | 'failed';
    createdAt: string;
    updatedAt: string;
  }
  
  // Interface pour les options de clonage
  export interface CloneOptions {
    name?: string;
    description?: string;
  }
  
  // Interface pour les paramètres de test
  export interface TestAssistantParams {
    question: string;
    assistant?: Partial<AIAssistant>;
    context?: any;
  }
  
  // Interface pour les filtres d'historique
  export interface HistoryFilters {
    start_date?: string;
    end_date?: string;
    content_type?: string;
  }
  
  // Interface pour les templates d'assistants
  export interface AssistantTemplate extends AIAssistant {
    highlights?: string[];
    category?: string;
    popularity?: number;
  }
  
  // Interface pour les props de tooltip
  export interface TooltipProps {
    text: string;
    children?: React.ReactNode;
  }
  
  // Type guards pour vérifier les types
  export const isAIAssistant = (obj: any): obj is AIAssistant => {
    return obj && typeof obj.id === 'string' && typeof obj.name === 'string';
  };
  
  export const hasCapabilities = (assistant: AIAssistant): assistant is AIAssistant & { capabilities: AIAssistantCapabilities } => {
    return assistant.capabilities !== undefined;
  };
  
  // Fonctions utilitaires pour les capabilities
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
  
  // Fonctions pour normaliser les propriétés (camelCase vs snake_case)
  export const normalizeAssistant = (assistant: any): AIAssistant => {
    return {
      ...assistant,
      assistantType: assistant.assistantType || assistant.assistant_type,
      jobRole: assistant.jobRole || assistant.job_role,
      interviewMode: assistant.interviewMode || assistant.interview_mode,
      baseKnowledge: assistant.baseKnowledge || assistant.base_knowledge,
      customPrompt: assistant.customPrompt || assistant.custom_prompt,
      questionBank: assistant.questionBank || assistant.question_bank,
      isTemplate: assistant.isTemplate || assistant.is_template,
      templateId: assistant.templateId || assistant.template_id,
      usageCount: assistant.usageCount || assistant.usage_count,
      lastUsed: assistant.lastUsed || assistant.last_used,
      createdAt: assistant.createdAt || assistant.created_at,
      updatedAt: assistant.updatedAt || assistant.updated_at,
      organizationId: assistant.organizationId || assistant.organization_id,
      userId: assistant.userId || assistant.user_id,
    };
  };