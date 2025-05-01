// frontend/services/aiAssistantService.ts
import { AIAssistant, CloneOptions, AIDocument, TestAssistantParams, HistoryFilters, AssistantTemplate } from '@/types/assistant';
import axios from 'axios';

const API_URL = '/api/ai-assistants';


class AIAssistantService {

  /**
   * Récupère tous les assistants IA de l'utilisateur
   * @returns {Promise<Array<AIAssistant>>} Liste des assistants
   */
  async getAllAssistants(): Promise<AIAssistant[]> {
    try {
      const response = await fetch(API_URL);
      if (!response.ok) {
        throw new Error('Failed to fetch assistants');
      }
      return await response.json();
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
      const response = await fetch(`${API_URL}/${id}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch assistant with id ${id}`);
      }
      return await response.json();
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
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(assistantData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create assistant');
      }
      
      return await response.json();
    } catch (error) {
      this.handleError(error);
      throw error;
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
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(assistantData),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update assistant with id ${id}`);
      }
      
      return await response.json();
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
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete assistant with id ${id}`);
      }
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
      const response = await fetch(`${API_URL}/templates`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch assistant templates');
      }
      
      return await response.json();
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
      const response = await fetch(`${API_URL}/${id}/clone`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(options),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to clone assistant with id ${id}`);
      }
      
      return await response.json();
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
      
      const response = await axios.post<AIDocument>(
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
      const response = await fetch(`${API_URL}/${assistantId}/documents`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch documents for assistant with id ${assistantId}`);
      }
      
      return await response.json();
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
      const response = await fetch(`${API_URL}/${assistantId}/documents/${documentId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete document ${documentId} for assistant ${assistantId}`);
      }
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
      const response = await fetch(`${API_URL}/${assistantId}/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to test assistant with id ${assistantId}`);
      }
      
      return await response.json();
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
      const queryParams = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, String(value));
        }
      });
      
      const response = await fetch(`${API_URL}/${assistantId}/history?${queryParams.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch history for assistant with id ${assistantId}`);
      }
      
      return await response.json();
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
    // On pourrait ajouter des logs ou de la télémétrie ici
    console.error('AI Assistant Service Error:', error);
    
    // Si nécessaire, on pourrait implémenter une logique spécifique selon les codes d'erreur
    if (error.response) {
      const { status, data } = error.response;
      
      if (status === 401) {
        // L'utilisateur n'est pas authentifié
        console.warn('Authentication required for AI Assistant service');
        // Potentiellement rediriger vers la page de connexion
      }
      
      if (status === 403) {
        // L'utilisateur n'a pas accès à cette fonctionnalité
        console.warn('User does not have permission to access AI Assistant service');
      }
      
      // On pourrait personnaliser le message d'erreur
      error.message = data?.message || `Error ${status}: AI Assistant service request failed`;
    }
  }
  
  /**
   * Récupère les assistants IA disponibles pour l'utilisateur
   * @returns {Promise<Array<AIAssistant>>} Liste des assistants IA
   */
  async getUserAssistants(): Promise<AIAssistant[]> {
    try {
      // En production, appeler l'API réelle
      const response = await fetch('/api/ai-assistants');
      if (!response.ok) throw new Error('Erreur lors du chargement des assistants');
      return await response.json();
    } catch (error) {
      console.error('Erreur de récupération des assistants IA:', error);
      throw error;
    }
  }

  /**
   * Récupère les contenus générés par les assistants IA pour un entretien
   * @param {string} interviewId ID de l'entretien
   * @param {object} filters Filtres optionnels (par exemple, par type de contenu, par assistant)
   * @returns {Promise<Array>} Liste des contenus générés
   */
  async getAIContents(interviewId: string, filters: Record<string, any> = {}): Promise<any[]> {
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const response = await fetch(`/api/interviews/${interviewId}/ai-contents?${queryParams}`);
      if (!response.ok) throw new Error('Erreur lors du chargement des contenus IA');
      return await response.json();
    } catch (error) {
      console.error('Erreur de récupération des contenus IA:', error);
      throw error;
    }
  }

  /**
   * Demande une analyse spécifique à un assistant IA
   * @param {string} teamId ID de l'équipe
   * @param {string} interviewId ID de l'entretien
   * @param {string} aiAssistantId ID de l'assistant IA à utiliser
   * @param {string} analysisType Type d'analyse à effectuer
   * @param {object} parameters Paramètres supplémentaires pour l'analyse
   * @returns {Promise<object>} Résultat de l'analyse
   */
  async requestAnalysis(
    teamId: string, 
    interviewId: string, 
    aiAssistantId: string, 
    analysisType: string, 
    parameters: Record<string, any> = {}
  ): Promise<any> {
    try {
      const response = await fetch(`/api/teams/${teamId}/interviews/${interviewId}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ai_assistant_id: aiAssistantId,
          analysis_type: analysisType,
          parameters,
        }),
      });
      
      if (!response.ok) throw new Error('Erreur lors de la demande d\'analyse');
      return await response.json();
    } catch (error) {
      console.error('Erreur lors de la demande d\'analyse IA:', error);
      throw error;
    }
  }

  /**
   * Génère des questions suggérées basées sur le contexte actuel de l'entretien
   * @param {string} interviewId ID de l'entretien
   * @param {string} context Contexte actuel (ex: "technical", "behavioral")
   * @param {number} count Nombre de questions à générer
   * @returns {Promise<Array>} Liste des questions suggérées
   */
  async getSuggestedQuestions(interviewId: string, context: string, count: number = 3): Promise<any[]> {
    try {
      const response = await fetch(`/api/interviews/${interviewId}/suggested-questions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          context,
          count,
        }),
      });
      
      if (!response.ok) throw new Error('Erreur lors de la génération des questions suggérées');
      return await response.json();
    } catch (error) {
      console.error('Erreur lors de la génération des questions suggérées:', error);
      throw error;
    }
  }
  
  /**
   * Obtient une réponse de l'assistant IA en mode de chat
   * @param {string} interviewId ID de l'entretien
   * @param {string} message Message de l'utilisateur
   * @param {Array} history Historique de la conversation
   * @returns {Promise<object>} Réponse de l'assistant
   */
  async getChatResponse(interviewId: string, message: string, history: any[] = []): Promise<any> {
    try {
      const response = await fetch(`/api/interviews/${interviewId}/ai-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          history,
        }),
      });
      
      if (!response.ok) throw new Error('Erreur lors de la communication avec l\'assistant IA');
      return await response.json();
    } catch (error) {
      console.error('Erreur lors de la communication avec l\'assistant IA:', error);
      throw error;
    }
  }
  
  /**
   * Évalue une réponse de candidat en temps réel
   * @param {string} interviewId ID de l'entretien
   * @param {string} questionId ID de la question
   * @param {string} candidateResponse Réponse du candidat
   * @param {string} mode Mode d'entretien ('autonomous' ou 'collaborative')
   * @returns {Promise<object>} Évaluation de la réponse
   */
  async evaluateResponse(
    interviewId: string, 
    questionId: string, 
    candidateResponse: string, 
    mode: 'autonomous' | 'collaborative' = 'autonomous'
  ): Promise<any> {
    try {
      const response = await fetch(`/api/interviews/${interviewId}/evaluate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question_id: questionId,
          response: candidateResponse,
          mode,
        }),
      });
      
      if (!response.ok) throw new Error('Erreur lors de l\'évaluation de la réponse');
      return await response.json();
    } catch (error) {
      console.error('Erreur lors de l\'évaluation de la réponse:', error);
      throw error;
    }
  }
  
  /**
   * Méthode de développement pour simuler des délais et des réponses
   * @param {string} type Type de simulation ('evaluation', 'suggestions', 'chat')
   * @param {number} delay Délai de simulation en millisecondes
   * @returns {Promise<any>} Données simulées
   */
  async simulateAIResponse(type: string, delay: number = 1000): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, delay));
    
    // Simuler différentes réponses selon le type
    switch (type) {
      case 'evaluation':
        return {
          score: (Math.random() * 3 + 7).toFixed(1), // Score entre 7 et 10
          feedback: "La réponse est claire et bien structurée. Le candidat a démontré une bonne compréhension des concepts techniques et a fourni des exemples pertinents.",
          strengths: [
            "Excellente compréhension des principes fondamentaux",
            "Bonne articulation des idées",
            "Exemples concrets tirés de l'expérience personnelle"
          ],
          areas_for_improvement: [
            "Pourrait développer davantage sur les méthodologies alternatives",
            "Manque de détails sur les aspects de performance"
          ]
        };
        
      case 'suggestions':
        return [
          {
            id: `sugg-${Date.now()}-1`,
            question: "Pouvez-vous me parler d'une situation où vous avez dû résoudre un conflit technique dans votre équipe ?",
            type: "behavioral"
          },
          {
            id: `sugg-${Date.now()}-2`,
            question: "Comment abordez-vous l'optimisation des performances dans vos applications ?",
            type: "technical"
          },
          {
            id: `sugg-${Date.now()}-3`,
            question: "Quels sont les défis que vous avez rencontrés lors de l'implémentation de systèmes distribués ?",
            type: "problem_solving"
          }
        ];
        
      case 'chat':
        return {
          response: "D'après l'analyse des réponses jusqu'à présent, le candidat montre une bonne maîtrise technique mais pourrait approfondir ses connaissances sur les architectures modernes. Je suggère d'explorer davantage son expérience avec les microservices dans la prochaine question.",
          suggestions: [
            "Demandez-lui de décrire un projet où il a utilisé une architecture de microservices",
            "Explorez sa compréhension des compromis entre monolithes et microservices"
          ]
        };
        
      default:
        return {};
    }
  }
}

// Exporter une instance unique du service
export default new AIAssistantService();