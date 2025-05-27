// services/job-service.ts
import { ApplicationResponse, ApplicationStatus, JobApplicationDetails, JobApplicationFormData, JobApplicationsResponse, JobPosting, JobPostingFormData, JobPostingsResponse, PublicJobFilters, PublicJobPostingsResponse, UploadResponse } from '@/types/jobs';
import { api } from './user-service';
import axios from 'axios';

export class JobService {
  /**
   * Récupère toutes les offres d'emploi avec pagination et filtres
   * @param params Paramètres de filtrage et pagination
   * @returns Liste paginée des offres d'emploi
   */
  static async getJobPostings(params: {
    limit?: number;
    offset?: number;
    status?: string;
    search?: string;
  }): Promise<JobPostingsResponse> {
    try {
      const { limit = 20, offset = 0, status, search } = params;
      
      console.log("JobService: Préparation de la récupération des offres", {
        limit,
        offset,
        status,
        search
      });

      // Construire les paramètres de requête
      const queryParams = new URLSearchParams();
      queryParams.append('limit', limit.toString());
      queryParams.append('offset', offset.toString());
      
      if (status && status !== 'all') {
        queryParams.append('status', status);
      }
      
      if (search) {
        queryParams.append('search', search);
      }

      console.log("JobService: Paramètres de requête créés, envoi de la requête");

      // Envoyer la requête GET via le proxy API de Next.js
      const response = await api.get('/job-postings', {
        params: Object.fromEntries(queryParams),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log("JobService: Réponse reçue", response.status);

      return response.data;
    } catch (error) {
      console.error('Erreur détaillée lors de la récupération des offres:', error);
      
      throw new Error('Une erreur inattendue est survenue lors de la récupération des offres');
    }
  }

  /**
   * Récupère une offre d'emploi spécifique par son ID
   * @param id Identifiant unique de l'offre
   * @returns L'offre d'emploi correspondante
   */
  static async getJobPosting(id: string): Promise<JobPosting> {
    try {
      console.log("JobService: Préparation de la récupération de l'offre", { id });

      console.log("JobService: Envoi de la requête GET");

      // Envoyer la requête GET via le proxy API de Next.js
      const response = await api.get(`/job-postings/${id}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log("JobService: Réponse reçue", response.status);

      return response.data;
    } catch (error) {
      console.error('Erreur détaillée lors de la récupération de l\'offre:', error);
      throw new Error('Une erreur inattendue est survenue lors de la récupération de l\'offre');
    }
  }

  /**
   * Crée une nouvelle offre d'emploi
   * @param data Données de l'offre à créer
   * @returns L'offre d'emploi créée
   */
  static async createJobPosting(data: JobPostingFormData): Promise<JobPosting> {
    try {
      console.log("JobService: Préparation de la création d'offre", {
        title: data.title,
        department: data.responsibilities,
        location: data.location
      });

      // Préparer les données JSON pour l'envoi
      const requestData = {
        ...data
      };

      console.log("JobService: Données préparées, envoi de la requête");

      // Envoyer la requête POST via le proxy API de Next.js
      const response = await api.post('/job-postings', requestData, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log("JobService: Réponse reçue", response.status);

      return response.data;
    } catch (error) {
      console.error('Erreur détaillée lors de la création de l\'offre:', error);
      
      
      throw new Error('Une erreur inattendue est survenue lors de la création de l\'offre');
    }
  }

  /**
   * Met à jour une offre d'emploi existante
   * @param id Identifiant de l'offre à mettre à jour
   * @param data Nouvelles données de l'offre
   * @returns L'offre d'emploi mise à jour
   */
  static async updateJobPosting(id: string, data: JobPostingFormData): Promise<JobPosting> {
    try {
      console.log("JobService: Préparation de la mise à jour de l'offre", {
        id,
        title: data.title,
        department: data.location
      });

      // Préparer les données JSON pour l'envoi
      const requestData = {
        ...data
      };

      console.log("JobService: Données préparées, envoi de la requête");

      // Envoyer la requête PUT via le proxy API de Next.js
      const response = await api.put(`/job-postings/${id}`, requestData, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log("JobService: Réponse reçue", response.status);

      return response.data;
    } catch (error) {
      console.error('Erreur détaillée lors de la mise à jour de l\'offre:', error);
      
      
      
      throw new Error('Une erreur inattendue est survenue lors de la mise à jour de l\'offre');
    }
  }

  /**
   * Supprime une offre d'emploi
   * @param id Identifiant de l'offre à supprimer
   */
  static async deleteJobPosting(id: string): Promise<void> {
    try {
      console.log("JobService: Préparation de la suppression de l'offre", { id });

      console.log("JobService: Envoi de la requête DELETE");

      // Envoyer la requête DELETE via le proxy API de Next.js
      await api.delete(`/job-postings/${id}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log("JobService: Suppression confirmée");
    } catch (error) {
      console.error('Erreur détaillée lors de la suppression de l\'offre:', error);
      
    
      throw new Error('Une erreur inattendue est survenue lors de la suppression de l\'offre');
    }
  }

  /**
   * Publie une offre d'emploi (change son statut à "active")
   * @param id Identifiant de l'offre à publier
   * @returns L'offre d'emploi publiée
   */
  static async publishJobPosting(id: string): Promise<JobPosting> {
    try {
      console.log("JobService: Préparation de la publication de l'offre", { id });

      // Préparer les données vides pour l'action
      const requestData = {};

      console.log("JobService: Envoi de la requête PUT pour publication");

      // Envoyer la requête PUT via le proxy API de Next.js
      const response = await api.put(`/job-postings/${id}/publish`, requestData, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log("JobService: Réponse reçue", response.status);

      return response.data;
    } catch (error) {
      console.error('Erreur détaillée lors de la publication de l\'offre:', error);
      
     
      
      throw new Error('Une erreur inattendue est survenue lors de la publication de l\'offre');
    }
  }

  /**
   * Ferme une offre d'emploi (change son statut à "closed")
   * @param id Identifiant de l'offre à fermer
   * @returns L'offre d'emploi fermée
   */
  static async closeJobPosting(id: string): Promise<JobPosting> {
    try {
      console.log("JobService: Préparation de la fermeture de l'offre", { id });

      // Préparer les données vides pour l'action
      const requestData = {};

      console.log("JobService: Envoi de la requête PUT pour fermeture");

      // Envoyer la requête PUT via le proxy API de Next.js
      const response = await api.put(`/job-postings/${id}/close`, requestData, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log("JobService: Réponse reçue", response.status);

      return response.data;
    } catch (error) {
      console.error('Erreur détaillée lors de la fermeture de l\'offre:', error);
      throw new Error('Une erreur inattendue est survenue lors de la fermeture de l\'offre');
    }
  }

  // ===== ROUTES PUBLIQUES (SANS AUTHENTIFICATION) =====

  /**
   * Récupère les offres d'emploi publiques (sans authentification)
   * @param params Paramètres de filtrage et pagination
   * @returns Liste paginée des offres publiques
   */
  static async getPublicJobPostings(params: {
    page?: number;
    per_page?: number;
    filters?: PublicJobFilters;
  }): Promise<PublicJobPostingsResponse> {
    try {
      const { page = 1, per_page = 20, filters = {} } = params;
      
      console.log("JobService: Préparation de la récupération des offres publiques", {
        page,
        per_page,
        filters
      });

      // Construire les paramètres de requête
      const queryParams = new URLSearchParams();
      queryParams.append('page', page.toString());
      queryParams.append('per_page', per_page.toString());
      
      // Ajouter les filtres
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value.toString());
        }
      });

      console.log("JobService: Paramètres de requête créés, envoi de la requête");

      // Envoyer la requête GET via axios (pas d'authentification nécessaire)
      const response = await axios.get(`/api/job-postings/public?${queryParams.toString()}`);

      console.log("JobService: Réponse reçue", response.status);

      return response.data;
    } catch (error) {
      console.error('Erreur détaillée lors de la récupération des offres publiques:', error);
      throw new Error('Une erreur inattendue est survenue lors de la récupération des offres');
    }
  }

  /**
   * Récupère les détails d'une offre d'emploi publique (sans authentification)
   * @param id Identifiant unique de l'offre
   * @returns L'offre d'emploi correspondante
   */
  static async getPublicJobPosting(id: string): Promise<JobPosting> {
    try {
      console.log("JobService: Préparation de la récupération de l'offre publique", { id });

      console.log("JobService: Envoi de la requête GET");

      // Envoyer la requête GET via axios (pas d'authentification nécessaire)
      const response = await axios.get(`/api/job-postings/public/${id}`);

      console.log("JobService: Réponse reçue", response.status);

      return response.data;
    } catch (error) {
      console.error('Erreur détaillée lors de la récupération de l\'offre publique:', error);
      throw new Error('Une erreur inattendue est survenue lors de la récupération de l\'offre');
    }
  }

  /**
   * Postule à une offre d'emploi (sans authentification)
   * @param jobId Identifiant de l'offre d'emploi
   * @param applicationData Données de la candidature
   * @returns Confirmation de la candidature
   */
  static async applyToJob(jobId: string, applicationData: JobApplicationFormData): Promise<ApplicationResponse> {
    try {
      console.log("JobService: Préparation de la candidature", {
        jobId,
        candidateName: applicationData.candidate_name,
        candidateEmail: applicationData.candidate_email
      });

      // Préparer les données JSON pour l'envoi
      const requestData = {
        ...applicationData
      };

      console.log("JobService: Données préparées, envoi de la requête");

      // Envoyer la requête POST via axios (pas d'authentification nécessaire)
      const response = await axios.post(`/api/job-postings/public/${jobId}/apply`, requestData);

      console.log("JobService: Réponse reçue", response.status);

      return response.data;
    } catch (error) {
      console.error('Erreur détaillée lors de la candidature:', error);
      
      // Extraire le message d'erreur si disponible
      let errorMessage = 'Une erreur inattendue est survenue lors de l\'envoi de la candidature';
      if (axios.isAxiosError(error) && error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      
      throw new Error(errorMessage);
    }
  }

  /**
   * Upload un CV (sans authentification)
   * @param file Fichier CV à uploader
   * @returns URL du fichier uploadé
   */
  static async uploadResume(file: File): Promise<UploadResponse> {
    try {
      console.log("JobService: Préparation de l'upload du CV", {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
      });

      // Préparer les données FormData pour l'envoi
      const formData = new FormData();
      formData.append('file', file);

      console.log("JobService: Données préparées, envoi de la requête");

      // Envoyer la requête POST via axios (pas d'authentification nécessaire)
      const response = await axios.post('/api/job-postings/upload/resume', formData);

      console.log("JobService: Réponse reçue", response.status);

      return response.data;
    } catch (error) {
      console.error('Erreur détaillée lors de l\'upload du CV:', error);
      
      // Extraire le message d'erreur si disponible
      let errorMessage = 'Une erreur inattendue est survenue lors de l\'upload du CV';
      if (axios.isAxiosError(error) && error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      
      throw new Error(errorMessage);
    }
  }

  // ===== ROUTES AUTHENTIFIÉES =====

  /**
   * Récupère les candidatures pour une offre d'emploi (authentifié)
   * @param jobId Identifiant de l'offre d'emploi
   * @param params Paramètres de pagination
   * @returns Liste paginée des candidatures
   */
  static async getJobApplications(jobId: string, params: {
    limit?: number;
    offset?: number;
  }): Promise<JobApplicationsResponse> {
    try {
      const { limit = 20, offset = 0 } = params;
      
      console.log("JobService: Préparation de la récupération des candidatures", {
        jobId,
        limit,
        offset
      });

      // Construire les paramètres de requête
      const queryParams = new URLSearchParams();
      queryParams.append('limit', limit.toString());
      queryParams.append('offset', offset.toString());

      console.log("JobService: Paramètres de requête créés, envoi de la requête");

      // Envoyer la requête GET via le proxy API de Next.js (avec authentification)
      const response = await api.get(`/job-postings/${jobId}/applications`, {
        params: Object.fromEntries(queryParams),
        
      });

      console.log("JobService: Réponse reçue", response.status);

      return response.data;
    } catch (error) {
      console.error('Erreur détaillée lors de la récupération des candidatures:', error);
      throw new Error('Une erreur inattendue est survenue lors de la récupération des candidatures');
    }
  }

  /**
   * Récupère les détails d'une candidature (authentifié)
   * @param applicationId Identifiant de la candidature
   * @returns Détails de la candidature
   */
  static async getApplicationDetails(applicationId: string): Promise<JobApplicationDetails> {
    try {
      console.log("JobService: Préparation de la récupération des détails de candidature", { applicationId });

      console.log("JobService: Envoi de la requête GET");

      // Envoyer la requête GET via le proxy API de Next.js (avec authentification)
      const response = await api.get(`/job-postings/applications/${applicationId}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log("JobService: Réponse reçue", response.status);

      return response.data;
    } catch (error) {
      console.error('Erreur détaillée lors de la récupération des détails de candidature:', error);
      throw new Error('Une erreur inattendue est survenue lors de la récupération des détails');
    }
  }

  /**
   * Met à jour le statut d'une candidature (authentifié)
   * @param applicationId Identifiant de la candidature
   * @param status Nouveau statut
   * @param notes Notes optionnelles
   * @returns Confirmation de la mise à jour
   */
  static async updateApplicationStatus(
    applicationId: string, 
    status: ApplicationStatus, 
    notes?: string
  ): Promise<{ success: boolean; message: string; application: any }> {
    try {
      console.log("JobService: Préparation de la mise à jour du statut de candidature", {
        applicationId,
        status,
        notes
      });

      // Préparer les données JSON pour l'envoi
      const requestData = {
        status,
        ...(notes && { notes })
      };

      console.log("JobService: Données préparées, envoi de la requête");

      // Envoyer la requête PUT via le proxy API de Next.js (avec authentification)
      const response = await api.put(`/job-postings/applications/${applicationId}/status`, requestData, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log("JobService: Réponse reçue", response.status);

      return response.data;
    } catch (error) {
      console.error('Erreur détaillée lors de la mise à jour du statut:', error);
      throw new Error('Une erreur inattendue est survenue lors de la mise à jour du statut');
    }
  }

  // ===== MÉTHODES UTILITAIRES =====

  /**
   * Traduit les statuts d'application en français
   * @param status Statut en anglais
   * @returns Statut traduit en français
   */
  static getApplicationStatusLabel(status: ApplicationStatus): string {
    const statusLabels = {
      'new': 'Nouveau',
      'reviewed': 'Examiné',
      'interview_scheduled': 'Entretien planifié',
      'hired': 'Embauché',
      'rejected': 'Rejeté'
    };
    return statusLabels[status] || status;
  }

  /**
   * Obtient la couleur associée à un statut d'application
   * @param status Statut de l'application
   * @returns Code couleur hexadécimal
   */
  static getApplicationStatusColor(status: ApplicationStatus): string {
    const statusColors = {
      'new': '#3498db',
      'reviewed': '#f39c12',
      'interview_scheduled': '#9b59b6',
      'hired': '#27ae60',
      'rejected': '#e74c3c'
    };
    return statusColors[status] || '#95a5a6';
  }

  /**
   * Valide les données d'une candidature
   * @param data Données de candidature à valider
   * @returns Objet avec les erreurs de validation
   */
  static validateApplicationData(data: JobApplicationFormData): Record<string, string> {
    const errors: Record<string, string> = {};

    if (!data.candidate_name?.trim()) {
      errors.candidate_name = 'Le nom est requis';
    }

    if (!data.candidate_email?.trim()) {
      errors.candidate_email = 'L\'email est requis';
    } else if (!/\S+@\S+\.\S+/.test(data.candidate_email)) {
      errors.candidate_email = 'Format d\'email invalide';
    }

    return errors;
  }

  /**
   * Valide un fichier de CV
   * @param file Fichier à valider
   * @returns Message d'erreur ou null si valide
   */
  static validateResumeFile(file: File): string | null {
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    const maxSize = 16 * 1024 * 1024; // 16MB

    if (!allowedTypes.includes(file.type)) {
      return 'Seuls les fichiers PDF, DOC et DOCX sont autorisés';
    }

    if (file.size > maxSize) {
      return 'Le fichier ne doit pas dépasser 16MB';
    }

    return null;
  }
  /**
   * Récupère les URLs sécurisées pour accéder au CV d'une candidature
   */
  static async getApplicationResumeUrls(applicationId: string): Promise<{
    resume_available: boolean;
    download_url?: string;
    preview_url?: string;
    filename?: string;
  }> {
    const response = await api.get(`/applications/${applicationId}/resume/url`, {
     
    });

    if (response.status!==200) {
      throw new Error('Erreur lors de la récupération des URLs du CV');
    }

    return response.data;
  }

  /**
 * Télécharge le CV d'une candidature
 */
  static async downloadApplicationResume(applicationId: string, filename?: string): Promise<void> {
    const response = await api.get(`/job-postings/applications/${applicationId}/resume`, {
      responseType: 'blob' // CORRECTION: Essentiel pour les fichiers binaires
    });

    if (response.status !== 200) {
      throw new Error('Erreur lors du téléchargement du CV');
    }

    // Créer un lien de téléchargement
    const blob = new Blob([response.data]);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || 'CV.pdf';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }
 
  /**
 * Ouvre le CV dans un nouvel onglet pour prévisualisation
 */
  static async previewApplicationResume(applicationId: string): Promise<void> {
    try {
      const response = await api.get(`/job-postings/applications/${applicationId}/resume`, {
        params: { preview: 'true' },
        responseType: 'blob'
      });

      if (response.status === 200) {
        const contentType = response.headers['content-type'] || 'application/pdf';
        const blob = new Blob([response.data], { type: contentType });
        const blobUrl = URL.createObjectURL(blob);

        const newWindow = window.open(blobUrl, '_blank');
        if (!newWindow) {
          throw new Error('Impossible d\'ouvrir le fichier. Vérifiez que les pop-ups sont autorisés.');
        }

        setTimeout(() => {
          URL.revokeObjectURL(blobUrl);
        }, 60000); 

      } else {
        throw new Error('Erreur lors de la prévisualisation');
      }
    } catch (error) {
      console.error('Erreur prévisualisation:', error);
      throw error;
    }
  }


  /**
   * Upload d'un fichier d'offre d'emploi (authentifié)
   * @param file Fichier d'offre d'emploi à uploader
   * @returns Réponse avec l'URL du fichier uploadé
   */
  static async uploadJobPostingFile(file: File): Promise<{
    success: boolean;
    message: string;
    file_url: string;
    filename: string;
  }> {
    try {
      console.log("JobService: Préparation de l'upload du fichier d'offre", {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
      });

      // Préparer les données FormData pour l'envoi
      const formData = new FormData();
      formData.append('file', file);

      console.log("JobService: Données préparées, envoi de la requête");

      // Envoyer la requête POST via le proxy API de Next.js (avec authentification)
      const response = await api.post('/job-postings/upload/file', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log("JobService: Réponse reçue", response.status);

      return response.data;
    } catch (error) {
      console.error('Erreur détaillée lors de l\'upload du fichier d\'offre:', error);
      
      // Extraire le message d'erreur si disponible
      let errorMessage = 'Une erreur inattendue est survenue lors de l\'upload du fichier';
      if (axios.isAxiosError(error) && error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      
      throw new Error(errorMessage);
    }
  }

  /**
   * Crée une offre d'emploi à partir d'un fichier uploadé (authentifié)
   * @param data Données pour créer l'offre à partir du fichier
   * @returns L'offre d'emploi créée
   */
  static async createJobPostingFromFile(data: {
    title: string;
    file_url: string;
    // requirements?: string;
    // responsibilities?: string;
    location?: string;
    // employment_type?: string;
    // remote_policy?: string;
    // salary_range_min?: number;
    // salary_range_max?: number;
    // salary_currency?: string;
  }): Promise<{
    success: boolean;
    message: string;
    job_posting: JobPosting;
  }> {
    try {
      console.log("JobService: Préparation de la création d'offre depuis fichier", {
        title: data.title,
        file_url: data.file_url,
        location: data.location
      });

      // Préparer les données JSON pour l'envoi
      const requestData = {
        ...data
      };

      console.log("JobService: Données préparées, envoi de la requête");

      // Envoyer la requête POST via le proxy API de Next.js (avec authentification)
      const response = await api.post('/job-postings/create-from-file', requestData, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log("JobService: Réponse reçue", response.status);

      return response.data;
    } catch (error) {
      console.error('Erreur détaillée lors de la création d\'offre depuis fichier:', error);
      
      // Extraire le message d'erreur si disponible
      let errorMessage = 'Une erreur inattendue est survenue lors de la création de l\'offre depuis le fichier';
      if (axios.isAxiosError(error) && error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      
      throw new Error(errorMessage);
    }
  }

  /**
   * Récupère les URLs sécurisées pour accéder au fichier d'une offre d'emploi (authentifié)
   * @param jobId Identifiant de l'offre d'emploi
   * @returns URLs pour télécharger et prévisualiser le fichier
   */
  static async getJobPostingFileUrls(jobId: string): Promise<{
    file_available: boolean;
    download_url?: string;
    preview_url?: string;
    filename?: string;
  }> {
    try {
      console.log("JobService: Préparation de la récupération des URLs du fichier d'offre", { jobId });

      console.log("JobService: Envoi de la requête GET");

      // Envoyer la requête GET via le proxy API de Next.js (avec authentification)
      const response = await api.get(`/job-postings/${jobId}/file/url`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log("JobService: Réponse reçue", response.status);

      return response.data;
    } catch (error) {
      console.error('Erreur détaillée lors de la récupération des URLs du fichier d\'offre:', error);
      throw new Error('Une erreur inattendue est survenue lors de la récupération des URLs du fichier');
    }
  }

  /**
   * Télécharge le fichier d'une offre d'emploi (authentifié)
   * @param jobId Identifiant de l'offre d'emploi
   * @param filename Nom du fichier (optionnel)
   */
  static async downloadJobPostingFile(jobId: string, filename?: string): Promise<void> {
    try {
      console.log("JobService: Préparation du téléchargement du fichier d'offre", { jobId });

      // Envoyer la requête GET via le proxy API de Next.js (avec authentification)
      const response = await api.get(`/job-postings/${jobId}/file`, {
        responseType: 'blob', // Important pour les fichiers binaires
      });

      console.log("JobService: Réponse reçue", response.status);

      if (response.status !== 200) {
        throw new Error('Erreur lors du téléchargement du fichier');
      }

      // Créer un lien de téléchargement
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || 'offre-emploi.pdf';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Erreur détaillée lors du téléchargement du fichier d\'offre:', error);
      throw new Error('Une erreur inattendue est survenue lors du téléchargement du fichier');
    }
  }

  /**
   * Ouvre le fichier d'une offre d'emploi dans un nouvel onglet pour prévisualisation (authentifié)
   * @param jobId Identifiant de l'offre d'emploi
   */
  static async previewJobPostingFile(jobId: string): Promise<void> {
    try {
      console.log("JobService: Préparation de la prévisualisation du fichier d'offre", { jobId });

      // Envoyer la requête GET via le proxy API de Next.js (avec authentification)
      const response = await api.get(`/job-postings/${jobId}/file`, {
        params: { preview: 'true' },
        responseType: 'blob'
      });

      console.log("JobService: Réponse reçue", response.status);

      if (response.status === 200) {
        const contentType = response.headers['content-type'] || 'application/pdf';
        const blob = new Blob([response.data], { type: contentType });
        const blobUrl = URL.createObjectURL(blob);

        const newWindow = window.open(blobUrl, '_blank');
        if (!newWindow) {
          throw new Error('Impossible d\'ouvrir le fichier. Vérifiez que les pop-ups sont autorisés.');
        }

        // Nettoyer l'URL après un délai
        setTimeout(() => {
          URL.revokeObjectURL(blobUrl);
        }, 60000);

      } else {
        throw new Error('Erreur lors de la prévisualisation');
      }
    } catch (error) {
      console.error('Erreur détaillée lors de la prévisualisation du fichier d\'offre:', error);
      throw new Error('Une erreur inattendue est survenue lors de la prévisualisation du fichier');
    }
  }

  // ===== MÉTHODES UTILITAIRES POUR LES FICHIERS =====

  /**
   * Valide un fichier d'offre d'emploi
   * @param file Fichier à valider
   * @returns Message d'erreur ou null si valide
   */
  static validateJobPostingFile(file: File): string | null {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'application/rtf'
    ];
    const maxSize = 16 * 1024 * 1024; // 16MB

    if (!allowedTypes.includes(file.type)) {
      return 'Seuls les fichiers PDF, DOC, DOCX, TXT et RTF sont autorisés';
    }

    if (file.size > maxSize) {
      return 'Le fichier ne doit pas dépasser 16MB';
    }

    if (file.size === 0) {
      return 'Le fichier est vide';
    }

    return null;
  }

  /**
   * Obtient l'extension du fichier à partir de son nom
   * @param filename Nom du fichier
   * @returns Extension du fichier
   */
  static getFileExtension(filename: string): string {
    return filename.split('.').pop()?.toLowerCase() || '';
  }

  /**
   * Obtient l'icône appropriée pour un type de fichier
   * @param filename Nom du fichier
   * @returns Nom de l'icône (pour une bibliothèque d'icônes comme Lucide)
   */
  static getFileIcon(filename: string): string {
    const extension = this.getFileExtension(filename);
    
    switch (extension) {
      case 'pdf':
        return 'file-text';
      case 'doc':
      case 'docx':
        return 'file-text';
      case 'txt':
        return 'file-text';
      case 'rtf':
        return 'file-text';
      default:
        return 'file';
    }
  }

  /**
   * Formate la taille d'un fichier en unités lisibles
   * @param bytes Taille en bytes
   * @returns Taille formatée (ex: "1.5 MB")
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

}