// services/ai-assistant-service.ts
import { AIAssistant, CloneOptions, AIDocument, TestAssistantParams, HistoryFilters, AssistantTemplate, CreateAssistantData, UpdateAssistantData, AssistantStats, APIKeyData, normalizeAssistant } from '@/types/assistant';
import { api } from './user-service';

const API_URL = '/ai-assistants';

interface ListFilters {
  type?: string;
  include_templates?: boolean;
  created_by_user?: boolean;
}

interface DuplicateOptions {
  name?: string;
  copyApiKey?: boolean;
}

interface TemplateOptions {
  templateName?: string;
  removeApiKey?: boolean;
}

interface CreateFromTemplateData {
  name: string;
  apiKey?: string;
  apiProvider?: string;
  customizations?: Record<string, any>;
}

class AIAssistantService {
  // ====== CRUD DE BASE ======

  /**
   * Récupère tous les assistants IA avec filtres
   */
  async getAllAssistants(filters: ListFilters = {}): Promise<{ status: string; data: AIAssistant[] }> {
    try {
      const params = new URLSearchParams();
      if (filters.type) params.append('type', filters.type);
      if (filters.include_templates) params.append('include_templates', 'true');
      if (filters.created_by_user) params.append('created_by_user', 'true');

      const response = await api.get(`${API_URL}?${params.toString()}`);
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Récupère un assistant par son ID
   */
  async getAssistantById(id: string): Promise< {statut: string, data: any}> {
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
   */
  async createAssistant(assistantData: CreateAssistantData): Promise<{ status: string; data: AIAssistant; message: string }> {
    try {
      console.log('Données envoyées au backend:', assistantData);
      
      const response = await api.post(API_URL, assistantData);
      console.log('Réponse du backend:', response.data);
      
      return response.data;
    } catch (error: any) {
      console.error('Erreur lors de la création:', error);
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Met à jour un assistant existant
   */
  async updateAssistant(id: string, assistantData: UpdateAssistantData): Promise<{ status: string; data: AIAssistant; message: string }> {
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
   */
  async deleteAssistant(id: string, force: boolean = false): Promise<{ status: string; message: string }> {
    try {
      const params = force ? '?force=true' : '';
      const response = await api.delete(`${API_URL}/${id}${params}`);
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  // ====== FONCTIONNALITÉS AVANCÉES ======

  /**
   * Duplique un assistant existant
   */
  async duplicateAssistant(id: string, options: DuplicateOptions = {}): Promise<{ status: string; data: AIAssistant; message: string }> {
    try {
      const response = await api.post(`${API_URL}/${id}/clone`, options);
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Convertit un assistant en template
   */
  async makeTemplate(id: string, options: TemplateOptions = {}): Promise<{ status: string; data: AIAssistant; message: string }> {
    try {
      const response = await api.post(`${API_URL}/${id}/make-template`, options);
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Valide la configuration d'un assistant
   */
  async validateAssistant(id: string): Promise<{ status: string; data: any }> {
    try {
      const response = await api.post(`${API_URL}/${id}/validate`);
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  // ====== GESTION DES TEMPLATES ======

  /**
   * Récupère les templates d'assistants disponibles
   */
  async getTemplates(type?: string): Promise<{ status: string; data: AssistantTemplate[] }> {
    try {
      const params = type ? `?type=${type}` : '';
      const response = await api.get(`${API_URL}/templates${params}`);
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Crée un assistant à partir d'un template
   */
  async createFromTemplate(templateId: string, data: CreateFromTemplateData): Promise<{ status: string; data: AIAssistant; message: string }> {
    try {
      const response = await api.post(`${API_URL}/from-template/${templateId}`, data);
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  // ====== GESTION DES CLÉS D'API ======

  /**
   * Met à jour la clé d'API d'un assistant
   */
  async updateApiKey(id: string, apiKeyData: APIKeyData): Promise<{ status: string; data: any; message: string }> {
    try {
      const response = await api.post(`${API_URL}/${id}/api-key`, apiKeyData);
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Supprime la clé d'API d'un assistant
   */
  async removeApiKey(id: string): Promise<{ status: string; message: string }> {
    try {
      const response = await api.delete(`${API_URL}/${id}/api-key`);
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  // ====== GESTION DES DOCUMENTS ======

  /**
   * Récupère les documents d'un assistant
   */
  async getDocuments(assistantId: string): Promise<{  data: AIDocument[] }> {
    try {
      const response = await api.get(`${API_URL}/${assistantId}/documents`);
      return response;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Upload un document pour un assistant
   */
  async uploadDocument(assistantId: string, file: File, documentType: string, description?: string): Promise<{ status: string; data: AIDocument; message: string }> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('document_type', documentType);
      if (description) formData.append('description', description);
      
      const response = await api.post(
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
   * Supprime un document d'un assistant
   */
  async deleteDocument(assistantId: string, documentId: string): Promise<{ status: string; message: string }> {
    try {
      const response = await api.delete(`${API_URL}/${assistantId}/documents/${documentId}`);
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  // ====== STATISTIQUES ET MONITORING ======

  /**
   * Récupère les statistiques d'un assistant
   */
  async getStats(assistantId: string): Promise<{ status: string; data: AssistantStats }> {
    try {
      const response = await api.get(`${API_URL}/${assistantId}/stats`);
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  // ====== MÉTHODES DE COMPATIBILITÉ (pour l'ancien code) ======

  /**
   * @deprecated Utiliser getAllAssistants() à la place
   */
  async getUserAssistants(): Promise<AIAssistant[]> {
    const result = await this.getAllAssistants({ created_by_user: true });
    return result.data;
  }

  /**
   * @deprecated Utiliser duplicateAssistant() à la place
   */
  async cloneAssistant(id: string, options: CloneOptions = {}): Promise<AIAssistant> {
    const result = await this.duplicateAssistant(id, options);
    return result.data;
  }

  /**
   * @deprecated Utiliser getTemplates() à la place
   */
  async getAssistantTemplates(): Promise<AssistantTemplate[]> {
    const result = await this.getTemplates();
    return result.data;
  }

  // ====== MÉTHODES UTILITAIRES ======

  /**
   * Gère les erreurs API
   */
  private handleError(error: any): void {
    console.error('AI Assistant Service Error:', error);
    
    if (error.response) {
      const { status, data } = error.response;
      
      // Messages d'erreur personnalisés
      const errorMessages: Record<number, string> = {
        400: 'Données invalides',
        401: 'Authentification requise',
        403: 'Accès non autorisé',
        404: 'Assistant non trouvé',
        409: 'Conflit - l\'assistant existe déjà ou est utilisé',
        429: 'Trop de requêtes',
        500: 'Erreur interne du serveur'
      };

      const customMessage = errorMessages[status];
      const serverMessage = data?.message || data?.error;
      
      error.message = serverMessage || customMessage || `Erreur ${status}`;
    } else if (error.request) {
      error.message = 'Erreur de connexion au serveur';
    }
  }

  /**
   * Valide les données d'un assistant avant envoi
   */
  private validateAssistantData(data: any): void {
    if (!data.name?.trim()) {
      throw new Error('Le nom de l\'assistant est requis');
    }

    if (!data.assistantType) {
      throw new Error('Le type d\'assistant est requis');
    }

    if (!data.model) {
      throw new Error('Le modèle IA est requis');
    }

    if (!data.interviewMode) {
      throw new Error('Le mode d\'entretien est requis');
    }
  }

  /**
   * Formate les données pour l'envoi au backend
   */
  private formatDataForBackend(data: any): any {
    // Conversion camelCase vers snake_case pour certains champs si nécessaire
    return {
      ...data,
      assistant_type: data.assistantType,
      job_role: data.jobRole,
      interview_mode: data.interviewMode,
      base_knowledge: data.baseKnowledge,
      custom_prompt: data.customPrompt,
      question_bank: data.questionBank,
      api_key: data.apiKey,
      api_provider: data.apiProvider
    };
  }

  /**
   * Normalise les données reçues du backend
   */
  private normalizeDataFromBackend(data: any): any {
    // Conversion snake_case vers camelCase
    return {
      ...data,
      assistantType: data.assistant_type || data.assistantType,
      jobRole: data.job_role || data.jobRole,
      interviewMode: data.interview_mode || data.interviewMode,
      baseKnowledge: data.base_knowledge || data.baseKnowledge,
      customPrompt: data.custom_prompt || data.customPrompt,
      questionBank: data.question_bank || data.questionBank,
      usageCount: data.usage_count || data.usageCount,
      lastUsed: data.last_used || data.lastUsed,
      createdAt: data.created_at || data.createdAt,
      updatedAt: data.updated_at || data.updatedAt,
      isTemplate: data.is_template || data.isTemplate,
      templateId: data.template_id || data.templateId,
      hasApiKey: data.has_api_key || data.hasApiKey,
      apiProvider: data.api_provider || data.apiProvider,
      apiKeyMasked: data.api_key_masked || data.apiKeyMasked,
      apiKeyLastUpdated: data.api_key_last_updated || data.apiKeyLastUpdated
    };
  }
}

// Exporter une instance unique du service
export default new AIAssistantService();