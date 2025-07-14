interface ExerciseResult {
  exercise: {
    id: string;
    title: string;
    description: string;
    language: string;
    difficulty: string;
  };
  challenges_results: ChallengeResult[];
}

interface ChallengeResult {
  challenge: {
    id: string;
    title: string;
    description: string;
    step_count: number;
  };
  user_challenge: {
    id: string;
    status: string;
    attempt_count: number;
    started_at: string;
    completed_at?: string;
  };
  steps_progress: StepProgress[];
}

interface StepProgress {
  id: string;
  step_id: string;
  code: string;
  language: string;
  is_completed: boolean;
  tests_passed: number;
  tests_total: number;
  last_execution_result: any;
  last_edited: string;
}

interface CodingResults {
  user_exercise: {
    id: string;
    candidate_name: string;
    candidate_email: string;
    position: string;
    status: string;
    total_score: number;
    exercises_completed: number;
    total_exercises: number;
    time_limit_minutes: number;
    started_at?: string;
    completed_at?: string;
    interview_info: {
      title: string;
      scheduled_at: string;
      recruiter_name: string;
    };
  };
  detailed_results: ExerciseResult[];
}

