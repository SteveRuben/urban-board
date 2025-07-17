// services/coding-platform-adapter.ts
// Adaptateur pour utiliser automatiquement le bon service selon le contexte

import { CodingPlatformService } from '@/services/coding-platform-service';
import { ExtendedCodingPlatformService } from '@/services/extended-coding-platform-service';
import { 
  ExerciseFormData, 
  ChallengeFormData, 
  ExerciseCategory,
  ExecutionEnvironment 
} from '@/types/coding-plateform';

/**
 * Adaptateur intelligent qui choisit automatiquement le bon service
 * selon les données fournies (compatibilité avec l'existant)
 */
export class CodingPlatformAdapter {

  // =============================================================================
  // EXERCISE MANAGEMENT - Routing automatique
  // =============================================================================

  /**
   * Crée un exercice (utilise le service approprié selon la catégorie)
   */
  static async createExercise(data: ExerciseFormData) {
    try {
      console.log("Adapter: Création exercice", { category: data.category, title: data.title });

      // 🔄 Si c'est un data analyst OU si on a des nouveaux champs, utiliser le service étendu
      if (data.category === 'data_analyst' || data.required_skills || data.estimated_duration_minutes) {
        return await ExtendedCodingPlatformService.createExerciseExtended(data);
      }

      // 🔄 Sinon, utiliser le service original pour compatibility
      return await CodingPlatformService.createExercise(data);
    } catch (error) {
      console.error('Erreur dans l\'adaptateur createExercise:', error);
      throw error;
    }
  }

  /**
   * Récupère les exercices (utilise le service étendu pour avoir tous les champs)
   */
  static async getExercises(params: any) {
    try {
      // 🔄 Utiliser le service étendu pour avoir les nouveaux champs
      if (params.category || this.hasExtendedParams(params)) {
        return await ExtendedCodingPlatformService.getExercisesExtended(params);
      }

      // 🔄 Fallback sur le service original
      return await CodingPlatformService.getExercises(params);
    } catch (error) {
      console.error('Erreur dans l\'adaptateur getExercises:', error);
      // 🔄 Fallback sur le service original en cas d'erreur
      return await CodingPlatformService.getExercises(params);
    }
  }

  /**
   * Met à jour un exercice
   */
  static async updateExercise(exerciseId: string, data: Partial<ExerciseFormData>) {
    try {
      // 🔄 Si on a des champs étendus, essayer le service étendu
      if (data.category === 'data_analyst' || data.required_skills || data.estimated_duration_minutes) {
        // Pour l'instant, utiliser le service original (compatibilité)
        return await CodingPlatformService.updateExercise(exerciseId, data);
      }

      return await CodingPlatformService.updateExercise(exerciseId, data);
    } catch (error) {
      console.error('Erreur dans l\'adaptateur updateExercise:', error);
      throw error;
    }
  }

  // =============================================================================
  // CHALLENGE MANAGEMENT - Routing automatique  
  // =============================================================================

  /**
   * Crée un challenge (utilise le service approprié selon l'environnement)
   */
  static async createChallenge(data: ChallengeFormData) {
    try {
      console.log("Adapter: Création challenge", { 
        execution_environment: data.execution_environment, 
        title: data.title 
      });

      // 🔄 Si c'est un environnement étendu, utiliser le service étendu
      if (this.isExtendedEnvironment(data.execution_environment)) {
        return await ExtendedCodingPlatformService.createChallengeExtended(data);
      }

      // 🔄 Sinon, utiliser le service original
      return await CodingPlatformService.createChallenge(data);
    } catch (error) {
      console.error('Erreur dans l\'adaptateur createChallenge:', error);
      throw error;
    }
  }

  /**
   * Crée une étape de challenge
   */
  static async createChallengeStep(challengeId: string, data: any) {
    try {
      // 🔄 Si on a des champs étendus (notebook, sql, etc.), utiliser le service étendu
      if (data.notebook_template || data.sql_schema || data.expected_output_type) {
        return await ExtendedCodingPlatformService.createChallengeStepExtended(challengeId, data);
      }

      // 🔄 Sinon, utiliser le service original
      return await CodingPlatformService.createChallengeStep(challengeId, data);
    } catch (error) {
      console.error('Erreur dans l\'adaptateur createChallengeStep:', error);
      throw error;
    }
  }


