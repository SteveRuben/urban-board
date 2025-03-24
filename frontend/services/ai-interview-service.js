// 1. Service d'IA pour l'entretien - frontend/services/ai-interview-service.js
import axios from 'axios';

class AIInterviewService {
  constructor() {
    this.baseURL = '/api/ai';
  }

  // Générer des questions adaptées au profil de poste
  async generateQuestions(jobRole, experienceLevel, numberOfQuestions = 5, specialization = null) {
    try {
      const response = await axios.post(`${this.baseURL}/generate-questions`, {
        job_role: jobRole,
        experience_level: experienceLevel,
        number_of_questions: numberOfQuestions,
        specialization: specialization
      });
      return response.data.questions;
    } catch (error) {
      console.error('Erreur lors de la génération des questions:', error);
      throw error;
    }
  }

  // Évaluer la réponse d'un candidat à une question
  async evaluateResponse(question, response, jobRole, experienceLevel) {
    try {
      const result = await axios.post(`${this.baseURL}/evaluate-response`, {
        question: question,
        response: response,
        job_role: jobRole,
        experience_level: experienceLevel
      });
      return result.data.evaluation;
    } catch (error) {
      console.error('Erreur lors de l\'évaluation de la réponse:', error);
      throw error;
    }
  }

  // Analyser les expressions faciales et le langage corporel
  async analyzeBiometrics(imageData) {
    try {
      const result = await axios.post(`${this.baseURL}/analyze-biometrics`, {
        image_data: imageData
      });
      return result.data.analysis;
    } catch (error) {
      console.error('Erreur lors de l\'analyse biométrique:', error);
      throw error;
    }
  }

  // Générer un résumé d'entretien complet
  async generateInterviewSummary(interviewData) {
    try {
      const result = await axios.post(`${this.baseURL}/generate-summary`, {
        interview_data: interviewData
      });
      return result.data.summary;
    } catch (error) {
      console.error('Erreur lors de la génération du résumé:', error);
      throw error;
    }
  }

  // Transcrire l'audio en texte
  async transcribeAudio(audioBlob) {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob);
      
      const result = await axios.post(`${this.baseURL}/transcribe`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return result.data.transcript;
    } catch (error) {
      console.error('Erreur lors de la transcription audio:', error);
      throw error;
    }
  }

  /**
 * Génère des questions personnalisées basées sur le CV et la description du poste
 * 
 * @param {Object} params Paramètres de génération
 * @param {string} params.jobDescription Description complète du poste
 * @param {string} params.cvText Texte du CV du candidat
 * @param {number} params.numberOfQuestions Nombre de questions à générer (défaut: 5)
 * @param {string} params.experienceLevel Niveau d'expérience attendu (optionnel)
 * @returns {Promise<Array>} Liste de questions d'entretien personnalisées
 */
async generateQuestionsFromCV({
    jobDescription,
    cvText,
    numberOfQuestions = 5,
    experienceLevel = null
  }) {
    try {
      const response = await axios.post(`${this.baseURL}/generate-questions-from-cv`, {
        job_description: jobDescription,
        cv_text: cvText,
        number_of_questions: numberOfQuestions,
        experience_level: experienceLevel
      });
      return response.data.questions;
    } catch (error) {
      console.error('Erreur lors de la génération des questions à partir du CV:', error);
      throw error;
    }
  }
  
  /**
   * Extrait le texte d'un CV au format PDF
   * 
   * @param {File} cvFile Fichier CV au format PDF
   * @returns {Promise<string>} Texte extrait du CV
   */
  async extractCVText(cvFile) {
    try {
      const formData = new FormData();
      formData.append('cv_file', cvFile);
      
      const result = await axios.post(`${this.baseURL}/extract-cv-text`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return result.data.cv_text;
    } catch (error) {
      console.error('Erreur lors de l\'extraction du texte du CV:', error);
      throw error;
    }
  }
  
  /**
   * Charge et analyse un CV puis génère des questions basées sur celui-ci et la description du poste
   * 
   * @param {File} cvFile Fichier CV au format PDF
   * @param {string} jobDescription Description du poste
   * @param {Object} options Options supplémentaires
   * @returns {Promise<Array>} Liste de questions d'entretien personnalisées
   */
  async generateQuestionsFromCVFile(cvFile, jobDescription, options = {}) {
    try {
      // Extraire le texte du CV
      const cvText = await this.extractCVText(cvFile);
      
      // Générer les questions
      return await this.generateQuestionsFromCV({
        jobDescription,
        cvText,
        numberOfQuestions: options.numberOfQuestions,
        experienceLevel: options.experienceLevel
      });
    } catch (error) {
      console.error('Erreur lors de la génération des questions à partir du fichier CV:', error);
      throw error;
    }
  }

  /**
 * Génère une question de suivi basée sur la réponse du candidat
 * 
 * @param {Object} params Paramètres pour la question de suivi
 * @param {string} params.originalQuestion Question initiale posée
 * @param {string} params.candidateResponse Réponse fournie par le candidat
 * @param {string} params.reason Raison de la question de suivi ('unclear', 'incomplete', 'timeout')
 * @param {number} params.timeoutDuration Durée du timeout en secondes (si applicable)
 * @returns {Promise<Object>} Question de suivi et informations associées
 */
async generateFollowUpQuestion({
  originalQuestion,
  candidateResponse,
  reason = 'unclear',
  timeoutDuration = null
}) {
  try {
    const response = await axios.post(`${this.baseURL}/generate-follow-up`, {
      original_question: originalQuestion,
      candidate_response: candidateResponse,
      reason: reason,
      timeout_duration: timeoutDuration
    });
    
    return response.data.follow_up;
  } catch (error) {
    console.error('Erreur lors de la génération de la question de suivi:', error);
    throw error;
  }
}

/**
 * Analyse la clarté et la complétude d'une réponse
 * 
 * @param {string} question Question posée
 * @param {string} response Réponse du candidat
 * @returns {Promise<Object>} Analyse de la clarté avec score et recommandation
 */
async analyzeResponseClarity(question, response) {
  try {
    const result = await axios.post(`${this.baseURL}/analyze-clarity`, {
      question: question,
      response: response
    });
    
    return result.data.analysis;
  } catch (error) {
    console.error('Erreur lors de l\'analyse de la clarté:', error);
    throw error;
  }
}

}

export default new AIInterviewService();