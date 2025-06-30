
export interface Exercise {
  id: string;
  created_by: string;
  title: string;
  description: string;
  language: ProgrammingLanguage;
  difficulty: ChallengeDifficulty;
  order_index: number;
  created_at: string;
  updated_at: string;
  challenge_count: number;
}

export interface Challenge {
  id: string;
  exercise_id: string;
  created_by: string;
  title: string;
  description: string;
  constraints?: string;
  tags: string[];
  status: ChallengeStatus;
  order_index: number;
  estimated_time_minutes: number;
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
  order_index: number;
  is_final_step: boolean;
  testcases?: TestCase[];
  user_progress?: UserProgress;
}

export interface TestCase {
  id: string;
  step_id: string;
  input_data: string;
  expected_output: string;
  is_hidden: boolean;
  is_example: boolean;
  timeout_seconds: number;
  memory_limit_mb: number;
  order_index: number;
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
  is_anonymous: boolean;
}

export interface UserProgress {
  id: string;
  user_challenge_id: string;
  step_id: string;
  code: string;
  language: ProgrammingLanguage;
  tests_passed: number;
  tests_total: number;
  is_completed: boolean;
  last_execution_result?: any;
  last_edited: string;
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
  execution_results: ExecutionResult[];
  summary: {
    passed: number;
    total: number;
    success_rate: number;
    all_passed: boolean;
  };
  user_progress: UserProgress;
  user_challenge: UserChallenge;
  next_step?: {
    id: string;
    title: string;
    order_index: number;
  };
}

// Enums
export type ProgrammingLanguage = 'python' | 'javascript' | 'java' | 'cpp' | 'c';
export type ChallengeDifficulty = 'beginner' | 'intermediate' | 'advanced' | 'expert';
export type ChallengeStatus = 'draft' | 'published' | 'archived';
export type UserChallengeStatus = 'not_started' | 'in_progress' | 'completed' | 'abandoned';

// Form Data Types
export interface ExerciseFormData {
  title: string;
  description?: string;
  language: ProgrammingLanguage;
  difficulty: ChallengeDifficulty;
  order_index?: number;
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
}

export interface ChallengeStepFormData {
  title: string;
  instructions: string;
  hint?: string;
  starter_code?: string;
  solution_code?: string;
  order_index?: number;
  is_final_step?: boolean;
}

export interface TestCaseFormData {
  input_data: string;
  expected_output: string;
  is_hidden?: boolean;
  is_example?: boolean;
  timeout_seconds?: number;
  memory_limit_mb?: number;
  order_index?: number;
}

export interface BulkTestCasesData {
  testcases: TestCaseFormData[];
}

export interface CodeSubmissionData {
  code: string;
  language: ProgrammingLanguage;
}

export interface StartChallengeData {
  anonymous_identifier?: string;
}

// Response Types
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
  execution_results: ExecutionResult[];
  summary: {
    passed: number;
    total: number;
    success_rate: number;
    all_passed: boolean;
  };
  note?: string;
}