// frontend/pages/jobs/[id]/index.tsx
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { ArrowLeft, Edit, Trash, CheckCircle, XCircle, Clock, MapPin, Building, Briefcase, Users, Share } from 'lucide-react';
import axios from 'axios';
import { JobService } from '@/services/jobs-service';
import { JobPosting } from '@/types/jobs';


export default function JobPostingDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  
  const [jobPosting, setJobPosting] = useState<JobPosting | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  // Charger les détails de l'offre
  useEffect(() => {
    if (!id) return;
  
    const fetchJobPosting = async () => {
      try {
        setLoading(true);
        const data = await JobService.getJobPosting(id as string);
        setJobPosting(data);
        setError(null);
      } catch (err) {
        console.error('Erreur lors de la récupération de l\'offre:', err);
        setError('Impossible de charger les détails de l\'offre.');
      } finally {
        setLoading(false);
      }
    };
  
    fetchJobPosting();
  }, [id]);

  // Gérer les actions sur l'offre (publier, fermer, supprimer)
  const handlePublish = async () => {
    if (!jobPosting || actionLoading) return;
    
    
  try {
    setActionLoading(true);
    const updatedJob = await JobService.publishJobPosting(jobPosting.id);
    setJobPosting(updatedJob);
    } catch (err) {
      console.error('Erreur lors de la publication:', err);
      setError('Impossible de publier l\'offre. Veuillez réessayer.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleClose = async () => {
    if (!jobPosting || actionLoading) return;
    
  try {
    setActionLoading(true);
    const updatedJob = await JobService.closeJobPosting(jobPosting.id);
    setJobPosting(updatedJob);
    } catch (err) {
      console.error('Erreur lors de la fermeture:', err);
      setError('Impossible de fermer l\'offre. Veuillez réessayer.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!jobPosting || actionLoading) return;
    
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette offre d\'emploi ? Cette action est irréversible.')) {
      return;
    }
    
    
  try {
    setActionLoading(true);
     await JobService.deleteJobPosting(jobPosting.id);
      
      // Rediriger vers la liste des offres
      router.push({
        pathname: '/jobs',
        query: { success: 'deleted' }
      });
    } catch (err) {
      console.error('Erreur lors de la suppression:', err);
      setError('Impossible de supprimer l\'offre. Veuillez réessayer.');
      setActionLoading(false);
    }
  };

  // Helper pour formater les dates
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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

  // Helper pour traduire le type d'emploi
  const translateEmploymentType = (type: string | null) => {
    if (!type) return 'Non spécifié';
    
    const types: {[key: string]: string} = {
      'full-time': 'Temps plein',
      'part-time': 'Temps partiel',
      'contract': 'Contrat',
      'internship': 'Stage',
      'temporary': 'Temporaire'
    };
    
    return types[type] || type;
  };

  // Helper pour traduire la politique de télétravail
  const translateRemotePolicy = (policy: string | null) => {
    if (!policy) return 'Non spécifié';
    
    const policies: {[key: string]: string} = {
      'remote': 'Télétravail',
      'hybrid': 'Hybride',
      'on-site': 'Sur site'
    };
    
    return policies[policy] || policy;
  };

  return (
    <>
      <Head>
        <title>
          {loading
            ? 'Chargement...'
            : jobPosting
            ? `${jobPosting.title} - Détails de l'offre`
            : 'Offre d\'emploi non trouvée'}
        </title>
        <meta
          name="description"
          content={jobPosting ? `Détails de l'offre d'emploi: ${jobPosting.title}` : 'Détails de l\'offre d\'emploi'}
        />
      </Head>

      <div className="bg-gray-50 py-8 md:py-12 min-h-screen">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Bouton de retour */}
            <div className="mb-6">
              <Link href="/jobs" className="inline-flex items-center text-gray-600 hover:text-gray-800">
                <ArrowLeft className="h-5 w-5 mr-2" />
                Retour aux offres
              </Link>
            </div>

            {/* Message d'erreur */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
                {error}
              </div>
            )}

            {loading ? (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mb-4"></div>
                <p className="text-gray-500">Chargement des détails de l'offre...</p>
              </div>
            ) : !jobPosting ? (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <p className="text-gray-500 mb-4">Offre d'emploi non trouvée.</p>
                <Link
                  href="/jobs"
                  className="inline-flex items-center px-4 py-2 bg-primary-600 text-black rounded-md hover:bg-primary-700"
                >
                  Retour aux offres
                </Link>
              </div>
            ) : (
              <>
                {/* En-tête */}
                <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
                  <div className="p-6 sm:p-8">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">{jobPosting.title}</h1>
                        <div className="flex flex-wrap items-center gap-3 text-gray-600 mb-4">
                          {jobPosting.organization_name && (
                            <div className="flex items-center text-sm">
                              <Building className="h-4 w-4 mr-1 text-gray-500" />
                              <span>{jobPosting.organization_name}</span>
                            </div>
                          )}
                          
                          {jobPosting.location && (
                            <div className="flex items-center text-sm">
                              <MapPin className="h-4 w-4 mr-1 text-gray-500" />
                              <span>{jobPosting.location}</span>
                            </div>
                          )}
                          
                          {jobPosting.employment_type && (
                            <div className="flex items-center text-sm">
                              <Briefcase className="h-4 w-4 mr-1 text-gray-500" />
                              <span>{translateEmploymentType(jobPosting.employment_type)}</span>
                            </div>
                          )}
                          
                          {jobPosting.remote_policy && (
                            <div className="flex items-center text-sm">
                              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                                {translateRemotePolicy(jobPosting.remote_policy)}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        {/* Statut et dates */}
                        <div className="flex flex-wrap gap-3 mb-2">
                          <span className={`px-3 py-1 inline-flex items-center rounded-full text-sm font-medium ${getStatusBadgeClass(jobPosting.status)}`}>
                            {translateStatus(jobPosting.status)}
                          </span>
                          
                          {jobPosting.application_count > 0 && (
                            <div className="flex items-center text-sm px-3 py-1 bg-purple-100 text-purple-800 rounded-full">
                              <Users className="h-4 w-4 mr-1" />
                              <span>{jobPosting.application_count} candidatures</span>
                            </div>
                          )}
                          
                          {jobPosting.is_featured && (
                            <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm font-medium">
                              Mise en avant
                            </span>
                          )}
                        </div>
                        
                        <div className="text-sm text-gray-500 mt-2">
                          {jobPosting.status === 'draft' && (
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 mr-1" />
                              <span>Créée le {formatDate(jobPosting.created_at)}</span>
                            </div>
                          )}
                          
                          {jobPosting.status === 'published' && (
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 mr-1" />
                              <span>Publiée le {formatDate(jobPosting.published_at)}</span>
                              {jobPosting.closes_at && (
                                <span className="ml-2">• Fermeture le {formatDate(jobPosting.closes_at)}</span>
                              )}
                            </div>
                          )}
                          
                          {jobPosting.status === 'closed' && (
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 mr-1" />
                              <span>Fermée le {formatDate(jobPosting.closes_at)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex flex-col sm:flex-row gap-2">
                        {jobPosting.status === 'draft' && (
                          <>
                            <Link
                              href={`/jobs/${jobPosting.id}/edit`}
                              className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              <span className="text-sm">Modifier</span>
                            </Link>
                            <button
                              onClick={handlePublish}
                              disabled={actionLoading}
                              className="inline-flex items-center px-3 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              <span className="text-sm">Publier</span>
                            </button>
                            <button
                              onClick={handleDelete}
                              disabled={actionLoading}
                              className="inline-flex items-center px-3 py-1.5 border border-red-300 text-red-700 rounded-md hover:bg-red-50"
                            >
                              <Trash className="h-4 w-4 mr-1" />
                              <span className="text-sm">Supprimer</span>
                            </button>
                          </>
                        )}
                        
                        {jobPosting.status === 'published' && (
                          <>
                            <button
                              onClick={() => {
                                // Copier le lien de l'offre
                                const url = `${window.location.origin}/careers/jobs/${jobPosting.id}`;
                                navigator.clipboard.writeText(url);
                                alert('Lien de l\'offre copié dans le presse-papiers!');
                              }}
                              className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                            >
                              <Share className="h-4 w-4 mr-1" />
                              <span className="text-sm">Copier le lien</span>
                            </button>
                            <button
                              onClick={handleClose}
                              disabled={actionLoading}
                              className="inline-flex items-center px-3 py-1.5 border border-red-300 text-red-700 rounded-md hover:bg-red-50"
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              <span className="text-sm">Fermer</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                    
                    {/* Salaire */}
                    {(jobPosting.salary_range_min || jobPosting.salary_range_max) && (
                      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                        <h3 className="text-sm font-medium text-gray-700 mb-2">Salaire proposé</h3>
                        <p className="text-lg font-semibold text-gray-900">
                          {jobPosting.salary_range_min && jobPosting.salary_range_max
                            ? `${jobPosting.salary_range_min.toLocaleString()} - ${jobPosting.salary_range_max.toLocaleString()} ${jobPosting.salary_currency}`
                            : jobPosting.salary_range_min
                            ? `À partir de ${jobPosting.salary_range_min.toLocaleString()} ${jobPosting.salary_currency}`
                            : `Jusqu'à ${jobPosting.salary_range_max?.toLocaleString()} ${jobPosting.salary_currency}`}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Contenu principal */}
                <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
                  <div className="p-6 sm:p-8">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Description</h2>
                    <div className="prose max-w-none text-gray-700 mb-8">
                      {jobPosting.description.split('\n').map((paragraph, index) => (
                        <p key={index} className="mb-4">{paragraph}</p>
                      ))}
                    </div>
                    
                    {jobPosting.responsibilities && (
                      <div className="mb-8">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">Responsabilités</h2>
                        <div className="prose max-w-none text-gray-700">
                          {jobPosting.responsibilities.split('\n').map((paragraph, index) => (
                            <p key={index} className="mb-4">{paragraph}</p>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {jobPosting.requirements && (
                      <div>
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">Prérequis et qualifications</h2>
                        <div className="prose max-w-none text-gray-700">
                          {jobPosting.requirements.split('\n').map((paragraph, index) => (
                            <p key={index} className="mb-4">{paragraph}</p>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Actions */}
                <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
                  <div className="px-6 py-4 sm:px-8 sm:py-6">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Actions</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {jobPosting.status === 'published' && (
                        <Link
                          href={`/jobs/${jobPosting.id}/applications`}
                          className="inline-flex items-center justify-center px-4 py-2 bg-primary-600 text-black rounded-md hover:bg-primary-700 w-full"
                        >
                          <Users className="h-5 w-5 mr-2" />
                          Voir les candidatures ({jobPosting.application_count})
                        </Link>
                      )}
                      
                      {jobPosting.status === 'draft' && (
                        <button
                          onClick={handlePublish}
                          disabled={actionLoading}
                          className="inline-flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 w-full"
                        >
                          <CheckCircle className="h-5 w-5 mr-2" />
                          Publier l'offre
                        </button>
                      )}
                      
                      {jobPosting.status === 'published' && (
                        <button
                          onClick={handleClose}
                          disabled={actionLoading}
                          className="inline-flex items-center justify-center px-4 py-2 border border-red-300 text-red-700 rounded-md hover:bg-red-50 w-full"
                        >
                          <XCircle className="h-5 w-5 mr-2" />
                          Fermer l'offre
                        </button>
                      )}
                      
                      {jobPosting.status === 'draft' && (
                        <>
                          <Link
                            href={`/jobs/${jobPosting.id}/edit`}
                            className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 w-full"
                          >
                            <Edit className="h-5 w-5 mr-2" />
                            Modifier
                          </Link>
                          <button
                            onClick={handleDelete}
                            disabled={actionLoading}
                            className="inline-flex items-center justify-center px-4 py-2 border border-red-300 text-red-700 rounded-md hover:bg-red-50 w-full"
                          >
                            <Trash className="h-5 w-5 mr-2" />
                            Supprimer
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Métadonnées */}
                <div className="text-center text-sm text-gray-500 mt-8">
                  <p>
                    Dernière mise à jour le {formatDate(jobPosting.updated_at)} par {jobPosting.creator_name || 'Un utilisateur'}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}