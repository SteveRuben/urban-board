// Types
export interface ResumeUploadProps {
  onAnalysisComplete?: (analysis: ResumeAnalysis) => void;
  jobRole?: string;
}

export interface Contact {
  email: string;
  phone: string;
  linkedin: string;
}

export interface Experience {
  position: string;
  company: string;
  duration: string;
  highlights: string[];
}

export interface Education {
  degree: string;
  institution: string;
  year: string;
  relevance: string;
}

export interface Question {
  question: string;
  rationale: string;
}

export interface ResumeAnalysis {
  resume_summary: string;
  technical_skills: string[];
  soft_skills: string[];
  relevant_experience: Experience[];
  education: Education[];
  fit_score: number;
  fit_justification: string;
  strengths: string[];
  gaps: string[];
  recommended_questions: Question[];
  contact_info: Contact;
  metadata: {
    filename: string;
    analysis_timestamp: string;
    job_role: string;
  };
  error?: string;
}


export interface ResumeAnalysisResultProps {
    analysis: ResumeAnalysis | null;
    jobRole: string;
  }
  