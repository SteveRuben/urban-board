// services/ai-interview-service.js
import axios from 'axios';

class AIInterviewService {
  constructor() {
    this.baseURL = '/api/ai';
  }

  // Générer des questions adaptées au profil de poste
  async generateQuestions(jobRole, experienceLevel, numberOfQuestions = 5, specialization = null) {
    try {
      // En environnement de développement, simuler une réponse
      if (process.env.NODE_ENV === 'development') {
        await new Promise(resolve => setTimeout(resolve, 1200));
        
        return Array(numberOfQuestions).fill(0).map((_, i) => ({
          id: `q-${i}`,
          question: `Question ${i+1} pour le poste de ${jobRole} (niveau ${experienceLevel})`,
          difficulty: ['facile', 'moyenne', 'difficile'][Math.floor(Math.random() * 3)],
          category: ['technique', 'comportemental', 'situationnel'][Math.floor(Math.random() * 3)]
        }));
      }
      
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
      // En environnement de développement, simuler une réponse
      if (process.env.NODE_ENV === 'development') {
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        return {
          score: 3 + Math.random() * 2, // Score entre 3 et 5
          feedback: [
            'Bonne compréhension des concepts fondamentaux.',
            'Explication claire et structurée.',
            'Pourrait approfondir davantage certains aspects techniques.',
          ],
          strengths: [
            'Connaissance technique solide',
            'Communication claire',
          ],
          areas_for_improvement: [
            'Approfondir les explications sur les aspects de performance',
            'Fournir plus d\'exemples concrets',
          ],
          keywords_used: ['React', 'performance', 'architecture', 'composants'],
          overall_comment: 'Réponse satisfaisante qui démontre une bonne maîtrise du sujet. Des exemples plus concrets auraient renforcé la réponse.'
        };
      }
      
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
      // En environnement de développement, simuler une réponse
      if (process.env.NODE_ENV === 'development') {
        await new Promise(resolve => setTimeout(resolve, 300));
        
        return {
          confidence: Math.random() * 0.4 + 0.6, // Entre 0.6 et 1.0
          engagement: Math.random() * 0.5 + 0.5, // Entre 0.5 et 1.0
          emotions: {
            joy: Math.random() * 0.7,
            sorrow: Math.random() * 0.3,
            anger: Math.random() * 0.2,
            surprise: Math.random() * 0.4,
            neutral: Math.random() * 0.6
          },
          posture: {
            attentive: Math.random() > 0.3,
            eye_contact: Math.random() > 0.2,
            fidgeting: Math.random() < 0.3
          }
        };
      }
      
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
      // En environnement de développement, simuler une réponse
      if (process.env.NODE_ENV === 'development') {
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        return {
          overall_score: Math.round(Math.random() * 3 + 7), // Score entre 7 et 10
          strengths: [
            'Excellente connaissance technique',
            'Communication claire et précise',
            'Capacité à présenter des exemples concrets'
          ],
          areas_for_improvement: [
            'Pourrait développer davantage les réponses aux questions situationnelles',
            'Quelques hésitations sur les questions techniques avancées'
          ],
          technical_evaluation: {
            score: Math.round(Math.random() * 2 + 7), // Score entre 7 et 9
            comments: 'Bonne maîtrise des technologies requises pour le poste'
          },
          behavioral_evaluation: {
            score: Math.round(Math.random() * 2 + 8), // Score entre 8 et 10
            comments: 'Excellentes aptitudes en communication et travail d\'équipe'
          },
          recommendation: Math.random() > 0.3 ? 'Recommandé pour le poste' : 'Potentiellement adapté au poste, mais nécessite un entretien supplémentaire'
        };
      }
      
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
      // En environnement de développement, simuler une réponse
      if (process.env.NODE_ENV === 'development') {
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        return `Dans mon expérience, j'ai travaillé sur plusieurs projets utilisant React et TypeScript. 
        J'ai notamment mis en place des architectures front-end robustes avec Redux pour la gestion d'état 
        et j'ai développé des composants réutilisables pour améliorer la maintenabilité du code. 
        Pour la gestion des performances, j'ai implémenté la mémorisation des composants avec React.memo 
        et utilisé des hooks personnalisés pour optimiser les rendus.`;
      }
      
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
      // En environnement de développement, simuler une réponse
      if (process.env.NODE_ENV === 'development') {
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Générer des questions simulées
        return Array(numberOfQuestions).fill(0).map((_, i) => ({
          question: `Question personnalisée ${i+1} basée sur le CV et la description du poste`,
          difficulty: ['facile', 'moyenne', 'difficile'][Math.floor(Math.random() * 3)],
          category: ['technique', 'comportemental', 'situationnel'][Math.floor(Math.random() * 3)],
          reasoning: `Cette question a été générée pour évaluer l'adéquation du candidat avec le poste`
        }));
      }
      
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
      // En environnement de développement, simuler une réponse
      if (process.env.NODE_ENV === 'development') {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        return `JEAN DUPONT
        Développeur Full Stack
        
        EXPÉRIENCE
        2018-2023 : Développeur Senior - TechCorp
        - Développement d'applications Web avec React et Node.js
        - Mise en place d'architectures microservices
        
        2015-2018 : Développeur Frontend - WebSolutions
        - Création d'interfaces utilisateur réactives
        - Optimisation des performances web
        
        FORMATION
        Master en Informatique - Université de Paris (2015)
        Licence en Informatique - Université de Lyon (2013)
        
        COMPÉTENCES
        • JavaScript, TypeScript, React, Angular, Vue.js
        • Node.js, Express, MongoDB, PostgreSQL
        • Git, Docker, CI/CD, AWS`;
      }
      
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
      // En environnement de développement, simuler une réponse
      if (process.env.NODE_ENV === 'development') {
        await new Promise(resolve => setTimeout(resolve, 2500));
        
        const questions = [
          {
            question: "D'après votre expérience chez TechCorp, comment avez-vous abordé l'architecture des applications React à grande échelle?",
            difficulty: "difficile",
            category: "technique",
            reasoning: "Le CV mentionne une expérience avec React et cette question permet d'évaluer la profondeur de ses connaissances."
          },
          {
            question: "Pouvez-vous décrire un défi technique que vous avez rencontré lors de la mise en place d'architectures microservices et comment vous l'avez résolu?",
            difficulty: "difficile",
            category: "technique",
            reasoning: "Le candidat mentionne des architectures microservices, et cette question révèle sa capacité à résoudre des problèmes complexes."
          },
          {
            question: "Quelles pratiques d'optimisation avez-vous mises en œuvre pour améliorer les performances des applications web chez WebSolutions?",
            difficulty: "moyenne",
            category: "technique",
            reasoning: "Le CV mentionne l'optimisation des performances web, cette question permet d'explorer ses connaissances pratiques."
          },
          {
            question: "Comment gérez-vous la collaboration entre les équipes frontend et backend dans un projet de développement full stack?",
            difficulty: "moyenne",
            category: "comportemental",
            reasoning: "En tant que développeur full stack, cette question évalue ses compétences en communication et coordination d'équipe."
          },
          {
            question: "Décrivez comment vous aborderiez l'implémentation d'une nouvelle fonctionnalité majeure dans notre application, de la conception à la mise en production.",
            difficulty: "moyenne",
            category: "situationnel",
            reasoning: "Cette question évalue la méthodologie de travail et l'approche du développement de bout en bout."
          }
        ];
        
        // Ne retourner que le nombre de questions demandé
        return questions.slice(0, options.numberOfQuestions || 5);
      }
      
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
      // En environnement de développement, simuler une réponse
      if (process.env.NODE_ENV === 'development') {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        return {
          question: `Pourriez-vous développer davantage votre réponse sur ${candidateResponse.split(' ').slice(0, 3).join(' ')}...?`,
          reason: reason,
          suggestion: "Demander plus de détails sur l'implémentation technique"
        };
      }
      
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
      // En environnement de développement, simuler une réponse
      if (process.env.NODE_ENV === 'development') {
        await new Promise(resolve => setTimeout(resolve, 800));
        
        return {
          clarity_score: Math.random() * 5,
          completeness_score: Math.random() * 5,
          needs_follow_up: Math.random() > 0.7,
          follow_up_reason: 'incomplete',
          recommendation: 'Demander plus de détails sur l\'expérience concrète'
        };
      }
      
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

  /**
   * Analyse un CV pour extraire des informations structurées
   * 
   * @param {File} cvFile Fichier CV à analyser
   * @returns {Promise<Object>} Résultat de l'analyse du CV
   */
  async analyzeCV(cvFile) {
    try {
      // En environnement de développement, simuler une réponse
      if (process.env.NODE_ENV === 'development') {
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        return {
          skills: [
            'JavaScript', 'TypeScript', 'React', 'Angular', 'Vue.js', 
            'Node.js', 'Express', 'MongoDB', 'PostgreSQL',
            'Git', 'Docker', 'CI/CD', 'AWS'
          ],
          experience_years: 8,
          education: 'Master en Informatique - Université de Paris',
          last_position: 'Développeur Senior - TechCorp',
          languages: ['Français', 'Anglais'],
          industry_experience: ['Web Development', 'E-commerce'],
          contact_info: {
            name: 'Jean Dupont',
            email: 'jean.dupont@example.com',
            phone: '+33 6 12 34 56 78',
          },
          metadata: {
            filename: cvFile.name,
            file_size: cvFile.size,
            analysis_date: new Date().toISOString()
          },
          recommended_questions: [
            {
              question: "Pouvez-vous décrire votre expérience avec les architectures microservices mentionnées dans votre CV?",
              reasoning: "Le candidat a mentionné une expérience avec les microservices, cette question permet d'approfondir sa connaissance pratique."
            },
            {
              question: "Quelles stratégies d'optimisation avez-vous employées pour améliorer les performances des applications web?",
              reasoning: "Le CV mentionne l'optimisation des performances, cette question permet d'explorer ses connaissances techniques."
            },
            {
              question: "Comment avez-vous géré la transition entre les différentes versions de React dans vos projets?",
              reasoning: "Le candidat a une expérience significative avec React, cette question teste sa capacité à gérer les changements technologiques."
            }
          ]
        };
      }
      
      const formData = new FormData();
      formData.append('cv_file', cvFile);
      
      const response = await axios.post(`${this.baseURL}/analyze-cv`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Erreur lors de l\'analyse du CV:', error);
      throw error;
    }
  }
}

export default new AIInterviewService();