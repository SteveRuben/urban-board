// types/coding-platform.ts - Version unifiée complète avec Business Analyst

// ================ ENUMS UNIFIÉS ================

export type ExerciseCategory = 'developer' | 'data_analyst' | 'business_analyst' | 'secretary' | 'accountant'; // NOUVEAU
export type ExecutionEnvironment = 'code_executor' | 'jupyter_notebook' | 'sql_database' | 'data_visualization' | 'file_analysis' | 'diagram_editor' | 'text_editor' | 'spreadsheet_editor'; 
export type TestcaseType = 'unit_test' 
| 'sql_query_test'
| 'visualization_test' 
| 'statistical_test' 
| 'notebook_cell_test' 
| 'process_diagram' 
| 'use_case_diagram' 
| 'sequence_diagram' 
| 'class_diagram' 
| 'activity_diagram' 
| 'flowchart' 
| 'wireframe'  
| 'text_formatting_test'
| 'spelling_grammar_test'
| 'document_structure_test'
| 'correspondence_test'
| 'proofreading_test'
| 'accounting_calculation_test'
| 'financial_analysis_test'
| 'budget_validation_test'
| 'balance_sheet_test'
| 'tax_calculation_test'
| 'audit_trail_test';; // NOUVEAU
export type DatasetType = 'csv' | 'json' | 'excel' | 'sqlite' | 'postgresql' | 'mysql' | 'parquet';
export type DocumentFormat = 'word' | 'pdf' | 'plain_text' | 'html' | 'markdown' | 'rtf';

export type FinancialDocumentType = 
  | 'balance_sheet' 
  | 'income_statement' 
  | 'cash_flow' 
  | 'budget' 
  | 'invoice' 
  | 'expense_report' 
  | 'tax_return';
// Étendre ProgrammingLanguage pour les data analysts
export type ProgrammingLanguage = 'python' | 'javascript' | 'java' | 'cpp' | 'c' | 'sql' | 'r' | 'jupyter_python';

// ================ NOUVEAUX TYPES BUSINESS ANALYST ================

export type DiagramType = 'uml_use_case' | 'uml_sequence' | 'uml_class' | 'uml_activity' | 'bpmn_process' | 'flowchart' | 'wireframe' | 'entity_relationship' | 'mockup';
export type DiagramFormat = 'staruml' | 'drawio' | 'svg' | 'png' | 'json';

// ================ INTERFACES ÉTENDUES ================

export interface Exercise {
  id: string;
  created_by: string;
  title: string;
  description: string;
  category: ExerciseCategory;
  language?: ProgrammingLanguage;
  difficulty: ChallengeDifficulty;
  order_index: number;
  required_skills: string[];
  estimated_duration_minutes: number;
  business_domain?: string; // NOUVEAU pour business analyst
  created_at: string;
  updated_at: string;
  challenge_count: number;
  dataset_count?: number;
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
  execution_environment: ExecutionEnvironment;
  environment_config: Record<string, any>;
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
  
  // Data Analyst
  notebook_template?: string;
  sql_schema?: Record<string, any>;
  expected_output_type?: string;
  
  // Business Analyst - NOUVEAU
  diagram_template?: string;
  diagram_type?: DiagramType;
  diagram_format?: DiagramFormat;
  business_requirements?: Record<string, any>;
  
  document_template?: string;
  document_format?: DocumentFormat;
  text_requirements?: Record<string, any>;
  formatting_rules?: Record<string, any>;
  
  // NOUVEAUX champs pour comptables
  financial_template?: string;
  financial_document_type?: FinancialDocumentType;
  accounting_rules?: Record<string, any>;
  calculation_parameters?: Record<string, any>;
  order_index: number;
  is_final_step: boolean;
  evaluation_criteria?: Record<string, any>;
  testcases?: TestCase[];
  user_progress?: UserProgress;
}

export interface TestCase {
  id: string;
  step_id: string;
  testcase_type: TestcaseType;
  
  // Code classique
  input_data?: string;
  expected_output?: string;
  
  // Data Analyst
  dataset_reference?: string;
  sql_query_expected?: string;
  expected_visualization?: Record<string, any>;
  statistical_assertions?: Record<string, any>;
  notebook_cell_output?: any;
  cell_type?: string;
  
  // Business Analyst - NOUVEAU
  diagram_requirements?: Record<string, any>;
  evaluation_rubric?: Record<string, any>;
  
  is_hidden: boolean;
  is_example: boolean;
  timeout_seconds: number;
  memory_limit_mb: number;
  numerical_tolerance?: number;
  order_index: number;
}

export interface UserProgress {
  id: string;
  user_challenge_id: string;
  step_id: string;
  code?: string;
  language?: ProgrammingLanguage;
  
  // Data Analyst
  notebook_content?: Record<string, any>;
  sql_queries?: Record<string, any>;
  analysis_results?: Record<string, any>;
  visualizations?: Record<string, any>;
  
  // Business Analyst - NOUVEAU
  diagram_content?: Record<string, any>;
  diagram_metadata?: Record<string, any>;
  
  tests_passed: number;
  tests_total: number;
  is_completed: boolean;
  score?: number;
  last_execution_result?: any;
  last_edited: string;
}

// ================ FORM DATA ÉTENDUS ================

