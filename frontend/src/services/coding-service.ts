/**
 * Service API pour la plateforme de coding
 * Gestion des exercices, exécution de code et soumissions
 */

import api from "./api";



export interface TestCase {
  input: string;
  expected: string;
  description?: string;
}

export interface ExecutionResult {
  success: boolean;
  output: string;
  error?: string;
  execution_time: number;
  memory_usage: string;
  test_results?: Array<{
    test_case: number;
    description?: string;
    input: string;
    expected: string;
    actual: string;
    passed: boolean;
  }>;
}

export interface CodingExercise {
  id: number;
  title: string;
  description: string;
  difficulty: 'facile' | 'moyen' | 'difficile';
  category: string;
  supported_languages: string[];
  code_templates: Record<string, string>;
  test_cases: TestCase[];
  estimated_time: number;
  points: number;
  tags: string[];
  created_at: string;
  is_active: boolean;
}

export interface CodingSubmission {
  id: number;
  user_id: number;
  exercise_id: number;
  exercise_title?: string;
  code: string;
  language: string;
  success: boolean;
  execution_time: number;
  memory_usage?: string;
  output?: string;
  error?: string;
  test_results?: any[];
  score: number;
  submitted_at: string;
}

export interface CodingStats {
  total_submissions: number;
  successful_submissions: number;
  success_rate: number;
  solved_by_difficulty: Record<string, number>;
  languages_used: Record<string, number>;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    pages: number;
    per_page: number;
    total: number;
  };
}

class CodingService {
  private baseUrl = '/api/coding';

  /**
   * Récupère les langages de programmation supportés
   */
  async getSupportedLanguages(): Promise<{
    success: boolean;
    languages: string[];
    docker_available: boolean;
  }> {
    const response = await api.get(`${this.baseUrl}/languages`);
    return response.data;
  }

  /**
   * Exécute du code dans un environnement sécurisé
   */
  async executeCode(
    code: string,
    language: string,
    testCases?: TestCase[],
    exerciseId?: number
  ): Promise<{
    success: boolean;
    result: ExecutionResult;
  }> {
    const response = await api.post(`${this.baseUrl}/execute`, {
      code,
      language,
      test_cases: testCases || [],
      exercise_id: exerciseId
    });
    return response.data;
  }

  /**
   * Récupère la liste des exercices
   */
  async getExercises(params?: {
    page?: number;
    per_page?: number;
    difficulty?: string;
    language?: string;
  }): Promise<PaginatedResponse<CodingExercise>> {
    const response = await api.get(`${this.baseUrl}/exercises`, {
      params
    });
    return {
      success: response.data.success,
      data: response.data.exercises,
      pagination: response.data.pagination
    };
  }

  /**
   * Récupère un exercice spécifique
   */
  async getExercise(exerciseId: number): Promise<{
    success: boolean;
    exercise: CodingExercise;
  }> {
    const response = await api.get(`${this.baseUrl}/exercises/${exerciseId}`);
    return response.data;
  }

  /**
   * Crée un nouvel exercice (admin seulement)
   */
  async createExercise(exercise: Partial<CodingExercise>): Promise<{
    success: boolean;
    exercise: CodingExercise;
  }> {
    const response = await api.post(`${this.baseUrl}/exercises`, exercise);
    return response.data;
  }

  /**
   * Soumet une solution pour un exercice
   */
  async submitSolution(
    exerciseId: number,
    code: string,
    language: string
  ): Promise<{
    success: boolean;
    submission_id: number;
    result: ExecutionResult;
  }> {
    const response = await api.post(`${this.baseUrl}/exercises/${exerciseId}/submit`, {
      code,
      language
    });
    return response.data;
  }

  /**
   * Récupère les soumissions de l'utilisateur
   */
  async getUserSubmissions(params?: {
    page?: number;
    per_page?: number;
  }): Promise<PaginatedResponse<CodingSubmission>> {
    const response = await api.get(`${this.baseUrl}/submissions`, {
      params
    });
    return {
      success: response.data.success,
      data: response.data.submissions,
      pagination: response.data.pagination
    };
  }

  /**
   * Récupère les statistiques de coding de l'utilisateur
   */
  async getCodingStats(): Promise<{
    success: boolean;
    stats: CodingStats;
  }> {
    const response = await api.get(`${this.baseUrl}/stats`);
    return response.data;
  }

  /**
   * Vérifie l'état du service de coding
   */
  async healthCheck(): Promise<{
    success: boolean;
    status: 'healthy' | 'degraded' | 'unhealthy';
    docker_available: boolean;
    supported_languages: string[];
    message: string;
  }> {
    const response = await api.get(`${this.baseUrl}/health`);
    return response.data;
  }

