// types/coding-plateform.ts - Extensions pour Data Analysts

// ================ NOUVEAUX ENUMS ================

export type ExerciseCategory = 'developer' | 'data_analyst';
export type ExecutionEnvironment = 'code_executor' | 'jupyter_notebook' | 'sql_database' | 'data_visualization' | 'file_analysis';
export type TestcaseType = 'unit_test' | 'sql_query_test' | 'visualization_test' | 'statistical_test' | 'notebook_cell_test';
export type DatasetType = 'csv' | 'json' | 'excel' | 'sqlite' | 'postgresql' | 'mysql' | 'parquet';

// Étendre ProgrammingLanguage pour les data analysts
export type ProgrammingLanguage = 'python' | 'javascript' | 'java' | 'cpp' | 'c' | 'sql' | 'r' | 'jupyter_python';

// ================ INTERFACES ÉTENDUES ================

export interface Exercise {
  id: string;
  created_by: string;
  title: string;
  description: string;
  category: ExerciseCategory; // 🆕 Nouveau
  language?: ProgrammingLanguage; // 🆕 Maintenant optionnel
  difficulty: ChallengeDifficulty;
  order_index: number;
  required_skills: string[]; // 🆕 Nouveau
  estimated_duration_minutes: number; // 🆕 Nouveau
  created_at: string;
  updated_at: string;
  challenge_count: number;
  dataset_count?: number; // 🆕 Nouveau
}

export interface Challenge {
  id: string;
  exercise_id: string;
  title: string;
  description: string;
  constraints?: string;
  tags: string[];
  status: ChallengeStatus;
  order_index: number;
  estimated_time_minutes: number;
  execution_environment: ExecutionEnvironment; // 🆕 Nouveau
  environment_config: Record<string, any>; // 🆕 Nouveau
  created_at: string;
  updated_at: string;
  step_count: number;
  steps?: ChallengeStep[];
}

export interface ChallengeStep {
  id: string;
  challenge_id: string;
  title: string;
  instructions: string;
  hint?: string;
  starter_code?: string;
  solution_code?: string;
  notebook_template?: string; // 🆕 Nouveau
  sql_schema?: Record<string, any>; // 🆕 Nouveau
  expected_output_type?: string; // 🆕 Nouveau
  order_index: number;
  is_final_step: boolean;
  evaluation_criteria?: Record<string, any>; // 🆕 Nouveau
  testcases?: TestCase[];
  user_progress?: UserProgress;
}

export interface TestCase {
  id: string;
  step_id: string;
  testcase_type: TestcaseType; // 🆕 Nouveau
  input_data?: string;
  expected_output?: string;
  dataset_reference?: string; // 🆕 Nouveau
  sql_query_expected?: string; // 🆕 Nouveau
  expected_visualization?: Record<string, any>; // 🆕 Nouveau
  statistical_assertions?: Record<string, any>; // 🆕 Nouveau
  notebook_cell_output?: any;
  cell_type?: string;
  is_hidden: boolean;
  is_example: boolean;
  timeout_seconds: number;
  memory_limit_mb: number;
  numerical_tolerance?: number; // 🆕 Nouveau
  order_index: number;
}

export interface UserProgress {
  id: string;
  user_challenge_id: string;
  step_id: string;
  code?: string;
  language?: ProgrammingLanguage;
  notebook_content?: Record<string, any>; // 🆕 Nouveau
  sql_queries?: Record<string, any>; // 🆕 Nouveau
  analysis_results?: Record<string, any>; // 🆕 Nouveau
  visualizations?: Record<string, any>; // 🆕 Nouveau
  tests_passed: number;
  tests_total: number;
  is_completed: boolean;
  score?: number; // 🆕 Nouveau
  last_execution_result?: any;
  last_edited: string;
}

// ================ NOUVELLES INTERFACES ================

export interface ExerciseDataset {
  id: string;
  exercise_id: string;
  name: string;
  description?: string;
  dataset_type: DatasetType;
  file_path?: string;
  connection_string?: string;
  sample_data?: Record<string, any>;
  schema_definition?: Record<string, any>;
  size_mb: number;
  row_count: number;
  created_at: string;
}

