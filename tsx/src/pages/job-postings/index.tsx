// frontend/pages/job-postings/index.tsx
import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { PlusCircle, Edit, Trash, Eye, CheckCircle, XCircle, Search, Filter } from 'lucide-react';
import { jobPostingService } from '@/services/job-posting-service';
import { JobPosting, Pagination } from '@/types/job-posting';

export default function JobPostingsPage() {
  const [jobPostings, setJobPostings] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    limit: 10,
    offset: 0
  });
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const fetchJobPostings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await jobPostingService.getJobPostings({
        limit: pagination.limit,
        offset: pagination.offset,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: searchTerm || undefined
      });
      
      setJobPostings(response.data);
      setPagination(response.pagination);
    } catch (err) {
      console.error('Erreur lors de la récupération des offres:', err);
      setError('Impossible de charger les offres d\'emploi. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobPostings();
  }, [pagination.offset, pagination.limit, statusFilter]);

  // Simuler la fonctionnalité de recherche sur le frontend
  const filteredJobPostings = searchTerm 
    ? jobPostings.filter(job => 
        job.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        job.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : jobPostings;

  const handlePageChange = (newOffset: number) => {
    setPagination(prev => ({
      ...prev,
      offset: newOffset
    }));
  };

  const handleStatusChange = async (jobId: string, newStatus: 'published' | 'closed') => {
    try {
      if (newStatus === 'published') {
        await jobPostingService.publishJobPosting(jobId);
      } else {
        await jobPostingService.closeJobPosting(jobId);
      }
      // Mettre à jour les données localement
      setJobPostings(prev => 
        prev.map(job => 
          job.id === jobId 
            ? {...job, status: newStatus} 
            : job
        )
      );
    } catch (err) {
      console.error('Erreur lors de la modification du statut:', err);
      setError('Impossible de modifier le statut de l\'offre. Veuillez réessayer.');
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette offre d\'emploi ? Cette action est irréversible.')) {
      return;
    }
    
     
  try {
    await jobPostingService.deleteJobPosting(jobId);
      // Mettre à jour les données localement
      setJobPostings(prev => prev.filter(job => job.id !== jobId));
      setPagination(prev => ({
        ...prev,
        total: prev.total - 1
      }));
    } catch (err) {
      console.error('Erreur lors de la suppression:', err);
      setError('Impossible de supprimer l\'offre. Veuillez réessayer.');
    }
  };

  // Helper pour formater les dates
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  // Helper pour obtenir la classe de badge en fonction du statut
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'published':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Helper pour traduire le statut
  const translateStatus = (status: string) => {
    switch (status) {
      case 'draft':
        return 'Brouillon';
      case 'published':
        return 'Publiée';
      case 'closed':
        return 'Fermée';
      default:
        return status;
    }
  };

  return (
    <>
      <Head>
        <title>Gestion des offres d'emploi</title>
        <meta name="description" content="Gérer les offres d'emploi de votre organisation" />
      </Head>

      <div className="bg-gray-50 py-8 md:py-12 min-h-screen">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            {/* En-tête de la page */}
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-800 mb-2">Offres d'emploi</h1>
                <p className="text-gray-600">
                  Gérez les offres d'emploi de votre organisation
                </p>
              </div>
              <Link
                href="/job-postings/new"
                className="inline-flex items-center px-4 py-2 bg-primary-600 text-black rounded-md hover:bg-primary-700"
              >
                <PlusCircle className="h-5 w-5 mr-2" />
                Nouvelle offre
              </Link>
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
                    placeholder="Rechercher une offre..."
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
                    <option value="draft">Brouillon</option>
                    <option value="published">Publiée</option>
                    <option value="closed">Fermée</option>
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

            {/* Liste des offres */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
              {loading ? (
                <div className="p-8 text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mb-4"></div>
                  <p className="text-gray-500">Chargement des offres d'emploi...</p>
                </div>
              ) : filteredJobPostings.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-gray-500 mb-4">Aucune offre d'emploi trouvée.</p>
                  <Link
                    href="/job-postings/new"
                    className="inline-flex items-center px-4 py-2 bg-primary-600 text-black rounded-md hover:bg-primary-700"
                  >
                    <PlusCircle className="h-5 w-5 mr-2" />
                    Créer une offre
                  </Link>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Titre
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Statut
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Lieu
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Candidatures
                        </th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredJobPostings.map((job) => (
                        <tr key={job.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{job.title}</div>
                            <div className="text-sm text-gray-500">{job.organization_name}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(job.status)}`}>
                              {translateStatus(job.status)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {job.location || 'Non spécifié'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {job.status === 'draft' ? (
                              <span>Créée le {formatDate(job.created_at)}</span>
                            ) : job.status === 'published' ? (
                              <span>Publiée le {formatDate(job.published_at)}</span>
                            ) : (
                              <span>Fermée le {formatDate(job.closes_at)}</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {job.application_count}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end space-x-2">
                              <Link
                                href={`/job-postings/${job.id}`}
                                className="text-blue-600 hover:text-blue-800"
                                title="Voir les détails"
                              >
                                <Eye className="h-5 w-5" />
                              </Link>
                              
                              {job.status === 'draft' && (
                                <>
                                  <Link
                                    href={`/job-postings/${job.id}/edit`}
                                    className="text-gray-600 hover:text-gray-800"
                                    title="Modifier"
                                  >
                                    <Edit className="h-5 w-5" />
                                  </Link>
                                  <button
                                    onClick={() => handleStatusChange(job.id, 'published')}
                                    className="text-green-600 hover:text-green-800"
                                    title="Publier"
                                  >
                                    <CheckCircle className="h-5 w-5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteJob(job.id)}
                                    className="text-red-600 hover:text-red-800"
                                    title="Supprimer"
                                  >
                                    <Trash className="h-5 w-5" />
                                  </button>
                                </>
                              )}
                              
                              {job.status === 'published' && (
                                <button
                                  onClick={() => handleStatusChange(job.id, 'closed')}
                                  className="text-red-600 hover:text-red-800"
                                  title="Fermer l'offre"
                                >
                                  <XCircle className="h-5 w-5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Pagination */}
            {!loading && filteredJobPostings.length > 0 && (
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Affichage de <span className="font-medium">{pagination.offset + 1}</span> à{' '}
                  <span className="font-medium">
                    {Math.min(pagination.offset + pagination.limit, pagination.total)}
                  </span>{' '}
                  sur <span className="font-medium">{pagination.total}</span> résultats
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