  // =============================================================================
  // DATASET MANAGEMENT - Toujours utiliser le service étendu
  // =============================================================================

  /**
   * Crée un dataset (fonctionnalité exclusive au service étendu)
   */
  static async createExerciseDataset(exerciseId: string, data: any) {
    return await ExtendedCodingPlatformService.createExerciseDataset(exerciseId, data);
  }

  /**
   * Récupère les datasets d'un exercice
   */
  static async getExerciseDatasets(exerciseId: string) {
    return await ExtendedCodingPlatformService.getExerciseDatasets(exerciseId);
  }

  // =============================================================================
  // SUBMISSION MANAGEMENT - Routing automatique
  // =============================================================================

  /**
   * Soumet une solution (utilise le service approprié selon le type de contenu)
   */
  static async submitSolution(challengeId: string, stepId: string, accessToken: string, data: any) {
    try {
      // 🔄 Si c'est une soumission étendue (SQL, notebook, etc.)
      if (data.content_type && data.content_type !== 'code') {
        return await ExtendedCodingPlatformService.submitSolutionExtended(
          challengeId, stepId, accessToken, data
        );
      }

      // 🔄 Sinon, utiliser le service original pour les soumissions de code
      return await CodingPlatformService.submitCode(challengeId, stepId, data);
    } catch (error) {
      console.error('Erreur dans l\'adaptateur submitSolution:', error);
      throw error;
    }
  }

  // =============================================================================
  // UTILITY METHODS
  // =============================================================================

  /**
   * Vérifie si on a des paramètres étendus
   */
  private static hasExtendedParams(params: any): boolean {
    return !!(params.category || params.required_skills);
  }

  /**
   * Vérifie si c'est un environnement d'exécution étendu
   */
  private static isExtendedEnvironment(environment?: ExecutionEnvironment): boolean {
    if (!environment) return false;
    
    const extendedEnvironments: ExecutionEnvironment[] = [
      'sql_database', 
      'jupyter_notebook', 
      'data_visualization', 
      'file_analysis'
    ];
    
    return extendedEnvironments.includes(environment);
  }

  /**
   * Vérifie si un cas de test a des champs étendus
   */
  private static hasExtendedTestCaseFields(data: any): boolean {
    return !!(
      data.testcase_type && data.testcase_type !== 'unit_test' ||
      data.dataset_reference ||
      data.sql_query_expected ||
      data.expected_visualization ||
      data.statistical_assertions ||
      data.numerical_tolerance
    );
  }

  /**
   * Obtient les informations de contexte (toujours utiliser le service étendu)
   */
  static async getChallengeContext(challengeId: string) {
    try {
      return await ExtendedCodingPlatformService.getChallengeContext(challengeId);
    } catch (error) {
      // 🔄 Fallback: construire un contexte minimal depuis le service original
      console.warn('Contexte étendu non disponible, fallback sur le service original');
      const challenge = await CodingPlatformService.getChallengeForUser(challengeId);
      
      return {
        challenge,
        execution_environment: 'code_executor',
        environment_config: {},
        exercise_category: 'developer',
        datasets: []
      };
    }
  }

  /**
   * Obtient les types disponibles
   */
  static async getAvailableTypes() {
    try {
      return await ExtendedCodingPlatformService.getAvailableTypes();
    } catch (error) {
      // 🔄 Fallback: retourner les types de base
      console.warn('Types étendus non disponibles, fallback sur les types de base');
      return {
        exercise_categories: ['developer'],
        execution_environments: ['code_executor'],
        testcase_types: ['unit_test'],
        programming_languages: ['python', 'javascript', 'java', 'cpp', 'c'],
        dataset_types: []
      };
    }
  }