export interface DatasetFormData {
  name: string;
  description?: string;
  dataset_type: DatasetType;
  file_path?: string;
  connection_string?: string;
  sample_data?: Record<string, any>;
  schema_definition?: Record<string, any>;
}

// ================ FORM DATA ÉTENDUS ================

export interface ExerciseFormData {
  title: string;
  description?: string;
  category: ExerciseCategory; // 🆕 Nouveau
  language?: ProgrammingLanguage; // 🆕 Maintenant optionnel
  difficulty: ChallengeDifficulty;
  order_index?: number;
  required_skills?: string[]; // 🆕 Nouveau
  estimated_duration_minutes?: number; // 🆕 Nouveau
}

export interface ChallengeFormData {
  exercise_id: string;
  title: string;
  description: string;
  constraints?: string;
  tags?: string[];
  status?: ChallengeStatus;
  order_index?: number;
  estimated_time_minutes?: number;
  execution_environment?: ExecutionEnvironment; // 🆕 Nouveau
  environment_config?: Record<string, any>; // 🆕 Nouveau
}

export interface ChallengeStepFormData {
  title: string;
  instructions: string;
  hint?: string;
  starter_code?: string;
  solution_code?: string;
  notebook_template?: string; // 🆕 Nouveau
  sql_schema?: Record<string, any>; // 🆕 Nouveau
  expected_output_type?: string; // 🆕 Nouveau
  order_index?: number;
  is_final_step?: boolean;
  evaluation_criteria?: Record<string, any>; // 🆕 Nouveau
}

export interface TestCaseFormData {
  testcase_type?: TestcaseType; // 🆕 Nouveau
  input_data?: string;
  expected_output?: string;
  dataset_reference?: string; // 🆕 Nouveau
  sql_query_expected?: string; // 🆕 Nouveau
  expected_visualization?: Record<string, any>; // 🆕 Nouveau
  statistical_assertions?: Record<string, any>; // 🆕 Nouveau
  notebook_cell_output?: any; // string JSON ou objet
  notebook_cell_output_raw?: string; // Version string pour l'édition
  cell_type?: 'code' | 'markdown' | 'raw';

  is_hidden?: boolean;
  is_example?: boolean;
  timeout_seconds?: number;
  memory_limit_mb?: number;
  numerical_tolerance?: number; // 🆕 Nouveau
  order_index?: number;
}

export interface NotebookCellOutput {
  output_type: 'execute_result' | 'display_data' | 'stream' | 'error';
  data?: {
    'text/plain'?: string;
    'text/html'?: string;
    'image/png'?: string;
    'application/json'?: any;
  };
  metadata?: any;
  text?: string; // Pour les sorties de type 'stream'
  name?: string; // Pour les sorties de type 'stream'
  ename?: string; // Pour les erreurs
  evalue?: string; // Pour les erreurs
  traceback?: string[]; // Pour les erreurs
  }

// ================ SOUMISSIONS ÉTENDUES ================

export interface ExtendedSubmissionData {
  content: string | Record<string, any>;
  content_type: 'code' | 'sql' | 'notebook' | 'visualization' | 'analysis'; // 🆕 Nouveau
  language?: ProgrammingLanguage;
}

export interface ExtendedExecutionResult {
  testcase_id: string;
  testcase_type: TestcaseType; // 🆕 Nouveau
  passed: boolean;
  is_hidden: boolean;
  execution_time?: number;
  memory_used?: number;
  // Résultats spécifiques selon le type
  input?: string;
  expected_output?: string;
  actual_output?: string;
  error?: string;
  dataset_reference?: string;
  result_rows?: number;
  columns?: string[];
  visualization_type?: string;
  data_points?: number;
  analysis_results?: Record<string, any>;
}

// ================ TYPES UTILS ================

export interface ChallengeContext {
  challenge: Challenge;
  execution_environment: ExecutionEnvironment;
  environment_config: Record<string, any>;
  exercise_category: ExerciseCategory;
  datasets?: ExerciseDataset[];
  user_progress?: UserChallenge;
}

export interface AvailableTypes {
  exercise_categories: ExerciseCategory[];
  execution_environments: ExecutionEnvironment[];
  testcase_types: TestcaseType[];
  programming_languages: ProgrammingLanguage[];
  dataset_types: DatasetType[];
}

