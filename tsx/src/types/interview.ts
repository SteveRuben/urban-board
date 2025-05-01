// Définition des types

export interface Interview {
  id: string;
  candidate_name: string;
  job_role: string;
  date: string;
  score?: number| null;
  status: InterviewStatus;
  skills: Skill | null;
  created_at: string;
  scheduled_time?: string;
  started_at?: string;
  completed_at?: string;
}

export type TimeRangeType = 'week' | 'month' | 'quarter' | 'year';
export type InterviewStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';


export interface GetInterviewsFilters {
  status?: InterviewStatus;
  search?: string;
  [key: string]: any;
}
export interface Skill {
  [key: string]: number;
}

export interface OverviewData {
  totalInterviews: number;
  completedInterviews: number;
  scheduledInterviews: number;
  inProgressInterviews: number;
  averageScore: number;
}

export interface StatusChartData {
  name: string;
  value: number;
}

export interface JobPositionData {
  name: string;
  value: number;
}

export interface CandidateScoreData {
  name: string;
  score: number;
  position: string;
}

export interface SkillHeatmapData {
  position: string;
  skill: string;
  score: number;
}

export interface DashboardData {
  overview: OverviewData;
  recentInterviews: Interview[];
  interviewsByStatus: StatusChartData[];
  jobPositionData: JobPositionData[];
  candidateScoreData: CandidateScoreData[];
  skillsHeatmapData: SkillHeatmapData[];
}
