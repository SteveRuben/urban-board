import { CandidateExerciseData, CandidateProgress } from "@/types/candidate-exercise";
import { UserExerciseSession } from "@/types/interview-scheduling";
import axios from "axios";

export class CandidateExerciseService {
    private static readonly BASE_URL = '/candidate';
  
    /**
     * Récupère les exercices assignés à un candidat
     */
    static async getCandidateExercises(accessToken: string): Promise<CandidateExerciseData> {
      try {
        // console.log("CandidateExerciseService: Récupération des exercices candidat", { accessToken });
  
        const response = await axios.get(`/api${this.BASE_URL}/coding/${accessToken}`);
  
        // console.log("CandidateExerciseService: Exercices candidat reçus", response.status);
        return response.data.data;
      } catch (error: any) {
        console.error('Erreur lors de la récupération des exercices candidat:', error);
        
        if (error.response?.status === 404) {
          throw new Error('Session d\'exercices non trouvée ou expirée');
        }
        if (error.response?.status === 403) {
          throw new Error('Accès non autorisé ou session expirée');
        }
        throw new Error('Une erreur est survenue lors de l\'accès aux exercices');
      }
    }
  
    /**
     * Démarre la session d'exercices
     */
    static async startCandidateSession(accessToken: string): Promise<UserExerciseSession> {
      try {
        console.log("CandidateExerciseService: Démarrage de session", { accessToken });
  
        const response = await axios.post(`/api${this.BASE_URL}/coding/${accessToken}/start`);
  
        console.log("CandidateExerciseService: Session démarrée", response.status);
        return response.data.data;
      } catch (error: any) {
        console.error('Erreur lors du démarrage de session:', error);
        throw new Error(error.response?.data?.message || 'Erreur lors du démarrage de la session');
      }
    }
  
    /**
     * Récupère les challenges d'un exercice
     */
    static async getExerciseChallenges(accessToken: string, exerciseId: string): Promise<any[]> {
      try {
  
        const response = await axios.get(`/api${this.BASE_URL}/coding/${accessToken}/exercises/${exerciseId}/challenges`);
  
        return response.data.data;
      } catch (error: any) {
        console.error('Erreur lors de la récupération des challenges:', error);
        throw new Error('Erreur lors de la récupération des challenges');
      }
    }
  
    /**
     * Récupère un challenge spécifique
     */
    static async getChallenge(accessToken: string, challengeId: string): Promise<any> {
      try {
        console.log("CandidateExerciseService: Récupération du challenge", { accessToken, challengeId });
  
        const response = await axios.get(`/api${this.BASE_URL}/coding/${accessToken}/challenges/${challengeId}`);
  
        console.log("CandidateExerciseService: Challenge reçu", response.data.data);
        return response.data.data;
      } catch (error: any) {
        console.error('Erreur lors de la récupération du challenge:', error);
        throw new Error('Erreur lors de la récupération du challenge');
      }
    }
  
    /**
     * Démarre un challenge
     */
    static async startChallenge(accessToken: string, challengeId: string): Promise<any> {
      try {
        console.log("CandidateExerciseService: Démarrage du challenge", { accessToken, challengeId });
  
        const response = await axios.post(`/api${this.BASE_URL}/coding/${accessToken}/challenges/${challengeId}/start`);
  
        console.log("CandidateExerciseService: Challenge démarré", response.status);
        return response.data.data;
      } catch (error: any) {
        console.error('Erreur lors du démarrage du challenge:', error);
        throw new Error('Erreur lors du démarrage du challenge');
      }
    }

    static async startChallenge1(accessToken: string, challengeId: string) {
      try {
        console.log("CandidateExerciseService: Démarrage du challenge", { accessToken, challengeId });
  
        const response = await axios.post(`/api${this.BASE_URL}/coding/${accessToken}/challenges/${challengeId}/start`);
  
        console.log("CandidateExerciseService: Challenge démarré", response.status);
        return response.data.data;
      } catch (error: any) {
        console.error('Erreur lors du démarrage du challenge:', error);
        throw new Error('Erreur lors du démarrage du challenge');
      }
    }
    
    static async loadProgress(accessToken: string, challengeId: string, stepId: string) {
      const response = await axios.get(`/api${this.BASE_URL}/coding/${accessToken}/challenges/${challengeId}/steps/${stepId}/load`);
    
      if (response.status !== 200) {
        const errorData = await response.data();
        throw new Error(errorData.message || 'Erreur lors du chargement du progrès');
      }
    
      const data = await response.data;
      return data.data;
    }

    /**
     * Récupère une étape de challenge
     */
    static async getChallengeStep(accessToken: string, challengeId: number, stepId: number): Promise<any> {
      try {
        const response = await axios.get(`/api${this.BASE_URL}/coding/${accessToken}/challenges/${challengeId}/steps/${stepId}`);
        return response.data.data;
      } catch (error: any) {
        console.error('Erreur lors de la récupération de l\'étape:', error);
        throw new Error('Erreur lors de la récupération de l\'étape');
      }
    }
  