// ================ ANCIENNES INTERFACES PRÉSERVÉES ================

export interface UserChallenge {
  id: string;
  user_id?: string;
  challenge_id: string;
  current_step_id?: string;
  status: UserChallengeStatus;
  attempt_count: number;
  started_at: string;
  completed_at?: string;
  session_token: string;
  anonymous_identifier?: string;
  session_metadata?: Record<string, any>; // 🆕 Nouveau
  is_anonymous: boolean;
}

export interface ExecutionResult {
  testcase_id: string;
  input: string;
  expected_output: string;
  actual_output: string;
  passed: boolean;
  error?: string;
  execution_time?: number;
  memory_used?: number;
  status: string;
  is_hidden: boolean;
}

export interface SubmissionResponse {
  execution_results: ExecutionResult[] | ExtendedExecutionResult[];
  summary: {
    passed: number;
    total: number;
    success_rate: number;
    all_passed: boolean;
  };
  step_progress?: {
    step_id: string;
    is_completed: boolean;
    tests_passed: number;
    tests_total: number;
    score?: number;
  };
  user_progress?: UserProgress;
  user_challenge?: UserChallenge;
  next_step?: {
    id: string;
    title: string;
    order_index: number;
  };
}

// Garder les anciens types pour compatibilité
export interface CodeSubmissionData {
  code: string;
  language: ProgrammingLanguage;
}

export interface StartChallengeData {
  anonymous_identifier?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    per_page: number;
    pages: number;
  };
}

export interface ExercisesResponse extends PaginatedResponse<Exercise> {}
export interface ChallengesResponse extends PaginatedResponse<Challenge> {}

export interface ExerciseWithChallenges {
  exercise: Exercise;
  challenges: Challenge[];
}

export interface StartChallengeResponse {
  user_challenge: UserChallenge;
  session_token: string;
  message: string;
}

export interface AdminTestResponse {
  execution_results: ExecutionResult[] | ExtendedExecutionResult[];
  summary: {
    passed: number;
    total: number;
    success_rate: number;
    all_passed: boolean;
  };
  note?: string;
}

// export interface BulkTestCasesData {
//   testcases: TestCaseFormData[];
// }

// Types pour l'ancien système (préservés)
export type ChallengeDifficulty = 'beginner' | 'intermediate' | 'advanced' | 'expert';
export type ChallengeStatus = 'draft' | 'published' | 'archived';
export type UserChallengeStatus = 'not_started' | 'in_progress' | 'completed' | 'abandoned';


export interface BaseTestCaseData {
  testcase_type?: 'unit_test' | 'sql_query_test' | 'visualization_test' | 'statistical_test';
  is_hidden?: boolean;
  is_example?: boolean;
  timeout_seconds?: number;
  memory_limit_mb?: number;
  order_index?: number;
  numerical_tolerance?: number;
}

export interface UnitTestCaseData extends BaseTestCaseData {
  testcase_type: 'unit_test';
  input_data: any;
  expected_output: any;
}

export interface SqlQueryTestCaseData extends BaseTestCaseData {
  testcase_type: 'sql_query_test';
  dataset_reference: string;
  sql_query_expected: string;
}

export  interface VisualizationTestCaseData extends BaseTestCaseData {
  testcase_type: 'visualization_test';
  expected_visualization: any;
}

export interface StatisticalTestCaseData extends BaseTestCaseData {
  testcase_type: 'statistical_test';
  statistical_assertions: any;
}




export interface TestCaseData {
  testcase_type?: TestcaseType;
  input_data?: any;
  expected_output?: any;
  dataset_reference?: string;
  sql_query_expected?: string;
  expected_visualization?: any;
  statistical_assertions?: any;
  numerical_tolerance?: number;
  notebook_cell_output?: {
    output_type: string;
    data: Record<string, any>;
    metadata: Record<string, any>;
  };
  cell_type?: 'code' | 'markdown' | 'raw';
  is_hidden?: boolean;
  is_example?: boolean;
  timeout_seconds?: number;
  memory_limit_mb?: number;
  order_index?: number;
}

export interface BulkTestCasesData {
  testcases: TestCaseData[];
}

export interface BulkTestCasesResponse {
  message: string;
  testcases: any[];
  errors?: string[];
}