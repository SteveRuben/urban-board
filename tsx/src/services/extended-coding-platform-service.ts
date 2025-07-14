// services/extended-coding-platform-service.ts

import { 
    ExerciseCategory, ExecutionEnvironment, TestcaseType, DatasetType,
    ExerciseDataset, DatasetFormData, ExtendedSubmissionData, ChallengeContext, AvailableTypes,
    ExtendedExecutionResult, SubmissionResponse,
    BaseTestCaseData,
    StatisticalTestCaseData,
    VisualizationTestCaseData,
    SqlQueryTestCaseData,
    UnitTestCaseData,
    BulkTestCasesData,
    TestCaseData,
    BulkTestCasesResponse,
    TestCase,
    TestCaseFormData
  } from '@/types/coding-plateform';
  import { api } from './user-service';
  import axios from 'axios';
  
  /**
   * Extension du CodingPlatformService pour les Data Analysts
   * Ajoute les fonctionnalités SQL, Jupyter, Visualisation, etc.
   */
  export class ExtendedCodingPlatformService {
    private static readonly BASE_URL = '/coding';
  
    // =============================================================================
    // ADMIN ROUTES - EXERCICES ÉTENDUS
    // =============================================================================
  
    /**
     * Récupère les exercices avec support des catégories
     */
    static async getExercisesExtended(params: {
      page?: number;
      per_page?: number;
      category?: ExerciseCategory;
      language?: string;
      difficulty?: string;
    }) {
      try {
        const queryParams = new URLSearchParams();
        if (params.page) queryParams.append('page', params.page.toString());
        if (params.per_page) queryParams.append('per_page', params.per_page.toString());
        if (params.category) queryParams.append('category', params.category);
        if (params.language) queryParams.append('language', params.language);
        if (params.difficulty) queryParams.append('difficulty', params.difficulty);
  
        const response = await api.get(`${this.BASE_URL}/admin/exercises?${queryParams.toString()}`);
        return response.data;
      } catch (error) {
        console.error('Erreur lors de la récupération des exercices étendus:', error);
        throw new Error('Erreur lors de la récupération des exercices');
      }
    }
  
    /**
     * Crée un exercice (développeur ou data analyst)
     */
    static async createExerciseExtended(data: any) {
      try {
        console.log("ExtendedService: Création exercice", { category: data.category, title: data.title });
  
        const response = await api.post(`${this.BASE_URL}/admin/exercises`, data, {
          headers: { 'Content-Type': 'application/json' },
        });
  
        return response.data;
      } catch (error) {
        console.error('Erreur lors de la création de l\'exercice étendu:', error);
        throw new Error('Erreur lors de la création de l\'exercice');
      }
    }
  
    // =============================================================================
    // ADMIN ROUTES - GESTION DATASETS
    // =============================================================================
  
    /**
     * Crée un dataset pour un exercice d'analyse de données
     */
    static async createExerciseDataset(exerciseId: string, data: DatasetFormData): Promise<ExerciseDataset> {
      try {
        console.log("ExtendedService: Création dataset", { exerciseId, name: data.name });
  
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
    // ADMIN ROUTES - CHALLENGES ÉTENDUS
    // =============================================================================
  
    /**
     * Crée un challenge avec environnement d'exécution
     */
    static async createChallengeExtended(data: any) {
      try {
        console.log("ExtendedService: Création challenge", { 
          title: data.title, 
          execution_environment: data.execution_environment 
        });
  
        const response = await api.post(`${this.BASE_URL}/admin/challenges`, data, {
          headers: { 'Content-Type': 'application/json' },
        });
  
        return response.data;
      } catch (error) {
        console.error('Erreur lors de la création du challenge étendu:', error);
        throw new Error('Erreur lors de la création du challenge');
      }
    }
  
    /**
     * Crée une étape de challenge avec support étendu
     */
    static async createChallengeStepExtended(challengeId: string, data: any) {
      try {
        console.log("ExtendedService: Création étape", { challengeId, title: data.title });
  
        const response = await api.post(`${this.BASE_URL}/admin/challenges/${challengeId}/steps`, data, {
          headers: { 'Content-Type': 'application/json' },
        });
  
        return response.data;
      } catch (error) {
        console.error('Erreur lors de la création de l\'étape étendue:', error);
        throw new Error('Erreur lors de la création de l\'étape');
      }
    }
  
    // =============================================================================
    // ADMIN ROUTES - CAS DE TEST ÉTENDUS
    // =============================================================================
  
    // /**
    //  * Crée un cas de test avec support des types étendus
    //  */
    // static async createTestCaseExtended(stepId: string, data: any) {
    //   try {
    //     console.log("ExtendedService: Création cas de test", { 
    //       stepId, 
    //       testcase_type: data.testcase_type 
    //     });
  
    //     const response = await api.post(`${this.BASE_URL}/admin/steps/${stepId}/testcases`, data, {
    //       headers: { 'Content-Type': 'application/json' },
    //     });
  
    //     return response.data;
    //   } catch (error) {
    //     console.error('Erreur lors de la création du cas de test étendu:', error);
    //     throw new Error('Erreur lors de la création du cas de test');
    //   }
    // }
  
    // /**
    //  * Import en lot de cas de test étendus
    //  */
    // static async bulkImportTestCasesExtended(stepId: string, data: { testcases: any[] }) {
    //   try {
    //     console.log("ExtendedService: Import en lot", { stepId, count: data.testcases.length });
  
    //     const response = await api.post(`${this.BASE_URL}/admin/steps/${stepId}/testcases/bulk`, data, {
    //       headers: { 'Content-Type': 'application/json' },
    //     });
  
    //     return response.data;
    //   } catch (error) {
    //     console.error('Erreur lors de l\'import en lot étendu:', error);
    //     throw new Error('Erreur lors de l\'import des cas de test');
    //   }
    // }
       /**
   * Crée un nouveau cas de test (Admin)
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
      
        // 🔧 Ajouter les champs spécifiques au notebook_cell_test
        if (formData.testcase_type === 'notebook_cell_test') {
          (baseData as any).notebook_cell_output = formData.notebook_cell_output;
          (baseData as any).cell_type = formData.cell_type;
        }
      
        return baseData;
      }
    
      /**
       * Crée un nouveau cas de test (Admin)
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
       * Import en lot de cas de test (Admin) - Compatible avec votre interface
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
       * Valide les données des cas de test avant envoi
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
            case 'notebook_cell_test': // 🆕 Nouveau type supporté
              if (!tc.notebook_cell_output) {
                errors.push(`Cas de test ${index + 1}: notebook_cell_output est requis pour les tests de cellule notebook`);
              }
              break;  
            default:
              errors.push(`Cas de test ${index + 1}: Type de test non supporté: ${testcaseType}`);
          }
        });
    
        return errors;
      }
    // =============================================================================
    // PUBLIC ROUTES - SOUMISSION ÉTENDUES
    // =============================================================================
  
    /**
     * Soumet une solution (code, SQL, notebook, visualisation)
     */
    static async submitSolutionExtended(
      challengeId: string, 
      stepId: string, 
      accessToken: string,
      data: ExtendedSubmissionData
    ): Promise<SubmissionResponse> {
      try {
        console.log("ExtendedService: Soumission solution", { 
          challengeId, 
          stepId, 
          content_type: data.content_type 
        });
  
        const response = await axios.post(
          `/api/${this.BASE_URL}/${accessToken}/challenges/${challengeId}/steps/${stepId}/submit`,
          data,
          { headers: { 'Content-Type': 'application/json' } }
        );
  
        return response.data;
      } catch (error) {
        console.error('Erreur lors de la soumission étendue:', error);
        throw new Error('Erreur lors de la soumission de la solution');
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
        console.log("ExtendedService: Récupération contexte", { challengeId });
  
        const response = await axios.get(`/api/${this.BASE_URL}/challenges/${challengeId}/context`);
        return response.data;
      } catch (error) {
        console.error('Erreur lors de la récupération du contexte:', error);
        throw new Error('Erreur lors de la récupération du contexte');
      }
    }
  
    /**
     * Récupère tous les types disponibles pour l'interface
     */
    static async getAvailableTypes(): Promise<AvailableTypes> {
      try {
        const response = await axios.get(`/api/${this.BASE_URL}/meta/types`);
        return response.data;
      } catch (error) {
        console.error('Erreur lors de la récupération des types:', error);
        throw new Error('Erreur lors de la récupération des types');
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
    // UTILITAIRES ÉTENDUS
    // =============================================================================
  
    /**
     * Labels pour les catégories d'exercices
     */
    static getExerciseCategoryLabel(category: ExerciseCategory): string {
      const labels = {
        'developer': 'Développeur',
        'data_analyst': 'Analyste de données'
      };
      return labels[category] || category;
    }
  
    /**
     * Labels pour les environnements d'exécution
     */
    static getExecutionEnvironmentLabel(environment: ExecutionEnvironment): string {
      const labels = {
        'code_executor': 'Exécution de code',
        'sql_database': 'Base de données SQL',
        'jupyter_notebook': 'Notebook Jupyter',
        'data_visualization': 'Visualisation de données',
        'file_analysis': 'Analyse de fichiers'
      };
      return labels[environment] || environment;
    }
  
    /**
     * Labels pour les types de cas de test
     */
    static getTestcaseTypeLabel(type: TestcaseType): string {
      const labels = {
        'unit_test': 'Test unitaire',
        'sql_query_test': 'Test de requête SQL',
        'visualization_test': 'Test de visualisation',
        'statistical_test': 'Test statistique',
        'notebook_cell_test': 'Test de cellule notebook'
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
     * Couleurs pour les catégories d'exercices
     */
    static getExerciseCategoryColor(category: ExerciseCategory): string {
      const colors = {
        'developer': '#3b82f6', // blue
        'data_analyst': '#10b981' // emerald
      };
      return colors[category] || '#6b7280';
    }
  
    /**
     * Couleurs pour les environnements d'exécution
     */
    static getExecutionEnvironmentColor(environment: ExecutionEnvironment): string {
      const colors = {
        'code_executor': '#3b82f6',
        'sql_database': '#059669',
        'jupyter_notebook': '#f59e0b',
        'data_visualization': '#8b5cf6',
        'file_analysis': '#ef4444'
      };
      return colors[environment] || '#6b7280';
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
     * Obtient l'environnement d'exécution par défaut selon la catégorie
     */
    static getDefaultExecutionEnvironment(category: ExerciseCategory): ExecutionEnvironment {
      const defaults = {
        'developer': 'code_executor',
        'data_analyst': 'jupyter_notebook'
      };
      return defaults[category] as ExecutionEnvironment;
    }
  
    /**
     * Obtient les environnements compatibles avec une catégorie
     */
    static getCompatibleEnvironments(category: ExerciseCategory): ExecutionEnvironment[] {
      const compatible = {
        'developer': ['code_executor'],
        'data_analyst': ['sql_database', 'jupyter_notebook', 'data_visualization', 'file_analysis']
      };
      return compatible[category] as ExecutionEnvironment[];
    }
  
    /**
     * Obtient les types de cas de test compatibles avec un environnement
     */
    static getCompatibleTestcaseTypes(environment: ExecutionEnvironment): TestcaseType[] {
      const compatible = {
        'code_executor': ['unit_test'],
        'sql_database': ['sql_query_test'],
        'jupyter_notebook': ['notebook_cell_test',  'statistical_test', 'visualization_test', 'unit_test'],
        'data_visualization': ['visualization_test'],
        'file_analysis': ['statistical_test']
      };
      return compatible[environment] as TestcaseType[];
    }
  
    /**
     * Valide les données de soumission étendue
     */
    static validateExtendedSubmission(data: ExtendedSubmissionData): Record<string, string> {
      const errors: Record<string, string> = {};
  
      if (!data.content) {
        errors.content = 'Le contenu est requis';
      }
  
      if (!data.content_type) {
        errors.content_type = 'Le type de contenu est requis';
      }
  
      const validContentTypes = ['code', 'sql', 'notebook', 'visualization', 'analysis'];
      if (data.content_type && !validContentTypes.includes(data.content_type)) {
        errors.content_type = 'Type de contenu non supporté';
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
  
      return errors;
    }
  
    /**
     * Formate le score de performance
     */
    static formatScore(score?: number): string {
      if (score === undefined || score === null) return 'N/A';
      return `${Math.round(score)}/100`;
    }
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
        default:
          return '⚡';
      }
    }

  }
  
  export default ExtendedCodingPlatformService;