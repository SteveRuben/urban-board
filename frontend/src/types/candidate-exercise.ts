import { UserExerciseSession } from "./interview-scheduling";

export interface CandidateExerciseData {
    session: UserExerciseSession & {
      interview_info?: {
        title: string;
        scheduled_at: string;
        recruiter_name: string;
      };
    };
    exercises: Array<{
      id: string;
      title: string;
      description?: string;
      language: string;
      difficulty: string;
      challenges: Array<{
        id: string;
        title: string;
        description: string;
        step_count: number;
      }>;
    }>;
    access_info: {
      time_remaining_minutes: number;
      can_start: boolean;
      attempts_remaining: number;
    };
  }
  
  export interface CandidateProgress {
    session: UserExerciseSession;
    time_remaining_minutes: number;
    can_continue: boolean;
    progress_percentage: number;
    session_active: boolean;
  }