import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { 
  ArrowLeft, 
  Download, 
  Eye, 
  Mail, 
  Phone, 
  Calendar, 
  User,
  Filter,
  Search,
  ExternalLink,
  MessageSquare,
  Zap
} from 'lucide-react';
import { JobService } from '@/services/jobs-service';
import { ApplicationCVAnalysisService } from '@/services/application-cv-analysis-service';
import { SimpleCVScore } from '@/components/resume/SimpleCVScore';
import { JobApplication, JobPosting, Pagination, ApplicationStatus } from '@/types/jobs';

export default function JobApplicationsPage() {
  const router = useRouter();
  const { jobId } = router.query;
  
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [jobPosting, setJobPosting] = useState<JobPosting | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    limit: 20,
    offset: 0
  });
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [bulkAnalyzing, setBulkAnalyzing] = useState(false);

  const fetchApplications = async () => {
    if (!jobId || typeof jobId !== 'string') return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await JobService.getJobApplications(jobId, {
        limit: pagination.limit,
        offset: pagination.offset
      });
      
      setApplications(response.data);
      setJobPosting(response.job_posting);
      setPagination(response.pagination);
    } catch (err) {
      console.error('Erreur lors de la récupération des candidatures:', err);
      setError('Impossible de charger les candidatures. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [jobId, pagination.offset, pagination.limit]);

  // Trier les candidatures par score (celles avec scores en premier)
  const getSortedApplications = () => {
    const filtered = applications.filter(application => {
      const matchesStatus = statusFilter === 'all' || application.status === statusFilter;
      const matchesSearch = !searchTerm || 
        application.candidate_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        application.candidate_email.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesStatus && matchesSearch;
    });

    return filtered.sort((a, b) => {
      const analysisA = ApplicationCVAnalysisService.getApplicationAnalysis(a.id);
      const analysisB = ApplicationCVAnalysisService.getApplicationAnalysis(b.id);
      
      const scoreA = analysisA?.match_score || 0;
      const scoreB = analysisB?.match_score || 0;
      
      // Si les deux ont des scores, trier par score décroissant
      if (scoreA > 0 && scoreB > 0) {
        return scoreB - scoreA;
      }
      
      // Mettre les candidatures avec score en premier
      if (scoreA > 0 && scoreB === 0) return -1;
      if (scoreA === 0 && scoreB > 0) return 1;
      
      // Si aucun score, trier par date de candidature
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  };

  const filteredApplications = getSortedApplications();

  const handlePageChange = (newOffset: number) => {
    setPagination(prev => ({
      ...prev,
      offset: newOffset
    }));
  };

  const handleStatusChange = async (applicationId: string, newStatus: ApplicationStatus, notes?: string) => {
    try {
      setUpdatingStatus(applicationId);
      await JobService.updateApplicationStatus(applicationId, newStatus, notes);
      
      // Mettre à jour les données localement
      setApplications(prev => 
        prev.map(app => 
          app.id === applicationId 
            ? { ...app, status: newStatus, notes: notes || app.notes, updated_at: new Date().toISOString() }
            : app
        )
      );
    } catch (err) {
      console.error('Erreur lors de la mise à jour du statut:', err);
      setError('Impossible de mettre à jour le statut. Veuillez réessayer.');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleDownloadResume = async (applicationId: string, candidateName: string) => {
    try {
      await JobService.downloadApplicationResume(applicationId, `CV_${candidateName}.pdf`);
    } catch (err) {
      console.error('Erreur lors du téléchargement:', err);
      setError('Impossible de télécharger le CV. Veuillez réessayer.');
    }
  };

  const handlePreviewResume = async (applicationId: string) => {
    try {
      await JobService.previewApplicationResume(applicationId);
    } catch (err) {
      console.error('Erreur lors de la prévisualisation:', err);
      setError('Impossible de prévisualiser le CV. Veuillez réessayer.');
    }
  };

  const handleBulkAnalyze = async () => {
    if (!jobId || bulkAnalyzing) return;

    try {
      setBulkAnalyzing(true);
      setError(null);
      
      const result = await ApplicationCVAnalysisService.bulkAnalyzeJobApplications(jobId as string);
      
      if (result.errors.length > 0) {
        setError(`Analyse terminée: ${result.success} réussies, ${result.failed} échecs`);
      } else {
        setError(`Analyse terminée avec succès: ${result.success} CV analysés`);
      }
      
      // Forcer un re-render pour afficher les nouveaux scores
      setApplications(prev => [...prev]);
      
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'analyse en masse');
    } finally {
      setBulkAnalyzing(false);
    }
  };

  // Helper pour formater les dates
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Helper pour obtenir la classe de badge en fonction du statut
  const getStatusBadgeClass = (status: ApplicationStatus) => {
    switch (status) {
      case 'new':
        return 'bg-blue-100 text-blue-800';
      case 'reviewed':
        return 'bg-yellow-100 text-yellow-800';
      case 'interview_scheduled':
        return 'bg-purple-100 text-purple-800';
      case 'hired':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading && !jobPosting) {
    return (
      <div className="bg-gray-50 py-8 md:py-12 min-h-screen">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mb-4"></div>
              <p className="text-gray-500">Chargement des candidatures...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Candidatures - {jobPosting?.title || 'Chargement...'}</title>
        <meta name="description" content="Gérer les candidatures pour cette offre d'emploi" />
      </Head>

      <div className="bg-gray-50 py-8 md:py-12 min-h-screen">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto">
            {/* Retour et en-tête */}
            <div className="mb-8">
              <Link
                href="/jobs"
                className="inline-flex items-center text-gray-600 hover:text-gray-800 mb-4"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Retour aux offres d'emploi
              </Link>
              
              {jobPosting && (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div>
                      <h1 className="text-2xl font-bold text-gray-800 mb-2">{jobPosting.title}</h1>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                        <span>{jobPosting.organization_name}</span>
                        {jobPosting.location && <span>📍 {jobPosting.location}</span>}
                        {jobPosting.employment_type && <span>💼 {jobPosting.employment_type}</span>}
                        <span>📅 Publiée le {formatDate(jobPosting.published_at || jobPosting.created_at)}</span>
                      </div>
                    </div>
                    <div className="mt-4 md:mt-0 flex items-center space-x-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                        {pagination.total} candidature{pagination.total > 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Analyse en masse */}
            <div className="bg-white rounded-lg shadow-md p-4 mb-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={handleBulkAnalyze}
                    disabled={bulkAnalyzing || pagination.total === 0}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {bulkAnalyzing ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Analyse en cours...
                      </>
                    ) : (
                      <>
                        <Zap className="h-5 w-5 mr-2" />
                        Analyser tous les CV
                      </>
                    )}
                  </button>
                  <span className="text-sm text-gray-600">
                    Analysez automatiquement la compatibilité de tous les CV avec cette offre
                  </span>
                </div>
              </div>
            </div>

            {/* Filtres et recherche */}
            <div className="bg-white rounded-lg shadow-md p-4 mb-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                <div className="relative flex-grow md:max-w-md">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Rechercher un candidat..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Filter className="h-5 w-5 text-gray-500" />
                    <label htmlFor="status-filter" className="text-gray-700 text-sm">Statut :</label>
                  </div>
                  <select
                    id="status-filter"
                    className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="all">Tous</option>
                    <option value="new">Nouveau</option>
                    <option value="reviewed">Examiné</option>
                    <option value="interview_scheduled">Entretien planifié</option>
                    <option value="hired">Embauché</option>
                    <option value="rejected">Rejeté</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Message d'erreur */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
                {error}
              </div>
            )}

            {/* Liste des candidatures */}
            <div className="space-y-4">
              {loading ? (
                <div className="bg-white rounded-lg shadow-md p-8 text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mb-4"></div>
                  <p className="text-gray-500">Chargement des candidatures...</p>
                </div>
              ) : filteredApplications.length === 0 ? (
                <div className="bg-white rounded-lg shadow-md p-8 text-center">
                  <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-2">
                    {applications.length === 0 
                      ? 'Aucune candidature pour cette offre.' 
                      : 'Aucune candidature ne correspond aux filtres.'}
                  </p>
                  {statusFilter !== 'all' || searchTerm ? (
                    <button
                      onClick={() => {
                        setStatusFilter('all');
                        setSearchTerm('');
                      }}
                      className="text-primary-600 hover:text-primary-700"
                    >
                      Effacer les filtres
                    </button>
                  ) : null}
                </div>
              ) : (
                filteredApplications.map((application, index) => (
                  <div key={application.id} className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
                      {/* Informations du candidat */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div>
                              <div className="flex items-center space-x-3 mb-1">
                                <h3 className="text-lg font-semibold text-gray-900">
                                  {application.candidate_name}
                                </h3>
                                {/* Rang basé sur le tri */}
                                <span className="inline-flex items-center px-2 py-1 bg-indigo-100 text-indigo-800 text-xs font-medium rounded-full">
                                  #{index + 1}
                                </span>
                              </div>
                              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                                <span className="flex items-center">
                                  <Mail className="h-4 w-4 mr-1" />
                                  {application.candidate_email}
                                </span>
                                {application.candidate_phone && (
                                  <span className="flex items-center">
                                    <Phone className="h-4 w-4 mr-1" />
                                    {application.candidate_phone}
                                  </span>
                                )}
                                <span className="flex items-center">
                                  <Calendar className="h-4 w-4 mr-1" />
                                  Candidature du {formatDate(application.created_at)}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            {/* Score CV */}
                            <SimpleCVScore
                              applicationId={application.id}
                              hasResume={!!application.resume_url}
                              compact={true}
                            />
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(application.status)}`}>
                              {JobService.getApplicationStatusLabel(application.status)}
                            </span>
                          </div>
                        </div>

                        {/* Lettre de motivation */}
                        {application.cover_letter && (
                          <div className="mb-4">
                            <h4 className="text-sm font-medium text-gray-900 mb-2">Lettre de motivation :</h4>
                            <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-md">
                              {application.cover_letter.length > 200 
                                ? `${application.cover_letter.substring(0, 200)}...` 
                                : application.cover_letter}
                            </p>
                          </div>
                        )}

                        {/* Notes internes */}
                        {application.notes && (
                          <div className="mb-4">
                            <h4 className="text-sm font-medium text-gray-900 mb-2">Notes internes :</h4>
                            <p className="text-sm text-gray-700 bg-yellow-50 p-3 rounded-md border border-yellow-200">
                              {application.notes}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="lg:ml-6 mt-4 lg:mt-0 lg:w-64">
                        <div className="space-y-3">
                          {/* CV */}
                          {application.resume_url && (
                            <>
                              <button
                                onClick={() => handleDownloadResume(application.id, application.candidate_name)}
                                className="flex items-center justify-center w-full px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 mb-2"
                              >
                                <Download className="h-4 w-4 mr-2" />
                                Télécharger le CV
                              </button>
                              <button
                                onClick={() => handlePreviewResume(application.id)}
                                className="flex items-center justify-center w-full px-3 py-2 bg-gray-600 text-white text-sm rounded-md hover:bg-gray-700"
                              >
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Prévisualiser
                              </button>
                            </>
                          )}

                          {/* Voir les détails */}
                          <Link
                            href={`/jobs/${jobId}/applications/${application.id}`}
                            className="flex items-center justify-center w-full px-3 py-2 bg-gray-600 text-white text-sm rounded-md hover:bg-gray-700"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Voir les détails
                          </Link>

                          {/* Changement de statut */}
                          <div className="space-y-2">
                            <label className="block text-xs font-medium text-gray-700">
                              Changer le statut :
                            </label>
                            <select
                              value={application.status}
                              onChange={(e) => handleStatusChange(application.id, e.target.value as ApplicationStatus)}
                              disabled={updatingStatus === application.id}
                              className="w-full text-sm border border-gray-300 rounded-md px-2 py-1 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            >
                              <option value="new">Nouveau</option>
                              <option value="reviewed">Examiné</option>
                              <option value="interview_scheduled">Entretien planifié</option>
                              <option value="hired">Embauché</option>
                              <option value="rejected">Rejeté</option>
                            </select>
                            {updatingStatus === application.id && (
                              <div className="flex items-center text-xs text-gray-500">
                                <div className="animate-spin rounded-full h-3 w-3 border-b border-gray-500 mr-1"></div>
                                Mise à jour...
                              </div>
                            )}
                          </div>

                          {/* Contact candidat */}
                          <a
                            href={`mailto:${application.candidate_email}`}
                            className="flex items-center justify-center w-full px-3 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700"
                          >
                            <Mail className="h-4 w-4 mr-2" />
                            Contacter
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Pagination */}
            {!loading && filteredApplications.length > 0 && pagination.total > pagination.limit && (
              <div className="mt-8 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Affichage de <span className="font-medium">{pagination.offset + 1}</span> à{' '}
                  <span className="font-medium">
                    {Math.min(pagination.offset + pagination.limit, pagination.total)}
                  </span>{' '}
                  sur <span className="font-medium">{pagination.total}</span> candidatures
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handlePageChange(Math.max(0, pagination.offset - pagination.limit))}
                    disabled={pagination.offset === 0}
                    className={`px-3 py-1 rounded-md ${
                      pagination.offset === 0
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Précédent
                  </button>
                  <button
                    onClick={() => handlePageChange(pagination.offset + pagination.limit)}
                    disabled={pagination.offset + pagination.limit >= pagination.total}
                    className={`px-3 py-1 rounded-md ${
                      pagination.offset + pagination.limit >= pagination.total
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Suivant
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}