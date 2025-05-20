import axios from 'axios';
import { JobPosting, JobPostingFormData, JobPostingsResponse } from '@/types/job-posting';

class JobPostingService {
  // Récupérer toutes les offres avec pagination et filtres
  async getJobPostings(params: {
    limit?: number;
    offset?: number;
    status?: string;
    search?: string;
  }): Promise<JobPostingsResponse> {
    const { limit = 20, offset = 0, status, search } = params;
    
    let url = `http://localhost:5000/api/job-postings?limit=${limit}&offset=${offset}`;
    
    if (status && status !== 'all') {
      url += `&status=${status}`;
    }
    
    if (search) {
      url += `&search=${encodeURIComponent(search)}`;
    }
    
    const response = await axios.get<JobPostingsResponse>(url);
    return response.data;
  }

  // Récupérer une offre spécifique
  async getJobPosting(id: string): Promise<JobPosting> {
    const response = await axios.get<JobPosting>(`/api/job-postings/${id}`);
    return response.data;
  }

  // Créer une nouvelle offre
  async createJobPosting(data: JobPostingFormData): Promise<JobPosting> {
    const response = await axios.post<JobPosting>('/api/job-postings', data);
    return response.data;
  }

  // Mettre à jour une offre existante
  async updateJobPosting(id: string, data: JobPostingFormData): Promise<JobPosting> {
    const response = await axios.put<JobPosting>(`/api/job-postings/${id}`, data);
    return response.data;
  }

  // Supprimer une offre
  async deleteJobPosting(id: string): Promise<void> {
    await axios.delete(`/api/job-postings/${id}`);
  }

  // Publier une offre
  async publishJobPosting(id: string): Promise<JobPosting> {
    const response = await axios.put<JobPosting>(`/api/job-postings/${id}/publish`, {});
    return response.data;
  }

  // Fermer une offre
  async closeJobPosting(id: string): Promise<JobPosting> {
    const response = await axios.put<JobPosting>(`/api/job-postings/${id}/close`, {});
    return response.data;
  }
}

// Exporter une instance unique du service
export const jobPostingService = new JobPostingService();