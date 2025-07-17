// services/coding-platform-service.ts - Service unifié complet basé sur ExtendedService

import { 
  AdminTestResponse, BulkTestCasesData, Challenge, ChallengeDifficulty, ChallengeFormData, 
  ChallengesResponse, ChallengeStatus, ChallengeStep, ChallengeStepFormData, CodeSubmissionData, 
  ExecutionResult, Exercise, ExerciseFormData, ExercisesResponse, ExerciseWithChallenges, 
  ExtendedSubmissionData, ProgrammingLanguage, StartChallengeData, StartChallengeResponse, 
  SubmissionResponse, TestCase, TestCaseFormData, UserChallengeStatus, UserProgress,
  ExerciseCategory, ExecutionEnvironment, TestcaseType, DatasetType, ExerciseDataset, 
  DatasetFormData, ChallengeContext, AvailableTypes, ExtendedExecutionResult, TestCaseData,
  BulkTestCasesResponse, DiagramType, DiagramFormat // NOUVEAU
} from '@/types/coding-plateform';
import { api } from './user-service';
import axios from 'axios';

// Session Management
class SessionManager {
  private static SESSION_TOKEN_KEY = 'coding_session_token';
  private static ANONYMOUS_ID_KEY = 'coding_anonymous_id';

  static getSessionToken(): string | null {
    return localStorage.getItem(this.SESSION_TOKEN_KEY);
  }

  static setSessionToken(token: string): void {
    localStorage.setItem(this.SESSION_TOKEN_KEY, token);
  }

  static removeSessionToken(): void {
    localStorage.removeItem(this.SESSION_TOKEN_KEY);
  }

  static getAnonymousId(): string | null {
    return localStorage.getItem(this.ANONYMOUS_ID_KEY);
  }

  static setAnonymousId(id: string): void {
    localStorage.setItem(this.ANONYMOUS_ID_KEY, id);
  }

  static removeAnonymousId(): void {
    localStorage.removeItem(this.ANONYMOUS_ID_KEY);
  }

  static generateAnonymousId(): string {
    const id = 'anon_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    this.setAnonymousId(id);
    return id;
  }

  static getSessionHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};
    
    const sessionToken = this.getSessionToken();
    if (sessionToken) {
      headers['X-Session-Token'] = sessionToken;
    }

    const anonymousId = this.getAnonymousId();
    if (anonymousId) {
      headers['X-Anonymous-ID'] = anonymousId;
    }

    return headers;
  }
}

// =============================================================================
// SERVICE UNIFIÉ COMPLET
// =============================================================================

export class CodingPlatformService {
  private static readonly BASE_URL = '/coding';

  // =============================================================================
  // ADMIN ROUTES - EXERCISE MANAGEMENT UNIFIÉ
  // =============================================================================

  /**
   * Récupère tous les exercices avec pagination et filtres (Admin) - Version unifiée
   */
  static async getExercises(params: {
    page?: number;
    per_page?: number;
    category?: ExerciseCategory; // NOUVEAU
    language?: ProgrammingLanguage;
    difficulty?: ChallengeDifficulty;
  }): Promise<ExercisesResponse> {
    try {
      const { page = 1, per_page = 20, category, language, difficulty } = params;
      
      console.log("CodingPlatformService: Récupération des exercices", {
        page, per_page, category, language, difficulty
      });

      const queryParams = new URLSearchParams();
      queryParams.append('page', page.toString());
      queryParams.append('per_page', per_page.toString());
      
      if (category) queryParams.append('category', category);
      if (language) queryParams.append('language', language);
      if (difficulty) queryParams.append('difficulty', difficulty);

      const response = await api.get(`${this.BASE_URL}/admin/exercises`, {
        params: Object.fromEntries(queryParams),
      });

      console.log("CodingPlatformService: Exercices récupérés", response.status);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des exercices:', error);
      throw new Error('Une erreur inattendue est survenue lors de la récupération des exercices');
    }
  }

