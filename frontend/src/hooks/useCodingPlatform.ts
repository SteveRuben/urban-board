// Hook pour la plateforme de coding
import { useState, useEffect, useCallback } from 'react';
import codingPlatformService, { 
  Exercise, 
  ExerciseFilters, 
  CreateExerciseData,
  ExecuteCodeData 
} from '../services/coding-platform-service';

export const useCodingPlatform = () => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);

  // Récupérer les exercices
  const fetchExercises = useCallback(async (filters: ExerciseFilters = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await codingPlatformService.getExercises(filters);
      
      if (response.success) {
        setExercises(response.data.exercises);
        setTotalPages(response.data.total_pages);
        setCurrentPage(response.data.page);
        setTotal(response.data.total);
      } else {
        setError('Erreur lors de la récupération des exercices');
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
      console.error('Erreur fetchExercises:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Créer un exercice
  const createExercise = useCallback(async (exerciseData: CreateExerciseData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await codingPlatformService.createExercise(exerciseData);
      
      if (response.success) {
        // Rafraîchir la liste
        await fetchExercises();
        return response.data;
      } else {
        setError('Erreur lors de la création de l\'exercice');
        return null;
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
      console.error('Erreur createExercise:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchExercises]);

  // Supprimer un exercice
  const deleteExercise = useCallback(async (exerciseId: number) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await codingPlatformService.deleteExercise(exerciseId);
      
      if (response.success) {
        // Rafraîchir la liste
        await fetchExercises();
        return true;
      } else {
        setError('Erreur lors de la suppression de l\'exercice');
        return false;
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
      console.error('Erreur deleteExercise:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchExercises]);

  // Exécuter du code
  const executeCode = useCallback(async (codeData: ExecuteCodeData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await codingPlatformService.executeCode(codeData);
      
      if (response.success) {
        return response.data;
      } else {
        setError('Erreur lors de l\'exécution du code');
        return null;
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
      console.error('Erreur executeCode:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Charger les exercices au montage du composant
  useEffect(() => {
    fetchExercises();
  }, [fetchExercises]);

  return {
    exercises,
    loading,
    error,
    totalPages,
    currentPage,
    total,
    fetchExercises,
    createExercise,
    deleteExercise,
    executeCode,
    filterOptions: codingPlatformService.getFilterOptions()
  };
};

// Hook pour les statistiques
export const useCodingStats = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await codingPlatformService.getStats();
      
      if (response.success) {
        setStats(response.data);
      } else {
        setError('Erreur lors de la récupération des statistiques');
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
      console.error('Erreur fetchStats:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    fetchStats
  };
};