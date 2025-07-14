import { AdminTestResponse, BulkTestCasesData, Challenge, ChallengeDifficulty, ChallengeFormData, ChallengesResponse, ChallengeStatus, ChallengeStep, ChallengeStepFormData, CodeSubmissionData, ExecutionResult, Exercise, ExerciseFormData, ExercisesResponse, ExerciseWithChallenges, ExtendedSubmissionData, ProgrammingLanguage, StartChallengeData, StartChallengeResponse, SubmissionResponse, TestCase, TestCaseFormData, UserChallengeStatus, UserProgress } from '@/types/coding-plateform';
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
// CODING PLATFORM SERVICE
// =============================================================================

export class CodingPlatformService {
  private static readonly BASE_URL = '/coding';

  // =============================================================================
  // ADMIN ROUTES - EXERCISE MANAGEMENT
  // =============================================================================

  /**
   * Récupère tous les exercices avec pagination et filtres (Admin)
   */
  static async getExercises(params: {
    page?: number;
    per_page?: number;
    language?: ProgrammingLanguage;
    difficulty?: ChallengeDifficulty;
  }): Promise<ExercisesResponse> {
    try {
      const { page = 1, per_page = 20, language, difficulty } = params;
      
      console.log("CodingPlatformService: Récupération des exercices", {
        page, per_page, language, difficulty
      });

      const queryParams = new URLSearchParams();
      queryParams.append('page', page.toString());
      queryParams.append('per_page', per_page.toString());
      
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
   * Crée un nouvel exercice (Admin)
   */
  static async createExercise(data: ExerciseFormData): Promise<Exercise> {
    try {
      console.log("CodingPlatformService: Création d'un exercice", {
        title: data.title,
        language: data.language,
        difficulty: data.difficulty
      });

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
  // ADMIN ROUTES - CHALLENGE MANAGEMENT
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
   * Crée un nouveau challenge (Admin)
   */
  static async createChallenge(data: ChallengeFormData): Promise<Challenge> {
    try {
      console.log("CodingPlatformService: Création d'un challenge", {
        title: data.title,
        exercise_id: data.exercise_id
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
  // ADMIN ROUTES - STEP MANAGEMENT
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
   * Crée une nouvelle étape de challenge (Admin)
   */
  static async createChallengeStep(challengeId: string, data: ChallengeStepFormData): Promise<ChallengeStep> {
    try {
      console.log("CodingPlatformService: Création d'une étape", {
        challengeId,
        title: data.title
      });

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

  // =============================================================================
  // ADMIN ROUTES - TEST CASE MANAGEMENT
  // =============================================================================

  /**
   * Crée un nouveau cas de test (Admin)
   */
  static async createTestCase(stepId: string, data: TestCaseFormData): Promise<TestCase> {
    try {
      console.log("CodingPlatformService: Création d'un cas de test", { stepId });

      const response = await api.post(`${this.BASE_URL}/admin/steps/${stepId}/testcases`, data, {
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
   * Import en lot de cas de test (Admin)
   */
  static async bulkImportTestCases(stepId: string, data: BulkTestCasesData): Promise<{
    message: string;
    testcases: TestCase[];
  }> {
    try {
      console.log("CodingPlatformService: Import en lot de cas de test", {
        stepId,
        count: data.testcases.length
      });

      const response = await api.post(`${this.BASE_URL}/admin/steps/${stepId}/testcases/bulk`, data, {
        headers: { 'Content-Type': 'application/json' },
      });

      console.log("CodingPlatformService: Cas de test importés", response.status);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de l\'import des cas de test:', error);
      throw new Error('Une erreur inattendue est survenue lors de l\'import des cas de test');
    }
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
    language?: ProgrammingLanguage;
    difficulty?: ChallengeDifficulty;
  }): Promise<ExercisesResponse> {
    try {
      const { page = 1, per_page = 20, language, difficulty } = params;
      
      console.log("CodingPlatformService: Récupération des exercices publics", params);

      const queryParams = new URLSearchParams();
      queryParams.append('page', page.toString());
      queryParams.append('per_page', per_page.toString());
      
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
      const response = await axios.post(`${this.BASE_URL}/challenges/${challengeId}/start`, requestData, {
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
      const response = await axios.post(`${this.BASE_URL}/challenges/${challengeId}/steps/${stepId}/save`, data, {
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
  // PUBLIC ROUTES - CODE EXECUTION
  // =============================================================================

  /**
   * Soumet le code pour évaluation complète (Public)
   */
  static async submitCode(challengeId: string, stepId: string, data: CodeSubmissionData): Promise<SubmissionResponse> {
    try {
      console.log("CodingPlatformService: Soumission du code", { challengeId, stepId });

      const headers = SessionManager.getSessionHeaders();
      const response = await axios.post(`/api/${this.BASE_URL}/challenges/${challengeId}/steps/${stepId}/submit`, data, {
        headers: { ...headers, 'Content-Type': 'application/json' },
      });

      console.log("CodingPlatformService: Code soumis", response.status);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la soumission du code:', error);
      throw new Error('Une erreur inattendue est survenue lors de la soumission du code');
    }
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
      const response = await axios.post(`${this.BASE_URL}/challenges/${challengeId}/steps/${stepId}/test`, data, {
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
  // UTILITY METHODS
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
      'c': 'C'
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
  // ADMIN ROUTES - CODE TESTING (ADMIN CONTEXT)
  // =============================================================================

  /**
   * Teste le code dans un contexte admin (Admin)
   */
  static async adminTestCode(stepId: string, data: CodeSubmissionData): Promise<AdminTestResponse> {
  try {
    console.log("CodingPlatformService: Test admin du code", { stepId, data });

    // ✅ CORRECTION: Vérifier que les données sont bien structurées
    if (!data.code || !data.language) {
      throw new Error('Les champs code et language sont obligatoires>>');
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
    
    // ✅ CORRECTION: Meilleure gestion des erreurs
    if (error instanceof Error) {
      throw error;
    }
    
    if (error) {
      throw new Error("error");
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

    // ✅ CORRECTION: Vérifier que les données sont bien structurées
    if (!data.content) {
      throw new Error('Les champs code sont obligatoires>>>');
    }

    const response = await api.post(`${this.BASE_URL}/admin/steps/${stepId}/validate`, {
      content: data.content,
      language: data.language
    }, {
      headers: { 'Content-Type': 'application/json' },
    });

    console.log("CodingPlatformService: Code validé (admin)", response.status);
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la validation admin du code:', error);
    
    // ✅ CORRECTION: Meilleure gestion des erreurs
    if (error instanceof Error) {
      throw error;
    }
    
    if (error) {
      throw new Error("error");
    }
    
    throw new Error('Une erreur inattendue est survenue lors de la validation du code');
  }
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