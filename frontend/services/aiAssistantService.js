// frontend/services/aiAssistantService.js
/**
 * Service pour gérer les assistants IA et leur intégration dans les entretiens
 */
class AIAssistantService {

  /**
   * Récupère tous les assistants IA de l'utilisateur
   * @returns {Promise<Array>} Liste des assistants
   */
  async getAllAssistants() {
    try {
      const response = await axios.get(API_URL);
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Récupère un assistant par son ID
   * @param {string} id - ID de l'assistant
   * @returns {Promise<Object>} Données de l'assistant
   */
  async getAssistantById(id) {
    try {
      const response = await axios.get(`${API_URL}/${id}`);
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Crée un nouvel assistant IA
   * @param {Object} assistantData - Données de l'assistant à créer
   * @returns {Promise<Object>} Assistant créé
   */
  async createAssistant(assistantData) {
    try {
      const response = await axios.post(API_URL, assistantData);
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Met à jour un assistant existant
   * @param {string} id - ID de l'assistant
   * @param {Object} assistantData - Nouvelles données de l'assistant
   * @returns {Promise<Object>} Assistant mis à jour
   */
  async updateAssistant(id, assistantData) {
    try {
      const response = await axios.put(`${API_URL}/${id}`, assistantData);
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
  async deleteAssistant(id) {
    try {
      await axios.delete(`${API_URL}/${id}`);
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Récupère les modèles d'assistants prédéfinis
   * @returns {Promise<Array>} Liste des modèles
   */
  async getAssistantTemplates() {
    try {
      const response = await axios.get(`${API_URL}/templates`);
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Clone un assistant existant ou un modèle
   * @param {string} id - ID de l'assistant ou du modèle à cloner
   * @param {Object} options - Options de clonage (nouveau nom, etc.)
   * @returns {Promise<Object>} Nouvel assistant cloné
   */
  async cloneAssistant(id, options = {}) {
    try {
      const response = await axios.post(`${API_URL}/${id}/clone`, options);
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
   * @returns {Promise<Object>} Métadonnées du document
   */
  async uploadDocument(assistantId, file, documentType) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('documentType', documentType);
      
      const response = await axios.post(
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
   * @returns {Promise<Array>} Liste des documents
   */
  async getAssistantDocuments(assistantId) {
    try {
      const response = await axios.get(`${API_URL}/${assistantId}/documents`);
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
  async deleteDocument(assistantId, documentId) {
    try {
      await axios.delete(`${API_URL}/${assistantId}/documents/${documentId}`);
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Test la réponse de l'assistant à une question
   * @param {string} assistantId - ID de l'assistant à tester
   * @param {Object} params - Paramètres du test (question, etc.)
   * @returns {Promise<Object>} Réponse de l'assistant
   */
  async testAssistant(assistantId, params) {
    try {
      const response = await axios.post(`${API_URL}/${assistantId}/test`, params);
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Récupère l'historique des conversations avec un assistant
   * @param {string} assistantId - ID de l'assistant
   * @param {Object} filters - Filtres optionnels (dates, etc.)
   * @returns {Promise<Array>} Historique des conversations
   */
  async getAssistantHistory(assistantId, filters = {}) {
    try {
      const response = await axios.get(`${API_URL}/${assistantId}/history`, { params: filters });
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Gère les erreurs API
   * @param {Error} error - Erreur à traiter
   * @private
   */
  handleError(error) {
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
      error.message = data.message || `Error ${status}: AI Assistant service request failed`;
    }
  }
  
    /**
     * Récupère les assistants IA disponibles pour l'utilisateur
     * @returns {Promise<Array>} Liste des assistants IA
     */
    async getUserAssistants() {
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
    async getAIContents(interviewId, filters = {}) {
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
    async requestAnalysis(teamId, interviewId, aiAssistantId, analysisType, parameters = {}) {
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
    async getSuggestedQuestions(interviewId, context, count = 3) {
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
    async getChatResponse(interviewId, message, history = []) {
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
     * @param {string} response Réponse du candidat
     * @param {string} mode Mode d'entretien ('autonomous' ou 'collaborative')
     * @returns {Promise<object>} Évaluation de la réponse
     */
    async evaluateResponse(interviewId, questionId, response, mode = 'autonomous') {
      try {
        const response = await fetch(`/api/interviews/${interviewId}/evaluate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            question_id: questionId,
            response,
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
     * Crée un nouvel assistant IA personnalisé
     * @param {object} assistantData Données de l'assistant à créer
     * @returns {Promise<object>} Assistant créé
     */
    async createAssistant(assistantData) {
      try {
        const response = await fetch('/api/ai-assistants', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(assistantData),
        });
        
        if (!response.ok) throw new Error('Erreur lors de la création de l\'assistant IA');
        return await response.json();
      } catch (error) {
        console.error('Erreur lors de la création de l\'assistant IA:', error);
        throw error;
      }
    }
    
    // Méthode de développement pour simuler des délais et des réponses
    async simulateAIResponse(type, delay = 1000) {
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