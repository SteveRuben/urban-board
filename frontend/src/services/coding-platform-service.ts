// Service pour la plateforme de coding - Version simplifiée
import api from './api';

export interface Exercise {
  id: number;
  title: string;
  description: string;
  difficulty: 'facile' | 'moyen' | 'difficile';
  language: string;
  category: string;
  estimated_time: number;
  created_at: string;
  status: string;
}

export interface ExerciseFilters {
  difficulty?: string;
  language?: string;
  category?: string;
  page?: number;
  limit?: number;
}

export interface ExerciseResponse {
  success: boolean;
  data: {
    exercises: Exercise[];
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
}

export interface CreateExerciseData {
  title: string;
  description: string;
  difficulty: 'facile' | 'moyen' | 'difficile';
  language: string;
  category: string;
  estimated_time?: number;
}

export interface ExecuteCodeData {
  code: string;
  language: string;
  test_cases?: any[];
}

export interface ExecuteCodeResponse {
  success: boolean;
  data: {
    output: string;
    execution_time: number;
    memory_usage: string;
    status: string;
    test_results: Array<{
      test_case: number;
      passed: boolean;
      expected: string;
      actual: string;
    }>;
  };
}

export interface StatsResponse {
  success: boolean;
  data: {
    total_exercises: number;
    by_difficulty: {
      facile: number;
      moyen: number;
      difficile: number;
    };
    by_language: {
      [key: string]: number;
    };
  };
}

class CodingPlatformService {
  private readonly BASE_URL = '/api/coding';

  /**
   * Récupérer la liste des exercices avec filtres
   */
  async getExercises(filters: ExerciseFilters = {}): Promise<ExerciseResponse> {
    try {
      const params = new URLSearchParams();
      
      if (filters.difficulty) params.append('difficulty', filters.difficulty);
      if (filters.language) params.append('language', filters.language);
      if (filters.category) params.append('category', filters.category);
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());

      const response = await api.get(`${this.BASE_URL}/admin/exercises?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des exercices:', error);
      throw error;
    }
  }

  /**
   * Créer un nouvel exercice
   */
  async createExercise(exerciseData: CreateExerciseData): Promise<{ success: boolean; data: Exercise }> {
    try {
      const response = await api.post(`${this.BASE_URL}/admin/exercises`, exerciseData);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la création de l\'exercice:', error);
      throw error;
    }
  }

  /**
   * Récupérer un exercice spécifique
   */
  async getExercise(exerciseId: number): Promise<{ success: boolean; data: Exercise }> {
    try {
      const response = await api.get(`${this.BASE_URL}/admin/exercises/${exerciseId}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'exercice:', error);
      throw error;
    }
  }

  /**
   * Mettre à jour un exercice
   */
  async updateExercise(exerciseId: number, exerciseData: Partial<CreateExerciseData>): Promise<{ success: boolean; data: Exercise }> {
    try {
      const response = await api.put(`${this.BASE_URL}/admin/exercises/${exerciseId}`, exerciseData);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'exercice:', error);
      throw error;
    }
  }

  /**
   * Supprimer un exercice
   */
  async deleteExercise(exerciseId: number): Promise<{ success: boolean; message: string }> {
    try {
      const response = await api.delete(`${this.BASE_URL}/admin/exercises/${exerciseId}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'exercice:', error);
      throw error;
    }
  }

  /**
   * Exécuter du code
   */
  async executeCode(codeData: ExecuteCodeData): Promise<ExecuteCodeResponse> {
    try {
      const response = await api.post(`${this.BASE_URL}/exercises/execute`, codeData);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de l\'exécution du code:', error);
      throw error;
    }
  }

  /**
   * Récupérer les statistiques
   */
  async getStats(): Promise<StatsResponse> {
    try {
      const response = await api.get(`${this.BASE_URL}/stats`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      throw error;
    }
  }

  /**
   * Récupérer les options de filtres disponibles
   */
  getFilterOptions() {
    return {
      difficulties: [
        { value: 'facile', label: 'Facile' },
        { value: 'moyen', label: 'Moyen' },
        { value: 'difficile', label: 'Difficile' }
      ],
      languages: [
        { value: 'python', label: 'Python' },
        { value: 'javascript', label: 'JavaScript' },
        { value: 'java', label: 'Java' },
        { value: 'cpp', label: 'C++' },
        { value: 'c', label: 'C' }
      ],
      categories: [
        { value: 'algorithmes', label: 'Algorithmes' },
        { value: 'strings', label: 'Chaînes de caractères' },
        { value: 'tri', label: 'Tri' },
        { value: 'structures', label: 'Structures de données' },
        { value: 'mathematiques', label: 'Mathématiques' }
      ]
    };
  }
}

export default new CodingPlatformService();