// hooks/useAdmin.ts
import { useState, useEffect, useCallback } from 'react';
import { 
  CodingPlatformService, 
 
} from '@/services/coding-platform-service';
import { Challenge, ChallengeDifficulty, ChallengeStatus, ChallengeStep, Exercise, ProgrammingLanguage } from '@/types/coding-plateform';

// Hook pour gérer les exercices
export function useExercises() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    per_page: 20,
    pages: 0
  });

  const fetchExercises = useCallback(async (params?: {
    page?: number;
    per_page?: number;
    language?: ProgrammingLanguage;
    difficulty?: ChallengeDifficulty;
  }) => {
    try {
      setLoading(true);
      setError(null);
      const response = await CodingPlatformService.getExercises(params || {});
      setExercises(response.data);
      setPagination(response.pagination);
    } catch (err) {
      setError('Erreur lors du chargement des exercices');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createExercise = useCallback(async (data: any) => {
    try {
      setError(null);
      const newExercise = await CodingPlatformService.createExercise(data);
      setExercises(prev => [...prev, newExercise]);
      return newExercise;
    } catch (err) {
      setError('Erreur lors de la création de l\'exercice');
      throw err;
    }
  }, []);

  const updateExercise = useCallback(async (id: string, data: any) => {
    try {
      setError(null);
      const updatedExercise = await CodingPlatformService.updateExercise(id, data);
      setExercises(prev => prev.map(ex => ex.id === id ? updatedExercise : ex));
      return updatedExercise;
    } catch (err) {
      setError('Erreur lors de la mise à jour de l\'exercice');
      throw err;
    }
  }, []);

  const deleteExercise = useCallback(async (id: string) => {
    try {
      setError(null);
      await CodingPlatformService.deleteExercise(id);
      setExercises(prev => prev.filter(ex => ex.id !== id));
      setPagination(prev => ({ ...prev, total: prev.total - 1 }));
    } catch (err) {
      setError('Erreur lors de la suppression de l\'exercice');
      throw err;
    }
  }, []);

  return {
    exercises,
    loading,
    error,
    pagination,
    fetchExercises,
    createExercise,
    updateExercise,
    deleteExercise,
    clearError: () => setError(null)
  };
}

// Hook pour gérer un exercice spécifique
export function useExercise(exerciseId: string | null) {
  const [exercise, setExercise] = useState<(Exercise & { challenges: Challenge[] }) | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchExercise = useCallback(async () => {
    if (!exerciseId) return;
    
    try {
      setLoading(true);
      setError(null);
      const response = await CodingPlatformService.getExercise(exerciseId);
      setExercise(response);
    } catch (err) {
      setError('Erreur lors du chargement de l\'exercice');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [exerciseId]);

  useEffect(() => {
    fetchExercise();
  }, [fetchExercise]);

  return {
    exercise,
    loading,
    error,
    refetch: fetchExercise,
    clearError: () => setError(null)
  };
}

// Hook pour gérer les challenges
export function useChallenges(exerciseId?: number) {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchChallenges = useCallback(async (params?: {
    exercise_id?: string;
    status?: ChallengeStatus;
    page?: number;
    per_page?: number;
  }) => {
    try {
      setLoading(true);
      setError(null);
      const response = await CodingPlatformService.getChallenges({
        ...params,
        exercise_id: exerciseId || params?.exercise_id
      });
      setChallenges(response.data);
    } catch (err) {
      setError('Erreur lors du chargement des challenges');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [exerciseId]);

  const createChallenge = useCallback(async (data: any) => {
    try {
      setError(null);
      const newChallenge = await CodingPlatformService.createChallenge(data);
      setChallenges(prev => [...prev, newChallenge]);
      return newChallenge;
    } catch (err) {
      setError('Erreur lors de la création du challenge');
      throw err;
    }
  }, []);

  const updateChallenge = useCallback(async (id: number, data: any) => {
    try {
      setError(null);
      const updatedChallenge = await CodingPlatformService.updateChallenge(id, data);
      setChallenges(prev => prev.map(ch => ch.id === id ? updatedChallenge : ch));
      return updatedChallenge;
    } catch (err) {
      setError('Erreur lors de la mise à jour du challenge');
      throw err;
    }
  }, []);

  const deleteChallenge = useCallback(async (id: number) => {
    try {
      setError(null);
      await CodingPlatformService.deleteChallenge(id);
      setChallenges(prev => prev.filter(ch => ch.id !== id));
    } catch (err) {
      setError('Erreur lors de la suppression du challenge');
      throw err;
    }
  }, []);

  return {
    challenges,
    loading,
    error,
    fetchChallenges,
    createChallenge,
    updateChallenge,
    deleteChallenge,
    clearError: () => setError(null)
  };
}

// Hook pour gérer un challenge spécifique
export function useChallenge(challengeId: number | null) {
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [steps, setSteps] = useState<ChallengeStep[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchChallenge = useCallback(async () => {
    if (!challengeId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Charger le challenge
      const challengeData = await CodingPlatformService.getChallenge(challengeId);
      setChallenge(challengeData);
      
      // Charger les étapes
      const stepsData = await CodingPlatformService.getChallengeSteps(challengeId);
      setSteps(stepsData.sort((a, b) => a.order_index - b.order_index));
    } catch (err) {
      setError('Erreur lors du chargement du challenge');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [challengeId]);

  useEffect(() => {
    fetchChallenge();
  }, [fetchChallenge]);

  const createStep = useCallback(async (data: any) => {
    if (!challengeId) return;
    
    try {
      setError(null);
      const newStep = await CodingPlatformService.createChallengeStep(challengeId, data);
      setSteps(prev => [...prev, newStep].sort((a, b) => a.order_index - b.order_index));
      return newStep;
    } catch (err) {
      setError('Erreur lors de la création de l\'étape');
      throw err;
    }
  }, [challengeId]);

  return {
    challenge,
    steps,
    loading,
    error,
    refetch: fetchChallenge,
    createStep,
    clearError: () => setError(null)
  };
}

// Hook pour la soumission et test de code
export function useCodeExecution() {
  const [testing, setTesting] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const testCode = useCallback(async (challengeId: number, stepId: number, code: string, language: ProgrammingLanguage) => {
    try {
      setTesting(true);
      setError(null);
      
      const response = await CodingPlatformService.testCode(challengeId, stepId, {
        code,
        language
      });
      
      setResults(response);
      return response;
    } catch (err) {
      setError('Erreur lors du test du code');
      throw err;
    } finally {
      setTesting(false);
    }
  }, []);

  const submitCode = useCallback(async (challengeId: number, stepId: number, code: string, language: ProgrammingLanguage) => {
    try {
      setSubmitting(true);
      setError(null);
      
      const response = await CodingPlatformService.submitCode(challengeId, stepId, {
        code,
        language
      });
      
      setResults(response);
      return response;
    } catch (err) {
      setError('Erreur lors de la soumission du code');
      throw err;
    } finally {
      setSubmitting(false);
    }
  }, []);

  return {
    testing,
    submitting,
    results,
    error,
    testCode,
    submitCode,
    clearResults: () => setResults(null),
    clearError: () => setError(null)
  };
}

// Hook pour gérer les cas de test
export function useTestCases(stepId: number | null) {
  const [testCases, setTestCases] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const createTestCase = useCallback(async (data: any) => {
    if (!stepId) return;
    
    try {
      setError(null);
      const newTestCase = await CodingPlatformService.createTestCase(stepId, data);
      setTestCases(prev => [...prev, newTestCase]);
      return newTestCase;
    } catch (err) {
      setError('Erreur lors de la création du cas de test');
      throw err;
    }
  }, [stepId]);

  const bulkImportTestCases = useCallback(async (testCasesData: any[]) => {
    if (!stepId) return;
    
    try {
      setLoading(true);
      setError(null);
      const response = await CodingPlatformService.bulkImportTestCases(stepId, {
        testcases: testCasesData
      });
      setTestCases(response.testcases);
      return response;
    } catch (err) {
      setError('Erreur lors de l\'import des cas de test');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [stepId]);

  return {
    testCases,
    loading,
    error,
    createTestCase,
    bulkImportTestCases,
    clearError: () => setError(null)
  };
}

// Hook utilitaire pour les notifications/toasts
export function useNotifications() {
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
    duration?: number;
  }>>([]);

  const addNotification = useCallback((notification: {
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
    duration?: number;
  }) => {
    const id = Date.now().toString();
    const newNotification = { ...notification, id };
    
    setNotifications(prev => [...prev, newNotification]);
    
    // Auto-remove après la durée spécifiée (défaut: 5s)
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, notification.duration || 5000);
    
    return id;
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const success = useCallback((message: string, duration?: number) => 
    addNotification({ type: 'success', message, duration }), [addNotification]);
  
  const error = useCallback((message: string, duration?: number) => 
    addNotification({ type: 'error', message, duration }), [addNotification]);
  
  const warning = useCallback((message: string, duration?: number) => 
    addNotification({ type: 'warning', message, duration }), [addNotification]);
  
  const info = useCallback((message: string, duration?: number) => 
    addNotification({ type: 'info', message, duration }), [addNotification]);

  return {
    notifications,
    addNotification,
    removeNotification,
    success,
    error,
    warning,
    info
  };
}