// frontend/services/aiAssistantService.ts
import { AIAssistant, CloneOptions, AIDocument, TestAssistantParams, HistoryFilters, AssistantTemplate } from '@/types/assistant';
import axios from 'axios';
import { api } from './user-service';

const API_URL = '/ai-assistants';

class AIAssistantService {

  /**
   * Récupère tous les assistants IA de l'utilisateur
   * @returns {Promise<Array<AIAssistant>>} Liste des assistants
   */
  async getAllAssistants(): Promise<AIAssistant[]> {
    try {
      const response = await api.get(API_URL);
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Récupère un assistant par son ID
   * @param {string} id - ID de l'assistant
   * @returns {Promise<AIAssistant>} Données de l'assistant
   */
  async getAssistantById(id: string): Promise<AIAssistant> {
    try {
      const response = await api.get(`${API_URL}/${id}`);
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Crée un nouvel assistant IA
   * @param {any} assistantData - Données de l'assistant à créer
   * @returns {Promise<AIAssistant>} Assistant créé
   */
  async createAssistant(assistantData: any): Promise<AIAssistant> {
    try {
      console.log('Données envoyées au backend:', assistantData);
      
      // CORRECTION : Envoyer directement assistantData, pas { assistantData }
      const response = await api.post(API_URL, assistantData);
      
      console.log('Réponse du backend:', response.data);
      return response.data;
      
    } catch (error: any) {
      console.error('Erreur lors de la création:', error);
      
      // Améliorer la gestion d'erreurs
      if (error.response) {
        const errorMessage = error.response.data?.error || error.response.data?.message || 'Erreur inconnue';
        throw new Error(`Erreur ${error.response.status}: ${errorMessage}`);
      } else if (error.request) {
        throw new Error('Erreur de connexion au serveur');
      } else {
        throw new Error(error.message || 'Erreur lors de la création de l\'assistant');
      }
    }
  }

  /**
   * Met à jour un assistant existant
   * @param {string} id - ID de l'assistant
   * @param {any} assistantData - Nouvelles données de l'assistant
   * @returns {Promise<AIAssistant>} Assistant mis à jour
   */
  async updateAssistant(id: string, assistantData: any): Promise<AIAssistant> {
    try {
      const response = await api.put(`${API_URL}/${id}`, assistantData);
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Supprime un assistant
   * @param {string} id - ID de l'assistant à supprimer
   * @returns {Promise<void>}
   */
  async deleteAssistant(id: string): Promise<void> {
    try {
      await api.delete(`${API_URL}/${id}`);
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Récupère les modèles d'assistants prédéfinis
   * @returns {Promise<Array<AssistantTemplate>>} Liste des modèles
   */
  async getAssistantTemplates(): Promise<AssistantTemplate[]> {
    try {
      const response = await api.get(`${API_URL}/templates`);
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Clone un assistant existant ou un modèle
   * @param {string} id - ID de l'assistant ou du modèle à cloner
   * @param {CloneOptions} options - Options de clonage (nouveau nom, etc.)
   * @returns {Promise<AIAssistant>} Nouvel assistant cloné
   */
  async cloneAssistant(id: string, options: CloneOptions = {}): Promise<AIAssistant> {
    try {
      const response = await api.post(`${API_URL}/${id}/clone`, options);
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Télécharge un document à associer à un assistant
   * @param {string} assistantId - ID de l'assistant
   * @param {File} file - Fichier à télécharger
   * @param {string} documentType - Type de document (company_values, job_description, etc.)
   * @returns {Promise<AIDocument>} Métadonnées du document
   */
  async uploadDocument(assistantId: string, file: File, documentType: string): Promise<AIDocument> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('documentType', documentType);
      
      const response = await api.post<AIDocument>(
        `${API_URL}/${assistantId}/documents`, 
        formData, 
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Récupère la liste des documents associés à un assistant
   * @param {string} assistantId - ID de l'assistant
   * @returns {Promise<Array<AIDocument>>} Liste des documents
   */
  async getAssistantDocuments(assistantId: string): Promise<AIDocument[]> {
    try {
      const response = await api.get(`${API_URL}/${assistantId}/documents`);
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Supprime un document associé à un assistant
   * @param {string} assistantId - ID de l'assistant
   * @param {string} documentId - ID du document
   * @returns {Promise<void>}
   */
  async deleteDocument(assistantId: string, documentId: string): Promise<void> {
    try {
      await api.delete(`${API_URL}/${assistantId}/documents/${documentId}`);
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Test la réponse de l'assistant à une question
   * @param {string} assistantId - ID de l'assistant à tester
   * @param {TestAssistantParams} params - Paramètres du test (question, etc.)
   * @returns {Promise<any>} Réponse de l'assistant
   */
  async testAssistant(assistantId: string, params: TestAssistantParams): Promise<any> {
    try {
      const response = await api.post(`${API_URL}/${assistantId}/test`, params);
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Récupère l'historique des conversations avec un assistant
   * @param {string} assistantId - ID de l'assistant
   * @param {HistoryFilters} filters - Filtres optionnels (dates, etc.)
   * @returns {Promise<Array>} Historique des conversations
   */
  async getAssistantHistory(assistantId: string, filters: HistoryFilters = {}): Promise<any[]> {
    try {
      const response = await api.get(`${API_URL}/${assistantId}/history`, { params: filters });
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Gère les erreurs API
   * @param {any} error - Erreur à traiter
   * @private
   */
  private handleError(error: any): void {
    console.error('AI Assistant Service Error:', error);
    
    if (error.response) {
      const { status, data } = error.response;
      
      if (status === 401) {
        console.warn('Authentication required for AI Assistant service');
      }
      
      if (status === 403) {
        console.warn('User does not have permission to access AI Assistant service');
      }
      
      // Personnaliser le message d'erreur
      error.message = data?.error || data?.message || `Error ${status}: AI Assistant service request failed`;
    } else if (error.request) {
      error.message = 'Erreur de connexion au serveur';
    }
  }
  
  /**
   * Récupère les assistants IA disponibles pour l'utilisateur
   * @returns {Promise<Array<AIAssistant>>} Liste des assistants IA
   */
  async getUserAssistants(): Promise<AIAssistant[]> {
    try {
      const response = await api.get('/ai-assistants');
      return response.data;
    } catch (error) {
      console.error('Erreur de récupération des assistants IA:', error);
      throw error;
    }
  }

  // ... autres méthodes restent identiques ...
}

// Exporter une instance unique du service
export default new AIAssistantService();