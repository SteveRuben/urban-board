// Hook pour le dashboard
import { useState, useEffect, useCallback } from 'react';
import dashboardService, { 
  DashboardData, 
  DashboardStats, 
  Interview, 
  PerformanceMetrics, 
  Alert 
} from '../services/dashboard-service';

export const useDashboard = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await dashboardService.getDashboardData();
      
      if (response.success) {
        setDashboardData(response.data);
      } else {
        setError('Erreur lors de la récupération des données du dashboard');
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
      console.error('Erreur fetchDashboardData:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return {
    dashboardData,
    loading,
    error,
    refetch: fetchDashboardData
  };
};

export const useDashboardStats = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await dashboardService.getStats();
      
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
    refetch: fetchStats
  };
};

export const useRecentInterviews = (limit = 10) => {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRecentInterviews = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await dashboardService.getRecentInterviews(limit);
      
      if (response.success) {
        setInterviews(response.data);
      } else {
        setError('Erreur lors de la récupération des entretiens récents');
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
      console.error('Erreur fetchRecentInterviews:', err);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchRecentInterviews();
  }, [fetchRecentInterviews]);

  return {
    interviews,
    loading,
    error,
    refetch: fetchRecentInterviews
  };
};

export const useUpcomingInterviews = (limit = 10) => {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUpcomingInterviews = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await dashboardService.getUpcomingInterviews(limit);
      
      if (response.success) {
        setInterviews(response.data);
      } else {
        setError('Erreur lors de la récupération des entretiens à venir');
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
      console.error('Erreur fetchUpcomingInterviews:', err);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchUpcomingInterviews();
  }, [fetchUpcomingInterviews]);

  return {
    interviews,
    loading,
    error,
    refetch: fetchUpcomingInterviews
  };
};

export const useDashboardAlerts = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await dashboardService.getAlerts();
      
      if (response.success) {
        setAlerts(response.data);
      } else {
        setError('Erreur lors de la récupération des alertes');
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
      console.error('Erreur fetchAlerts:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  return {
    alerts,
    loading,
    error,
    refetch: fetchAlerts
  };
};