    /**
     * Soumet du code pour évaluation
     */
    static async submitCode(accessToken: string, challengeId: string, stepId: string, code: string, language: string): Promise<any> {
      try {
        console.log('🔍 DEBUG: submitCode appelé avec:', {
          accessToken: accessToken ? accessToken.substring(0, 10) + '...' : 'undefined',
          challengeId,
          stepId,
          language,
          codeLength: code.length
        });
    
        const response = await axios.post(
          `/api/coding/${accessToken}/challenges/${challengeId}/steps/${stepId}/submit`,
          {
            code,
            language
          },
          // {
          //   headers: {
          //     'Content-Type': 'application/json',
          //     'X-Anonymous-ID': accessToken  
          //   }
          // }
        );
    
        console.log('🔍 DEBUG: Réponse submitCode:', response.data);
        return response.data; // ✅ CORRECTION: Retourner response.data directement, pas response.data.data
      } catch (error: any) {
        console.error('❌ Erreur lors de la soumission du code:', error);
        
        // Meilleure gestion des erreurs
        if (error.response) {
          console.error('❌ Détails de l\'erreur:', error.response.data);
          throw new Error(error.response.data.error || 'Erreur lors de la soumission du code');
        } else if (error.request) {
          throw new Error('Aucune réponse du serveur');
        } else {
          throw new Error('Erreur de configuration de la requête');
        }
      }
    }
    
  
    /**
     * Teste du code
     */
    static async testCode(accessToken: string, challengeId: string, stepId: string, code: string, language: string): Promise<any> {
      try {
        const response = await axios.post(`/api${this.BASE_URL}/coding/${accessToken}/challenges/${challengeId}/steps/${stepId}/test`, {
          code,
          language
        });
        return response.data.data;
      } catch (error: any) {
        console.error('Erreur lors du test du code:', error);
        throw new Error('Erreur lors du test du code');
      }
    }
  
    /**
     * Sauvegarde le progrès
     */
    static async saveProgress(accessToken: string, challengeId: string, stepId: string, code: string, language: string): Promise<any> {
      try {
        const response = await axios.post(`/api${this.BASE_URL}/coding/${accessToken}/challenges/${challengeId}/steps/${stepId}/save`, {
          code,
          language
        });
        return response.data.data;
      } catch (error: any) {
        console.error('Erreur lors de la sauvegarde:', error);
        throw new Error('Erreur lors de la sauvegarde');
      }
    }
  
    /**
     * Récupère le progrès global
     */
    static async getProgress(accessToken: string): Promise<CandidateProgress> {
      try {
        const response = await axios.get(`/api${this.BASE_URL}/coding/${accessToken}/progress`);
        return response.data.data;
      } catch (error: any) {
        console.error('Erreur lors de la récupération du progrès:', error);
        throw new Error('Erreur lors de la récupération du progrès');
      }
    }
  
    /**
     * Termine la session
     */
    static async completeSession(accessToken: string): Promise<UserExerciseSession> {
      try {
        const response = await axios.post(`/api${this.BASE_URL}/coding/${accessToken}/complete`);
        return response.data.data;
      } catch (error: any) {
        console.error('Erreur lors de la completion de session:', error);
        throw new Error('Erreur lors de la completion de session');
      }
    }
  
    /**
     * Vérifie si un token d'accès est valide
     */
    static async validateToken(accessToken: string): Promise<boolean> {
      try {
        await this.getCandidateExercises(accessToken);
        return true;
      } catch {
        return false;
      }
    }
  
    /**
     * Formate le temps restant en format lisible
     */
    static formatTimeRemaining(minutes: number): string {
      if (minutes <= 0) return 'Expiré';
      
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      
      if (hours > 0) {
        return `${hours}h ${remainingMinutes}min`;
      }
      return `${remainingMinutes}min`;
    }
  
    /**
     * Calcule le statut d'une session basé sur les temps
     */
    static getSessionStatus(session: UserExerciseSession, timeRemaining: number): {
      status: 'available' | 'active' | 'expired' | 'completed';
      message: string;
      canStart: boolean;
    } {
      if (session.status === 'completed') {
        return {
          status: 'completed',
          message: 'Session terminée',
          canStart: false
        };
      }
      
      if (timeRemaining <= 0) {
        return {
          status: 'expired',
          message: 'Session expirée',
          canStart: false
        };
      }
      
      if (session.status === 'in_progress') {
        return {
          status: 'active',
          message: 'Session en cours',
          canStart: true
        };
      }
      
      return {
        status: 'available',
        message: 'Prêt à commencer',
        canStart: true
      };
    }
  }
  
  export default CandidateExerciseService;