  /**
   * Crée un nouvel exercice (Admin) - Version unifiée
   */
  static async createExercise(data: ExerciseFormData): Promise<Exercise> {
    try {
      console.log("CodingPlatformService: Création d'un exercice", {
        title: data.title,
        category: data.category,
        language: data.language,
        difficulty: data.difficulty
      });

      // Validation selon la catégorie
      this.validateExerciseData(data);

      const response = await api.post(`${this.BASE_URL}/admin/exercises`, data, {
        headers: { 'Content-Type': 'application/json' },
      });

      console.log("CodingPlatformService: Exercice créé", response.status);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la création de l\'exercice:', error);
      throw new Error('Une erreur inattendue est survenue lors de la création de l\'exercice');
    }
  }

  /**
   * Validation des données d'exercice selon la catégorie
   */
  private static validateExerciseData(data: ExerciseFormData): void {
    switch (data.category) {
      case 'developer':
        if (!data.language) {
          throw new Error('Language is required for developer exercises');
        }
        break;
      case 'data_analyst':
        if (!data.required_skills?.length) {
          throw new Error('Required skills are needed for data analyst exercises');
        }
        break;
      case 'business_analyst': // NOUVEAU
        if (!data.business_domain) {
          throw new Error('Business domain is required for business analyst exercises');
        }
        break;
    }
  }

  /**
   * Récupère un exercice spécifique avec ses challenges (Admin)
   */
  static async getExercise(exerciseId: string): Promise<Exercise & { challenges: Challenge[] }> {
    try {
      console.log("CodingPlatformService: Récupération de l'exercice", { exerciseId });

      const response = await api.get(`${this.BASE_URL}/admin/exercises/${exerciseId}`);

      console.log("CodingPlatformService: Exercice récupéré", response.status);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'exercice:', error);
      throw new Error('Une erreur inattendue est survenue lors de la récupération de l\'exercice');
    }
  }

  /**
   * Met à jour un exercice (Admin)
   */
  static async updateExercise(exerciseId: string, data: Partial<ExerciseFormData>): Promise<Exercise> {
    try {
      console.log("CodingPlatformService: Mise à jour de l'exercice", { exerciseId, data });

      const response = await api.put(`${this.BASE_URL}/admin/exercises/${exerciseId}`, data, {
        headers: { 'Content-Type': 'application/json' },
      });

      console.log("CodingPlatformService: Exercice mis à jour", response.status);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'exercice:', error);
      throw new Error('Une erreur inattendue est survenue lors de la mise à jour de l\'exercice');
    }
  }

  /**
   * Supprime un exercice (Admin)
   */
  static async deleteExercise(exerciseId: string): Promise<void> {
    try {
      console.log("CodingPlatformService: Suppression de l'exercice", { exerciseId });

      await api.delete(`${this.BASE_URL}/admin/exercises/${exerciseId}`);

      console.log("CodingPlatformService: Exercice supprimé");
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'exercice:', error);
      throw new Error('Une erreur inattendue est survenue lors de la suppression de l\'exercice');
    }
  }

  // =============================================================================
  // ADMIN ROUTES - DATASET MANAGEMENT (Data Analyst)
  // =============================================================================

  /**
   * Crée un dataset pour un exercice d'analyse de données
   */
  static async createExerciseDataset(exerciseId: string, data: DatasetFormData): Promise<ExerciseDataset> {
    try {
      console.log("CodingPlatformService: Création dataset", { exerciseId, name: data.name });

      const response = await api.post(`${this.BASE_URL}/admin/exercises/${exerciseId}/datasets`, data, {
        headers: { 'Content-Type': 'application/json' },
      });

      return response.data;
    } catch (error) {
      console.error('Erreur lors de la création du dataset:', error);
      throw new Error('Erreur lors de la création du dataset');
    }
  }

  /**
   * Récupère les datasets d'un exercice
   */
  static async getExerciseDatasets(exerciseId: string): Promise<ExerciseDataset[]> {
    try {
      const response = await api.get(`${this.BASE_URL}/admin/exercises/${exerciseId}/datasets`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des datasets:', error);
      throw new Error('Erreur lors de la récupération des datasets');
    }
  }

  // =============================================================================
  // ADMIN ROUTES - DIAGRAM MANAGEMENT (Business Analyst) - NOUVEAU
  // =============================================================================

  /**
   * Récupère les templates de diagrammes disponibles
   */
  static async getDiagramTemplates(): Promise<Record<string, any>> {
    try {
      console.log("CodingPlatformService: Récupération des templates de diagrammes");

      const response = await api.get(`${this.BASE_URL}/admin/diagram-templates`);

      console.log("CodingPlatformService: Templates récupérés", response.status);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des templates:', error);
      throw new Error('Erreur lors de la récupération des templates de diagrammes');
    }
  }

  // =============================================================================
  // ADMIN ROUTES - CHALLENGE MANAGEMENT UNIFIÉ
  // =============================================================================

  /**
   * Récupère tous les challenges avec filtres (Admin)
   */
  static async getChallenges(params: {
    exercise_id?: string;
    status?: ChallengeStatus;
    page?: number;
    per_page?: number;
  }): Promise<ChallengesResponse> {
    try {
      const { page = 1, per_page = 20, exercise_id, status } = params;
      
      console.log("CodingPlatformService: Récupération des challenges", params);

      const queryParams = new URLSearchParams();
      queryParams.append('page', page.toString());
      queryParams.append('per_page', per_page.toString());
      
      if (exercise_id) queryParams.append('exercise_id', exercise_id.toString());
      if (status) queryParams.append('status', status);

      const response = await api.get(`${this.BASE_URL}/admin/challenges`, {
        params: Object.fromEntries(queryParams),
      });

      console.log("CodingPlatformService: Challenges récupérés", response.status);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des challenges:', error);
      throw new Error('Une erreur inattendue est survenue lors de la récupération des challenges');
    }
  }

  /**
   * Crée un nouveau challenge (Admin) - Version unifiée
   */
  static async createChallenge(data: ChallengeFormData): Promise<Challenge> {
    try {
      console.log("CodingPlatformService: Création d'un challenge", {
        title: data.title,
        exercise_id: data.exercise_id,
        execution_environment: data.execution_environment
      });

      const response = await api.post(`${this.BASE_URL}/admin/challenges`, data, {
        headers: { 'Content-Type': 'application/json' },
      });

      console.log("CodingPlatformService: Challenge créé", response.status);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la création du challenge:', error);
      throw new Error('Une erreur inattendue est survenue lors de la création du challenge');
    }
  }

  /**
   * Récupère un challenge spécifique avec ses étapes (Admin)
   */
  static async getChallenge(challengeId: string): Promise<Challenge> {
    try {
      console.log("CodingPlatformService: Récupération du challenge", { challengeId });

      const response = await api.get(`${this.BASE_URL}/admin/challenges/${challengeId}`);

      console.log("CodingPlatformService: Challenge récupéré", response.status);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération du challenge:', error);
      throw new Error('Une erreur inattendue est survenue lors de la récupération du challenge');
    }
  }

  /**
   * Met à jour un challenge (Admin)
   */
  static async updateChallenge(challengeId: string, data: Partial<ChallengeFormData>): Promise<Challenge> {
    try {
      console.log("CodingPlatformService: Mise à jour du challenge", { challengeId, data });

      const response = await api.put(`${this.BASE_URL}/admin/challenges/${challengeId}`, data, {
        headers: { 'Content-Type': 'application/json' },
      });

      console.log("CodingPlatformService: Challenge mis à jour", response.status);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du challenge:', error);
      throw new Error('Une erreur inattendue est survenue lors de la mise à jour du challenge');
    }
  }

  /**
   * Supprime un challenge (Admin)
   */
  static async deleteChallenge(challengeId: string): Promise<void> {
    try {
      console.log("CodingPlatformService: Suppression du challenge", { challengeId });

      await api.delete(`${this.BASE_URL}/admin/challenges/${challengeId}`);

      console.log("CodingPlatformService: Challenge supprimé");
    } catch (error) {
      console.error('Erreur lors de la suppression du challenge:', error);
      throw new Error('Une erreur inattendue est survenue lors de la suppression du challenge');
    }
  }

  // =============================================================================
  // ADMIN ROUTES - STEP MANAGEMENT UNIFIÉ
  // =============================================================================

  /**
   * Récupère toutes les étapes d'un challenge (Admin)
   */
  static async getChallengeSteps(challengeId: string): Promise<ChallengeStep[]> {
    try {
      console.log("CodingPlatformService: Récupération des étapes", { challengeId });

      const response = await api.get(`${this.BASE_URL}/admin/challenges/${challengeId}/steps`);

      console.log("CodingPlatformService: Étapes récupérées", response.status);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des étapes:', error);
      throw new Error('Une erreur inattendue est survenue lors de la récupération des étapes');
    }
  }

  /**
   * Crée une nouvelle étape de challenge (Admin) - Version unifiée
   */
  static async createChallengeStep(challengeId: string, data: ChallengeStepFormData): Promise<ChallengeStep> {
    try {
      console.log("CodingPlatformService: Création d'une étape", {
        challengeId,
        title: data.title,
        diagram_type: data.diagram_type // NOUVEAU
      });

      // Validation spécifique Business Analyst
      if (data.diagram_type && !data.diagram_format) {
        data.diagram_format = 'json'; // Valeur par défaut
      }

      const response = await api.post(`${this.BASE_URL}/admin/challenges/${challengeId}/steps`, data, {
        headers: { 'Content-Type': 'application/json' },
      });

      console.log("CodingPlatformService: Étape créée", response.status);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la création de l\'étape:', error);
      throw new Error('Une erreur inattendue est survenue lors de la création de l\'étape');
    }
  }

  /**
   * Récupère une étape spécifique (Admin)
   */
  static async getStep(stepId: string): Promise<ChallengeStep> {
    try {
      console.log("CodingPlatformService: Récupération de l'étape", { stepId });

      const response = await api.get(`${this.BASE_URL}/admin/steps/${stepId}`);

      console.log("CodingPlatformService: Étape récupérée", response.status);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'étape:', error);
      throw new Error('Une erreur inattendue est survenue lors de la récupération de l\'étape');
    }
  }

  /**
   * Met à jour une étape (Admin)
   */
  static async updateStep(stepId: string, data: Partial<ChallengeStepFormData>): Promise<ChallengeStep> {
    try {
      console.log("CodingPlatformService: Mise à jour de l'étape", { stepId, data });

      const response = await api.put(`${this.BASE_URL}/admin/steps/${stepId}`, data, {
        headers: { 'Content-Type': 'application/json' },
      });

      console.log("CodingPlatformService: Étape mise à jour", response.status);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'étape:', error);
      throw new Error('Une erreur inattendue est survenue lors de la mise à jour de l\'étape');
    }
  }

  /**
   * Supprime une étape (Admin)
   */
  static async deleteStep(stepId: string): Promise<void> {
    try {
      console.log("CodingPlatformService: Suppression de l'étape", { stepId });

      await api.delete(`${this.BASE_URL}/admin/steps/${stepId}`);

      console.log("CodingPlatformService: Étape supprimée");
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'étape:', error);
      throw new Error('Une erreur inattendue est survenue lors de la suppression de l\'étape');
    }
  }

  // =============================================================================
  // ADMIN ROUTES - TEST CASE MANAGEMENT UNIFIÉ
  // =============================================================================

  /**
   * Conversion des données de formulaire vers le format TestCaseData
   */
  private static convertFormDataToTestCaseData(formData: TestCaseFormData): TestCaseData {
    const baseData: TestCaseData = {
      testcase_type: formData.testcase_type || 'unit_test',
      input_data: formData.input_data,
      expected_output: formData.expected_output,
      dataset_reference: formData.dataset_reference,
      sql_query_expected: formData.sql_query_expected,
      expected_visualization: formData.expected_visualization,
      statistical_assertions: formData.statistical_assertions,
      numerical_tolerance: formData.numerical_tolerance || 0.001,
      is_hidden: formData.is_hidden || false,
      is_example: formData.is_example || false,
      timeout_seconds: formData.timeout_seconds || 5,
      memory_limit_mb: formData.memory_limit_mb || 128,
      order_index: formData.order_index || 0
    };

    // Ajouter les champs spécifiques selon le type
    const testcaseType = formData.testcase_type || 'unit_test';

    // Notebook cell test
    if (testcaseType === 'notebook_cell_test') {
      (baseData as any).notebook_cell_output = formData.notebook_cell_output;
      (baseData as any).cell_type = formData.cell_type;
    }

    // Business Analyst - NOUVEAU
    if (['process_diagram', 'use_case_diagram', 'sequence_diagram', 'class_diagram', 
         'activity_diagram', 'flowchart', 'wireframe'].includes(testcaseType)) {
      (baseData as any).diagram_requirements = formData.diagram_requirements;
      (baseData as any).evaluation_rubric = formData.evaluation_rubric;
    }

    return baseData;
  }

  /**
   * Crée un nouveau cas de test (Admin) - Version unifiée
   */
  static async createTestCase(stepId: string, data: TestCaseFormData): Promise<any> {
    try {
      console.log("CodingPlatformService: Création d'un cas de test", { 
        stepId, 
        type: data.testcase_type || 'unit_test' 
      });

      const testCaseData = this.convertFormDataToTestCaseData(data);
      const response = await api.post(`${this.BASE_URL}/admin/steps/${stepId}/testcases`, testCaseData, {
        headers: { 'Content-Type': 'application/json' },
      });

      console.log("CodingPlatformService: Cas de test créé", response.status);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la création du cas de test:', error);
      throw new Error('Une erreur inattendue est survenue lors de la création du cas de test');
    }
  }

  /**
   * Import en lot de cas de test (Admin) - Version la plus à jour avec Business Analyst
   */
  static async bulkImportTestCases(stepId: string, data: { testcases: TestCaseFormData[] }): Promise<BulkTestCasesResponse> {
    try {
      console.log("CodingPlatformService: Import en lot de cas de test", {
        stepId,
        count: data.testcases.length,
        types: data.testcases.map(tc => tc.testcase_type || 'unit_test')
      });

      // Convertir les données du formulaire vers le format attendu par le backend
      const convertedTestCases = data.testcases.map(tc => this.convertFormDataToTestCaseData(tc));

      // Validation côté frontend avant envoi
      const validationErrors = this.validateTestCasesData(convertedTestCases);
      if (validationErrors.length > 0) {
        throw new Error(`Erreurs de validation: ${validationErrors.join(', ')}`);
      }

      const response = await api.post(`${this.BASE_URL}/admin/steps/${stepId}/testcases/bulk`, {
        testcases: convertedTestCases
      }, {
        headers: { 'Content-Type': 'application/json' },
      });

      console.log("CodingPlatformService: Cas de test importés", {
        status: response.status,
        created: response.data.testcases?.length || 0,
        errors: response.data.errors?.length || 0
      });

      return response.data;
    } catch (error) {
      console.error('Erreur lors de l\'import des cas de test:', error);
      throw new Error('Une erreur inattendue est survenue lors de l\'import des cas de test');
    }
  }

  /**
   * Valide les données des cas de test avant envoi - Version unifiée avec Business Analyst
   */
  private static validateTestCasesData(testcases: TestCaseData[]): string[] {
    const errors: string[] = [];

    testcases.forEach((tc, index) => {
      const testcaseType = tc.testcase_type || 'unit_test';
      
      switch (testcaseType) {
        case 'unit_test':
          if (!tc.input_data) {
            errors.push(`Cas de test ${index + 1}: input_data est requis pour les tests unitaires`);
          }
          if (!tc.expected_output) {
            errors.push(`Cas de test ${index + 1}: expected_output est requis pour les tests unitaires`);
          }
          break;

        case 'sql_query_test':
          if (!tc.sql_query_expected) {
            errors.push(`Cas de test ${index + 1}: sql_query_expected est requis pour les tests SQL`);
          }
          break;

        case 'visualization_test':
          if (!tc.expected_visualization) {
            errors.push(`Cas de test ${index + 1}: expected_visualization est requis pour les tests de visualisation`);
          }
          break;

        case 'statistical_test':
          if (!tc.statistical_assertions) {
            errors.push(`Cas de test ${index + 1}: statistical_assertions est requis pour les tests statistiques`);
          }
          break;

        case 'notebook_cell_test':
          if (!tc.notebook_cell_output) {
            errors.push(`Cas de test ${index + 1}: notebook_cell_output est requis pour les tests de cellule notebook`);
          }
          break;
        
        // Business Analyst - NOUVEAU
        case 'process_diagram':
        case 'use_case_diagram':
        case 'sequence_diagram':
        case 'class_diagram':
        case 'activity_diagram':
        case 'flowchart':
        case 'wireframe':
          if (!(tc as any).diagram_requirements && !(tc as any).evaluation_rubric) {
            errors.push(`Cas de test ${index + 1}: diagram_requirements ou evaluation_rubric est requis pour les tests de diagrammes`);
          }
          break;
        case 'accounting_calculation_test':
          
          break;
        default:
          errors.push(`Cas de test ${index + 1}: Type de test non supporté: ${testcaseType}`);
      }
    });

    return errors;
  }

  // =============================================================================
  // PUBLIC ROUTES - EXERCISE AND CHALLENGE DISCOVERY
  // =============================================================================

  /**
   * Récupère les exercices publiés (Public)
   */
  static async getPublicExercises(params: {
    page?: number;
    per_page?: number;
    category?: ExerciseCategory; // NOUVEAU
    language?: ProgrammingLanguage;
    difficulty?: ChallengeDifficulty;
  }): Promise<ExercisesResponse> {
    try {
      const { page = 1, per_page = 20, category, language, difficulty } = params;
      
      console.log("CodingPlatformService: Récupération des exercices publics", params);

      const queryParams = new URLSearchParams();
      queryParams.append('page', page.toString());
      queryParams.append('per_page', per_page.toString());
      
      if (category) queryParams.append('category', category);
      if (language) queryParams.append('language', language);
      if (difficulty) queryParams.append('difficulty', difficulty);

      const response = await axios.get(`/api/${this.BASE_URL}/exercises?${queryParams.toString()}`);

      console.log("CodingPlatformService: Exercices publics récupérés", response.status);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des exercices publics:', error);
      throw new Error('Une erreur inattendue est survenue lors de la récupération des exercices');
    }
  }

  /**
   * Récupère les challenges d'un exercice (Public)
   */
  static async getExerciseChallenges(exerciseId: string): Promise<ExerciseWithChallenges> {
    try {
      console.log("CodingPlatformService: Récupération des challenges de l'exercice", { exerciseId });

      const response = await axios.get(`/api/${this.BASE_URL}/exercises/${exerciseId}/challenges`);

      console.log("CodingPlatformService: Challenges de l'exercice récupérés", response.status);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des challenges de l\'exercice:', error);
      throw new Error('Une erreur inattendue est survenue lors de la récupération des challenges');
    }
  }

  /**
   * Récupère les détails d'un challenge pour l'utilisateur (Public)
   */
  static async getChallengeForUser(challengeId: string): Promise<Challenge> {
    try {
      console.log("CodingPlatformService: Récupération du challenge pour utilisateur", { challengeId });

      const headers = SessionManager.getSessionHeaders();
      const response = await axios.get(`/api/${this.BASE_URL}/challenges/${challengeId}`, { headers });

      console.log("CodingPlatformService: Challenge utilisateur récupéré", response.status);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération du challenge utilisateur:', error);
      throw new Error('Une erreur inattendue est survenue lors de la récupération du challenge');
    }
  }

  // =============================================================================
  // PUBLIC ROUTES - USER SESSION MANAGEMENT
  // =============================================================================

  /**
   * Démarre ou reprend une session de challenge (Public)
   */
  static async startChallenge(challengeId: string, data?: StartChallengeData): Promise<StartChallengeResponse> {
    try {
      console.log("CodingPlatformService: Démarrage du challenge", { challengeId, data });

      // Générer un identifiant anonyme si pas fourni et pas déjà en session
      const requestData = { ...data };
      if (!requestData.anonymous_identifier && !SessionManager.getAnonymousId()) {
        requestData.anonymous_identifier = SessionManager.generateAnonymousId();
      }

      const headers = SessionManager.getSessionHeaders();
      const response = await axios.post(`/api/${this.BASE_URL}/challenges/${challengeId}/start`, requestData, {
        headers: { ...headers, 'Content-Type': 'application/json' },
      });

      console.log("CodingPlatformService: Challenge démarré", response.status);

      // Sauvegarder le token de session
      const result: StartChallengeResponse = response.data;
      SessionManager.setSessionToken(result.session_token);

      return result;
    } catch (error) {
      console.error('Erreur lors du démarrage du challenge:', error);
      throw new Error('Une erreur inattendue est survenue lors du démarrage du challenge');
    }
  }

  /**
   * Récupère une étape spécifique de challenge (Public)
   */
  static async getChallengeStep(challengeId: string, stepId: string): Promise<ChallengeStep> {
    try {
      console.log("CodingPlatformService: Récupération de l'étape", { challengeId, stepId });

      const headers = SessionManager.getSessionHeaders();
      const response = await axios.get(`/api/${this.BASE_URL}/challenges/${challengeId}/steps/${stepId}`, {
        headers,
      });

      console.log("CodingPlatformService: Étape récupérée", response.status);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'étape:', error);
      throw new Error('Une erreur inattendue est survenue lors de la récupération de l\'étape');
    }
  }

  // =============================================================================
  // PUBLIC ROUTES - PROGRESS MANAGEMENT
  // =============================================================================

  /**
   * Sauvegarde le progrès de code d'une étape (Public)
   */
  static async saveStepProgress(challengeId: string, stepId: string, data: CodeSubmissionData): Promise<UserProgress> {
    try {
      console.log("CodingPlatformService: Sauvegarde du progrès", { challengeId, stepId });

      const headers = SessionManager.getSessionHeaders();
      const response = await axios.post(`/api/${this.BASE_URL}/challenges/${challengeId}/steps/${stepId}/save`, data, {
        headers: { ...headers, 'Content-Type': 'application/json' },
      });

      console.log("CodingPlatformService: Progrès sauvegardé", response.status);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du progrès:', error);
      throw new Error('Une erreur inattendue est survenue lors de la sauvegarde du progrès');
    }
  }

  /**
   * Charge le progrès sauvegardé d'une étape (Public)
   */
  static async loadStepProgress(challengeId: string, stepId: string): Promise<UserProgress | {
    step_id: string;
    code: string;
    language: string;
    is_completed: boolean;
    tests_passed: number;
    tests_total: number;
  }> {
    try {
      console.log("CodingPlatformService: Chargement du progrès", { challengeId, stepId });

      const headers = SessionManager.getSessionHeaders();
      const response = await axios.get(`/api/${this.BASE_URL}/challenges/${challengeId}/steps/${stepId}/load`, {
        headers,
      });

      console.log("CodingPlatformService: Progrès chargé", response.status);
      return response.data;
    } catch (error) {
      console.error('Erreur lors du chargement du progrès:', error);
      throw new Error('Une erreur inattendue est survenue lors du chargement du progrès');
    }
  }

  // =============================================================================
  // PUBLIC ROUTES - CODE EXECUTION UNIFIÉ
  // =============================================================================

  /**
   * Soumet le code/diagramme pour évaluation complète (Public) - Version unifiée
   */
  static async submitCode(challengeId: string, stepId: string, dataOrAccessToken: CodeSubmissionData | string, submissionData?: ExtendedSubmissionData): Promise<SubmissionResponse> {
    try {
      let actualData: any;
      let endpoint: string;
      let headers: Record<string, string>;

      // Gestion des deux signatures possibles
      if (typeof dataOrAccessToken === 'string') {
        // Nouvelle signature avec access token pour business analyst
        actualData = submissionData!;
        endpoint = `/api/${this.BASE_URL}/${dataOrAccessToken}/challenges/${challengeId}/steps/${stepId}/submit`;
        headers = { 'Content-Type': 'application/json' };
      } else {
        // Ancienne signature pour développeurs/analystes
        actualData = dataOrAccessToken;
        endpoint = `/api/${this.BASE_URL}/challenges/${challengeId}/steps/${stepId}/submit`;
        headers = { ...SessionManager.getSessionHeaders(), 'Content-Type': 'application/json' };
      }

      console.log("CodingPlatformService: Soumission solution", { 
        challengeId, stepId, 
        content_type: actualData.content_type || 'code' 
      });

      // Adapter les données selon le type
      const submissionPayload = this.adaptSubmissionData(actualData);

      const response = await axios.post(endpoint, submissionPayload, { headers });

      console.log("CodingPlatformService: Solution soumise", response.status);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la soumission de la solution:', error);
      throw new Error('Une erreur inattendue est survenue lors de la soumission de la solution');
    }
  }

  /**
   * Adapte les données de soumission selon le type
   */
  private static adaptSubmissionData(data: any): any {
    // Si c'est une soumission étendue avec content_type
    if (data.content_type) {
      switch (data.content_type) {
        case 'diagram': // NOUVEAU - Business Analyst
          return {
            content: data.content,
            content_type: data.content_type,
            diagram_format: data.diagram_format || 'json',
            diagram_metadata: data.diagram_metadata || {}
          };
        
        case 'code':
          return {
            code: data.content,
            language: data.language
          };
        
        default:
          return {
            content: data.content,
            content_type: data.content_type,
            language: data.language
          };
      }
    }

    // Sinon, c'est une soumission de code classique
    return {
      code: data.code,
      language: data.language
    };
  }

  /**
   * Teste le code contre les cas visibles seulement (Public)
   */
  static async testCode(challengeId: string, stepId: string, data: CodeSubmissionData): Promise<{
    execution_results: ExecutionResult[];
    summary: {
      passed: number;
      total: number;
      success_rate: number;
      all_passed: boolean;
    };
    note: string;
  }> {
    try {
      console.log("CodingPlatformService: Test du code", { challengeId, stepId });

      const headers = SessionManager.getSessionHeaders();
      const response = await axios.post(`/api/${this.BASE_URL}/challenges/${challengeId}/steps/${stepId}/test`, data, {
        headers: { ...headers, 'Content-Type': 'application/json' },
      });

      console.log("CodingPlatformService: Code testé", response.status);
      return response.data;
    } catch (error) {
      console.error('Erreur lors du test du code:', error);
      throw new Error('Une erreur inattendue est survenue lors du test du code');
    }
  }

  // =============================================================================
  // ADMIN ROUTES - CODE TESTING (ADMIN CONTEXT)
  // =============================================================================

  /**
   * Teste le code dans un contexte admin (Admin)
   */
  static async adminTestCode(stepId: string, data: CodeSubmissionData): Promise<AdminTestResponse> {
    try {
      console.log("CodingPlatformService: Test admin du code", { stepId, data });

      if (!data.code || !data.language) {
        throw new Error('Les champs code et language sont obligatoires');
      }

      const response = await api.post(`${this.BASE_URL}/admin/steps/${stepId}/test`, {
        code: data.code,
        language: data.language
      }, {
        headers: { 'Content-Type': 'application/json' },
      });

      console.log("CodingPlatformService: Code testé (admin)", response.status);
      return response.data;
    } catch (error) {
      console.error('Erreur lors du test admin du code:', error);
      
      if (error instanceof Error) {
        throw error;
      }
      
      throw new Error('Une erreur inattendue est survenue lors du test du code');
    }
  }

  /**
   * Valide le code dans un contexte admin (Admin)
   */
  static async adminValidateCode(stepId: string, data: ExtendedSubmissionData): Promise<AdminTestResponse> {
    try {
      console.log("CodingPlatformService: Validation admin du code", { stepId, data });

      if (!data.content) {
        throw new Error('Le champ content est obligatoire');
      }

      const response = await api.post(`${this.BASE_URL}/admin/steps/${stepId}/validate`, {
        content: data.content,
        content_type: data.content_type, // NOUVEAU - Support des diagrammes
        language: data.language
      }, {
        headers: { 'Content-Type': 'application/json' },
      });

      console.log("CodingPlatformService: Code validé (admin)", response.status);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la validation admin du code:', error);
      
      if (error instanceof Error) {
        throw error;
      }
      
      throw new Error('Une erreur inattendue est survenue lors de la validation du code');
    }
  }

  // =============================================================================
  // PUBLIC ROUTES - CONTEXTE ET MÉTADONNÉES
  // =============================================================================

  /**
   * Récupère le contexte d'un challenge (environnement, datasets, etc.)
   */
  static async getChallengeContext(challengeId: string): Promise<ChallengeContext> {
    try {
      console.log("CodingPlatformService: Récupération contexte", { challengeId });

      const response = await axios.get(`/api/${this.BASE_URL}/challenges/${challengeId}/context`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération du contexte:', error);
      throw new Error('Erreur lors de la récupération du contexte');
    }
  }

  /**
   * Récupère tous les types disponibles pour l'interface - Version unifiée
   */
  static async getAvailableTypes(): Promise<AvailableTypes> {
    try {
      const response = await axios.get(`/api/${this.BASE_URL}/meta/types`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des types:', error);
      // Fallback avec tous les types unifiés
      return {
        exercise_categories: ['developer', 'data_analyst', 'business_analyst'], // NOUVEAU
        execution_environments: ['code_executor', 'jupyter_notebook', 'sql_database', 'data_visualization', 'file_analysis', 'diagram_editor'], // NOUVEAU
        testcase_types: ['unit_test', 'sql_query_test', 'visualization_test', 'statistical_test', 'notebook_cell_test', 'process_diagram', 'use_case_diagram', 'sequence_diagram', 'class_diagram', 'activity_diagram', 'flowchart', 'wireframe'], // NOUVEAU
        programming_languages: ['python', 'javascript', 'java', 'cpp', 'c', 'sql', 'r'],
        dataset_types: ['csv', 'json', 'excel', 'sqlite', 'postgresql'],
        diagram_types: ['uml_use_case', 'uml_sequence', 'uml_class', 'uml_activity', 'bpmn_process', 'flowchart', 'wireframe', 'entity_relationship', 'mockup'], // NOUVEAU
        diagram_formats: ['staruml', 'drawio', 'svg', 'png', 'json'] // NOUVEAU
      };
    }
  }

  // =============================================================================
  // ADMIN ROUTES - VALIDATION ÉTENDUES
  // =============================================================================

  /**
   * Valide une requête SQL (développement)
   */
  static async validateSQLQuery(query: string, datasetReference: string) {
    try {
      const response = await api.post(`${this.BASE_URL}/admin/validate/sql`, {
        query,
        dataset_reference: datasetReference
      }, {
        headers: { 'Content-Type': 'application/json' },
      });

      return response.data;
    } catch (error) {
      console.error('Erreur lors de la validation SQL:', error);
      throw new Error('Erreur lors de la validation SQL');
    }
  }

  /**
   * Valide une visualisation (développement)
   */
  static async validateVisualization(visualizationData: any, expectedStructure?: any) {
    try {
      const response = await api.post(`${this.BASE_URL}/admin/validate/visualization`, {
        visualization_data: visualizationData,
        expected_structure: expectedStructure
      }, {
        headers: { 'Content-Type': 'application/json' },
      });

      return response.data;
    } catch (error) {
      console.error('Erreur lors de la validation de visualisation:', error);
      throw new Error('Erreur lors de la validation de visualisation');
    }
  }

  // =============================================================================
  // UTILITY METHODS UNIFIÉES
  // =============================================================================

  /**
   * Labels pour les catégories d'exercices - Version unifiée
   */
  static getExerciseCategoryLabel(category: ExerciseCategory): string {
    const labels = {
      'developer': 'Développeur',
      'data_analyst': 'Analyste de données',
      'business_analyst': 'Analyste business',
      'secretary': 'Secrétaire',
      'accountant': 'Comptable'
    };
    return labels[category] || category;
  }

  /**
   * Labels pour les environnements d'exécution - Version unifiée
   */
  static getExecutionEnvironmentLabel(environment: ExecutionEnvironment): string {
    const labels = {
      'code_executor': 'Exécution de code',
      'sql_database': 'Base de données SQL',
      'jupyter_notebook': 'Notebook Jupyter',
      'data_visualization': 'Visualisation de données',
      'file_analysis': 'Analyse de fichiers',
      'diagram_editor': 'Éditeur de diagrammes',
      'text_editor': 'Éditeur de texte',
      'spreadsheet_editor': 'Éditeur de tableur'
    };
    return labels[environment] || environment;
  }

  /**
   * Labels pour les types de cas de test - Version unifiée
   */
  static getTestcaseTypeLabel(type: TestcaseType): string {
    const labels = {
      'unit_test': 'Test unitaire',
      'sql_query_test': 'Test de requête SQL',
      'visualization_test': 'Test de visualisation',
      'statistical_test': 'Test statistique',
      'notebook_cell_test': 'Test de cellule notebook',
      'process_diagram': 'Diagramme de processus',
      'use_case_diagram': 'Diagramme de cas d\'usage',
      'sequence_diagram': 'Diagramme de séquence',
      'class_diagram': 'Diagramme de classes',
      'activity_diagram': 'Diagramme d\'activité',
      'flowchart': 'Organigramme',
      'wireframe': 'Maquette fonctionnelle',
      'text_formatting_test': 'Test de mise en forme',
      'spelling_grammar_test': 'Test orthographe/grammaire',
      'document_structure_test': 'Test de structure',
      'correspondence_test': 'Test de correspondance',
      'proofreading_test': 'Test de relecture',
      'accounting_calculation_test': 'Test de calcul comptable',
      'financial_analysis_test': 'Test d\'analyse financière',
      'budget_validation_test': 'Test de validation budget',
      'balance_sheet_test': 'Test de bilan',
      'tax_calculation_test': 'Test de calcul fiscal',
      'audit_trail_test': 'Test de piste d\'audit'
    };
    return labels[type] || type;
  }

  /**
   * Labels pour les types de datasets
   */
  static getDatasetTypeLabel(type: DatasetType): string {
    const labels = {
      'csv': 'CSV',
      'json': 'JSON',
      'excel': 'Excel',
      'sqlite': 'SQLite',
      'postgresql': 'PostgreSQL',
      'mysql': 'MySQL',
      'parquet': 'Parquet'
    };
    return labels[type] || type;
  }

  /**
   * Labels pour les types de diagrammes - NOUVEAU
   */
  static getDiagramTypeLabel(type: DiagramType): string {
    const labels = {
      'uml_use_case': 'Diagramme de cas d\'usage',
      'uml_sequence': 'Diagramme de séquence',
      'uml_class': 'Diagramme de classes',
      'uml_activity': 'Diagramme d\'activité',
      'bpmn_process': 'Processus BPMN',
      'flowchart': 'Organigramme',
      'wireframe': 'Maquette fonctionnelle',
      'entity_relationship': 'Diagramme entité-relation',
      'mockup': 'Maquette'
    };
    return labels[type] || type;
  }

  /**
   * Couleurs pour les catégories d'exercices - Version unifiée
   */
  static getExerciseCategoryColor(category: ExerciseCategory): string {
    const colors = {
      'developer': '#3b82f6', 
      'data_analyst': '#10b981', 
      'business_analyst': '#8b5cf6', 
      'secretary': '#ec4899', 
      'accountant': '#f59e0b'
    };
    return colors[category] || '#6b7280';
  }

  /**
   * Couleurs pour les environnements d'exécution - Version unifiée
   */
  static getExecutionEnvironmentColor(environment: ExecutionEnvironment): string {
    const colors = {
      'code_executor': '#3b82f6',
      'sql_database': '#059669',
      'jupyter_notebook': '#f59e0b',
      'data_visualization': '#8b5cf6',
      'file_analysis': '#ef4444',
      'diagram_editor': '#ec4899',
      'text_editor': '#ec4899',
      'spreadsheet_editor': '#f59e0b'
    };
    return colors[environment] || '#6b7280';
  }

  /**
   * Icônes pour les environnements - Version unifiée
   */
  static getEnvironmentIcon(environment: ExecutionEnvironment): string {
    switch (environment) {
      case 'code_executor':
        return '💻';
      case 'jupyter_notebook':
        return '📊';
      case 'sql_database':
        return '🗄️';
      case 'data_visualization':
        return '📈';
      case 'file_analysis':
        return '📋';
      case 'diagram_editor': // NOUVEAU
        return '📐';
      case 'text_editor':
        return '📝';
      case 'spreadsheet_editor':
        return '🧮';
      default:
        return '⚡';
    }
  }

  /**
   * Vérifie si un exercice nécessite un langage
   */
  static requiresLanguage(category: ExerciseCategory): boolean {
    return category === 'developer';
  }

  /**
   * Vérifie si un exercice peut avoir des datasets
   */
  static supportsDatasets(category: ExerciseCategory): boolean {
    return category === 'data_analyst';
  }

  /**
   * Vérifie si un exercice peut avoir des diagrammes - NOUVEAU
   */
  static supportsDiagrams(category: ExerciseCategory): boolean {
    return category === 'business_analyst';
  }

  /**
   * Obtient l'environnement d'exécution par défaut selon la catégorie - Version unifiée
   */
  static getDefaultExecutionEnvironment(category: ExerciseCategory): ExecutionEnvironment {
    const defaults = {
      'developer': 'code_executor',
      'data_analyst': 'jupyter_notebook',
      'business_analyst': 'diagram_editor',
      'secretary': 'text_editor',
      'accountant': 'spreadsheet_editor'
    };
    return defaults[category] as ExecutionEnvironment;
  }

  /**
   * Obtient les environnements compatibles avec une catégorie - Version unifiée
   */
  static getCompatibleEnvironments(category: ExerciseCategory): ExecutionEnvironment[] {
    const compatible = {
      'developer': ['code_executor'],
      'data_analyst': ['sql_database', 'jupyter_notebook', 'data_visualization', 'file_analysis'],
      'business_analyst': ['diagram_editor'],
      'secretary': ['text_editor'],
      'accountant': ['spreadsheet_editor']
    };
    return compatible[category] as ExecutionEnvironment[];
  }

  /**
   * Obtient les types de cas de test compatibles avec un environnement - Version unifiée
   */
  static getCompatibleTestcaseTypes(environment: ExecutionEnvironment): TestcaseType[] {
    const compatible = {
      'code_executor': ['unit_test'],
      'sql_database': ['sql_query_test'],
      'jupyter_notebook': ['notebook_cell_test', 'statistical_test', 'visualization_test', 'unit_test'],
      'data_visualization': ['visualization_test'],
      'file_analysis': ['statistical_test'],
      'diagram_editor': ['process_diagram', 'use_case_diagram', 'sequence_diagram', 'class_diagram', 'activity_diagram', 'flowchart', 'wireframe'],
      'text_editor': ['text_formatting_test', 'spelling_grammar_test', 'document_structure_test', 'correspondence_test', 'proofreading_test'],
      'spreadsheet_editor': ['accounting_calculation_test', 'financial_analysis_test', 'budget_validation_test', 'balance_sheet_test', 'tax_calculation_test', 'audit_trail_test']
  };
    return compatible[environment] as TestcaseType[];
  }

  // =============================================================================
  // LABELS ET VALIDATION EXISTANTS (PRÉSERVÉS)
  // =============================================================================

  /**
   * Obtient les labels de difficulté en français
   */
  static getDifficultyLabel(difficulty: ChallengeDifficulty): string {
    const labels = {
      'beginner': 'Débutant',
      'intermediate': 'Intermédiaire',
      'advanced': 'Avancé',
      'expert': 'Expert'
    };
    return labels[difficulty] || difficulty;
  }

  /**
   * Obtient les couleurs associées aux difficultés
   */
  static getDifficultyColor(difficulty: ChallengeDifficulty): string {
    const colors = {
      'beginner': '#27ae60',
      'intermediate': '#f39c12',
      'advanced': '#e74c3c',
      'expert': '#9b59b6'
    };
    return colors[difficulty] || '#95a5a6';
  }

  /**
   * Obtient les labels de langage en français
   */
  static getLanguageLabel(language: ProgrammingLanguage): string {
    const labels = {
      'python': 'Python',
      'javascript': 'JavaScript',
      'java': 'Java',
      'cpp': 'C++',
      'c': 'C',
      'sql': 'SQL',
      'r': 'R',
      'jupyter_python': 'Jupyter Python'
    };
    return labels[language] || language;
  }

  /**
   * Obtient les labels de statut de challenge
   */
  static getChallengeStatusLabel(status: ChallengeStatus): string {
    const labels = {
      'draft': 'Brouillon',
      'published': 'Publié',
      'archived': 'Archivé'
    };
    return labels[status] || status;
  }

  /**
   * Obtient les labels de statut utilisateur
   */
  static getUserChallengeStatusLabel(status: UserChallengeStatus): string {
    const labels = {
      'not_started': 'Pas commencé',
      'in_progress': 'En cours',
      'completed': 'Terminé',
      'abandoned': 'Abandonné'
    };
    return labels[status] || status;
  }

  /**
   * Valide les données de soumission de code
   */
  static validateCodeSubmission(data: CodeSubmissionData): Record<string, string> {
    const errors: Record<string, string> = {};

    if (!data.code?.trim()) {
      errors.code = 'Le code est requis';
    }

    if (!data.language) {
      errors.language = 'Le langage est requis';
    }

    const validLanguages: ProgrammingLanguage[] = ['python', 'javascript', 'java', 'cpp', 'c'];
    if (data.language && !validLanguages.includes(data.language)) {
      errors.language = 'Langage non supporté';
    }

    return errors;
  }

  /**
   * Valide les données de soumission étendue - Version unifiée avec Business Analyst
   */
  static validateExtendedSubmission(data: ExtendedSubmissionData): Record<string, string> {
    const errors: Record<string, string> = {};

    if (!data.content) {
      errors.content = 'Le contenu est requis';
    }

    if (!data.content_type) {
      errors.content_type = 'Le type de contenu est requis';
    }

    const validContentTypes = ['code', 'sql', 'notebook', 'visualization', 'analysis', 'diagram']; // NOUVEAU
    if (data.content_type && !validContentTypes.includes(data.content_type)) {
      errors.content_type = 'Type de contenu non supporté';
    }
    if (data.content_type === 'text' && typeof data.content !== 'string') {
      errors.content = 'Un document texte doit être une chaîne de caractères';
    }
  
    if (data.content_type === 'spreadsheet' && typeof data.content !== 'object') {
      errors.content = 'Un document tableur doit être un objet JSON';
    }
  
    // Validation spécifique selon le type
    if (data.content_type === 'code' && !data.language) {
      errors.language = 'Le langage est requis pour les soumissions de code';
    }

    if (data.content_type === 'sql' && typeof data.content !== 'string') {
      errors.content = 'Une requête SQL doit être une chaîne de caractères';
    }

    if (data.content_type === 'notebook' && typeof data.content !== 'object') {
      errors.content = 'Un notebook doit être un objet JSON';
    }

    // Business Analyst - NOUVEAU
    if (data.content_type === 'diagram') {
      if (!data.diagram_format) {
        errors.diagram_format = 'Le format de diagramme est requis';
      }
      
      const validFormats: DiagramFormat[] = ['staruml', 'drawio', 'svg', 'png', 'json'];
      if (data.diagram_format && !validFormats.includes(data.diagram_format)) {
        errors.diagram_format = 'Format de diagramme non supporté';
      }
    }

    return errors;
  }

  /**
   * Formate le temps d'exécution
   */
  static formatExecutionTime(timeInSeconds?: number): string {
    if (!timeInSeconds) return 'N/A';
    if (timeInSeconds < 1) return `${Math.round(timeInSeconds * 1000)}ms`;
    return `${timeInSeconds.toFixed(2)}s`;
  }

  /**
   * Formate l'utilisation mémoire
   */
  static formatMemoryUsage(memoryInKB?: number): string {
    if (!memoryInKB) return 'N/A';
    if (memoryInKB < 1024) return `${Math.round(memoryInKB)}KB`;
    return `${(memoryInKB / 1024).toFixed(2)}MB`;
  }

  /**
   * Calcule le pourcentage de progression
   */
  static calculateProgress(passed: number, total: number): number {
    if (total === 0) return 0;
    return Math.round((passed / total) * 100);
  }

  /**
   * Formate le score de performance - Version unifiée
   */
  static formatScore(score?: number): string {
    if (score === undefined || score === null) return 'N/A';
    return `${Math.round(score)}/100`;
  }

  /**
   * Nettoie les données de session
   */
  static clearSession(): void {
    SessionManager.removeSessionToken();
    SessionManager.removeAnonymousId();
  }

  /**
   * Vérification de l'état de santé du service
   */
  static async healthCheck(): Promise<{ status: string; service: string; timestamp: string; version: string }> {
    try {
      const response = await axios.get(`/api/${this.BASE_URL}/health`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la vérification de l\'état de santé:', error);
      throw new Error('Service non disponible');
    }
  }

  /**
   * Informations sur l'API
   */
  static async getApiInfo(): Promise<any> {
    try {
      const response = await axios.get(`/api/${this.BASE_URL}/`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des informations API:', error);
      throw new Error('Impossible de récupérer les informations API');
    }
  }
}

export default CodingPlatformService;