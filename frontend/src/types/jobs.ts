export type JobPostingStatus = 'draft' | 'published' | 'closed';
export type ApplicationStatus = 'new' | 'reviewed' | 'interview_scheduled' | 'rejected' | 'hired';

export interface JobPosting {
  id: string;
  title: string;
  description: string;
  requirements: string | null;
  responsibilities: string | null;
  location: string | null;
  employment_type: string | null;
  remote_policy: string | null;
  salary_range_min: number | null;
  salary_range_max: number | null;
  salary_currency: string;
  status: JobPostingStatus;
  published_at: string | null;
  closes_at: string | null;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
  organization_name: string;
  creator_name: string;
  application_count: number;
  source_url? : string,
  source? : string
}

export interface JobPostingFormData {
  title: string;
  description: string;
  requirements?: string;
  responsibilities?: string;
  location?: string;
  employment_type?: string;
  remote_policy?: string;
  salary_range_min?: number | null;
  salary_range_max?: number | null;
  salary_currency?: string;
  status?: JobPostingStatus;
  closes_at?: string;
}

export interface JobApplication {
  id: string;
  candidate_name: string;
  candidate_email: string;
  candidate_phone: string | null;
  resume_url: string | null;
  cover_letter: string | null;
  status: ApplicationStatus;
  notes: string | null;
  source: string | null;
  created_at: string;
  updated_at: string;
}

export interface JobApplicationFormData {
  candidate_name: string;
  candidate_email: string;
  candidate_phone?: string;
  resume_url?: string;
  cover_letter?: string;
  source?: string;
}

export interface JobApplicationDetails extends JobApplication {
  job_posting: JobPosting;
}

export interface Pagination {
  total: number;
  limit: number;
  offset: number;
}

export interface JobPostingsResponse {
  data: JobPosting[];
  pagination: Pagination;
}

export interface PublicJobPostingsResponse {
  data: JobPosting[];
  pagination: Pagination & {
    page: number;
    pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

export interface JobApplicationsResponse {
  data: JobApplication[];
  job_posting: JobPosting | null;
  pagination: Pagination;
}

export interface UploadResponse {
  success: boolean;
  message: string;
  file_url: string;
}

export interface ApplicationResponse {
  success: boolean;
  message: string;
  application_id: string;
}

export interface PublicJobFilters {
  location?: string;
  employment_type?: string;
  remote_policy?: string;
  salary_min?: number;
  salary_max?: number;
  keywords?: string;
}