  /**
   * Valide le code avant l'exécution
   */
  validateCode(code: string, language: string): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Vérifications de base
    if (!code.trim()) {
      errors.push('Le code ne peut pas être vide');
    }

    // Vérifications spécifiques par langage
    switch (language) {
      case 'python':
        if (code.includes('import os') || code.includes('import subprocess')) {
          errors.push('Les imports système ne sont pas autorisés');
        }
        if (code.includes('exec(') || code.includes('eval(')) {
          errors.push('Les fonctions exec() et eval() ne sont pas autorisées');
        }
        break;

      case 'javascript':
        if (code.includes('require(') && !code.includes('require("')) {
          errors.push('Seuls les modules standard sont autorisés');
        }
        if (code.includes('process.') || code.includes('global.')) {
          errors.push('L\'accès aux objets globaux n\'est pas autorisé');
        }
        break;

      case 'java':
        if (code.includes('System.exit') || code.includes('Runtime.')) {
          errors.push('Les appels système ne sont pas autorisés');
        }
        break;

      case 'cpp':
        if (code.includes('#include <cstdlib>') || code.includes('system(')) {
          errors.push('Les appels système ne sont pas autorisés');
        }
        break;
    }

    // Vérifications de sécurité générales
    const dangerousPatterns = [
      'file://',
      'http://',
      'https://',
      'ftp://',
      '__import__',
      'open(',
      'file(',
      'input(',
      'raw_input('
    ];

    for (const pattern of dangerousPatterns) {
      if (code.toLowerCase().includes(pattern)) {
        errors.push(`Pattern dangereux détecté: ${pattern}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Formate le code selon le langage
   */
  formatCode(code: string, language: string): string {
    // Implémentation basique de formatage
    switch (language) {
      case 'python':
        return this.formatPythonCode(code);
      case 'javascript':
        return this.formatJavaScriptCode(code);
      default:
        return code;
    }
  }

  private formatPythonCode(code: string): string {
    // Formatage basique pour Python
    return code
      .split('\n')
      .map(line => line.trimRight())
      .join('\n')
      .replace(/\n{3,}/g, '\n\n'); // Limiter les lignes vides consécutives
  }

  private formatJavaScriptCode(code: string): string {
    // Formatage basique pour JavaScript
    return code
      .split('\n')
      .map(line => line.trimRight())
      .join('\n')
      .replace(/\n{3,}/g, '\n\n');
  }

  /**
   * Génère un template de code pour un langage donné
   */
  generateCodeTemplate(language: string, functionName: string = 'solution'): string {
    switch (language) {
      case 'python':
        return `def ${functionName}():
    # Votre solution ici
    pass

# Test
result = ${functionName}()
print(result)`;

      case 'javascript':
        return `function ${functionName}() {
    // Votre solution ici
}

// Test
const result = ${functionName}();
console.log(result);`;

      case 'java':
        return `public class Main {
    public static void main(String[] args) {
        // Votre solution ici
        System.out.println("Hello World");
    }
}`;

      case 'cpp':
        return `#include <iostream>
using namespace std;

int main() {
    // Votre solution ici
    cout << "Hello World" << endl;
    return 0;
}`;

      default:
        return '// Votre code ici';
    }
  }

  /**
   * Estime la complexité du code
   */
  estimateComplexity(code: string): {
    timeComplexity: string;
    spaceComplexity: string;
    confidence: number;
  } {
    // Analyse basique de la complexité
    const lines = code.split('\n');
    let nestedLoops = 0;
    let currentNesting = 0;

    for (const line of lines) {
      const trimmed = line.trim();
      
      // Détecter les boucles
      if (trimmed.includes('for ') || trimmed.includes('while ')) {
        currentNesting++;
        nestedLoops = Math.max(nestedLoops, currentNesting);
      }
      
      // Détecter la fin des blocs (approximatif)
      if (trimmed === '}' || (trimmed === '' && currentNesting > 0)) {
        currentNesting = Math.max(0, currentNesting - 1);
      }
    }

    // Estimation basique
    let timeComplexity = 'O(1)';
    if (nestedLoops === 1) timeComplexity = 'O(n)';
    else if (nestedLoops === 2) timeComplexity = 'O(n²)';
    else if (nestedLoops > 2) timeComplexity = 'O(n^' + nestedLoops + ')';

    return {
      timeComplexity,
      spaceComplexity: 'O(1)', // Estimation simplifiée
      confidence: 0.6 // Confiance faible pour cette analyse basique
    };
  }
}

export const codingService = new CodingService();