// Service pour le dashboard
import api from './api';

export interface DashboardStats {
  total_interviews: number;
  pending_reviews: number;
  completed_today: number;
  scheduled_this_week: number;
  total_candidates: number;
  active_positions: number;
  success_rate: number;
  average_interview_duration: number;
}

export interface Interview {
  id: number;
  candidate_name: string;
  position: string;
  date: string;
  status: 'completed' | 'in_progress' | 'pending_review' | 'scheduled';
  score?: number;
  interviewer: string;
  type?: 'technical' | 'behavioral' | 'case_study';
}

export interface PerformanceMetrics {
  weekly_interviews: Array<{ week: string; count: number }>;
  success_by_position: Array<{ position: string; success_rate: number }>;
  interview_duration_trend: Array<{ date: string; avg_duration: number }>;
}

export interface Alert {
  id: number;
  type: 'warning' | 'info' | 'success' | 'error';
  message: string;
  created_at: string;
}

export interface DashboardData {
  stats: DashboardStats;
  recent_interviews: Interview[];
  upcoming_interviews: Interview[];
  performance_metrics: PerformanceMetrics;
  alerts: Alert[];
}

class DashboardService {
  private readonly BASE_URL = '/api/dashboard';

  /**
   * Récupérer toutes les données du dashboard
   */
  async getDashboardData(): Promise<{ success: boolean; data: DashboardData }> {
    try {
      const response = await api.get(this.BASE_URL);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des données du dashboard:', error);
      throw error;
    }
  }

  /**
   * Récupérer uniquement les statistiques
   */
  async getStats(): Promise<{ success: boolean; data: DashboardStats }> {
    try {
      const response = await api.get(`${this.BASE_URL}/stats`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      throw error;
    }
  }

  /**
   * Récupérer les entretiens récents
   */
  async getRecentInterviews(limit = 10): Promise<{ success: boolean; data: Interview[] }> {
    try {
      const response = await api.get(`${this.BASE_URL}/recent-interviews?limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des entretiens récents:', error);
      throw error;
    }
  }

  /**
   * Récupérer les entretiens à venir
   */
  async getUpcomingInterviews(limit = 10): Promise<{ success: boolean; data: Interview[] }> {
    try {
      const response = await api.get(`${this.BASE_URL}/upcoming-interviews?limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des entretiens à venir:', error);
      throw error;
    }
  }

  /**
   * Récupérer les métriques de performance
   */
  async getPerformanceMetrics(): Promise<{ success: boolean; data: PerformanceMetrics }> {
    try {
      const response = await api.get(`${this.BASE_URL}/performance`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des métriques:', error);
      throw error;
    }
  }

  /**
   * Récupérer les alertes
   */
  async getAlerts(): Promise<{ success: boolean; data: Alert[] }> {
    try {
      const response = await api.get(`${this.BASE_URL}/alerts`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des alertes:', error);
      throw error;
    }
  }
}

export default new DashboardService();