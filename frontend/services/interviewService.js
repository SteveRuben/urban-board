// frontend/services/interviewService.js
import axios from 'axios';

/**
 * Service pour la gestion des entretiens, y compris les modes autonome et collaboratif
 */
class InterviewService {
  /**
   * Crée un nouvel entretien
   * @param {Object} interviewData Données de l'entretien (job_role, candidate_name, etc.)
   * @returns {Promise<Object>} Entretien créé
   */
  async createInterview(interviewData) {
    try {
      const response = await axios.post('/api/interviews', interviewData);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la création de l\'entretien:', error);
      throw error;
    }
  }

  /**
   * Récupère les détails d'un entretien
   * @param {string} interviewId ID de l'entretien
   * @returns {Promise<Object>} Détails de l'entretien
   */
  async getInterviewDetails(interviewId) {
    try {
      const response = await axios.get(`/api/interviews/${interviewId}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des détails de l\'entretien:', error);
      throw error;
    }
  }

  /**
   * Récupère les questions pour un entretien
   * @param {string} interviewId ID de l'entretien
   * @param {Object} params Paramètres additionnels (job_role, experience_level)
   * @returns {Promise<Array>} Questions d'entretien
   */
  async getInterviewQuestions(interviewId, params = {}) {
    try {
      const response = await axios.get(`/api/interviews/${interviewId}/questions`, { params });
      return response.data.questions;
    } catch (error) {
      console.error('Erreur lors de la récupération des questions:', error);
      throw error;
    }
  }

  /**
   * Évalue une réponse à une question d'entretien
   * @param {string} interviewId ID de l'entretien
   * @param {Object} data Données de la réponse (question, response)
   * @param {string} mode Mode d'entretien ('autonomous' ou 'collaborative')
   * @returns {Promise<Object>} Évaluation de la réponse
   */
  async evaluateResponse(interviewId, data, mode = 'autonomous') {
    try {
      const response = await axios.post(`/api/interviews/${interviewId}/evaluate`, {
        ...data,
        mode
      });
      return response.data.evaluation;
    } catch (error) {
      console.error('Erreur lors de l\'évaluation de la réponse:', error);
      throw error;
    }
  }

  /**
   * Termine un entretien et déclenche les notifications
   * @param {string} interviewId ID de l'entretien
   * @param {Object} data Données finales de l'entretien (score, etc.)
   * @returns {Promise<Object>} Entretien mis à jour
   */
  async completeInterview(interviewId, data) {
    try {
      const response = await axios.post(`/api/interviews/${interviewId}/complete`, data);
      return response.data.interview;
    } catch (error) {
      console.error('Erreur lors de la complétion de l\'entretien:', error);
      throw error;
    }
  }

  /**
   * Met à jour le statut d'un entretien
   * @param {string} interviewId ID de l'entretien
   * @param {string} status Nouveau statut
   * @param {Object} additionalData Données additionnelles à mettre à jour
   * @returns {Promise<Object>} Entretien mis à jour
   */
  async updateInterviewStatus(interviewId, status, additionalData = {}) {
    try {
      const response = await axios.put(`/api/interviews/${interviewId}`, {
        status,
        ...additionalData
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut de l\'entretien:', error);
      throw error;
    }
  }

  /**
   * Récupère les entretiens d'un utilisateur
   * @param {Object} filters Filtres optionnels (status, date, etc.)
   * @returns {Promise<Array>} Liste d'entretiens
   */
  async getUserInterviews(filters = {}) {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get('/api/interviews', {
        params: filters,
        headers: {
         'Content-Type': 'application/json',
         'Authorization': token ? `Bearer ${token}` : ''
       }
     });
     return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des entretiens:', error);
      throw error;
    }
  }

  /**
   * Récupère les entretiens partagés avec l'utilisateur
   * @returns {Promise<Array>} Liste d'entretiens partagés
   */
  async getSharedInterviews() {
    try {
      const response = await axios.get('/api/shared-interviews');
      return response.data.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des entretiens partagés:', error);
      throw error;
    }
  }

  /**
   * Partage un entretien avec un autre utilisateur
   * @param {string} interviewId ID de l'entretien
   * @param {string} email Email de l'utilisateur avec qui partager
   * @param {string} permissionLevel Niveau de permission ('viewer', 'editor')
   * @param {number} expiresDays Nombre de jours avant expiration (optionnel)
   * @returns {Promise<Object>} Informations sur le partage
   */
  async shareInterview(interviewId, email, permissionLevel = 'viewer', expiresDays = null) {
    try {
      const response = await axios.post(`/api/interviews/${interviewId}/share`, {
        email,
        permission_level: permissionLevel,
        expires_days: expiresDays
      });
      return response.data.data;
    } catch (error) {
      console.error('Erreur lors du partage de l\'entretien:', error);
      throw error;
    }
  }

  /**
   * Récupère les commentaires d'un entretien
   * @param {string} interviewId ID de l'entretien
   * @returns {Promise<Array>} Liste de commentaires
   */
  async getInterviewComments(interviewId) {
    try {
      const response = await axios.get(`/api/interviews/${interviewId}/comments`);
      return response.data.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des commentaires:', error);
      throw error;
    }
  }

  /**
   * Ajoute un commentaire à un entretien
   * @param {string} interviewId ID de l'entretien
   * @param {string} content Contenu du commentaire
   * @param {number} timestamp Horodatage optionnel (en secondes)
   * @returns {Promise<Object>} Commentaire créé
   */
  async addInterviewComment(interviewId, content, timestamp = null) {
    try {
      const response = await axios.post(`/api/interviews/${interviewId}/comments`, {
        content,
        timestamp
      });
      return response.data.data;
    } catch (error) {
      console.error('Erreur lors de l\'ajout du commentaire:', error);
      throw error;
    }
  }

  /**
   * Obtient le résumé biométrique d'un entretien
   * @param {string} interviewId ID de l'entretien
   * @returns {Promise<Object>} Résumé biométrique
   */
  async getBiometricSummary(interviewId) {
    try {
      const response = await axios.get(`/api/interviews/${interviewId}/biometric-summary`);
      return response.data.data;
    } catch (error) {
      console.error('Erreur lors de la récupération du résumé biométrique:', error);
      throw error;
    }
  }

  /**
   * Enregistre une analyse faciale
   * @param {string} interviewId ID de l'entretien
   * @param {number} timestamp Horodatage
   * @param {Object} emotions Émotions détectées
   * @returns {Promise<Object>} Analyse enregistrée
   */
  async saveFacialAnalysis(interviewId, timestamp, emotions) {
    try {
      const response = await axios.post(`/api/interviews/${interviewId}/facial-analysis`, {
        timestamp,
        emotions
      });
      return response.data.data;
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement de l\'analyse faciale:', error);
      throw error;
    }
  }

  /**
   * Envoie un lot d'analyses faciales (plus efficace pour des analyses fréquentes)
   * @param {string} interviewId ID de l'entretien
   * @param {Array} analyses Tableau d'analyses faciales
   * @returns {Promise<Object>} Résultat de l'opération
   */
  async batchSaveFacialAnalyses(interviewId, analyses) {
    try {
      const response = await axios.post(`/api/interviews/${interviewId}/facial-analysis/batch`, analyses);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement des analyses faciales:', error);
      throw error;
    }
  }

  /* Méthodes pour les modes d'entretien spécifiques */

  /**
   * Obtient des suggestions de questions pour le mode collaboratif
   * @param {string} interviewId ID de l'entretien
   * @param {string} context Contexte actuel (ex: "technical", "behavioral")
   * @param {number} count Nombre de questions à suggérer
   * @returns {Promise<Array>} Questions suggérées
   */
  async getSuggestedQuestions(interviewId, context, count = 3) {
    try {
      // Utiliser le service d'assistant IA pour obtenir des suggestions
      const response = await axios.post(`/api/interviews/${interviewId}/suggested-questions`, {
        context,
        count
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la génération des questions suggérées:', error);
      throw error;
    }
  }

  /**
   * Obtient une réponse de l'assistant IA en mode de chat collaboratif
   * @param {string} interviewId ID de l'entretien
   * @param {string} message Message du recruteur
   * @param {Array} history Historique de la conversation
   * @returns {Promise<Object>} Réponse de l'assistant
   */
  async getChatResponse(interviewId, message, history = []) {
    try {
      const response = await axios.post(`/api/interviews/${interviewId}/ai-chat`, {
        message,
        history
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la communication avec l\'assistant IA:', error);
      throw error;
    }
  }
  
  /**
   * Pour l'environnement de développement, simule des réponses IA
   * @param {string} type Type de simulation ('evaluation', 'suggestions', 'chat')
   * @returns {Promise<Object>} Données simulées
   */
  async simulateAIResponse(type) {
    // Délai aléatoire entre 500ms et 2000ms pour simuler la latence
    const delay = Math.floor(Math.random() * 1500) + 500;
    await new Promise(resolve => setTimeout(resolve, delay));
    
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
export default new InterviewService();