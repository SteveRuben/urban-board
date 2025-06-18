// frontend/pages/interviews/index.tsx
import { useState, useEffect, useCallback, MouseEvent } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { RefreshCw, Calendar, Clock, User, Users, Bot, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { InterviewSchedulingService } from '@/services/interview-scheduling-service';
import { InterviewSchedule, ScheduleFilters } from '@/types/interview-scheduling';

type StatusFilterType = 'all' | InterviewSchedule['status'];

const InterviewsIndexPage = () => {
  const router = useRouter();
  const [schedules, setSchedules] = useState<InterviewSchedule[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<StatusFilterType>('all');

  // Fonction pour charger les entretiens (extraite pour être réutilisée)
  const fetchSchedules = useCallback(async () => {
    try {
      setRefreshing(true);
      
      const filters: ScheduleFilters = {};
      if (statusFilter !== 'all') {
        filters.status = statusFilter;
      }
      
      const response = await InterviewSchedulingService.getMySchedules(filters);
      setSchedules(response);
      setError(null);
    } catch (err: any) {
      console.error('Erreur lors du chargement des entretiens:', err);
      setError(err.message || 'Impossible de charger la liste des entretiens. Veuillez réessayer.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [statusFilter]);

  // Charger les entretiens depuis l'API
  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  // Fonction pour rafraîchir manuellement les entretiens
  const handleRefresh = () => {
    fetchSchedules();
  };

  // Fonction pour annuler un entretien
  const handleCancelInterview = async (scheduleId: string, candidateName: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir annuler l'entretien avec ${candidateName} ?`)) {
      return;
    }

    try {
      await InterviewSchedulingService.cancelSchedule(scheduleId, 'Annulé par le recruteur');
      // Recharger la liste des entretiens
      fetchSchedules();
    } catch (error: any) {
      alert(`Erreur lors de l'annulation: ${error.message}`);
    }
  };

  // Fonction pour confirmer un entretien
  const handleConfirmInterview = async (scheduleId: string, candidateName: string) => {
    try {
      await InterviewSchedulingService.confirmSchedule(scheduleId);
      // Recharger la liste des entretiens
      fetchSchedules();
    } catch (error: any) {
      alert(`Erreur lors de la confirmation: ${error.message}`);
    }
  };

  // Filtrer les entretiens en fonction de la recherche et du filtre de statut
  const filteredSchedules = schedules.filter(schedule => {
    const matchesSearch = schedule.candidate_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      schedule.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (schedule.title && schedule.title.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || schedule.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Obtenir le badge de statut avec les couleurs du service
  const getStatusBadge = (status: InterviewSchedule['status']) => {
    const color = InterviewSchedulingService.getScheduleStatusColor(status);
    const label = InterviewSchedulingService.getScheduleStatusLabel(status);
    
    const bgColorClass = {
      '#3498db': 'bg-blue-100 text-blue-800',      // scheduled
      '#27ae60': 'bg-green-100 text-green-800',    // confirmed
      '#f39c12': 'bg-yellow-100 text-yellow-800',  // in_progress
      '#2ecc71': 'bg-emerald-100 text-emerald-800', // completed
      '#e74c3c': 'bg-red-100 text-red-800',        // canceled
      '#95a5a6': 'bg-gray-100 text-gray-800'       // no_show
    }[color] || 'bg-gray-100 text-gray-800';

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${bgColorClass}`}>
        {label}
      </span>
    );
  };

  // Obtenir l'icône du mode d'entretien
  const getModeIcon = (mode: InterviewSchedule['mode']) => {
    switch (mode) {
      case 'collaborative':
        return <Users className="h-4 w-4" />;
      case 'autonomous':
        return <Bot className="h-4 w-4" />;
      default:
        return <Users className="h-4 w-4" />;
    }
  };

  // Obtenir l'icône de statut
  const getStatusIcon = (status: InterviewSchedule['status']) => {
    switch (status) {
      case 'scheduled':
        return <Clock className="h-4 w-4 text-blue-600" />;
      case 'confirmed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'in_progress':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-emerald-600" />;
      case 'canceled':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'no_show':
        return <XCircle className="h-4 w-4 text-gray-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <>
      <Head>
        <title>Entretiens - RecruteIA</title>
        <meta name="description" content="Gérez vos entretiens assistés par IA" />
      </Head>

      <div className="bg-gray-50 py-8 min-h-screen">
        <div className="container mx-auto px-4">
          {/* En-tête de la page */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Entretiens</h1>
              <p className="text-gray-600">Gérez vos entretiens assistés par l'IA</p>
              {schedules.length > 0 && (
                <p className="text-sm text-gray-500 mt-1">
                  {filteredSchedules.length} entretien{filteredSchedules.length > 1 ? 's' : ''} 
                  {statusFilter !== 'all' && ` (${InterviewSchedulingService.getScheduleStatusLabel(statusFilter)})`}
                </p>
              )}
            </div>
            <div className="mt-4 md:mt-0 flex space-x-3">
              {/* Bouton de rafraîchissement */}
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="inline-flex items-center px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                title="Rafraîchir la liste"
              >
                <RefreshCw
                  className={`h-5 w-5 ${refreshing ? 'animate-spin text-primary-600' : 'text-gray-500'}`}
                />
                <span className="ml-2">Actualiser</span>
              </button>

              <button
                onClick={() => router.push('/interviews/schedule')}
                className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Calendar className="h-5 w-5 mr-2" />
                Programmer un entretien
              </button>
            </div>
          </div>

          {/* Filtres */}
          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
              {/* Recherche */}
              <div className="flex-1">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    placeholder="Rechercher par nom, poste ou titre..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              {/* Filtre par statut */}
              <div className="w-full md:w-64">
                <select
                  className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as StatusFilterType)}
                >
                  <option value="all">Tous les statuts</option>
                  <option value="scheduled">Planifiés</option>
                  <option value="confirmed">Confirmés</option>
                  <option value="in_progress">En cours</option>
                  <option value="completed">Terminés</option>
                  <option value="canceled">Annulés</option>
                  <option value="no_show">Absents</option>
                </select>
              </div>
            </div>
          </div>

          {/* Liste des entretiens */}
          {loading ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600 mb-2"></div>
              <p className="text-gray-600">Chargement des entretiens...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={handleRefresh}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Réessayer
              </button>
            </div>
          ) : filteredSchedules.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              {searchTerm || statusFilter !== 'all' ? (
                <>
                  <p className="text-gray-600 mb-2">Aucun entretien ne correspond à votre recherche.</p>
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setStatusFilter('all');
                    }}
                    className="text-primary-600 hover:text-primary-700 font-medium"
                  >
                    Réinitialiser les filtres
                  </button>
                </>
              ) : (
                <>
                  <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600 mb-4">Vous n'avez pas encore d'entretiens planifiés.</p>
                  <button
                    onClick={() => router.push('/interviews/schedule')}
                    className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <Calendar className="h-5 w-5 mr-2" />
                    Programmer votre premier entretien
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Candidat
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Poste
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date & Heure
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Durée & Mode
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Statut
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredSchedules.map((schedule) => {
                      const timeInfo = InterviewSchedulingService.getTimeUntilInterview(schedule.scheduled_at);
                      
                      return (
                        <tr
                          key={schedule.id}
                          className="hover:bg-gray-50 cursor-pointer"
                          onClick={() => router.push(`/interviews/schedule/${schedule.id}`)}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                  <User className="h-5 w-5 text-gray-600" />
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{schedule.candidate_name}</div>
                                <div className="text-sm text-gray-500">{schedule.candidate_email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{schedule.position}</div>
                            {schedule.title && (
                              <div className="text-sm text-gray-500">{schedule.title}</div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center text-sm text-gray-900">
                              <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                              {InterviewSchedulingService.formatScheduledDateTime(schedule.scheduled_at, schedule.timezone)}
                            </div>
                            {!timeInfo.isPast && (
                              <div className={`text-xs mt-1 ${timeInfo.canStart ? 'text-green-600 font-medium' : 'text-gray-500'}`}>
                                {timeInfo.canStart ? 'Peut commencer' : `Dans ${timeInfo.timeUntil}`}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center text-sm text-gray-900">
                              <Clock className="h-4 w-4 mr-2 text-gray-400" />
                              {InterviewSchedulingService.formatDuration(schedule.duration_minutes)}
                            </div>
                            <div className="flex items-center text-sm text-gray-500 mt-1">
                              {getModeIcon(schedule.mode)}
                              <span className="ml-2">{InterviewSchedulingService.getInterviewModeLabel(schedule.mode)}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {getStatusIcon(schedule.status)}
                              <div className="ml-2">
                                {getStatusBadge(schedule.status)}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end space-x-2" onClick={(e: MouseEvent<HTMLDivElement>) => e.stopPropagation()}>
                              <button
                                onClick={(e: MouseEvent<HTMLButtonElement>) => {
                                  e.stopPropagation();
                                  router.push(`/interviews/scheduled/${schedule.id}`);
                                }}
                                className="text-indigo-600 hover:text-indigo-900"
                              >
                                Voir
                              </button>
                              
                              {schedule.status === 'scheduled' && (
                                <button
                                  className="text-green-600 hover:text-green-900"
                                  onClick={(e: MouseEvent<HTMLButtonElement>) => {
                                    e.stopPropagation();
                                    handleConfirmInterview(schedule.id, schedule.candidate_name);
                                  }}
                                >
                                  Confirmer
                                </button>
                              )}
                              
                              {InterviewSchedulingService.canBeModified(schedule) && (
                                <button
                                  className="text-red-600 hover:text-red-900"
                                  onClick={(e: MouseEvent<HTMLButtonElement>) => {
                                    e.stopPropagation();
                                    handleCancelInterview(schedule.id, schedule.candidate_name);
                                  }}
                                >
                                  Annuler
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

InterviewsIndexPage.getLayout = (page: React.ReactNode) => <DashboardLayout>{page}</DashboardLayout>;
export default InterviewsIndexPage;