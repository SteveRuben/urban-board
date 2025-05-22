// services/job-service.ts
import { JobPosting, JobPostingFormData, JobPostingsResponse } from '@/types/jobs';
import { api } from './user-service';

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
}