  // =============================================================================
  // MÉTHODES DE COMPATIBILITÉ - Délégation vers le service original
  // =============================================================================

  /**
   * Méthodes qui délèguent directement au service original pour compatibilité
   */
  
  static async getExercise(exerciseId: string) {
    return await CodingPlatformService.getExercise(exerciseId);
  }

  static async deleteExercise(exerciseId: string) {
    return await CodingPlatformService.deleteExercise(exerciseId);
  }

  static async getChallenges(params: any) {
    return await CodingPlatformService.getChallenges(params);
  }

  static async getChallenge(challengeId: string) {
    return await CodingPlatformService.getChallenge(challengeId);
  }

  static async updateChallenge(challengeId: string, data: any) {
    return await CodingPlatformService.updateChallenge(challengeId, data);
  }

  static async deleteChallenge(challengeId: string) {
    return await CodingPlatformService.deleteChallenge(challengeId);
  }

  static async getChallengeSteps(challengeId: string) {
    return await CodingPlatformService.getChallengeSteps(challengeId);
  }

  static async getStep(stepId: string) {
    return await CodingPlatformService.getStep(stepId);
  }

  static async updateStep(stepId: string, data: any) {
    return await CodingPlatformService.updateStep(stepId, data);
  }

  static async deleteStep(stepId: string) {
    return await CodingPlatformService.deleteStep(stepId);
  }

  static async bulkImportTestCases(stepId: string, data: any) {
    // 🔄 Vérifier si on a des cas de test étendus
    const hasExtendedTestCases = data.testcases?.some((tc: any) => 
      this.hasExtendedTestCaseFields(tc)
    );

    if (hasExtendedTestCases) {
      return await ExtendedCodingPlatformService.bulkImportTestCasesExtended(stepId, data);
    }

    return await CodingPlatformService.bulkImportTestCases(stepId, data);
  }

  static async adminTestCode(stepId: string, data: any) {
    return await CodingPlatformService.adminTestCode(stepId, data);
  }

  static async adminValidateCode(stepId: string, data: any) {
    return await CodingPlatformService.adminValidateCode(stepId, data);
  }

  // Méthodes utilitaires du service original
  static getDifficultyLabel = CodingPlatformService.getDifficultyLabel;
  static getDifficultyColor = CodingPlatformService.getDifficultyColor;
  static getLanguageLabel = CodingPlatformService.getLanguageLabel;
  static getChallengeStatusLabel = CodingPlatformService.getChallengeStatusLabel;
  static getUserChallengeStatusLabel = CodingPlatformService.getUserChallengeStatusLabel;
  static validateCodeSubmission = CodingPlatformService.validateCodeSubmission;
  static formatExecutionTime = CodingPlatformService.formatExecutionTime;
  static formatMemoryUsage = CodingPlatformService.formatMemoryUsage;
  static calculateProgress = CodingPlatformService.calculateProgress;
  static clearSession = CodingPlatformService.clearSession;

  // Méthodes utilitaires étendues
  static getExerciseCategoryLabel = ExtendedCodingPlatformService.getExerciseCategoryLabel;
  static getExecutionEnvironmentLabel = ExtendedCodingPlatformService.getExecutionEnvironmentLabel;
  static getTestcaseTypeLabel = ExtendedCodingPlatformService.getTestcaseTypeLabel;
  static getExerciseCategoryColor = ExtendedCodingPlatformService.getExerciseCategoryColor;
  static getExecutionEnvironmentColor = ExtendedCodingPlatformService.getExecutionEnvironmentColor;
  static requiresLanguage = ExtendedCodingPlatformService.requiresLanguage;
  static supportsDatasets = ExtendedCodingPlatformService.supportsDatasets;
  static getDefaultExecutionEnvironment = ExtendedCodingPlatformService.getDefaultExecutionEnvironment;
  static getCompatibleEnvironments = ExtendedCodingPlatformService.getCompatibleEnvironments;
  static getCompatibleTestcaseTypes = ExtendedCodingPlatformService.getCompatibleTestcaseTypes;
}

export default CodingPlatformAdapter;