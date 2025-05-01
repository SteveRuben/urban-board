
// Types
export interface AIAssistant {
    id: string;
    name: string;
    assistant_type?: string;
    model_version?: string;
    capabilities?: {
        analysis_types: string[];
    };
    avatar?: string;
    description?: string;
    interviewMode: InterviewMode|undefined;
    industry?: Industry;
    jobRole?: JobRole;
    seniority?: Seniority;
    model?: AIModel;
    createdAt?: string;
    lastUsed?: string;
    usageCount?: number;
    persona?: string;
    instructions?: string;
  }
  

export interface AIDocument {
    id: string;
    assistantId: string;
    name: string;
    type: string;
    size: number;
    created_at: string;
}

export interface AnalysisResult {
    id: string;
    content: any;
    timestamp: string;
}

export interface TestAssistantParams {
    question: string;
    context?: string;
}

export interface CloneOptions {
    name?: string;
    description?: string;
}

export interface HistoryFilters {
    start_date?: string;
    end_date?: string;
    status?: string;
}

export interface Filter {
    id: string;
    name: string;
}

export interface AssistantTemplate {
    id: string;
    name: string;
    description: string;
    industry: string;
    jobRole: string;
    seniority: string;
    interviewMode: 'autonomous' | 'collaborative' | 'hybrid';
    highlights?: string[];
    [key: string]: any; // Pour toute propriété supplémentaire
}

export interface AssistantTemplateCardProps {
    template: AssistantTemplate;
    onSelect: (template: AssistantTemplate) => void;
}

export type InterviewMode = 'autonomous' | 'collaborative' | 'hybrid';
export type Industry = 'technology' | 'finance' | 'healthcare' | 'education' | 'retail' | 'manufacturing' | string;
export type JobRole = 'software-engineer' | 'data-scientist' | 'product-manager' | 'designer' | 'marketing' | 'sales' | 'customer-support' | string;
export type Seniority = 'entry-level' | 'mid-level' | 'senior' | 'management' | 'executive' | string;
export type AIModel = 'claude-3-7-sonnet' | 'claude-3-opus' | 'gpt-4o' | string;

export interface InterviewModeBadgeProps {
  mode: InterviewMode;
}

export interface AIAssistantCardProps {
  assistant: AIAssistant;
  onDelete: (assistant: AIAssistant) => void;
  onClone: (assistant: AIAssistant) => void;
}


export interface TooltipProps {
  text: string;
}