export interface ExerciseFormData {
  title: string;
  description?: string;
  category: ExerciseCategory;
  language?: ProgrammingLanguage;
  difficulty: ChallengeDifficulty;
  order_index?: number;
  required_skills?: string[];
  estimated_duration_minutes?: number;
  business_domain?: string; // NOUVEAU
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
  execution_environment?: ExecutionEnvironment;
  environment_config?: Record<string, any>;
}

export interface ChallengeStepFormData {
  title: string;
  instructions: string;
  hint?: string;
  starter_code?: string;
  solution_code?: string;
  
  // Data Analyst
  notebook_template?: string;
  sql_schema?: Record<string, any>;
  expected_output_type?: string;
  
  // Business Analyst - NOUVEAU
  diagram_template?: string;
  diagram_type?: DiagramType;
  diagram_format?: DiagramFormat;
  business_requirements?: Record<string, any>;
  
  order_index?: number;
  is_final_step?: boolean;
  evaluation_criteria?: Record<string, any>;

  // NOUVEAUX champs pour secrétaires
  document_template?: string;
  document_format?: DocumentFormat;
  text_requirements?: Record<string, any>;
  formatting_rules?: Record<string, any>;
  
  // NOUVEAUX champs pour comptables
  financial_template?: string;
  financial_document_type?: FinancialDocumentType;
  accounting_rules?: Record<string, any>;
  calculation_parameters?: Record<string, any>;
}

export interface TestCaseFormData {
  testcase_type?: TestcaseType;
  
  // Code classique
  input_data?: string;
  expected_output?: string;
  
  // Data Analyst
  dataset_reference?: string;
  sql_query_expected?: string;
  expected_visualization?: Record<string, any>;
  statistical_assertions?: Record<string, any>;
  notebook_cell_output?: any;
  notebook_cell_output_raw?: string;
  cell_type?: 'code' | 'markdown' | 'raw';
  
  // Business Analyst - NOUVEAU
  diagram_requirements?: Record<string, any>;
  evaluation_rubric?: Record<string, any>;
  
  is_hidden?: boolean;
  is_example?: boolean;
  timeout_seconds?: number;
  memory_limit_mb?: number;
  numerical_tolerance?: number;
  order_index?: number;

  expected_document_structure?: Record<string, any>;
  text_quality_criteria?: Record<string, any>;
  formatting_validation?: Record<string, any>;
  
  // NOUVEAUX champs pour tests comptables
  expected_financial_result?: Record<string, any>;
  accounting_validation_rules?: Record<string, any>;
  calculation_steps?: Record<string, any>;
}

// ================ SOUMISSIONS ÉTENDUES ================

export interface ExtendedSubmissionData {
  content: string | Record<string, any>;
  content_type: 'code' | 'sql' | 'notebook' | 'visualization' | 'analysis' | 'diagram' | 'text' | 'spreadsheet'; // NOUVEAU
  language?: ProgrammingLanguage;
  
  // Business Analyst - NOUVEAU
  diagram_format?: DiagramFormat;
  diagram_metadata?: Record<string, any>;
}

// ================ TYPES UTILS ================

export interface AvailableTypes {
  exercise_categories: ExerciseCategory[];
  execution_environments: ExecutionEnvironment[];
  testcase_types: TestcaseType[];
  programming_languages: ProgrammingLanguage[];
  dataset_types: DatasetType[];
  diagram_types: DiagramType[]; // NOUVEAU
  diagram_formats: DiagramFormat[]; // NOUVEAU
}

// ================ INTERFACES PRÉSERVÉES ================

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
  session_metadata?: Record<string, any>;
  is_anonymous: boolean;
}

export interface ChallengeContext {
  challenge: Challenge;
  execution_environment: ExecutionEnvironment;
  environment_config: Record<string, any>;
  exercise_category: ExerciseCategory;
  datasets?: ExerciseDataset[];
  user_progress?: UserChallenge;
}

export interface ExtendedExecutionResult {
  testcase_id: string;
  testcase_type: TestcaseType;
  passed: boolean;
  is_hidden: boolean;
  execution_time?: number;
  memory_used?: number;
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
  
  // Business Analyst - NOUVEAU
  requires_manual_review?: boolean;
  diagram_stored?: boolean;
  message?: string;
}

export interface SubmissionResponse {
  execution_results: ExtendedExecutionResult[];
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

// ================ TEST CASE DATA TYPES ================

export interface BaseTestCaseData {
  testcase_type?: TestcaseType;
  is_hidden?: boolean;
  is_example?: boolean;
  timeout_seconds?: number;
  memory_limit_mb?: number;
  order_index?: number;
  numerical_tolerance?: number;
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
  
  // Business Analyst - NOUVEAU
  diagram_requirements?: Record<string, any>;
  evaluation_rubric?: Record<string, any>;
  
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

// ================ ANCIENNES INTERFACES PRÉSERVÉES ================

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

// Types pour l'ancien système (préservés)
export type ChallengeDifficulty = 'beginner' | 'intermediate' | 'advanced' | 'expert';
export type ChallengeStatus = 'draft' | 'published' | 'archived';
export type UserChallengeStatus = 'not_started' | 'in_progress' | 'completed' | 'abandoned';